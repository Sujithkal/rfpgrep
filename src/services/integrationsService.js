// Slack Integration Service
// Handles Slack webhook notifications for RFP events

import { db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Save Slack webhook URL for a user
 */
export const saveSlackWebhook = async (userId, webhookUrl) => {
    try {
        await updateDoc(doc(db, 'users', userId), {
            'integrations.slack': {
                webhookUrl,
                enabled: true,
                createdAt: new Date().toISOString()
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error saving Slack webhook:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Remove Slack integration
 */
export const removeSlackIntegration = async (userId) => {
    try {
        await updateDoc(doc(db, 'users', userId), {
            'integrations.slack': null
        });
        return { success: true };
    } catch (error) {
        console.error('Error removing Slack integration:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send notification to Slack webhook
 */
export const sendSlackNotification = async (webhookUrl, message) => {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });

        if (!response.ok) throw new Error('Slack webhook failed');
        return { success: true };
    } catch (error) {
        console.error('Slack notification error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Build Slack message for RFP events
 */
export const buildSlackMessage = (event, data) => {
    const messages = {
        rfp_uploaded: {
            text: `📄 New RFP Uploaded: ${data.rfpName}`,
            blocks: [
                {
                    type: 'header',
                    text: { type: 'plain_text', text: '📄 New RFP Uploaded', emoji: true }
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*RFP Name:*\n${data.rfpName}` },
                        { type: 'mrkdwn', text: `*Questions:*\n${data.totalQuestions}` }
                    ]
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: { type: 'plain_text', text: 'View RFP' },
                            url: `https://rfpgrep.com/editor?rfpId=${data.rfpId}`,
                            action_id: 'view_rfp'
                        }
                    ]
                }
            ]
        },
        rfp_completed: {
            text: `✅ RFP Completed: ${data.rfpName}`,
            blocks: [
                {
                    type: 'header',
                    text: { type: 'plain_text', text: '✅ RFP Completed!', emoji: true }
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `*${data.rfpName}* has been completed with ${data.totalQuestions} responses.` }
                }
            ]
        },
        deadline_reminder: {
            text: `⏰ Deadline Reminder: ${data.rfpName}`,
            blocks: [
                {
                    type: 'header',
                    text: { type: 'plain_text', text: '⏰ Deadline Approaching!', emoji: true }
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*RFP:*\n${data.rfpName}` },
                        { type: 'mrkdwn', text: `*Days Left:*\n${data.daysRemaining}` },
                        { type: 'mrkdwn', text: `*Remaining:*\n${data.questionsRemaining} questions` }
                    ]
                }
            ]
        }
    };

    return messages[event] || { text: `RFPgrep: ${event}` };
};

/**
 * MS Teams Webhook (similar format to Slack)
 */
export const saveTeamsWebhook = async (userId, webhookUrl) => {
    try {
        await updateDoc(doc(db, 'users', userId), {
            'integrations.teams': {
                webhookUrl,
                enabled: true,
                createdAt: new Date().toISOString()
            }
        });
        return { success: true };
    } catch (error) {
        console.error('Error saving Teams webhook:', error);
        return { success: false, error: error.message };
    }
};

export const sendTeamsNotification = async (webhookUrl, message) => {
    try {
        // MS Teams uses Adaptive Cards format
        const teamsMessage = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "6366f1",
            "summary": message.text || "RFPgrep Notification",
            "sections": [{
                "activityTitle": message.text,
                "facts": message.facts || [],
                "markdown": true
            }]
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamsMessage)
        });

        if (!response.ok) throw new Error('Teams webhook failed');
        return { success: true };
    } catch (error) {
        console.error('Teams notification error:', error);
        return { success: false, error: error.message };
    }
};
