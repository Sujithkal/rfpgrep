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

                // First, migrate any orphan RFPs to Untitled Project
                if (user?.uid) {
                    const { checkAndMigrateOnLogin } = await import('../services/migrationService');
                    const migrationResult = await checkAndMigrateOnLogin(user.uid);
                    if (migrationResult.migrated > 0) {
                        console.log(`Migrated ${migrationResult.migrated} orphan RFPs`);
                    }
                }

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
                                Analytics
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

                {/* Usage Counters */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            label: 'Projects',
                            current: rfps?.length || 0,
                            limit: userData?.plan === 'enterprise' ? '∞' : (userData?.plan === 'professional' ? 50 : userData?.plan === 'starter' ? 10 : 3),
                            icon: '📁'
                        },
                        {
                            label: 'AI Generations',
                            current: userData?.usage?.aiResponsesThisMonth || 0,
                            limit: userData?.plan === 'enterprise' ? '∞' : (userData?.plan === 'professional' ? 2000 : userData?.plan === 'starter' ? 500 : 50),
                            icon: '🤖'
                        },
                        {
                            label: 'Exports',
                            current: userData?.usage?.exportsThisMonth || 0,
                            limit: userData?.plan === 'enterprise' ? '∞' : (userData?.plan === 'professional' ? 200 : userData?.plan === 'starter' ? 50 : 10),
                            icon: '📤'
                        },
                    ].map((item, i) => {
                        const percent = item.limit === '∞' ? 0 : Math.round((item.current / item.limit) * 100);
                        const isNearLimit = percent >= 80;
                        const isAtLimit = percent >= 100;

                        return (
                            <div key={i} className={`p-4 rounded-xl border ${isAtLimit ? 'bg-red-50 border-red-200 dark:bg-red-900/20' : isNearLimit ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg">{item.icon}</span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isAtLimit ? 'bg-red-100 text-red-700' : isNearLimit ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {isAtLimit ? 'Limit Reached' : isNearLimit ? 'Near Limit' : 'OK'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{item.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {item.current}<span className="text-sm font-normal text-gray-500">/{item.limit}</span>
                                </p>
                                {item.limit !== '∞' && (
                                    <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${Math.min(100, percent)}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
                                        <Link to={`/editor?projectId=${rfp.id}`} className="flex-1 min-w-0">
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

                    {/* Create New Project CTA */}
                    <Link to="/projects" className="col-span-1 row-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 border border-transparent hover:shadow-xl transition-all group cursor-pointer">
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                                    <span className="text-white text-lg">➕</span>
                                </div>
                                <h3 className="text-base font-semibold text-white">Create New Project</h3>
                            </div>
                            <div className="flex-1 flex flex-col justify-center items-center">
                                <p className="text-white/80 text-sm text-center mb-3">Start a new RFP project and let AI help you generate responses</p>
                                <span className="px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold text-sm group-hover:scale-105 transition-transform">
                                    Go to Projects →
                                </span>
                            </div>
                        </div>
                    </Link>

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

                    {/* AI Priority Suggestions */}
                    <div className="col-span-1 row-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                                <span className="text-orange-600 dark:text-orange-400 text-lg">🎯</span>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Priority Focus</h3>
                        </div>
                        <div className="flex-1 space-y-2 overflow-auto max-h-24">
                            {rfps.length === 0 ? (
                                <p className="text-sm text-gray-500">No RFPs to prioritize</p>
                            ) : (
                                (() => {
                                    // Get projects that need attention (not won/lost, have questions)
                                    const priorityProjects = rfps
                                        .filter(r => r.outcome !== 'won' && r.outcome !== 'lost')
                                        .sort((a, b) => {
                                            // Priority: Due date (if exists), then by questions count
                                            const aDue = a.dueDate?.toDate?.() || a.dueDate;
                                            const bDue = b.dueDate?.toDate?.() || b.dueDate;
                                            if (aDue && bDue) return new Date(aDue) - new Date(bDue);
                                            if (aDue) return -1;
                                            if (bDue) return 1;
                                            return (b.totalQuestions || 0) - (a.totalQuestions || 0);
                                        })
                                        .slice(0, 2);

                                    if (priorityProjects.length === 0) {
                                        return <p className="text-sm text-green-600">✅ All projects completed!</p>;
                                    }

                                    return priorityProjects.map((rfp, i) => (
                                        <Link key={rfp.id} to={`/editor?projectId=${rfp.id}`}>
                                            <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors cursor-pointer text-sm">
                                                <span>{i === 0 ? '🔥' : '⏰'}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-gray-700 dark:text-gray-300 font-medium">{rfp.name}</p>
                                                    <p className="text-xs text-gray-500">{rfp.totalQuestions || 0} questions</p>
                                                </div>
                                                <span className="text-xs text-orange-600 font-medium">{i === 0 ? 'Top Priority' : 'Next Up'}</span>
                                            </div>
                                        </Link>
                                    ));
                                })()
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
                                    <Link key={rfp.id} to={`/editor?projectId=${rfp.id}`}>
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

                    {/* Achievements & Badges (only when gamification enabled) */}
                    {userData?.settings?.gamificationEnabled !== false ? (
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
                    ) : (
                        /* Win Rate Stats (shown when gamification disabled) */
                        <div className="col-span-1 row-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-lg transition-all">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <span className="text-green-600 dark:text-green-400 text-lg">📊</span>
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Win Rate</h3>
                            </div>
                            {(() => {
                                const won = rfps.filter(r => r.outcome === 'won').length;
                                const lost = rfps.filter(r => r.outcome === 'lost').length;
                                const pending = rfps.filter(r => r.outcome === 'pending').length;
                                const total = won + lost;
                                const winRate = total > 0 ? Math.round((won / total) * 100) : 0;

                                return (
                                    <div className="flex-1 space-y-3">
                                        <div className="text-center">
                                            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{winRate}%</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Win Rate</p>
                                        </div>
                                        <div className="flex justify-around text-center">
                                            <div>
                                                <p className="text-lg font-bold text-green-600">{won}</p>
                                                <p className="text-xs text-gray-500">Won</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-red-500">{lost}</p>
                                                <p className="text-xs text-gray-500">Lost</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-yellow-500">{pending}</p>
                                                <p className="text-xs text-gray-500">Pending</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}


                </div>
            </main >
        </div >
    );
}
