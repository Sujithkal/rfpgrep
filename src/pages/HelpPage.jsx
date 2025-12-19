import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HelpPage() {
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            q: 'How do I upload an RFP?',
            a: 'Go to Projects, click "New Project", fill in the details, and drag & drop your RFP file. We support PDF, Word, and Excel formats.'
        },
        {
            q: 'How does the AI generate responses?',
            a: 'Our AI analyzes your RFP questions and uses your knowledge library to generate tailored responses. You can edit and refine the responses before exporting.'
        },
        {
            q: 'Can I add custom content for the AI to use?',
            a: 'Yes! Go to Knowledge Library and upload your company documents, past proposals, and case studies. The AI will use this content to generate better responses.'
        },
        {
            q: 'How do I invite team members?',
            a: 'Go to your project, click on the Team tab, and enter their email address. They will receive an invite to join your workspace.'
        },
        {
            q: 'What export formats are supported?',
            a: 'You can export your completed responses to PDF or Word format. Both include professional formatting and your company branding.'
        },
        {
            q: 'How do I change my subscription plan?',
            a: 'Go to Settings > Subscription and click "Change Plan". You can upgrade or downgrade at any time.'
        },
        {
            q: 'Is my data secure?',
            a: 'Yes! All data is encrypted at rest and in transit. We never use your data to train our AI models. See our Security page for more details.'
        },
        {
            q: 'How do I cancel my subscription?',
            a: 'You can cancel anytime from Settings > Subscription. Your access continues until the end of your billing period.'
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
            {/* Header */}
            <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">⚡</div>
                        <span className="text-xl font-bold text-white">RFPgrep</span>
                    </Link>
                    <Link to="/" className="text-white/70 hover:text-white transition-colors">← Back to Home</Link>
                </div>
            </nav>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-5xl font-bold text-white mb-6">Help Center</h1>
                <p className="text-xl text-white/70 mb-12">Find answers to common questions and get started quickly.</p>

                {/* Quick Start Guides */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-white mb-6">🚀 Quick Start Guides</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { icon: '📤', title: 'Upload Your First RFP', steps: ['Go to Projects', 'Click "New Project"', 'Upload PDF/Word/Excel', 'AI extracts questions automatically'] },
                            { icon: '🤖', title: 'Generate AI Responses', steps: ['Open a project', 'Click "Generate All" or generate individually', 'Review and edit responses', 'Approve when ready'] },
                            { icon: '📚', title: 'Build Knowledge Library', steps: ['Go to Knowledge Library', 'Click "Add Answer"', 'Enter reusable content', 'Tag for easy discovery'] },
                            { icon: '👥', title: 'Collaborate with Team', steps: ['Go to Team page', 'Enter colleague email', 'Assign role (Viewer/Editor/Admin)', 'They get instant access'] },
                        ].map((guide, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl">{guide.icon}</span>
                                    <h3 className="text-lg font-semibold text-white">{guide.title}</h3>
                                </div>
                                <ol className="space-y-2">
                                    {guide.steps.map((step, j) => (
                                        <li key={j} className="flex items-start gap-2 text-white/70">
                                            <span className="text-indigo-400 font-bold">{j + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-white mb-6">⌨️ Keyboard Shortcuts</h2>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { keys: 'Ctrl + S', action: 'Save current answer' },
                                { keys: 'Ctrl + Enter', action: 'Generate AI response' },
                                { keys: 'Ctrl + /', action: 'Open command palette' },
                                { keys: 'Ctrl + K', action: 'Quick search' },
                                { keys: 'Ctrl + E', action: 'Export current RFP' },
                                { keys: 'Ctrl + Shift + A', action: 'Approve answer' },
                                { keys: '↑ / ↓', action: 'Navigate between questions' },
                                { keys: 'Esc', action: 'Close modal/cancel' },
                            ].map((shortcut, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-white/70">{shortcut.action}</span>
                                    <kbd className="px-3 py-1 bg-gray-800 text-indigo-300 rounded-lg text-sm font-mono border border-gray-600">
                                        {shortcut.keys}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Video Tutorials */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-white mb-6">🎥 Video Tutorials</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {[
                            { title: 'Getting Started', duration: '3:24', icon: '🎬' },
                            { title: 'AI Response Generation', duration: '5:12', icon: '🤖' },
                            { title: 'Team Collaboration', duration: '4:45', icon: '👥' },
                        ].map((video, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 text-center hover:bg-white/15 transition-colors cursor-pointer group">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {video.icon}
                                </div>
                                <h3 className="font-semibold text-white mb-1">{video.title}</h3>
                                <p className="text-sm text-white/50">{video.duration}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-white/50 mt-4 text-sm">Video tutorials coming soon!</p>
                </div>

                {/* FAQs */}
                <h2 className="text-2xl font-bold text-white mb-6">❓ Frequently Asked Questions</h2>
                <div className="space-y-4 mb-16">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full p-6 text-left flex items-center justify-between"
                            >
                                <span className="text-lg font-semibold text-white">{faq.q}</span>
                                <span className="text-white/60 text-xl">
                                    {openFaq === i ? '−' : '+'}
                                </span>
                            </button>
                            {openFaq === i && (
                                <div className="px-6 pb-6">
                                    <p className="text-white/70">{faq.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-4xl mb-4 block">💬</span>
                    <h2 className="text-2xl font-bold text-white mb-4">Still need help?</h2>
                    <p className="text-white/70 mb-6">Our support team is ready to assist you.</p>
                    <Link to="/contact">
                        <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
                            Contact Support
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
