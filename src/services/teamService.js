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
import {
    createNotification,
    NOTIFICATION_TYPES,
    notifyTeamInvite
} from './notificationService';

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

        const normalizedEmail = email.toLowerCase().trim();

        // Check if already invited
        const existingRef = doc(db, `users/${userId}/team`, normalizedEmail);
        const existingSnap = await getDoc(existingRef);

        if (existingSnap.exists()) {
            throw new Error('This email is already on your team.');
        }

        // Get inviter info
        const inviterRef = doc(db, 'users', userId);
        const inviterSnap = await getDoc(inviterRef);
        const inviterData = inviterSnap.data();
        const inviterName = inviterData?.displayName || inviterData?.email || 'Someone';

        // Add team member to inviter's team subcollection
        await setDoc(existingRef, {
            email: normalizedEmail,
            role: role,
            status: 'pending',
            invitedAt: serverTimestamp(),
            invitedBy: userId
        });

        // Also create a global pending invite so the invitee can find it
        const inviteId = `${userId}_${normalizedEmail}`;
        console.log('[inviteTeamMember] Creating global invite with ID:', inviteId);
        console.log('[inviteTeamMember] Inviting email:', normalizedEmail, 'Role:', role);

        const globalInviteRef = doc(db, 'pendingInvites', inviteId);
        await setDoc(globalInviteRef, {
            inviteeEmail: normalizedEmail,
            inviterId: userId,
            inviterName: inviterName,
            inviterEmail: inviterData?.email || '',
            role: role,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        console.log('[inviteTeamMember] Global invite created successfully');

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
 * Get pending invitations for a user by their email
 */
export const getPendingInvites = async (email) => {
    try {
        if (!email) {
            console.log('[getPendingInvites] No email provided');
            return [];
        }

        const normalizedEmail = email.toLowerCase().trim();
        console.log('[getPendingInvites] Querying for email:', normalizedEmail);

        const invitesRef = collection(db, 'pendingInvites');
        const q = query(
            invitesRef,
            where('inviteeEmail', '==', normalizedEmail),
            where('status', '==', 'pending')
        );

        const snapshot = await getDocs(q);
        console.log('[getPendingInvites] Query returned', snapshot.size, 'documents');

        const results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log('[getPendingInvites] Results:', results);
        return results;
    } catch (error) {
        console.error('[getPendingInvites] Error:', error);
        return [];
    }
};

/**
 * Accept a team invitation
 */
export const acceptInvite = async (inviteId, userId, userEmail) => {
    console.log('[acceptInvite] Starting acceptance for invite:', inviteId);
    console.log('[acceptInvite] User ID:', userId, 'Email:', userEmail);

    try {
        // Get the invite
        const inviteRef = doc(db, 'pendingInvites', inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            console.error('[acceptInvite] Invitation not found');
            throw new Error('Invitation not found');
        }

        const invite = inviteSnap.data();
        console.log('[acceptInvite] Invite data:', invite);

        // Update the global invite status
        console.log('[acceptInvite] Updating global invite status...');
        await updateDoc(inviteRef, {
            status: 'accepted',
            acceptedAt: serverTimestamp(),
            acceptedByUserId: userId
        });
        console.log('[acceptInvite] Global invite updated');

        // Update the team member record in the inviter's subcollection
        console.log('[acceptInvite] Updating team member record in inviter subcollection...');
        console.log('[acceptInvite] Path: users/' + invite.inviterId + '/team/' + invite.inviteeEmail);

        const teamMemberRef = doc(db, `users/${invite.inviterId}/team`, invite.inviteeEmail);
        await updateDoc(teamMemberRef, {
            status: 'active',
            userId: userId,
            displayName: userEmail.split('@')[0],
            acceptedAt: serverTimestamp()
        });
        console.log('[acceptInvite] Team member record updated');

        // Store the team membership on the invitee's profile
        console.log('[acceptInvite] Updating invitee profile with team membership...');
        const inviteeRef = doc(db, 'users', userId);
        await updateDoc(inviteeRef, {
            teamId: invite.inviterId,
            teamRole: invite.role,
            joinedTeamAt: serverTimestamp()
        });
        console.log('[acceptInvite] Invitee profile updated');

        // Send notifications
        try {
            // Notify the inviter that their invitation was accepted
            await createNotification(invite.inviterId, {
                type: NOTIFICATION_TYPES.MEMBER_JOINED,
                title: 'Team Member Joined 🎉',
                message: `${userEmail.split('@')[0]} has joined your team as ${invite.role}`,
                data: {
                    memberEmail: userEmail,
                    memberUserId: userId,
                    role: invite.role
                }
            });

            // Notify the invitee they've joined the team
            await createNotification(userId, {
                type: NOTIFICATION_TYPES.TEAM_INVITE,
                title: 'Welcome to the Team! 🎉',
                message: `You've joined ${invite.inviterName}'s team as ${invite.role}`,
                data: {
                    teamId: invite.inviterId,
                    inviterName: invite.inviterName,
                    role: invite.role
                }
            });
        } catch (notifError) {
            console.error('[acceptInvite] Notification error (non-blocking):', notifError);
        }

        return { success: true, teamId: invite.inviterId };
    } catch (error) {
        console.error('[acceptInvite] Error:', error);
        console.error('[acceptInvite] Error code:', error.code);
        console.error('[acceptInvite] Error message:', error.message);
        throw error;
    }
};

/**
 * Decline a team invitation
 */
export const declineInvite = async (inviteId) => {
    try {
        const inviteRef = doc(db, 'pendingInvites', inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
            throw new Error('Invitation not found');
        }

        const invite = inviteSnap.data();

        // Delete the global invite
        await deleteDoc(inviteRef);

        // Also remove from the inviter's team subcollection
        const teamMemberRef = doc(db, `users/${invite.inviterId}/team`, invite.inviteeEmail);
        await deleteDoc(teamMemberRef);

        return { success: true };
    } catch (error) {
        console.error('Error declining invite:', error);
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

/**
 * Leave a team - for team members to voluntarily leave
 */
export const leaveTeam = async (userId, userEmail) => {
    try {
        console.log('[leaveTeam] User', userId, 'leaving team');

        // Get user's current team info
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error('User not found');
        }

        const userData = userSnap.data();
        const teamId = userData.teamId;

        if (!teamId) {
            throw new Error('You are not a member of any team');
        }

        if (teamId === userId) {
            throw new Error('You cannot leave your own team. Transfer ownership first.');
        }

        console.log('[leaveTeam] Leaving team:', teamId);

        // Remove from team owner's team subcollection
        const normalizedEmail = userEmail.toLowerCase().trim();
        const teamMemberRef = doc(db, `users/${teamId}/team`, normalizedEmail);
        await deleteDoc(teamMemberRef);

        // Clear team membership from user's profile
        await updateDoc(userRef, {
            teamId: null,
            teamRole: null,
            joinedTeamAt: null
        });

        // Decrease team member count for the team owner
        const ownerRef = doc(db, 'users', teamId);
        const ownerSnap = await getDoc(ownerRef);
        if (ownerSnap.exists()) {
            const ownerData = ownerSnap.data();
            await updateDoc(ownerRef, {
                'usage.teamMemberCount': Math.max(0, (ownerData.usage?.teamMemberCount || 1) - 1)
            });
        }

        console.log('[leaveTeam] Successfully left team');
        return { success: true };
    } catch (error) {
        console.error('[leaveTeam] Error:', error);
        throw error;
    }
};

/**
 * Check if user is already in a team (for invite acceptance validation)
 */
export const checkExistingTeamMembership = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { inTeam: false };
        }

        const userData = userSnap.data();
        const teamId = userData.teamId;

        if (teamId && teamId !== userId) {
            // User is already in another team
            const ownerRef = doc(db, 'users', teamId);
            const ownerSnap = await getDoc(ownerRef);
            const ownerName = ownerSnap.exists()
                ? (ownerSnap.data().displayName || ownerSnap.data().email || 'Unknown')
                : 'Unknown';

            return {
                inTeam: true,
                teamId: teamId,
                teamOwnerName: ownerName
            };
        }

        return { inTeam: false };
    } catch (error) {
        console.error('[checkExistingTeamMembership] Error:', error);
        return { inTeam: false };
    }
};
