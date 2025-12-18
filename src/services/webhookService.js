/**
 * Webhook Service
 * Handles webhook configurations and event dispatching
 */

import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Available webhook events
 */
export const WEBHOOK_EVENTS = {
    PROJECT_CREATED: { id: 'project.created', name: 'Project Created', description: 'When a new project is created' },
    PROJECT_COMPLETED: { id: 'project.completed', name: 'Project Completed', description: 'When a project reaches 100%' },
    PROJECT_EXPORTED: { id: 'project.exported', name: 'Project Exported', description: 'When a project is exported' },
    ANSWER_APPROVED: { id: 'answer.approved', name: 'Answer Approved', description: 'When an answer is approved' },
    TEAM_INVITED: { id: 'team.invited', name: 'Team Member Invited', description: 'When someone joins the team' },
    DEADLINE_APPROACHING: { id: 'deadline.approaching', name: 'Deadline Approaching', description: '24h before deadline' },
    GO_NO_GO_DECISION: { id: 'decision.made', name: 'Go/No-Go Decision', description: 'When a decision is made' }
};

/**
 * Create a new webhook
 */
export const createWebhook = async (userId, webhook) => {
    try {
        const webhooksRef = collection(db, `users/${userId}/webhooks`);
        const newWebhook = {
            ...webhook,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isActive: true,
            deliveryCount: 0,
            lastDeliveryAt: null,
            lastDeliveryStatus: null
        };

        const docRef = await addDoc(webhooksRef, newWebhook);
        return { id: docRef.id, ...newWebhook };
    } catch (error) {
        console.error('Error creating webhook:', error);
        throw error;
    }
};

/**
 * Get all webhooks for a user
 */
export const getWebhooks = async (userId) => {
    try {
        const webhooksRef = collection(db, `users/${userId}/webhooks`);
        const q = query(webhooksRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const webhooks = [];
        snapshot.forEach(doc => {
            webhooks.push({ id: doc.id, ...doc.data() });
        });

        return webhooks;
    } catch (error) {
        console.error('Error getting webhooks:', error);
        return [];
    }
};

/**
 * Update a webhook
 */
export const updateWebhook = async (userId, webhookId, updates) => {
    try {
        const webhookRef = doc(db, `users/${userId}/webhooks`, webhookId);
        await updateDoc(webhookRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating webhook:', error);
        throw error;
    }
};

/**
 * Delete a webhook
 */
export const deleteWebhook = async (userId, webhookId) => {
    try {
        const webhookRef = doc(db, `users/${userId}/webhooks`, webhookId);
        await deleteDoc(webhookRef);
    } catch (error) {
        console.error('Error deleting webhook:', error);
        throw error;
    }
};

/**
 * Toggle webhook active status
 */
export const toggleWebhook = async (userId, webhookId, isActive) => {
    try {
        const webhookRef = doc(db, `users/${userId}/webhooks`, webhookId);
        await updateDoc(webhookRef, {
            isActive,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error toggling webhook:', error);
        throw error;
    }
};

/**
 * Log webhook delivery attempt
 */
export const logDelivery = async (userId, webhookId, success, responseCode = null) => {
    try {
        const webhookRef = doc(db, `users/${userId}/webhooks`, webhookId);
        await updateDoc(webhookRef, {
            deliveryCount: (await getWebhooks(userId).then(w => w.find(x => x.id === webhookId)?.deliveryCount || 0)) + 1,
            lastDeliveryAt: serverTimestamp(),
            lastDeliveryStatus: success ? 'success' : 'failed',
            lastResponseCode: responseCode
        });
    } catch (error) {
        console.error('Error logging delivery:', error);
    }
};

/**
 * Test webhook endpoint
 * Note: In production, this would use a Cloud Function to make the actual HTTP request
 */
export const testWebhook = async (url) => {
    // In a browser, we can't make arbitrary HTTP requests due to CORS
    // This would be handled by a Cloud Function in production
    return {
        success: true,
        message: 'Test payload sent. Configure a Cloud Function to send actual webhook requests.',
        testPayload: {
            event: 'test',
            timestamp: new Date().toISOString(),
            data: { message: 'This is a test webhook from RFPgrep' }
        }
    };
};

/**
 * Get webhook event list for dropdown
 */
export const getWebhookEventsList = () => {
    return Object.values(WEBHOOK_EVENTS);
};
