import { useState } from 'react';

// Default criteria for Go/No-Go evaluation
const DEFAULT_CRITERIA = [
    { id: 'budget', name: 'Budget Fit', description: 'Does the budget align with our pricing?', weight: 1.5 },
    { id: 'timeline', name: 'Timeline Feasibility', description: 'Can we meet the deadline?', weight: 1.2 },
    { id: 'capability', name: 'Technical Capability', description: 'Do we have the required expertise?', weight: 1.5 },
    { id: 'strategic', name: 'Strategic Alignment', description: 'Does this align with our goals?', weight: 1.3 },
    { id: 'resources', name: 'Resource Availability', description: 'Do we have available team members?', weight: 1.2 },
    { id: 'competition', name: 'Competition Level', description: 'How competitive is this opportunity?', weight: 1.0 },
    { id: 'relationship', name: 'Client Relationship', description: 'Existing relationship with client?', weight: 1.1 },
    { id: 'winProbability', name: 'Win Probability', description: 'Realistic chance of winning?', weight: 1.4 }
];

export default function GoNoGoModal({ isOpen, onClose, onDecision, projectName }) {
    const [scores, setScores] = useState(
        DEFAULT_CRITERIA.reduce((acc, c) => ({ ...acc, [c.id]: 3 }), {})
    );
    const [notes, setNotes] = useState('');
    const [decision, setDecision] = useState(null);

    if (!isOpen) return null;

    // Calculate weighted score
    const calculateScore = () => {
        let totalScore = 0;
        let totalWeight = 0;

        DEFAULT_CRITERIA.forEach(criteria => {
            totalScore += scores[criteria.id] * criteria.weight;
            totalWeight += criteria.weight * 5; // Max score per criteria is 5
        });

        return Math.round((totalScore / totalWeight) * 100);
    };

    const overallScore = calculateScore();

    // Get recommendation based on score
    const getRecommendation = () => {
        if (overallScore >= 70) {
            return {
                decision: 'GO',
                color: 'green',
                icon: '✅',
                message: 'Strong opportunity - Recommend pursuing'
            };
        } else if (overallScore >= 50) {
            return {
                decision: 'MAYBE',
                color: 'yellow',
                icon: '⚠️',
                message: 'Moderate opportunity - Consider carefully'
            };
        } else {
            return {
                decision: 'NO-GO',
                color: 'red',
                icon: '❌',
                message: 'Weak opportunity - Not recommended'
            };
        }
    };

    const recommendation = getRecommendation();

    // Handle score change
    const handleScoreChange = (criteriaId, value) => {
        setScores(prev => ({ ...prev, [criteriaId]: parseInt(value) }));
    };

    // Handle final decision
    const handleDecision = (finalDecision) => {
        const result = {
            decision: finalDecision,
            scores,
            overallScore,
            notes,
            recommendation: recommendation.decision,
            decidedAt: new Date().toISOString()
        };

        onDecision(result);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                🎯 Go/No-Go Decision
                            </h2>
                            <p className="text-indigo-200 text-sm">
                                {projectName || 'Evaluate this RFP opportunity'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Score Summary */}
                    <div className={`mb-6 p-4 rounded-xl border-2 ${recommendation.color === 'green' ? 'bg-green-50 border-green-200' :
                            recommendation.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">{recommendation.icon}</span>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {overallScore}%
                                    </div>
                                    <div className={`text-sm font-medium ${recommendation.color === 'green' ? 'text-green-700' :
                                            recommendation.color === 'yellow' ? 'text-yellow-700' :
                                                'text-red-700'
                                        }`}>
                                        {recommendation.message}
                                    </div>
                                </div>
                            </div>
                            <div className={`text-3xl font-bold ${recommendation.color === 'green' ? 'text-green-600' :
                                    recommendation.color === 'yellow' ? 'text-yellow-600' :
                                        'text-red-600'
                                }`}>
                                {recommendation.decision}
                            </div>
                        </div>
                    </div>

                    {/* Criteria Grid */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Evaluation Criteria</h3>

                        {DEFAULT_CRITERIA.map((criteria) => (
                            <div
                                key={criteria.id}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <span className="font-medium text-gray-900">
                                            {criteria.name}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-400">
                                            (Weight: {criteria.weight}x)
                                        </span>
                                    </div>
                                    <span className="text-lg font-bold text-indigo-600">
                                        {scores[criteria.id]}/5
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                    {criteria.description}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-500">Poor</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={scores[criteria.id]}
                                        onChange={(e) => handleScoreChange(criteria.id, e.target.value)}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <span className="text-xs text-green-500">Excellent</span>
                                </div>
                                <div className="flex justify-between mt-1">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => handleScoreChange(criteria.id, n)}
                                            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${scores[criteria.id] === n
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            placeholder="Any additional considerations..."
                        />
                    </div>
                </div>

                {/* Footer - Decision Buttons */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDecision('NO-GO')}
                                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                            >
                                ❌ No-Go
                            </button>
                            <button
                                onClick={() => handleDecision('MAYBE')}
                                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                            >
                                ⚠️ Maybe
                            </button>
                            <button
                                onClick={() => handleDecision('GO')}
                                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                            >
                                ✅ Go
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
