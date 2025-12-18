/**
 * Onboarding Service
 * Handles interactive tutorials and personalized tips
 */

import { db } from './firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Onboarding steps
 */
export const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to RFPgrep! 🎉',
        description: 'Let\'s get you started with a quick tour.',
        target: null, // No specific element
        position: 'center'
    },
    {
        id: 'upload',
        title: 'Upload Your First RFP',
        description: 'Click here to upload a PDF or Word document containing your RFP questions.',
        target: '[data-tour="upload-button"]',
        position: 'bottom'
    },
    {
        id: 'dashboard',
        title: 'Your Dashboard',
        description: 'See all your RFPs at a glance. Track progress and manage deadlines.',
        target: '[data-tour="rfp-list"]',
        position: 'right'
    },
    {
        id: 'editor',
        title: 'The Editor',
        description: 'Answer questions one by one. Use AI to generate responses instantly.',
        target: '[data-tour="editor"]',
        position: 'top'
    },
    {
        id: 'generate',
        title: 'AI Generation',
        description: 'Click "Generate" to let AI draft an answer. You can edit it afterwards.',
        target: '[data-tour="generate-button"]',
        position: 'left'
    },
    {
        id: 'knowledge',
        title: 'Knowledge Base',
        description: 'Add your company info here. AI uses this to personalize answers.',
        target: '[data-tour="knowledge-link"]',
        position: 'bottom'
    },
    {
        id: 'export',
        title: 'Export When Done',
        description: 'Export to PDF or Word when you\'re ready to submit.',
        target: '[data-tour="export-button"]',
        position: 'bottom'
    },
    {
        id: 'complete',
        title: 'You\'re Ready! 🚀',
        description: 'That\'s the basics! Explore more features in Settings.',
        target: null,
        position: 'center'
    }
];

/**
 * Tips for contextual help
 */
export const CONTEXTUAL_TIPS = {
    dashboard: [
        { id: 'tip1', text: 'Pro tip: Upload multiple RFPs at once by selecting multiple files.' },
        { id: 'tip2', text: 'Set deadlines on your RFPs to get reminder notifications.' },
        { id: 'tip3', text: 'Use the search bar to quickly find questions across all RFPs.' }
    ],
    editor: [
        { id: 'tip4', text: 'Keyboard shortcut: Press Tab to move to the next question.' },
        { id: 'tip5', text: 'Click the trust score to see how the AI rated its own answer.' },
        { id: 'tip6', text: 'Use "Suggest" to find similar answers from your Answer Library.' }
    ],
    knowledge: [
        { id: 'tip7', text: 'Add your company capabilities, certifications, and case studies.' },
        { id: 'tip8', text: 'More knowledge = better AI responses.' }
    ]
};

/**
 * Get current onboarding step for user
 */
export const getOnboardingProgress = (userData) => {
    return {
        completed: userData?.onboarding?.completed || false,
        currentStep: userData?.onboarding?.currentStep || 0,
        skipped: userData?.onboarding?.skipped || false
    };
};

/**
 * Update onboarding progress
 */
export const updateOnboardingProgress = async (userId, step, completed = false) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            'onboarding.currentStep': step,
            'onboarding.completed': completed,
            'onboarding.lastUpdated': serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating onboarding:', error);
    }
};

/**
 * Skip onboarding
 */
export const skipOnboarding = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            'onboarding.skipped': true,
            'onboarding.completed': true,
            'onboarding.lastUpdated': serverTimestamp()
        });
    } catch (error) {
        console.error('Error skipping onboarding:', error);
    }
};

/**
 * Reset onboarding (for testing or re-touring)
 */
export const resetOnboarding = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            'onboarding.currentStep': 0,
            'onboarding.completed': false,
            'onboarding.skipped': false,
            'onboarding.lastUpdated': serverTimestamp()
        });
    } catch (error) {
        console.error('Error resetting onboarding:', error);
    }
};

/**
 * Get random tip for a page
 */
export const getRandomTip = (page) => {
    const tips = CONTEXTUAL_TIPS[page] || CONTEXTUAL_TIPS.dashboard;
    return tips[Math.floor(Math.random() * tips.length)];
};

/**
 * Check if user should see onboarding
 */
export const shouldShowOnboarding = (userData) => {
    const progress = getOnboardingProgress(userData);
    return !progress.completed && !progress.skipped;
};
