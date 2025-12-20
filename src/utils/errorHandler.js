/**
 * Centralized Error Handler
 * - Shows user-friendly messages
 * - Logs details only in development
 * - Prevents sensitive information leakage
 */

const isDevelopment = import.meta.env.DEV;

/**
 * User-friendly error messages for common errors
 */
const ERROR_MESSAGES = {
    // Firebase Auth errors
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Sign-in cancelled.',

    // Firestore errors
    'permission-denied': 'You don\'t have permission to perform this action.',
    'not-found': 'The requested resource was not found.',
    'already-exists': 'This item already exists.',
    'resource-exhausted': 'Rate limit exceeded. Please try again in a moment.',

    // Cloud Functions errors
    'unauthenticated': 'Please sign in to continue.',
    'invalid-argument': 'Invalid input. Please check your data.',
    'failed-precondition': 'Operation cannot be completed right now.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
    'internal': 'Something went wrong. Please try again.',

    // Network errors
    'NETWORK_ERROR': 'Network error. Check your internet connection.',
    'TIMEOUT': 'Request timed out. Please try again.',
};

/**
 * Get user-friendly error message
 * 
 * @param {Error | string} error - The error object or code
 * @returns {string} User-friendly message
 */
export function getErrorMessage(error) {
    if (!error) {
        return 'An unexpected error occurred.';
    }

    // Handle string errors
    if (typeof error === 'string') {
        return ERROR_MESSAGES[error] || error;
    }

    // Handle Firebase errors
    if (error.code) {
        return ERROR_MESSAGES[error.code] || error.message || 'An error occurred.';
    }

    // Handle regular errors
    if (error.message) {
        // Check if message contains a known error code
        for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
            if (error.message.includes(code)) {
                return message;
            }
        }

        // In production, don't show raw error messages that might contain sensitive info
        if (!isDevelopment && error.message.length > 100) {
            return 'An error occurred. Please try again.';
        }

        return error.message;
    }

    return 'An unexpected error occurred.';
}

/**
 * Log error with appropriate detail level
 * - Full details in development
 * - Limited info in production
 * 
 * @param {string} context - Where the error occurred
 * @param {Error} error - The error object
 * @param {Object} metadata - Additional context
 */
export function logError(context, error, metadata = {}) {
    if (isDevelopment) {
        console.error(`[${context}]`, error, metadata);
    } else {
        // In production, log minimal info
        console.error(`[${context}]`, {
            message: error?.message || 'Unknown error',
            code: error?.code,
            ...metadata
        });
    }
}

/**
 * Handle API errors gracefully
 * 
 * @param {Error} error - The error object
 * @param {Function} setError - State setter for error message
 * @param {string} context - Context for logging
 */
export function handleAPIError(error, setError, context = 'API') {
    logError(context, error);

    const message = getErrorMessage(error);

    if (setError) {
        setError(message);
    }

    return message;
}

/**
 * Create a safe error response for display
 * Strips sensitive information
 * 
 * @param {Error} error - Original error
 * @returns {Object} Safe error object
 */
export function createSafeError(error) {
    return {
        message: getErrorMessage(error),
        code: error?.code || 'unknown',
        timestamp: new Date().toISOString()
    };
}

/**
 * Wrap async functions with error handling
 * 
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for logging
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, context = 'Operation') {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            logError(context, error);
            throw createSafeError(error);
        }
    };
}

export default {
    getErrorMessage,
    logError,
    handleAPIError,
    createSafeError,
    withErrorHandling
};
