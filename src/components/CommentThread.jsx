/**
 * CommentThread Component
 * Shows comment discussion for a question
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    addComment,
    subscribeToComments,
    updateComment,
    deleteComment,
    resolveComment,
    addReaction
} from '../services/commentService';

export default function CommentThread({ projectId, questionId, questionText, onClose }) {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    // Subscribe to comments
    useEffect(() => {
        if (!user?.uid || !projectId || !questionId) return;

        const unsubscribe = subscribeToComments(user.uid, projectId, questionId, (data) => {
            setComments(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, projectId, questionId]);

    // Handle submit new comment
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            await addComment(user.uid, projectId, questionId, {
                text: newComment.trim(),
                authorId: user.uid,
                authorName: user.displayName || user.email,
                authorAvatar: user.photoURL
            });
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
        setSubmitting(false);
    };

    // Handle edit
    const handleEdit = async (commentId) => {
        if (!editText.trim()) return;
        try {
            await updateComment(user.uid, projectId, commentId, editText.trim());
            setEditingId(null);
            setEditText('');
        } catch (error) {
            console.error('Failed to edit:', error);
        }
    };

    // Handle delete
    const handleDelete = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await deleteComment(user.uid, projectId, commentId);
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    // Handle resolve
    const handleResolve = async (commentId, currentState) => {
        try {
            await resolveComment(user.uid, projectId, commentId, !currentState);
        } catch (error) {
            console.error('Failed to resolve:', error);
        }
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            💬 Comments
                            {comments.length > 0 && (
                                <span className="text-sm font-normal text-gray-500">
                                    ({comments.length})
                                </span>
                            )}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {questionText}
                    </p>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto"></div>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <span className="text-4xl mb-2 block">💭</span>
                            No comments yet. Start the discussion!
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div
                                key={comment.id}
                                className={`p-3 rounded-lg ${comment.isResolved
                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                        : 'bg-gray-50 dark:bg-gray-700'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {comment.authorAvatar ? (
                                            <img src={comment.authorAvatar} alt="" className="w-8 h-8 rounded-full" />
                                        ) : (
                                            comment.authorName?.charAt(0)?.toUpperCase() || '?'
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                                                {comment.authorName}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatTime(comment.createdAt)}
                                            </span>
                                            {comment.isEdited && (
                                                <span className="text-xs text-gray-400">(edited)</span>
                                            )}
                                            {comment.isResolved && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                    ✓ Resolved
                                                </span>
                                            )}
                                        </div>

                                        {editingId === comment.id ? (
                                            <div className="mt-2">
                                                <textarea
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="w-full p-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                                    rows={2}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleEdit(comment.id)}
                                                        className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                                                {comment.text}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        {comment.authorId === user?.uid && !editingId && (
                                            <div className="flex gap-3 mt-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(comment.id);
                                                        setEditText(comment.text);
                                                    }}
                                                    className="text-xs text-gray-500 hover:text-indigo-600"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="text-xs text-gray-500 hover:text-red-600"
                                                >
                                                    Delete
                                                </button>
                                                <button
                                                    onClick={() => handleResolve(comment.id, comment.isResolved)}
                                                    className="text-xs text-gray-500 hover:text-green-600"
                                                >
                                                    {comment.isResolved ? 'Unresolve' : 'Resolve'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* New Comment Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? '...' : 'Send'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
