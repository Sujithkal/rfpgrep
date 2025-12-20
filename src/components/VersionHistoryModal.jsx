import { useState } from 'react';

export default function VersionHistoryModal({
    isOpen,
    onClose,
    question,
    onRestoreVersion,
    questionNumber
}) {
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [comparing, setComparing] = useState(false);

    if (!isOpen) return null;

    const versions = question?.versions || [];
    const currentContent = question?.response || '';

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get change type badge
    const getChangeTypeBadge = (type) => {
        switch (type) {
            case 'generated':
                return { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-300', label: 'AI Generated' };
            case 'edited':
                return { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300', label: 'Manual Edit' };
            case 'approved':
                return { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300', label: 'Approved' };
            case 'restored':
                return { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-700 dark:text-orange-300', label: 'Restored' };
            default:
                return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Draft' };
        }
    };

    // Handle restore
    const handleRestore = (version) => {
        if (confirm('Restore this version? The current response will be saved to history.')) {
            onRestoreVersion(version.content);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                📜 Version History
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Question {questionNumber} • {versions.length} previous versions
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Version List */}
                    <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                        {/* Current Version */}
                        <div
                            className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${selectedVersion === null ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-l-indigo-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            onClick={() => setSelectedVersion(null)}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">CURRENT</span>
                                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                                    Active
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">
                                {currentContent?.substring(0, 100) || 'No content'}...
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {question?.lastEditedAt ? formatDate(question.lastEditedAt) : 'Recently'}
                            </p>
                        </div>

                        {/* Previous Versions */}
                        {versions.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                No previous versions yet.
                                <br />
                                Edit the response to create history.
                            </div>
                        ) : (
                            [...versions].reverse().map((version, idx) => {
                                const badge = getChangeTypeBadge(version.changeType);
                                const versionNum = versions.length - idx;

                                return (
                                    <div
                                        key={version.id}
                                        className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${selectedVersion?.id === version.id
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-l-indigo-500'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        onClick={() => setSelectedVersion(version)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                Version {versionNum}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 ${badge.bg} ${badge.text} rounded-full`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">
                                            {version.content?.substring(0, 80) || 'Empty'}...
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                {formatDate(version.editedAt)}
                                            </p>
                                            {version.trustScore && (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    Trust: {version.trustScore}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Version Preview */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
                        {selectedVersion === null ? (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Current Version</h3>
                                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                                        Active
                                    </span>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {currentContent || 'No response yet'}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        Previous Version
                                    </h3>
                                    <button
                                        onClick={() => handleRestore(selectedVersion)}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        ↩️ Restore This Version
                                    </button>
                                </div>

                                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                                    <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-300">
                                        <span>
                                            <strong>Edited by:</strong> {selectedVersion.editedBy?.name || 'Unknown'}
                                        </span>
                                        <span>
                                            <strong>Date:</strong> {formatDate(selectedVersion.editedAt)}
                                        </span>
                                        {selectedVersion.trustScore && (
                                            <span>
                                                <strong>Trust Score:</strong> {selectedVersion.trustScore}%
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {selectedVersion.content}
                                </div>

                                {comparing && (
                                    <div className="mt-4">
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Compare with Current:</h4>
                                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                            {currentContent}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setComparing(!comparing)}
                                    className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    {comparing ? 'Hide Comparison' : 'Compare with Current'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-100 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
