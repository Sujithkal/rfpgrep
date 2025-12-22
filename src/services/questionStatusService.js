/**
 * Question Status Service
 * Manages question status workflow: draft → review → approved
 * Handles locking, assignment, and status transitions
 */

import {
    doc,
    getDoc,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Status constants
export const QUESTION_STATUS = {
    UNASSIGNED: 'unassigned',
    DRAFT: 'draft',
    REVIEW: 'review',
    APPROVED: 'approved'
};

// Status display configuration
export const STATUS_CONFIG = {
    unassigned: {
        label: 'Unassigned',
        color: 'bg-gray-100 text-gray-600',
        icon: '⚪',
        description: 'No one assigned yet'
    },
    draft: {
        label: 'Draft',
        color: 'bg-blue-100 text-blue-700',
        icon: '📝',
        description: 'Being worked on'
    },
    review: {
        label: 'Review',
        color: 'bg-yellow-100 text-yellow-700',
        icon: '👀',
        description: 'Waiting for approval'
    },
    approved: {
        label: 'Approved',
        color: 'bg-green-100 text-green-700',
        icon: '✅',
        description: 'Ready for export'
    }
};

// Lock duration in milliseconds (5 minutes)
const LOCK_DURATION_MS = 5 * 60 * 1000;

/**
 * Check if a question is currently locked by another user
 */
export const isQuestionLocked = (question, currentUserEmail) => {
    if (!question.lockedBy || question.lockedBy === currentUserEmail) {
        return { locked: false };
    }

    const lockTime = question.lockedAt?.toDate?.() || new Date(question.lockedAt);
    const now = new Date();
    const elapsed = now - lockTime;

    if (elapsed > LOCK_DURATION_MS) {
        // Lock expired
        return { locked: false, expired: true };
    }

    const remainingSeconds = Math.ceil((LOCK_DURATION_MS - elapsed) / 1000);
    return {
        locked: true,
        lockedBy: question.lockedBy,
        remainingSeconds,
        remainingFormatted: formatLockTime(remainingSeconds)
    };
};

/**
 * Format remaining lock time
 */
const formatLockTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Acquire a lock on a question for editing
 */
export const acquireQuestionLock = async (teamId, projectId, sectionIndex, questionIndex, userEmail) => {
    try {
        const projectRef = doc(db, `users/${teamId}/projects`, projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error('Project not found');
        }

        const project = projectSnap.data();
        const question = project.sections?.[sectionIndex]?.questions?.[questionIndex];

        if (!question) {
            throw new Error('Question not found');
        }

        // Check if already locked by someone else
        const lockStatus = isQuestionLocked(question, userEmail);
        if (lockStatus.locked) {
            throw new Error(`Question is being edited by ${lockStatus.lockedBy} (${lockStatus.remainingFormatted} remaining)`);
        }

        // Acquire lock
        const sections = [...project.sections];
        sections[sectionIndex].questions[questionIndex] = {
            ...question,
            lockedBy: userEmail,
            lockedAt: new Date().toISOString() // Can't use serverTimestamp inside arrays
        };

        await updateDoc(projectRef, { sections });
        return { success: true };
    } catch (error) {
        console.error('Error acquiring lock:', error);
        throw error;
    }
};

/**
 * Release a lock on a question
 */
export const releaseQuestionLock = async (teamId, projectId, sectionIndex, questionIndex, userEmail) => {
    try {
        const projectRef = doc(db, `users/${teamId}/projects`, projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) return;

        const project = projectSnap.data();
        const question = project.sections?.[sectionIndex]?.questions?.[questionIndex];

        // Only release if current user holds the lock
        if (question?.lockedBy !== userEmail) return;

        const sections = [...project.sections];
        sections[sectionIndex].questions[questionIndex] = {
            ...question,
            lockedBy: null,
            lockedAt: null
        };

        await updateDoc(projectRef, { sections });
    } catch (error) {
        console.error('Error releasing lock:', error);
    }
};

/**
 * Update question status
 */
export const updateQuestionStatus = async (teamId, projectId, sectionIndex, questionIndex, newStatus, userEmail) => {
    try {
        const projectRef = doc(db, `users/${teamId}/projects`, projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error('Project not found');
        }

        const project = projectSnap.data();
        const question = project.sections?.[sectionIndex]?.questions?.[questionIndex];

        if (!question) {
            throw new Error('Question not found');
        }

        // Validate status transition
        validateStatusTransition(question.status || 'unassigned', newStatus);

        const sections = [...project.sections];
        const updatedQuestion = {
            ...question,
            status: newStatus,
            statusUpdatedAt: new Date().toISOString(),
            statusUpdatedBy: userEmail
        };

        // Add approval info if approving
        if (newStatus === QUESTION_STATUS.APPROVED) {
            updatedQuestion.approvedBy = userEmail;
            updatedQuestion.approvedAt = new Date().toISOString();
        }

        // Clear approval if moving back to draft
        if (newStatus === QUESTION_STATUS.DRAFT) {
            updatedQuestion.approvedBy = null;
            updatedQuestion.approvedAt = null;
        }

        sections[sectionIndex].questions[questionIndex] = updatedQuestion;
        await updateDoc(projectRef, { sections });

        return { success: true, newStatus };
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
};

/**
 * Validate status transitions
 */
const validateStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
        unassigned: ['draft'],
        draft: ['review'],
        review: ['draft', 'approved'],
        approved: ['draft'] // Admin can unlock approved questions
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
        throw new Error(`Cannot transition from "${currentStatus}" to "${newStatus}"`);
    }
};

