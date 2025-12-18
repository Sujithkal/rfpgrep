import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Call Cloud Function to generate AI response
 */
export const generateAIResponse = async (data) => {
    try {
        const generateResponse = httpsCallable(functions, 'generateAIResponse');
        const result = await generateResponse(data);
        return result.data;
    } catch (error) {
        console.error('AI Generation Error:', error);
        throw error;
    }
};

/**
 * AI Actions
 */
export const aiActions = {
    // Generate new response
    generate: async (questionText, knowledgeBase = [], tone = 'professional') => {
        return await generateAIResponse({
            questionText,
            knowledgeBase,
            tone,
            actionType: 'generate'
        });
    },

    // Shorten existing text
    shorten: async (text) => {
        return await generateAIResponse({
            questionText: text,
            actionType: 'shorten'
        });
    },

    // Expand existing text
    expand: async (text) => {
        return await generateAIResponse({
            questionText: text,
            actionType: 'expand'
        });
    },

    // Rewrite text
    rewrite: async (text, tone = 'professional') => {
        return await generateAIResponse({
            questionText: text,
            tone,
            actionType: 'rewrite'
        });
    },

    // Simplify text
    simplify: async (text) => {
        return await generateAIResponse({
            questionText: text,
            actionType: 'simplify'
        });
    },

    // Fix grammar
    fixGrammar: async (text) => {
        return await generateAIResponse({
            questionText: text,
            actionType: 'grammar'
        });
    }
};
