/**
 * Presence Service
 * Handles real-time presence indicators (who's viewing/typing)
 */

import { db } from './firebase';
import {
    doc,
    updateDoc,
    onSnapshot,
    serverTimestamp,
    deleteField
} from 'firebase/firestore';

/**
 * Update user presence in a document
 */
export const updatePresence = async (ownerId, projectId, userId, userData) => {
    try {
        const projectRef = doc(db, `users/${ownerId}/projects`, projectId);
        await updateDoc(projectRef, {
            [`presence.${userId}`]: {
                name: userData.displayName || 'Anonymous',
                email: userData.email,
                avatar: userData.photoURL,
                color: getPresenceColor(userId),
                lastSeen: serverTimestamp(),
                isActive: true
            }
        });
    } catch (error) {
        console.error('Error updating presence:', error);
    }
};

/**
 * Update typing indicator
 */
export const updateTypingStatus = async (ownerId, projectId, userId, isTyping, questionId = null) => {
    try {
        const projectRef = doc(db, `users/${ownerId}/projects`, projectId);
        await updateDoc(projectRef, {
            [`presence.${userId}.isTyping`]: isTyping,
            [`presence.${userId}.typingQuestion`]: questionId,
            [`presence.${userId}.lastSeen`]: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating typing status:', error);
    }
};

/**
 * Remove user presence (on disconnect)
 */
export const removePresence = async (ownerId, projectId, userId) => {
    try {
        const projectRef = doc(db, `users/${ownerId}/projects`, projectId);
        await updateDoc(projectRef, {
            [`presence.${userId}`]: deleteField()
        });
    } catch (error) {
        console.error('Error removing presence:', error);
    }
};

/**
 * Subscribe to presence updates
 */
export const subscribeToPresence = (ownerId, projectId, callback) => {
    const projectRef = doc(db, `users/${ownerId}/projects`, projectId);

    return onSnapshot(projectRef, (doc) => {
        const data = doc.data();
        const presence = data?.presence || {};

        // Filter out stale presence (not seen in last 5 minutes)
        const now = Date.now();
        const activePresence = {};

        Object.entries(presence).forEach(([userId, userData]) => {
            const lastSeen = userData.lastSeen?.toMillis?.() || 0;
            if (now - lastSeen < 5 * 60 * 1000) {
                activePresence[userId] = userData;
            }
        });

        callback(activePresence);
    });
};

/**
 * Get unique color for presence indicator
 */
export const getPresenceColor = (userId) => {
    const colors = [
        '#EF4444', // red
        '#F97316', // orange
        '#EAB308', // yellow
        '#22C55E', // green
        '#06B6D4', // cyan
        '#3B82F6', // blue
        '#8B5CF6', // purple
        '#EC4899', // pink
    ];

    // Generate consistent color from userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};

/**
 * Format presence for display
 */
export const formatPresenceList = (presence, currentUserId) => {
    return Object.entries(presence)
        .filter(([userId]) => userId !== currentUserId)
        .map(([userId, userData]) => ({
            id: userId,
            name: userData.name,
            avatar: userData.avatar,
            color: userData.color,
            isTyping: userData.isTyping,
            typingQuestion: userData.typingQuestion
        }));
};
