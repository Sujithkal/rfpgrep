/**
 * PendingInvites Component
 * Shows pending team invitations with accept/decline options
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPendingInvites, acceptInvite, declineInvite } from '../services/teamService';
import toast from 'react-hot-toast';

export default function PendingInvites() {
    const { user, refreshUserData } = useAuth();
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        const loadInvites = async () => {
            if (!user?.email) {
                console.log('[PendingInvites] No user email, skipping');
                setLoading(false);
                return;
            }

            console.log('[PendingInvites] Loading invites for:', user.email);

            try {
                const pendingInvites = await getPendingInvites(user.email);
                console.log('[PendingInvites] Found invites:', pendingInvites);
                setInvites(pendingInvites);
            } catch (error) {
                console.error('[PendingInvites] Error loading invites:', error);
            } finally {
                setLoading(false);
            }
        };

        loadInvites();
    }, [user?.email]);

    const handleAccept = async (invite) => {
        setProcessing(invite.id);
        try {
            await acceptInvite(invite.id, user.uid, user.email);
            setInvites(prev => prev.filter(i => i.id !== invite.id));
            toast.success(`You've joined ${invite.inviterName}'s team!`);
            // Refresh user data to get the new teamId
            if (refreshUserData) {
                await refreshUserData();
            }
            // Reload page to reflect team membership
            window.location.reload();
        } catch (error) {
            console.error('Error accepting invite:', error);
            toast.error('Failed to accept invitation');
        } finally {
            setProcessing(null);
        }
    };

    const handleDecline = async (invite) => {
        setProcessing(invite.id);
        try {
            await declineInvite(invite.id);
            setInvites(prev => prev.filter(i => i.id !== invite.id));
            toast.success('Invitation declined');
        } catch (error) {
            console.error('Error declining invite:', error);
            toast.error('Failed to decline invitation');
        } finally {
            setProcessing(null);
        }
    };

    if (loading || invites.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📬</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    Pending Team Invitations
                </h3>
                <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {invites.length}
                </span>
            </div>

            <div className="space-y-3">
                {invites.map((invite) => (
                    <div
                        key={invite.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {invite.inviterName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {invite.inviterName}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    invited you as <span className="font-medium text-indigo-600 dark:text-indigo-400">{invite.role}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleDecline(invite)}
                                disabled={processing === invite.id}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                Decline
                            </button>
                            <button
                                onClick={() => handleAccept(invite)}
                                disabled={processing === invite.id}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                            >
                                {processing === invite.id ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>Joining...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✓</span>
                                        <span>Accept</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
