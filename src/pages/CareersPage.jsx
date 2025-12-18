import { Link } from 'react-router-dom';

export default function CareersPage() {
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
                <h1 className="text-5xl font-bold text-white mb-6">Careers</h1>
                <p className="text-xl text-white/70 mb-12">Join us in transforming how businesses win proposals.</p>

                {/* Culture */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-6">Why Work at RFPgrep?</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { icon: '🚀', title: 'High Impact', desc: 'Your work directly helps businesses win more deals' },
                            { icon: '🌍', title: 'Remote First', desc: 'Work from anywhere in the world' },
                            { icon: '📈', title: 'Growth', desc: 'Learn and grow with a fast-paced startup' },
                            { icon: '💡', title: 'Innovation', desc: 'Work with cutting-edge AI technology' },
                        ].map((perk, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                <span className="text-3xl mb-3 block">{perk.icon}</span>
                                <h3 className="text-xl font-bold text-white mb-2">{perk.title}</h3>
                                <p className="text-white/70">{perk.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Open Positions */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-6">Open Positions</h2>
                    <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-5xl mb-4 block">🎉</span>
                        <h3 className="text-2xl font-bold text-white mb-4">No open positions right now</h3>
                        <p className="text-white/70 mb-6">
                            We're not actively hiring, but we're always looking for talented people.<br />
                            Send us your resume for future opportunities!
                        </p>
                        <Link to="/contact">
                            <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
                                Send Your Resume
                            </button>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
