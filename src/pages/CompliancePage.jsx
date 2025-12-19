import { useState } from 'react';
import { Link } from 'react-router-dom';
import { COMPLIANCE_STANDARDS, getComplianceStatus, getAllComplianceStatuses, generateComplianceReport } from '../services/complianceService';

export default function CompliancePage() {
    const [selectedStandard, setSelectedStandard] = useState(null);
    const complianceStatuses = getAllComplianceStatuses();

    const getStatusColor = (status) => {
        switch (status) {
            case 'compliant': return 'bg-green-500';
            case 'mostly': return 'bg-yellow-500';
            case 'partial': return 'bg-orange-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'compliant': return 'Fully Compliant';
            case 'mostly': return 'Mostly Compliant';
            case 'partial': return 'Partial';
            default: return 'Unknown';
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
            <div className="max-w-6xl mx-auto px-6 py-16">
                <h1 className="text-5xl font-bold text-white mb-6">Security & Compliance</h1>
                <p className="text-xl text-white/70 mb-4">Our security practices and compliance alignment status.</p>

                {/* Important Notice */}
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4 mb-12">
                    <p className="text-yellow-200 text-sm">
                        <strong>⚠️ Important:</strong> RFPgrep follows security best practices aligned with SOC 2 and ISO/IEC 27001 frameworks.
                        <strong> Formal certification is planned but not yet completed.</strong> We are committed to achieving certification as part of our roadmap.
                    </p>
                </div>

                {/* Compliance Overview Cards */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-6">Compliance Standards</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {complianceStatuses.map((standard) => (
                            <button
                                key={standard.id}
                                onClick={() => setSelectedStandard(selectedStandard === standard.id ? null : standard.id)}
                                className={`bg-white/10 backdrop-blur-md rounded-xl p-6 border transition-all text-left ${selectedStandard === standard.id
                                    ? 'border-indigo-400 ring-2 ring-indigo-400/50'
                                    : 'border-white/20 hover:border-white/40'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-4xl">{standard.icon}</span>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(standard.status)}`}>
                                        {standard.percentage}%
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{standard.name}</h3>
                                <p className="text-sm text-white/60 mb-3">{standard.description}</p>

                                {/* Progress Bar */}
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getStatusColor(standard.status)} transition-all`}
                                        style={{ width: `${standard.percentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-white/50 mt-2">
                                    {standard.met}/{standard.total} requirements met
                                </p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Selected Standard Details */}
                {selectedStandard && (
                    <section className="mb-16 animate-in fade-in duration-300">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-4xl">{COMPLIANCE_STANDARDS[selectedStandard.toUpperCase()].icon}</span>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">
                                                {COMPLIANCE_STANDARDS[selectedStandard.toUpperCase()].name} Requirements
                                            </h3>
                                            <p className="text-white/60">
                                                {COMPLIANCE_STANDARDS[selectedStandard.toUpperCase()].description}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedStandard(null)}
                                        className="text-white/60 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <div className="divide-y divide-white/10">
                                {COMPLIANCE_STANDARDS[selectedStandard.toUpperCase()].requirements.map((req) => (
                                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${req.met ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {req.met ? '✓' : '✕'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{req.name}</p>
                                                <p className="text-sm text-white/60">{req.description}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.met
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {req.met ? 'Compliant' : 'Action Required'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Data Handling */}
                <section className="mb-16">
                    <h2 className="text-3xl font-bold text-white mb-6">Data Handling Practices</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { title: 'Data Encryption', desc: 'All data encrypted at rest (AES-256) and in transit (TLS 1.3)', icon: '🔐' },
                            { title: 'Data Residency', desc: 'Data stored in secure Google Cloud data centers', icon: '🌍' },
                            { title: 'Data Retention', desc: 'Customer controls retention; data deleted within 30 days of account closure', icon: '🗑️' },
                            { title: 'Access Controls', desc: 'Role-based access with audit logging for all data access', icon: '🔑' },
                            { title: 'AI Data Usage', desc: 'Customer data is NEVER used to train AI models', icon: '🤖' },
                            { title: 'Backup & Recovery', desc: 'Daily backups with point-in-time recovery capability', icon: '💾' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 flex items-start gap-4">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                    <h3 className="text-white font-semibold">{item.title}</h3>
                                    <p className="text-white/60 text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Download Report */}
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <h2 className="text-2xl font-bold text-white mb-4">Need Compliance Documentation?</h2>
                    <p className="text-white/70 mb-6">Download compliance reports or request security questionnaires.</p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                const report = generateComplianceReport();
                                console.log('Compliance Report:', report);
                                alert('Compliance report generated! Check console for details.');
                            }}
                            className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
                        >
                            📄 Generate Report
                        </button>
                        <Link to="/contact">
                            <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
                                Contact Compliance Team
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
