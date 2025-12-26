import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

// FAQ Data organized by categories
const faqData = [
    {
        category: 'Getting Started',
        icon: '🚀',
        questions: [
            {
                q: 'How do I create my first RFP project?',
                a: 'Go to Dashboard → Click "New Project" → Enter a project name and optional deadline → Upload your RFP document (PDF, Word, Excel, or TXT). Our AI will automatically extract questions from the document.'
            },
            {
                q: 'What file formats are supported for RFP upload?',
                a: 'We support PDF (.pdf), Microsoft Word (.docx, .doc), Excel (.xlsx, .xls), and plain text (.txt) files. PDF and Word work best for structured RFP documents.'
            },
            {
                q: 'How does AI response generation work?',
                a: 'For each question, click "✨ Generate" to create an AI response. The AI uses your Knowledge Library content to provide accurate, company-specific answers. You can edit responses before finalizing.'
            }
        ]
    },
    {
        category: 'Knowledge Library (RAG)',
        icon: '📚',
        questions: [
            {
                q: 'What is the Knowledge Library?',
                a: 'The Knowledge Library is your company\'s knowledge base. Upload documents about your products, services, policies, and past responses. The AI uses this content to generate accurate, relevant answers to RFP questions.'
            },
            {
                q: 'How do I upload documents to Knowledge Library?',
                a: 'Go to Knowledge Library page → Click "Upload Document" → Select your file (PDF, Word, or TXT). The document will be processed and indexed for AI to reference when generating responses.'
            },
            {
                q: 'What makes a good Knowledge Library document?',
                a: 'Include product specifications, company policies, security certifications, compliance documents, pricing guidelines, case studies, and previous winning RFP responses. More context = better AI answers.'
            },
            {
                q: 'How does RAG (Retrieval-Augmented Generation) work?',
                a: 'When generating a response, the AI searches your Knowledge Library for relevant content, then synthesizes an answer based on that information. This ensures responses are accurate and specific to your company.'
            }
        ]
    },
    {
        category: 'Answer Library',
        icon: '💾',
        questions: [
            {
                q: 'What is the Answer Library?',
                a: 'The Answer Library stores approved Q&A pairs for quick reuse. When you approve an AI-generated response, you can save it to the library. Future similar questions will automatically suggest these saved answers.'
            },
            {
                q: 'How do I add answers to the library?',
                a: 'After generating a response, click "Save to Library" to store the Q&A pair. You can also go to Answer Library → "Add Answer" to manually create entries with categories and tags for easy searching.'
            },
            {
                q: 'Can I search the Answer Library?',
                a: 'Yes! Use the search bar on the Answer Library page to find answers by keywords, categories, or tags. You can also filter by category to browse related answers.'
            }
        ]
    },
    {
        category: 'REST API & API Keys',
        icon: '🔑',
        questions: [
            {
                q: 'How do I get an API key?',
                a: 'Go to Integrations → API Keys section → Click "Generate New Key" → Copy your key immediately (it\'s only shown once). Store it securely and never share it publicly.'
            },
            {
                q: 'What can I do with the REST API?',
                a: 'The API allows you to: list/create projects, generate AI responses, manage your Answer Library, search Knowledge Library, and track usage. Perfect for integrating RFPgrep into your workflow.'
            },
            {
                q: 'What are the API rate limits?',
                a: 'Rate limits depend on your plan: Free (10 req/min), Pro (100 req/min), Enterprise (1000 req/min). Limits are shown in the API Keys section of Integrations page.'
            },
            {
                q: 'Where is the API documentation?',
                a: 'Go to Integrations → Click "📚 View API Documentation" to see full endpoint documentation with request/response examples, authentication headers, and code snippets.'
            }
        ]
    },
    {
        category: 'Slack & Teams Integrations',
        icon: '💬',
        questions: [
            {
                q: 'How do I connect Slack?',
                a: 'Go to Integrations → Slack tab → Paste your Slack Incoming Webhook URL → Click Save. You\'ll receive notifications when RFPs are uploaded or completed.'
            },
            {
                q: 'How do I get a Slack Incoming Webhook URL?',
                a: 'In Slack: Go to your workspace settings → Apps → Search "Incoming Webhooks" → Add to channel → Copy the webhook URL. Paste this URL in RFPgrep\'s Integrations page.'
            },
            {
                q: 'How do I connect Microsoft Teams?',
                a: 'Go to Integrations → Teams tab → Paste your Teams Incoming Webhook URL → Click Save. Create webhooks in Teams via: Channel settings → Connectors → Incoming Webhook.'
            },
            {
                q: 'What notifications will I receive?',
                a: 'You\'ll get notifications for: New RFP uploaded, RFP completed, Deadline reminders, and Team member invitations. All notifications include project details and quick links.'
            }
        ]
    },
    {
        category: 'Custom Webhooks',
        icon: '🔗',
        questions: [
            {
                q: 'What are custom webhooks?',
                a: 'Custom webhooks let you send RFP events to your own server/application. Use them to integrate with your CRM, project management tools, or custom dashboards.'
            },
            {
                q: 'How do I set up a custom webhook?',
                a: 'Go to Integrations → Webhooks tab → Enter your endpoint URL → Optionally add a secret token for HMAC signature verification → Click Save. Test with the "Test Webhook" button.'
            },
            {
                q: 'What is the webhook payload format?',
                a: 'Webhooks send JSON: { "event": "project.completed", "timestamp": "ISO-8601", "data": { "rfpName": "...", "rfpId": "...", "totalQuestions": N } }. Signature is in X-RFPgrep-Signature header.'
            },
            {
                q: 'How do I verify webhook signatures?',
                a: 'If you set a secret token, we send HMAC-SHA256 signature in X-RFPgrep-Signature header (format: sha256=...). Compute HMAC of the raw JSON body with your secret and compare.'
            }
        ]
    },
    {
        category: 'Team Collaboration',
        icon: '👥',
        questions: [
            {
                q: 'How do I invite team members?',
                a: 'Go to Settings → Team → Click "Invite Member" → Enter their email → Select role (Admin, Editor, Viewer). They\'ll receive an email invitation to join your team.'
            },
            {
                q: 'What are the different team roles?',
                a: 'Admin: Full access including billing. Editor: Can create/edit projects and generate responses. Viewer: Read-only access to view projects and responses.'
            },
            {
                q: 'Can team members work on the same RFP?',
                a: 'Yes! Multiple team members can view and edit the same project. Changes sync in real-time. Use the assignment feature to delegate specific questions to team members.'
            }
        ]
    },
    {
        category: 'Exporting & Analytics',
        icon: '📊',
        questions: [
            {
                q: 'How do I export my completed RFP?',
                a: 'Open your project → Click "Export" in the header → Choose format: Word (.docx), PDF, or Excel (.xlsx). The export includes all questions, your responses, and project metadata.'
            },
            {
                q: 'What analytics are available?',
                a: 'The Analytics page shows: Response time trends, AI vs manual response ratio, Questions per RFP, Win rate tracking (if you track outcomes), and Team productivity metrics.'
            },
            {
                q: 'How do I track RFP outcomes?',
                a: 'After submitting an RFP, update the project status to Won, Lost, or Pending. This data powers your win rate analytics and helps identify successful response patterns.'
            }
        ]
    },
    {
        category: 'Account & Billing',
        icon: '💳',
        questions: [
            {
                q: 'How do I upgrade my plan?',
                a: 'Go to Settings → Billing → Choose your new plan → Complete payment. Your new limits take effect immediately. Enterprise customers can contact us for custom pricing.'
            },
            {
                q: 'What happens if I exceed my plan limits?',
                a: 'You\'ll see a warning when approaching limits. If exceeded, some features may be temporarily restricted until the next billing cycle or until you upgrade.'
            },
            {
                q: 'How do I cancel my subscription?',
                a: 'Go to Settings → Billing → Click "Cancel Subscription". You\'ll retain access until the end of your current billing period. Your data is preserved for 30 days after cancellation.'
            }
        ]
    }
];

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [expandedQuestion, setExpandedQuestion] = useState(null);

    // Filter FAQs based on search
    const filteredFaqs = useMemo(() => {
        if (!searchQuery.trim()) return faqData;

        const query = searchQuery.toLowerCase();
        return faqData.map(category => ({
            ...category,
            questions: category.questions.filter(
                qa => qa.q.toLowerCase().includes(query) || qa.a.toLowerCase().includes(query)
            )
        })).filter(category => category.questions.length > 0);
    }, [searchQuery]);

    // Count total matching results
    const totalResults = useMemo(() => {
        return filteredFaqs.reduce((acc, cat) => acc + cat.questions.length, 0);
    }, [filteredFaqs]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                                ← Back to Dashboard
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📖 Help Center</h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section with Search */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-4">How can we help you?</h2>
                    <p className="text-white/80 text-lg mb-8">
                        Search our knowledge base or browse topics below
                    </p>

                    {/* Search Box */}
                    <div className="relative max-w-2xl mx-auto">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for help... (e.g., 'API key', 'webhook', 'export')"
                            className="w-full px-6 py-4 pl-14 text-gray-900 rounded-xl shadow-lg text-lg focus:outline-none focus:ring-4 focus:ring-white/30"
                        />
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {searchQuery && (
                        <p className="mt-4 text-white/80">
                            Found <span className="font-bold text-white">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
                        </p>
                    )}
                </div>
            </section>

            {/* Quick Links */}
            <section className="max-w-5xl mx-auto px-6 -mt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Getting Started', icon: '🚀', href: '#getting-started' },
                        { label: 'API Documentation', icon: '📘', href: '/api-docs' },
                        { label: 'Integrations', icon: '🔗', href: '/integrations' },
                        { label: 'Contact Support', icon: '📧', href: '#contact' }
                    ].map(link => (
                        link.href.startsWith('#') ? (
                            <a
                                key={link.label}
                                href={link.href}
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow text-center"
                            >
                                <span className="text-3xl mb-2 block">{link.icon}</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{link.label}</span>
                            </a>
                        ) : (
                            <Link
                                key={link.label}
                                to={link.href}
                                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow text-center"
                            >
                                <span className="text-3xl mb-2 block">{link.icon}</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{link.label}</span>
                            </Link>
                        )
                    ))}
                </div>
            </section>

            {/* FAQ Sections */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="space-y-6">
                    {filteredFaqs.map((category, catIdx) => (
                        <div
                            key={category.category}
                            id={category.category.toLowerCase().replace(/\s+/g, '-')}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
                        >
                            {/* Category Header */}
                            <button
                                onClick={() => setExpandedCategory(expandedCategory === catIdx ? null : catIdx)}
                                className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">{category.icon}</span>
                                    <div className="text-left">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{category.category}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">{category.questions.length} question{category.questions.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <span className={`text-2xl text-gray-600 dark:text-gray-300 transition-transform ${expandedCategory === catIdx ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>

                            {/* Questions */}
                            {(expandedCategory === catIdx || searchQuery) && (
                                <div className="border-t border-gray-100 dark:border-gray-700">
                                    {category.questions.map((qa, qaIdx) => {
                                        const questionId = `${catIdx}-${qaIdx}`;
                                        return (
                                            <div key={qaIdx} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                <button
                                                    onClick={() => setExpandedQuestion(expandedQuestion === questionId ? null : questionId)}
                                                    className="w-full px-6 py-4 flex items-start justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <span className="font-medium text-gray-900 dark:text-white pr-4">
                                                        {searchQuery ? (
                                                            <HighlightText text={qa.q} query={searchQuery} />
                                                        ) : qa.q}
                                                    </span>
                                                    <span className={`text-gray-400 transition-transform flex-shrink-0 ${expandedQuestion === questionId ? 'rotate-45' : ''}`}>
                                                        +
                                                    </span>
                                                </button>
                                                {expandedQuestion === questionId && (
                                                    <div className="px-6 pb-4 text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/50">
                                                        {searchQuery ? (
                                                            <HighlightText text={qa.a} query={searchQuery} />
                                                        ) : qa.a}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredFaqs.length === 0 && (
                    <div className="text-center py-16">
                        <span className="text-6xl mb-4 block">🔍</span>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No results found</h3>
                        <p className="text-gray-600 mb-6">
                            Try different keywords or contact us for help
                        </p>
                        <a href="#contact" className="text-indigo-600 font-semibold hover:text-indigo-700">
                            Contact Support →
                        </a>
                    </div>
                )}
            </main>

            {/* Contact Section */}
            <section id="contact" className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
                    <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                        Can't find what you're looking for? Found a bug? Have a feature request?
                        We're here to help!
                    </p>

                    <div className="bg-white/10 backdrop-blur rounded-xl p-8 max-w-lg mx-auto">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <span className="text-4xl">📧</span>
                            <div className="text-left">
                                <p className="text-sm text-gray-400">Email us at</p>
                                <a
                                    href="mailto:support@rfpgrep.com"
                                    className="text-2xl font-bold text-white hover:text-indigo-300 transition-colors"
                                >
                                    support@rfpgrep.com
                                </a>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                            <div className="bg-white/5 rounded-lg p-3">
                                <span className="text-xl block mb-1">🐛</span>
                                <span className="text-gray-300">Bug Reports</span>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                                <span className="text-xl block mb-1">💡</span>
                                <span className="text-gray-300">Feature Requests</span>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3">
                                <span className="text-xl block mb-1">❓</span>
                                <span className="text-gray-300">General Help</span>
                            </div>
                        </div>

                        <p className="text-gray-400 text-sm mt-6">
                            We typically respond within 24 hours on business days
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
                <p>© 2024 RFPgrep. All rights reserved.</p>
                <div className="mt-2 flex justify-center gap-4">
                    <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
                    <Link to="/terms" className="hover:text-white">Terms of Service</Link>
                </div>
            </footer>
        </div>
    );
}

// Helper component to highlight search matches
function HighlightText({ text, query }) {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
}
