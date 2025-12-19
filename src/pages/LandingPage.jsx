import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary">
            {/* HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-color bg-bg-primary/70 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-lg shadow-accent-purple/30">
                            <span className="text-lg sm:text-xl">⚡</span>
                        </div>
                        <span className="text-xl sm:text-[28px] font-extrabold tracking-tight">RFPgrep</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-6 lg:gap-10">
                        <a href="#features" className="text-text-secondary hover:text-accent-purple transition-colors text-sm font-medium">Features</a>
                        <a href="#security" className="text-text-secondary hover:text-accent-purple transition-colors text-sm font-medium">Security</a>
                        <a href="#pricing" className="text-text-secondary hover:text-accent-purple transition-colors text-sm font-medium">Pricing</a>
                        <Link to="/docs" className="text-text-secondary hover:text-accent-purple transition-colors text-sm font-medium">Docs</Link>
                    </nav>

                    <div className="hidden sm:flex items-center gap-3 lg:gap-5">
                        <a
                            href="https://calendly.com/sujithkallutla/30min"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-secondary hover:text-accent-purple transition-colors text-sm font-medium"
                        >
                            Schedule Demo
                        </a>
                        <Link to="/login" className="text-text-secondary hover:text-accent-purple transition-colors text-sm font-medium">
                            Sign In
                        </Link>
                        <Link to="/signup">
                            <button className="px-6 lg:px-8 py-2.5 lg:py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm font-semibold hover:scale-105 transition-all shadow-lg shadow-accent-purple/30">
                                Get Started
                            </button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="sm:hidden p-2 text-text-secondary hover:text-accent-purple"
                    >
                        {mobileMenuOpen ? (
                            <span className="text-2xl">✕</span>
                        ) : (
                            <span className="text-2xl">☰</span>
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="sm:hidden bg-bg-primary border-t border-border-color">
                        <div className="px-4 py-4 space-y-3">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-text-secondary hover:text-accent-purple py-2 font-medium">Features</a>
                            <a href="#security" onClick={() => setMobileMenuOpen(false)} className="block text-text-secondary hover:text-accent-purple py-2 font-medium">Security</a>
                            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-text-secondary hover:text-accent-purple py-2 font-medium">Pricing</a>
                            <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="block text-text-secondary hover:text-accent-purple py-2 font-medium">Docs</Link>
                            <hr className="border-border-color" />
                            <a
                                href="https://calendly.com/sujithkallutla/30min"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-accent-purple py-2 font-medium"
                            >
                                📅 Schedule Demo
                            </a>
                            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-text-secondary hover:text-accent-purple py-2 font-medium">Sign In</Link>
                            <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                                <button className="w-full py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold">
                                    Get Started
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* HERO SECTION */}
            <section className="pt-32 sm:pt-40 lg:pt-[200px] pb-16 sm:pb-24 lg:pb-[150px] px-4 sm:px-6 lg:px-10 relative overflow-hidden">
                <div className="absolute top-[-50%] right-[-10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-radial from-accent-purple/10 to-transparent rounded-full animate-float"></div>

                <div className="max-w-[900px] mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-accent-purple/15 border border-accent-purple/30 mb-4 sm:mb-6">
                        <span className="text-base sm:text-lg">🚀</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-accent-purple uppercase tracking-wide">The Future of RFP Automation</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold mb-4 sm:mb-6 tracking-tight leading-[1.1]">
                        Turn Hours Into Minutes.<br />Automate RFPs With AI
                    </h1>

                    <p className="text-base sm:text-lg lg:text-xl text-text-secondary mb-8 sm:mb-12 leading-relaxed max-w-[700px] mx-auto px-2">
                        Enterprise-grade AI that writes RFP responses your way. Trusted by 500+ teams globally.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 mb-12 sm:mb-20">
                        <Link to="/signup" className="w-full sm:w-auto">
                            <button className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-sm sm:text-base font-semibold hover:scale-105 transition-transform shadow-2xl shadow-accent-purple/40">
                                Start Free Trial (30 Days)
                            </button>
                        </Link>
                        <a
                            href="https://calendly.com/sujithkallutla/30min"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-3.5 rounded-lg border-2 border-border-color text-sm sm:text-base font-semibold hover:border-accent-purple hover:bg-bg-secondary transition-all text-center"
                        >
                            📅 Schedule Demo
                        </a>
                    </div>

                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                        <p className="text-xs sm:text-sm text-text-secondary">✓ Trusted by 500+ enterprise teams worldwide</p>
                        <div className="flex items-center gap-4 sm:gap-10 flex-wrap justify-center">
                            {['Company 1', 'Company 2', 'Company 3', 'Company 4'].map((company, i) => (
                                <div key={i} className="w-20 sm:w-[120px] h-8 sm:h-10 bg-bg-secondary border border-border-color rounded-lg flex items-center justify-center text-text-secondary text-[10px] sm:text-xs font-semibold">
                                    {company}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" className="py-16 sm:py-24 lg:py-[120px] px-4 sm:px-6 lg:px-10 bg-bg-primary">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-10 sm:mb-16 lg:mb-20 max-w-[800px] mx-auto">
                        <p className="text-xs font-semibold text-accent-purple uppercase tracking-wider mb-3 sm:mb-4">FEATURES</p>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 tracking-tight">Everything You Need to Win</h2>
                        <p className="text-sm sm:text-base lg:text-lg text-text-secondary leading-relaxed">
                            Powerful AI tools designed for enterprise RFP teams
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {[
                            { icon: '🤖', title: 'AI Response Generation', desc: 'Generate tailored responses using your company knowledge base and past wins' },
                            { icon: '🛡️', title: 'AI Confidence Indicator', desc: 'Get experimental confidence ratings on AI-generated answers' },
                            { icon: '📚', title: 'Smart Content Library', desc: 'Auto-categorize and search through thousands of documents instantly' },
                            { icon: '👥', title: 'Real-time Collaboration', desc: 'Assign questions to SMEs and track review status in one place' },
                            { icon: '⚡', title: 'Fast Import/Export', desc: 'Parse complex Excel RFPs and export with formatting intact' },
                            { icon: '📊', title: 'Win Analytics', desc: 'Track win rates, response times, and identify improvement areas' },
                        ].map((feature, i) => (
                            <div key={i} className="bg-bg-secondary border border-border-color rounded-xl p-6 sm:p-8 lg:p-12 hover:border-accent-purple hover:shadow-xl hover:shadow-accent-purple/10 hover:-translate-y-1 transition-all cursor-pointer">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl bg-accent-purple/15 flex items-center justify-center mb-4 sm:mb-5 lg:mb-6 text-2xl sm:text-2xl lg:text-3xl">
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg sm:text-xl lg:text-[22px] font-bold mb-2 sm:mb-3 lg:mb-4">{feature.title}</h3>
                                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI ACTIONS SECTION */}
            <section className="py-[120px] px-10 bg-bg-tertiary">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-[800px] mx-auto">
                        <p className="text-xs font-semibold text-accent-purple uppercase tracking-wider mb-4">AI CAPABILITIES</p>
                        <h2 className="text-5xl font-bold mb-5 tracking-tight">10+ AI-Powered Actions</h2>
                        <p className="text-lg text-text-secondary leading-relaxed">
                            Transform your responses with intelligent tools
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {[
                            { icon: '✂️', label: 'Shorten' },
                            { icon: '📝', label: 'Expand' },
                            { icon: '✓', label: 'Spelling & Grammar' },
                            { icon: '🎯', label: 'Simplify' },
                            { icon: '💼', label: 'Professional Tone' },
                            { icon: '⚙️', label: 'Technical Tone' },
                            { icon: '📊', label: 'Improve Flow' },
                            { icon: '✨', label: 'Rewrite' },
                            { icon: '🌍', label: 'Localize' },
                            { icon: '📋', label: 'Generic Answer' },
                        ].map((action, i) => (
                            <div key={i} className="bg-accent-purple/8 border border-accent-purple/20 rounded-xl p-7 text-center hover:border-accent-purple hover:bg-accent-purple/15 hover:scale-105 hover:shadow-lg hover:shadow-accent-purple/15 transition-all cursor-pointer">
                                <div className="text-[32px] mb-3">{action.icon}</div>
                                <p className="text-sm font-semibold">{action.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="py-[120px] px-10 bg-bg-primary">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-15">
                    {[
                        { value: '10x', label: 'Faster responses' },
                        { value: '73%', label: 'Average win rate' },
                        { value: '500+', label: 'Enterprise clients' },
                        { value: '50M+', label: 'Questions answered' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-[56px] font-extrabold bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent mb-3 leading-none">
                                {stat.value}
                            </div>
                            <div className="text-base text-text-secondary font-semibold">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* WHY RFPGREP - SEO CONTENT SECTION */}
            <section className="py-16 sm:py-24 lg:py-[100px] px-4 sm:px-6 lg:px-10 bg-bg-tertiary">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16 max-w-[900px] mx-auto">
                        <p className="text-xs font-semibold text-accent-purple uppercase tracking-wider mb-4">WHY CHOOSE RFPGREP</p>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-5 tracking-tight">
                            The Complete RFP Automation Platform
                        </h2>
                        <p className="text-sm sm:text-base lg:text-lg text-text-secondary leading-relaxed">
                            Most proposal software falls short on AI capabilities, collaboration features, or enterprise security.
                            RFPgrep brings everything together in one powerful platform designed for teams that want to win more.
                        </p>
                    </div>

                    {/* Feature Comparison Table */}
                    <div className="bg-bg-secondary border border-border-color rounded-2xl overflow-hidden mb-12">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border-color">
                                        <th className="text-left p-4 sm:p-6 font-semibold text-text-primary">Feature</th>
                                        <th className="text-center p-4 sm:p-6 font-semibold text-accent-purple bg-accent-purple/5">RFPgrep</th>
                                        <th className="text-center p-4 sm:p-6 font-semibold text-text-secondary">Traditional Tools</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { feature: 'AI-Powered Response Generation', us: true, them: false },
                                        { feature: 'Real-time Multi-user Collaboration', us: true, them: false },
                                        { feature: 'AI Confidence Ratings (experimental)', us: true, them: false },
                                        { feature: 'Multi-language Translation (13+ languages)', us: true, them: false },
                                        { feature: 'Version History & Rollback', us: true, them: 'Limited' },
                                        { feature: 'Comment Threads on Questions', us: true, them: false },
                                        { feature: 'AI Quality Review & Suggestions', us: true, them: false },
                                        { feature: 'Customizable Approval Workflows', us: true, them: 'Limited' },
                                        { feature: 'Export to PDF, Word, Excel', us: true, them: true },
                                        { feature: 'Team Role & Permissions', us: true, them: 'Basic' },
                                        { feature: 'Knowledge Base Integration', us: true, them: 'Limited' },
                                        { feature: 'SOC 2 & ISO 27001 Aligned Security', us: true, them: 'Varies' },
                                        { feature: 'Gamification & Team Leaderboards', us: true, them: false },
                                        { feature: 'Auto-assignment by Expertise', us: true, them: false },
                                        { feature: 'No AI Model Training on Your Data', us: true, them: false },
                                    ].map((row, i) => (
                                        <tr key={i} className={`border-b border-border-color/50 ${i % 2 === 0 ? 'bg-bg-primary/30' : ''}`}>
                                            <td className="p-4 sm:p-5 text-text-primary font-medium">{row.feature}</td>
                                            <td className="p-4 sm:p-5 text-center bg-accent-purple/5">
                                                {row.us === true ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500/20 text-green-400">✓</span>
                                                ) : (
                                                    <span className="text-text-secondary">{row.us}</span>
                                                )}
                                            </td>
                                            <td className="p-4 sm:p-5 text-center">
                                                {row.them === true ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500/20 text-green-400">✓</span>
                                                ) : row.them === false ? (
                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 text-red-400">✕</span>
                                                ) : (
                                                    <span className="text-text-secondary text-xs">{row.them}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SEO-Rich Content Paragraphs */}
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        <article className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-bold mb-4 text-text-primary">
                                What is RFP Automation Software?
                            </h3>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                RFP automation software transforms how businesses respond to Requests for Proposals.
                                Manual drafting can take days or even weeks, but modern AI-powered tools like
                                RFPgrep generate intelligent, contextually relevant answers in minutes. This
                                proposal management software learns from your company's knowledge base, past
                                winning submissions, and industry best practices to create compelling responses
                                that win more contracts.
                            </p>
                            <p className="text-text-secondary leading-relaxed">
                                Enterprise teams using bid management software report up to 10x faster response
                                times and significantly higher win rates. The ROI is clear: spend less time on
                                repetitive writing and more time on strategy and relationship building.
                            </p>
                        </article>

                        <article className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-bold mb-4 text-text-primary">
                                How RFPgrep's AI Works Differently
                            </h3>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                Unlike basic proposal software that relies on simple templates, RFPgrep uses
                                advanced AI to understand the context of each question. Our tender automation
                                system analyzes the specific requirements, matches them to relevant content
                                from your knowledge base, and generates tailored responses that sound like
                                they were written by your best proposal writers.
                            </p>
                            <p className="text-text-secondary leading-relaxed">
                                Every AI-generated answer includes a Trust Score, which is a confidence
                                rating showing how well the response matches your source content. Our AI
                                review also flags weak answers and suggests improvements, ensuring
                                consistent quality across your entire proposal.
                            </p>
                        </article>

                        <article className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-bold mb-4 text-text-primary">
                                Built for Enterprise Teams
                            </h3>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                RFPgrep goes beyond a basic RFP tool. It's a complete proposal collaboration
                                platform where multiple team members can work on the same proposal at once.
                                Real-time presence indicators show who's viewing and editing, comment threads
                                keep discussions organized, and customizable approval workflows ensure the
                                right people review before submission.
                            </p>
                            <p className="text-text-secondary leading-relaxed">
                                Our role-based permissions let you control exactly who can view, edit, or
                                approve responses. And with auto-assignment features, questions are
                                automatically routed to the subject matter experts best qualified to
                                answer them.
                            </p>
                        </article>

                        <article className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-bold mb-4 text-text-primary">
                                Enterprise Security & Compliance
                            </h3>
                            <p className="text-text-secondary leading-relaxed mb-4">
                                Security is built into every layer of RFPgrep from day one. Our security
                                practices are aligned with SOC 2 and ISO 27001 frameworks, with regional
                                data centers to maintain data sovereignty. We guarantee that your data
                                never trains our AI models. Your proposals, knowledge base, and company
                                information remain 100% private.
                            </p>
                            <p className="text-text-secondary leading-relaxed">
                                Our comprehensive audit logs track every action for compliance requirements,
                                while advanced encryption protects data in transit and at rest. For
                                government RFP software needs, we meet FedRAMP-ready security standards.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            {/* SECURITY SECTION */}
            <section id="security" className="py-[120px] px-10 bg-bg-tertiary">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
                    <div className="w-full h-[400px] bg-bg-secondary border-2 border-dashed border-border-color rounded-xl flex items-center justify-center text-text-secondary text-lg">
                        [Dashboard Screenshot Mockup]
                    </div>

                    <div>
                        <h2 className="text-5xl font-bold mb-8">Your Data, Your Control</h2>
                        <div className="space-y-6">
                            {[
                                { icon: '🔐', title: 'SOC 2 & ISO 27001 Aligned', desc: 'Enterprise-grade security practices with regular security audits' },
                                { icon: '🌍', title: 'Regional Data Centers', desc: 'Maintain data sovereignty with dedicated hosting (EU, US, AU)' },
                                { icon: '🚫', title: 'Zero AI Model Training', desc: 'Your data never trains our AI models - complete privacy guaranteed' },
                                { icon: '⚡', title: '99.9% Uptime SLA', desc: 'Enterprise-grade reliability with redundant infrastructure' },
                            ].map((feature, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-lg bg-accent-purple/15 flex items-center justify-center text-xl flex-shrink-0">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold mb-1">{feature.title}</h4>
                                        <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section id="pricing" className="py-16 sm:py-24 lg:py-[120px] px-4 sm:px-6 lg:px-10 bg-bg-primary">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-10 sm:mb-16 lg:mb-20 max-w-[800px] mx-auto">
                        <p className="text-xs font-semibold text-accent-purple uppercase tracking-wider mb-3 sm:mb-4">PRICING</p>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 tracking-tight">Simple, Transparent Pricing</h2>
                        <p className="text-sm sm:text-base lg:text-lg text-text-secondary leading-relaxed">
                            Start free, scale as you grow. No hidden fees.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
                        {[
                            {
                                name: 'Free',
                                desc: 'Perfect for trying out',
                                price: '₹0',
                                billing: 'forever',
                                features: ['3 projects per month', '50 AI responses', 'PDF export', 'Email support'],
                                featured: false,
                                cta: 'Start Free'
                            },
                            {
                                name: 'Professional',
                                desc: 'For growing businesses',
                                price: '₹3,999',
                                billing: 'per month',
                                features: ['Unlimited projects', '500 AI responses/month', 'PDF & Word export', 'Team collaboration', 'Priority support'],
                                featured: true,
                                cta: 'Get Started'
                            },
                            {
                                name: 'Enterprise',
                                desc: 'For large organizations',
                                price: '₹15,999',
                                billing: 'per month',
                                features: ['Everything in Professional', 'Unlimited AI responses', 'Custom AI training', 'API access', 'Dedicated support'],
                                featured: false,
                                cta: 'Get Started'
                            },
                        ].map((plan, i) => (
                            <div
                                key={i}
                                className={`bg-bg-secondary border-2 rounded-xl p-12 relative transition-all ${plan.featured
                                    ? 'border-accent-purple shadow-2xl shadow-accent-purple/15 scale-105'
                                    : 'border-border-color'
                                    }`}
                            >
                                {plan.featured && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-accent-purple text-white text-xs font-bold uppercase">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
                                <p className="text-sm text-text-secondary mb-8">{plan.desc}</p>
                                <div className="text-5xl font-extrabold mb-2">{plan.price}</div>
                                <p className="text-sm text-text-secondary mb-8">{plan.billing}</p>
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm text-text-secondary">
                                            <span className="text-success font-bold flex-shrink-0">✓</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/signup">
                                    {plan.featured ? (
                                        <button className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:scale-105 transition-transform shadow-lg shadow-accent-purple/30">
                                            {plan.cta}
                                        </button>
                                    ) : (
                                        <button className="w-full px-6 py-3 rounded-lg border-2 border-border-color font-semibold hover:border-accent-purple hover:bg-bg-secondary transition-all">
                                            {plan.cta}
                                        </button>
                                    )}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA SECTION */}
            <section className="py-[120px] px-10 text-center bg-gradient-to-br from-bg-tertiary to-bg-primary">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-5xl font-bold mb-5">Ready to Win More Proposals?</h2>
                    <p className="text-lg text-text-secondary mb-12 max-w-[600px] mx-auto">
                        Join hundreds of teams using AI to close deals faster
                    </p>
                    <div className="flex items-center justify-center gap-5">
                        <Link to="/signup">
                            <button className="px-10 py-3.5 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white text-base font-semibold hover:scale-105 transition-transform shadow-2xl shadow-accent-purple/40">
                                Start Free Trial
                            </button>
                        </Link>
                        <button className="px-10 py-3.5 rounded-lg border-2 border-border-color text-base font-semibold hover:border-accent-purple hover:bg-bg-secondary transition-all">
                            Schedule Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-20 px-10 border-t border-border-color bg-bg-primary">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-15 mb-15">
                        {[
                            {
                                title: 'Product',
                                links: [
                                    { name: 'Features', path: '/features' },
                                    { name: 'Pricing', path: '/pricing' },
                                    { name: 'Security', path: '/security' },
                                    { name: 'Roadmap', path: '/roadmap' }
                                ]
                            },
                            {
                                title: 'Company',
                                links: [
                                    { name: 'About', path: '/about' },
                                    { name: 'Blog', path: '/blog' },
                                    { name: 'Careers', path: '/careers' },
                                    { name: 'Contact', path: '/contact' }
                                ]
                            },
                            {
                                title: 'Resources',
                                links: [
                                    { name: 'Documentation', path: '/docs' },
                                    { name: 'API Docs', path: '/api-docs' },
                                    { name: 'Help Center', path: '/help' },
                                    { name: 'Status', path: '/status' }
                                ]
                            },
                            {
                                title: 'Legal',
                                links: [
                                    { name: 'Privacy', path: '/privacy' },
                                    { name: 'Terms', path: '/terms' },
                                    { name: 'Compliance', path: '/compliance' },
                                    { name: 'Refunds', path: '/refund' }
                                ]
                            },
                        ].map((section, i) => (
                            <div key={i}>
                                <h4 className="text-sm font-bold uppercase mb-5 tracking-wide">{section.title}</h4>
                                <div className="space-y-3">
                                    {section.links.map((link, idx) => (
                                        <Link key={idx} to={link.path} className="block text-sm text-text-secondary hover:text-accent-purple transition-colors">
                                            {link.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 border-t border-border-color text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                                <span className="text-xl">⚡</span>
                            </div>
                            <span className="text-xl font-bold">RFPgrep</span>
                        </div>
                        <p className="text-sm text-text-secondary">&copy; 2024 RFPgrep. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
