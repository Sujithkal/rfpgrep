// AI Generation Service - RAG-powered response generation
// Integrates Answer Library and Knowledge Library for context-aware AI responses

import { getSuggestedAnswers } from './answerLibraryService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Similarity threshold for using Answer Library directly (%)
const ANSWER_LIBRARY_THRESHOLD = 70;

// Similarity threshold for including in context (%)
const CONTEXT_THRESHOLD = 30;

/**
 * Generate AI response with RAG (Retrieval-Augmented Generation)
 * 1. Search Answer Library for matching Q&As
 * 2. Search Knowledge Library for relevant context
 * 3. Generate response using context
 * 
 * @param {string} userId - User ID
 * @param {string} questionText - The RFP question to answer
 * @returns {Promise<{response: string, sources: Array, trustScore: number}>}
 */
export const generateAIResponse = async (userId, questionText) => {
    try {
        // Step 1: Search Answer Library for similar answers
        const answerLibraryResult = await getSuggestedAnswers(userId, questionText, 5);
        const answerMatches = answerLibraryResult.success ? answerLibraryResult.suggestions : [];

        // Step 2: Search Knowledge Library for relevant chunks
        const knowledgeChunks = await searchKnowledgeLocal(userId, questionText, 5);

        // Step 3: Check if we have a strong Answer Library match
        const strongMatch = answerMatches.find(a => a.similarity >= ANSWER_LIBRARY_THRESHOLD);

        if (strongMatch) {
            // Use Answer Library directly - high confidence match
            return {
                response: strongMatch.answer,
                sources: [{
                    type: 'answer_library',
                    question: strongMatch.question,
                    similarity: Math.round(strongMatch.similarity),
                    answerId: strongMatch.id
                }],
                trustScore: Math.min(95, 70 + Math.round(strongMatch.similarity / 4)),
                usedAnswerLibrary: true
            };
        }

        // Step 4: Generate response using context from both libraries
        const contextAnswers = answerMatches.filter(a => a.similarity >= CONTEXT_THRESHOLD);
        const response = generateContextualResponse(questionText, contextAnswers, knowledgeChunks);

        // Build sources list
        const sources = [];

        if (contextAnswers.length > 0) {
            sources.push({
                type: 'answer_library',
                count: contextAnswers.length,
                topMatch: contextAnswers[0]?.question,
                similarity: Math.round(contextAnswers[0]?.similarity || 0)
            });
        }

        if (knowledgeChunks.length > 0) {
            sources.push({
                type: 'knowledge_library',
                count: knowledgeChunks.length,
                documents: [...new Set(knowledgeChunks.map(c => c.fileName))]
            });
        }

        // Calculate trust score based on source quality
        const trustScore = calculateTrustScoreFromSources(contextAnswers, knowledgeChunks);

        return {
            response,
            sources,
            trustScore,
            usedAnswerLibrary: contextAnswers.length > 0,
            usedKnowledgeLibrary: knowledgeChunks.length > 0
        };

    } catch (error) {
        console.error('AI Generation error:', error);
        // Fallback to basic response
        return {
            response: generateFallbackResponse(questionText),
            sources: [],
            trustScore: 50,
            error: error.message
        };
    }
};

/**
 * Search Knowledge Library locally (when Cloud Function unavailable)
 * Performs keyword-based search on stored knowledge chunks
 */
export const searchKnowledgeLocal = async (userId, query, limit = 5) => {
    try {
        const chunksRef = collection(db, `users/${userId}/knowledgeChunks`);
        const snapshot = await getDocs(chunksRef);

        if (snapshot.empty) {
            return [];
        }

        // Extract keywords from query
        const queryWords = query.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 3)
            .filter(w => !STOP_WORDS.has(w));

        // Score each chunk by keyword matches
        const scored = snapshot.docs.map(doc => {
            const data = doc.data();
            const text = (data.text || '').toLowerCase();

            let score = 0;
            queryWords.forEach(word => {
                if (text.includes(word)) {
                    score += 1;
                }
            });

            return {
                id: doc.id,
                text: data.text,
                fileName: data.fileName || 'Unknown Document',
                score: queryWords.length > 0 ? (score / queryWords.length) * 100 : 0
            };
        });

        // Return top matches with score > 0
        return scored
            .filter(c => c.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

    } catch (error) {
        console.error('Local knowledge search error:', error);
        return [];
    }
};

/**
 * Generate response using available context
 */
