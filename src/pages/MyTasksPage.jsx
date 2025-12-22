import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../services/projectService';

/**
 * My Tasks Page
 * Shows all questions assigned to the current user across all projects
 */
export default function MyTasksPage() {
    const { user, userData, effectiveTeamId, teamRole } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [myTasks, setMyTasks] = useState([]);
    const [filter, setFilter] = useState('all'); // all, draft, review, approved

    useEffect(() => {
        const fetchMyTasks = async () => {
            if (!effectiveTeamId || !user?.email) return;

            setLoading(true);
            try {
                // Fetch all projects from the team
                const projects = await getProjects(effectiveTeamId);

                // Extract questions assigned to me
                const tasks = [];
                projects.forEach(project => {
                    project.sections?.forEach((section, sectionIndex) => {
                        section.questions?.forEach((question, questionIndex) => {
                            if (question.assignedTo?.toLowerCase() === user.email.toLowerCase()) {
                                tasks.push({
                                    ...question,
                                    projectId: project.id,
                                    projectName: project.name,
                                    sectionIndex,
                                    questionIndex,
                                    sectionName: section.name || section.title || `Section ${sectionIndex + 1}`
                                });
                            }
                        });
                    });
                });

                setMyTasks(tasks);
            } catch (error) {
                console.error('Failed to fetch tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyTasks();
    }, [effectiveTeamId, user?.email]);

    // Filter tasks
    const filteredTasks = myTasks.filter(task => {
        if (filter === 'all') return true;
        const status = task.workflowStatus || task.status || 'draft';
        return status === filter;
    });

    // Status counts
    const statusCounts = {
        all: myTasks.length,
        draft: myTasks.filter(t => (t.workflowStatus || t.status || 'draft') === 'draft').length,
        in_review: myTasks.filter(t => t.workflowStatus === 'in_review').length,
        approved: myTasks.filter(t => t.workflowStatus === 'approved').length
    };

    const getStatusBadge = (task) => {
        const status = task.workflowStatus || task.status || 'draft';
        switch (status) {
            case 'approved':
            case 'final':
                return { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved', icon: '✅' };
            case 'in_review':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Review', icon: '👀' };
            default:
                return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Draft', icon: '📝' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard">
                                <button className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors">
                                    ← Dashboard
                                </button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    📋 My Tasks
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Questions assigned to you • {myTasks.length} total
                                </p>
                            </div>
                        </div>

                        {/* Role Badge */}
                        <div className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
                            {teamRole || 'team member'}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'all', label: 'All Tasks' },
                        { id: 'draft', label: '📝 Draft' },
                        { id: 'in_review', label: '👀 In Review' },
                        { id: 'approved', label: '✅ Approved' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                }`}
                        >
                            {tab.label} ({statusCounts[tab.id] || 0})
                        </button>
                    ))}
                </div>

                {/* Tasks List */}
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <span className="text-6xl mb-4 block">📭</span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {filter === 'all' ? 'No tasks assigned yet' : `No ${filter} tasks`}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {filter === 'all'
                                ? 'When an admin assigns questions to you, they will appear here.'
                                : 'Try a different filter to see more tasks.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTasks.map((task, idx) => {
                            const statusBadge = getStatusBadge(task);
                            return (
                                <Link
                                    key={`${task.projectId}-${task.sectionIndex}-${task.questionIndex}`}
                                    to={`/editor?projectId=${task.projectId}`}
                                    className="block"
                                >
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-shadow group">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                {/* Project & Section */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                        {task.projectName}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        → {task.sectionName}
                                                    </span>
                                                </div>

                                                {/* Question */}
                                                <h3 className="text-gray-900 dark:text-white font-medium mb-2 group-hover:text-indigo-600 transition-colors">
                                                    {task.text || task.question || 'Question text'}
                                                </h3>

                                                {/* Response Preview */}
                                                {task.response ? (
                                                    <p className="text-sm text-gray-500 line-clamp-2">
                                                        {task.response.substring(0, 150)}...
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-orange-500 italic">
                                                        ⚠️ No response yet - needs your attention
                                                    </p>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <div className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                                {statusBadge.icon} {statusBadge.label}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <span className="text-xs text-gray-500">
                                                Assigned by: {task.assignedBy || 'Admin'}
                                            </span>
                                            <span className="text-xs text-indigo-600 font-medium group-hover:underline">
                                                Open in Editor →
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
