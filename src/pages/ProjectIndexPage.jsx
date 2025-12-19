import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProject, updateProjectQuestion, batchUpdateQuestions } from '../services/projectService';
import { exportToPDF, exportToWord } from '../services/exportService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

// ===========================================
// CONFIGURATION: Set to false when AI is ready
// ===========================================
const USE_MOCK_AI = true; // Mock AI enabled (Gemini quota exhausted)

// Mock response generator (realistic RFP responses)
const generateMockResponse = (questionText) => {
    const responses = [
        "Our organization brings over 15 years of experience in delivering enterprise-level solutions. We have successfully completed 200+ projects across healthcare, finance, and government sectors. Our team consists of certified professionals, including PMP, AWS, and ISO certified experts. We maintain a 98% client satisfaction rate and have established long-term partnerships with Fortune 500 companies. Our methodology combines industry best practices with innovative approaches tailored to each client's unique requirements.",
        "We are committed to delivering exceptional quality through our comprehensive quality assurance framework. Our QA processes include automated testing, peer reviews, continuous integration, and dedicated QA teams. We maintain ISO 9001:2015 certification and follow CMMI Level 3 practices. All deliverables undergo rigorous multi-stage review before submission. Our track record demonstrates zero critical defects in production over the past 3 years.",
        "Our technical team includes 150+ professionals with expertise spanning cloud architecture, data analytics, cybersecurity, and enterprise integration. Team members hold certifications from AWS, Azure, Google Cloud, and Cisco. We invest heavily in continuous training, with each team member completing 40+ hours of professional development annually. Our low attrition rate of 8% ensures project continuity and institutional knowledge retention.",
        "Project delivery follows our proven AGILE+ methodology, combining Agile principles with structured governance. We provide weekly status reports, bi-weekly demos, and monthly executive briefings. Our project management office uses industry-standard tools including Jira, Confluence, and Microsoft Project. Risk management is proactive, with documented mitigation strategies reviewed in each sprint retrospective.",
        "Security is foundational to our approach. We maintain SOC 2 Type II certification and comply with HIPAA, GDPR, and FedRAMP requirements. Our security practices include encryption at rest and in transit, multi-factor authentication, regular penetration testing, and 24/7 security monitoring. All staff undergo annual security awareness training and background checks.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
};

export default function ProjectIndexPage() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const projectId = searchParams.get('projectId');

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0 });
    const [expandedQuestion, setExpandedQuestion] = useState(null);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editText, setEditText] = useState('');

    // Load project
    useEffect(() => {
        const loadProject = async () => {
            if (!user?.uid || !projectId) {
                setLoading(false);
                return;
            }

            try {
                const projectData = await getProject(user.uid, projectId);
                setProject(projectData);
            } catch (error) {
                console.error('Error loading project:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProject();
    }, [user, projectId]);

    // Generate all responses - uses mock or real AI based on config
    const handleGenerateAll = async () => {
        if (!project?.sections) return;

        setGenerating(true);

        // Collect all questions that need generation
        const questionsToGenerate = [];
        let total = 0;

        project.sections.forEach((section, sectionIndex) => {
            section.questions?.forEach((question, questionIndex) => {
                total++;
                // Only generate for questions without responses
                if (!question.response) {
                    questionsToGenerate.push({
                        sectionIndex,
                        questionIndex,
                        text: question.text
                    });
                }
            });
        });

        const alreadyDone = total - questionsToGenerate.length;
        setGeneratingProgress({ current: alreadyDone, total });

        if (questionsToGenerate.length === 0) {
            alert('All questions already have responses!');
            setGenerating(false);
            return;
        }

        // ============================================
        // MOCK MODE: Generate responses locally
        // ============================================
        if (USE_MOCK_AI) {
            console.log('Using MOCK AI responses...');
            const updates = [];

            for (let i = 0; i < questionsToGenerate.length; i++) {
                const q = questionsToGenerate[i];
                updates.push({
                    sectionIndex: q.sectionIndex,
                    questionIndex: q.questionIndex,
                    data: {
                        response: generateMockResponse(q.text),
                        status: 'generated',
                        trustScore: 75 + Math.floor(Math.random() * 20),
                        generatedAt: new Date().toISOString()
                    }
                });

                // Update progress every 10 questions
                if (i % 10 === 0) {
                    setGeneratingProgress({ current: alreadyDone + i, total });
                    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for UI update
                }
            }

            // Save all at once
            try {
                await batchUpdateQuestions(user.uid, projectId, updates);
                alert(`Success! Generated ${updates.length} responses (mock mode).`);
                const updatedProject = await getProject(user.uid, projectId);
                setProject(updatedProject);
            } catch (error) {
                console.error('Error saving:', error);
                alert('Error saving responses.');
            }

            setGenerating(false);
            return;
        }

        // ============================================
        // REAL AI MODE: Call Cloud Function
        // ============================================
        const CHUNK_SIZE = 20;
        let totalSuccess = 0;
        let totalFailure = 0;
        let processedCount = alreadyDone;
        const allUpdates = [];

        try {
            const batchGenerate = httpsCallable(functions, 'batchGenerateResponses', { timeout: 180000 });

            for (let i = 0; i < questionsToGenerate.length; i += CHUNK_SIZE) {
                const chunk = questionsToGenerate.slice(i, i + CHUNK_SIZE);
                const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;
                const totalChunks = Math.ceil(questionsToGenerate.length / CHUNK_SIZE);

                console.log(`Processing chunk ${chunkNumber}/${totalChunks} (${chunk.length} questions)...`);

                try {
                    const result = await batchGenerate({
                        questions: chunk,
                        projectContext: `Project: ${project.name}${project.client ? `, Client: ${project.client}` : ''}`,
                        tone: 'professional'
                    });

                    if (result.data.success) {
                        const chunkUpdates = result.data.responses
                            .filter(r => r.success && r.response)
                            .map(r => ({
                                sectionIndex: r.sectionIndex,
                                questionIndex: r.questionIndex,
                                data: {
                                    response: r.response,
                                    status: 'generated',
                                    trustScore: r.trustScore,
                                    generatedAt: new Date().toISOString()
                                }
                            }));

                        allUpdates.push(...chunkUpdates);
                        totalSuccess += result.data.successCount;
                        totalFailure += result.data.failureCount;
                    }
                } catch (chunkError) {
                    console.error(`Chunk ${chunkNumber} failed:`, chunkError.message);
                    totalFailure += chunk.length;
                }

                processedCount += chunk.length;
                setGeneratingProgress({ current: processedCount, total });

                if (allUpdates.length > 0) {
                    await batchUpdateQuestions(user.uid, projectId, allUpdates);
                    allUpdates.length = 0;
                }

                if (i + CHUNK_SIZE < questionsToGenerate.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            if (totalFailure > 0) {
                alert(`Complete! Generated ${totalSuccess} responses. ${totalFailure} failed.`);
            } else {
                alert(`Success! Generated ${totalSuccess} responses.`);
            }

            const updatedProject = await getProject(user.uid, projectId);
            setProject(updatedProject);

        } catch (error) {
            console.error('Error in batch generation:', error);
            alert('Error generating responses: ' + (error.message || 'Unknown error'));
        }

        setGenerating(false);
    };

    // Save single question edit
    const handleSaveEdit = async (sectionIndex, questionIndex) => {
        try {
            await updateProjectQuestion(user.uid, projectId, sectionIndex, questionIndex, {
                response: editText,
                status: 'edited'
            });

            // Update local state
            const updatedProject = { ...project };
            updatedProject.sections[sectionIndex].questions[questionIndex].response = editText;
            updatedProject.sections[sectionIndex].questions[questionIndex].status = 'edited';
            setProject(updatedProject);

            setEditingQuestion(null);
        } catch (error) {
            console.error('Error saving edit:', error);
            alert('Failed to save changes.');
        }
    };

    // Regenerate single question - uses mock or real AI
    const handleRegenerate = async (sectionIndex, questionIndex) => {
        const question = project.sections[sectionIndex].questions[questionIndex];

        try {
            let response, trustScore;

            if (USE_MOCK_AI) {
                // Mock mode
                response = generateMockResponse(question.text);
                trustScore = 75 + Math.floor(Math.random() * 20);
            } else {
                // Real AI mode
                const generateSingle = httpsCallable(functions, 'generateAIResponse');
                const result = await generateSingle({
                    questionText: question.text,
                    actionType: 'generate',
                    tone: 'professional'
                });

                if (!result.data.success) {
                    throw new Error('Generation failed');
                }
                response = result.data.response;
                trustScore = result.data.trustScore || 85;
            }

            await updateProjectQuestion(user.uid, projectId, sectionIndex, questionIndex, {
                response,
                status: 'generated',
                trustScore
            });

            // Update local state
            const updatedProject = { ...project };
            updatedProject.sections[sectionIndex].questions[questionIndex].response = response;
            updatedProject.sections[sectionIndex].questions[questionIndex].status = 'generated';
            updatedProject.sections[sectionIndex].questions[questionIndex].trustScore = trustScore;
            setProject(updatedProject);

        } catch (error) {
            console.error('Error regenerating:', error);
            alert('Failed to regenerate response: ' + (error.message || 'Unknown error'));
        }
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'edited':
                return 'bg-blue-100 text-blue-800';
            case 'generated':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading project...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Project not found</p>
                    <Link to="/dashboard" className="text-indigo-600 hover:underline">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/dashboard"
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                ← Back
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                                <p className="text-sm text-gray-500">
                                    {project.stats?.answered || 0} / {project.stats?.totalQuestions || 0} answered
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Progress bar */}
                            <div className="w-48 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${project.stats?.progress || 0}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                                {project.stats?.progress || 0}%
                            </span>

                            {/* Generate All button */}
                            <button
                                onClick={handleGenerateAll}
                                disabled={generating}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {generating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>{generatingProgress.current}/{generatingProgress.total}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        <span>Generate All</span>
                                    </>
                                )}
                            </button>

                            {/* Export Buttons */}
                            <button
                                onClick={() => {
                                    try {
                                        exportToPDF(project);
                                    } catch (e) {
                                        console.error('PDF export failed:', e);
                                        alert('Export failed');
                                    }
                                }}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                                title="Export to PDF"
                            >
                                <span>📄</span>
                                <span>PDF</span>
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        await exportToWord(project);
                                    } catch (e) {
                                        console.error('Word export failed:', e);
                                        alert('Export failed');
                                    }
                                }}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                title="Export to Word"
                            >
                                <span>📝</span>
                                <span>Word</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {project.sections?.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-8">
                        {/* Section Header */}
                        <div className="bg-gray-100 px-4 py-3 rounded-t-lg border border-gray-200">
                            <h2 className="font-semibold text-gray-800">
                                Section {sectionIndex + 1}: {section.title || 'Untitled Section'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {section.questions?.length || 0} questions
                            </p>
                        </div>

                        {/* Questions Table */}
                        <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-16">#</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Question</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-24">Status</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.questions?.map((question, questionIndex) => {
                                        const isExpanded = expandedQuestion === `${sectionIndex}-${questionIndex}`;
                                        const isEditing = editingQuestion === `${sectionIndex}-${questionIndex}`;

                                        return (
                                            <tr
                                                key={questionIndex}
                                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {sectionIndex + 1}.{questionIndex + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {/* Question text */}
                                                    <p
                                                        className="text-sm text-gray-900 cursor-pointer hover:text-indigo-600"
                                                        onClick={() => setExpandedQuestion(isExpanded ? null : `${sectionIndex}-${questionIndex}`)}
                                                    >
                                                        {question.text?.substring(0, 100)}{question.text?.length > 100 ? '...' : ''}
                                                    </p>

                                                    {/* Expanded response area */}
                                                    {isExpanded && (
                                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                            {isEditing ? (
                                                                <div>
                                                                    <textarea
                                                                        value={editText}
                                                                        onChange={(e) => setEditText(e.target.value)}
                                                                        className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none"
                                                                        rows={6}
                                                                    />
                                                                    <div className="flex gap-2 mt-2">
                                                                        <button
                                                                            onClick={() => handleSaveEdit(sectionIndex, questionIndex)}
                                                                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingQuestion(null)}
                                                                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    {question.response ? (
                                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                                            {question.response}
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-sm text-gray-400 italic">
                                                                            No response yet. Click "Generate All" or regenerate individually.
                                                                        </p>
                                                                    )}
                                                                    {question.trustScore && (
                                                                        <div className="mt-2 text-xs text-gray-500">
                                                                            AI Confidence: {question.trustScore}%
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(question.status)}`}>
                                                        {question.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setExpandedQuestion(`${sectionIndex}-${questionIndex}`);
                                                                setEditingQuestion(`${sectionIndex}-${questionIndex}`);
                                                                setEditText(question.response || '');
                                                            }}
                                                            className="text-xs text-indigo-600 hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleRegenerate(sectionIndex, questionIndex)}
                                                            className="text-xs text-purple-600 hover:underline"
                                                        >
                                                            Regen
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {/* Empty state */}
                {(!project.sections || project.sections.length === 0) && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-2">No sections found in this project.</p>
                        <p className="text-sm text-gray-400">
                            The RFP is still being processed. Please wait a moment and refresh.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
