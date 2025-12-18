/**
 * Audit Log Service
 * Tracks all user actions for compliance and debugging
 */

import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    where,
    limit,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Audit event types
 */
export const AUDIT_EVENTS = {
    // Auth events
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    USER_SIGNUP: 'user.signup',

    // Project events
    PROJECT_CREATED: 'project.created',
    PROJECT_DELETED: 'project.deleted',
    PROJECT_EXPORTED: 'project.exported',

    // Answer events
    ANSWER_GENERATED: 'answer.generated',
    ANSWER_EDITED: 'answer.edited',
    ANSWER_APPROVED: 'answer.approved',
    ANSWER_REJECTED: 'answer.rejected',

    // Team events
    MEMBER_INVITED: 'team.invited',
    MEMBER_REMOVED: 'team.removed',
    ROLE_CHANGED: 'team.role_changed',

    // Settings events
    SETTINGS_CHANGED: 'settings.changed',
    BRANDING_UPDATED: 'branding.updated',
    API_KEY_CREATED: 'api.key_created',
    API_KEY_REVOKED: 'api.key_revoked',

    // Knowledge Base
    KB_ENTRY_ADDED: 'kb.added',
    KB_ENTRY_DELETED: 'kb.deleted'
};

/**
 * Log an audit event
 */
export const logAuditEvent = async (userId, event, details = {}) => {
    try {
        const auditRef = collection(db, `users/${userId}/auditLogs`);
        await addDoc(auditRef, {
            event,
            details,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            // Don't log IP in browser (would need server-side)
        });
    } catch (error) {
        console.error('Audit log error:', error);
        // Don't throw - audit logging shouldn't break the app
    }
};

/**
 * Get audit logs for a user
 */
export const getAuditLogs = async (userId, limitCount = 100) => {
    try {
        const auditRef = collection(db, `users/${userId}/auditLogs`);
        const q = query(
            auditRef,
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);

        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });

        return logs;
    } catch (error) {
        console.error('Error getting audit logs:', error);
        return [];
    }
};

/**
 * Get audit logs by event type
 */
export const getAuditLogsByType = async (userId, eventType, limitCount = 50) => {
    try {
        const auditRef = collection(db, `users/${userId}/auditLogs`);
        const q = query(
            auditRef,
            where('event', '==', eventType),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);

        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });

        return logs;
    } catch (error) {
        console.error('Error getting audit logs by type:', error);
        return [];
    }
};

/**
 * Get event icon and color
 */
export const getEventDisplay = (event) => {
    const displays = {
        [AUDIT_EVENTS.USER_LOGIN]: { icon: '🔐', color: 'green', label: 'User Login' },
        [AUDIT_EVENTS.USER_LOGOUT]: { icon: '👋', color: 'gray', label: 'User Logout' },
        [AUDIT_EVENTS.USER_SIGNUP]: { icon: '🎉', color: 'purple', label: 'New User' },
        [AUDIT_EVENTS.PROJECT_CREATED]: { icon: '📁', color: 'blue', label: 'Project Created' },
        [AUDIT_EVENTS.PROJECT_DELETED]: { icon: '🗑️', color: 'red', label: 'Project Deleted' },
        [AUDIT_EVENTS.PROJECT_EXPORTED]: { icon: '📤', color: 'indigo', label: 'Project Exported' },
        [AUDIT_EVENTS.ANSWER_GENERATED]: { icon: '🤖', color: 'purple', label: 'AI Generated' },
        [AUDIT_EVENTS.ANSWER_EDITED]: { icon: '✏️', color: 'yellow', label: 'Answer Edited' },
        [AUDIT_EVENTS.ANSWER_APPROVED]: { icon: '✅', color: 'green', label: 'Answer Approved' },
        [AUDIT_EVENTS.MEMBER_INVITED]: { icon: '👥', color: 'blue', label: 'Member Invited' },
        [AUDIT_EVENTS.SETTINGS_CHANGED]: { icon: '⚙️', color: 'gray', label: 'Settings Changed' },
        [AUDIT_EVENTS.API_KEY_CREATED]: { icon: '🔑', color: 'yellow', label: 'API Key Created' },
        [AUDIT_EVENTS.API_KEY_REVOKED]: { icon: '🚫', color: 'red', label: 'API Key Revoked' },
    };

    return displays[event] || { icon: '📋', color: 'gray', label: event };
};

/**
 * Format audit log for display
 */
export const formatAuditLog = (log) => {
    const display = getEventDisplay(log.event);
    const timestamp = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);

    return {
        ...log,
        ...display,
        formattedTime: timestamp.toLocaleString(),
        relativeTime: getRelativeTime(timestamp)
    };
};

/**
 * Get relative time string
 */
const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
};
