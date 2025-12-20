import { Link } from 'react-router-dom';

export default function PrivacyPage() {
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
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                <p className="text-gray-600 mb-8">Last updated: December 20, 2024</p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                    <p className="text-blue-800 text-sm">
                        <strong>Summary:</strong> We collect minimal data needed to provide our service. Your documents are private and not used to train AI. You can delete your data anytime.
                    </p>
                </div>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li><strong>Account Information:</strong> Name, email address, and password when you register</li>
                            <li><strong>Profile Information:</strong> Company name, role (optional)</li>
                            <li><strong>Documents:</strong> RFP documents and files you upload to our platform</li>
                            <li><strong>Usage Data:</strong> How you interact with our service (pages visited, features used)</li>
                            <li><strong>Payment Information:</strong> Processed securely via Razorpay (we don't store card details)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Provide, maintain, and improve our RFP automation services</li>
                            <li>Process your documents using AI to generate responses</li>
                            <li>Process payments and send transaction confirmations</li>
                            <li>Send technical notices, security alerts, and support messages</li>
                            <li>Respond to your comments, questions, and support requests</li>
                            <li>Analyze usage patterns to improve our service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. AI Processing & Your Data</h2>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
                            <p className="text-green-800">
                                <strong>Important:</strong> Your documents and data are NOT used to train our AI models. Each user's data is completely isolated and private.
                            </p>
                        </div>
                        <p>We use Google's Gemini AI to process your documents. When you upload a document:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Your document is sent to Google's AI API for processing</li>
                            <li>Google processes the document to generate responses</li>
                            <li>Your data is not retained by Google for training purposes</li>
                            <li>AI-generated content may contain errors - always review before submission</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Storage & Security</h2>
                        <p>Your data is stored securely using industry-standard practices:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li><strong>Infrastructure:</strong> Google Firebase and Google Cloud Platform</li>
                            <li><strong>Location:</strong> Data is stored in secure data centers (primarily US)</li>
                            <li><strong>Encryption:</strong> All data is encrypted in transit (TLS) and at rest</li>
                            <li><strong>Access:</strong> Strict access controls limit who can access your data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Cookies & Tracking</h2>
                        <p>We use essential cookies to:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Keep you logged in to your account</li>
                            <li>Remember your preferences</li>
                            <li>Ensure security and prevent fraud</li>
                        </ul>
                        <p className="mt-4">We do NOT use third-party advertising cookies or sell your data to advertisers.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Third-Party Services</h2>
                        <p>We use the following trusted third-party services:</p>
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full border border-gray-200 rounded-lg">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Service</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Purpose</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Privacy Policy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="px-4 py-2 text-sm">Firebase (Google)</td>
                                        <td className="px-4 py-2 text-sm">Authentication, Database</td>
                                        <td className="px-4 py-2 text-sm"><a href="https://firebase.google.com/support/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="px-4 py-2 text-sm">Google Cloud</td>
                                        <td className="px-4 py-2 text-sm">Infrastructure, AI (Gemini)</td>
                                        <td className="px-4 py-2 text-sm"><a href="https://cloud.google.com/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a></td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-sm">Razorpay</td>
                                        <td className="px-4 py-2 text-sm">Payment Processing</td>
                                        <td className="px-4 py-2 text-sm"><a href="https://razorpay.com/privacy/" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">View</a></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Your Rights (GDPR & CCPA)</h2>
                        <p>Depending on your location, you have the following rights:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                            <li><strong>Deletion:</strong> Request deletion of your data ("Right to be Forgotten")</li>
                            <li><strong>Portability:</strong> Request your data in a portable format</li>
                            <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
                            <li><strong>Restriction:</strong> Request restriction of data processing</li>
                        </ul>
                        <p className="mt-4">To exercise any of these rights, email us at <a href="mailto:support@rfpgrep.com" className="text-indigo-600 hover:underline">support@rfpgrep.com</a></p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Data Retention</h2>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>We retain your data for as long as your account is active</li>
                            <li>You can delete your account and data at any time from Settings</li>
                            <li>After account deletion, data is permanently removed within 30 days</li>
                            <li>We may retain anonymized, aggregated data for analytics</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
                        <p>Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Changes to This Policy</h2>
                        <p>We may update this privacy policy from time to time. We will notify you of material changes by:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Posting the new policy on this page</li>
                            <li>Updating the "Last updated" date</li>
                            <li>Sending an email notification for significant changes</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
                        <p>For privacy-related questions or to exercise your rights:</p>
                        <div className="mt-4 bg-gray-100 rounded-lg p-4">
                            <p><strong>Email:</strong> <a href="mailto:support@rfpgrep.com" className="text-indigo-600 hover:underline">support@rfpgrep.com</a></p>
                            <p className="mt-2"><strong>Website:</strong> <a href="https://rfpgrep.com" className="text-indigo-600 hover:underline">rfpgrep.com</a></p>
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
