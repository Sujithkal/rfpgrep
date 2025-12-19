/**
 * CRM/ERP Export Service
 * Handles exporting RFP data to external CRM/ERP systems
 */

import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Supported CRM/ERP systems
export const CRM_SYSTEMS = {
    SALESFORCE: {
        id: 'salesforce',
        name: 'Salesforce',
        icon: '☁️',
        description: 'Export opportunities and activities',
        fields: ['name', 'client', 'value', 'stage', 'closeDate', 'notes']
    },
    HUBSPOT: {
        id: 'hubspot',
        name: 'HubSpot',
        icon: '🟠',
        description: 'Sync deals and contacts',
        fields: ['name', 'company', 'amount', 'stage', 'closeDate']
    },
    DYNAMICS: {
        id: 'dynamics',
        name: 'Microsoft Dynamics',
        icon: '🔷',
        description: 'Export to Dynamics 365',
        fields: ['name', 'account', 'revenue', 'probability', 'closeDate']
    },
    PIPEDRIVE: {
        id: 'pipedrive',
        name: 'Pipedrive',
        icon: '🟢',
        description: 'Sync deals and activities',
        fields: ['title', 'organization', 'value', 'stage', 'expectedCloseDate']
    },
    ZOHO: {
        id: 'zoho',
        name: 'Zoho CRM',
        icon: '🔴',
        description: 'Export deals and potentials',
        fields: ['dealName', 'accountName', 'amount', 'stage', 'closingDate']
    },
    SAP: {
        id: 'sap',
        name: 'SAP ERP',
        icon: '🏢',
        description: 'Export to SAP modules',
        fields: ['projectId', 'customer', 'value', 'status', 'targetDate']
    },
    CUSTOM_WEBHOOK: {
        id: 'custom_webhook',
        name: 'Custom Webhook',
        icon: '🔗',
        description: 'Send to any endpoint',
        fields: ['all']
    }
};

/**
 * Map RFP project data to CRM format
 */
const mapToCRMFormat = (project, crmSystem) => {
    const baseData = {
        rfpId: project.id,
        name: project.name,
        client: project.client || 'Unknown',
        status: project.outcome || 'pending',
        createdAt: project.createdAt,
        dueDate: project.dueDate,
        totalQuestions: project.sections?.reduce((sum, s) => sum + (s.questions?.length || 0), 0) || 0,
        completionPercent: calculateCompletion(project),
        exportedAt: new Date().toISOString()
    };

    // Map to specific CRM format
    switch (crmSystem) {
        case 'salesforce':
            return {
                Name: project.name,
                AccountId: project.client,
                StageName: mapOutcomeToStage(project.outcome, 'salesforce'),
                CloseDate: project.dueDate,
                Description: `RFP with ${baseData.totalQuestions} questions. ${baseData.completionPercent}% complete.`,
                RFP_ID__c: project.id
            };
        case 'hubspot':
            return {
                dealname: project.name,
                pipeline: 'default',
                dealstage: mapOutcomeToStage(project.outcome, 'hubspot'),
                closedate: project.dueDate,
                rfp_questions: baseData.totalQuestions,
                rfp_completion: baseData.completionPercent
            };
        case 'dynamics':
            return {
                name: project.name,
                parentaccountid: project.client,
                statuscode: mapOutcomeToStage(project.outcome, 'dynamics'),
                estimatedclosedate: project.dueDate,
                description: `RFP Progress: ${baseData.completionPercent}%`
            };
        default:
            return baseData;
    }
};

/**
 * Map RFP outcome to CRM stage
 */
const mapOutcomeToStage = (outcome, crm) => {
    const stageMapping = {
        salesforce: {
            won: 'Closed Won',
            lost: 'Closed Lost',
            pending: 'Proposal/Price Quote',
            null: 'Qualification'
        },
        hubspot: {
            won: 'closedwon',
            lost: 'closedlost',
            pending: 'decisionmakecontacted',
            null: 'appointmentscheduled'
        },
        dynamics: {
            won: 1,
            lost: 2,
            pending: 3,
            null: 0
        }
    };

    return stageMapping[crm]?.[outcome] || stageMapping[crm]?.null;
};

/**
 * Calculate project completion percentage
 */
const calculateCompletion = (project) => {
    const total = project.sections?.reduce((sum, s) => sum + (s.questions?.length || 0), 0) || 0;
    const answered = project.sections?.reduce((sum, s) =>
        sum + (s.questions?.filter(q => q.answer)?.length || 0), 0) || 0;
    return total > 0 ? Math.round((answered / total) * 100) : 0;
};

/**
 * Queue CRM export (stores in Firestore for Cloud Function processing)
 */
export const queueCRMExport = async (userId, project, crmSystem, credentials = {}) => {
    try {
        const crmData = mapToCRMFormat(project, crmSystem);

        await addDoc(collection(db, 'crmExportQueue'), {
            userId,
            projectId: project.id,
            projectName: project.name,
            crmSystem,
            data: crmData,
            credentials: credentials, // In production, encrypt these
            status: 'pending',
            createdAt: serverTimestamp(),
            attempts: 0
        });

        console.log(`📤 CRM export queued: ${project.name} → ${crmSystem}`);
        return { success: true, crmSystem, data: crmData };
    } catch (error) {
        console.error('Error queuing CRM export:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Export to custom webhook
 */
export const exportToWebhook = async (project, webhookUrl, headers = {}) => {
    try {
        const payload = {
            event: 'rfp_export',
            timestamp: new Date().toISOString(),
            project: {
                id: project.id,
                name: project.name,
                client: project.client,
                status: project.outcome || 'pending',
                dueDate: project.dueDate,
                completion: calculateCompletion(project),
                sections: project.sections?.map(s => ({
                    name: s.name || s.title,
                    questionCount: s.questions?.length || 0,
                    answeredCount: s.questions?.filter(q => q.answer)?.length || 0
                }))
            }
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Error exporting to webhook:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate CSV export for any CRM import
 */
export const generateCRMCSV = (projects) => {
    const headers = ['RFP ID', 'Name', 'Client', 'Status', 'Due Date', 'Questions', 'Completion %', 'Outcome'];

    const rows = projects.map(p => [
        p.id,
        p.name,
        p.client || '',
        p.status || 'draft',
        p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '',
        p.sections?.reduce((sum, s) => sum + (s.questions?.length || 0), 0) || 0,
        calculateCompletion(p),
        p.outcome || 'pending'
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    return csvContent;
};

/**
 * Download CSV file
 */
export const downloadCRMCSV = (projects, filename = 'rfp_export.csv') => {
    const csv = generateCRMCSV(projects);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    return { success: true };
};

export default {
    CRM_SYSTEMS,
    queueCRMExport,
    exportToWebhook,
    generateCRMCSV,
    downloadCRMCSV
};
