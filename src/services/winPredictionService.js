// Win Prediction Service
// AI-powered win probability scoring and deal analysis

import { db } from './firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

/**
 * Calculate win probability for a project
 * Uses multiple factors to predict likelihood of winning
 */
export const calculateWinProbability = async (userId, projectId) => {
    try {
        // Get project data
        const projectRef = doc(db, `users/${userId}/projects/${projectId}`);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return { success: false, error: 'Project not found' };
        }

        const project = projectDoc.data();
        const factors = [];
        let totalScore = 0;
        let maxPossible = 0;

        // Factor 1: Response Completion (25 points max)
        const completionScore = calculateCompletionScore(project);
        factors.push({
            name: 'Response Completion',
            score: completionScore.score,
            max: 25,
            details: completionScore.details,
            icon: '📝'
        });
        totalScore += completionScore.score;
        maxPossible += 25;

        // Factor 2: Response Quality (25 points max)
        const qualityScore = calculateQualityScore(project);
        factors.push({
            name: 'Response Quality',
            score: qualityScore.score,
            max: 25,
            details: qualityScore.details,
            icon: '⭐'
        });
        totalScore += qualityScore.score;
        maxPossible += 25;

        // Factor 3: Time to Deadline (15 points max)
        const timeScore = calculateTimeScore(project);
        factors.push({
            name: 'Time Management',
            score: timeScore.score,
            max: 15,
            details: timeScore.details,
            icon: '⏰'
        });
        totalScore += timeScore.score;
        maxPossible += 15;

        // Factor 4: Team Collaboration (15 points max)
        const teamScore = calculateTeamScore(project);
        factors.push({
            name: 'Team Collaboration',
            score: teamScore.score,
            max: 15,
            details: teamScore.details,
            icon: '👥'
        });
        totalScore += teamScore.score;
        maxPossible += 15;

        // Factor 5: Historical Win Rate (20 points max)
        const historyScore = await calculateHistoricalScore(userId);
        factors.push({
            name: 'Historical Performance',
            score: historyScore.score,
            max: 20,
            details: historyScore.details,
            icon: '📊'
        });
        totalScore += historyScore.score;
        maxPossible += 20;

        // Calculate final probability
        const probability = Math.round((totalScore / maxPossible) * 100);

        // Determine risk level
        const riskLevel = probability >= 70 ? 'low' : probability >= 40 ? 'medium' : 'high';

        // Store result
        await updateDoc(projectRef, {
            winProbability: {
                score: probability,
                factors: factors,
                riskLevel: riskLevel,
                calculatedAt: new Date().toISOString()
            }
        });

        return {
            success: true,
            probability,
            riskLevel,
            factors,
            recommendations: generateRecommendations(factors)
        };
    } catch (error) {
        console.error('[WinPrediction] Calculate error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Calculate completion score based on answered questions
 */
function calculateCompletionScore(project) {
    const stats = project.stats || {};
    const total = stats.totalQuestions || 0;
    const answered = stats.answered || 0;

    if (total === 0) {
        return { score: 0, details: 'No questions extracted yet' };
    }

    const percentage = (answered / total) * 100;
    const score = Math.round((percentage / 100) * 25);

    return {
        score,
        details: `${answered}/${total} questions answered (${Math.round(percentage)}%)`
    };
}

/**
 * Calculate quality score based on response characteristics
 */
function calculateQualityScore(project) {
    let totalLength = 0;
    let responsesWithSubstance = 0;
    let approvedCount = 0;
    let totalResponses = 0;

    (project.sections || []).forEach(section => {
        (section.questions || []).forEach(q => {
            if (q.response) {
                totalResponses++;
                totalLength += q.response.length;
                if (q.response.length > 100) responsesWithSubstance++;
                if (q.status === 'approved') approvedCount++;
            }
        });
    });

    if (totalResponses === 0) {
        return { score: 0, details: 'No responses yet' };
    }

    const avgLength = totalLength / totalResponses;
    const substanceRate = (responsesWithSubstance / totalResponses) * 100;
    const approvalRate = (approvedCount / totalResponses) * 100;

    // Score based on substance and approvals
    let score = 0;
    if (avgLength > 200) score += 10;
    else if (avgLength > 100) score += 5;

    score += Math.round((substanceRate / 100) * 8);
    score += Math.round((approvalRate / 100) * 7);

    return {
        score: Math.min(score, 25),
        details: `Avg ${Math.round(avgLength)} chars, ${Math.round(substanceRate)}% substantial, ${Math.round(approvalRate)}% approved`
    };
}

/**
 * Calculate time management score based on deadline
 */
function calculateTimeScore(project) {
    const deadline = project.deadline;

    if (!deadline) {
        return { score: 10, details: 'No deadline set (neutral score)' };
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const daysRemaining = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        return { score: 0, details: 'Deadline passed' };
    } else if (daysRemaining <= 2) {
        return { score: 5, details: `${daysRemaining} days left - at risk` };
    } else if (daysRemaining <= 7) {
        return { score: 10, details: `${daysRemaining} days left - on track` };
    } else {
        return { score: 15, details: `${daysRemaining} days remaining - good buffer` };
    }
}

/**
 * Calculate team collaboration score
 */
function calculateTeamScore(project) {
    let assignedCount = 0;
    let multipleContributors = new Set();

    (project.sections || []).forEach(section => {
        (section.questions || []).forEach(q => {
            if (q.assignedTo) assignedCount++;
            if (q.updatedBy) multipleContributors.add(q.updatedBy);
        });
    });

    const totalQuestions = project.stats?.totalQuestions || 0;
    const assignmentRate = totalQuestions > 0 ? (assignedCount / totalQuestions) * 100 : 0;
    const contributors = multipleContributors.size;

    let score = 0;
    if (assignmentRate > 50) score += 7;
    else if (assignmentRate > 20) score += 4;

    if (contributors > 2) score += 8;
    else if (contributors > 0) score += 4;

    return {
        score: Math.min(score, 15),
        details: `${assignedCount} assigned, ${contributors} contributors`
    };
}

/**
 * Calculate historical performance score
 */
async function calculateHistoricalScore(userId) {
    try {
        const projectsRef = collection(db, `users/${userId}/projects`);
        const snapshot = await getDocs(projectsRef);

        let wonCount = 0;
        let lostCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.outcome === 'won') wonCount++;
            if (data.outcome === 'lost') lostCount++;
        });

        const total = wonCount + lostCount;

        if (total === 0) {
            return { score: 10, details: 'No historical data yet (neutral score)' };
        }

        const winRate = (wonCount / total) * 100;
        const score = Math.round((winRate / 100) * 20);

        return {
            score,
            details: `${wonCount} wins, ${lostCount} losses (${Math.round(winRate)}% win rate)`
        };
    } catch (error) {
        return { score: 10, details: 'Unable to calculate history' };
    }
}

