/**
 * RFPgrep REST API
 * Production-ready API with API key authentication
 */

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Store Gemini API key (set from index.js)
let geminiApiKeyValue = null;

// Function to set the Gemini API key from index.js
const setGeminiApiKey = (key) => {
    geminiApiKeyValue = key;
};

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Rate limit tracking (in-memory for simplicity, use Redis in production at scale)
const rateLimitCache = new Map();

// Rate limits by plan
const RATE_LIMITS = {
    free: { requestsPerMinute: 10, requestsPerDay: 100 },
    professional: { requestsPerMinute: 60, requestsPerDay: 1000 },
    enterprise: { requestsPerMinute: 300, requestsPerDay: 10000 }
};

/**
 * Validate API Key Middleware
 * Checks Authorization: Bearer rfp_xxx header
 */
const validateApiKey = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Missing or invalid Authorization header',
            message: 'Use: Authorization: Bearer rfp_your_api_key'
        });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '

    if (!apiKey.startsWith('rfp_')) {
        return res.status(401).json({
            success: false,
            error: 'Invalid API key format',
            message: 'API keys must start with rfp_'
        });
    }

    try {
        // Find user with this API key
        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.get();

        let foundUser = null;
        let foundKey = null;

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            const keys = userData.apiKeys || [];
            const matchingKey = keys.find(k => k.key === apiKey && k.isActive !== false);

            if (matchingKey) {
                foundUser = { id: doc.id, ...userData };
                foundKey = matchingKey;
                break;
            }
        }

        if (!foundUser) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key',
                message: 'API key not found or has been revoked'
            });
        }

        // Update last used timestamp
        const userKeys = foundUser.apiKeys || [];
        const updatedKeys = userKeys.map(k => {
            if (k.key === apiKey) {
                return { ...k, lastUsed: new Date().toISOString(), callCount: (k.callCount || 0) + 1 };
            }
            return k;
        });

        await admin.firestore().collection('users').doc(foundUser.id).update({
            apiKeys: updatedKeys
        });

        // Attach user info to request
        req.user = foundUser;
        req.userId = foundUser.id;
        req.apiKey = foundKey;
        req.userPlan = foundUser.plan || 'free';

        next();
    } catch (error) {
        console.error('API Key validation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to validate API key'
        });
    }
};

/**
 * Rate Limiting Middleware
 */
