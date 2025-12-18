import { Link } from 'react-router-dom';

export default function StatusPage() {
    const services = [
        { name: 'Web Application', status: 'operational', uptime: '99.9%' },
        { name: 'API', status: 'operational', uptime: '99.9%' },
        { name: 'AI Processing', status: 'operational', uptime: '99.8%' },
        { name: 'File Storage', status: 'operational', uptime: '99.99%' },
        { name: 'Authentication', status: 'operational', uptime: '99.9%' },
    ];

    const incidents = [
        // Empty for now - no incidents
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
                <h1 className="text-5xl font-bold text-white mb-6">System Status</h1>

                {/* Overall Status */}
                <div className="bg-green-500/20 rounded-xl p-6 border border-green-500/30 mb-12 flex items-center gap-4">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                        <h2 className="text-xl font-bold text-green-400">All Systems Operational</h2>
                        <p className="text-green-400/70 text-sm">Last updated: Just now</p>
                    </div>
                </div>

                {/* Services */}
                <section className="mb-16">
                    <h2 className="text-2xl font-bold text-white mb-6">Services</h2>
                    <div className="space-y-4">
                        {services.map((service, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${service.status === 'operational' ? 'bg-green-500' :
                                        service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}></div>
                                    <span className="text-white font-medium">{service.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-white/60 text-sm">{service.uptime} uptime</span>
                                    <span className={`text-sm px-3 py-1 rounded-full ${service.status === 'operational' ? 'bg-green-500/20 text-green-400' :
                                        service.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {service.status === 'operational' ? 'Operational' :
                                            service.status === 'degraded' ? 'Degraded' : 'Outage'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Incidents */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Recent Incidents</h2>
                    {incidents.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-4xl mb-4 block">✨</span>
                            <p className="text-white/70">No incidents reported in the last 30 days.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {incidents.map((incident, i) => (
                                <div key={i} className="bg-white/10 rounded-lg p-4 border border-white/20">
                                    <h3 className="text-white font-semibold">{incident.title}</h3>
                                    <p className="text-white/60 text-sm">{incident.date}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
