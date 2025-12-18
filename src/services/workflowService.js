/**
 * Workflow Service
 * Handles customizable approval workflows for RFP responses
 */

import { db } from './firebase';
import {
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Default workflow stages
 */
export const DEFAULT_WORKFLOW_STAGES = [
    { id: 'draft', name: 'Draft', color: 'gray', order: 1 },
    { id: 'in_review', name: 'In Review', color: 'yellow', order: 2 },
    { id: 'approved', name: 'Approved', color: 'green', order: 3 },
    { id: 'final', name: 'Final', color: 'blue', order: 4 }
];

/**
 * Stage color mappings for UI
 */
export const STAGE_COLORS = {
    gray: {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
        dot: 'bg-gray-400'
    },
    yellow: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-300 dark:border-yellow-700',
        dot: 'bg-yellow-400'
    },
    green: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-300 dark:border-green-700',
        dot: 'bg-green-400'
    },
    blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-700',
        dot: 'bg-blue-400'
    },
    purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-300 dark:border-purple-700',
        dot: 'bg-purple-400'
    },
    red: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700',
        dot: 'bg-red-400'
    }
};

/**
 * Update question workflow status
 */
export const updateQuestionStatus = async (userId, projectId, sectionIndex, questionIndex, newStatus, approver = null) => {
    try {
        const projectRef = doc(db, `users/${userId}/projects`, projectId);

        // Build the update object with workflow history
        const statusUpdate = {
            status: newStatus,
            statusUpdatedAt: serverTimestamp(),
            statusUpdatedBy: approver
        };


        // For approved status, add approval info
        if (newStatus === 'approved' && approver) {
            statusUpdate.approvedBy = approver;
            statusUpdate.approvedAt = serverTimestamp();
        }

        // Update would be done through projectService.updateProjectQuestion
        // Just return the status update object for now
        return statusUpdate;
    } catch (error) {
        console.error('Error updating question status:', error);
        throw error;
    }
};

/**
 * Get workflow progress for a project
 */
export const getWorkflowProgress = (sections) => {
    const stages = {
        draft: 0,
        in_review: 0,
        approved: 0,
        final: 0
    };

    let total = 0;

    sections?.forEach(section => {
        section.questions?.forEach(question => {
            total++;
            const status = question.workflowStatus || question.status || 'draft';
            if (stages.hasOwnProperty(status)) {
                stages[status]++;
            } else {
                stages.draft++;
            }
        });
    });

    return {
        stages,
        total,
        percentages: {
            draft: total > 0 ? Math.round((stages.draft / total) * 100) : 0,
            in_review: total > 0 ? Math.round((stages.in_review / total) * 100) : 0,
            approved: total > 0 ? Math.round((stages.approved / total) * 100) : 0,
            final: total > 0 ? Math.round((stages.final / total) * 100) : 0
        }
    };
};

/**
 * Check if user can approve based on role
 */
export const canApprove = (userRole) => {
    return ['admin', 'approver', 'owner'].includes(userRole);
};

/**
 * Get next workflow stage
 */
export const getNextStage = (currentStage) => {
    const stageOrder = ['draft', 'in_review', 'approved', 'final'];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === stageOrder.length - 1) {
        return null;
    }
    return stageOrder[currentIndex + 1];
};

/**
 * Get previous workflow stage
 */
export const getPreviousStage = (currentStage) => {
    const stageOrder = ['draft', 'in_review', 'approved', 'final'];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex <= 0) {
        return null;
    }
    return stageOrder[currentIndex - 1];
};
