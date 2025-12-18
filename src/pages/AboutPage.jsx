import { Link } from 'react-router-dom';

export default function AboutPage() {
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
                <h1 className="text-5xl font-bold text-white mb-6">About RFPgrep</h1>
                <p className="text-xl text-white/70 mb-12">Transforming how businesses respond to RFPs with AI-powered automation.</p>

                {/* Mission */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
                    <p className="text-white/70 text-lg leading-relaxed">
                        We believe every business deserves to win more proposals. RFPgrep was built to eliminate
                        the tedious, time-consuming work of writing RFP responses, so teams can focus on what matters
                        most: closing deals and growing their business.
                    </p>
                </section>

                {/* Story */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">Our Story</h2>
                    <p className="text-white/70 text-lg leading-relaxed mb-4">
                        Founded in 2024, RFPgrep emerged from a simple frustration: spending countless hours
                        writing repetitive RFP responses. Our founders experienced this pain firsthand and knew
                        there had to be a better way.
                    </p>
                    <p className="text-white/70 text-lg leading-relaxed">
                        Using the latest advances in AI technology, we built a platform that learns from your
                        company's knowledge base and past wins to generate high-quality, tailored responses in minutes.
                    </p>
                </section>

                {/* Values */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-6">Our Values</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { icon: '🎯', title: 'Quality First', desc: 'Every AI response meets enterprise standards' },
                            { icon: '🔒', title: 'Security', desc: 'Your data is encrypted and never shared' },
                            { icon: '⚡', title: 'Speed', desc: 'Save hours on every proposal' },
                            { icon: '🤝', title: 'Trust', desc: 'Transparent AI with source citations' },
                        ].map((value, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                                <span className="text-3xl mb-3 block">{value.icon}</span>
                                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                                <p className="text-white/70">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to transform your RFP process?</h2>
                    <Link to="/signup">
                        <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
                            Start Free Trial
                        </button>
                    </Link>
                </section>
            </div>
        </div>
    );
}
