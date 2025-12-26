// Training Data Service
// Manages custom AI training from winning RFP responses

import { db } from './firebase';
import {
    collection,
    doc,
    addDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';

/**
 * Store a winning response as a training example
 */
export const storeTrainingExample = async (userId, data) => {
    try {
        const exampleData = {
            questionText: data.questionText,
            winningResponse: data.response,
            category: data.category || 'general',
            projectId: data.projectId,
            projectName: data.projectName,
            contractValue: data.contractValue || null,
            tags: data.tags || [],
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(
            collection(db, `users/${userId}/trainingExamples`),
            exampleData
        );

        console.log('[Training] Example stored:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('[Training] Store error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all training examples for a user
 */
export const getTrainingExamples = async (userId) => {
    try {
        const q = query(
            collection(db, `users/${userId}/trainingExamples`),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        return {
            success: true,
            examples: snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
        };
    } catch (error) {
        console.error('[Training] Get error:', error);
        return { success: false, examples: [], error: error.message };
    }
};

/**
 * Get relevant training examples for a question
 * Uses simple keyword matching for relevance
 */
export const getRelevantExamples = async (userId, questionText, maxCount = 3) => {
    try {
        const { success, examples } = await getTrainingExamples(userId);
        if (!success || examples.length === 0) {
            return { success: true, examples: [] };
        }

        // Simple relevance scoring based on word overlap
        const questionWords = new Set(
            questionText.toLowerCase()
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 3)
        );

        const scored = examples.map(example => {
            const exampleWords = new Set(
                example.questionText.toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .split(/\s+/)
                    .filter(w => w.length > 3)
            );

            // Calculate Jaccard similarity
            const intersection = [...questionWords].filter(w => exampleWords.has(w));
            const union = new Set([...questionWords, ...exampleWords]);
            const similarity = intersection.length / union.size;

            return { ...example, similarity };
        });

        // Sort by similarity and return top matches
        const relevant = scored
            .filter(e => e.similarity > 0.1)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxCount);

        return { success: true, examples: relevant };
    } catch (error) {
        console.error('[Training] Relevance error:', error);
        return { success: false, examples: [], error: error.message };
    }
};

/**
 * Delete a training example
 */
export const deleteTrainingExample = async (userId, exampleId) => {
    try {
        await deleteDoc(doc(db, `users/${userId}/trainingExamples`, exampleId));
        return { success: true };
    } catch (error) {
        console.error('[Training] Delete error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Auto-extract training examples from a won project
 */
export const extractExamplesFromProject = async (userId, projectId) => {
    try {
        const projectRef = doc(db, `users/${userId}/projects/${projectId}`);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return { success: false, error: 'Project not found' };
        }

        const project = projectDoc.data();

        if (project.outcome !== 'won') {
            return { success: false, error: 'Project is not marked as won' };
        }

        let extractedCount = 0;

        // Extract answered questions as training examples
        for (const section of (project.sections || [])) {
            for (const question of (section.questions || [])) {
                if (question.response && question.response.length > 50) {
                    await storeTrainingExample(userId, {
                        questionText: question.text,
                        response: question.response,
                        category: section.title || section.name || 'general',
                        projectId,
                        projectName: project.name
                    });
                    extractedCount++;
                }
            }
        }

        return { success: true, extractedCount };
    } catch (error) {
        console.error('[Training] Extract error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get training statistics
 */
export const getTrainingStats = async (userId) => {
    try {
        const { success, examples } = await getTrainingExamples(userId);

        if (!success) {
            return { totalExamples: 0, categories: {}, recentCount: 0 };
        }

        const categories = {};
        let recentCount = 0;
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        examples.forEach(ex => {
            const cat = ex.category || 'general';
            categories[cat] = (categories[cat] || 0) + 1;

            if (ex.createdAt?.toDate?.()?.getTime() > thirtyDaysAgo) {
                recentCount++;
            }
        });

        return {
            totalExamples: examples.length,
            categories,
            recentCount,
            topCategories: Object.entries(categories)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
        };
    } catch (error) {
        console.error('[Training] Stats error:', error);
        return { totalExamples: 0, categories: {}, recentCount: 0 };
    }
};

/**
 * Build training context for AI prompt
 */
export const buildTrainingContext = async (userId, questionText) => {
    const { success, examples } = await getRelevantExamples(userId, questionText, 3);

    if (!success || examples.length === 0) {
        return null;
    }

    let context = `\n\nHere are examples of winning responses from similar questions:\n`;

    examples.forEach((ex, i) => {
        context += `\n--- Example ${i + 1} (from ${ex.projectName || 'previous win'}) ---\n`;
        context += `Question: ${ex.questionText}\n`;
        context += `Winning Response: ${ex.winningResponse}\n`;
    });

    context += `\n--- End of examples ---\n`;
    context += `Use these successful patterns to inform your response style and approach.\n`;

    return context;
};
