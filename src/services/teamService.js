// Team Collaboration Service
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where
} from 'firebase/firestore';
import { db } from './firebase';
import { checkPlanLimits } from './paymentService';

/**
 * Get team members for a user
 */
export const getTeamMembers = async (userId) => {
    try {
        const teamRef = collection(db, `users/${userId}/team`);
        const snapshot = await getDocs(teamRef);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting team members:', error);
        return [];
    }
};

/**
 * Invite a team member
 */
export const inviteTeamMember = async (userId, userData, email, role = 'editor') => {
    try {
        // Check plan limits
        const limitCheck = checkPlanLimits(userData, 'teamMembers');
        if (!limitCheck.allowed) {
            throw new Error(`Team limit reached (${limitCheck.current}/${limitCheck.limit}). Please upgrade your plan.`);
        }

        // Check if already invited
        const existingRef = doc(db, `users/${userId}/team`, email.toLowerCase());
        const existingSnap = await getDoc(existingRef);

        if (existingSnap.exists()) {
            throw new Error('This email is already on your team.');
        }

        // Add team member
        await setDoc(existingRef, {
            email: email.toLowerCase(),
            role: role,
            status: 'pending',
            invitedAt: serverTimestamp(),
            invitedBy: userId
        });

        // Update team member count
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            'usage.teamMemberCount': (userData.usage?.teamMemberCount || 0) + 1
        });

        return { success: true, message: 'Invitation sent!' };
    } catch (error) {
        console.error('Error inviting team member:', error);
        throw error;
    }
};

/**
 * Update team member role
 */
export const updateMemberRole = async (userId, memberId, newRole) => {
    try {
        const memberRef = doc(db, `users/${userId}/team`, memberId);
        await updateDoc(memberRef, {
            role: newRole,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error updating role:', error);
        throw error;
    }
};

/**
 * Remove team member
 */
export const removeTeamMember = async (userId, memberId, userData) => {
    try {
        const memberRef = doc(db, `users/${userId}/team`, memberId);
        await deleteDoc(memberRef);

        // Update team member count
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            'usage.teamMemberCount': Math.max(0, (userData.usage?.teamMemberCount || 1) - 1)
        });

        return { success: true };
    } catch (error) {
        console.error('Error removing team member:', error);
        throw error;
    }
};

/**
 * Assign a question to a team member
 */
export const assignQuestion = async (userId, projectId, sectionIndex, questionIndex, assigneeEmail) => {
    try {
        const projectRef = doc(db, `users/${userId}/projects`, projectId);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
            throw new Error('Project not found');
        }

        const project = projectSnap.data();
        const sections = [...project.sections];

        if (sections[sectionIndex]?.questions?.[questionIndex]) {
            sections[sectionIndex].questions[questionIndex].assignedTo = assigneeEmail;
            sections[sectionIndex].questions[questionIndex].assignedAt = new Date();

            await updateDoc(projectRef, { sections });
            return { success: true };
        }

        throw new Error('Question not found');
    } catch (error) {
        console.error('Error assigning question:', error);
        throw error;
    }
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role) => {
    const roles = {
        admin: 'Admin',
        editor: 'Editor',
        viewer: 'Viewer'
    };
    return roles[role] || 'Member';
};

/**
 * Get role color classes
 */
export const getRoleColor = (role) => {
    const colors = {
        admin: 'bg-purple-100 text-purple-700',
        editor: 'bg-blue-100 text-blue-700',
        viewer: 'bg-gray-100 text-gray-700'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
};
