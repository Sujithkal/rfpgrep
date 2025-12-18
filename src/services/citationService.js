/**
 * Source Citation Service
 * Adds source citations to AI-generated answers
 */

/**
 * Citation types
 */
export const CITATION_TYPES = {
    KNOWLEDGE_BASE: { id: 'kb', icon: '📚', label: 'Knowledge Base' },
    PAST_ANSWER: { id: 'past', icon: '📝', label: 'Past Answer' },
    COMPANY_DOC: { id: 'doc', icon: '📄', label: 'Company Document' },
    EXTERNAL: { id: 'external', icon: '🔗', label: 'External Source' }
};

/**
 * Extract citations from AI response
 * Looks for patterns like [Source: ...] or [Ref: ...]
 */
export const extractCitations = (text) => {
    const citations = [];

    // Pattern for explicit citations
    const citationPatterns = [
        /\[Source:\s*([^\]]+)\]/gi,
        /\[Ref:\s*([^\]]+)\]/gi,
        /\(Source:\s*([^)]+)\)/gi,
        /According to\s+([^,.]+)/gi
    ];

    citationPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            citations.push({
                text: match[1].trim(),
                type: CITATION_TYPES.KNOWLEDGE_BASE,
                position: match.index
            });
        }
    });

    return citations;
};

/**
 * Add citation markers to answer text
 */
export const formatWithCitations = (text, citations) => {
    if (!citations || citations.length === 0) return text;

    let formatted = text;
    citations.forEach((citation, index) => {
        // Add superscript number at citation position
        formatted = formatted.replace(
            `[Source: ${citation.text}]`,
            `<sup>[${index + 1}]</sup>`
        );
    });

    return formatted;
};

/**
 * Generate citation footnotes
 */
export const generateFootnotes = (citations) => {
    return citations.map((citation, index) => ({
        number: index + 1,
        ...citation
    }));
};

/**
 * Match answer to knowledge base entries for auto-citation
 */
export const matchToKnowledgeBase = (answer, knowledgeEntries) => {
    const citations = [];
    const answerLower = answer.toLowerCase();

    knowledgeEntries.forEach(entry => {
        // Check if key phrases from KB entry appear in answer
        const entryContent = (entry.answer || entry.content || '').toLowerCase();
        const entryWords = entryContent.split(/\s+/).filter(w => w.length > 5);

        // Count matching words (threshold: 30% match)
        const matchCount = entryWords.filter(w => answerLower.includes(w)).length;
        const matchPercent = entryWords.length > 0 ? matchCount / entryWords.length : 0;

        if (matchPercent > 0.3) {
            citations.push({
                text: entry.question || entry.title || 'Knowledge Base Entry',
                type: CITATION_TYPES.KNOWLEDGE_BASE,
                sourceId: entry.id,
                confidence: Math.round(matchPercent * 100)
            });
        }
    });

    // Sort by confidence and take top 3
    return citations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);
};

/**
 * Format citation for display
 */
export const formatCitation = (citation) => {
    const type = CITATION_TYPES[citation.type?.id?.toUpperCase()] || CITATION_TYPES.KNOWLEDGE_BASE;

    return {
        ...citation,
        icon: type.icon,
        label: type.label,
        displayText: citation.text?.length > 50
            ? citation.text.substring(0, 47) + '...'
            : citation.text
    };
};

/**
 * Create citation summary
 */
export const citationSummary = (citations) => {
    const summary = {
        total: citations.length,
        byType: {}
    };

    citations.forEach(c => {
        const typeId = c.type?.id || 'kb';
        summary.byType[typeId] = (summary.byType[typeId] || 0) + 1;
    });

    return summary;
};

/**
 * Validate citations (check if sources still exist)
 */
export const validateCitations = async (citations, knowledgeEntries) => {
    const validated = citations.map(citation => {
        if (citation.sourceId) {
            const exists = knowledgeEntries.some(e => e.id === citation.sourceId);
            return { ...citation, valid: exists };
        }
        return { ...citation, valid: true };
    });

    return validated;
};
