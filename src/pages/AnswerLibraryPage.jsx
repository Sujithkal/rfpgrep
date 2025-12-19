import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getAnswers,
    createAnswer,
    updateAnswer,
    deleteAnswer,
    searchAnswers,
    getCategories,
    findDuplicates,
    findOutdatedAnswers,
    bulkDeleteAnswers,
    DEFAULT_CATEGORIES
} from '../services/answerLibraryService';

export default function AnswerLibraryPage() {
    const { user } = useAuth();
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const [editingAnswer, setEditingAnswer] = useState(null);
    const [selectedAnswers, setSelectedAnswers] = useState([]);

    // Form state
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'General',
        tags: ''
    });

    // Cleanup state
    const [duplicates, setDuplicates] = useState([]);
    const [outdated, setOutdated] = useState([]);
    const [cleanupLoading, setCleanupLoading] = useState(false);

    // Load answers
    useEffect(() => {
        loadAnswers();
    }, [user]);

    const loadAnswers = async () => {
        if (!user?.uid) return;
        setLoading(true);

        const result = await getAnswers(user.uid);
        if (result.success) {
            setAnswers(result.answers);
        }

        const catResult = await getCategories(user.uid);
        if (catResult.success) {
            setCategories([...new Set([...DEFAULT_CATEGORIES, ...catResult.categories])]);
        }

        setLoading(false);
    };

    // Search handler
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadAnswers();
            return;
        }

        setLoading(true);
        const result = await searchAnswers(user.uid, searchQuery);
        if (result.success) {
            setAnswers(result.answers);
        }
        setLoading(false);
    };

    // Filter by category
    const filteredAnswers = selectedCategory === 'all'
        ? answers
        : answers.filter(a => a.category === selectedCategory);

    // Create/Update answer
    const handleSaveAnswer = async () => {
        if (!formData.question.trim() || !formData.answer.trim()) {
            alert('Question and Answer are required');
            return;
        }

        const data = {
            question: formData.question,
            answer: formData.answer,
            category: formData.category,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        };

        let result;
        if (editingAnswer) {
            result = await updateAnswer(user.uid, editingAnswer.id, data);
        } else {
            result = await createAnswer(user.uid, data);
        }

        if (result.success) {
            setShowAddModal(false);
            setEditingAnswer(null);
            setFormData({ question: '', answer: '', category: 'General', tags: '' });
            loadAnswers();
        } else {
            alert('Failed to save: ' + result.error);
        }
    };

    // Delete answer
    const handleDelete = async (answerId) => {
        if (!confirm('Delete this answer?')) return;

        const result = await deleteAnswer(user.uid, answerId);
        if (result.success) {
            loadAnswers();
        }
    };

    // Edit answer
    const handleEdit = (answer) => {
        setEditingAnswer(answer);
        setFormData({
            question: answer.question || '',
            answer: answer.answer || '',
            category: answer.category || 'General',
            tags: (answer.tags || []).join(', ')
        });
        setShowAddModal(true);
    };

    // Cleanup functions
    const runCleanup = async () => {
        setCleanupLoading(true);

        const dupResult = await findDuplicates(user.uid);
        if (dupResult.success) {
            setDuplicates(dupResult.duplicates);
        }

        const outResult = await findOutdatedAnswers(user.uid);
        if (outResult.success) {
            setOutdated(outResult.outdated);
        }

        setCleanupLoading(false);
        setShowCleanupModal(true);
    };

    // Bulk delete
    const handleBulkDelete = async (ids) => {
        if (!confirm(`Delete ${ids.length} answers?`)) return;

        const result = await bulkDeleteAnswers(user.uid, ids);
        if (result.success) {
            setShowCleanupModal(false);
            loadAnswers();
        }
    };

    // Copy answer to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    if (loading && answers.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard">
                                <button className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
                                    ← Back
                                </button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">📚 Answer Library</h1>
                                <p className="text-sm text-gray-500">{answers.length} saved answers</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={runCleanup}
                                className="px-4 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium"
                            >
                                🧹 Cleanup
                            </button>
                            <button
                                onClick={() => {
                                    setEditingAnswer(null);
                                    setFormData({ question: '', answer: '', category: 'General', tags: '' });
                                    setShowAddModal(true);
                                }}
                                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                            >
                                + Add Answer
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Search & Filter Bar */}
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex-1 flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                        >
                            🔍 Search
                        </button>
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Answers Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-8">
                {filteredAnswers.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No answers yet</h3>
                        <p className="text-gray-500 mb-4">Start building your answer library to speed up future RFPs</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium"
                        >
                            Add Your First Answer
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAnswers.map((answer) => (
                            <div
                                key={answer.id}
                                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                                        {answer.category}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => copyToClipboard(answer.answer)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                            title="Copy"
                                        >
                                            📋
                                        </button>
                                        <button
                                            onClick={() => handleEdit(answer)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title="Edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(answer.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                {/* Question */}
                                <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                                    {answer.question}
                                </h3>

                                {/* Answer Preview */}
                                <p className="text-gray-600 text-sm line-clamp-4 mb-3">
                                    {answer.answer}
                                </p>

                                {/* Tags */}
                                {answer.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {answer.tags.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                                    <span>Used {answer.usageCount || 0} times</span>
                                    <span>
                                        {answer.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingAnswer ? 'Edit Answer' : 'Add New Answer'}
                            </h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Question *
                                </label>
                                <textarea
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter the question this answer addresses..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Answer *
                                </label>
                                <textarea
                                    value={formData.answer}
                                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                    rows={6}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter the response..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {DEFAULT_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g., security, compliance, aws"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingAnswer(null);
                                }}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveAnswer}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                            >
                                {editingAnswer ? 'Update' : 'Save'} Answer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cleanup Modal */}
            {showCleanupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">🧹 Library Cleanup</h2>
                            <p className="text-sm text-gray-500">Find and remove duplicate or outdated answers</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Duplicates */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">
                                    Potential Duplicates ({duplicates.length})
                                </h3>
                                {duplicates.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No duplicates found ✅</p>
                                ) : (
                                    <div className="space-y-2">
                                        {duplicates.slice(0, 5).map((dup, i) => (
                                            <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">{dup.similarity}% similar</span>
                                                    <button
                                                        onClick={() => handleBulkDelete([dup.answer2.id])}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        Delete duplicate
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                                    "{dup.answer1.question}" ↔ "{dup.answer2.question}"
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Outdated */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">
                                    Outdated Answers ({outdated.length})
                                </h3>
                                {outdated.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No outdated answers ✅</p>
                                ) : (
                                    <div className="space-y-2">
                                        {outdated.slice(0, 5).map((ans) => (
                                            <div key={ans.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between">
                                                <span className="text-sm line-clamp-1">{ans.question}</span>
                                                <button
                                                    onClick={() => handleDelete(ans.id)}
                                                    className="text-red-600 hover:underline text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))}
                                        {outdated.length > 5 && (
                                            <button
                                                onClick={() => handleBulkDelete(outdated.map(a => a.id))}
                                                className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium"
                                            >
                                                Delete All {outdated.length} Outdated
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowCleanupModal(false)}
                                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
