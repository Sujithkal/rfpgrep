/**
 * Compliance Service
 * Handles compliance checklist and requirements tracking
 */

/**
 * Compliance requirements by standard
 */
export const COMPLIANCE_STANDARDS = {
    SOC2: {
        id: 'soc2',
        name: 'SOC 2 Aligned',
        icon: '🔐',
        description: 'Security practices aligned with SOC 2 standards',
        requirements: [
            { id: 'soc2_1', name: 'Access Controls', description: 'Logical and physical access controls', met: true },
            { id: 'soc2_2', name: 'System Operations', description: 'Secure system operations and monitoring', met: true },
            { id: 'soc2_3', name: 'Change Management', description: 'Controlled change management process', met: true },
            { id: 'soc2_4', name: 'Risk Mitigation', description: 'Risk assessment and mitigation', met: true },
            { id: 'soc2_5', name: 'Data Protection', description: 'Data encryption and protection', met: true }
        ]
    },
    ISO27001: {
        id: 'iso27001',
        name: 'ISO 27001 Aligned',
        icon: '🛡️',
        description: 'Security practices aligned with ISO 27001 framework',
        requirements: [
            { id: 'iso_1', name: 'Security Policy', description: 'Information security policies', met: true },
            { id: 'iso_2', name: 'Asset Management', description: 'Asset inventory and classification', met: true },
            { id: 'iso_3', name: 'Access Control', description: 'User access management', met: true },
            { id: 'iso_4', name: 'Cryptography', description: 'Encryption controls', met: true },
            { id: 'iso_5', name: 'Incident Management', description: 'Security incident handling', met: true }
        ]
    },
    GDPR: {
        id: 'gdpr',
        name: 'GDPR',
        icon: '🇪🇺',
        description: 'General Data Protection Regulation',
        requirements: [
            { id: 'gdpr_1', name: 'Consent Management', description: 'User consent for data processing', met: true },
            { id: 'gdpr_2', name: 'Data Portability', description: 'Export user data on request', met: true },
            { id: 'gdpr_3', name: 'Right to Erasure', description: 'Delete user data on request', met: true },
            { id: 'gdpr_4', name: 'Privacy by Design', description: 'Built-in privacy controls', met: true },
            { id: 'gdpr_5', name: 'DPO Appointed', description: 'Data Protection Officer', met: false }
        ]
    },
    HIPAA: {
        id: 'hipaa',
        name: 'HIPAA',
        icon: '🏥',
        description: 'Health Insurance Portability',
        requirements: [
            { id: 'hipaa_1', name: 'PHI Protection', description: 'Protected Health Information safeguards', met: false },
            { id: 'hipaa_2', name: 'Access Audit', description: 'Audit trails for PHI access', met: true },
            { id: 'hipaa_3', name: 'Business Associates', description: 'BAA agreements in place', met: false },
            { id: 'hipaa_4', name: 'Breach Notification', description: 'Breach notification procedures', met: true },
            { id: 'hipaa_5', name: 'Employee Training', description: 'Security awareness training', met: true }
        ]
    }
};

/**
 * Get compliance status summary
 */
export const getComplianceStatus = (standardId) => {
    const standard = COMPLIANCE_STANDARDS[standardId.toUpperCase()];
    if (!standard) return null;

    const total = standard.requirements.length;
    const met = standard.requirements.filter(r => r.met).length;
    const percentage = Math.round((met / total) * 100);

    return {
        ...standard,
        met,
        total,
        percentage,
        status: percentage === 100 ? 'compliant' : percentage >= 80 ? 'mostly' : 'partial'
    };
};

/**
 * Get all compliance statuses
 */
export const getAllComplianceStatuses = () => {
    return Object.keys(COMPLIANCE_STANDARDS).map(key => getComplianceStatus(key));
};

/**
 * Get compliance badge color
 */
export const getComplianceBadgeColor = (status) => {
    const colors = {
        compliant: 'bg-green-100 text-green-700 border-green-200',
        mostly: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        partial: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || colors.partial;
};

/**
 * Generate compliance report data
 */
export const generateComplianceReport = () => {
    const statuses = getAllComplianceStatuses();
    const totalRequirements = statuses.reduce((sum, s) => sum + s.total, 0);
    const metRequirements = statuses.reduce((sum, s) => sum + s.met, 0);

    return {
        generatedAt: new Date().toISOString(),
        summary: {
            totalStandards: statuses.length,
            totalRequirements,
            metRequirements,
            overallPercentage: Math.round((metRequirements / totalRequirements) * 100)
        },
        standards: statuses
    };
};
