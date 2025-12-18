import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRFP } from '../services/rfpService';
import { checkPlanLimits, PLANS } from '../services/paymentService';
import GoNoGoModal from '../components/GoNoGoModal';

export default function UploadPage() {
    const { user, userData } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [metadata, setMetadata] = useState({
        name: '',
        clientName: '',
        dueDate: '',
    });
    const [showGoNoGo, setShowGoNoGo] = useState(false);
    const [goNoGoResult, setGoNoGoResult] = useState(null);

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) return;

        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload a PDF, Excel, or Word document');
            return;
        }

        if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
            setError('File size must be less than 50MB');
            return;
        }

        setFile(selectedFile);
        setError('');

        // Auto-fill name from filename
        if (!metadata.name) {
            setMetadata({
                ...metadata,
                name: selectedFile.name.replace(/\.[^/.]+$/, '')
            });
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        if (!metadata.name) {
            setError('Please enter an RFP name');
            return;
        }

        if (!user) {
            setError('Please log in to upload RFPs');
            navigate('/login');
            return;
        }

        // Check plan limits before creating project
        const limitCheck = checkPlanLimits(userData, 'projects');
        if (!limitCheck.allowed) {
            setError(`You've used ${limitCheck.current} of ${limitCheck.limit} projects this month. Please upgrade your plan to create more projects.`);
            return;
        }

        setUploading(true);
        setError('');

        try {
            // Use teamId if available, otherwise create a default one
            const teamId = userData?.teamId || `team_${user.uid}`;

            const result = await createRFP(
                file,
                teamId,
                user.uid,
                metadata
            );

            // Navigate to RFP detail page (will create later)
            navigate(`/dashboard`);
        } catch (err) {
            setError(err.message || 'Failed to upload RFP');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ← Back to Dashboard
                        </button>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <h1 className="text-lg font-semibold text-gray-900">Upload New RFP</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload RFP Document</h2>
                    <p className="text-gray-600 mb-8">
                        Upload your RFP file and we'll automatically extract questions for you to answer
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* File Upload Area */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'
                            }`}
                    >
                        {file ? (
                            <div>
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                    📄
                                </div>
                                <p className="text-lg font-semibold text-gray-900 mb-1">{file.name}</p>
                                <p className="text-sm text-gray-500 mb-4">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <button
                                    onClick={() => setFile(null)}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                    📁
                                </div>
                                <p className="text-lg font-semibold text-gray-900 mb-2">
                                    Drag and drop your file here
                                </p>
                                <p className="text-sm text-gray-500 mb-4">or</p>
                                <label className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors cursor-pointer">
                                    Browse Files
                                    <input
                                        type="file"
                                        onChange={handleFileSelect}
                                        accept=".pdf,.xlsx,.xls,.docx"
                                        className="hidden"
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-4">
                                    Supports PDF, Excel (.xlsx, .xls), Word (.docx) • Max 50MB
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Metadata Form */}
                    {file && (
                        <div className="mt-8 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    RFP Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={metadata.name}
                                    onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g., Healthcare IT Services RFP"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Client Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={metadata.clientName}
                                    onChange={(e) => setMetadata({ ...metadata, clientName: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g., Acme Corp"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Due Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={metadata.dueDate}
                                    onChange={(e) => setMetadata({ ...metadata, dueDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            {/* Go/No-Go Evaluation */}
                            <div className="border-t border-gray-200 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowGoNoGo(true)}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-md mb-3"
                                >
                                    🎯 Evaluate Opportunity (Go/No-Go)
                                </button>

                                {goNoGoResult && (
                                    <div className={`p-4 rounded-lg mb-4 ${goNoGoResult.decision === 'GO' ? 'bg-green-50 border border-green-200' :
                                            goNoGoResult.decision === 'MAYBE' ? 'bg-yellow-50 border border-yellow-200' :
                                                'bg-red-50 border border-red-200'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">
                                                    {goNoGoResult.decision === 'GO' ? '✅' :
                                                        goNoGoResult.decision === 'MAYBE' ? '⚠️' : '❌'}
                                                </span>
                                                <span className={`font-bold ${goNoGoResult.decision === 'GO' ? 'text-green-700' :
                                                        goNoGoResult.decision === 'MAYBE' ? 'text-yellow-700' :
                                                            'text-red-700'
                                                    }`}>
                                                    Decision: {goNoGoResult.decision}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                Score: {goNoGoResult.overallScore}%
                                            </span>
                                        </div>
                                        {goNoGoResult.notes && (
                                            <p className="text-sm text-gray-600 mt-2">{goNoGoResult.notes}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {uploading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Uploading & Processing...
                                    </span>
                                ) : (
                                    'Upload RFP'
                                )}
                            </button>

                            <p className="text-xs text-center text-gray-500">
                                Your RFP will be processed automatically. This may take a few minutes depending on file size.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Go/No-Go Modal */}
            <GoNoGoModal
                isOpen={showGoNoGo}
                onClose={() => setShowGoNoGo(false)}
                projectName={metadata.name || file?.name || 'New RFP'}
                onDecision={(result) => {
                    setGoNoGoResult(result);
                    setShowGoNoGo(false);
                }}
            />
        </div>
    );
}