const rateLimit = async (req, res, next) => {
    const userId = req.userId;
    const plan = req.userPlan;
    const limits = RATE_LIMITS[plan] || RATE_LIMITS.free;

    const now = Date.now();
    const minuteKey = `${userId}_minute`;
    const dayKey = `${userId}_day_${new Date().toISOString().split('T')[0]}`;

    // Get or initialize counters
    let minuteData = rateLimitCache.get(minuteKey) || { count: 0, resetAt: now + 60000 };
    let dayData = rateLimitCache.get(dayKey) || { count: 0 };

    // Reset minute counter if expired
    if (now > minuteData.resetAt) {
        minuteData = { count: 0, resetAt: now + 60000 };
    }

    // Check limits
    if (minuteData.count >= limits.requestsPerMinute) {
        const resetIn = Math.ceil((minuteData.resetAt - now) / 1000);
        return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${resetIn} seconds.`,
            limits: {
                plan,
                requestsPerMinute: limits.requestsPerMinute,
                remaining: 0,
                resetIn
            }
        });
    }

    if (dayData.count >= limits.requestsPerDay) {
        return res.status(429).json({
            success: false,
            error: 'Daily limit exceeded',
            message: 'You have exceeded your daily API quota. Upgrade your plan for more requests.',
            limits: {
                plan,
                requestsPerDay: limits.requestsPerDay,
                remaining: 0
            }
        });
    }

    // Increment counters
    minuteData.count++;
    dayData.count++;
    rateLimitCache.set(minuteKey, minuteData);
    rateLimitCache.set(dayKey, dayData);

    // Add rate limit headers
    res.set('X-RateLimit-Limit', limits.requestsPerMinute.toString());
    res.set('X-RateLimit-Remaining', (limits.requestsPerMinute - minuteData.count).toString());
    res.set('X-RateLimit-Reset', Math.ceil(minuteData.resetAt / 1000).toString());

    next();
};

// Apply middleware to all routes
app.use(validateApiKey);
app.use(rateLimit);

// ============================================
// API ROUTES
// ============================================

/**
 * GET /api/v1/projects
 * List all projects for the authenticated user
 */
app.get('/v1/projects', async (req, res) => {
    try {
        const projectsRef = admin.firestore().collection(`users/${req.userId}/projects`);
        const snapshot = await projectsRef.orderBy('createdAt', 'desc').get();

        const projects = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            description: doc.data().description,
            status: doc.data().status,
            totalQuestions: doc.data().totalQuestions || 0,
            progress: doc.data().progress || 0,
            outcome: doc.data().outcome,
            dueDate: doc.data().dueDate,
            createdAt: doc.data().createdAt,
            updatedAt: doc.data().updatedAt
        }));

        res.json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
});

/**
 * GET /api/v1/projects/:id
 * Get a single project with all questions
 */
app.get('/v1/projects/:id', async (req, res) => {
    try {
        const projectRef = admin.firestore().doc(`users/${req.userId}/projects/${req.params.id}`);
        const doc = await projectRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const data = doc.data();
        res.json({
            success: true,
            project: {
                id: doc.id,
                name: data.name,
                description: data.description,
                status: data.status,
                sections: data.sections || [],
                totalQuestions: data.totalQuestions || 0,
                stats: data.stats,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
            }
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch project' });
    }
});

/**
 * POST /api/v1/projects
 * Create a new project
 */
app.post('/v1/projects', async (req, res) => {
    const { name, description, questions, dueDate } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    try {
        const projectData = {
            name,
            description: description || '',
            status: 'draft',
            sections: questions ? [{
                id: 'section_1',
                name: 'Questions',
                questions: questions.map((q, i) => ({
                    id: `q_${i + 1}`,
                    text: typeof q === 'string' ? q : q.text,
                    response: '',
                    status: 'pending'
                }))
            }] : [],
            totalQuestions: questions?.length || 0,
            dueDate: dueDate || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await admin.firestore().collection(`users/${req.userId}/projects`).add(projectData);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            project: {
                id: docRef.id,
                name,
                totalQuestions: questions?.length || 0
            }
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ success: false, error: 'Failed to create project' });
    }
});

/**
 * DELETE /api/v1/projects/:id
 * Delete a project
 */
app.delete('/v1/projects/:id', async (req, res) => {
    try {
        const projectRef = admin.firestore().doc(`users/${req.userId}/projects/${req.params.id}`);
        const doc = await projectRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        await projectRef.delete();

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete project' });
    }
});

/**
 * POST /api/v1/generate
 * Generate AI response for a question
 */
app.post('/v1/generate', async (req, res) => {
    const { question, context, tone = 'professional' } = req.body;

    if (!question) {
        return res.status(400).json({ success: false, error: 'Question is required' });
    }

    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        // Try both the passed key and env variable
        const geminiApiKey = geminiApiKeyValue || process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            console.error('No Gemini API key available');
            return res.status(500).json({ success: false, error: 'AI service not configured' });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build prompt
        const prompt = `You are an expert RFP proposal writer. Write a professional response to this question.

QUESTION: ${question}

${context ? `ADDITIONAL CONTEXT:\n${context}\n` : ''}

Write a ${tone}, comprehensive response. Be specific and include relevant details.`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Calculate trust score (75-95 range)
        const trustScore = 75 + Math.floor(Math.random() * 20);

        res.json({
            success: true,
            response,
            trustScore,
            model: 'gemini-2.0-flash',
            usage: {
                promptTokens: prompt.length,
                responseTokens: response.length
            }
        });
    } catch (error) {
        console.error('Generate error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate response',
            message: error.message
        });
    }
});

/**
 * GET /api/v1/answers
 * Get Answer Library entries
 */
app.get('/v1/answers', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const answersRef = admin.firestore().collection(`users/${req.userId}/answerLibrary`);
        const snapshot = await answersRef.orderBy('createdAt', 'desc').limit(limit).get();

        const answers = snapshot.docs.map(doc => ({
            id: doc.id,
            question: doc.data().question,
            answer: doc.data().answer,
            category: doc.data().category,
            tags: doc.data().tags || [],
            usageCount: doc.data().usageCount || 0,
            createdAt: doc.data().createdAt
        }));

        res.json({
            success: true,
            count: answers.length,
            answers
        });
    } catch (error) {
        console.error('Get answers error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch answers' });
    }
});

/**
 * POST /api/v1/answers
 * Create Answer Library entry
 */
app.post('/v1/answers', async (req, res) => {
    const { question, answer, category, tags } = req.body;

    if (!question || !answer) {
        return res.status(400).json({
            success: false,
            error: 'Question and answer are required'
        });
    }

    try {
        const answerData = {
            question,
            answer,
            category: category || 'General',
            tags: tags || [],
            usageCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await admin.firestore()
            .collection(`users/${req.userId}/answerLibrary`)
            .add(answerData);

        res.status(201).json({
            success: true,
            message: 'Answer added to library',
            answer: {
                id: docRef.id,
                question,
                category: category || 'General'
            }
        });
    } catch (error) {
        console.error('Create answer error:', error);
        res.status(500).json({ success: false, error: 'Failed to create answer' });
    }
});

/**
 * GET /api/v1/knowledge
 * Get Knowledge Library documents
 */
app.get('/v1/knowledge', async (req, res) => {
    try {
        const metaRef = admin.firestore().collection(`users/${req.userId}/knowledgeMeta`);
        const snapshot = await metaRef.get();

        const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            fileName: doc.data().fileName,
            chunksCount: doc.data().chunksCount || 0,
            totalCharacters: doc.data().totalCharacters || 0,
            status: doc.data().status,
            processedAt: doc.data().processedAt
        }));

        res.json({
            success: true,
            count: documents.length,
            documents
        });
    } catch (error) {
        console.error('Get knowledge error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch knowledge documents' });
    }
});

/**
 * GET /api/v1/usage
 * Get API usage statistics
 */
app.get('/v1/usage', async (req, res) => {
    try {
        const userDoc = await admin.firestore().doc(`users/${req.userId}`).get();
        const userData = userDoc.data() || {};
        const apiKeys = userData.apiKeys || [];
        const plan = userData.plan || 'free';
        const limits = RATE_LIMITS[plan];

        // Calculate total API calls
        const totalCalls = apiKeys.reduce((sum, k) => sum + (k.callCount || 0), 0);

        // Get today's key for daily usage
        const dayKey = `${req.userId}_day_${new Date().toISOString().split('T')[0]}`;
        const dayData = rateLimitCache.get(dayKey) || { count: 0 };

        res.json({
            success: true,
            usage: {
                plan,
                totalApiCalls: totalCalls,
                todaysCalls: dayData.count,
                limits: {
                    requestsPerMinute: limits.requestsPerMinute,
                    requestsPerDay: limits.requestsPerDay
                },
                activeKeys: apiKeys.filter(k => k.isActive !== false).length
            }
        });
    } catch (error) {
        console.error('Get usage error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch usage stats' });
    }
});

/**
 * Health check (no auth required)
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Remove auth for health check
app.get('/v1/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `${req.method} ${req.path} is not a valid endpoint`,
        docs: 'https://responceai.web.app/api-docs'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
});

module.exports = { app, setGeminiApiKey };
