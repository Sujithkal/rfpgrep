import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getTeamMembers,
    inviteTeamMember,
    updateMemberRole,
    removeTeamMember,
    getRoleDisplayName,
    getRoleColor,
    getPendingInvites,
    acceptInvite,
    declineInvite,
    leaveTeam,
    checkExistingTeamMembership
} from '../services/teamService';
import { checkPlanLimits } from '../services/paymentService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import toast from 'react-hot-toast';

export default function TeamPage() {
    const { user, userData, isTeamOwner, isTeamMember, teamRole, effectiveTeamId, refreshUserData } = useAuth();
    const navigate = useNavigate();

    // State
    const [activeTab, setActiveTab] = useState('members'); // members | sent | received
    const [members, setMembers] = useState([]);
    const [sentInvites, setSentInvites] = useState([]);
    const [receivedInvites, setReceivedInvites] = useState([]);
    const [teamOwnerInfo, setTeamOwnerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [inviting, setInviting] = useState(false);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadData();
    }, [user, isTeamMember, effectiveTeamId]);

    const loadData = async () => {
        if (!user?.uid) return;
        setLoading(true);

        console.log('[TeamPage] Loading data...');
        console.log('[TeamPage] isTeamMember:', isTeamMember);
        console.log('[TeamPage] effectiveTeamId:', effectiveTeamId);

        try {
            // Load received invites (for everyone)
            const received = await getPendingInvites(user.email);
            setReceivedInvites(received);

            if (isTeamMember && effectiveTeamId) {
                // User is a team MEMBER - fetch team owner info and members
                console.log('[TeamPage] Fetching team owner info for:', effectiveTeamId);
                const ownerDoc = await getDoc(doc(db, 'users', effectiveTeamId));
                if (ownerDoc.exists()) {
                    const ownerData = ownerDoc.data();
                    console.log('[TeamPage] Team owner data:', ownerData);
                    setTeamOwnerInfo({
                        id: effectiveTeamId,
                        ...ownerData
                    });
                } else {
                    console.log('[TeamPage] Team owner document not found');
                }
                // Fetch team members from owner's team subcollection
                console.log('[TeamPage] Fetching team members from:', effectiveTeamId);
                const teamMembers = await getTeamMembers(effectiveTeamId);
                console.log('[TeamPage] Team members:', teamMembers);
                setMembers(teamMembers);
            } else {
                // User is a team OWNER - fetch their team members and sent invites
                const teamMembers = await getTeamMembers(user.uid);
                setMembers(teamMembers);

                // Sent invites are pending team members
                const pending = teamMembers.filter(m => m.status === 'pending');
                setSentInvites(pending);
            }
        } catch (error) {
            console.error('[TeamPage] Error loading team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setInviting(true);
        try {
            await inviteTeamMember(user.uid, userData, inviteEmail, inviteRole);
            toast.success(`Invited ${inviteEmail} as ${getRoleDisplayName(inviteRole)}`);
            setInviteEmail('');
            loadData();
        } catch (error) {
            toast.error(error.message || 'Failed to invite member');
        } finally {
            setInviting(false);
        }
    };

    const handleAcceptInvite = async (invite) => {
        setProcessing(invite.id);
        try {
            // Check if user is already in a team
            const membershipCheck = await checkExistingTeamMembership(user.uid);
            if (membershipCheck.inTeam) {
                toast.error(`You're already in ${membershipCheck.teamOwnerName}'s team. Leave that team first.`);
                setProcessing(null);
                return;
            }

            await acceptInvite(invite.id, user.uid, user.email);
            toast.success(`You've joined ${invite.inviterName}'s team!`);
            setReceivedInvites(prev => prev.filter(i => i.id !== invite.id));
            if (refreshUserData) await refreshUserData();
            // Reload to reflect new team status
            window.location.reload();
        } catch (error) {
            console.error('Error accepting:', error);
            toast.error(error.message || 'Failed to accept invitation');
        } finally {
            setProcessing(null);
        }
    };

    const handleDeclineInvite = async (invite) => {
        setProcessing(invite.id);
        try {
            await declineInvite(invite.id);
            toast.success('Invitation declined');
            setReceivedInvites(prev => prev.filter(i => i.id !== invite.id));
        } catch (error) {
            toast.error('Failed to decline invitation');
        } finally {
            setProcessing(null);
        }
    };

    const handleLeaveTeam = async () => {
        if (!confirm('Are you sure you want to leave this team? You will lose access to all team projects.')) {
            return;
        }

        setProcessing('leaving');
        try {
            await leaveTeam(user.uid, user.email);
            toast.success('You have left the team');
            if (refreshUserData) await refreshUserData();
            // Redirect to dashboard
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Error leaving team:', error);
            toast.error(error.message || 'Failed to leave team');
        } finally {
            setProcessing(null);
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            const ownerId = isTeamMember ? effectiveTeamId : user.uid;
            await updateMemberRole(ownerId, memberId, newRole);
            toast.success('Role updated');
            loadData();
        } catch (error) {
            toast.error('Failed to update role');
        }
    };

    const handleRemove = async (member) => {
        if (!confirm(`Remove ${member.email} from team?`)) return;

        try {
            await removeTeamMember(user.uid, member.id, userData);
            toast.success('Member removed');
            loadData();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    // Get team limits
    const teamLimit = checkPlanLimits(userData, 'teamMembers');

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                                ← Back
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">👥 Team</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {isTeamMember
                                        ? `Member of ${teamOwnerInfo?.displayName || teamOwnerInfo?.email || 'Team'}'s workspace`
                                        : 'Manage your team members and permissions'
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Role Badge */}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${teamRole === 'owner' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' :
                                teamRole === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' :
                                    teamRole === 'editor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                {teamRole === 'owner' ? '👑 Owner' :
                                    teamRole === 'admin' ? '⚙️ Admin' :
                                        teamRole === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
                            </span>
                            {isTeamOwner && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {teamLimit?.limit === -1 ? '∞' : `${members.length}/${teamLimit?.limit || 0}`} members
                                </span>
                            )}
                            {/* Leave Team Button (for team members only) */}
                            {isTeamMember && (
                                <button
                                    onClick={handleLeaveTeam}
                                    disabled={processing === 'leaving'}
                                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {processing === 'leaving' ? 'Leaving...' : '🚪 Leave Team'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mt-4 border-b border-gray-200 dark:border-gray-700 -mb-px">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'members'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                        >
                            Team Members
                        </button>
                        {isTeamOwner && (
                            <button
                                onClick={() => setActiveTab('sent')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sent'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                            >
                                Sent Invites {sentInvites.length > 0 && `(${sentInvites.length})`}
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('received')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'received'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                        >
                            My Invitations
                            {receivedInvites.length > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                    {receivedInvites.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Tab: Team Members */}
                {activeTab === 'members' && (
                    <>
                        {/* Invite Form (only for owners and admins) */}
                        {(isTeamOwner || teamRole === 'admin') && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite Team Member</h2>
                                <form onSubmit={handleInvite} className="flex gap-4 flex-wrap">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        required
                                    />
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="viewer">Viewer - Can view only</option>
                                        <option value="editor">Editor - Can edit responses</option>
                                        <option value="admin">Admin - Full access</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={inviting || (!teamLimit?.allowed && teamLimit?.limit !== -1)}
                                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                                    >
                                        {inviting ? 'Inviting...' : '+ Invite'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* Team Members List */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="font-semibold text-gray-900 dark:text-white">Team Members</h2>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {/* Owner row */}
                                    <div className="p-4 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                {isTeamMember
                                                    ? (teamOwnerInfo?.email?.[0]?.toUpperCase() || 'O')
                                                    : (user?.email?.[0]?.toUpperCase() || 'U')
                                                }
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {isTeamMember ? (teamOwnerInfo?.email || 'Team Owner') : user?.email}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {isTeamMember ? 'Team Owner' : 'You (Owner)'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                            Owner
                                        </span>
                                    </div>

                                    {/* Team members */}
                                    {members.filter(m => m.status === 'active').map((member) => (
                                        <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                                                    {member.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{member.email}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {member.email === user?.email ? 'You' : 'Active'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {(isTeamOwner || teamRole === 'admin') ? (
                                                    <>
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                                            className={`px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer ${getRoleColor(member.role)}`}
                                                        >
                                                            <option value="viewer">Viewer</option>
                                                            <option value="editor">Editor</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleRemove(member)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Remove member"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(member.role)}`}>
                                                        {getRoleDisplayName(member.role)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {members.filter(m => m.status === 'active').length === 0 && !loading && (
                                        <div className="p-8 text-center">
                                            <span className="text-4xl mb-4 block">👥</span>
                                            <p className="text-gray-600 dark:text-gray-400">No active team members yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Tab: Sent Invites (Owner only) */}
                {activeTab === 'sent' && isTeamOwner && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Pending Invitations</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Invites waiting for acceptance</p>
                        </div>

                        {sentInvites.length === 0 ? (
                            <div className="p-8 text-center">
                                <span className="text-4xl mb-4 block">📬</span>
                                <p className="text-gray-600 dark:text-gray-400">No pending invitations</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {sentInvites.map((invite) => (
                                    <div key={invite.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold">
                                                ⏳
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{invite.email}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Invited as {getRoleDisplayName(invite.role)} • Pending
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(invite)}
                                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            Cancel Invite
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Received Invites */}
                {activeTab === 'received' && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Invitations for You</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Teams that have invited you</p>
                        </div>

                        {receivedInvites.length === 0 ? (
                            <div className="p-8 text-center">
                                <span className="text-4xl mb-4 block">📭</span>
                                <p className="text-gray-600 dark:text-gray-400">No pending invitations</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">When someone invites you to their team, it will appear here</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {receivedInvites.map((invite) => (
                                    <div key={invite.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                {invite.inviterName?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{invite.inviterName}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    Invited you as <span className="font-medium text-indigo-600 dark:text-indigo-400">{getRoleDisplayName(invite.role)}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDeclineInvite(invite)}
                                                disabled={processing === invite.id}
                                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={() => handleAcceptInvite(invite)}
                                                disabled={processing === invite.id}
                                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                            >
                                                {processing === invite.id ? 'Joining...' : 'Accept'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Role Descriptions */}
                <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Role Permissions</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">👁️ Viewer</span>
                            <ul className="mt-2 space-y-1 text-gray-500 dark:text-gray-400">
                                <li>• View projects and responses</li>
                                <li>• Export documents</li>
                            </ul>
                        </div>
                        <div>
                            <span className="font-medium text-blue-700 dark:text-blue-400">✏️ Editor</span>
                            <ul className="mt-2 space-y-1 text-gray-500 dark:text-gray-400">
                                <li>• Everything Viewers can do</li>
                                <li>• Edit and generate responses</li>
                                <li>• Upload documents</li>
                            </ul>
                        </div>
                        <div>
                            <span className="font-medium text-purple-700 dark:text-purple-400">👑 Admin</span>
                            <ul className="mt-2 space-y-1 text-gray-500 dark:text-gray-400">
                                <li>• Everything Editors can do</li>
                                <li>• Manage team members</li>
                                <li>• Delete projects</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
