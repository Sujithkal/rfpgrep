import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function HelpPage() {
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            q: 'How do I upload an RFP?',
            a: 'Go to Projects, click "New Project", fill in the details, and drag & drop your RFP file. We support PDF, Word, and Excel formats.'
        },
        {
            q: 'How does the AI generate responses?',
            a: 'Our AI analyzes your RFP questions and uses your knowledge library to generate tailored responses. You can edit and refine the responses before exporting.'
        },
        {
            q: 'Can I add custom content for the AI to use?',
            a: 'Yes! Go to Knowledge Library and upload your company documents, past proposals, and case studies. The AI will use this content to generate better responses.'
        },
        {
            q: 'How do I invite team members?',
            a: 'Go to your project, click on the Team tab, and enter their email address. They will receive an invite to join your workspace.'
        },
        {
            q: 'What export formats are supported?',
            a: 'You can export your completed responses to PDF or Word format. Both include professional formatting and your company branding.'
        },
        {
            q: 'How do I change my subscription plan?',
            a: 'Go to Settings > Subscription and click "Change Plan". You can upgrade or downgrade at any time.'
        },
        {
            q: 'Is my data secure?',
            a: 'Yes! All data is encrypted at rest and in transit. We never use your data to train our AI models. See our Security page for more details.'
        },
        {
            q: 'How do I cancel my subscription?',
            a: 'You can cancel anytime from Settings > Subscription. Your access continues until the end of your billing period.'
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
                <h1 className="text-5xl font-bold text-white mb-6">Help Center</h1>
                <p className="text-xl text-white/70 mb-12">Find answers to common questions.</p>

                {/* FAQs */}
                <div className="space-y-4 mb-16">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full p-6 text-left flex items-center justify-between"
                            >
                                <span className="text-lg font-semibold text-white">{faq.q}</span>
                                <span className="text-white/60 text-xl">
                                    {openFaq === i ? '−' : '+'}
                                </span>
                            </button>
                            {openFaq === i && (
                                <div className="px-6 pb-6">
                                    <p className="text-white/70">{faq.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-4xl mb-4 block">💬</span>
                    <h2 className="text-2xl font-bold text-white mb-4">Still need help?</h2>
                    <p className="text-white/70 mb-6">Our support team is ready to assist you.</p>
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
