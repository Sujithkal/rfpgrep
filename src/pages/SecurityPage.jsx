import { Link } from 'react-router-dom';

export default function SecurityPage() {
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
                <h1 className="text-5xl font-bold text-white mb-6">Security</h1>
                <p className="text-xl text-white/70 mb-12">Your data security is our top priority. Here's how we protect it.</p>

                {/* Security Features */}
                <div className="space-y-8 mb-16">
                    {[
                        {
                            icon: '🔐',
                            title: 'Data Encryption',
                            desc: 'All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Your documents and responses are always protected.'
                        },
                        {
                            icon: '🏢',
                            title: 'Secure Infrastructure',
                            desc: 'We use Google Cloud Platform with enterprise-grade security. Our infrastructure includes firewalls, intrusion detection, and regular security audits.'
                        },
                        {
                            icon: '🚫',
                            title: 'No AI Training on Your Data',
                            desc: 'Your documents are NEVER used to train our AI models. Your data remains yours and is only used to generate responses for your account.'
                        },
                        {
                            icon: '🔑',
                            title: 'Access Controls',
                            desc: 'Role-based access control ensures team members only see what they need. Admins have full visibility and control over permissions.'
                        },
                        {
                            icon: '📋',
                            title: 'Audit Logs',
                            desc: 'Every action is logged for compliance. Track who accessed what and when with detailed audit trails.'
                        },
                        {
                            icon: '🔄',
                            title: 'Regular Backups',
                            desc: 'Your data is backed up daily with point-in-time recovery. We maintain backups for 30 days.'
                        },
                    ].map((item, i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <div className="flex items-start gap-4">
                                <span className="text-3xl">{item.icon}</span>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                    <p className="text-white/70">{item.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Certifications */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-6">Security Standards</h2>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                        <p className="text-yellow-300 text-sm">
                            <strong>⚠️ Transparency Note:</strong> We follow security best practices aligned with industry standards.
                            We have not yet completed formal SOC 2 or ISO 27001 certification audits.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { title: 'GDPR Ready', desc: 'EU data protection compliant' },
                            { title: 'SOC 2 Aligned', desc: 'Security practices aligned with SOC 2 standards' },
                            { title: 'ISO 27001 Aligned', desc: 'Controls aligned with ISO/IEC 27001 framework' },
                        ].map((cert, i) => (
                            <div key={i} className="bg-white/5 rounded-lg p-6 text-center border border-white/10">
                                <h3 className="text-xl font-bold text-indigo-400 mb-2">{cert.title}</h3>
                                <p className="text-white/60 text-sm">{cert.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Responsible Disclosure */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-6">Security Reporting</h2>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                        <div className="flex items-start gap-4">
                            <span className="text-3xl">🛡️</span>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-3">Responsible Disclosure</h3>
                                <p className="text-white/70 mb-4">
                                    We take security seriously. If you discover a vulnerability, please report it responsibly.
                                </p>
                                <div className="bg-white/5 rounded-lg p-4 mb-4">
                                    <p className="text-white/80"><strong>Report to:</strong> <a href="mailto:security@rfpgrep.com" className="text-indigo-400 hover:underline">security@rfpgrep.com</a></p>
                                </div>
                                <p className="text-white/70 mb-2">
                                    Please include a detailed description of the issue and steps to reproduce.
                                    We'll respond within 48 hours and work with you to address valid reports.
                                </p>
                                <p className="text-white/50 text-sm mt-4">
                                    We appreciate researchers who help us keep our platform secure.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Security Questions?</h2>
                    <p className="text-white/70 mb-6">Contact our security team for more information.</p>
                    <Link to="/contact">
                        <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
                            Contact Security Team
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