const generateContextualResponse = (question, answerMatches, knowledgeChunks) => {
    const parts = [];

    // If we have Answer Library context, use it
    if (answerMatches.length > 0) {
        const topAnswer = answerMatches[0];
        parts.push(topAnswer.answer);
    }

    // If we have Knowledge Library context, incorporate key points
    if (knowledgeChunks.length > 0 && parts.length === 0) {
        // Extract relevant sentences from knowledge chunks
        const relevantInfo = knowledgeChunks
            .slice(0, 2)
            .map(chunk => {
                // Get first 2 sentences from each chunk
                const sentences = chunk.text.split(/[.!?]+/).slice(0, 2);
                return sentences.join('. ').trim();
            })
            .filter(s => s.length > 20)
            .join('\n\n');

        if (relevantInfo) {
            parts.push(relevantInfo);
        }
    }

    // If we still have no content, generate a placeholder
    if (parts.length === 0) {
        return generateFallbackResponse(question);
    }

    return parts.join('\n\n');
};

/**
 * Calculate trust score based on source quality
 */
const calculateTrustScoreFromSources = (answerMatches, knowledgeChunks) => {
    let score = 50; // Base score

    // Boost for Answer Library matches
    if (answerMatches.length > 0) {
        const topSimilarity = answerMatches[0].similarity;
        score += Math.min(25, topSimilarity / 4);
    }

    // Boost for Knowledge Library matches
    if (knowledgeChunks.length > 0) {
        score += Math.min(15, knowledgeChunks.length * 3);
    }

    // Additional boost for multiple sources
    if (answerMatches.length > 0 && knowledgeChunks.length > 0) {
        score += 5; // Corroborated by multiple sources
    }

    return Math.min(95, Math.round(score));
};

/**
 * Generate fallback response when no context available
 */
const generateFallbackResponse = (question) => {
    const questionLower = question.toLowerCase();

    // Security-related questions
    if (questionLower.includes('security') || questionLower.includes('compliance') || questionLower.includes('certification')) {
        return "Our organization maintains comprehensive security certifications including SOC 2 Type II compliance. We implement industry-leading security measures such as AES-256 encryption for data at rest and TLS 1.3 for data in transit. All employees undergo regular security awareness training, and we conduct annual third-party security audits.\n\n[Note: Please update this response with your specific certifications and security practices in the Answer Library.]";
    }

    // Experience-related questions
    if (questionLower.includes('experience') || questionLower.includes('history') || questionLower.includes('years')) {
        return "Our organization brings extensive experience in delivering enterprise-level solutions. Our team consists of seasoned professionals with deep domain expertise and a proven track record of successful implementations across multiple industries.\n\n[Note: Please add your specific company history and experience details to the Answer Library for more accurate responses.]";
    }

    // Team-related questions
    if (questionLower.includes('team') || questionLower.includes('staff') || questionLower.includes('personnel')) {
        return "We maintain a highly qualified team of professionals with relevant industry certifications and extensive hands-on experience. Our organizational structure ensures dedicated resources for each engagement, with clear escalation paths and executive sponsorship.\n\n[Note: Add your team details to the Answer Library to personalize this response.]";
    }

    // Default response
    return "Our organization is well-positioned to meet this requirement. We have the necessary expertise, resources, and commitment to deliver exceptional results.\n\n[Note: No matching content found in Answer Library or Knowledge Library. Consider adding relevant information to improve future responses.]";
};

// Common stop words to exclude from search
const STOP_WORDS = new Set([
    'the', 'and', 'for', 'that', 'this', 'with', 'have', 'your', 'from',
    'what', 'how', 'does', 'can', 'will', 'please', 'describe', 'provide',
    'explain', 'about', 'which', 'their', 'been', 'being', 'would', 'could',
    'should', 'into', 'more', 'other', 'some', 'such', 'than', 'them', 'then',
    'these', 'they', 'were', 'when', 'where', 'who', 'also', 'each', 'only'
]);

/**
 * Check if user has any knowledge content
 */
export const hasKnowledgeContent = async (userId) => {
    try {
        const chunksRef = collection(db, `users/${userId}/knowledgeChunks`);
        const snapshot = await getDocs(chunksRef);
        return snapshot.size > 0;
    } catch (error) {
        return false;
    }
};

/**
 * Check if user has any Answer Library content
 */
export const hasAnswerLibraryContent = async (userId) => {
    try {
        const answersRef = collection(db, `users/${userId}/answerLibrary`);
        const snapshot = await getDocs(answersRef);
        return snapshot.size > 0;
    } catch (error) {
        return false;
    }
};