/**
 * Assign a question to a team member (enhanced version)
 */
export const assignQuestionToMember = async (teamId, projectId, sectionIndex, questionIndex, assigneeEmail, assignedByEmail) => {
    try {
        const projectRef = doc(db, `users/${teamId}/projects`, projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error('Project not found');
        }

        const project = projectSnap.data();
        const sections = [...project.sections];
        const question = sections[sectionIndex]?.questions?.[questionIndex];

        if (!question) {
            throw new Error('Question not found');
        }

        // Update assignment
        sections[sectionIndex].questions[questionIndex] = {
            ...question,
            assignedTo: assigneeEmail,
            assignedBy: assignedByEmail,
            assignedAt: new Date().toISOString(), // Can't use serverTimestamp inside arrays
            status: question.status === 'unassigned' ? 'draft' : question.status
        };

        await updateDoc(projectRef, { sections });
        return { success: true };
    } catch (error) {
        console.error('Error assigning question:', error);
        throw error;
    }
};

/**
 * Unassign a question (when member is removed)
 */
export const unassignQuestion = async (teamId, projectId, sectionIndex, questionIndex) => {
    try {
        const projectRef = doc(db, `users/${teamId}/projects`, projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) return;

        const project = projectSnap.data();
        const sections = [...project.sections];
        const question = sections[sectionIndex]?.questions?.[questionIndex];

        if (!question) return;

        // Keep content but remove assignment
        sections[sectionIndex].questions[questionIndex] = {
            ...question,
            assignedTo: null,
            assignedBy: null,
            assignedAt: null,
            status: 'unassigned'
        };

        await updateDoc(projectRef, { sections });
    } catch (error) {
        console.error('Error unassigning question:', error);
    }
};

/**
 * Check if user can edit a specific question
 */
export const canUserEditQuestion = (question, userEmail, teamRole) => {
    // Admins and owners can edit any question
    if (['owner', 'admin'].includes(teamRole)) {
        return { canEdit: true };
    }

    // Viewers can't edit
    if (teamRole === 'viewer') {
        return { canEdit: false, reason: 'Viewers cannot edit' };
    }

    // Editors can only edit assigned questions
    if (teamRole === 'editor') {
        if (!question.assignedTo) {
            return { canEdit: false, reason: 'Question not assigned to you' };
        }
        if (question.assignedTo !== userEmail) {
            return { canEdit: false, reason: `Assigned to ${question.assignedTo}` };
        }
        if (question.status === 'approved') {
            return { canEdit: false, reason: 'Already approved - contact admin to unlock' };
        }
        return { canEdit: true };
    }

    return { canEdit: false, reason: 'Unknown role' };
};

/**
 * Get status statistics for a project
 */
export const getProjectStatusStats = (project) => {
    if (!project?.sections) return null;

    const stats = {
        total: 0,
        unassigned: 0,
        draft: 0,
        review: 0,
        approved: 0
    };

    project.sections.forEach(section => {
        section.questions?.forEach(q => {
            stats.total++;
            const status = q.status || 'unassigned';
            stats[status]++;
        });
    });

    stats.completionPercent = stats.total > 0
        ? Math.round((stats.approved / stats.total) * 100)
        : 0;

    return stats;
};
