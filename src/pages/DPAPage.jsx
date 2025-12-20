import { Link } from 'react-router-dom';

export default function DPAPage() {
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
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Data Processing Addendum</h1>
                <p className="text-gray-600 mb-8">Last updated: December 20, 2024</p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                    <p className="text-blue-800 text-sm">
                        <strong>For B2B Customers:</strong> This Data Processing Addendum ("DPA") forms part of your agreement with RFPgrep
                        and governs the processing of personal data on your behalf.
                    </p>
                </div>

                <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Definitions</h2>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li><strong>"Customer"</strong> means the organization using RFPgrep services</li>
                            <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable individual</li>
                            <li><strong>"Processing"</strong> means any operation performed on Personal Data</li>
                            <li><strong>"Sub-processor"</strong> means a third party engaged by us to process Personal Data</li>
                            <li><strong>"Data Controller"</strong> means the Customer who determines the purposes of processing</li>
                            <li><strong>"Data Processor"</strong> means RFPgrep, processing data on behalf of the Customer</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Scope of Processing</h2>
                        <p>RFPgrep processes the following types of data on your behalf:</p>
                        <div className="bg-gray-100 rounded-lg p-4 mt-4">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left text-sm font-semibold text-gray-700 pb-2 border-b">Data Type</th>
                                        <th className="text-left text-sm font-semibold text-gray-700 pb-2 border-b">Purpose</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="border-b"><td className="py-2">User account data</td><td>Authentication, account management</td></tr>
                                    <tr className="border-b"><td className="py-2">Uploaded documents (RFPs)</td><td>Question extraction, AI response generation</td></tr>
                                    <tr className="border-b"><td className="py-2">Generated responses</td><td>Storage, export, collaboration</td></tr>
                                    <tr><td className="py-2">Usage analytics</td><td>Service improvement, support</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Our Obligations</h2>
                        <p>As your Data Processor, we commit to:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Process Personal Data only on your documented instructions</li>
                            <li>Ensure personnel are bound by confidentiality obligations</li>
                            <li>Implement appropriate technical and organizational security measures</li>
                            <li>Assist you in responding to data subject requests</li>
                            <li>Delete or return Personal Data upon termination of services</li>
                            <li>Make available information necessary to demonstrate compliance</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Sub-processors</h2>
                        <p>We use the following sub-processors to deliver our services:</p>
                        <div className="bg-gray-100 rounded-lg p-4 mt-4 overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left text-sm font-semibold text-gray-700 pb-2 border-b">Sub-processor</th>
                                        <th className="text-left text-sm font-semibold text-gray-700 pb-2 border-b">Purpose</th>
                                        <th className="text-left text-sm font-semibold text-gray-700 pb-2 border-b">Location</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    <tr className="border-b">
                                        <td className="py-2">Google Cloud Platform</td>
                                        <td>Infrastructure, database, storage</td>
                                        <td>USA / Global</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2">Firebase (Google)</td>
                                        <td>Authentication, real-time database</td>
                                        <td>USA / Global</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2">Google Gemini AI</td>
                                        <td>AI response generation</td>
                                        <td>USA</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2">Razorpay</td>
                                        <td>Payment processing</td>
                                        <td>India</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2">Resend</td>
                                        <td>Transactional emails</td>
                                        <td>USA</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-4 text-sm text-gray-600">
                            We will notify you of any changes to sub-processors. You may object to new sub-processors within 30 days.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Security Measures</h2>
                        <p>We implement the following security measures:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li><strong>Encryption:</strong> TLS 1.3 in transit, AES-256 at rest</li>
                            <li><strong>Access Control:</strong> Role-based permissions, authentication required</li>
                            <li><strong>Rate Limiting:</strong> Protection against abuse (20 AI requests/min)</li>
                            <li><strong>Audit Logging:</strong> Security events logged for review</li>
                            <li><strong>Backups:</strong> Daily automated backups with 30-day retention</li>
                            <li><strong>Incident Response:</strong> 48-hour notification for security breaches</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. AI Processing Disclosure</h2>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
                            <p className="text-green-800">
                                <strong>✓ No Training on Your Data:</strong> Your documents and generated content are NOT used to train
                                our AI models or any third-party models. Data is processed only to generate responses for your account.
                            </p>
                        </div>
                        <p>When you use AI features:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Document content is sent to Google's Gemini API for processing</li>
                            <li>Processing occurs in real-time and is not retained by Google for training</li>
                            <li>Generated responses are stored in your account only</li>
                            <li>You can delete all data at any time from Settings</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Data Subject Rights</h2>
                        <p>We support your obligations to respond to data subject requests including:</p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Right of access</li>
                            <li>Right to rectification</li>
                            <li>Right to erasure ("right to be forgotten")</li>
                            <li>Right to data portability</li>
                            <li>Right to restriction of processing</li>
                        </ul>
                        <p className="mt-4">
                            Contact us at <a href="mailto:privacy@rfpgrep.com" className="text-indigo-600 hover:underline">privacy@rfpgrep.com</a> to
                            request assistance with data subject requests.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Data Retention & Deletion</h2>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Your data is retained while your account is active</li>
                            <li>Upon account deletion, data is permanently removed within 30 days</li>
                            <li>Anonymized, aggregated analytics may be retained indefinitely</li>
                            <li>You can export your data at any time before deletion</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. International Transfers</h2>
                        <p>
                            Your data may be processed in the United States and other countries where our sub-processors operate.
                            We ensure appropriate safeguards are in place, including:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-2">
                            <li>Standard Contractual Clauses (SCCs) where required</li>
                            <li>Sub-processors certified under recognized frameworks</li>
                            <li>Google Cloud's commitment to data protection</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Contact</h2>
                        <p>For DPA-related inquiries:</p>
                        <div className="mt-4 bg-gray-100 rounded-lg p-4">
                            <p><strong>Privacy Contact:</strong> <a href="mailto:privacy@rfpgrep.com" className="text-indigo-600 hover:underline">privacy@rfpgrep.com</a></p>
                            <p className="mt-2"><strong>Security Contact:</strong> <a href="mailto:security@rfpgrep.com" className="text-indigo-600 hover:underline">security@rfpgrep.com</a></p>
                        </div>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6 flex-wrap">
                    <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        ← Back to Home
                    </Link>
                    <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Privacy Policy →
                    </Link>
                    <Link to="/security" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Security →
                    </Link>
                </div>
            </div>
        </div>
    );
}
