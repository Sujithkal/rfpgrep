import { createContext, useContext, useState, useEffect } from 'react';
import { getTranslations, LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext();

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export function LanguageProvider({ children }) {
    // Get saved language from localStorage or default to English
    const [language, setLanguageState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('app_language') || 'en';
        }
        return 'en';
    });

    const [translations, setTranslations] = useState(getTranslations(language));

    // Update translations when language changes
    useEffect(() => {
        setTranslations(getTranslations(language));
        localStorage.setItem('app_language', language);
        // Update document language attribute
        document.documentElement.lang = language;
    }, [language]);

    // Set language
    const setLanguage = (langCode) => {
        if (LANGUAGES.find(l => l.code === langCode)) {
            setLanguageState(langCode);
        }
    };

    // Translation function
    const t = (key) => {
        const keys = key.split('.');
        let result = translations;

        for (const k of keys) {
            result = result?.[k];
        }

        return result || key;
    };

    const value = {
        language,
        setLanguage,
        translations,
        t,
        languages: LANGUAGES
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export default LanguageContext;
