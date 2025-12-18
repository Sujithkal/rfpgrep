import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getTeamMembers,
    inviteTeamMember,
    updateMemberRole,
    removeTeamMember,
    getRoleDisplayName,
    getRoleColor
} from '../services/teamService';
import { checkPlanLimits, PLANS } from '../services/paymentService';
import toast from 'react-hot-toast';

export default function TeamPage() {
    const { user, userData } = useAuth();
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadMembers();
    }, [user]);

    const loadMembers = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const teamMembers = await getTeamMembers(user.uid);
            setMembers(teamMembers);
        } catch (error) {
            console.error('Error loading team:', error);
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
            loadMembers();
        } catch (error) {
            toast.error(error.message || 'Failed to invite member');
        } finally {
            setInviting(false);
        }
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            await updateMemberRole(user.uid, memberId, newRole);
            toast.success('Role updated');
            loadMembers();
        } catch (error) {
            toast.error('Failed to update role');
        }
    };

    const handleRemove = async (member) => {
        if (!confirm(`Remove ${member.email} from team?`)) return;

        try {
            await removeTeamMember(user.uid, member.id, userData);
            toast.success('Member removed');
            loadMembers();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    // Get team limits
    const teamLimit = checkPlanLimits(userData, 'teamMembers');

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 transition-colors">
                                ← Back
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">👥 Team</h1>
                                <p className="text-sm text-gray-500">
                                    Manage your team members and permissions
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            {teamLimit.limit === -1 ? '∞' : `${members.length}/${teamLimit.limit}`} members
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Invite Form */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h2>
                    <form onSubmit={handleInvite} className="flex gap-4 flex-wrap">
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="viewer">Viewer - Can view only</option>
                            <option value="editor">Editor - Can edit responses</option>
                            <option value="admin">Admin - Full access</option>
                        </select>
                        <button
                            type="submit"
                            disabled={inviting || (!teamLimit.allowed && teamLimit.limit !== -1)}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50"
                        >
                            {inviting ? 'Inviting...' : '+ Invite'}
                        </button>
                    </form>
                    {!teamLimit.allowed && teamLimit.limit !== -1 && (
                        <p className="mt-3 text-sm text-red-600">
                            Team limit reached. <Link to="/pricing" className="underline">Upgrade your plan</Link> for more team members.
                        </p>
                    )}
                </div>

                {/* Team Members List */}
                <div className="bg-white rounded-xl border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Team Members</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="p-8 text-center">
                            <span className="text-4xl mb-4 block">👥</span>
                            <p className="text-gray-600">No team members yet</p>
                            <p className="text-sm text-gray-400 mt-1">Invite colleagues to collaborate on RFPs</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {/* Owner (current user) */}
                            <div className="p-4 flex items-center justify-between bg-indigo-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                        {user?.email?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user?.email}</p>
                                        <p className="text-sm text-gray-500">You</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                                    Owner
                                </span>
                            </div>

                            {/* Team members */}
                            {members.map((member) => (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                                            {member.email?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{member.email}</p>
                                            <p className="text-sm text-gray-500">
                                                {member.status === 'pending' ? '⏳ Pending invite' : '✓ Active'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${getRoleColor(member.role)}`}
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <button
                                            onClick={() => handleRemove(member)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove member"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Role Descriptions */}
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Role Permissions</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">👁️ Viewer</span>
                            <ul className="mt-2 space-y-1 text-gray-500">
                                <li>• View projects and responses</li>
                                <li>• Export documents</li>
                            </ul>
                        </div>
                        <div>
                            <span className="font-medium text-blue-700">✏️ Editor</span>
                            <ul className="mt-2 space-y-1 text-gray-500">
                                <li>• Everything Viewers can do</li>
                                <li>• Edit and generate responses</li>
                                <li>• Upload documents</li>
                            </ul>
                        </div>
                        <div>
                            <span className="font-medium text-purple-700">👑 Admin</span>
                            <ul className="mt-2 space-y-1 text-gray-500">
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
