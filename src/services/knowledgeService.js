// Knowledge Service - Frontend interface for RAG search
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Search knowledge base for relevant chunks
 * Calls the searchKnowledge Cloud Function
 */
export const searchKnowledge = async (query, limit = 5) => {
    try {
        const searchKnowledgeFn = httpsCallable(functions, 'searchKnowledge');
        const result = await searchKnowledgeFn({ query, limit });
        return result.data;
    } catch (error) {
        console.error('Knowledge search error:', error);
        // Fallback to local search if Cloud Function fails
        return { success: false, chunks: [], error: error.message };
    }
};

/**
 * Get all knowledge documents metadata for a user
 */
export const getKnowledgeDocuments = async (userId) => {
    try {
        const metaRef = collection(db, `users/${userId}/knowledgeMeta`);
        const snapshot = await getDocs(metaRef);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading knowledge metadata:', error);
        return [];
    }
};

/**
 * Get knowledge chunks count for a user
 */
export const getKnowledgeStats = async (userId) => {
    try {
        const chunksRef = collection(db, `users/${userId}/knowledgeChunks`);
        const snapshot = await getDocs(chunksRef);

        return {
            totalChunks: snapshot.size,
            ready: true
        };
    } catch (error) {
        console.error('Error loading knowledge stats:', error);
        return { totalChunks: 0, ready: false };
    }
};

/**
 * Format knowledge chunks for AI prompt context
 */
export const formatKnowledgeForPrompt = (chunks) => {
    if (!chunks || chunks.length === 0) return '';

    return chunks.map((chunk, i) =>
        `[Source ${i + 1}: ${chunk.fileName}]\n${chunk.text}`
    ).join('\n\n');
};
