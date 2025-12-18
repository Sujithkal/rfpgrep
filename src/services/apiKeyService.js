// API Key Management Service
// Allows users to generate and manage API keys for REST API access

import { db } from './firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

/**
 * Generate a new API key for the user
 */
export const generateApiKey = async (userId, keyName = 'Default Key') => {
    // Generate a random API key
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    const apiKey = 'rfp_' + Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

    const keyData = {
        id: `key_${Date.now()}`,
        key: apiKey,
        name: keyName,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        callCount: 0,
        isActive: true
    };

    try {
        await updateDoc(doc(db, 'users', userId), {
            apiKeys: arrayUnion(keyData)
        });

        return { success: true, key: keyData };
    } catch (error) {
        console.error('Error generating API key:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all API keys for a user
 */
export const getApiKeys = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return { success: true, keys: userDoc.data().apiKeys || [] };
        }
        return { success: true, keys: [] };
    } catch (error) {
        console.error('Error getting API keys:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Revoke an API key
 */
export const revokeApiKey = async (userId, keyId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const keys = userDoc.data().apiKeys || [];
            const keyToRemove = keys.find(k => k.id === keyId);

            if (keyToRemove) {
                await updateDoc(doc(db, 'users', userId), {
                    apiKeys: arrayRemove(keyToRemove)
                });
                return { success: true };
            }
        }
        return { success: false, error: 'Key not found' };
    } catch (error) {
        console.error('Error revoking API key:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Validate API key (for backend use)
 */
export const validateApiKey = async (apiKey) => {
    // This would be called on the backend (Cloud Functions)
    // For now, return the structure
    return {
        isValid: false,
        userId: null,
        rateLimit: {
            remaining: 0,
            resetAt: null
        }
    };
};

// Rate limiting config
export const RATE_LIMITS = {
    free: {
        requestsPerMinute: 10,
        requestsPerDay: 100
    },
    professional: {
        requestsPerMinute: 60,
        requestsPerDay: 1000
    },
    enterprise: {
        requestsPerMinute: 300,
        requestsPerDay: 10000
    }
};
