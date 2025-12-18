/**
 * Access Control Service
 * Handles granular per-document and per-section permissions
 */

import { db } from './firebase';
import {
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Access levels
 */
export const ACCESS_LEVELS = {
    NONE: { id: 'none', name: 'No Access', level: 0 },
    VIEW: { id: 'view', name: 'View Only', level: 1 },
    COMMENT: { id: 'comment', name: 'Comment', level: 2 },
    EDIT: { id: 'edit', name: 'Edit', level: 3 },
    FULL: { id: 'full', name: 'Full Access', level: 4 }
};

/**
 * Check if user has minimum access level
 */
export const hasMinimumAccess = (userAccess, requiredAccess) => {
    const userLevel = ACCESS_LEVELS[userAccess?.toUpperCase()]?.level || 0;
    const requiredLevel = ACCESS_LEVELS[requiredAccess?.toUpperCase()]?.level || 0;
    return userLevel >= requiredLevel;
};

/**
 * Get user's access level for a document
 */
export const getDocumentAccess = (documentPermissions, userId, userRole) => {
    // Admin always has full access
    if (userRole === 'admin' || userRole === 'owner') {
        return ACCESS_LEVELS.FULL;
    }

    // Check direct user permission
    if (documentPermissions?.users?.[userId]) {
        return ACCESS_LEVELS[documentPermissions.users[userId].toUpperCase()] || ACCESS_LEVELS.VIEW;
    }

    // Check role-based permission
    if (documentPermissions?.roles?.[userRole]) {
        return ACCESS_LEVELS[documentPermissions.roles[userRole].toUpperCase()] || ACCESS_LEVELS.VIEW;
    }

    // Default access
    return ACCESS_LEVELS[documentPermissions?.default?.toUpperCase()] || ACCESS_LEVELS.NONE;
};

/**
 * Set user access for a document
 */
export const setUserAccess = async (ownerId, projectId, targetUserId, accessLevel) => {
    try {
        const projectRef = doc(db, `users/${ownerId}/projects`, projectId);
        await updateDoc(projectRef, {
            [`permissions.users.${targetUserId}`]: accessLevel,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error setting user access:', error);
        throw error;
    }
};

/**
 * Set section-level access
 */
export const setSectionAccess = async (ownerId, projectId, sectionIndex, targetUserId, accessLevel) => {
    try {
        const projectRef = doc(db, `users/${ownerId}/projects`, projectId);
        await updateDoc(projectRef, {
            [`sectionPermissions.${sectionIndex}.users.${targetUserId}`]: accessLevel,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error setting section access:', error);
        throw error;
    }
};

/**
 * Get access level icon
 */
export const getAccessIcon = (accessLevel) => {
    const icons = {
        none: '🚫',
        view: '👁️',
        comment: '💬',
        edit: '✏️',
        full: '🔓'
    };
    return icons[accessLevel] || '❓';
};

/**
 * Get access level color classes
 */
export const getAccessColorClasses = (accessLevel) => {
    const colors = {
        none: 'bg-red-100 text-red-700',
        view: 'bg-gray-100 text-gray-700',
        comment: 'bg-blue-100 text-blue-700',
        edit: 'bg-yellow-100 text-yellow-700',
        full: 'bg-green-100 text-green-700'
    };
    return colors[accessLevel] || 'bg-gray-100 text-gray-700';
};
