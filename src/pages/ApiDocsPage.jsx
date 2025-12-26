import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ApiDocsPage() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('overview');

    const baseUrl = 'https://us-central1-responceai.cloudfunctions.net';

    const endpoints = [
        {
            method: 'GET',
            path: '/apiInfo',
            description: 'API health check and list of available endpoints',
            auth: false,
            response: `{
  "name": "RFPgrep API",
  "version": "1.0.0",
  "status": "operational",
  "endpoints": {
    "/apiInfo": "GET - API health check",
    "/apiGetProjects": "GET - List all projects",
    "/apiGetProject?id=xxx": "GET - Get single project",
    "/apiGenerateAI": "POST - Generate AI response",
    "/apiUpdateResponse": "POST - Update question response"
  },
  "authentication": "Include API key in X-API-Key header"
}`
        },
        {
            method: 'GET',
            path: '/apiGetProjects',
            description: 'List all your RFP projects',
            auth: true,
            response: `{
  "success": true,
  "count": 5,
  "projects": [
    {
      "id": "abc123",
      "name": "Enterprise RFP 2024",
      "client": "Acme Corp",
      "status": "in-progress",
      "deadline": "2024-12-31",
      "stats": {
        "totalQuestions": 25,
        "answered": 20,
        "progress": 80
      },
      "createdAt": "2024-12-20T10:00:00Z",
      "updatedAt": "2024-12-25T15:30:00Z"
    }
  ]
}`
        },
        {
            method: 'GET',
            path: '/apiGetProject?id=PROJECT_ID',
            description: 'Get a single project with all sections and questions',
            auth: true,
            params: [{ name: 'id', type: 'string', description: 'Project ID (required)' }],
            response: `{
  "success": true,
  "project": {
    "id": "abc123",
    "name": "Enterprise RFP 2024",
    "client": "Acme Corp",
    "deadline": "2024-12-31",
    "stats": { "totalQuestions": 25, "answered": 20 },
    "sections": [
      {
        "title": "Security",
        "questionsCount": 5,
        "questions": [
          {
            "text": "What security certifications do you hold?",
            "response": "We maintain SOC 2 Type II...",
            "status": "approved",
            "assignedTo": "john@example.com"
          }
        ]
      }
    ]
  }
}`
        },
        {
            method: 'POST',
            path: '/apiGenerateAI',
            description: 'Generate an AI response for an RFP question',
            auth: true,
            body: `{
  "question": "What security certifications does your company hold?",
  "tone": "professional",
  "knowledgeBase": []
}`,
            response: `{
  "success": true,
  "response": "Our organization maintains SOC 2 Type II certification, ISO 27001, and GDPR compliance...",
  "model": "gemini-2.0-flash",
  "rateLimitRemaining": 58
}`
        },
        {
            method: 'POST',
            path: '/apiUpdateResponse',
            description: 'Update a question response in a project',
            auth: true,
            body: `{
  "projectId": "abc123",
  "sectionIndex": 0,
  "questionIndex": 0,
  "response": "Updated response text here..."
}`,
            response: `{
  "success": true,
  "message": "Response updated successfully"
}`
        }
    ];

    const rateLimits = [
        { plan: 'Free', perMinute: 10, perDay: 100 },
        { plan: 'Professional', perMinute: 60, perDay: 1000 },
        { plan: 'Enterprise', perMinute: 300, perDay: 10000 }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            📚 API Documentation
                        </h1>
                    </div>
                    <a
                        href="/integrations"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Get API Key →
                    </a>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Navigation */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {['overview', 'authentication', 'endpoints', 'rate-limits', 'errors'].map(section => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeSection === section
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ')}
                        </button>
                    ))}
                </div>

                {/* Overview */}
                {activeSection === 'overview' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
                            <h2 className="text-2xl font-bold mb-4">RFPgrep REST API</h2>
                            <p className="text-white/80 mb-6">
                                Integrate RFP automation into your workflows. Create projects, generate AI responses,
                                and manage your knowledge base programmatically.
                            </p>
                            <div className="bg-white/10 rounded-lg p-4 font-mono text-sm">
                                <span className="text-white/60">Base URL:</span> {baseUrl}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Start</h3>
                            <ol className="space-y-3 text-gray-600 dark:text-gray-300">
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                                    <span>Generate an API key from <a href="/integrations" className="text-indigo-600 hover:underline">Integrations</a></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                                    <span>Add your key to the <code className="bg-gray-100 px-1 rounded">X-API-Key</code> header</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                                    <span>Make requests to any endpoint</span>
                                </li>
                            </ol>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Example Request</h3>
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                                {`# List all projects\ncurl "${baseUrl}/apiGetProjects" \\\n  -H "X-API-Key: rfp_your_api_key_here"\n\n# Generate AI response\ncurl -X POST "${baseUrl}/apiGenerateAI" \\\n  -H "X-API-Key: rfp_your_api_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"question": "What security certifications do you hold?", "tone": "professional"}'`}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Authentication */}
                {activeSection === 'authentication' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔐 Authentication</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                All API requests require authentication via an API key. Include your key in the
                                <code className="mx-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">X-API-Key</code> header.
                            </p>

                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Header Format:</p>
                                <code className="text-indigo-600 dark:text-indigo-400 font-mono">
                                    X-API-Key: rfp_xxxxxxxxxxxx
                                </code>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                                <p className="text-blue-800 dark:text-blue-300 text-sm">
                                    💡 <strong>Alternative:</strong> You can also use <code className="bg-blue-100 px-1 rounded">Authorization: Bearer rfp_xxx</code> format.
                                </p>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                                <p className="text-amber-800 dark:text-amber-300 text-sm">
                                    ⚠️ <strong>Keep your API key secret!</strong> Never expose it in client-side code or public repositories.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Getting an API Key</h3>
                            <ol className="space-y-2 text-gray-600 dark:text-gray-300">
                                <li>1. Go to <a href="/integrations" className="text-indigo-600 hover:underline">Settings → Integrations</a></li>
                                <li>2. Click "Generate Key" and enter a name</li>
                                <li>3. Copy the key immediately - it won't be shown again</li>
                                <li>4. Use the key in your API requests</li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* Endpoints */}
                {activeSection === 'endpoints' && (
                    <div className="space-y-6">
                        {endpoints.map((endpoint, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                                        endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                                            endpoint.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {endpoint.method}
                                    </span>
                                    <code className="font-mono text-gray-900 dark:text-white">{endpoint.path}</code>
                                    {endpoint.auth && (
                                        <span className="ml-auto text-xs text-gray-500">🔒 Auth Required</span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">{endpoint.description}</p>

                                    {endpoint.params && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL Parameters:</p>
                                            {endpoint.params.map(param => (
                                                <div key={param.name} className="text-sm text-gray-600 dark:text-gray-400">
                                                    <code className="text-indigo-600">{param.name}</code> ({param.type}) - {param.description}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {endpoint.body && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Request Body:</p>
                                            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
                                                {endpoint.body}
                                            </pre>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Response:</p>
                                        <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
                                            {endpoint.response}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Rate Limits */}
                {activeSection === 'rate-limits' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">⏱️ Rate Limits</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Rate limits are applied per API key. When you exceed your limit, you'll receive a 429 response.
                            </p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-3 px-4 text-gray-900 dark:text-white">Plan</th>
                                            <th className="py-3 px-4 text-gray-900 dark:text-white">Requests/Minute</th>
                                            <th className="py-3 px-4 text-gray-900 dark:text-white">Requests/Day</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rateLimits.map(limit => (
                                            <tr key={limit.plan} className="border-b border-gray-100 dark:border-gray-700">
                                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{limit.plan}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{limit.perMinute}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{limit.perDay.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Rate Limit Headers</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Every response includes headers to help you track your usage:
                            </p>
                            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                                <li><code className="text-indigo-600">X-RateLimit-Limit</code> - Maximum requests per minute</li>
                                <li><code className="text-indigo-600">X-RateLimit-Remaining</code> - Requests remaining this minute</li>
                                <li><code className="text-indigo-600">X-RateLimit-Reset</code> - Unix timestamp when limit resets</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Errors */}
                {activeSection === 'errors' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">❌ Error Handling</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                All errors return a consistent JSON format with helpful messages.
                            </p>

                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm mb-6">
                                {`{
  "success": false,
  "error": "Error type",
  "message": "Human-readable description"
}`}
                            </pre>

                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">HTTP Status Codes</h3>
                            <div className="space-y-3">
                                {[
                                    { code: 200, description: 'Success' },
                                    { code: 201, description: 'Created successfully' },
                                    { code: 400, description: 'Bad request - invalid parameters' },
                                    { code: 401, description: 'Unauthorized - invalid or missing API key' },
                                    { code: 404, description: 'Resource not found' },
                                    { code: 429, description: 'Rate limit exceeded' },
                                    { code: 500, description: 'Internal server error' }
                                ].map(status => (
                                    <div key={status.code} className="flex items-center gap-3">
                                        <span className={`px-2 py-1 text-xs font-mono rounded ${status.code < 300 ? 'bg-green-100 text-green-700' :
                                            status.code < 500 ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {status.code}
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-300">{status.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
