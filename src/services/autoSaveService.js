/**
 * Auto-Save Service
 * Prevents data loss by automatically saving edits to localStorage and Firebase
 */

const AUTOSAVE_KEY_PREFIX = 'rfpgrep_autosave_';
const LOCAL_SAVE_INTERVAL = 10000; // 10 seconds
const FIREBASE_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Get localStorage key for a question
 */
const getLocalKey = (projectId, sectionIndex, questionIndex) => {
    return `${AUTOSAVE_KEY_PREFIX}${projectId}_${sectionIndex}_${questionIndex}`;
};

/**
 * Save draft to localStorage
 */
export const saveToLocal = (projectId, sectionIndex, questionIndex, content) => {
    try {
        const key = getLocalKey(projectId, sectionIndex, questionIndex);
        const data = {
            content,
            savedAt: new Date().toISOString(),
            projectId,
            sectionIndex,
            questionIndex
        };
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
};

/**
 * Get draft from localStorage
 */
export const getLocalDraft = (projectId, sectionIndex, questionIndex) => {
    try {
        const key = getLocalKey(projectId, sectionIndex, questionIndex);
        const data = localStorage.getItem(key);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
};

/**
 * Clear local draft
 */
export const clearLocalDraft = (projectId, sectionIndex, questionIndex) => {
    try {
        const key = getLocalKey(projectId, sectionIndex, questionIndex);
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
};

/**
 * Check for unsaved drafts for a project
 */
export const getUnsavedDrafts = (projectId) => {
    const drafts = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(`${AUTOSAVE_KEY_PREFIX}${projectId}`)) {
                const data = JSON.parse(localStorage.getItem(key));
                if (data) {
                    drafts.push(data);
                }
            }
        }
    } catch (error) {
        console.error('Error getting unsaved drafts:', error);
    }
    return drafts;
};

/**
 * Clear all drafts for a project
 */
export const clearProjectDrafts = (projectId) => {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(`${AUTOSAVE_KEY_PREFIX}${projectId}`)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
        console.error('Error clearing project drafts:', error);
    }
};

/**
 * Create an auto-save manager for a question
 * Returns an object with start, stop, and save methods
 */
export const createAutoSaveManager = (options) => {
    const {
        projectId,
        sectionIndex,
        questionIndex,
        onLocalSave,
        onFirebaseSave,
        getContent // Function that returns current content
    } = options;

    let localInterval = null;
    let firebaseInterval = null;
    let lastSavedContent = '';
    let isRunning = false;

    const saveToLocalStorage = () => {
        const content = getContent();
        if (content !== lastSavedContent) {
            saveToLocal(projectId, sectionIndex, questionIndex, content);
            onLocalSave?.();
        }
    };

    const saveToFirebase = async () => {
        const content = getContent();
        if (content !== lastSavedContent) {
            try {
                await onFirebaseSave?.(content);
                lastSavedContent = content;
                // Clear local draft after successful Firebase save
                clearLocalDraft(projectId, sectionIndex, questionIndex);
            } catch (error) {
                console.error('Firebase auto-save failed:', error);
                // Keep local draft as backup
            }
        }
    };

    return {
        start: () => {
            if (isRunning) return;
            isRunning = true;
            lastSavedContent = getContent();

            // Start intervals
            localInterval = setInterval(saveToLocalStorage, LOCAL_SAVE_INTERVAL);
            firebaseInterval = setInterval(saveToFirebase, FIREBASE_SAVE_INTERVAL);
        },

        stop: () => {
            isRunning = false;
            if (localInterval) clearInterval(localInterval);
            if (firebaseInterval) clearInterval(firebaseInterval);
        },

        saveNow: async () => {
            await saveToFirebase();
        },

        isRunning: () => isRunning
    };
};

/**
 * Check if there are any unsaved changes when navigating away
 */
export const checkUnsavedChanges = (currentContent, lastSavedContent) => {
    return currentContent !== lastSavedContent;
};

/**
 * Show recovery dialog if unsaved drafts exist
 */
export const shouldShowRecoveryDialog = (projectId, currentQuestions) => {
    const drafts = getUnsavedDrafts(projectId);
    if (drafts.length === 0) return null;

    // Check if any drafts differ from current content
    const recoverable = drafts.filter(draft => {
        const currentQ = currentQuestions?.[draft.sectionIndex]?.questions?.[draft.questionIndex];
        return currentQ && currentQ.response !== draft.content;
    });

    return recoverable.length > 0 ? recoverable : null;
};
