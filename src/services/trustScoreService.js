/**
 * Trust Score Service
 * Calculates trust scores based on answer quality metrics
 */

/**
 * Calculate trust score for an AI-generated response
 * @param {string} response - The AI-generated response text
 * @param {string} question - The original question
 * @param {Array} knowledgeMatches - Matched documents from knowledge base
 * @returns {Object} - { score: number, breakdown: object, color: string }
 */
export const calculateTrustScore = (response, question, knowledgeMatches = []) => {
    const breakdown = {
        lengthScore: 0,
        keywordCoverage: 0,
        sourceScore: 0,
        structureScore: 0,
        specificityScore: 0
    };

    // 1. Length Score (0-20 points)
    // Good responses are typically 100-500 words
    const wordCount = response.split(/\s+/).length;
    if (wordCount < 20) {
        breakdown.lengthScore = 5;
    } else if (wordCount < 50) {
        breakdown.lengthScore = 10;
    } else if (wordCount < 100) {
        breakdown.lengthScore = 15;
    } else if (wordCount <= 500) {
        breakdown.lengthScore = 20;
    } else {
        breakdown.lengthScore = 15; // Too long might be off-topic
    }

    // 2. Keyword Coverage (0-25 points)
    // Check how many question keywords appear in response
    const questionWords = question.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);

    const responseWords = response.toLowerCase();
    const matchedKeywords = questionWords.filter(word => responseWords.includes(word));
    const keywordRatio = questionWords.length > 0
        ? matchedKeywords.length / questionWords.length
        : 0;
    breakdown.keywordCoverage = Math.round(keywordRatio * 25);

    // 3. Source Score (0-25 points)
    // Based on knowledge base matches
    if (knowledgeMatches.length >= 3) {
        breakdown.sourceScore = 25;
    } else if (knowledgeMatches.length >= 2) {
        breakdown.sourceScore = 20;
    } else if (knowledgeMatches.length >= 1) {
        breakdown.sourceScore = 15;
    } else {
        breakdown.sourceScore = 5; // No sources, but AI can still be accurate
    }

    // 4. Structure Score (0-15 points)
    // Check for good formatting and structure
    const hasParagraphs = response.split('\n\n').length > 1;
    const hasBullets = /[•\-\*]/.test(response) || /^\d+\./m.test(response);
    const hasProperSentences = /[.!?]/.test(response);

    breakdown.structureScore = 0;
    if (hasProperSentences) breakdown.structureScore += 5;
    if (hasParagraphs) breakdown.structureScore += 5;
    if (hasBullets) breakdown.structureScore += 5;

    // 5. Specificity Score (0-15 points)
    // Check for specific details like numbers, dates, percentages
    const hasNumbers = /\d+/.test(response);
    const hasPercentages = /%/.test(response);
    const hasMetrics = /\b(years?|months?|days?|hours?|million|thousand|clients?|projects?)\b/i.test(response);
    const hasCompanySpecific = /\b(our|we|company|team|organization)\b/i.test(response);

    breakdown.specificityScore = 0;
    if (hasNumbers) breakdown.specificityScore += 4;
    if (hasPercentages) breakdown.specificityScore += 4;
    if (hasMetrics) breakdown.specificityScore += 4;
    if (hasCompanySpecific) breakdown.specificityScore += 3;

    // Calculate total score
    const totalScore =
        breakdown.lengthScore +
        breakdown.keywordCoverage +
        breakdown.sourceScore +
        breakdown.structureScore +
        breakdown.specificityScore;

    // Determine color based on score
    let color = 'red';
    let label = 'Low';
    if (totalScore >= 75) {
        color = 'green';
        label = 'High';
    } else if (totalScore >= 50) {
        color = 'yellow';
        label = 'Medium';
    }

    return {
        score: Math.min(100, Math.max(0, totalScore)),
        breakdown,
        color,
        label,
        details: {
            wordCount,
            keywordsFound: matchedKeywords.length,
            keywordsTotal: questionWords.length,
            sourcesUsed: knowledgeMatches.length
        }
    };
};

/**
 * Get trust score color class for Tailwind
 * @param {number} score - Trust score 0-100
 * @returns {string} - Tailwind color classes
 */
export const getTrustScoreColor = (score) => {
    if (score >= 75) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
};

/**
 * Get trust score badge for display
 * @param {number} score - Trust score 0-100
 * @returns {Object} - { icon, text, colorClass }
 */
export const getTrustScoreBadge = (score) => {
    if (score >= 75) {
        return {
            icon: '✓',
            text: 'High Confidence',
            colorClass: 'text-green-600 bg-green-100 border-green-200'
        };
    }
    if (score >= 50) {
        return {
            icon: '◐',
            text: 'Review Recommended',
            colorClass: 'text-yellow-600 bg-yellow-100 border-yellow-200'
        };
    }
    return {
        icon: '!',
        text: 'Manual Review Required',
        colorClass: 'text-red-600 bg-red-100 border-red-200'
    };
};