/**
 * Generate improvement recommendations based on factors
 */
function generateRecommendations(factors) {
    const recommendations = [];

    factors.forEach(factor => {
        const percentage = (factor.score / factor.max) * 100;

        if (percentage < 50) {
            switch (factor.name) {
                case 'Response Completion':
                    recommendations.push({
                        icon: '📝',
                        title: 'Complete More Responses',
                        description: 'Answer remaining questions to improve your submission quality',
                        priority: 'high'
                    });
                    break;
                case 'Response Quality':
                    recommendations.push({
                        icon: '⭐',
                        title: 'Improve Response Quality',
                        description: 'Add more detail to responses and get approvals from reviewers',
                        priority: 'high'
                    });
                    break;
                case 'Time Management':
                    recommendations.push({
                        icon: '⏰',
                        title: 'Watch Your Timeline',
                        description: 'Deadline approaching - prioritize critical sections',
                        priority: 'critical'
                    });
                    break;
                case 'Team Collaboration':
                    recommendations.push({
                        icon: '👥',
                        title: 'Leverage Your Team',
                        description: 'Assign questions to team members for faster completion',
                        priority: 'medium'
                    });
                    break;
                case 'Historical Performance':
                    recommendations.push({
                        icon: '📊',
                        title: 'Build Your Track Record',
                        description: 'Track outcomes to improve predictions over time',
                        priority: 'low'
                    });
                    break;
            }
        }
    });

    return recommendations.sort((a, b) => {
        const priority = { critical: 0, high: 1, medium: 2, low: 3 };
        return priority[a.priority] - priority[b.priority];
    });
}

/**
 * Get win prediction for display
 */
export const getWinPrediction = async (userId, projectId) => {
    try {
        const projectRef = doc(db, `users/${userId}/projects/${projectId}`);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            return null;
        }

        return projectDoc.data().winProbability || null;
    } catch (error) {
        console.error('[WinPrediction] Get error:', error);
        return null;
    }
};

/**
 * Get aggregated win statistics for analytics
 */
export const getWinStatistics = async (userId) => {
    try {
        const projectsRef = collection(db, `users/${userId}/projects`);
        const snapshot = await getDocs(projectsRef);

        let wonCount = 0;
        let lostCount = 0;
        let pendingCount = 0;
        let totalValue = 0;
        const monthlyData = {};

        snapshot.forEach(doc => {
            const data = doc.data();

            if (data.outcome === 'won') {
                wonCount++;
                totalValue += data.contractValue || 0;
            } else if (data.outcome === 'lost') {
                lostCount++;
            } else {
                pendingCount++;
            }

            // Track by month
            const month = data.createdAt?.toDate?.()?.toISOString().slice(0, 7) || 'unknown';
            if (!monthlyData[month]) {
                monthlyData[month] = { won: 0, lost: 0, pending: 0 };
            }
            if (data.outcome === 'won') monthlyData[month].won++;
            else if (data.outcome === 'lost') monthlyData[month].lost++;
            else monthlyData[month].pending++;
        });

        const total = wonCount + lostCount;
        const winRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;

        return {
            success: true,
            stats: {
                wonCount,
                lostCount,
                pendingCount,
                winRate,
                totalValue,
                monthlyData: Object.entries(monthlyData)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .slice(-6)
            }
        };
    } catch (error) {
        console.error('[WinPrediction] Stats error:', error);
        return { success: false, stats: {} };
    }
};

/**
 * Record project outcome
 */
export const recordOutcome = async (userId, projectId, outcome, contractValue = null) => {
    try {
        const projectRef = doc(db, `users/${userId}/projects/${projectId}`);

        await updateDoc(projectRef, {
            outcome,
            contractValue,
            outcomeRecordedAt: new Date().toISOString()
        });

        return { success: true };
    } catch (error) {
        console.error('[WinPrediction] Record error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get probability badge color and text
 */
export const getProbabilityBadge = (probability) => {
    if (probability >= 70) {
        return { color: 'green', text: 'High', icon: '🔥' };
    } else if (probability >= 40) {
        return { color: 'yellow', text: 'Medium', icon: '⚡' };
    } else {
        return { color: 'red', text: 'Low', icon: '⚠️' };
    }
};
