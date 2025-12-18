/**
 * Translation Service
 * Translates RFP responses to different languages
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Available languages for translation
 */
export const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
];

/**
 * Translate text to target language using Cloud Function
 */
export const translateText = async (text, targetLang) => {
    try {
        // Use Cloud Function for translation
        const generateResponse = httpsCallable(functions, 'generateAIResponse');
        const targetLanguage = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

        const result = await generateResponse({
            questionText: `Translate the following text to ${targetLanguage}. Keep the professional tone and formatting. Only return the translated text, nothing else.\n\nText to translate:\n${text}`,
            actionType: 'translate'
        });

        return result.data?.response || result.data?.text || text;
    } catch (error) {
        console.error('Translation error:', error);
        throw new Error('Translation failed. Please try again.');
    }
};

/**
 * Translate multiple texts at once
 */
export const translateBatch = async (texts, targetLang) => {
    const results = [];
    for (const text of texts) {
        try {
            const translated = await translateText(text, targetLang);
            results.push({ original: text, translated, success: true });
        } catch (error) {
            results.push({ original: text, translated: null, success: false, error: error.message });
        }
    }
    return results;
};

/**
 * Get language by code
 */
export const getLanguageByCode = (code) => {
    return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
};

/**
 * Translate an entire project's answers
 */
export const translateProject = async (sections, targetLang, onProgress) => {
    const translatedSections = JSON.parse(JSON.stringify(sections));
    let completed = 0;
    let total = 0;

    // Count total answers
    sections.forEach(section => {
        section.questions?.forEach(q => {
            if (q.response) total++;
        });
    });

    // Translate each answer
    for (let s = 0; s < translatedSections.length; s++) {
        const section = translatedSections[s];
        for (let q = 0; q < (section.questions?.length || 0); q++) {
            const question = section.questions[q];
            if (question.response) {
                try {
                    question.response = await translateText(question.response, targetLang);
                    question.translatedTo = targetLang;
                    completed++;
                    if (onProgress) onProgress(completed, total);
                } catch (error) {
                    console.error(`Failed to translate question ${q}:`, error);
                }
            }
        }
    }

    return translatedSections;
};
