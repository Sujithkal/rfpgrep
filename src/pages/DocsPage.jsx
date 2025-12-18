import { Link } from 'react-router-dom';

export default function DocsPage() {
    const sections = [
        {
            title: 'Getting Started',
            icon: '🚀',
            items: [
                { title: 'Quick Start Guide', desc: 'Set up your account in 5 minutes' },
                { title: 'Creating Your First Project', desc: 'Upload an RFP and get AI responses' },
                { title: 'Understanding the Dashboard', desc: 'Overview of key features' },
            ]
        },
        {
            title: 'Features',
            icon: '⚡',
            items: [
                { title: 'AI Response Generation', desc: 'How to get the best AI answers' },
                { title: 'Knowledge Library', desc: 'Upload and organize your content' },
                { title: 'Team Collaboration', desc: 'Invite members and assign tasks' },
            ]
        },
        {
            title: 'Exports',
            icon: '📤',
            items: [
                { title: 'PDF Export', desc: 'Download responses as PDF' },
                { title: 'Word Export', desc: 'Export to editable Word documents' },
            ]
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
                <h1 className="text-5xl font-bold text-white mb-6">Documentation</h1>
                <p className="text-xl text-white/70 mb-12">Learn how to get the most out of RFPgrep.</p>

                {/* Sections */}
                <div className="space-y-12">
                    {sections.map((section, i) => (
                        <div key={i}>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl">{section.icon}</span>
                                <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                            </div>
                            <div className="space-y-4">
                                {section.items.map((item, idx) => (
                                    <div key={idx} className="bg-white/10 backdrop-blur-md rounded-lg p-5 border border-white/20 hover:border-indigo-500/50 transition-colors cursor-pointer">
                                        <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                                        <p className="text-white/60 text-sm">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Help */}
                <div className="mt-16 text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Need more help?</h2>
                    <p className="text-white/70 mb-6">Our support team is here to assist you.</p>
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
