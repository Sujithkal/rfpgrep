/**
 * Notification Service
 * Handles in-app notifications storage and retrieval
 */

import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    updateDoc,
    doc,
    where,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
    // Original types
    MENTION: 'mention',           // Someone mentioned you
    APPROVAL: 'approval',         // Approval needed
    DEADLINE: 'deadline',         // Deadline approaching
    TEAM_INVITE: 'team_invite',   // Team invitation
    COMMENT: 'comment',           // New comment
    STATUS_CHANGE: 'status',      // Project status changed
    AI_COMPLETE: 'ai_complete',   // AI generation complete
    SYSTEM: 'system',             // System announcement

    // Team collaboration types
    ASSIGNMENT: 'assignment',           // You were assigned a question
    UNASSIGNMENT: 'unassignment',       // Question was unassigned from you
    QUESTION_APPROVED: 'question_approved',  // Your submission was approved
    CHANGES_REQUESTED: 'changes_requested',  // Your submission needs changes
    SUBMITTED_FOR_REVIEW: 'submitted_for_review', // Editor submitted for review
    MEMBER_JOINED: 'member_joined',      // New team member joined
    MEMBER_REMOVED: 'member_removed',    // Team member removed

    // Project lifecycle types
    PROJECT_CREATED: 'project_created',     // New project created
    PROJECT_APPROVED: 'project_approved',   // Project marked as approved
    PROJECT_SUBMITTED: 'project_submitted', // Project submitted
    PROJECT_EXPORTED: 'project_exported',   // Project exported to PDF/DOC

    // Usage types
    USAGE_WARNING: 'usage_warning',         // Approaching usage limit
    USAGE_LIMIT_REACHED: 'usage_limit_reached'  // Usage limit reached
};

/**
 * Create a new notification
 */
