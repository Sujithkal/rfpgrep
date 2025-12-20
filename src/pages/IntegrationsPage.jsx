import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateApiKey, getApiKeys, revokeApiKey } from '../services/apiKeyService';
import { saveSlackWebhook, saveTeamsWebhook, removeSlackIntegration } from '../services/integrationsService';
import toast from 'react-hot-toast';

export default function IntegrationsPage() {
    const { user, userData } = useAuth();
    const [activeTab, setActiveTab] = useState('api');

    // API Keys
    const [apiKeys, setApiKeys] = useState([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [loadingKeys, setLoadingKeys] = useState(true);
    const [generatingKey, setGeneratingKey] = useState(false);

    // Integrations
    const [slackWebhook, setSlackWebhook] = useState(userData?.integrations?.slack?.webhookUrl || '');
    const [teamsWebhook, setTeamsWebhook] = useState(userData?.integrations?.teams?.webhookUrl || '');
    const [saving, setSaving] = useState(false);

    // Load API keys
    useEffect(() => {
        if (user?.uid) {
            loadApiKeys();
        }
    }, [user]);

    const loadApiKeys = async () => {
        const result = await getApiKeys(user.uid);
        if (result.success) {
            setApiKeys(result.keys);
        }
        setLoadingKeys(false);
    };

    // Generate new API key
    const handleGenerateKey = async () => {
        if (!newKeyName.trim()) {
            toast.error('Please enter a key name');
            return;
        }

        setGeneratingKey(true);
        const result = await generateApiKey(user.uid, newKeyName.trim());

        if (result.success) {
            setApiKeys(prev => [...prev, result.key]);
            setNewKeyName('');
            toast.success('API key generated! Copy it now - it won\'t be shown again.');
        } else {
            toast.error('Failed to generate key');
        }
        setGeneratingKey(false);
    };

    // Revoke API key
    const handleRevokeKey = async (keyId) => {
        if (!confirm('Are you sure you want to revoke this key?')) return;

        const result = await revokeApiKey(user.uid, keyId);
        if (result.success) {
            setApiKeys(prev => prev.filter(k => k.id !== keyId));
            toast.success('API key revoked');
        } else {
            toast.error('Failed to revoke key');
        }
    };

    // Copy to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    // Save Slack webhook
    const handleSaveSlack = async () => {
        if (!slackWebhook.startsWith('https://hooks.slack.com/')) {
            toast.error('Invalid Slack webhook URL');
            return;
        }

        setSaving(true);
        const result = await saveSlackWebhook(user.uid, slackWebhook);
        if (result.success) {
            toast.success('Slack integration saved!');
        } else {
            toast.error('Failed to save');
        }
        setSaving(false);
    };

    // Save Teams webhook
    const handleSaveTeams = async () => {
        if (!teamsWebhook.includes('webhook.office.com')) {
            toast.error('Invalid Teams webhook URL');
            return;
        }

        setSaving(true);
        const result = await saveTeamsWebhook(user.uid, teamsWebhook);
        if (result.success) {
            toast.success('Teams integration saved!');
        } else {
            toast.error('Failed to save');
        }
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/settings" className="text-gray-500 hover:text-gray-700">
                            ← Back to Dashboard
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">
                            🔌 Integrations & API
                        </h1>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto px-6 pt-6">
                <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200 w-fit">
                    <button
                        onClick={() => setActiveTab('api')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'api' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        🔑 API Keys
                    </button>
                    <button
                        onClick={() => setActiveTab('slack')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'slack' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        💬 Slack
                    </button>
                    <button
                        onClick={() => setActiveTab('teams')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'teams' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        👥 Teams
                    </button>
                    <button
                        onClick={() => setActiveTab('crm')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'crm' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        📊 CRM/ERP
                    </button>
                    {userData?.plan === 'enterprise' && (
                        <button
                            onClick={() => setActiveTab('webhooks')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'webhooks' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            🔗 Webhooks
                        </button>
                    )}
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 py-6">
                {/* API Keys Tab */}
                {activeTab === 'api' && (
                    <div className="space-y-6">
                        {/* Create Key */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Generate API Key</h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="Key name (e.g., Production, Testing)"
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    onClick={handleGenerateKey}
                                    disabled={generatingKey}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {generatingKey ? 'Generating...' : 'Generate Key'}
                                </button>
                            </div>
                        </div>

                        {/* Existing Keys */}
                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Your API Keys</h3>

                            {loadingKeys ? (
                                <div className="text-center py-8">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : apiKeys.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No API keys yet. Generate one above.</p>
                            ) : (
                                <div className="space-y-3">
                                    {apiKeys.map(key => (
                                        <div key={key.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <p className="font-medium text-gray-900">{key.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <code className="text-sm bg-gray-200 px-2 py-0.5 rounded font-mono">
                                                        {key.key.substring(0, 12)}...{key.key.substring(key.key.length - 4)}
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard(key.key)}
                                                        className="text-indigo-600 hover:underline text-sm"
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Created: {new Date(key.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeKey(key.id)}
                                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* API Docs Link */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                            <h3 className="font-semibold mb-2">📚 API Documentation</h3>
                            <p className="text-white/80 mb-4">Learn how to use the RFPgrep API to integrate with your systems.</p>
                            <Link to="/api-docs" className="inline-block px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:scale-105 transition-transform">
                                View API Docs →
                            </Link>
                        </div>
                    </div>
                )}

                {/* Slack Tab */}
                {activeTab === 'slack' && (
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[#4A154B] rounded-lg flex items-center justify-center">
                                <span className="text-2xl">💬</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Slack Integration</h3>
                                <p className="text-sm text-gray-500">Get RFP notifications in your Slack channel</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Webhook URL
                                </label>
                                <input
                                    type="url"
                                    value={slackWebhook}
                                    onChange={(e) => setSlackWebhook(e.target.value)}
                                    placeholder="https://hooks.slack.com/services/..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                        How to create a Slack webhook →
                                    </a>
                                </p>
                            </div>

                            <button
                                onClick={handleSaveSlack}
                                disabled={saving || !slackWebhook}
                                className="px-6 py-2.5 bg-[#4A154B] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Slack Integration'}
                            </button>

                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="font-medium text-gray-900 mb-2">Notifications you'll receive:</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>✅ New RFP uploaded</li>
                                    <li>✅ RFP completed</li>
                                    <li>✅ Deadline reminders</li>
                                    <li>✅ Team member invited</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Teams Tab */}
                {activeTab === 'teams' && (
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-[#5558AF] rounded-lg flex items-center justify-center">
                                <span className="text-2xl">👥</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Microsoft Teams Integration</h3>
                                <p className="text-sm text-gray-500">Get RFP notifications in your Teams channel</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Webhook URL
                                </label>
                                <input
                                    type="url"
                                    value={teamsWebhook}
                                    onChange={(e) => setTeamsWebhook(e.target.value)}
                                    placeholder="https://outlook.office.com/webhook/..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    <a href="https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                                        How to create a Teams webhook →
                                    </a>
                                </p>
                            </div>

                            <button
                                onClick={handleSaveTeams}
                                disabled={saving || !teamsWebhook}
                                className="px-6 py-2.5 bg-[#5558AF] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Teams Integration'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Webhooks Tab (Enterprise Only) */}
                {activeTab === 'webhooks' && userData?.plan === 'enterprise' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                            <h3 className="text-xl font-bold mb-2">🔗 Custom Webhooks</h3>
                            <p className="text-white/80">
                                Receive real-time notifications about RFP events in your systems.
                            </p>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Available Events</h3>
                            <div className="grid md:grid-cols-2 gap-3">
                                {[
                                    { event: 'project.created', label: 'Project Created', icon: '📁' },
                                    { event: 'project.completed', label: 'Project Completed', icon: '✅' },
                                    { event: 'project.exported', label: 'Project Exported', icon: '📤' },
                                    { event: 'answer.approved', label: 'Answer Approved', icon: '👍' },
                                    { event: 'team.invited', label: 'Team Member Invited', icon: '👥' },
                                    { event: 'deadline.approaching', label: 'Deadline Approaching', icon: '⏰' },
                                    { event: 'decision.made', label: 'Go/No-Go Decision', icon: '🎯' },
                                ].map((item) => (
                                    <div key={item.event} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="text-xl">{item.icon}</span>
                                        <div>
                                            <p className="font-medium text-gray-900">{item.label}</p>
                                            <code className="text-xs text-gray-500">{item.event}</code>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Configure Webhook</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Webhook URL
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://your-server.com/webhook"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Secret Token (optional)
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Your secret token for signature verification"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                                    Save Webhook Configuration
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-100 rounded-xl p-6 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">📚 Webhook Documentation</h4>
                            <p className="text-gray-600 text-sm mb-4">
                                Each webhook payload includes event type, timestamp, and relevant data.
                                Signatures are sent via <code className="bg-gray-200 px-1 rounded">X-RFPgrep-Signature</code> header.
                            </p>
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                                {`{
  "event": "project.completed",
  "timestamp": "2024-12-18T19:00:00Z",
  "data": {
    "projectId": "abc123",
    "projectName": "Enterprise RFP",
    "completedAt": "2024-12-18T19:00:00Z"
  }
}`}
                            </pre>
                        </div>
                    </div>
                )}

                {/* CRM/ERP Tab */}
                {activeTab === 'crm' && (
                    <div className="space-y-6">
                        {/* CSV Export - Main Feature */}
                        <div className="bg-white rounded-xl p-8 border border-gray-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
                                    📊
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900">Export to Any CRM</h3>
                                    <p className="text-gray-500 text-sm">Universal CSV format compatible with all CRM systems</p>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Download all your RFP data as a CSV file that can be imported into Salesforce, HubSpot, Pipedrive, Zoho, Microsoft Dynamics, or any other CRM/ERP system.
                            </p>

                            <div className="flex flex-wrap gap-3 mb-6">
                                {['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM', 'Dynamics 365', 'SAP'].map(crm => (
                                    <span key={crm} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                        ✓ {crm}
                                    </span>
                                ))}
                            </div>

                            <button
                                onClick={async () => {
                                    const { downloadCRMCSV } = await import('../services/crmExportService');
                                    const { getProjects } = await import('../services/projectService');
                                    const projects = await getProjects(user.uid);
                                    downloadCRMCSV(projects, `rfpgrep_export_${new Date().toISOString().split('T')[0]}.csv`);
                                    toast.success('CSV exported successfully!');
                                }}
                                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-lg"
                            >
                                📥 Export All RFPs to CSV
                            </button>
                        </div>

                        {/* What's Included */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">📋 Export Includes:</h4>
                            <div className="grid md:grid-cols-2 gap-3">
                                {[
                                    'Project name & description',
                                    'All questions & answers',
                                    'AI confidence scores',
                                    'Completion status',
                                    'Due dates',
                                    'Win/Loss outcome',
                                    'Created & updated dates',
                                    'Section breakdowns'
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <span className="text-green-500">✓</span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Enterprise Note */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🔗 Need Direct API Integration?</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                                Enterprise customers can get custom API integrations with automatic sync to your CRM/ERP.
                            </p>
                            <Link to="/pricing" className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300">
                                View Enterprise Plan →
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
