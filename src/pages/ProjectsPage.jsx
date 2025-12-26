import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects, createProject, updateProjectOutcome, updateProject, deleteProject } from '../services/projectService';
import { checkLimit, incrementUsage } from '../services/usageService';
import NewProjectModal from '../components/NewProjectModal';

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [filter, setFilter] = useState('all'); // all | active | review | submitted | team | personal
    const [searchQuery, setSearchQuery] = useState('');
    const { user: currentUser, effectiveTeamId, isTeamMember, isTeamOwner, canEdit } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            console.log('[ProjectsPage] User logged in:', currentUser.uid);
            console.log('[ProjectsPage] Effective Team ID:', effectiveTeamId);
            console.log('[ProjectsPage] Is Team Member:', isTeamMember);
            loadProjects();
        }
    }, [currentUser, effectiveTeamId]);

    const loadProjects = async () => {
        if (!currentUser?.uid) return;

        try {
            console.log('[ProjectsPage] Fetching projects...');

            // If user is a team member, fetch team owner's projects
            const ownerIdToFetch = effectiveTeamId || currentUser.uid;
            console.log('[ProjectsPage] Fetching from owner:', ownerIdToFetch);

            const projectsData = await getProjects(ownerIdToFetch);

            // Mark each project with its source
            let projectsWithSource = projectsData.map(p => ({
                ...p,
                isTeamProject: p.visibility === 'team', // Use visibility setting
                isPersonalProject: p.visibility !== 'team',
                ownerId: ownerIdToFetch
            }));

            // If user is a team member (not owner), filter out personal projects
            if (isTeamMember && !isTeamOwner) {
                console.log('[ProjectsPage] Filtering personal projects for team member');
                projectsWithSource = projectsWithSource.filter(p => p.visibility === 'team');
            }

            console.log('[ProjectsPage] Got projects:', projectsWithSource.length);
            setProjects(projectsWithSource);
        } catch (error) {
            console.error('[ProjectsPage] Error loading projects:', error);
            setProjects([]);
        }
    };

    const handleCreateProject = async (projectData) => {
        if (!currentUser?.uid) {
            console.error('No currentUser available!', currentUser);
            alert('Authentication error. Please refresh the page and try again.');
            return;
        }

        // Check project creation limit
        const limitCheck = await checkLimit(currentUser.uid, 'createProject');
        if (!limitCheck.allowed) {
            alert(`🚫 Project Limit Reached!\n\n${limitCheck.reason}\n\nPlease upgrade your plan to create more projects.\n\n👉 Go to Settings → Billing to upgrade.`);
            return;
        }

        try {
            console.log('Creating project for user:', currentUser.uid);
            const newProject = await createProject(currentUser.uid, projectData);

            // Increment project usage counter
            await incrementUsage(currentUser.uid, 'project');

            setProjects([newProject, ...projects]);
            setShowNewProjectModal(false);
            alert(`Project "${newProject.name}" created! Check back in 30 seconds for parsed questions.`);
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project: ' + error.message);
        }
    };

    const filteredProjects = projects.filter(project => {
        // Apply status filter
        if (filter !== 'all') {
            // Active includes: processing, ready, in-progress, draft
            if (filter === 'active' && !['processing', 'ready', 'in-progress', 'draft'].includes(project.status)) return false;
            // Review includes: review, in_review
            if (filter === 'review' && !['review', 'in_review'].includes(project.status)) return false;
            // Submitted includes: submitted, approved
            if (filter === 'submitted' && !['submitted', 'approved'].includes(project.status)) return false;
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                project.name.toLowerCase().includes(query) ||
                project.client?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-700';
            case 'in-progress': return 'bg-blue-100 text-blue-700';
            case 'review': return 'bg-amber-100 text-amber-700';
            case 'approved': return 'bg-green-100 text-green-700';
            case 'submitted': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-600';
            case 'medium': return 'text-amber-600';
            case 'low': return 'text-gray-600';
            default: return 'text-gray-600';
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'No deadline';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDaysUntilDue = (dueDate) => {
        if (!dueDate) return null;
        const date = dueDate.toDate ? dueDate.toDate() : new Date(dueDate);
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Handle win/lost/pending outcome change
    const handleUpdateStatus = async (e, projectId, newStatus) => {
        e.stopPropagation(); // Prevent card click
        try {
            await updateProject(currentUser.uid, projectId, { status: newStatus });
            // Update local state
            setProjects(prev => prev.map(p =>
                p.id === projectId ? { ...p, status: newStatus } : p
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handleUpdateOutcome = async (projectId, outcome) => {
        try {
            await updateProjectOutcome(currentUser.uid, projectId, outcome);
            // Update local state
            setProjects(prev => prev.map(p =>
                p.id === projectId ? { ...p, outcome } : p
            ));
        } catch (error) {
            console.error('Error updating outcome:', error);
            alert('Failed to update outcome');
        }
    };

    // Handle visibility change (team vs personal)
    const handleUpdateVisibility = async (e, projectId, newVisibility) => {
        e.stopPropagation(); // Prevent card click
        try {
            const ownerId = effectiveTeamId || currentUser.uid;
            await updateProject(ownerId, projectId, { visibility: newVisibility });
            // Update local state
            setProjects(prev => prev.map(p =>
                p.id === projectId ? { ...p, visibility: newVisibility, isTeamProject: newVisibility === 'team' } : p
            ));
        } catch (error) {
            console.error('Error updating visibility:', error);
            alert('Failed to update visibility');
        }
    };

    const getOutcomeColor = (outcome) => {
        switch (outcome) {
            case 'won': return 'bg-green-100 text-green-700 border-green-300';
            case 'lost': return 'bg-red-100 text-red-700 border-red-300';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    // Handle project deletion
    const handleDeleteProject = async (e, projectId, projectName) => {
        e.stopPropagation();
        const confirmed = window.confirm(
            `⚠️ Delete project "${projectName}"?\n\nThis will permanently delete all questions and responses. This action cannot be undone.`
        );
        if (!confirmed) return;

        try {
            await deleteProject(currentUser.uid, projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            alert('Project deleted successfully.');
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading projects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Back Button */}
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <span className="text-xl">←</span>
                                <span className="font-medium">Back to Dashboard</span>
                            </Link>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Projects</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowNewProjectModal(true)}
                                disabled={!currentUser}
                                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-md disabled:opacity-50"
                            >
                                + New Project
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page Title & Filters */}
                <div className="max-w-7xl mx-auto px-6 py-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            {['all', 'active', 'review', 'submitted'].map(filterOption => (
                                <button
                                    key={filterOption}
                                    onClick={() => setFilter(filterOption)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === filterOption
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                                </button>
                            ))}
                        </div>

                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">📁</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {searchQuery || filter !== 'all' ? 'No projects found' : 'No projects yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery || filter !== 'all'
                                ? 'Try adjusting your filters or search query'
                                : 'Create your first project to get started with RFP automation'
                            }
                        </p>
                        {!searchQuery && filter === 'all' && (
                            <button
                                onClick={() => setShowNewProjectModal(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                Create First Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map(project => {
                            const daysUntilDue = getDaysUntilDue(project.dueDate);
                            const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                            const isUrgent = daysUntilDue !== null && daysUntilDue < 7 && daysUntilDue >= 0;

                            return (
                                <div
                                    key={project.id}
                                    onClick={() => navigate(`/editor?projectId=${project.id}`)}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer overflow-hidden group"
                                >
                                    {/* Header */}
                                    <div className="p-6 border-b border-gray-100">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                        {project.name}
                                                    </h3>
                                                    {/* Team/Personal Visibility Selector (for owners/admins) */}
                                                    {isTeamOwner ? (
                                                        <select
                                                            onClick={(e) => e.stopPropagation()}
                                                            value={project.visibility || 'personal'}
                                                            onChange={(e) => handleUpdateVisibility(e, project.id, e.target.value)}
                                                            className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer border-0 ${project.visibility === 'team'
                                                                    ? 'bg-purple-100 text-purple-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                        >
                                                            <option value="personal">👤 Personal</option>
                                                            <option value="team">👥 Team</option>
                                                        </select>
                                                    ) : (
                                                        /* Show static badge for non-owners */
                                                        project.visibility === 'team' ? (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                                                                👥 Team
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                                                👤 Personal
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                            <select
                                                onClick={(e) => e.stopPropagation()}
                                                value={project.status}
                                                onChange={(e) => handleUpdateStatus(e, project.id, e.target.value)}
                                                className={`text-xs px-2 py-1 rounded-md font-medium cursor-pointer border-0 ${getStatusColor(project.status)}`}
                                            >
                                                <option value="processing">Processing</option>
                                                <option value="ready">Ready</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="review">In Review</option>
                                                <option value="submitted">Submitted</option>
                                                <option value="approved">Approved</option>
                                            </select>
                                        </div>

                                        {project.client && (
                                            <p className="text-sm text-gray-600 mb-2">
                                                🏢 {project.client}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className={getPriorityColor(project.priority || 'medium')}>
                                                ● {(project.priority || 'medium').toUpperCase()}
                                            </span>
                                            <span>
                                                {project.type?.toUpperCase() || 'RFP'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="px-6 py-4 bg-gray-50">
                                        <div className="mb-2">
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-gray-600 font-medium">Progress</span>
                                                <span className="text-gray-900 font-semibold">
                                                    {project.stats?.progress || 0}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-300"
                                                    style={{ width: `${project.stats?.progress || 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            <span>
                                                {project.stats?.answered || 0} / {project.stats?.totalQuestions || 0} answered
                                            </span>
                                            {project.stats?.approved > 0 && (
                                                <span className="text-green-600 font-medium">
                                                    ✓ {project.stats.approved} approved
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-4 flex items-center justify-between">
                                        <div className="text-sm">
                                            {project.dueDate ? (
                                                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' :
                                                    isUrgent ? 'text-amber-600 font-medium' :
                                                        'text-gray-600'
                                                    }`}>
                                                    <span>📅</span>
                                                    <span>
                                                        {isOverdue ? 'Overdue' : isUrgent ? `${daysUntilDue} days left` : formatDate(project.dueDate)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">No deadline</span>
                                            )}
                                        </div>

                                        {project.team && (
                                            <div className="flex -space-x-2">
                                                {project.team.editors?.slice(0, 3).map((userId, i) => (
                                                    <div
                                                        key={userId}
                                                        className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
                                                        title={`Team member ${i + 1}`}
                                                    >
                                                        {String.fromCharCode(65 + i)}
                                                    </div>
                                                ))}
                                                {project.team.editors?.length > 3 && (
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-700 text-xs font-semibold">
                                                        +{project.team.editors.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Outcome (Won/Lost) Section */}
                                    <div
                                        className="px-6 py-3 border-t border-gray-100 flex items-center justify-between"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span className="text-xs text-gray-500 font-medium">Outcome:</span>
                                        <div className="flex gap-1">
                                            {[
                                                { value: 'won', label: '🏆 Won', color: 'green' },
                                                { value: 'lost', label: '❌ Lost', color: 'red' },
                                                { value: 'pending', label: '⏳ Pending', color: 'yellow' }
                                            ].map(({ value, label, color }) => (
                                                <button
                                                    key={value}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleUpdateOutcome(project.id, project.outcome === value ? null : value);
                                                    }}
                                                    className={`px-2 py-1 text-xs rounded-md border font-medium transition-all ${project.outcome === value
                                                        ? getOutcomeColor(value)
                                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="px-6 py-2 border-t border-gray-100 flex items-center gap-2">
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const { generateMeetingNotes } = await import('../services/meetingNotesService');
                                                const result = await generateMeetingNotes(project, 'progress');
                                                if (result.success) {
                                                    // Create a blob and download as text file
                                                    const blob = new Blob([result.notes], { type: 'text/plain' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${project.name.replace(/\s+/g, '_')}_meeting_notes.txt`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }
                                            }}
                                            className="flex-1 py-1.5 px-2 text-xs bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors font-medium"
                                        >
                                            📝 Meeting Notes
                                        </button>
                                        <Link
                                            to={`/editor?projectId=${project.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 py-1.5 px-2 text-xs bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors font-medium text-center"
                                        >
                                            ✏️ Edit RFP
                                        </Link>
                                        <button
                                            onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                                            className="py-1.5 px-2 text-xs bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors font-medium"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* New Project Modal */}
            {
                showNewProjectModal && (
                    <NewProjectModal
                        onClose={() => setShowNewProjectModal(false)}
                        onCreate={handleCreateProject}
                    />
                )
            }
        </div >
    );
}
