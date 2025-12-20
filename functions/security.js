/**
 * Security Utilities for Cloud Functions
 * Rate limiting, prompt injection protection, and input sanitization
 */

const admin = require('firebase-admin');

// ============================================
// RATE LIMITING
// ============================================

/**
 * Rate limiter configuration
 * 20 requests per minute per user with 5-request burst allowance
 */
const RATE_LIMIT_CONFIG = {
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: 20, // 20 requests per minute
    burstAllowance: 5, // Allow 5 extra requests in burst
};

/**
 * Check if user is rate limited for AI operations
 * Uses Firestore to track request counts
 * 
 * @param {string} userId - The user's UID
 * @param {string} endpoint - The endpoint being accessed (for logging)
 * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
 */
async function checkRateLimit(userId, endpoint = 'ai') {
    const db = admin.firestore();
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

    const rateLimitRef = db.collection('rateLimits').doc(userId);

    try {
        const result = await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(rateLimitRef);

            let data = doc.exists ? doc.data() : { requests: [], lastReset: now };

            // Filter out requests outside the current window
            const recentRequests = (data.requests || []).filter(ts => ts > windowStart);

            const maxAllowed = RATE_LIMIT_CONFIG.maxRequests + RATE_LIMIT_CONFIG.burstAllowance;
            const remaining = maxAllowed - recentRequests.length;
            const allowed = remaining > 0;

            if (allowed) {
                // Add this request
                recentRequests.push(now);
                transaction.set(rateLimitRef, {
                    requests: recentRequests,
                    lastReset: now,
                    lastEndpoint: endpoint
                });
            }

            // Calculate reset time
            const oldestRequest = recentRequests[0] || now;
            const resetIn = Math.max(0, oldestRequest + RATE_LIMIT_CONFIG.windowMs - now);

            return { allowed, remaining: Math.max(0, remaining - 1), resetIn };
        });

        if (!result.allowed) {
            console.warn(`[RATE_LIMIT] User ${userId} exceeded limit on ${endpoint}`);
        }

        return result;
    } catch (error) {
        console.error('[RATE_LIMIT] Error checking rate limit:', error);
        // Fail open - allow request if rate limit check fails
        return { allowed: true, remaining: RATE_LIMIT_CONFIG.maxRequests, resetIn: 0 };
    }
}

/**
 * Consume multiple rate limit slots (for batch operations)
 * 
 * @param {string} userId - The user's UID
 * @param {number} count - Number of slots to consume
 * @returns {Promise<{allowed: boolean, allowedCount: number}>}
 */
async function consumeRateLimitBatch(userId, count) {
    const db = admin.firestore();
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_CONFIG.windowMs;

    const rateLimitRef = db.collection('rateLimits').doc(userId);

    try {
        const result = await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(rateLimitRef);

            let data = doc.exists ? doc.data() : { requests: [], lastReset: now };

            // Filter out requests outside the current window
            const recentRequests = (data.requests || []).filter(ts => ts > windowStart);

            const maxAllowed = RATE_LIMIT_CONFIG.maxRequests + RATE_LIMIT_CONFIG.burstAllowance;
            const available = maxAllowed - recentRequests.length;

            // Allow as many as possible up to requested count
            const allowedCount = Math.min(count, available);

            if (allowedCount > 0) {
                // Add timestamps for allowed requests
                for (let i = 0; i < allowedCount; i++) {
                    recentRequests.push(now + i); // Slight offset to maintain order
                }
                transaction.set(rateLimitRef, {
                    requests: recentRequests,
                    lastReset: now,
                    lastEndpoint: 'batch'
                });
            }

            return {
                allowed: allowedCount > 0,
                allowedCount,
                remaining: Math.max(0, available - allowedCount)
            };
        });

        if (result.allowedCount < count) {
            console.warn(`[RATE_LIMIT] User ${userId} batch limited: ${result.allowedCount}/${count} allowed`);
        }

        return result;
    } catch (error) {
        console.error('[RATE_LIMIT] Error in batch rate limit:', error);
        // Fail open with limited count
        return { allowed: true, allowedCount: Math.min(count, 5) };
    }
}

// ============================================
// PROMPT INJECTION PROTECTION
// ============================================

