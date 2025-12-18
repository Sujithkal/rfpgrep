import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../services/firebase';
import toast from 'react-hot-toast';

export default function KnowledgePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadDocuments();
    }, [user]);

    const loadDocuments = async () => {
        if (!user?.uid) return;

        try {
            const listRef = ref(storage, `users/${user.uid}/knowledge`);
            const result = await listAll(listRef);

            const docs = await Promise.all(
                result.items.map(async (item) => {
                    const url = await getDownloadURL(item);
                    return {
                        name: item.name,
                        fullPath: item.fullPath,
                        url: url,
                        uploadedAt: new Date().toISOString(), // Placeholder
                    };
                })
            );

            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a PDF, Word, or text file');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setUploading(true);

        try {
            const fileName = `${Date.now()}_${file.name}`;
            const fileRef = ref(storage, `users/${user.uid}/knowledge/${fileName}`);
            await uploadBytes(fileRef, file);

            toast.success('Document uploaded successfully!');
            loadDocuments();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (doc) => {
        if (!confirm(`Delete "${doc.name}"?`)) return;

        try {
            const fileRef = ref(storage, doc.fullPath);
            await deleteObject(fileRef);
            toast.success('Document deleted');
            setDocuments(prev => prev.filter(d => d.fullPath !== doc.fullPath));
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete document');
        }
    };

    const getFileIcon = (name) => {
        if (name.endsWith('.pdf')) return '📕';
        if (name.endsWith('.doc') || name.endsWith('.docx')) return '📘';
        if (name.endsWith('.txt')) return '📄';
        return '📁';
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 transition-colors">
                                ← Back
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">📚 Knowledge Library</h1>
                                <p className="text-sm text-gray-500">
                                    Upload company documents to improve AI responses
                                </p>
                            </div>
                        </div>

                        <label className={`px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold cursor-pointer hover:scale-105 transition-transform ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Uploading...
                                </span>
                            ) : (
                                <span>+ Upload Document</span>
                            )}
                        </label>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Info Banner */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                        🤖 How Knowledge Library Works
                    </h3>
                    <p className="text-indigo-700">
                        Upload your company documents (past proposals, certifications, case studies) and our AI will use this information to generate more accurate, personalized responses for your RFPs.
                    </p>
                </div>

                {/* Documents Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading documents...</p>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Upload your company documents to help the AI generate better, more personalized responses.
                        </p>
                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-indigo-700 transition-colors">
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            Upload Your First Document
                        </label>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {documents.map((doc, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">{getFileIcon(doc.name)}</span>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{doc.name.replace(/^\d+_/, '')}</h4>
                                        <p className="text-sm text-gray-500">Uploaded document</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        View
                                    </a>
                                    <button
                                        onClick={() => handleDelete(doc)}
                                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Supported Formats */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>Supported formats: PDF, Word (.doc, .docx), Text (.txt) • Max file size: 10MB</p>
                </div>
            </div>
        </div>
    );
}
