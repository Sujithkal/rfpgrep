/**
 * Frontend Input Sanitization Utilities
 * Prevents XSS and ensures safe input handling
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes
 * 
 * @param {string} input - Raw HTML/text input
 * @returns {string} Sanitized text
 */
export function sanitizeHTML(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.textContent = input; // Use textContent to encode HTML entities
    return temp.innerHTML;
}

/**
 * Sanitize user input for display
 * - Removes HTML tags
 * - Trims whitespace
 * - Limits length
 * 
 * @param {string} input - Raw input
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, maxLength = 5000) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove null bytes
        .replace(/\0/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Limit length
        .substring(0, maxLength)
        .trim();
}

/**
 * Sanitize search queries
 * - Removes special regex characters
 * - Limits length
 * 
 * @param {string} query - Search query
 * @returns {string} Sanitized query
 */
export function sanitizeSearchQuery(query) {
    if (!query || typeof query !== 'string') {
        return '';
    }

    return query
        // Remove regex special characters
        .replace(/[\\^$.*+?()[\]{}|]/g, '')
        // Remove HTML
        .replace(/<[^>]*>/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Limit length
        .substring(0, 200)
        .trim();
}

/**
 * Escape HTML entities for safe display
 * 
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHTML(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };

    return text.replace(/[&<>"'/]/g, char => escapeMap[char]);
}

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 */
export function isValidURL(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Truncate text safely
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add if truncated
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100, suffix = '...') {
    if (!text || typeof text !== 'string') {
        return '';
    }

    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength - suffix.length).trim() + suffix;
}

/**
 * Validate file type for uploads
 * 
 * @param {File} file - File to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {{valid: boolean, error: string | null}}
 */
export function validateFileType(file, allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msword'
]) {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Allowed: PDF, Word, Excel'
        };
    }

    return { valid: true, error: null };
}

/**
 * Validate file size
 * 
 * @param {File} file - File to validate
 * @param {number} maxSizeBytes - Maximum file size in bytes
 * @returns {{valid: boolean, error: string | null}}
 */
export function validateFileSize(file, maxSizeBytes = 50 * 1024 * 1024) {
    if (!file) {
        return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxSizeBytes) {
        const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxSizeMB}MB`
        };
    }

    return { valid: true, error: null };
}

export default {
    sanitizeHTML,
    sanitizeInput,
    sanitizeSearchQuery,
    escapeHTML,
    isValidEmail,
    isValidURL,
    truncateText,
    validateFileType,
    validateFileSize
};
