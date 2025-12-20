import { Link } from 'react-router-dom';

export default function AUPPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-xl shadow-md">
                            ⚡
                        </div>
                        <span className="text-xl font-bold text-gray-900">RFPgrep</span>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Acceptable Use Policy</h1>
                <p className="text-gray-600 mb-8">Last updated: December 20, 2024</p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                    <p className="text-blue-800 text-sm">
                        <strong>Summary:</strong> Use RFPgrep responsibly. Don't abuse the AI, upload harmful content, or try to break things.
                        We reserve the right to suspend accounts that violate these rules.
                    </p>
                </div>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Purpose</h2>
                        <p>
                            This Acceptable Use Policy ("AUP") outlines the rules for using RFPgrep's services.
                            It applies to all users, including free and paid accounts. By using our service, you agree to follow these guidelines.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Prohibited Uses</h2>
                        <p>You may NOT use RFPgrep to:</p>

                        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1 Illegal Activities</h3>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Violate any applicable laws or regulations</li>
                            <li>Engage in fraud, money laundering, or financial crimes</li>
                            <li>Infringe on intellectual property rights of others</li>
                            <li>Generate content that violates export control laws</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2 Harmful Content</h3>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Upload or generate content that is illegal, defamatory, or obscene</li>
                            <li>Create content that promotes violence, hatred, or discrimination</li>
                            <li>Generate spam, phishing content, or deceptive material</li>
                            <li>Upload malware, viruses, or malicious code</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.3 AI Abuse</h3>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
                            <p className="text-red-800">
                                <strong>⚠️ Important:</strong> Attempting to manipulate, jailbreak, or abuse our AI systems is strictly prohibited.
                            </p>
                        </div>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Attempt to bypass AI safety measures or content filters</li>
                            <li>Use prompt injection techniques to manipulate AI outputs</li>
                            <li>Generate content that impersonates individuals or organizations</li>
                            <li>Use the AI for purposes outside normal RFP response generation</li>
                            <li>Attempt to extract training data or system prompts</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.4 System Abuse</h3>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Attempt to access accounts or data belonging to others</li>
                            <li>Probe, scan, or test vulnerabilities without authorization</li>
                            <li>Use automated tools, bots, or scrapers without permission</li>
                            <li>Intentionally disrupt or overload our services</li>
                            <li>Circumvent rate limits or usage restrictions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Fair Usage & Rate Limits</h2>
                        <p>To ensure quality service for all users, we implement fair usage policies:</p>
                        <div className="bg-gray-100 rounded-lg p-4 mt-4">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left text-sm font-semibold text-gray-700 pb-2">Resource</th>
                                        <th className="text-left text-sm font-semibold text-gray-700 pb-2">Limit</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr><td className="py-1">AI Generations</td><td>20 requests/minute per user</td></tr>
                                    <tr><td className="py-1">File Uploads</td><td>50 MB per file</td></tr>
                                    <tr><td className="py-1">File Types</td><td>PDF, Word, Excel only</td></tr>
                                    <tr><td className="py-1">Batch Generation</td><td>Subject to rate limits</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-4 text-sm text-gray-600">
                            Rate limits protect against abuse and ensure performance for all users.
                            If you need higher limits, contact us about enterprise plans.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Content Ownership & Responsibility</h2>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>You retain ownership of content you upload</li>
                            <li>You are responsible for ensuring you have rights to uploaded content</li>
                            <li>You are responsible for reviewing and verifying AI-generated content before use</li>
                            <li>AI-generated content may contain errors - final submissions are your responsibility</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Enforcement</h2>
                        <p>Violations of this policy may result in:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li><strong>Warning:</strong> First-time minor violations may receive a warning</li>
                            <li><strong>Temporary Suspension:</strong> Repeated violations or moderate abuse</li>
                            <li><strong>Permanent Ban:</strong> Serious violations or continued abuse after warnings</li>
                            <li><strong>Legal Action:</strong> Criminal activity may be reported to authorities</li>
                        </ul>
                        <p className="mt-4">
                            We reserve the right to suspend or terminate accounts at our discretion to protect our service and other users.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Reporting Violations</h2>
                        <p>If you become aware of any violations of this policy, please report them to:</p>
                        <div className="mt-4 bg-gray-100 rounded-lg p-4">
                            <p><strong>Email:</strong> <a href="mailto:abuse@rfpgrep.com" className="text-indigo-600 hover:underline">abuse@rfpgrep.com</a></p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Changes to This Policy</h2>
                        <p>
                            We may update this policy as needed. Significant changes will be communicated via email or in-app notification.
                            Continued use after changes constitutes acceptance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Contact</h2>
                        <p>For questions about this policy:</p>
                        <div className="mt-4 bg-gray-100 rounded-lg p-4">
                            <p><strong>Email:</strong> <a href="mailto:support@rfpgrep.com" className="text-indigo-600 hover:underline">support@rfpgrep.com</a></p>
                        </div>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6">
                    <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        ← Back to Home
                    </Link>
                    <Link to="/terms" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Terms of Service →
                    </Link>
                </div>
            </div>
        </div>
    );
}
