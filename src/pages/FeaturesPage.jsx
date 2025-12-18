import { Link } from 'react-router-dom';

export default function FeaturesPage() {
    const features = [
        {
            icon: '🤖',
            title: 'AI Response Generation',
            desc: 'Generate tailored responses using your company knowledge base and past wins. Our AI learns your tone and style.',
            details: ['Context-aware answers', 'Brand voice matching', 'Citation support']
        },
        {
            icon: '📄',
            title: 'Smart Document Parsing',
            desc: 'Upload RFPs in any format - PDF, Word, Excel. Our AI extracts questions automatically.',
            details: ['Multi-format support', 'Table extraction', 'Question detection']
        },
        {
            icon: '📚',
            title: 'Knowledge Library',
            desc: 'Build a searchable repository of your company content. The AI uses this to craft better responses.',
            details: ['Document upload', 'Auto-categorization', 'Semantic search']
        },
        {
            icon: '👥',
            title: 'Team Collaboration',
            desc: 'Assign questions to subject matter experts. Track progress and review in real-time.',
            details: ['Role-based access', 'Question assignment', 'Review workflow']
        },
        {
            icon: '📊',
            title: 'Analytics Dashboard',
            desc: 'Track win rates, response times, and team productivity. Identify areas for improvement.',
            details: ['Win/loss tracking', 'Time analytics', 'Team metrics']
        },
        {
            icon: '📤',
            title: 'Export Options',
            desc: 'Export your completed responses to PDF or Word with professional formatting.',
            details: ['PDF export', 'Word export', 'Custom branding']
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

            {/* Hero */}
            <div className="max-w-6xl mx-auto px-6 py-16 text-center">
                <h1 className="text-5xl font-bold text-white mb-6">Powerful Features</h1>
                <p className="text-xl text-white/70 max-w-2xl mx-auto">
                    Everything you need to write winning proposals faster than ever before.
                </p>
            </div>

            {/* Features Grid */}
            <div className="max-w-6xl mx-auto px-6 pb-24">
                <div className="grid md:grid-cols-2 gap-8">
                    {features.map((feature, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 hover:border-indigo-500/50 transition-colors">
                            <span className="text-4xl mb-4 block">{feature.icon}</span>
                            <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-white/70 mb-4">{feature.desc}</p>
                            <ul className="space-y-2">
                                {feature.details.map((detail, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-white/60 text-sm">
                                        <span className="text-indigo-400">✓</span>
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="max-w-4xl mx-auto px-6 pb-24 text-center">
                <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl p-12 border border-indigo-500/30">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
                    <p className="text-white/70 mb-8">Try all features free for 30 days. Credit card required to start.</p>
                    <Link to="/signup">
                        <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
                            Start Free Trial
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
