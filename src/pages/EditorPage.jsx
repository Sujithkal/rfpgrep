import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRFPDetail } from '../services/rfpService';
import { getProject, updateProjectQuestion, batchUpdateQuestions } from '../services/projectService';
import { exportToPDF, exportToWord } from '../services/exportService';
import { getSuggestedAnswers, incrementUsageCount } from '../services/answerLibraryService';
import { generateAIResponse } from '../services/aiGenerationService';
import { calculateTrustScore, getTrustScoreBadge } from '../services/trustScoreService';
import { subscribeToPresence, updatePresence, removePresence, formatPresenceList } from '../services/presenceService';
import { reviewAnswer, getQualityScore, getQualityBadge } from '../services/aiReviewService';
import { translateText, LANGUAGES } from '../services/translationService';
import { getQuestionComments } from '../services/commentService';
import { incrementUsage, checkLimit } from '../services/usageService';
import VersionHistoryModal from '../components/VersionHistoryModal';
import CommentThread from '../components/CommentThread';

export default function EditorPage() {
    const { userData, user, effectiveTeamId, canEdit, canApprove, teamRole, isTeamMember } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const rfpId = searchParams.get('rfpId');
    const projectId = searchParams.get('projectId');

    const [rfp, setRfp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [batchGenerating, setBatchGenerating] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const QUESTIONS_PER_PAGE = 50;

    // Edit state
    const [editingIndex, setEditingIndex] = useState(null);
    const [editText, setEditText] = useState('');
    const [regeneratingIndex, setRegeneratingIndex] = useState(null);

    // Suggestion state
    const [showSuggestions, setShowSuggestions] = useState(null); // index of question showing suggestions
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Version History state
    const [showVersionHistory, setShowVersionHistory] = useState(null); // index of question showing history

    // Workflow status dropdown state
    const [statusDropdownIndex, setStatusDropdownIndex] = useState(null);

    const WORKFLOW_STATUSES = [
        { id: 'draft', label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', icon: '📝' },
        { id: 'in_review', label: 'In Review', bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '👀' },
        { id: 'approved', label: 'Approved', bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
        { id: 'final', label: 'Final', bg: 'bg-blue-100', text: 'text-blue-700', icon: '🏁' }
    ];

    // Presence state
    const [activeViewers, setActiveViewers] = useState([]);

    // Comments state
    const [showComments, setShowComments] = useState(null); // { index, questionText }
    const [commentCounts, setCommentCounts] = useState({}); // { questionId: count }

    // Translation state
    const [showTranslateMenu, setShowTranslateMenu] = useState(null); // question index
    const [translating, setTranslating] = useState(null); // question index being translated

    // AI Review cache
    const [aiReviews, setAiReviews] = useState({}); // { questionIndex: { issues, score, badge } }

    // Team collaboration - assignment
    const [teamMembers, setTeamMembers] = useState([]);
    const [showAssignDropdown, setShowAssignDropdown] = useState(null); // question index
    const [assigningQuestion, setAssigningQuestion] = useState(null);

    // Distribution modal state
    const [showDistributionModal, setShowDistributionModal] = useState(false);
    const [selectedEditors, setSelectedEditors] = useState([]); // emails of selected editors
    const [distributing, setDistributing] = useState(false);

    // Global search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);

    // Presence subscription
    useEffect(() => {
        if (!projectId || !user?.uid) return;

        // Update our presence & get project owner ID (assuming user owns the project for now)
        const ownerId = user.uid;
        updatePresence(ownerId, projectId, user.uid, {
            displayName: user.displayName || user.email,
            email: user.email,
            photoURL: user.photoURL
        });

        // Subscribe to presence updates
        const unsubscribe = subscribeToPresence(ownerId, projectId, (presence) => {
            const viewers = formatPresenceList(presence, user.uid);
            setActiveViewers(viewers);
        });

        // Cleanup on unmount
        return () => {
            removePresence(ownerId, projectId, user.uid);
            unsubscribe();
        };
    }, [projectId, user]);

    // Fetch RFP or Project data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.log('EditorPage: URL params:', { projectId, rfpId });
                console.log('EditorPage: User info:', { uid: user?.uid, teamId: userData?.teamId, effectiveTeamId });

                // TEAM COLLABORATION: Use effectiveTeamId for team members
                const ownerId = effectiveTeamId || user?.uid;

                if (projectId && ownerId) {
                    console.log('EditorPage: Loading project:', projectId, 'from owner:', ownerId);
                    const projectData = await getProject(ownerId, projectId);
                    console.log('EditorPage: Project loaded successfully', projectData?.name);
                    setRfp(projectData);
                } else if (rfpId && userData?.teamId) {
                    console.log('EditorPage: USING RFP PATH - Loading RFP:', rfpId);
                    const result = await getRFPDetail(userData.teamId, rfpId);
                    if (result.success) {
                        setRfp(result.data);
                    }
                } else {
                    console.log('EditorPage: NO VALID ID - projectId:', projectId, 'rfpId:', rfpId);
                }
            } catch (error) {
                console.error('EditorPage: Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        // Wait for user to be loaded
        if (user && (effectiveTeamId || userData)) {
            fetchData();
        }
    }, [userData, user, rfpId, projectId, effectiveTeamId]);

    // TEAM COLLABORATION: Fetch team members for assignment dropdown
    useEffect(() => {
        const fetchTeamMembers = async () => {
            if (!effectiveTeamId || !canApprove) return; // Only admins/owners can assign

            try {
                const { getTeamMembers } = await import('../services/teamService');
                const members = await getTeamMembers(effectiveTeamId);
                setTeamMembers(members.filter(m => m.status === 'active' || !m.status));
            } catch (error) {
                console.error('Failed to fetch team members:', error);
            }
        };

        fetchTeamMembers();
    }, [effectiveTeamId, canApprove]);

    // Handle question assignment
    const handleAssignQuestion = async (globalIndex, assigneeEmail) => {
        const question = allQuestions[globalIndex];
        if (!question) return;

        // Check if already assigned to someone else - require confirmation
        if (question.assignedTo && question.assignedTo !== assigneeEmail && assigneeEmail !== null) {
            const currentAssignee = question.assignedTo.split('@')[0];
            const newAssignee = assigneeEmail.split('@')[0];
            const confirmReassign = window.confirm(
                `⚠️ This question is already assigned to "${currentAssignee}".\n\nReassign to "${newAssignee}"?`
            );
            if (!confirmReassign) {
                setShowAssignDropdown(null);
                return;
            }
        }

        setAssigningQuestion(globalIndex);
        try {
            const { assignQuestionToMember } = await import('../services/questionStatusService');
            const { notifyQuestionAssigned } = await import('../services/notificationService');

            await assignQuestionToMember(
                effectiveTeamId || user.uid,
                projectId,
                question.sectionIndex,
                question.questionIndex,
                assigneeEmail,
                user.email
            );

            // Update local state
            const updatedRfp = JSON.parse(JSON.stringify(rfp));
            updatedRfp.sections[question.sectionIndex].questions[question.questionIndex].assignedTo = assigneeEmail;
            updatedRfp.sections[question.sectionIndex].questions[question.questionIndex].assignedBy = user.email;
            setRfp(updatedRfp);

            // Send notification (find user ID from team members)
            const assignee = teamMembers.find(m => m.email?.toLowerCase() === assigneeEmail?.toLowerCase());
            if (assignee?.id) {
                notifyQuestionAssigned(assignee.id, {
                    questionText: question.text || question.question,
                    projectName: rfp?.name,
                    projectId,
                    sectionIndex: question.sectionIndex,
                    questionIndex: question.questionIndex,
                    assignedBy: user.email
                });
            }

            setShowAssignDropdown(null);
        } catch (error) {
            console.error('Assignment error:', error);
            alert('Failed to assign question: ' + error.message);
        } finally {
            setAssigningQuestion(null);
        }
    };

    // Real-time sync listener for collaborative editing
    useEffect(() => {
        if (!projectId || !user?.uid) return;

        let unsubscribe = null;
        const setupRealtimeSync = async () => {
            try {
                const { doc, onSnapshot } = await import('firebase/firestore');
                const { db } = await import('../services/firebase');

                const projectRef = doc(db, `users/${user.uid}/projects`, projectId);
                unsubscribe = onSnapshot(projectRef, (snapshot) => {
                    if (!snapshot.exists()) return;

                    const newData = { id: snapshot.id, ...snapshot.data() };

                    // Only update if data actually changed (avoid loops)
                    setRfp(prev => {
                        if (!prev) return newData;

                        // Check if sections changed (collaborative edit)
                        const prevStr = JSON.stringify(prev.sections);
                        const newStr = JSON.stringify(newData.sections);

                        if (prevStr !== newStr && editingIndex === null) {
                            // Another user made changes
                            console.log('📡 Real-time sync: Received updates from another user');
                            return newData;
                        }
                        return prev;
                    });
                }, (error) => {
                    console.error('Real-time sync error:', error);
                });
            } catch (error) {
                console.error('Failed to setup real-time sync:', error);
            }
        };

        setupRealtimeSync();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [projectId, user?.uid, editingIndex]);

    // Flatten all questions for pagination
    const getAllQuestions = () => {
        if (!rfp?.sections) return [];
        const questions = [];
        rfp.sections.forEach((section, sectionIndex) => {
            section.questions?.forEach((question, questionIndex) => {
                questions.push({
                    ...question,
                    sectionIndex,
                    questionIndex,
                    sectionName: section.name || section.title || `Section ${sectionIndex + 1}`
                });
            });
        });
        return questions;
    };

    const allQuestions = getAllQuestions();

    // Filter questions by search query
    const filteredQuestions = searchQuery.trim()
        ? allQuestions.filter(q => {
            const query = searchQuery.toLowerCase();
            const questionMatch = (q.text || q.question || '').toLowerCase().includes(query);
            const answerMatch = (q.response || '').toLowerCase().includes(query);
            const sectionMatch = (q.sectionName || '').toLowerCase().includes(query);
            return questionMatch || answerMatch || sectionMatch;
        })
        : allQuestions;

    const totalQuestions = filteredQuestions.length;
    const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
    const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
    const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, totalQuestions);
    const currentPageQuestions = filteredQuestions.slice(startIndex, endIndex);

    // AI response generator with RAG integration
    const generateResponse = async (questionText) => {
        try {
            // Use the new AI generation service with RAG
            const result = await generateAIResponse(user.uid, questionText);

            return {
                response: result.response,
                trustScore: result.trustScore,
                sources: result.sources || [],
                usedAnswerLibrary: result.usedAnswerLibrary || false,
                usedKnowledgeLibrary: result.usedKnowledgeLibrary || false
            };
        } catch (error) {
            console.error('AI generation error:', error);
            // Fallback to basic response
            const fallbackResponse = "Our organization is well-equipped to address this requirement with our proven expertise and dedicated team.";
            const trustScoreResult = calculateTrustScore(fallbackResponse, questionText, []);
            return {
                response: fallbackResponse,
                trustScore: trustScoreResult.score,
                sources: [],
                error: error.message
            };
        }
    };

    // Batch Generate All Responses
    const handleGenerateAll = async () => {
        if (!rfp?.sections) return;

        // Get questions that need generation
        const questionsToGenerate = allQuestions.filter(q => !q.response);

        if (questionsToGenerate.length === 0) {
            alert('All questions already have responses!');
            return;
        }

        // Check AI generation limit before proceeding
        let maxToGenerate = questionsToGenerate.length;
        if (user?.uid) {
            const limitCheck = await checkLimit(user.uid, 'generateResponse', userData);

            if (!limitCheck.allowed || limitCheck.remaining === 0) {
                alert(`🚫 AI Generation Limit Reached!\n\n${limitCheck.reason}\n\nPlease upgrade your plan to continue generating responses.\n\n👉 Go to Settings → Billing to upgrade.`);
                return;
            }

            // Cap the generation to remaining quota (for non-unlimited plans)
            if (limitCheck.remaining !== Infinity && questionsToGenerate.length > limitCheck.remaining) {
                const continuePartial = window.confirm(
                    `⚠️ Quota Limit Warning\n\n` +
                    `You want to generate ${questionsToGenerate.length} responses, but you only have ${limitCheck.remaining} AI generations remaining this month.\n\n` +
                    `Would you like to generate ${limitCheck.remaining} responses now?\n\n` +
                    `Click 'OK' to generate ${limitCheck.remaining} responses\nClick 'Cancel' to upgrade your plan first`
                );

                if (!continuePartial) {
                    return;
                }
                maxToGenerate = limitCheck.remaining;
            }
        }

        setBatchGenerating(true);

        const questionsToProcess = questionsToGenerate.slice(0, maxToGenerate);
        const total = totalQuestions;
        const alreadyDone = total - questionsToGenerate.length;
        setBatchProgress({ current: alreadyDone, total: alreadyDone + questionsToProcess.length });

        try {
            const updatedRfp = JSON.parse(JSON.stringify(rfp));
            const updates = [];

            for (let i = 0; i < questionsToProcess.length; i++) {
                const q = questionsToProcess[i];
                // Use new RAG-powered AI generation
                const aiResult = await generateResponse(q.text || q.question);

                updatedRfp.sections[q.sectionIndex].questions[q.questionIndex] = {
                    ...updatedRfp.sections[q.sectionIndex].questions[q.questionIndex],
                    response: aiResult.response,
                    status: 'generated',
                    trustScore: aiResult.trustScore,
                    sources: aiResult.sources || []
                };

                updates.push({
                    sectionIndex: q.sectionIndex,
                    questionIndex: q.questionIndex,
                    data: {
                        response: aiResult.response,
                        status: 'generated',
                        trustScore: aiResult.trustScore,
                        sources: aiResult.sources || []
                    }
                });

                setBatchProgress({ current: alreadyDone + i + 1, total: alreadyDone + questionsToProcess.length });
            }

            if (projectId && user?.uid) {
                await batchUpdateQuestions(user.uid, projectId, updates);
                // Track AI usage for all generated responses
                await incrementUsage(user.uid, 'aiResponse', questionsToProcess.length);
            }

            setRfp(updatedRfp);

            // Show appropriate message based on whether partial generation
            if (questionsToProcess.length < questionsToGenerate.length) {
                alert(`✅ Generated ${questionsToProcess.length} responses (quota limit reached).\n\n${questionsToGenerate.length - questionsToProcess.length} questions remain - upgrade to continue!`);
            } else {
                alert(`✅ Success! Generated ${questionsToProcess.length} responses.`);
            }
        } catch (error) {
            console.error('Batch generation error:', error);
            alert(`Error generating responses: ${error.message}`);
        } finally {
            setBatchGenerating(false);
        }
    };

    // Regenerate single question
    const handleRegenerate = async (globalIndex) => {
        const question = allQuestions[globalIndex];

        // Check AI generation limit before proceeding
        if (user?.uid) {
            const limitCheck = await checkLimit(user.uid, 'generateResponse', userData);
            if (!limitCheck.allowed) {
                alert(`⚠️ AI Generation Limit Reached!\n\n${limitCheck.reason}\n\nPlease upgrade your plan to continue.`);
                return;
            }
        }

        // Check if answer is locked (approved or final)
        const status = question.workflowStatus || question.status;
        if (status === 'approved' || status === 'final') {
            const confirmOverwrite = window.confirm(
                '⚠️ This answer has been approved/finalized.\n\nAre you sure you want to regenerate and overwrite it?'
            );
            if (!confirmOverwrite) return;
        }

        setRegeneratingIndex(globalIndex);

        try {
            // Use new RAG-powered AI generation
            const aiResult = await generateResponse(question.text || question.question);

            const updatedRfp = JSON.parse(JSON.stringify(rfp));
            const currentQuestion = updatedRfp.sections[question.sectionIndex].questions[question.questionIndex];

            // Save current version to history before overwriting
            const newVersion = {
                id: `v_${Date.now()}`,
                content: currentQuestion.response,
                editedAt: new Date().toISOString(),
                editedBy: { name: userData?.displayName || user?.email || 'User', uid: user?.uid },
                changeType: currentQuestion.status || 'generated',
                trustScore: currentQuestion.trustScore
            };

            // Only add to versions if there was a previous response
            if (currentQuestion.response) {
                currentQuestion.versions = [...(currentQuestion.versions || []), newVersion];
            }

            // Update with new response
            currentQuestion.response = aiResult.response;
            currentQuestion.status = 'generated';
            currentQuestion.workflowStatus = 'draft';
            currentQuestion.trustScore = aiResult.trustScore;
            currentQuestion.sources = aiResult.sources || [];
            currentQuestion.lastEditedAt = new Date().toISOString();

            if (projectId && user?.uid) {
                await updateProjectQuestion(user.uid, projectId, question.sectionIndex, question.questionIndex, {
                    response: aiResult.response,
                    status: 'generated',
                    workflowStatus: 'draft',
                    trustScore: aiResult.trustScore,
                    sources: aiResult.sources || [],
                    versions: currentQuestion.versions,
                    lastEditedAt: currentQuestion.lastEditedAt
                });
                // Track AI usage
                await incrementUsage(user.uid, 'aiResponse');
            }

            setRfp(updatedRfp);
        } catch (error) {
            console.error('Regenerate error:', error);
            alert('Failed to regenerate response');
        } finally {
            setRegeneratingIndex(null);
        }
    };

    // Save edited response
    const handleSaveEdit = async (globalIndex) => {
        const question = allQuestions[globalIndex];

        try {
            const updatedRfp = JSON.parse(JSON.stringify(rfp));
            const currentQuestion = updatedRfp.sections[question.sectionIndex].questions[question.questionIndex];

            // Only save to history if the text actually changed
            if (currentQuestion.response && currentQuestion.response !== editText) {
                const newVersion = {
                    id: `v_${Date.now()}`,
                    content: currentQuestion.response,
                    editedAt: new Date().toISOString(),
                    editedBy: { name: userData?.displayName || user?.email || 'User', uid: user?.uid },
                    changeType: currentQuestion.status || 'draft',
                    trustScore: currentQuestion.trustScore
                };
                currentQuestion.versions = [...(currentQuestion.versions || []), newVersion];
            }

            // Update with new content and release lock
            currentQuestion.response = editText;
            currentQuestion.status = 'edited';
            currentQuestion.lastEditedAt = new Date().toISOString();
            currentQuestion.lockedBy = null;
            currentQuestion.lockedAt = null;

            // Use effectiveTeamId for team members
            const ownerId = effectiveTeamId || user?.uid;

            if (projectId && ownerId) {
                await updateProjectQuestion(ownerId, projectId, question.sectionIndex, question.questionIndex, {
                    response: editText,
                    status: 'edited',
                    versions: currentQuestion.versions,
                    lastEditedAt: currentQuestion.lastEditedAt,
                    lockedBy: null,
                    lockedAt: null
                });
            }

            setRfp(updatedRfp);
            setEditingIndex(null);
            setEditText('');
        } catch (error) {
            console.error('Save edit error:', error);
            alert('Failed to save changes');
        }
    };

    // Start editing with lock check
    const startEditing = async (globalIndex) => {
        const question = allQuestions[globalIndex];

        // TEAM COLLABORATION: Check if we can edit this question
        if (!canEdit && teamRole === 'viewer') {
            alert('Viewers cannot edit questions.');
            return;
        }

        // Check if assigned to someone else (for editors)
        if (teamRole === 'editor' && question.assignedTo && question.assignedTo !== user?.email) {
            alert(`This question is assigned to ${question.assignedTo}. Contact an admin to reassign it.`);
            return;
        }

        // Check if locked by another user
        if (question.lockedBy && question.lockedBy !== user?.email) {
            const lockTime = question.lockedAt?.toDate?.() || new Date(question.lockedAt || 0);
            const elapsed = Date.now() - lockTime.getTime();
            const LOCK_DURATION = 5 * 60 * 1000; // 5 minutes

            if (elapsed < LOCK_DURATION) {
                const remaining = Math.ceil((LOCK_DURATION - elapsed) / 1000 / 60);
                alert(`⚠️ This question is being edited by ${question.lockedBy}\n\nLock expires in ~${remaining} minute(s).`);
                return;
            }
        }

        // Acquire lock
        try {
            if (projectId && effectiveTeamId) {
                const { acquireQuestionLock } = await import('../services/questionStatusService');
                await acquireQuestionLock(effectiveTeamId, projectId, question.sectionIndex, question.questionIndex, user.email);
            }
        } catch (error) {
            console.error('Lock acquisition failed:', error);
            // Continue anyway - lock is advisory
        }

        setEditingIndex(globalIndex);
        setEditText(allQuestions[globalIndex].response || '');
    };

    // Get status badge - now using workflow statuses
    const getStatusBadge = (question) => {
        if (!question.response) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: '⏳' };

        const workflowStatus = question.workflowStatus || question.status || 'draft';
        const found = WORKFLOW_STATUSES.find(s => s.id === workflowStatus);
        if (found) return found;

        // Legacy status mapping
        switch (question.status) {
            case 'approved': return WORKFLOW_STATUSES.find(s => s.id === 'approved');
            case 'edited': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Edited', icon: '✏️' };
            case 'generated': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Generated', icon: '🤖' };
            default: return WORKFLOW_STATUSES[0]; // Draft
        }
    };

    // Handle workflow status change
    const handleStatusChange = async (globalIndex, newStatus) => {
        const question = allQuestions[globalIndex];
        try {
            const updatedRfp = JSON.parse(JSON.stringify(rfp));
            updatedRfp.sections[question.sectionIndex].questions[question.questionIndex].workflowStatus = newStatus;

            if (projectId && user?.uid) {
                await updateProjectQuestion(user.uid, projectId, question.sectionIndex, question.questionIndex, {
                    workflowStatus: newStatus,
                    statusUpdatedAt: new Date().toISOString()
                });
            }

            setRfp(updatedRfp);
            setStatusDropdownIndex(null);
        } catch (error) {
            console.error('Status change error:', error);
        }
    };

    // Handle translation
    const handleTranslate = async (globalIndex, targetLang) => {
        const question = allQuestions[globalIndex];
        if (!question.response) return;

        setTranslating(globalIndex);
        setShowTranslateMenu(null);

        try {
            const translated = await translateText(question.response, targetLang);

            const updatedRfp = JSON.parse(JSON.stringify(rfp));
            updatedRfp.sections[question.sectionIndex].questions[question.questionIndex].response = translated;
            updatedRfp.sections[question.sectionIndex].questions[question.questionIndex].translatedTo = targetLang;

            if (projectId && user?.uid) {
                await updateProjectQuestion(user.uid, projectId, question.sectionIndex, question.questionIndex, {
                    response: translated,
                    translatedTo: targetLang
                });
            }

            setRfp(updatedRfp);
        } catch (error) {
            console.error('Translation error:', error);
            alert('Translation failed. Please try again.');
        }
        setTranslating(null);
    };

    // Run AI review on a question
    const runAiReview = (globalIndex, question) => {
        if (!question.response) return null;

        // Check cache first
        if (aiReviews[globalIndex]) return aiReviews[globalIndex];

        const issues = reviewAnswer(question.question, question.response);
        const score = getQualityScore(issues);
        const badge = getQualityBadge(score);

        const review = { issues, score, badge };
        setAiReviews(prev => ({ ...prev, [globalIndex]: review }));
        return review;
    };

    // Get suggestions from Answer Library
    const handleGetSuggestions = async (globalIndex) => {
        const question = allQuestions[globalIndex];
        if (showSuggestions === globalIndex) {
            setShowSuggestions(null);
            setSuggestions([]);
            return;
        }

        setShowSuggestions(globalIndex);
        setLoadingSuggestions(true);

        try {
            const result = await getSuggestedAnswers(user.uid, question.text, 5);
            if (result.success) {
                setSuggestions(result.suggestions);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error('Error getting suggestions:', error);
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    // Use a suggestion
    const handleUseSuggestion = async (globalIndex, suggestion) => {
        const question = allQuestions[globalIndex];

        try {
            const updatedRfp = JSON.parse(JSON.stringify(rfp));
            updatedRfp.sections[question.sectionIndex].questions[question.questionIndex].response = suggestion.answer;
            updatedRfp.sections[question.sectionIndex].questions[question.questionIndex].status = 'generated';

            if (projectId && user?.uid) {
                await updateProjectQuestion(user.uid, projectId, question.sectionIndex, question.questionIndex, {
                    response: suggestion.answer,
                    status: 'generated'
                });
                // Increment usage count for the suggestion
                await incrementUsageCount(user.uid, suggestion.id);
            }

            setRfp(updatedRfp);
            setShowSuggestions(null);
            setSuggestions([]);
        } catch (error) {
            console.error('Error using suggestion:', error);
            alert('Failed to apply suggestion');
        }
    };

    // Count answered questions
    const answeredCount = allQuestions.filter(q => q.response).length;
    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!rfp) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-gray-500 dark:text-gray-400">Project not found or failed to load.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard">
                                <button className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors">
                                    ← Back
                                </button>
                            </Link>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{rfp?.name || "RFP Editor"}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {answeredCount}/{totalQuestions} answered • {progressPercent}% complete
                                </p>
                            </div>

                            {/* Presence Indicators */}
                            {activeViewers.length > 0 && (
                                <div className="flex items-center ml-4">
                                    <div className="flex -space-x-2">
                                        {activeViewers.slice(0, 4).map((viewer, idx) => (
                                            <div
                                                key={viewer.id}
                                                className="relative"
                                                title={`${viewer.name}${viewer.isTyping ? ' (typing...)' : ''}`}
                                            >
                                                {viewer.avatar ? (
                                                    <img
                                                        src={viewer.avatar}
                                                        alt={viewer.name}
                                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold"
                                                        style={{ backgroundColor: viewer.color }}
                                                    >
                                                        {viewer.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                {viewer.isTyping && (
                                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                                        <span className="animate-pulse text-white text-[8px]">✎</span>
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {activeViewers.length > 4 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-gray-500 flex items-center justify-center text-white text-xs font-bold">
                                                +{activeViewers.length - 4}
                                            </div>
                                        )}
                                    </div>
                                    <span className="ml-2 text-xs text-gray-500">
                                        {activeViewers.length} viewing
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Global Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="🔍 Search questions & answers..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1); // Reset to first page on search
                                    }}
                                    className="w-64 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {searchQuery && (
                                <span className="text-sm text-gray-500">
                                    {totalQuestions} result{totalQuestions !== 1 ? 's' : ''}
                                </span>
                            )}

                            {/* Generate All */}
                            <button
                                onClick={handleGenerateAll}
                                disabled={batchGenerating}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {batchGenerating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>{batchProgress.current}/{batchProgress.total}</span>
                                    </>
                                ) : (
                                    <>⚡ Generate All</>
                                )}
                            </button>

                            {/* TEAM COLLABORATION: Distribute Evenly Button - Opens Modal */}
                            {canApprove && teamMembers.length > 0 && (
                                <button
                                    onClick={() => {
                                        const unassigned = allQuestions.filter(q => !q.assignedTo);
                                        if (unassigned.length === 0) {
                                            alert('All questions are already assigned!');
                                            return;
                                        }

                                        // Pre-select editors with lowest workload (Option A)
                                        const editors = teamMembers.filter(m => m.role !== 'viewer');
                                        const workloads = editors.map(e => ({
                                            email: e.email,
                                            current: allQuestions.filter(q => q.assignedTo === e.email).length
                                        }));

                                        // Sort by workload and pre-select top N (where N = unassigned questions count)
                                        const sorted = workloads.sort((a, b) => a.current - b.current);
                                        const preSelected = sorted.slice(0, Math.min(unassigned.length, sorted.length)).map(w => w.email);

                                        setSelectedEditors(preSelected);
                                        setShowDistributionModal(true);
                                    }}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all flex items-center gap-2"
                                >
                                    👥 Distribute Evenly
                                </button>
                            )}

                            {/* Export PDF */}
                            <button
                                onClick={async () => {
                                    exportToPDF(rfp);
                                    if (user?.uid) await incrementUsage(user.uid, 'export');
                                    alert('PDF downloaded!');
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                            >
                                📄 PDF
                            </button>

                            {/* Export Word */}
                            <button
                                onClick={async () => {
                                    await exportToWord(rfp);
                                    if (user?.uid) await incrementUsage(user.uid, 'export');
                                    alert('Word downloaded!');
                                }}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                            >
                                📝 Word
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Questions Index</h2>
                        <p className="text-sm text-gray-500">
                            Showing {startIndex + 1}–{endIndex} of {totalQuestions} questions
                        </p>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Previous
                            </button>
                            <span className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                    {currentPageQuestions.map((question, idx) => {
                        const globalIndex = startIndex + idx;
                        const status = getStatusBadge(question);
                        const isEditing = editingIndex === globalIndex;
                        const isRegenerating = regeneratingIndex === globalIndex;

                        return (
                            <div
                                key={`${question.sectionIndex}-${question.questionIndex}`}
                                className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${question.response ? 'border-green-200 dark:border-green-700' : 'border-orange-200 dark:border-orange-700'} p-5 shadow-sm hover:shadow-md transition-shadow`}
                            >
                                {/* Question Header */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                                            {globalIndex + 1}
                                        </span>
                                        <div className="relative">
                                            {/* Clickable Status Badge */}
                                            <button
                                                onClick={() => setStatusDropdownIndex(statusDropdownIndex === globalIndex ? null : globalIndex)}
                                                className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.text} font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1`}
                                                disabled={!question.response}
                                            >
                                                {status.icon && <span>{status.icon}</span>}
                                                {status.label}
                                                {question.response && <span className="ml-1">▼</span>}
                                            </button>

                                            {/* Status Dropdown */}
                                            {statusDropdownIndex === globalIndex && question.response && (
                                                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-1 z-50 min-w-[140px]">
                                                    {WORKFLOW_STATUSES.map(ws => (
                                                        <button
                                                            key={ws.id}
                                                            onClick={() => handleStatusChange(globalIndex, ws.id)}
                                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${(question.workflowStatus || 'draft') === ws.id ? 'bg-gray-50 font-medium' : ''
                                                                }`}
                                                        >
                                                            <span>{ws.icon}</span>
                                                            <span>{ws.label}</span>
                                                            {(question.workflowStatus || 'draft') === ws.id && <span className="ml-auto text-green-600">✓</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{question.sectionName}</span>
                                        </div>

                                        {/* TEAM COLLABORATION: Assignee Badge */}
                                        {question.assignedTo ? (
                                            <div className="relative ml-2">
                                                <button
                                                    onClick={() => canApprove && setShowAssignDropdown(showAssignDropdown === globalIndex ? null : globalIndex)}
                                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 ${canApprove ? 'hover:bg-indigo-200 cursor-pointer' : 'cursor-default'}`}
                                                    disabled={!canApprove}
                                                >
                                                    <span>👤</span>
                                                    <span className="max-w-[100px] truncate">{question.assignedTo.split('@')[0]}</span>
                                                    {canApprove && <span className="ml-0.5">▼</span>}
                                                </button>

                                                {/* Reassign Dropdown */}
                                                {showAssignDropdown === globalIndex && canApprove && teamMembers.length > 0 && (
                                                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-1 z-50 min-w-[180px] max-h-48 overflow-y-auto">
                                                        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b">Assign to:</div>
                                                        {teamMembers.map(member => (
                                                            <button
                                                                key={member.email || member.id}
                                                                onClick={() => handleAssignQuestion(globalIndex, member.email)}
                                                                disabled={assigningQuestion === globalIndex}
                                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 ${question.assignedTo === member.email ? 'bg-indigo-50' : ''}`}
                                                            >
                                                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
                                                                    {(member.displayName || member.email || '?')[0].toUpperCase()}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="truncate text-gray-900 dark:text-white">{member.displayName || member.email?.split('@')[0]}</p>
                                                                    <p className="text-xs text-gray-500">{member.role || 'member'}</p>
                                                                </div>
                                                                {question.assignedTo === member.email && <span className="text-green-600">✓</span>}
                                                            </button>
                                                        ))}
                                                        <button
                                                            onClick={() => handleAssignQuestion(globalIndex, null)}
                                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-t mt-1"
                                                        >
                                                            ❌ Unassign
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : canApprove && teamMembers.length > 0 ? (
                                            <div className="relative ml-2">
                                                <button
                                                    onClick={() => setShowAssignDropdown(showAssignDropdown === globalIndex ? null : globalIndex)}
                                                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                >
                                                    <span>➕</span>
                                                    <span>Assign</span>
                                                </button>

                                                {/* Assign Dropdown */}
                                                {showAssignDropdown === globalIndex && (
                                                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-1 z-50 min-w-[180px] max-h-48 overflow-y-auto">
                                                        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b">Assign to:</div>
                                                        {teamMembers.map(member => (
                                                            <button
                                                                key={member.email || member.id}
                                                                onClick={() => handleAssignQuestion(globalIndex, member.email)}
                                                                disabled={assigningQuestion === globalIndex}
                                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                                                            >
                                                                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
                                                                    {(member.displayName || member.email || '?')[0].toUpperCase()}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="truncate text-gray-900 dark:text-white">{member.displayName || member.email?.split('@')[0]}</p>
                                                                    <p className="text-xs text-gray-500">{member.role || 'member'}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        {question.trustScore && (
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                                AI Conf: {question.trustScore}%
                                            </span>
                                        )}
                                        {!isEditing && (
                                            <>
                                                <button
                                                    onClick={() => handleRegenerate(globalIndex)}
                                                    disabled={isRegenerating}
                                                    className="px-3 py-1.5 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                                >
                                                    {isRegenerating ? '⏳' : '🔄'} Regenerate
                                                </button>
                                                <button
                                                    onClick={() => handleGetSuggestions(globalIndex)}
                                                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${showSuggestions === globalIndex ? 'bg-green-600 text-white' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                                                >
                                                    💬 Suggest
                                                </button>
                                                <button
                                                    onClick={() => startEditing(globalIndex)}
                                                    className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                {question.versions?.length > 0 && (
                                                    <button
                                                        onClick={() => setShowVersionHistory(globalIndex)}
                                                        className="px-3 py-1.5 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg font-medium transition-colors"
                                                    >
                                                        📜 History ({question.versions.length})
                                                    </button>
                                                )}

                                                {/* Comment Button */}
                                                <button
                                                    onClick={() => setShowComments({ index: globalIndex, questionText: question.text })}
                                                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                                >
                                                    💬 Comment
                                                </button>

                                                {/* Translate Button */}
                                                {question.response && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setShowTranslateMenu(showTranslateMenu === globalIndex ? null : globalIndex)}
                                                            disabled={translating === globalIndex}
                                                            className="px-3 py-1.5 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                                        >
                                                            {translating === globalIndex ? '⏳' : '🌐'} Translate
                                                        </button>
                                                        {showTranslateMenu === globalIndex && (
                                                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-1 z-50 min-w-[150px] max-h-48 overflow-y-auto">
                                                                {LANGUAGES.slice(0, 8).map(lang => (
                                                                    <button
                                                                        key={lang.code}
                                                                        onClick={() => handleTranslate(globalIndex, lang.code)}
                                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                                                    >
                                                                        <span>{lang.flag}</span>
                                                                        <span>{lang.name}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Question Text */}
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 leading-relaxed">
                                    {question.text}
                                </h3>

                                {/* Response */}
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full h-40 p-4 border-2 border-indigo-300 dark:border-indigo-500 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            placeholder="Enter your response..."
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSaveEdit(globalIndex)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                                            >
                                                ✓ Save
                                            </button>
                                            <button
                                                onClick={() => { setEditingIndex(null); setEditText(''); }}
                                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-100 rounded-lg font-medium text-sm transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : question.response ? (
                                    <>
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-100 leading-relaxed whitespace-pre-wrap border border-gray-200 dark:border-gray-600">
                                            {question.response}
                                        </div>

                                        {/* AI Review Badge */}
                                        {(() => {
                                            const review = runAiReview(globalIndex, question);
                                            if (!review || review.issues.length === 0) return null;
                                            return (
                                                <div className={`mt-2 p-3 rounded-lg border ${review.badge.color === 'green' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' :
                                                    review.badge.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700' :
                                                        review.badge.color === 'orange' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700' :
                                                            'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'
                                                    }`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                                            {review.badge.icon} AI Review: {review.badge.label} ({review.score}%)
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {review.issues.slice(0, 3).map((issue, i) => (
                                                            <div key={i} className="text-xs text-gray-800 dark:text-gray-100 font-medium flex items-center gap-2">
                                                                <span>{issue.icon}</span>
                                                                <span className="text-gray-800 dark:text-gray-100">{issue.label}: {issue.detail || issue.suggestion}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-sm text-yellow-700 dark:text-yellow-300 italic">
                                        ⚠️ No response yet. Click "Generate All", "Regenerate", or "Suggest" to create a response.
                                    </div>
                                )}

                                {/* Suggestions Panel */}
                                {showSuggestions === globalIndex && (
                                    <div className="mt-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
                                            💬 Suggested Answers from Library
                                        </h4>
                                        {loadingSuggestions ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                                                <span className="ml-2 text-sm text-green-700">Searching library...</span>
                                            </div>
                                        ) : suggestions.length === 0 ? (
                                            <div className="text-sm text-green-600 text-center py-2">
                                                No matching suggestions found. <Link to="/answers" className="underline">Add answers to your library</Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {suggestions.map((suggestion, idx) => (
                                                    <div key={suggestion.id || idx} className="bg-white rounded-lg p-3 border border-green-100">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                                {suggestion.similarity}% match
                                                            </span>
                                                            <button
                                                                onClick={() => handleUseSuggestion(globalIndex, suggestion)}
                                                                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                                                            >
                                                                Use This
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mb-1">{suggestion.question}</p>
                                                        <p className="text-sm text-gray-700 line-clamp-3">{suggestion.answer}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-10 pb-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            ← Previous Page
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 7) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 4) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 3) {
                                    pageNum = totalPages - 6 + i;
                                } else {
                                    pageNum = currentPage - 3 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === pageNum
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                            Next Page →
                        </button>
                    </div>
                )}
            </main>

            {/* Version History Modal */}
            {showVersionHistory !== null && (
                <VersionHistoryModal
                    isOpen={showVersionHistory !== null}
                    onClose={() => setShowVersionHistory(null)}
                    question={allQuestions[showVersionHistory]}
                    questionNumber={showVersionHistory + 1}
                    onRestoreVersion={async (restoredContent) => {
                        const question = allQuestions[showVersionHistory];
                        try {
                            const updatedRfp = JSON.parse(JSON.stringify(rfp));
                            updatedRfp.sections[question.sectionIndex].questions[question.questionIndex].response = restoredContent;
                            updatedRfp.sections[question.sectionIndex].questions[question.questionIndex].status = 'restored';

                            if (projectId && user?.uid) {
                                await updateProjectQuestion(
                                    user.uid,
                                    projectId,
                                    question.sectionIndex,
                                    question.questionIndex,
                                    {
                                        response: restoredContent,
                                        status: 'restored'
                                    },
                                    userData?.displayName || 'User'
                                );
                            }

                            setRfp(updatedRfp);
                            setShowVersionHistory(null);
                        } catch (error) {
                            console.error('Error restoring version:', error);
                            alert('Failed to restore version');
                        }
                    }}
                />
            )}

            {/* Comment Thread Modal */}
            {showComments && projectId && (
                <CommentThread
                    projectId={projectId}
                    questionId={`q${showComments.index}`}
                    questionText={showComments.questionText}
                    onClose={() => setShowComments(null)}
                />
            )}

            {/* Smart Distribution Modal (Option A+B) */}
            {showDistributionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    👥 Distribute Questions
                                </h2>
                                <button
                                    onClick={() => setShowDistributionModal(false)}
                                    className="text-gray-400 hover:text-gray-600 text-xl"
                                >
                                    ✕
                                </button>
                            </div>
                            {/* Show distribution breakdown */}
                            {selectedEditors.length > 0 && (() => {
                                const unassignedCount = allQuestions.filter(q => !q.assignedTo).length;
                                const base = Math.floor(unassignedCount / selectedEditors.length);
                                const remainder = unassignedCount % selectedEditors.length;
                                return (
                                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm">
                                        <p className="text-blue-800 dark:text-blue-200">
                                            📊 <strong>{unassignedCount}</strong> questions ÷ <strong>{selectedEditors.length}</strong> editors =
                                            <strong> {base}</strong> each
                                            {remainder > 0 && (
                                                <span className="text-orange-600 dark:text-orange-400">
                                                    {' '}+ <strong>{remainder}</strong> extra (first {remainder} selected editors get +1)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Editor Selection */}
                        <div className="p-5 max-h-[50vh] overflow-y-auto">
                            <div className="space-y-2">
                                {teamMembers.filter(m => m.role !== 'viewer').map((member, memberIdx) => {
                                    const workload = allQuestions.filter(q => q.assignedTo === member.email).length;
                                    const isSelected = selectedEditors.includes(member.email);
                                    const editorPosition = selectedEditors.indexOf(member.email);
                                    const unassignedCount = allQuestions.filter(q => !q.assignedTo).length;
                                    const base = selectedEditors.length > 0 ? Math.floor(unassignedCount / selectedEditors.length) : 0;
                                    const remainder = selectedEditors.length > 0 ? unassignedCount % selectedEditors.length : 0;
                                    // First 'remainder' editors get +1
                                    const willGet = isSelected ? (base + (editorPosition < remainder ? 1 : 0)) : 0;
                                    const getsExtra = isSelected && editorPosition < remainder;

                                    return (
                                        <label
                                            key={member.email}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedEditors([...selectedEditors, member.email]);
                                                    } else {
                                                        setSelectedEditors(selectedEditors.filter(em => em !== member.email));
                                                    }
                                                }}
                                                className="w-5 h-5 rounded text-indigo-600"
                                            />
                                            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {(member.displayName || member.email || '?')[0].toUpperCase()}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    {member.displayName || member.email?.split('@')[0]}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {member.role} • Current workload: {workload} questions
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <span className={`text-xs px-2 py-1 rounded-full ${getsExtra
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    +{willGet}{getsExtra && ' ⭐'}
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}

                                {teamMembers.filter(m => m.role !== 'viewer').length === 0 && (
                                    <p className="text-center text-gray-500 py-8">
                                        No editors available. Add team members with editor role first.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        const editors = teamMembers.filter(m => m.role !== 'viewer');
                                        setSelectedEditors(editors.map(e => e.email));
                                    }}
                                    className="text-sm text-indigo-600 hover:underline"
                                >
                                    Select All
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDistributionModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (selectedEditors.length === 0) {
                                                alert('Please select at least one editor.');
                                                return;
                                            }

                                            setDistributing(true);
                                            try {
                                                const { assignQuestionToMember } = await import('../services/questionStatusService');
                                                const unassigned = allQuestions.filter(q => !q.assignedTo);
                                                const updatedRfp = JSON.parse(JSON.stringify(rfp));

                                                let assigned = 0;
                                                for (let i = 0; i < unassigned.length; i++) {
                                                    const q = unassigned[i];
                                                    const editor = selectedEditors[i % selectedEditors.length];

                                                    await assignQuestionToMember(
                                                        effectiveTeamId || user.uid,
                                                        projectId,
                                                        q.sectionIndex,
                                                        q.questionIndex,
                                                        editor,
                                                        user.email
                                                    );

                                                    updatedRfp.sections[q.sectionIndex].questions[q.questionIndex].assignedTo = editor;
                                                    assigned++;
                                                }

                                                setRfp(updatedRfp);
                                                setShowDistributionModal(false);
                                                alert(`✅ Distributed ${assigned} questions to ${selectedEditors.length} editors!`);
                                            } catch (error) {
                                                console.error('Distribution error:', error);
                                                alert('Failed to distribute: ' + error.message);
                                            } finally {
                                                setDistributing(false);
                                            }
                                        }}
                                        disabled={distributing || selectedEditors.length === 0}
                                        className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {distributing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                Distributing...
                                            </>
                                        ) : (
                                            <>
                                                ✅ Distribute {allQuestions.filter(q => !q.assignedTo).length} Questions
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
