import { useState } from 'react';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function NewProjectModal({ onClose, onCreate }) {
    const [formData, setFormData] = useState({
        name: '',
        client: '',
        type: 'rfp',
        priority: 'medium',
        dueDate: ''
    });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Validate file type
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload a PDF, Word, or Excel file');
            return;
        }

        // Validate file size (50MB max)
        if (selectedFile.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB');
            return;
        }

        setFile(selectedFile);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Project name is required');
            return;
        }

        if (!file) {
            setError('Please upload an RFP document');
            return;
        }

        setUploading(true);
        setError('');

        try {
            // Pass to parent with file
            await onCreate({
                ...formData,
                file: file
            });
        } catch (err) {
            console.error('Error creating project:', err);
            setError(err.message || 'Failed to create project');
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <span className="text-red-500 text-xl">⚠️</span>
                            <p className="text-sm text-red-800 flex-1">{error}</p>
                        </div>
                    )}

                    {/* Project Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Project Details</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Healthcare EMR RFP 2024"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                required
                                disabled={uploading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Client Name
                            </label>
                            <input
                                type="text"
                                name="client"
                                value={formData.client}
                                onChange={handleChange}
                                placeholder="e.g., National Cancer Grid"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                disabled={uploading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                    disabled={uploading}
                                >
                                    <option value="rfp">RFP (Request for Proposal)</option>
                                    <option value="rfq">RFQ (Request for Quotation)</option>
                                    <option value="ddq">DDQ (Due Diligence Questionnaire)</option>
                                    <option value="security">Security Questionnaire</option>
                                    <option value="tender">Tender</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                    disabled={uploading}
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                                disabled={uploading}
                            />
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Upload RFP Document <span className="text-red-500">*</span></h3>

                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file
                                ? 'border-green-400 bg-green-50'
                                : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
                                }`}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                accept=".pdf,.docx,.xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={uploading}
                            />

                            <label htmlFor="file-upload" className="cursor-pointer">
                                {file ? (
                                    <div>
                                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                                            <span className="text-3xl">✓</span>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 mb-1">{file.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFile(null);
                                            }}
                                            className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                            disabled={uploading}
                                        >
                                            Change file
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                                            <span className="text-3xl">📄</span>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900 mb-1">
                                            Drop file here or click to browse
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Supports PDF, Word, Excel (Max 50MB)
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <span className="text-blue-600 text-xl">ℹ️</span>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">What happens next?</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Your document will be uploaded securely</li>
                                    <li>AI will automatically extract all questions</li>
                                    <li>You'll be redirected to the editor to start answering</li>
                                    <li>Typical processing time: 15-30 seconds</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !file || !formData.name.trim()}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {uploading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Creating Project...
                                </span>
                            ) : (
                                'Create Project & Import RFP'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
