/**
 * Auto-Assignment Service
 * Automatically assigns questions to team members
 */

import { db } from './firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Assignment strategies
 */
export const ASSIGNMENT_STRATEGIES = {
    ROUND_ROBIN: {
        id: 'round_robin',
        name: 'Round Robin',
        description: 'Distribute questions evenly among all team members'
    },
    BY_EXPERTISE: {
        id: 'by_expertise',
        name: 'By Expertise',
        description: 'Assign based on member\'s areas of expertise'
    },
    WORKLOAD_BALANCED: {
        id: 'workload_balanced',
        name: 'Workload Balanced',
        description: 'Consider current workload when assigning'
    },
    RANDOM: {
        id: 'random',
        name: 'Random',
        description: 'Randomly distribute questions'
    }
};

/**
 * Expertise categories for matching
 */
export const EXPERTISE_CATEGORIES = [
    { id: 'technical', name: 'Technical', keywords: ['api', 'integration', 'security', 'infrastructure', 'technical'] },
    { id: 'compliance', name: 'Compliance', keywords: ['gdpr', 'hipaa', 'soc', 'compliance', 'security', 'audit'] },
    { id: 'pricing', name: 'Pricing', keywords: ['price', 'cost', 'budget', 'pricing', 'payment', 'fee'] },
    { id: 'support', name: 'Support', keywords: ['support', 'sla', 'service', 'help', 'maintenance'] },
    { id: 'company', name: 'Company Info', keywords: ['company', 'about', 'history', 'team', 'experience'] }
];

/**
 * Detect question category based on keywords
 */
export const detectCategory = (questionText) => {
    const lower = questionText.toLowerCase();

    for (const category of EXPERTISE_CATEGORIES) {
        if (category.keywords.some(kw => lower.includes(kw))) {
            return category.id;
        }
    }

    return 'general';
};

/**
 * Auto-assign questions using round robin
 */
export const assignRoundRobin = (questions, teamMembers) => {
    const assignments = [];
    let currentIndex = 0;

    questions.forEach((question, i) => {
        assignments.push({
            questionIndex: i,
            assignedTo: teamMembers[currentIndex].id,
            assignedName: teamMembers[currentIndex].name,
            strategy: 'round_robin'
        });
        currentIndex = (currentIndex + 1) % teamMembers.length;
    });

    return assignments;
};

/**
 * Auto-assign questions by expertise
 */
export const assignByExpertise = (questions, teamMembers) => {
    const assignments = [];

    // Build expertise map
    const expertiseMap = {};
    teamMembers.forEach(member => {
        (member.expertise || ['general']).forEach(exp => {
            if (!expertiseMap[exp]) expertiseMap[exp] = [];
            expertiseMap[exp].push(member);
        });
    });

    questions.forEach((question, i) => {
        const category = detectCategory(question.question || question.text);
        const experts = expertiseMap[category] || teamMembers;

        // Pick random expert from matching category
        const assignee = experts[Math.floor(Math.random() * experts.length)];

        assignments.push({
            questionIndex: i,
            assignedTo: assignee.id,
            assignedName: assignee.name,
            category,
            strategy: 'by_expertise'
        });
    });

    return assignments;
};

/**
 * Auto-assign with workload balancing
 */
export const assignBalanced = (questions, teamMembers) => {
    const assignments = [];
    const workloads = {};

    // Initialize workloads
    teamMembers.forEach(m => {
        workloads[m.id] = m.currentWorkload || 0;
    });

    questions.forEach((question, i) => {
        // Find member with lowest workload
        const minWorkload = Math.min(...Object.values(workloads));
        const availableMembers = teamMembers.filter(m => workloads[m.id] === minWorkload);
        const assignee = availableMembers[Math.floor(Math.random() * availableMembers.length)];

        assignments.push({
            questionIndex: i,
            assignedTo: assignee.id,
            assignedName: assignee.name,
            strategy: 'workload_balanced'
        });

        workloads[assignee.id]++;
    });

    return assignments;
};

/**
 * Apply assignments to a project
 */
export const applyAssignments = async (userId, projectId, sections, assignments) => {
    try {
        const updatedSections = JSON.parse(JSON.stringify(sections));
        let questionIndex = 0;

        updatedSections.forEach(section => {
            section.questions?.forEach(question => {
                const assignment = assignments.find(a => a.questionIndex === questionIndex);
                if (assignment) {
                    question.assignedTo = assignment.assignedTo;
                    question.assignedName = assignment.assignedName;
                    question.assignedAt = new Date().toISOString();
                }
                questionIndex++;
            });
        });

        const projectRef = doc(db, `users/${userId}/projects`, projectId);
        await updateDoc(projectRef, {
            sections: updatedSections,
            lastAssignedAt: serverTimestamp()
        });

        return updatedSections;
    } catch (error) {
        console.error('Error applying assignments:', error);
        throw error;
    }
};

/**
 * Get assignment summary
 */
export const getAssignmentSummary = (assignments, teamMembers) => {
    const summary = {};

    teamMembers.forEach(m => {
        summary[m.id] = {
            name: m.name,
            count: 0,
            categories: {}
        };
    });

    assignments.forEach(a => {
        if (summary[a.assignedTo]) {
            summary[a.assignedTo].count++;
            if (a.category) {
                summary[a.assignedTo].categories[a.category] =
                    (summary[a.assignedTo].categories[a.category] || 0) + 1;
            }
        }
    });

    return Object.values(summary);
};
