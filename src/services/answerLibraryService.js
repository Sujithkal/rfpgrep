// Answer Library Service
// Store and reuse past answers for RFP responses

import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    increment
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Create a new answer in the library
 */
export const createAnswer = async (userId, answerData) => {
    try {
        const answerId = `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const answerRef = doc(db, 'users', userId, 'answers', answerId);

        await setDoc(answerRef, {
            id: answerId,
            question: answerData.question,
            answer: answerData.answer,
            category: answerData.category || 'General',
            tags: answerData.tags || [],
            usageCount: 0,
            lastUsed: null,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return { success: true, id: answerId };
    } catch (error) {
        console.error('Error creating answer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all answers for a user
 */
export const getAnswers = async (userId, filters = {}) => {
    try {
        const answersRef = collection(db, 'users', userId, 'answers');
        let q = query(answersRef, orderBy('createdAt', 'desc'));

        if (filters.category && filters.category !== 'all') {
            q = query(answersRef, where('category', '==', filters.category), orderBy('createdAt', 'desc'));
        }

        if (filters.limit) {
            q = query(q, limit(filters.limit));
        }

        const snapshot = await getDocs(q);
        const answers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, answers };
    } catch (error) {
        console.error('Error getting answers:', error);
        return { success: false, error: error.message, answers: [] };
    }
};

/**
 * Get a single answer
 */
export const getAnswer = async (userId, answerId) => {
    try {
        const answerRef = doc(db, 'users', userId, 'answers', answerId);
        const snapshot = await getDoc(answerRef);

        if (!snapshot.exists()) {
            return { success: false, error: 'Answer not found' };
        }

        return { success: true, answer: { id: snapshot.id, ...snapshot.data() } };
    } catch (error) {
        console.error('Error getting answer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update an answer
 */
export const updateAnswer = async (userId, answerId, updateData) => {
    try {
        const answerRef = doc(db, 'users', userId, 'answers', answerId);

        await updateDoc(answerRef, {
            ...updateData,
            updatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating answer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete an answer
 */
export const deleteAnswer = async (userId, answerId) => {
    try {
        const answerRef = doc(db, 'users', userId, 'answers', answerId);
        await deleteDoc(answerRef);
        return { success: true };
    } catch (error) {
        console.error('Error deleting answer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Increment usage count when answer is used
 */
export const incrementUsageCount = async (userId, answerId) => {
    try {
        const answerRef = doc(db, 'users', userId, 'answers', answerId);
        await updateDoc(answerRef, {
            usageCount: increment(1),
            lastUsed: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error incrementing usage:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Search answers by keyword
 */
export const searchAnswers = async (userId, searchQuery) => {
    try {
        // Get all answers and filter client-side (Firestore doesn't support full-text search)
        const result = await getAnswers(userId);
        if (!result.success) return result;

        const query = searchQuery.toLowerCase();
        const filtered = result.answers.filter(answer =>
            answer.question?.toLowerCase().includes(query) ||
            answer.answer?.toLowerCase().includes(query) ||
            answer.category?.toLowerCase().includes(query) ||
            answer.tags?.some(tag => tag.toLowerCase().includes(query))
        );

        return { success: true, answers: filtered };
    } catch (error) {
        console.error('Error searching answers:', error);
        return { success: false, error: error.message, answers: [] };
    }
};

/**
 * Get answers by category
 */
export const getAnswersByCategory = async (userId, category) => {
    try {
        const answersRef = collection(db, 'users', userId, 'answers');
        const q = query(answersRef, where('category', '==', category), orderBy('usageCount', 'desc'));

        const snapshot = await getDocs(q);
        const answers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return { success: true, answers };
    } catch (error) {
        console.error('Error getting answers by category:', error);
        return { success: false, error: error.message, answers: [] };
    }
};

/**
 * Get suggested answers based on question similarity
 */
export const getSuggestedAnswers = async (userId, questionText, maxResults = 5) => {
    try {
        const result = await getAnswers(userId);
        if (!result.success) return result;

        // Simple keyword-based similarity scoring
        const queryWords = questionText.toLowerCase().split(/\s+/).filter(w => w.length > 3);

        const scored = result.answers.map(answer => {
            const answerWords = (answer.question || '').toLowerCase().split(/\s+/);
            let matchCount = 0;

            queryWords.forEach(word => {
                if (answerWords.some(aw => aw.includes(word) || word.includes(aw))) {
                    matchCount++;
                }
            });

            const similarity = queryWords.length > 0 ? (matchCount / queryWords.length) * 100 : 0;

            return { ...answer, similarity };
        });

        // Filter and sort by similarity
        const suggestions = scored
            .filter(a => a.similarity > 20)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxResults);

        return { success: true, suggestions };
    } catch (error) {
        console.error('Error getting suggestions:', error);
        return { success: false, error: error.message, suggestions: [] };
    }
};

/**
 * Find duplicate answers
 */
export const findDuplicates = async (userId, threshold = 80) => {
    try {
        const result = await getAnswers(userId);
        if (!result.success) return result;

        const duplicates = [];
        const answers = result.answers;

        for (let i = 0; i < answers.length; i++) {
            for (let j = i + 1; j < answers.length; j++) {
                const similarity = calculateTextSimilarity(
                    answers[i].answer || '',
                    answers[j].answer || ''
                );

                if (similarity >= threshold) {
                    duplicates.push({
                        answer1: answers[i],
                        answer2: answers[j],
                        similarity
                    });
                }
            }
        }

        return { success: true, duplicates };
    } catch (error) {
        console.error('Error finding duplicates:', error);
        return { success: false, error: error.message, duplicates: [] };
    }
};

/**
 * Find outdated answers (not used in X months)
 */
export const findOutdatedAnswers = async (userId, monthsThreshold = 6) => {
    try {
        const result = await getAnswers(userId);
        if (!result.success) return result;

        const thresholdDate = new Date();
        thresholdDate.setMonth(thresholdDate.getMonth() - monthsThreshold);

        const outdated = result.answers.filter(answer => {
            const lastUsed = answer.lastUsed?.toDate?.() || answer.createdAt?.toDate?.();
            return lastUsed && lastUsed < thresholdDate;
        });

        return { success: true, outdated };
    } catch (error) {
        console.error('Error finding outdated answers:', error);
        return { success: false, error: error.message, outdated: [] };
    }
};

/**
 * Bulk delete answers
 */
export const bulkDeleteAnswers = async (userId, answerIds) => {
    try {
        const deletePromises = answerIds.map(id =>
            deleteDoc(doc(db, 'users', userId, 'answers', id))
        );

        await Promise.all(deletePromises);
        return { success: true, deleted: answerIds.length };
    } catch (error) {
        console.error('Error bulk deleting:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Import answers from a completed project
 */
export const importFromProject = async (userId, project) => {
    try {
        let importedCount = 0;

        for (const section of project.sections || []) {
            for (const question of section.questions || []) {
                if (question.response && question.status === 'approved') {
                    await createAnswer(userId, {
                        question: question.text,
                        answer: question.response,
                        category: section.name || section.title || 'Imported',
                        tags: ['imported', project.name?.toLowerCase().replace(/\s+/g, '-')]
                    });
                    importedCount++;
                }
            }
        }

        return { success: true, imported: importedCount };
    } catch (error) {
        console.error('Error importing from project:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all unique categories
 */
export const getCategories = async (userId) => {
    try {
        const result = await getAnswers(userId);
        if (!result.success) return result;

        const categories = [...new Set(result.answers.map(a => a.category))].filter(Boolean);
        return { success: true, categories };
    } catch (error) {
        console.error('Error getting categories:', error);
        return { success: false, error: error.message, categories: [] };
    }
};

/**
 * Helper: Calculate text similarity (Jaccard similarity)
 */
const calculateTextSimilarity = (text1, text2) => {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return union > 0 ? Math.round((intersection / union) * 100) : 0;
};

// Default categories
export const DEFAULT_CATEGORIES = [
    'Company Information',
    'Technical Capabilities',
    'Security & Compliance',
    'Team & Experience',
    'Pricing & Terms',
    'References & Case Studies',
    'Implementation & Support',
    'General'
];
