/**
 * AI Review Service
 * Flags weak answers and suggests improvements
 */

/**
 * Quality issues that can be flagged
 */
export const QUALITY_ISSUES = {
    TOO_SHORT: {
        id: 'too_short',
        label: 'Too Short',
        icon: '📏',
        severity: 'warning',
        suggestion: 'Consider adding more detail to fully address the question.'
    },
    TOO_VAGUE: {
        id: 'too_vague',
        label: 'Too Vague',
        icon: '🌫️',
        severity: 'warning',
        suggestion: 'Add specific examples, numbers, or concrete details.'
    },
    MISSING_SPECIFICS: {
        id: 'missing_specifics',
        label: 'Missing Specifics',
        icon: '🔍',
        severity: 'info',
        suggestion: 'Include specific metrics, timelines, or technical details.'
    },
    NO_EXAMPLES: {
        id: 'no_examples',
        label: 'No Examples',
        icon: '📎',
        severity: 'info',
        suggestion: 'Add a relevant case study or example to strengthen the response.'
    },
    WEAK_OPENING: {
        id: 'weak_opening',
        label: 'Weak Opening',
        icon: '🚪',
        severity: 'info',
        suggestion: 'Start with a direct, confident answer to the question.'
    },
    NO_CALL_TO_ACTION: {
        id: 'no_cta',
        label: 'No Next Steps',
        icon: '➡️',
        severity: 'info',
        suggestion: 'Consider ending with a call-to-action or next steps.'
    },
    GRAMMAR_ISSUES: {
        id: 'grammar',
        label: 'Grammar Issues',
        icon: '✏️',
        severity: 'warning',
        suggestion: 'Review for spelling and grammar errors.'
    },
    OFF_TOPIC: {
        id: 'off_topic',
        label: 'May Be Off-Topic',
        icon: '🎯',
        severity: 'error',
        suggestion: 'Ensure the response directly addresses the question asked.'
    }
};

/**
 * Review an answer for quality issues
 * Returns an array of issues found
 */
export const reviewAnswer = (question, answer) => {
    const issues = [];

    if (!answer || answer.trim().length === 0) {
        return [{ ...QUALITY_ISSUES.TOO_SHORT, detail: 'No answer provided' }];
    }

    const words = answer.trim().split(/\s+/).length;
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim()).length;
    const hasNumbers = /\d+/.test(answer);
    const hasPercentages = /%/.test(answer);
    const hasBullets = /[•\-\*]/.test(answer) || answer.includes('\n-');
    const questionWords = question.toLowerCase().split(/\s+/);

    // Check: Too short
    if (words < 20) {
        issues.push({
            ...QUALITY_ISSUES.TOO_SHORT,
            detail: `Only ${words} words. Aim for at least 50-100 words.`
        });
    }

    // Check: Too vague (no numbers or specifics)
    if (words > 20 && !hasNumbers && !hasPercentages) {
        issues.push({
            ...QUALITY_ISSUES.TOO_VAGUE,
            detail: 'No quantifiable data found.'
        });
    }

    // Check: Missing specifics
    const specificWords = ['specifically', 'example', 'for instance', 'such as', 'including'];
    const hasSpecifics = specificWords.some(w => answer.toLowerCase().includes(w));
    if (words > 50 && !hasSpecifics && !hasBullets) {
        issues.push({
            ...QUALITY_ISSUES.MISSING_SPECIFICS,
            detail: 'Consider adding specific examples.'
        });
    }

    // Check: Weak opening (starts with filler words)
    const weakStarts = ['i think', 'we think', 'maybe', 'perhaps', 'possibly', 'i believe'];
    const firstSentence = answer.split(/[.!?]/)[0]?.toLowerCase() || '';
    if (weakStarts.some(w => firstSentence.startsWith(w))) {
        issues.push({
            ...QUALITY_ISSUES.WEAK_OPENING,
            detail: 'Avoid starting with uncertain language.'
        });
    }

    // Check: Off-topic (question keywords not in answer)
    const importantWords = questionWords.filter(w =>
        w.length > 4 && !['what', 'when', 'where', 'which', 'your', 'does', 'have', 'please'].includes(w)
    );
    const answerLower = answer.toLowerCase();
    const matchedWords = importantWords.filter(w => answerLower.includes(w));
    if (importantWords.length > 2 && matchedWords.length < importantWords.length * 0.3) {
        issues.push({
            ...QUALITY_ISSUES.OFF_TOPIC,
            detail: 'Response may not address the question directly.'
        });
    }

    // Check: Simple grammar (very basic)
    const grammarPatterns = [
        /\s{2,}/g,           // Double spaces
        /\bi\s/gi,           // Lowercase "i"
        /[,\.]{2,}/g,        // Multiple punctuation
    ];
    const hasGrammarIssues = grammarPatterns.some(p => p.test(answer));
    if (hasGrammarIssues) {
        issues.push({
            ...QUALITY_ISSUES.GRAMMAR_ISSUES,
            detail: 'Minor formatting or grammar issues detected.'
        });
    }

    return issues;
};

/**
 * Get overall quality score (0-100)
 */
export const getQualityScore = (issues) => {
    if (issues.length === 0) return 100;

    let deductions = 0;
    issues.forEach(issue => {
        switch (issue.severity) {
            case 'error': deductions += 25; break;
            case 'warning': deductions += 15; break;
            case 'info': deductions += 5; break;
        }
    });

    return Math.max(0, 100 - deductions);
};

/**
 * Get quality badge color
 */
export const getQualityBadge = (score) => {
    if (score >= 80) return { color: 'green', label: 'Strong', icon: '✅' };
    if (score >= 60) return { color: 'yellow', label: 'Needs Work', icon: '⚠️' };
    if (score >= 40) return { color: 'orange', label: 'Weak', icon: '🔸' };
    return { color: 'red', label: 'Poor', icon: '❌' };
};

/**
 * Review all answers in a project
 */
export const reviewProject = (sections) => {
    const results = [];

    sections?.forEach((section, sectionIndex) => {
        section.questions?.forEach((question, questionIndex) => {
            if (question.response) {
                const issues = reviewAnswer(question.question, question.response);
                const score = getQualityScore(issues);

                if (issues.length > 0) {
                    results.push({
                        sectionIndex,
                        questionIndex,
                        question: question.question,
                        issues,
                        score,
                        badge: getQualityBadge(score)
                    });
                }
            }
        });
    });

    return results.sort((a, b) => a.score - b.score); // Worst first
};
