import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { getRFPs, deleteRFP } from '../services/rfpService';
import { checkPlanLimits, PLANS } from '../services/paymentService';
import { BADGES, getLevel, getPointsToNextLevel, getUserBadges, getLockedBadges } from '../services/gamificationService';
import ThemeToggle from '../components/ThemeToggle';
import NotificationCenter from '../components/NotificationCenter';

export default function DashboardPage() {
    const { user, userData, loading } = useAuth();
    const navigate = useNavigate();
    const [rfps, setRfps] = useState([]);
    const [loadingRfps, setLoadingRfps] = useState(true);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
        }
    }, [user, loading, navigate]);

    // Fetch RFPs and Projects when user data is loaded
    useEffect(() => {
        const fetchRFPs = async () => {
            try {
                setLoadingRfps(true);
                let allRfps = [];

                // Fetch team RFPs if user has a team
                if (userData?.teamId) {
                    const result = await getRFPs(userData.teamId);
                    if (result.success) {
                        allRfps = [...result.rfps];
                    }
                }

                // Also fetch user's projects from users/{uid}/projects
                if (user?.uid) {
                    const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
                    const { db } = await import('../services/firebase');
                    const projectsRef = collection(db, `users/${user.uid}/projects`);
                    const q = query(projectsRef, orderBy('createdAt', 'desc'));
                    const snapshot = await getDocs(q);

                    snapshot.forEach(doc => {
                        allRfps.push({ id: doc.id, ...doc.data(), isProject: true });
                    });
                }

                setRfps(allRfps);
            } catch (error) {
                console.error('Failed to fetch RFPs:', error);
            } finally {
                setLoadingRfps(false);
            }
        };

        if (!loading && user) {
            fetchRFPs();
        }
    }, [userData, user, loading]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleDeleteRFP = async (e, rfp) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this RFP?')) {
            try {
                const { deleteDoc, doc } = await import('firebase/firestore');
                const { db } = await import('../services/firebase');

                // Check if it's a user project or team RFP
                if (rfp.isProject || !userData?.teamId) {
                    // Delete from users/{userId}/projects/{rfpId}
                    await deleteDoc(doc(db, 'users', user.uid, 'projects', rfp.id));
                } else {
                    // Delete from teams/{teamId}/rfps/{rfpId}
                    await deleteDoc(doc(db, 'teams', userData.teamId, 'rfps', rfp.id));
                }

                setRfps(prev => prev.filter(r => r.id !== rfp.id));
            } catch (error) {
                console.error('Error deleting RFP:', error);
                alert('Failed to delete RFP: ' + error.message);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-gray-900 transition-colors">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-xl shadow-md">
                                ⚡
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">RFPgrep</span>
                        </div>

                        {/* Navigation Tabs */}
                        <nav className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 text-sm font-medium rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/projects"
                                className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Projects
                            </Link>
                            <Link
                                to="/answers"
                                className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Answers
                            </Link>
                            <Link
                                to="/knowledge"
                                className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Knowledge
                            </Link>
                            <Link
                                to="/analytics"
                                className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                📊 Analytics
                            </Link>
                            <Link
                                to="/team"
                                className="px-4 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Team
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/upload">
                            <button className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-md">
                                + New RFP
                            </button>
                        </Link>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Notifications */}
                        <NotificationCenter />

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-semibold text-white shadow-md">
                                    {userData?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{userData?.displayName || 'User'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                                </div>
                                <span className="text-gray-400">▼</span>
                            </button>

                            {showProfileDropdown && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                        <p className="font-semibold text-gray-900 dark:text-white">{userData?.displayName || 'User'}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                                        <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${userData?.planType === 'trial'
                                            ? 'bg-purple-100 text-purple-700'
                                            : userData?.plan === 'professional' || userData?.plan === 'enterprise'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-indigo-100 text-indigo-700'
                                            }`}>
                                            {userData?.planType === 'trial'
                                                ? `Professional Trial${userData?.trialEndDate ? ` (${Math.max(0, Math.ceil((new Date(userData.trialEndDate.toDate ? userData.trialEndDate.toDate() : userData.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24)))} days left)` : ''}`
                                                : `${userData?.plan ? userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1) : 'Free'} Plan`
                                            }
                                        </span>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        <Link
                                            to="/analytics"
                                            onClick={() => setShowProfileDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <span>📊</span>
                                            <span>Analytics</span>
                                        </Link>
                                        <Link
                                            to="/answers"
                                            onClick={() => setShowProfileDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <span>💬</span>
                                            <span>Answer Library</span>
                                        </Link>
                                        <Link
                                            to="/knowledge"
                                            onClick={() => setShowProfileDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <span>📚</span>
                                            <span>Knowledge Library</span>
                                        </Link>
                                        <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>
                                        <Link
                                            to="/branding"
                                            onClick={() => setShowProfileDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <span>🎨</span>
                                            <span>Branding</span>
                                        </Link>
                                        <Link
                                            to="/integrations"
                                            onClick={() => setShowProfileDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <span>🔌</span>
                                            <span>Integrations & API</span>
                                        </Link>
                                        <Link
                                            to="/settings"
                                            onClick={() => setShowProfileDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <span>⚙️</span>
                                            <span>Settings</span>
                                        </Link>
                                        <Link
                                            to="/pricing"
                                            onClick={() => setShowProfileDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <span>💎</span>
                                            <span>Upgrade Plan</span>
                                        </Link>
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                                        <button
                                            onClick={() => {
                                                setShowProfileDropdown(false);
                                                handleLogout();
                                            }}
                                            className="flex items-center gap-3 w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                        >
                                            <span>🚪</span>
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        Welcome back 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Here's what's happening with your RFPs today
                    </p>
                </div>

                {/* Bento Grid Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px]">
                    {/* Recent Activity */}
                    <div className="col-span-2 row-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                                <span className="text-white text-lg">📊</span>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent RFPs</h3>
                            <span className="ml-auto text-xs font-medium text-gray-500 dark:text-gray-400">{rfps.length} total</span>
                        </div>
                        <div className="flex-1 space-y-2.5 overflow-auto max-h-32">
                            {loadingRfps ? (
                                <div className="text-center py-4">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : rfps.length > 0 ? (
                                rfps.slice(0, 3).map((rfp) => (
                                    <div key={rfp.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-100 dark:border-gray-600 group">
                                        <Link to={`/editor?rfpId=${rfp.id}`} className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{rfp.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {rfp.totalQuestions || 0} questions • {rfp.fileType?.toUpperCase()}
                                            </p>
                                        </Link>
                                        <div className="flex items-center gap-2 ml-2">
                                            <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${rfp.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                                rfp.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                }`}>
                                                {rfp.status === 'ready' ? 'Ready' :
                                                    rfp.status === 'processing' ? 'Processing' : 'Error'}
                                            </span>
                                            <button
                                                onClick={(e) => handleDeleteRFP(e, rfp)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded-md transition-all"
                                                title="Delete RFP"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-sm text-gray-500">No RFPs yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Upload your first RFP to get started</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="col-span-1 row-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <span className="text-green-600 dark:text-green-400 text-lg">📊</span>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Usage</h3>
                            <Link to="/pricing" className="ml-auto text-xs text-indigo-600 hover:underline">
                                {userData?.plan === 'free' ? 'Upgrade' : PLANS[userData?.plan]?.name || 'Free'}
                            </Link>
                        </div>
                        <div className="flex-1 space-y-4">
                            {/* Projects Usage */}
                            {(() => {
                                const projectLimit = checkPlanLimits(userData, 'projects');
                                const projectPercent = projectLimit.limit === -1 ? 0 : Math.min(100, (projectLimit.current / projectLimit.limit) * 100);
                                return (
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600 dark:text-gray-400">Projects</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {projectLimit.limit === -1 ? '∞' : `${projectLimit.current}/${projectLimit.limit}`}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${projectPercent > 80 ? 'bg-red-500' : projectPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                style={{ width: projectLimit.limit === -1 ? '10%' : `${projectPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* AI Responses Usage */}
                            {(() => {
                                const aiLimit = checkPlanLimits(userData, 'aiResponses');
                                const aiPercent = aiLimit.limit === -1 ? 0 : Math.min(100, (aiLimit.current / aiLimit.limit) * 100);
                                return (
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600 dark:text-gray-400">AI Responses</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {aiLimit.limit === -1 ? '∞' : `${aiLimit.current}/${aiLimit.limit}`}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${aiPercent > 80 ? 'bg-red-500' : aiPercent > 50 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                                                style={{ width: aiLimit.limit === -1 ? '10%' : `${aiPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="col-span-1 row-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <span className="text-purple-600 dark:text-purple-400 text-lg">✨</span>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">AI Insights</h3>
                        </div>
                        <div className="flex-1 flex flex-col justify-center space-y-3">
                            <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-100 dark:border-indigo-800">
                                <div className="flex items-start gap-2">
                                    <span className="text-indigo-600 dark:text-indigo-400 text-lg">💡</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {rfps.length === 0
                                            ? 'Upload your first RFP to get AI-powered insights'
                                            : rfps.length === 1
                                                ? 'Great start! Complete your first RFP for better insights'
                                                : `You have ${rfps.filter(r => r.status === 'ready').length} RFPs ready for response generation`
                                        }
                                    </p>
                                </div>
                            </div>
                            {rfps.length > 0 && (
                                <div className="text-xs text-green-600 flex items-center gap-1">
                                    <span>🎯</span>
                                    <span>
                                        {rfps.filter(r => r.status === 'processing').length > 0
                                            ? `${rfps.filter(r => r.status === 'processing').length} processing...`
                                            : 'All RFPs processed!'
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Tasks */}
                    <div className="col-span-1 row-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                                <span className="text-amber-600 dark:text-amber-400 text-lg">✅</span>
                            </div>
                            <div className="flex-1 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Pending Tasks</h3>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {rfps.filter(r => r.status === 'ready' || r.status === 'processing').length} items
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2 overflow-auto max-h-24">
                            {rfps.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-sm text-gray-500">No pending tasks</p>
                                </div>
                            ) : (
                                rfps.filter(r => r.status === 'ready' || r.status === 'processing').slice(0, 3).map((rfp, idx) => (
                                    <Link key={rfp.id} to={`/editor?rfpId=${rfp.id}`}>
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer text-sm">
                                            <span>{rfp.status === 'processing' ? '⏳' : '✏️'}</span>
                                            <span className="truncate text-gray-700 dark:text-gray-300">{rfp.name}</span>
                                        </div>
                                    </Link>
                                ))
                            )}
                            {rfps.length > 0 && rfps.filter(r => r.status === 'ready' || r.status === 'processing').length === 0 && (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-sm text-green-600">✅ All tasks completed!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Usage Chart */}
                    <div className="col-span-2 row-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                                    <span className="text-white text-lg">⚡</span>
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">AI Usage This Week</h3>
                            </div>
                            <Link to="/analytics" className="text-sm font-semibold text-indigo-600 hover:underline">
                                View Details →
                            </Link>
                        </div>
                        <div className="flex-1 flex items-end gap-2 px-1">
                            {(() => {
                                // Calculate mock usage based on RFPs created (simulated weekly data)
                                const totalQuestions = rfps.reduce((sum, r) => sum + (r.totalQuestions || 0), 0);
                                const baseUsage = Math.min(100, totalQuestions * 2);
                                const weeklyData = [
                                    Math.floor(baseUsage * 0.3),
                                    Math.floor(baseUsage * 0.5),
                                    Math.floor(baseUsage * 0.7),
                                    Math.floor(baseUsage * 0.4),
                                    Math.floor(baseUsage * 0.8),
                                    Math.floor(baseUsage * 0.2),
                                    Math.floor(baseUsage)
                                ];
                                const maxUsage = Math.max(...weeklyData, 1);

                                return weeklyData.map((usage, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden h-24 flex flex-col-reverse">
                                            <div
                                                className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                                style={{ height: `${(usage / maxUsage) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                        </span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* Achievements & Badges */}
                    <div className="col-span-1 row-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                                <span className="text-yellow-600 dark:text-yellow-400 text-lg">🏆</span>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Achievements</h3>
                        </div>
                        {(() => {
                            const points = userData?.gamification?.totalPoints || 0;
                            const level = getLevel(points);
                            const toNext = getPointsToNextLevel(points);
                            const earnedBadges = getUserBadges(userData);

                            return (
                                <div className="flex-1 space-y-3">
                                    {/* Level & Points */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl">
                                            {level.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{level.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {points} pts {toNext > 0 && `• ${toNext} to next level`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Recent Badges */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {earnedBadges.length > 0 ? (
                                            earnedBadges.slice(0, 4).map(badge => (
                                                <span
                                                    key={badge.id}
                                                    className="text-lg"
                                                    title={badge.name}
                                                >
                                                    {badge.icon}
                                                </span>
                                            ))
                                        ) : (
                                            <div className="text-xs text-gray-400">
                                                Complete tasks to earn badges!
                                            </div>
                                        )}
                                        {earnedBadges.length > 4 && (
                                            <span className="text-xs text-gray-500">+{earnedBadges.length - 4} more</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Quick Actions */}
                    <div className="col-span-1 row-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-2.5 mb-4">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                        </div>
                        <div className="flex-1 flex flex-col gap-2.5">
                            <Link to="/upload">
                                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:scale-105 transition-transform">
                                    <span>New RFP</span>
                                    <span>→</span>
                                </button>
                            </Link>
                            <Link to="/upload">
                                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200">
                                    <span>Upload Document</span>
                                    <span>→</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
