import { Link } from 'react-router-dom';

export default function RoadmapPage() {
    const roadmap = [
        {
            quarter: 'Q4 2024',
            status: 'completed',
            items: [
                { title: 'Core Platform Launch', desc: 'RFP upload, parsing, and AI generation' },
                { title: 'Team Collaboration', desc: 'Invite members and assign questions' },
                { title: 'Export Options', desc: 'PDF and Word export support' },
            ]
        },
        {
            quarter: 'Q1 2025',
            status: 'completed',
            items: [
                { title: 'Knowledge Library', desc: 'Upload and search company documents' },
                { title: 'RAG Integration', desc: 'AI uses your docs for better answers' },
                { title: 'REST API', desc: 'Full API access with key authentication' },
                { title: 'Slack/Teams Integrations', desc: 'Webhook notifications for project events' },
            ]
        },
        {
            quarter: 'Q2 2025 (Current)',
            status: 'in-progress',
            items: [
                { title: 'Custom AI Training', desc: 'AI learns from your winning responses ✓' },
                { title: 'Win Rate Predictions', desc: 'AI-powered probability scoring ✓' },
                { title: 'Email Notifications', desc: 'Deadline reminders and team updates' },
            ]
        },
        {
            quarter: 'Q3 2025',
            status: 'planned',
            items: [
                { title: 'CRM Integrations', desc: 'Native Salesforce, HubSpot connections' },
                { title: 'White-label Exports', desc: 'Custom branding for agencies' },
                { title: 'Multi-language Generation', desc: 'Generate responses in any language' },
            ]
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in-progress': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

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
                <h1 className="text-5xl font-bold text-white mb-6">Product Roadmap</h1>
                <p className="text-xl text-white/70 mb-12">See what we're building and what's coming next.</p>

                {/* Timeline */}
                <div className="space-y-12">
                    {roadmap.map((quarter, i) => (
                        <div key={i} className="relative">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-4 h-4 rounded-full ${getStatusColor(quarter.status)}`}></div>
                                <h2 className="text-2xl font-bold text-white">{quarter.quarter}</h2>
                                <span className={`text-sm px-3 py-1 rounded-full ${quarter.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                    quarter.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {quarter.status === 'completed' ? '✓ Completed' :
                                        quarter.status === 'in-progress' ? '⏳ In Progress' : '📅 Planned'}
                                </span>
                            </div>
                            <div className="ml-8 space-y-4">
                                {quarter.items.map((item, idx) => (
                                    <div key={idx} className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
                                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                                        <p className="text-white/60 text-sm">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Feedback */}
                <div className="mt-16 text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Have a feature request?</h2>
                    <p className="text-white/70 mb-6">We'd love to hear from you!</p>
                    <Link to="/contact">
                        <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
                            Submit Feedback
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