export const createNotification = async (userId, notification) => {
    try {
        const notificationsRef = collection(db, `users/${userId}/notifications`);
        const newNotification = {
            ...notification,
            read: false,
            createdAt: serverTimestamp(),
            type: notification.type || NOTIFICATION_TYPES.SYSTEM
        };

        const docRef = await addDoc(notificationsRef, newNotification);
        return { id: docRef.id, ...newNotification };
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

/**
 * Get notifications for a user
 */
export const getNotifications = async (userId, limitCount = 20) => {
    try {
        const notificationsRef = collection(db, `users/${userId}/notifications`);
        const q = query(
            notificationsRef,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const notifications = [];
        snapshot.forEach(doc => {
            notifications.push({ id: doc.id, ...doc.data() });
        });

        return notifications;
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId) => {
    try {
        const notificationsRef = collection(db, `users/${userId}/notifications`);
        const q = query(notificationsRef, where('read', '==', false));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (userId, notificationId) => {
    try {
        const notificationRef = doc(db, `users/${userId}/notifications`, notificationId);
        await updateDoc(notificationRef, { read: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId) => {
    try {
        const notificationsRef = collection(db, `users/${userId}/notifications`);
        const q = query(notificationsRef, where('read', '==', false));
        const snapshot = await getDocs(q);

        const updates = snapshot.docs.map(doc =>
            updateDoc(doc.ref, { read: true })
        );

        await Promise.all(updates);
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
};

/**
 * Subscribe to notifications (real-time updates)
 */
export const subscribeToNotifications = (userId, callback) => {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(
        notificationsRef,
        orderBy('createdAt', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = [];
        snapshot.forEach(doc => {
            notifications.push({ id: doc.id, ...doc.data() });
        });
        callback(notifications);
    });
};

/**
 * Get notification icon based on type
 */
export const getNotificationIcon = (type) => {
    switch (type) {
        case NOTIFICATION_TYPES.MENTION: return '👤';
        case NOTIFICATION_TYPES.APPROVAL: return '✅';
        case NOTIFICATION_TYPES.DEADLINE: return '⏰';
        case NOTIFICATION_TYPES.TEAM_INVITE: return '👥';
        case NOTIFICATION_TYPES.COMMENT: return '💬';
        case NOTIFICATION_TYPES.STATUS_CHANGE: return '🔄';
        case NOTIFICATION_TYPES.AI_COMPLETE: return '🤖';
        case NOTIFICATION_TYPES.SYSTEM: return '📢';
        // Team collaboration types
        case NOTIFICATION_TYPES.ASSIGNMENT: return '📝';
        case NOTIFICATION_TYPES.UNASSIGNMENT: return '↩️';
        case NOTIFICATION_TYPES.QUESTION_APPROVED: return '✅';
        case NOTIFICATION_TYPES.CHANGES_REQUESTED: return '🔄';
        case NOTIFICATION_TYPES.SUBMITTED_FOR_REVIEW: return '👀';
        case NOTIFICATION_TYPES.MEMBER_JOINED: return '🎉';
        case NOTIFICATION_TYPES.MEMBER_REMOVED: return '👋';
        // Project lifecycle types
        case NOTIFICATION_TYPES.PROJECT_CREATED: return '📄';
        case NOTIFICATION_TYPES.PROJECT_APPROVED: return '✅';
        case NOTIFICATION_TYPES.PROJECT_SUBMITTED: return '🚀';
        case NOTIFICATION_TYPES.PROJECT_EXPORTED: return '📤';
        // Usage types
        case NOTIFICATION_TYPES.USAGE_WARNING: return '⚠️';
        case NOTIFICATION_TYPES.USAGE_LIMIT_REACHED: return '🛑';
        default: return '🔔';
    }
};

/**
 * TEAM COLLABORATION NOTIFICATION HELPERS
 */

/**
 * Notify editor they were assigned a question
 */
export const notifyQuestionAssigned = async (assigneeUserId, data) => {
    return createNotification(assigneeUserId, {
        type: NOTIFICATION_TYPES.ASSIGNMENT,
        title: 'Question Assigned to You',
        message: `You've been assigned "${truncateText(data.questionText, 50)}" in project "${data.projectName}"`,
        data: {
            projectId: data.projectId,
            sectionIndex: data.sectionIndex,
            questionIndex: data.questionIndex,
            assignedBy: data.assignedBy
        }
    });
};

/**
 * Notify editor their question was approved
 */
export const notifyQuestionApproved = async (editorUserId, data) => {
    return createNotification(editorUserId, {
        type: NOTIFICATION_TYPES.QUESTION_APPROVED,
        title: 'Response Approved! 🎉',
        message: `Your response to "${truncateText(data.questionText, 50)}" was approved by ${data.approvedBy}`,
        data: {
            projectId: data.projectId,
            sectionIndex: data.sectionIndex,
            questionIndex: data.questionIndex
        }
    });
};

/**
 * Notify editor that changes were requested
 */
export const notifyChangesRequested = async (editorUserId, data) => {
    return createNotification(editorUserId, {
        type: NOTIFICATION_TYPES.CHANGES_REQUESTED,
        title: 'Changes Requested',
        message: `Please revise "${truncateText(data.questionText, 50)}" - ${data.reason || 'See admin feedback'}`,
        data: {
            projectId: data.projectId,
            sectionIndex: data.sectionIndex,
            questionIndex: data.questionIndex,
            reason: data.reason
        }
    });
};

/**
 * Notify admin that editor submitted for review
 */
export const notifySubmittedForReview = async (adminUserId, data) => {
    return createNotification(adminUserId, {
        type: NOTIFICATION_TYPES.SUBMITTED_FOR_REVIEW,
        title: 'Pending Review',
        message: `${data.submittedBy} submitted "${truncateText(data.questionText, 50)}" for review`,
        data: {
            projectId: data.projectId,
            sectionIndex: data.sectionIndex,
            questionIndex: data.questionIndex,
            submittedBy: data.submittedBy
        }
    });
};

/**
 * Helper to truncate text
 */
const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * PROJECT LIFECYCLE NOTIFICATION HELPERS
 */

/**
 * Notify user of team invitation
 */
export const notifyTeamInvite = async (inviteeUserId, data) => {
    return createNotification(inviteeUserId, {
        type: NOTIFICATION_TYPES.TEAM_INVITE,
        title: 'Team Invitation 🎉',
        message: `${data.inviterName} invited you to join their team as ${data.role}`,
        data: {
            inviterId: data.inviterId,
            inviterName: data.inviterName,
            role: data.role
        }
    });
};

/**
 * Notify team members of new project created
 */
export const notifyProjectCreated = async (userId, data) => {
    return createNotification(userId, {
        type: NOTIFICATION_TYPES.PROJECT_CREATED,
        title: 'New Project Created 📄',
        message: `"${data.projectName}" was created with ${data.totalQuestions} questions`,
        data: {
            projectId: data.projectId,
            projectName: data.projectName,
            createdBy: data.createdBy
        }
    });
};

/**
 * Notify team members project was approved
 */
export const notifyProjectApproved = async (userId, data) => {
    return createNotification(userId, {
        type: NOTIFICATION_TYPES.PROJECT_APPROVED,
        title: 'Project Approved ✅',
        message: `"${data.projectName}" has been marked as approved by ${data.approvedBy}`,
        data: {
            projectId: data.projectId,
            projectName: data.projectName,
            approvedBy: data.approvedBy
        }
    });
};

/**
 * Notify user about project export
 */
export const notifyProjectExported = async (userId, data) => {
    return createNotification(userId, {
        type: NOTIFICATION_TYPES.PROJECT_EXPORTED,
        title: 'Project Exported 📤',
        message: `"${data.projectName}" was exported to ${data.format.toUpperCase()}`,
        data: {
            projectId: data.projectId,
            projectName: data.projectName,
            format: data.format
        }
    });
};

/**
 * Notify user of usage warning (approaching limit)
 */
export const notifyUsageWarning = async (userId, data) => {
    return createNotification(userId, {
        type: NOTIFICATION_TYPES.USAGE_WARNING,
        title: 'Usage Warning ⚠️',
        message: `You've used ${data.used}/${data.limit} ${data.resource} this month (${data.percentage}%)`,
        data: {
            resource: data.resource,
            used: data.used,
            limit: data.limit,
            percentage: data.percentage
        }
    });
};

/**
 * Notify user they've reached usage limit
 */
export const notifyUsageLimitReached = async (userId, data) => {
    return createNotification(userId, {
        type: NOTIFICATION_TYPES.USAGE_LIMIT_REACHED,
        title: 'Usage Limit Reached 🛑',
        message: `You've reached your ${data.resource} limit (${data.limit}/${data.period}). Upgrade to continue.`,
        data: {
            resource: data.resource,
            limit: data.limit,
            period: data.period
        }
    });
};
