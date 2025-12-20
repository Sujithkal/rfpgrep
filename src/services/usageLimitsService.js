/**
 * Usage Limits Service - Server-side enforcement
 * Enforces plan limits for projects, AI generations, and exports
 */

import { db } from './firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

// Plan limits configuration
export const PLAN_LIMITS = {
    free: {
        projects: 3,
        aiGenerationsPerMonth: 50,
        exportsPerMonth: 10,
        teamMembers: 1,
        storageGB: 1
    },
    starter: {
        projects: 10,
        aiGenerationsPerMonth: 500,
        exportsPerMonth: 50,
        teamMembers: 3,
        storageGB: 5
    },
    professional: {
        projects: 50,
        aiGenerationsPerMonth: 2000,
        exportsPerMonth: 200,
        teamMembers: 10,
        storageGB: 25
    },
    enterprise: {
        projects: -1, // Unlimited
        aiGenerationsPerMonth: -1, // Unlimited
        exportsPerMonth: -1, // Unlimited
        teamMembers: -1, // Unlimited
        storageGB: 50
    }
};

/**
 * Get current month key for usage tracking
 */
const getCurrentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Get user's current usage stats
 */
export const getUserUsage = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            return { success: false, error: 'User not found' };
        }

        const userData = userDoc.data();
        const monthKey = getCurrentMonthKey();
        const usage = userData.usage?.[monthKey] || {
            aiGenerations: 0,
            exports: 0
        };

        // Count projects
        const { collection, getDocs } = await import('firebase/firestore');
        const projectsSnapshot = await getDocs(collection(db, `users/${userId}/projects`));
        const projectCount = projectsSnapshot.size;

        return {
            success: true,
            usage: {
                ...usage,
                projects: projectCount,
                monthKey
            },
            plan: userData.plan || 'free'
        };
    } catch (error) {
        console.error('Error getting user usage:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get limits for a plan
 */
export const getPlanLimits = (plan) => {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

/**
 * Check if user can create a project
 */
export const canCreateProject = async (userId) => {
    try {
        const usageResult = await getUserUsage(userId);
        if (!usageResult.success) return usageResult;

        const limits = getPlanLimits(usageResult.plan);

        // -1 means unlimited
        if (limits.projects === -1) {
            return { allowed: true };
        }

        if (usageResult.usage.projects >= limits.projects) {
            return {
                allowed: false,
                error: `Plan limit reached: Maximum ${limits.projects} projects allowed on your ${usageResult.plan} plan.`,
                current: usageResult.usage.projects,
                limit: limits.projects,
                upgradeRequired: true
            };
        }

        return { allowed: true };
    } catch (error) {
        console.error('Error checking project limit:', error);
        return { allowed: false, error: error.message };
    }
};

/**
 * Check if user can generate AI response
 */
export const canGenerateAI = async (userId) => {
    try {
        const usageResult = await getUserUsage(userId);
        if (!usageResult.success) return usageResult;

        const limits = getPlanLimits(usageResult.plan);

        if (limits.aiGenerationsPerMonth === -1) {
            return { allowed: true };
        }

        const currentGenerations = usageResult.usage.aiGenerations || 0;

        if (currentGenerations >= limits.aiGenerationsPerMonth) {
            return {
                allowed: false,
                error: `AI generation limit reached: ${currentGenerations}/${limits.aiGenerationsPerMonth} this month.`,
                current: currentGenerations,
                limit: limits.aiGenerationsPerMonth,
                upgradeRequired: true
            };
        }

        // Warning at 80%
        const warningThreshold = Math.floor(limits.aiGenerationsPerMonth * 0.8);
        const isNearLimit = currentGenerations >= warningThreshold;

        return {
            allowed: true,
            isNearLimit,
            current: currentGenerations,
            limit: limits.aiGenerationsPerMonth,
            remaining: limits.aiGenerationsPerMonth - currentGenerations
        };
    } catch (error) {
        console.error('Error checking AI limit:', error);
        return { allowed: false, error: error.message };
    }
};

/**
 * Check if user can export
 */
export const canExport = async (userId) => {
    try {
        const usageResult = await getUserUsage(userId);
        if (!usageResult.success) return usageResult;

        const limits = getPlanLimits(usageResult.plan);

        if (limits.exportsPerMonth === -1) {
            return { allowed: true };
        }

        const currentExports = usageResult.usage.exports || 0;

        if (currentExports >= limits.exportsPerMonth) {
            return {
                allowed: false,
                error: `Export limit reached: ${currentExports}/${limits.exportsPerMonth} this month.`,
                current: currentExports,
                limit: limits.exportsPerMonth,
                upgradeRequired: true
            };
        }

        return {
            allowed: true,
            current: currentExports,
            limit: limits.exportsPerMonth,
            remaining: limits.exportsPerMonth - currentExports
        };
    } catch (error) {
        console.error('Error checking export limit:', error);
        return { allowed: false, error: error.message };
    }
};

/**
 * Increment AI generation usage
 */
export const recordAIGeneration = async (userId) => {
    try {
        const monthKey = getCurrentMonthKey();
        const userRef = doc(db, 'users', userId);

        await updateDoc(userRef, {
            [`usage.${monthKey}.aiGenerations`]: increment(1),
            [`usage.${monthKey}.lastUpdated`]: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error recording AI generation:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Increment export usage
 */
export const recordExport = async (userId) => {
    try {
        const monthKey = getCurrentMonthKey();
        const userRef = doc(db, 'users', userId);

        await updateDoc(userRef, {
            [`usage.${monthKey}.exports`]: increment(1),
            [`usage.${monthKey}.lastUpdated`]: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error recording export:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get usage summary for dashboard display
 */
export const getUsageSummary = async (userId) => {
    try {
        const usageResult = await getUserUsage(userId);
        if (!usageResult.success) return usageResult;

        const limits = getPlanLimits(usageResult.plan);
        const usage = usageResult.usage;

        const formatLimit = (current, limit) => {
            if (limit === -1) return { current, limit: 'Unlimited', percent: 0 };
            return {
                current,
                limit,
                percent: Math.round((current / limit) * 100),
                isNearLimit: current >= limit * 0.8,
                isAtLimit: current >= limit
            };
        };

        return {
            success: true,
            plan: usageResult.plan,
            projects: formatLimit(usage.projects, limits.projects),
            aiGenerations: formatLimit(usage.aiGenerations || 0, limits.aiGenerationsPerMonth),
            exports: formatLimit(usage.exports || 0, limits.exportsPerMonth),
            teamMembers: formatLimit(0, limits.teamMembers), // TODO: Count actual members
            monthKey: usage.monthKey
        };
    } catch (error) {
        console.error('Error getting usage summary:', error);
        return { success: false, error: error.message };
    }
};

export default {
    PLAN_LIMITS,
    getUserUsage,
    getPlanLimits,
    canCreateProject,
    canGenerateAI,
    canExport,
    recordAIGeneration,
    recordExport,
    getUsageSummary
};
