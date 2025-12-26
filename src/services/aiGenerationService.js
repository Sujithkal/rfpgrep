// AI Generation Service - RAG-powered response generation
// Integrates Answer Library, Knowledge Library, and Training Data for context-aware AI responses

import { getSuggestedAnswers } from './answerLibraryService';
import { buildTrainingContext } from './trainingDataService';
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

        // Step 3: Get training context from winning responses
        let trainingContext = null;
        try {
            trainingContext = await buildTrainingContext(userId, questionText);
        } catch (e) {
            console.log('Training context not available:', e.message);
        }

        // Step 4: Check if we have a strong Answer Library match
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

        // Step 5: Generate response using context from all sources
        const contextAnswers = answerMatches.filter(a => a.similarity >= CONTEXT_THRESHOLD);
        const response = await generateContextualResponse(questionText, contextAnswers, knowledgeChunks, trainingContext);

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
 * Generate response using available context - calls Gemini AI to synthesize answer
 */
const generateContextualResponse = async (question, answerMatches, knowledgeChunks, trainingContext = null) => {
    console.log('generateContextualResponse called:', {
        question: question.substring(0, 50) + '...',
        answerMatchesCount: answerMatches.length,
        knowledgeChunksCount: knowledgeChunks.length,
        hasTrainingContext: !!trainingContext
    });

    // If we have Answer Library context with high similarity, use it directly
    if (answerMatches.length > 0 && answerMatches[0].similarity >= 60) {
        console.log('Using high-similarity Answer Library match');
        return answerMatches[0].answer;
    }

    // Build context from knowledge chunks
    const knowledgeContext = knowledgeChunks
        .slice(0, 3)
        .map(chunk => chunk.text)
        .join('\n\n');

    // Build context from answer library (lower similarity matches)
    const answerContext = answerMatches
        .slice(0, 2)
        .map(a => `Q: ${a.question}\nA: ${a.answer}`)
        .join('\n\n');

    console.log('Context built:', {
        hasKnowledgeContext: !!knowledgeContext,
        knowledgeContextLength: knowledgeContext?.length || 0,
        hasAnswerContext: !!answerContext,
        hasTrainingContext: !!trainingContext
    });

    // If we have context, use Gemini to synthesize a proper answer
    if (knowledgeContext || answerContext || trainingContext) {
        try {
            console.log('Calling Gemini Cloud Function...');
            const { httpsCallable } = await import('firebase/functions');
            const { functions } = await import('./firebase');

            const generateResponse = httpsCallable(functions, 'generateAIResponse');

            const prompt = `You are an RFP response writer. Based on the following company information, write a professional, concise response to this RFP question.

QUESTION: ${question}

${knowledgeContext ? `COMPANY KNOWLEDGE BASE:\n${knowledgeContext}\n` : ''}
${answerContext ? `SIMILAR PAST ANSWERS:\n${answerContext}\n` : ''}
${trainingContext ? `WINNING RESPONSE PATTERNS:\n${trainingContext}\n` : ''}

INSTRUCTIONS:
1. Write a direct, professional answer to the question
2. Use specific facts and figures from the provided context
3. Keep the response concise (2-4 sentences unless more detail is needed)
4. Write in first person plural ("We", "Our organization")
5. Do NOT include markdown headers or bullet points unless specifically asked
6. Do NOT copy the context verbatim - synthesize it into a natural response
${trainingContext ? '7. Learn from the winning response patterns - adopt similar tone and structure' : ''}

RESPONSE:`;

            const result = await generateResponse({
                questionText: prompt,
                actionType: 'generate',
                tone: 'professional'
            });

            console.log('Gemini Cloud Function result:', {
                success: !!result.data?.response,
                responseLength: result.data?.response?.length || 0
            });

            if (result.data?.response) {
                return result.data.response;
            }
        } catch (error) {
            console.error('Gemini synthesis error - DETAILS:', {
                message: error.message,
                code: error.code,
                details: error.details
            });
            // Fall back to extracting key info from context
        }
    }

    // Fallback: Extract key sentences from knowledge chunks (IMPROVED)
    console.log('Falling back to extractRelevantSentences');
    if (knowledgeChunks.length > 0) {
        const relevantInfo = extractRelevantSentences(question, knowledgeChunks);
        if (relevantInfo) {
            return relevantInfo;
        }
    }

    // Last resort: use fallback response
    console.log('Using fallback response (no context found)');
    return generateFallbackResponse(question);
};

/**
 * Extract relevant sentences from knowledge chunks based on question keywords
 */
const extractRelevantSentences = (question, knowledgeChunks) => {
    const questionWords = question.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4)
        .filter(w => !STOP_WORDS.has(w));

    const allSentences = [];

    knowledgeChunks.forEach(chunk => {
        const sentences = chunk.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        sentences.forEach(sentence => {
            const sentenceLower = sentence.toLowerCase();
            let score = 0;
            questionWords.forEach(word => {
                if (sentenceLower.includes(word)) score++;
            });
            if (score > 0) {
                allSentences.push({ sentence: sentence.trim(), score });
            }
        });
    });

    // Sort by relevance and take top 3 sentences
    const topSentences = allSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(s => s.sentence);

    if (topSentences.length > 0) {
        return topSentences.join('. ') + '.';
    }

    return null;
};

/**
 * Calculate trust score based on source quality
 */
const calculateTrustScoreFromSources = (answerMatches, knowledgeChunks) => {
    let score = 55; // Base score (slightly higher since we're using real AI)

    // Boost for Answer Library matches
    if (answerMatches.length > 0) {
        const topSimilarity = answerMatches[0].similarity;
        score += Math.min(25, topSimilarity / 3); // Increased from /4
    }

    // Boost for Knowledge Library matches (increased since AI synthesizes well)
    if (knowledgeChunks.length > 0) {
        score += Math.min(25, knowledgeChunks.length * 5); // Increased from 15 max to 25 max
    }

    // Additional boost for multiple sources
    if (answerMatches.length > 0 && knowledgeChunks.length > 0) {
        score += 10; // Corroborated by multiple sources (increased from 5)
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
