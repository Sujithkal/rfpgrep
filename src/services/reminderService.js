/**
 * Reminder Service
 * Handles deadline reminders and overdue notifications
 */

import { db } from './firebase';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { createNotification, NOTIFICATION_TYPES } from './notificationService';

/**
 * Reminder types
 */
export const REMINDER_TYPES = {
    DEADLINE_24H: { id: 'deadline_24h', label: '24 hours before', hours: 24 },
    DEADLINE_48H: { id: 'deadline_48h', label: '48 hours before', hours: 48 },
    DEADLINE_1W: { id: 'deadline_1w', label: '1 week before', hours: 168 },
    OVERDUE: { id: 'overdue', label: 'Overdue', hours: 0 }
};

/**
 * Check projects for upcoming deadlines
 */
export const checkDeadlines = async (userId) => {
    try {
        const projectsRef = collection(db, `users/${userId}/projects`);
        const q = query(projectsRef, orderBy('dueDate', 'asc'));
        const snapshot = await getDocs(q);

        const now = new Date();
        const reminders = [];

        snapshot.forEach(doc => {
            const project = { id: doc.id, ...doc.data() };
            if (!project.dueDate) return;

            const dueDate = project.dueDate.toDate ? project.dueDate.toDate() : new Date(project.dueDate);
            const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

            if (hoursUntilDue < 0) {
                reminders.push({
                    project,
                    type: REMINDER_TYPES.OVERDUE,
                    hoursOverdue: Math.abs(hoursUntilDue)
                });
            } else if (hoursUntilDue <= 24) {
                reminders.push({
                    project,
                    type: REMINDER_TYPES.DEADLINE_24H,
                    hoursUntilDue
                });
            } else if (hoursUntilDue <= 48) {
                reminders.push({
                    project,
                    type: REMINDER_TYPES.DEADLINE_48H,
                    hoursUntilDue
                });
            } else if (hoursUntilDue <= 168) {
                reminders.push({
                    project,
                    type: REMINDER_TYPES.DEADLINE_1W,
                    hoursUntilDue
                });
            }
        });

        return reminders;
    } catch (error) {
        console.error('Error checking deadlines:', error);
        return [];
    }
};

/**
 * Send reminder notifications
 */
export const sendReminders = async (userId, reminders) => {
    const sent = [];

    for (const reminder of reminders) {
        try {
            const notificationType = reminder.type.id === 'overdue'
                ? NOTIFICATION_TYPES.DEADLINE
                : NOTIFICATION_TYPES.REMINDER;

            const title = reminder.type.id === 'overdue'
                ? `⚠️ Overdue: ${reminder.project.name}`
                : `⏰ Deadline approaching: ${reminder.project.name}`;

            const message = reminder.type.id === 'overdue'
                ? `This RFP is ${Math.round(reminder.hoursOverdue)} hours overdue!`
                : `Due in ${Math.round(reminder.hoursUntilDue)} hours.`;

            await createNotification(userId, {
                type: notificationType,
                title,
                message,
                projectId: reminder.project.id,
                link: `/editor?projectId=${reminder.project.id}`
            });

            sent.push(reminder);
        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    }

    return sent;
};

/**
 * Get pending review reminders
 */
export const checkPendingReviews = async (userId) => {
    try {
        const projectsRef = collection(db, `users/${userId}/projects`);
        const snapshot = await getDocs(projectsRef);

        const pendingReviews = [];

        snapshot.forEach(doc => {
            const project = { id: doc.id, ...doc.data() };
            let pendingCount = 0;

            project.sections?.forEach(section => {
                section.questions?.forEach(question => {
                    if (question.workflowStatus === 'in_review') {
                        pendingCount++;
                    }
                });
            });

            if (pendingCount > 0) {
                pendingReviews.push({
                    project,
                    pendingCount
                });
            }
        });

        return pendingReviews;
    } catch (error) {
        console.error('Error checking pending reviews:', error);
        return [];
    }
};

/**
 * Format reminder for display
 */
export const formatReminder = (reminder) => {
    const isOverdue = reminder.type.id === 'overdue';

    return {
        ...reminder,
        icon: isOverdue ? '🔴' : '🟡',
        urgency: isOverdue ? 'high' : reminder.hoursUntilDue < 24 ? 'medium' : 'low',
        displayText: isOverdue
            ? `${Math.round(reminder.hoursOverdue)}h overdue`
            : `${Math.round(reminder.hoursUntilDue)}h remaining`
    };
};
