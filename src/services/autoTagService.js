/**
 * Auto-Tagging Service
 * Automatically tags documents and questions
 */

/**
 * Predefined tag categories
 */
export const TAG_CATEGORIES = {
    TOPIC: {
        id: 'topic',
        name: 'Topic',
        color: 'blue',
        tags: ['Technical', 'Pricing', 'Legal', 'Support', 'Security', 'Compliance', 'Integration', 'Training']
    },
    PRIORITY: {
        id: 'priority',
        name: 'Priority',
        color: 'red',
        tags: ['Critical', 'High', 'Medium', 'Low']
    },
    STATUS: {
        id: 'status',
        name: 'Status',
        color: 'green',
        tags: ['Needs Info', 'Ready to Answer', 'Needs Review', 'Blocked']
    },
    DEPARTMENT: {
        id: 'department',
        name: 'Department',
        color: 'purple',
        tags: ['Engineering', 'Sales', 'Legal', 'Finance', 'HR', 'Marketing', 'Operations']
    }
};

/**
 * Keyword-based tag mapping
 */
const KEYWORD_TAG_MAP = {
    // Technical
    'api': 'Technical',
    'integration': 'Technical',
    'software': 'Technical',
    'system': 'Technical',
    'infrastructure': 'Technical',
    'architecture': 'Technical',

    // Security
    'security': 'Security',
    'encryption': 'Security',
    'authentication': 'Security',
    'access control': 'Security',
    'vulnerability': 'Security',

    // Compliance
    'compliance': 'Compliance',
    'gdpr': 'Compliance',
    'hipaa': 'Compliance',
    'soc': 'Compliance',
    'iso': 'Compliance',
    'audit': 'Compliance',

    // Pricing
    'price': 'Pricing',
    'cost': 'Pricing',
    'fee': 'Pricing',
    'budget': 'Pricing',
    'payment': 'Pricing',
    'license': 'Pricing',

    // Support
    'support': 'Support',
    'sla': 'Support',
    'maintenance': 'Support',
    'help': 'Support',
    'training': 'Training',

    // Legal
    'contract': 'Legal',
    'terms': 'Legal',
    'liability': 'Legal',
    'warranty': 'Legal',
    'indemnification': 'Legal'
};

/**
 * Auto-tag a question based on content (keyword-based, no AI needed)
 */
export const autoTagQuestion = (questionText) => {
    const tags = new Set();
    const lower = questionText.toLowerCase();

    // Match keywords
    Object.entries(KEYWORD_TAG_MAP).forEach(([keyword, tag]) => {
        if (lower.includes(keyword)) {
            tags.add(tag);
        }
    });

    // Detect priority based on language
    if (lower.includes('critical') || lower.includes('mandatory') || lower.includes('must have')) {
        tags.add('Critical');
    } else if (lower.includes('important') || lower.includes('required')) {
        tags.add('High');
    }

    // Default tag if none found
    if (tags.size === 0) {
        tags.add('General');
    }

    return Array.from(tags);
};

/**
 * Tag all questions in a project
 */
export const tagProject = (sections) => {
    const taggedSections = JSON.parse(JSON.stringify(sections));

    for (const section of taggedSections) {
        for (const question of section.questions || []) {
            const tags = autoTagQuestion(question.question || question.text || '');
            question.tags = tags;
        }
    }

    return taggedSections;
};

/**
 * Get tag color
 */
export const getTagColor = (tag) => {
    for (const category of Object.values(TAG_CATEGORIES)) {
        if (category.tags.includes(tag)) {
            return category.color;
        }
    }
    return 'gray';
};

/**
 * Get tag statistics for a project
 */
export const getTagStats = (sections) => {
    const stats = {};

    sections?.forEach(section => {
        section.questions?.forEach(question => {
            (question.tags || []).forEach(tag => {
                stats[tag] = (stats[tag] || 0) + 1;
            });
        });
    });

    return Object.entries(stats)
        .map(([tag, count]) => ({ tag, count, color: getTagColor(tag) }))
        .sort((a, b) => b.count - a.count);
};