/**
 * Dangerous patterns that could indicate prompt injection
 */
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
    /disregard\s+(all\s+)?(previous|above|prior)/i,
    /forget\s+(everything|all|your)\s+(instructions?|training|prompts?)/i,
    /you\s+are\s+now\s+(a|an|the)\s+/i, // Role hijacking
    /act\s+as\s+(if|though)?\s*(you\s+are|an?)\s+/i,
    /pretend\s+(you\s+are|to\s+be)/i,
    /system\s*:\s*/i, // Trying to inject system prompts
    /\[\s*SYSTEM\s*\]/i,
    /\<\s*system\s*\>/i,
    /reveal\s+(your|the)\s+(system\s+)?prompt/i,
    /show\s+(me\s+)?(your|the)\s+(system\s+)?instructions?/i,
    /what\s+(are\s+)?(your|the)\s+(original\s+)?instructions?/i,
    /output\s+(your|the)\s+(initial\s+)?prompt/i,
    /jailbreak/i,
    /DAN\s*mode/i,
    /developer\s*mode/i,
];

/**
 * Check if input contains potential prompt injection
 * 
 * @param {string} input - User input to check
 * @returns {{safe: boolean, reason: string | null}}
 */
function checkPromptInjection(input) {
    if (!input || typeof input !== 'string') {
        return { safe: true, reason: null };
    }

    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(input)) {
            console.warn('[SECURITY] Potential prompt injection detected:', input.substring(0, 100));
            return {
                safe: false,
                reason: 'Input contains potentially harmful instructions'
            };
        }
    }

    return { safe: true, reason: null };
}

/**
 * Sanitize user input for safe inclusion in prompts
 * 
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length (default 10000)
 * @returns {string} Sanitized input
 */
function sanitizeForPrompt(input, maxLength = 10000) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let sanitized = input
        // Limit length
        .substring(0, maxLength)
        // Remove null bytes
        .replace(/\0/g, '')
        // Normalize whitespace
        .replace(/[\r\n]+/g, '\n')
        // Remove control characters (except newline, tab)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Escape markdown-like patterns that could confuse the AI
        .replace(/^#+\s/gm, '# ')
        // Limit consecutive newlines
        .replace(/\n{4,}/g, '\n\n\n');

    return sanitized.trim();
}

/**
 * Wrap user content with clear delimiters
 * This helps the AI distinguish user content from instructions
 * 
 * @param {string} content - User content
 * @param {string} label - Label for the content (e.g., "Question", "Document")
 * @returns {string} Wrapped content
 */
function wrapUserContent(content, label = 'User Input') {
    const sanitized = sanitizeForPrompt(content);
    return `\n--- BEGIN ${label.toUpperCase()} ---\n${sanitized}\n--- END ${label.toUpperCase()} ---\n`;
}

// ============================================
// INPUT VALIDATION
// ============================================

/**
 * Validate and sanitize general user input
 * 
 * @param {string} input - Input to validate
 * @param {Object} options - Validation options
 * @returns {{valid: boolean, sanitized: string, error: string | null}}
 */
function validateInput(input, options = {}) {
    const {
        maxLength = 5000,
        minLength = 0,
        required = false,
        allowHtml = false,
    } = options;

    if (!input && required) {
        return { valid: false, sanitized: '', error: 'This field is required' };
    }

    if (!input) {
        return { valid: true, sanitized: '', error: null };
    }

    if (typeof input !== 'string') {
        return { valid: false, sanitized: '', error: 'Invalid input type' };
    }

    let sanitized = input;

    // Strip HTML if not allowed
    if (!allowHtml) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Check length
    if (sanitized.length < minLength) {
        return { valid: false, sanitized, error: `Minimum length is ${minLength} characters` };
    }

    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return { valid: true, sanitized: sanitized.trim(), error: null };
}

// ============================================
// SECURITY LOGGING
// ============================================

/**
 * Log security-relevant events
 * 
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details
 */
async function logSecurityEvent(eventType, details) {
    const db = admin.firestore();

    try {
        await db.collection('securityLogs').add({
            eventType,
            ...details,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            environment: process.env.NODE_ENV || 'production'
        });
    } catch (error) {
        // Don't fail the request if logging fails
        console.error('[SECURITY_LOG] Failed to log event:', error);
    }
}

module.exports = {
    // Rate limiting
    checkRateLimit,
    consumeRateLimitBatch,
    RATE_LIMIT_CONFIG,

    // Prompt injection
    checkPromptInjection,
    sanitizeForPrompt,
    wrapUserContent,

    // Input validation
    validateInput,

    // Logging
    logSecurityEvent
};
