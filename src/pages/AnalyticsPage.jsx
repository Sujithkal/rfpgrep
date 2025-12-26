import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { calculateWinProbability } from '../services/winPredictionService';
import { extractExamplesFromProject, getTrainingStats } from '../services/trainingDataService';

export default function AnalyticsPage() {
    const { user, userData } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all');
    const [trainingStats, setTrainingStats] = useState({ totalExamples: 0, categories: {} });
    const [extracting, setExtracting] = useState(null);
    const [predictions, setPredictions] = useState({});

    useEffect(() => {
        if (user?.uid) {
            loadProjects();
            loadTrainingStats();
        }
    }, [user]);

    const loadProjects = async () => {
        try {
            const projectsRef = collection(db, `users/${user.uid}/projects`);
            const q = query(projectsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const projectList = [];
            snapshot.forEach(doc => {
                projectList.push({ id: doc.id, ...doc.data() });
            });

            setProjects(projectList);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTrainingStats = async () => {
        const stats = await getTrainingStats(user.uid);
        setTrainingStats(stats);
    };

    // Extract training examples from a won project
    const handleLearnFromWin = async (projectId) => {
        setExtracting(projectId);
        try {
            const result = await extractExamplesFromProject(user.uid, projectId);
            if (result.success) {
                alert(`✅ Extracted ${result.extractedCount} training examples from this winning RFP!`);
                loadTrainingStats();
            } else {
                alert(`❌ ${result.error}`);
            }
        } catch (error) {
            console.error('Error extracting training:', error);
        } finally {
            setExtracting(null);
        }
    };

    // Calculate win prediction for a project
    const handleCalculatePrediction = async (projectId) => {
        try {
            const result = await calculateWinProbability(user.uid, projectId);
            if (result.success) {
                setPredictions(prev => ({ ...prev, [projectId]: result }));
            }
        } catch (error) {
            console.error('Error calculating prediction:', error);
        }
    };

    // Calculate analytics
    const calculateAnalytics = () => {
        const now = new Date();
        let filteredProjects = projects;

        // Filter by time range
        if (timeRange !== 'all') {
            const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
            const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            filteredProjects = projects.filter(p => {
                const createdAt = p.createdAt?.toDate?.() || new Date(p.createdAt);
                return createdAt >= cutoff;
            });
        }

        const total = filteredProjects.length;
        const won = filteredProjects.filter(p => p.outcome === 'won').length;
        const lost = filteredProjects.filter(p => p.outcome === 'lost').length;
        const pending = filteredProjects.filter(p => !p.outcome || p.outcome === 'pending').length;
        const winRate = total > 0 ? Math.round((won / (won + lost || 1)) * 100) : 0;

        // Calculate completion rate
        const totalQuestions = filteredProjects.reduce((sum, p) => sum + (p.stats?.totalQuestions || 0), 0);
        const answeredQuestions = filteredProjects.reduce((sum, p) => sum + (p.stats?.answered || 0), 0);
        const completionRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

        // Calculate average trust score
        let totalTrustScore = 0;
        let trustCount = 0;
        filteredProjects.forEach(p => {
            p.sections?.forEach(s => {
                s.questions?.forEach(q => {
                    if (q.trustScore) {
                        totalTrustScore += q.trustScore;
                        trustCount++;
                    }
                });
            });
        });
        const avgTrustScore = trustCount > 0 ? Math.round(totalTrustScore / trustCount) : 0;

        // Calculate by status
        const byStatus = {
            processing: filteredProjects.filter(p => p.status === 'processing').length,
            inProgress: filteredProjects.filter(p => p.status === 'in-progress' || !p.status).length,
            completed: filteredProjects.filter(p => p.status === 'completed').length,
            submitted: filteredProjects.filter(p => p.status === 'submitted').length
        };

        // AI Usage from userData
        const aiUsage = {
            used: userData?.aiResponsesUsed || 0,
            limit: userData?.plan === 'professional' ? 500 : userData?.plan === 'enterprise' ? 'Unlimited' : 50,
            percentage: userData?.plan === 'enterprise' ? 100 : Math.round(((userData?.aiResponsesUsed || 0) / (userData?.plan === 'professional' ? 500 : 50)) * 100)
        };

        return {
            total,
            won,
            lost,
            pending,
            winRate,
            completionRate,
            avgTrustScore,
            byStatus,
            filteredProjects,
            aiUsage
        };
    };

    const analytics = calculateAnalytics();

    // Update project outcome - persist to Firestore
    const updateOutcome = async (projectId, outcome) => {
        try {
            const projectRef = doc(db, `users/${user.uid}/projects`, projectId);
            await updateDoc(projectRef, {
                outcome,
                outcomeUpdatedAt: new Date()
            });

            // Update local state
            setProjects(prev => prev.map(p =>
                p.id === projectId ? { ...p, outcome } : p
            ));
        } catch (error) {
            console.error('Error updating outcome:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard"
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">
                            📊 Win/Loss Analytics
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {['7d', '30d', '90d', 'all'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${timeRange === range
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {range === 'all' ? 'All Time' : `Last ${range}`}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <p className="text-sm text-gray-500 mb-1">Total RFPs</p>
                        <p className="text-3xl font-bold text-gray-900">{analytics.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-6 border border-green-200 shadow-sm">
                        <p className="text-sm text-green-600 mb-1">Won</p>
                        <p className="text-3xl font-bold text-green-700">{analytics.won}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-6 border border-red-200 shadow-sm">
                        <p className="text-sm text-red-600 mb-1">Lost</p>
                        <p className="text-3xl font-bold text-red-700">{analytics.lost}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200 shadow-sm">
                        <p className="text-sm text-yellow-600 mb-1">Pending</p>
                        <p className="text-3xl font-bold text-yellow-700">{analytics.pending}</p>
                    </div>
                </div>

                {/* AI Training Stats */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 shadow-sm mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                                🧠 AI Training Progress
                            </h3>
                            <p className="text-sm text-purple-700 mt-1">
                                Your AI learns from winning RFPs to generate better responses
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-purple-700">{trainingStats.totalExamples}</p>
                            <p className="text-sm text-purple-600">Training Examples</p>
                        </div>
                    </div>
                    {trainingStats.totalExamples > 0 && (
                        <div className="mt-4 pt-4 border-t border-purple-200">
                            <p className="text-sm text-purple-700 mb-2">Categories learned:</p>
                            <div className="flex flex-wrap gap-2">
                                {trainingStats.topCategories?.map(([category, count]) => (
                                    <span key={category} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                        {category}: {count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {trainingStats.totalExamples === 0 && (
                        <div className="mt-4 pt-4 border-t border-purple-200">
                            <p className="text-sm text-purple-600">
                                💡 Mark your first project as "Won" and click "Learn from Win" to start training your AI!
                            </p>
                        </div>
                    )}
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Win Rate */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-500 mb-4">WIN RATE</h3>
                        <div className="flex items-center justify-center">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle
                                        className="text-gray-200"
                                        strokeWidth="10"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="40"
                                        cx="50"
                                        cy="50"
                                    />
                                    <circle
                                        className="text-green-500"
                                        strokeWidth="10"
                                        strokeDasharray={`${analytics.winRate * 2.51} 251`}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="40"
                                        cx="50"
                                        cy="50"
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-gray-900">{analytics.winRate}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-500 mb-4">AVG COMPLETION</h3>
                        <div className="flex items-center justify-center">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle
                                        className="text-gray-200"
                                        strokeWidth="10"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="40"
                                        cx="50"
                                        cy="50"
                                    />
                                    <circle
                                        className="text-blue-500"
                                        strokeWidth="10"
                                        strokeDasharray={`${analytics.completionRate * 2.51} 251`}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="40"
                                        cx="50"
                                        cy="50"
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-gray-900">{analytics.completionRate}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Score */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-500 mb-4">AVG TRUST SCORE</h3>
                        <div className="flex items-center justify-center">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle
                                        className="text-gray-200"
                                        strokeWidth="10"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="40"
                                        cx="50"
                                        cy="50"
                                    />
                                    <circle
                                        className="text-purple-500"
                                        strokeWidth="10"
                                        strokeDasharray={`${analytics.avgTrustScore * 2.51} 251`}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="40"
                                        cx="50"
                                        cy="50"
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-gray-900">{analytics.avgTrustScore}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project List with Outcome Tracking */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Project Outcomes
                        </h2>
                        <p className="text-sm text-gray-500">Track and record win/loss outcomes for each RFP</p>
                    </div>

                    {analytics.filteredProjects.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500">No projects found for the selected time range.</p>
                            <Link
                                to="/upload"
                                className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
                            >
                                Upload First RFP
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {analytics.filteredProjects.map(project => (
                                <div key={project.id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">
                                                {project.name || 'Untitled Project'}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {project.client || 'No client'} • {project.stats?.totalQuestions || 0} questions • {project.stats?.progress || 0}% complete
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateOutcome(project.id, 'won')}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${project.outcome === 'won'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    }`}
                                            >
                                                ✅ Won
                                            </button>
                                            <button
                                                onClick={() => updateOutcome(project.id, 'lost')}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${project.outcome === 'lost'
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                            >
                                                ❌ Lost
                                            </button>
                                            <button
                                                onClick={() => updateOutcome(project.id, 'pending')}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${!project.outcome || project.outcome === 'pending'
                                                    ? 'bg-yellow-500 text-white'
                                                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                    }`}
                                            >
                                                ⏳ Pending
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action buttons row */}
                                    <div className="mt-3 flex items-center gap-3">
                                        {/* Learn From Win button - only for won projects */}
                                        {project.outcome === 'won' && (
                                            <button
                                                onClick={() => handleLearnFromWin(project.id)}
                                                disabled={extracting === project.id}
                                                className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {extracting === project.id ? (
                                                    <>⏳ Learning...</>
                                                ) : (
                                                    <>🧠 Learn from Win</>
                                                )}
                                            </button>
                                        )}

                                        {/* Predict Win Probability button */}
                                        {(!project.outcome || project.outcome === 'pending') && (
                                            <button
                                                onClick={() => handleCalculatePrediction(project.id)}
                                                className="px-3 py-1.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-1"
                                            >
                                                🎯 Calculate Win Probability
                                            </button>
                                        )}

                                        {/* Show prediction result */}
                                        {predictions[project.id] && (
                                            <div className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 ${predictions[project.id].probability >= 70 ? 'bg-green-100 text-green-700' :
                                                predictions[project.id].probability >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                <span className="text-base">
                                                    {predictions[project.id].probability >= 70 ? '🔥' :
                                                        predictions[project.id].probability >= 40 ? '⚡' : '⚠️'}
                                                </span>
                                                <span>{predictions[project.id].probability}% Win Probability</span>
                                            </div>
                                        )}

                                        {/* Show stored win probability */}
                                        {project.winProbability && !predictions[project.id] && (
                                            <div className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 ${project.winProbability.score >= 70 ? 'bg-green-100 text-green-700' :
                                                project.winProbability.score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                <span className="text-base">
                                                    {project.winProbability.score >= 70 ? '🔥' :
                                                        project.winProbability.score >= 40 ? '⚡' : '⚠️'}
                                                </span>
                                                <span>{project.winProbability.score}% (saved)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
