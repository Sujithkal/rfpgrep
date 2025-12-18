/**
 * Template Service
 * Handles reusable response templates for RFP answers
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
 * Default template categories
 */
export const TEMPLATE_CATEGORIES = [
    { id: 'company', name: 'Company Overview', icon: '🏢' },
    { id: 'experience', name: 'Experience & Qualifications', icon: '📋' },
    { id: 'technical', name: 'Technical Capabilities', icon: '⚙️' },
    { id: 'security', name: 'Security & Compliance', icon: '🔒' },
    { id: 'pricing', name: 'Pricing & Terms', icon: '💰' },
    { id: 'support', name: 'Support & SLA', icon: '🎧' },
    { id: 'other', name: 'Other', icon: '📁' }
];

/**
 * Create a new template
 */
export const createTemplate = async (userId, template) => {
    try {
        const templatesRef = collection(db, `users/${userId}/templates`);
        const newTemplate = {
            ...template,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            usageCount: 0
        };

        const docRef = await addDoc(templatesRef, newTemplate);
        return { id: docRef.id, ...newTemplate };
    } catch (error) {
        console.error('Error creating template:', error);
        throw error;
    }
};

/**
 * Get all templates for a user
 */
export const getTemplates = async (userId) => {
    try {
        const templatesRef = collection(db, `users/${userId}/templates`);
        const q = query(templatesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const templates = [];
        snapshot.forEach(doc => {
            templates.push({ id: doc.id, ...doc.data() });
        });

        return templates;
    } catch (error) {
        console.error('Error getting templates:', error);
        return [];
    }
};

/**
 * Update a template
 */
export const updateTemplate = async (userId, templateId, updates) => {
    try {
        const templateRef = doc(db, `users/${userId}/templates`, templateId);
        await updateDoc(templateRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating template:', error);
        throw error;
    }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (userId, templateId) => {
    try {
        const templateRef = doc(db, `users/${userId}/templates`, templateId);
        await deleteDoc(templateRef);
    } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
    }
};

/**
 * Increment template usage count
 */
export const incrementTemplateUsage = async (userId, templateId) => {
    try {
        const templateRef = doc(db, `users/${userId}/templates`, templateId);
        const templates = await getTemplates(userId);
        const template = templates.find(t => t.id === templateId);

        if (template) {
            await updateDoc(templateRef, {
                usageCount: (template.usageCount || 0) + 1,
                lastUsedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error incrementing template usage:', error);
    }
};

/**
 * Search templates by keyword
 */
export const searchTemplates = async (userId, keyword) => {
    const templates = await getTemplates(userId);
    const searchLower = keyword.toLowerCase();

    return templates.filter(template =>
        template.name?.toLowerCase().includes(searchLower) ||
        template.content?.toLowerCase().includes(searchLower) ||
        template.category?.toLowerCase().includes(searchLower)
    );
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = async (userId, categoryId) => {
    const templates = await getTemplates(userId);
    return templates.filter(template => template.category === categoryId);
};

/**
 * Create template from answer (save answer as template)
 */
export const saveAnswerAsTemplate = async (userId, answer, name, category = 'other') => {
    return await createTemplate(userId, {
        name,
        content: answer.response,
        category,
        originalQuestion: answer.question,
        trustScore: answer.trustScore
    });
};

/**
 * Get popular templates (most used)
 */
export const getPopularTemplates = async (userId, limitCount = 5) => {
    const templates = await getTemplates(userId);
    return templates
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, limitCount);
};
