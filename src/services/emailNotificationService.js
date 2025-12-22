/**
 * Email Notification Service
 * Handles email notifications by queueing them to Firestore
 * In production, a Cloud Function would process this queue and send via SendGrid/SES
 */

import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Email templates
export const EMAIL_TEMPLATES = {
    RFP_ASSIGNED: {
        subject: 'New RFP Assigned to You',
        template: 'rfp_assigned'
    },
    ANSWER_APPROVED: {
        subject: 'Your Answer Was Approved',
        template: 'answer_approved'
    },
    REVIEW_REQUESTED: {
        subject: 'Review Requested for RFP Response',
        template: 'review_requested'
    },
    DEADLINE_REMINDER: {
        subject: 'RFP Deadline Approaching',
        template: 'deadline_reminder'
    },
    TEAM_INVITE: {
        subject: 'You\'ve Been Invited to a Team',
        template: 'team_invite'
    },
    RFP_WON: {
        subject: '🎉 Congratulations! RFP Won',
        template: 'rfp_won'
    },
    COMMENT_MENTION: {
        subject: 'You Were Mentioned in a Comment',
        template: 'comment_mention'
    },
    WEEKLY_SUMMARY: {
        subject: 'Your Weekly RFP Summary',
        template: 'weekly_summary'
    },
    // Team collaboration templates
    QUESTION_ASSIGNED: {
        subject: '📝 New Question Assigned to You',
        template: 'question_assigned'
    },
    QUESTION_APPROVED: {
        subject: '✅ Your Response Was Approved!',
        template: 'question_approved'
    },
    CHANGES_REQUESTED: {
        subject: '🔄 Changes Requested on Your Response',
        template: 'changes_requested'
    },
    SUBMITTED_FOR_REVIEW: {
        subject: '👀 Response Submitted for Review',
        template: 'submitted_for_review'
    }
};

/**
 * Queue an email notification
 * @param {string} recipientEmail - Email address of recipient
 * @param {string} recipientName - Display name of recipient
 * @param {string} templateId - Template type from EMAIL_TEMPLATES
 * @param {object} data - Template data (varies by template)
 */
export const queueEmailNotification = async (recipientEmail, recipientName, templateId, data = {}) => {
    try {
        const template = EMAIL_TEMPLATES[templateId];
        if (!template) {
            console.error('Unknown email template:', templateId);
            return { success: false, error: 'Unknown template' };
        }

        await addDoc(collection(db, 'emailQueue'), {
            to: recipientEmail,
            toName: recipientName,
            subject: template.subject,
            template: template.template,
            data: {
                ...data,
                recipientName,
                appUrl: 'https://rfpgrep.com'
            },
            status: 'pending',
            createdAt: serverTimestamp(),
            attempts: 0
        });

        console.log(`📧 Email queued: ${template.subject} to ${recipientEmail}`);
        return { success: true };
    } catch (error) {
        console.error('Error queueing email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send notification based on user preferences
 */
export const sendNotificationWithPreference = async (userId, recipientEmail, recipientName, templateId, data = {}) => {
    try {
        // Check user's notification preferences
        const { getDoc, doc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            return { success: false, error: 'User not found' };
        }

        const userData = userDoc.data();
        const emailEnabled = userData?.settings?.emailNotifications !== false;

        if (!emailEnabled) {
            console.log(`📧 Email skipped (disabled): ${templateId} for ${recipientEmail}`);
            return { success: true, skipped: true };
        }

        return await queueEmailNotification(recipientEmail, recipientName, templateId, data);
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify team members about an RFP update
 */
export const notifyTeamOfRFPUpdate = async (ownerId, projectId, projectName, updateType) => {
    try {
        // Get team members
        const membersQuery = query(collection(db, `users/${ownerId}/teamMembers`));
        const membersSnapshot = await getDocs(membersQuery);

        const notifications = [];
        membersSnapshot.forEach(memberDoc => {
            const member = memberDoc.data();
            if (member.email && member.status === 'active') {
                notifications.push(
                    queueEmailNotification(member.email, member.displayName || member.email, 'REVIEW_REQUESTED', {
                        projectName,
                        updateType,
                        projectUrl: `https://rfpgrep.com/editor?projectId=${projectId}`
                    })
                );
            }
        });

        await Promise.all(notifications);
        return { success: true, count: notifications.length };
    } catch (error) {
        console.error('Error notifying team:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send deadline reminder emails
 * In production, this would be called by a scheduled Cloud Function
 */
export const sendDeadlineReminders = async () => {
    try {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        // This would query all projects with due dates in the next 3 days
        // For now, we'll log that this would run
        console.log('📧 Deadline reminder check would run here for dates before:', threeDaysFromNow);

        return { success: true };
    } catch (error) {
        console.error('Error sending deadline reminders:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get pending email queue (for admin dashboard)
 */
export const getPendingEmails = async () => {
    try {
        const q = query(
            collection(db, 'emailQueue'),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);

        const emails = [];
        snapshot.forEach(doc => {
            emails.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, emails };
    } catch (error) {
        console.error('Error getting pending emails:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Mark email as sent (would be called by Cloud Function after sending)
 */
export const markEmailSent = async (emailId) => {
    try {
        const emailRef = doc(db, 'emailQueue', emailId);
        await updateDoc(emailRef, {
            status: 'sent',
            sentAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error marking email sent:', error);
        return { success: false, error: error.message };
    }
};

export default {
    EMAIL_TEMPLATES,
    queueEmailNotification,
    sendNotificationWithPreference,
    notifyTeamOfRFPUpdate,
    sendDeadlineReminders,
    getPendingEmails,
    markEmailSent
};
