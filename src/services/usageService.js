// Usage Service - Track and enforce plan limits
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { PLANS } from './paymentService';

/**
 * Get current usage stats for a user
 */
export const getUsageStats = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { projects: 0, aiResponses: 0, storage: 0 };
        }

        const data = userSnap.data();
        const usage = data.usage || {};

        return {
            projects: usage.projectsThisMonth || 0,
            aiResponses: usage.aiResponsesThisMonth || 0,
            storage: usage.storageUsed || 0,
            lastReset: usage.lastReset?.toDate?.() || null
        };
    } catch (error) {
        console.error('Error getting usage stats:', error);
        return { projects: 0, aiResponses: 0, storage: 0 };
    }
};

/**
 * Check if user can perform an action based on their plan limits
 * Returns { allowed: true/false, reason: string, limit: number, used: number }
 */
export const checkLimit = async (userId, actionType, userData = null) => {
    try {
        // Get user data if not provided
        if (!userData) {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            userData = userSnap.exists() ? userSnap.data() : {};
        }

        const plan = userData.plan || 'free';
        const planLimits = PLANS[plan]?.limits || PLANS.free.limits;
        const usage = userData.usage || {};

        // Check if monthly reset is needed
        const now = new Date();
        const lastReset = usage.lastReset?.toDate?.() || new Date(0);
        const shouldReset = lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();

        if (shouldReset) {
            // Reset monthly counters
            await updateDoc(doc(db, 'users', userId), {
                'usage.projectsThisMonth': 0,
                'usage.aiResponsesThisMonth': 0,
                'usage.lastReset': now
            });
            usage.projectsThisMonth = 0;
            usage.aiResponsesThisMonth = 0;
        }

        // Check limits based on action type
        switch (actionType) {
            case 'createProject':
                const projectsUsed = usage.projectsThisMonth || 0;
                const projectsLimit = planLimits.projectsPerMonth;
                if (projectsLimit === -1) { // Unlimited
                    return { allowed: true, limit: -1, used: projectsUsed };
                }
                return {
                    allowed: projectsUsed < projectsLimit,
                    reason: `You've used ${projectsUsed} of ${projectsLimit} projects this month`,
                    limit: projectsLimit,
                    used: projectsUsed
                };

            case 'generateResponse':
                const responsesUsed = usage.aiResponsesThisMonth || 0;
                const responsesLimit = planLimits.aiResponsesPerMonth;
                if (responsesLimit === -1) { // Unlimited
                    return { allowed: true, limit: -1, used: responsesUsed };
                }
                return {
                    allowed: responsesUsed < responsesLimit,
                    reason: `You've used ${responsesUsed} of ${responsesLimit} AI responses this month`,
                    limit: responsesLimit,
                    used: responsesUsed
                };

            case 'uploadKnowledge':
                const storageUsed = usage.storageUsed || 0;
                const storageLimit = planLimits.knowledgeStorage;
                if (storageLimit === -1) { // Unlimited
                    return { allowed: true, limit: -1, used: storageUsed };
                }
                return {
                    allowed: storageUsed < storageLimit,
                    reason: `You've used ${formatBytes(storageUsed)} of ${formatBytes(storageLimit)} storage`,
                    limit: storageLimit,
                    used: storageUsed
                };

            default:
                return { allowed: true };
        }
    } catch (error) {
        console.error('Error checking limit:', error);
        return { allowed: true }; // Allow on error to not block users
    }
};

/**
 * Increment usage counter for an action
 */
export const incrementUsage = async (userId, actionType, amount = 1) => {
    try {
        const userRef = doc(db, 'users', userId);

        switch (actionType) {
            case 'project':
                await updateDoc(userRef, {
                    'usage.projectsThisMonth': increment(amount)
                });
                break;
            case 'aiResponse':
                await updateDoc(userRef, {
                    'usage.aiResponsesThisMonth': increment(amount)
                });
                break;
            case 'export':
                await updateDoc(userRef, {
                    'usage.exportsThisMonth': increment(amount)
                });
                break;
            case 'storage':
                await updateDoc(userRef, {
                    'usage.storageUsed': increment(amount)
                });
                break;
        }
        return true;
    } catch (error) {
        console.error('Error incrementing usage:', error);
        return false;
    }
};

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Get plan limits for display
 */
export const getPlanLimitsDisplay = (plan) => {
    const limits = PLANS[plan]?.limits || PLANS.free.limits;
    return {
        projects: limits.projectsPerMonth === -1 ? 'Unlimited' : `${limits.projectsPerMonth}/month`,
        aiResponses: limits.aiResponsesPerMonth === -1 ? 'Unlimited' : `${limits.aiResponsesPerMonth}/month`,
        storage: limits.knowledgeStorage === -1 ? 'Unlimited' : formatBytes(limits.knowledgeStorage)
    };
};
