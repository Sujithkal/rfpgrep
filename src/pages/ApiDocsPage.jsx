import { Link } from 'react-router-dom';

export default function ApiDocsPage() {
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
                <h1 className="text-5xl font-bold text-white mb-6">API Documentation</h1>
                <p className="text-xl text-white/70 mb-12">Integrate RFPgrep into your workflow with our REST API.</p>

                {/* Coming Soon */}
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-6xl mb-6 block">🔧</span>
                    <h2 className="text-3xl font-bold text-white mb-4">API Coming Soon</h2>
                    <p className="text-white/70 mb-8 max-w-md mx-auto">
                        We're building a powerful REST API for enterprise customers.
                        Join the waitlist to get early access.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link to="/pricing">
                            <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
                                View Enterprise Plan
                            </button>
                        </Link>
                        <Link to="/contact">
                            <button className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20">
                                Contact Sales
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-16">
                    <h2 className="text-2xl font-bold text-white mb-6">What's Coming</h2>
                    <div className="space-y-4">
                        {[
                            { method: 'POST', endpoint: '/api/v1/projects', desc: 'Create a new project' },
                            { method: 'GET', endpoint: '/api/v1/projects/:id', desc: 'Get project details' },
                            { method: 'POST', endpoint: '/api/v1/generate', desc: 'Generate AI response' },
                            { method: 'GET', endpoint: '/api/v1/knowledge', desc: 'Search knowledge base' },
                        ].map((api, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 flex items-center gap-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${api.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    {api.method}
                                </span>
                                <code className="text-indigo-400 font-mono">{api.endpoint}</code>
                                <span className="text-white/60 text-sm ml-auto">{api.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
