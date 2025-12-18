/**
 * Gamification Service
 * Handles leaderboards, badges, and achievements
 */

import { db } from './firebase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

/**
 * Available badges
 */
export const BADGES = {
    FIRST_RFP: {
        id: 'first_rfp',
        name: 'First Steps',
        icon: '🎯',
        description: 'Completed your first RFP',
        points: 10
    },
    SPEED_DEMON: {
        id: 'speed_demon',
        name: 'Speed Demon',
        icon: '⚡',
        description: 'Completed an RFP in under 1 hour',
        points: 25
    },
    PERFECT_SCORE: {
        id: 'perfect_score',
        name: 'Perfectionist',
        icon: '💯',
        description: 'All answers scored 90%+ trust score',
        points: 50
    },
    TEAM_PLAYER: {
        id: 'team_player',
        name: 'Team Player',
        icon: '🤝',
        description: 'Invited 3+ team members',
        points: 15
    },
    KNOWLEDGE_GURU: {
        id: 'knowledge_guru',
        name: 'Knowledge Guru',
        icon: '📚',
        description: 'Added 50+ knowledge base entries',
        points: 30
    },
    AI_MASTER: {
        id: 'ai_master',
        name: 'AI Master',
        icon: '🤖',
        description: 'Generated 100+ AI responses',
        points: 20
    },
    WINNING_STREAK: {
        id: 'winning_streak',
        name: 'On Fire',
        icon: '🔥',
        description: 'Won 3 RFPs in a row',
        points: 40
    },
    EARLY_BIRD: {
        id: 'early_bird',
        name: 'Early Bird',
        icon: '🌅',
        description: 'Submitted RFP 3+ days before deadline',
        points: 15
    },
    PERFECTIONIST: {
        id: 'perfectionist',
        name: 'No Errors',
        icon: '✨',
        description: 'RFP with zero AI review issues',
        points: 35
    },
    CENTURION: {
        id: 'centurion',
        name: 'Centurion',
        icon: '🏆',
        description: 'Answered 100+ questions',
        points: 25
    }
};

/**
 * Point values for actions
 */
export const POINT_VALUES = {
    ANSWER_QUESTION: 1,
    GENERATE_AI_RESPONSE: 2,
    APPROVE_ANSWER: 1,
    COMPLETE_RFP: 10,
    WIN_RFP: 25,
    INVITE_MEMBER: 5,
    ADD_KB_ENTRY: 2,
    EXPORT_RFP: 3
};

/**
 * Award points to a user
 */
export const awardPoints = async (userId, action, multiplier = 1) => {
    try {
        const points = (POINT_VALUES[action] || 1) * multiplier;
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            'gamification.totalPoints': increment(points),
            'gamification.lastActivity': serverTimestamp()
        });
        return points;
    } catch (error) {
        console.error('Error awarding points:', error);
        return 0;
    }
};

/**
 * Award a badge to a user
 */
export const awardBadge = async (userId, badgeId) => {
    try {
        const badge = Object.values(BADGES).find(b => b.id === badgeId);
        if (!badge) return null;

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            [`gamification.badges.${badgeId}`]: {
                earnedAt: serverTimestamp(),
                ...badge
            },
            'gamification.totalPoints': increment(badge.points)
        });

        return badge;
    } catch (error) {
        console.error('Error awarding badge:', error);
        return null;
    }
};

/**
 * Check if user has earned a badge
 */
export const hasBadge = (userData, badgeId) => {
    return !!userData?.gamification?.badges?.[badgeId];
};

/**
 * Get user's level based on points
 */
export const getLevel = (points) => {
    if (points >= 1000) return { level: 10, name: 'Legend', icon: '👑', color: 'gold' };
    if (points >= 750) return { level: 9, name: 'Master', icon: '🏆', color: 'purple' };
    if (points >= 500) return { level: 8, name: 'Expert', icon: '⭐', color: 'indigo' };
    if (points >= 350) return { level: 7, name: 'Advanced', icon: '💎', color: 'blue' };
    if (points >= 250) return { level: 6, name: 'Skilled', icon: '🎯', color: 'cyan' };
    if (points >= 175) return { level: 5, name: 'Intermediate', icon: '📈', color: 'green' };
    if (points >= 100) return { level: 4, name: 'Apprentice', icon: '🌟', color: 'lime' };
    if (points >= 50) return { level: 3, name: 'Learner', icon: '📚', color: 'yellow' };
    if (points >= 20) return { level: 2, name: 'Beginner', icon: '🌱', color: 'orange' };
    return { level: 1, name: 'Newcomer', icon: '👋', color: 'gray' };
};

/**
 * Get points needed for next level
 */
export const getPointsToNextLevel = (points) => {
    const thresholds = [20, 50, 100, 175, 250, 350, 500, 750, 1000];
    const next = thresholds.find(t => t > points);
    return next ? next - points : 0;
};

/**
 * Get user's earned badges
 */
export const getUserBadges = (userData) => {
    const badges = userData?.gamification?.badges || {};
    return Object.values(badges);
};

/**
 * Get badges user hasn't earned yet
 */
export const getLockedBadges = (userData) => {
    const earned = Object.keys(userData?.gamification?.badges || {});
    return Object.values(BADGES).filter(b => !earned.includes(b.id));
};

/**
 * Calculate user rank in leaderboard
 * In production, this would query all users and sort
 */
export const getUserRank = (userData, allUsers) => {
    const myPoints = userData?.gamification?.totalPoints || 0;
    const sorted = allUsers
        .map(u => u.gamification?.totalPoints || 0)
        .sort((a, b) => b - a);
    return sorted.indexOf(myPoints) + 1;
};
