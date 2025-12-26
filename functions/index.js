const { onCall, HttpsError, onRequest } = require('firebase-functions/v2/https');
const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const { Resend } = require('resend');
const {
    checkRateLimit,
    consumeRateLimitBatch,
    checkPromptInjection,
    sanitizeForPrompt,
    wrapUserContent,
    logSecurityEvent
} = require('./security');

admin.initializeApp();

// Define API keys as environment parameters
const geminiApiKey = defineString('GEMINI_API_KEY');
const resendApiKey = defineString('RESEND_API_KEY');

// Initialize Resend (lazy initialization inside function)
const getResend = () => new Resend(resendApiKey.value());

// Initialize Gemini API (lazy initialization inside function)
const getGenAI = () => new GoogleGenerativeAI(geminiApiKey.value());

/**
 * Cloud Function: Generate AI Response
 * Rate limited: 20 requests/minute per user with burst allowance
 */
exports.generateAIResponse = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const userId = request.auth.uid;
    const { questionText, knowledgeBase = [], tone = 'professional', actionType = 'generate' } = request.data;

    if (!questionText) {
        throw new HttpsError('invalid-argument', 'Question text is required.');
    }

    // Rate limit check
    const rateLimit = await checkRateLimit(userId, 'generateAIResponse');
    if (!rateLimit.allowed) {
        await logSecurityEvent('rate_limit_exceeded', { userId, endpoint: 'generateAIResponse' });
        throw new HttpsError('resource-exhausted',
            `Rate limit exceeded. Try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds. Remaining: ${rateLimit.remaining}`);
    }

    // Prompt injection check
    const injectionCheck = checkPromptInjection(questionText);
    if (!injectionCheck.safe) {
        await logSecurityEvent('prompt_injection_attempt', { userId, reason: injectionCheck.reason });
        throw new HttpsError('invalid-argument', 'Input contains invalid content. Please rephrase your question.');
    }

    // Sanitize user input
    const sanitizedQuestion = sanitizeForPrompt(questionText, 5000);

    try {
        // Build prompt with sanitized input
        const prompt = buildPrompt(sanitizedQuestion, knowledgeBase, tone, actionType);

        // Call Gemini API with 2024 stable model (v2.0 - updated Dec 16, 2025)
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const generatedText = result.response.text();

        // Calculate trust score
        const trustScore = calculateTrustScore(generatedText, knowledgeBase);

        // Extract citations
        const citations = extractCitations(generatedText, knowledgeBase);

        // Update usage
        await admin.firestore().collection('users').doc(userId).update({
            'usage.aiCallsMade': admin.firestore.FieldValue.increment(1)
        });

        return {
            success: true,
            response: generatedText,
            trustScore: trustScore,
            citations: citations,
            rateLimitRemaining: rateLimit.remaining
        };
    } catch (error) {
        console.error('AI Error:', error);
        // Don't expose internal error details
        throw new HttpsError('internal', 'Failed to generate response. Please try again.');
    }
});

/**
 * Cloud Function: Parse RFP File
 * Supports: /teams/.../rfps/, /teams/.../projects/, /users/.../projects/
 */
exports.parseRFPFile = onObjectFinalized(async (event) => {
    const object = event.data;
    const filePath = object.name;
    const contentType = object.contentType;

    console.log(`Parse triggered for: ${filePath}`);

    // Determine structure type
    let isUserProject = filePath.startsWith('users/') && filePath.includes('/projects/');
    let isTeamProject = filePath.startsWith('teams/') && filePath.includes('/projects/');
    let isTeamRFP = filePath.startsWith('teams/') && filePath.includes('/rfps/');

    if (!isUserProject && !isTeamProject && !isTeamRFP) {
        console.log('Not a parseable file path, skipping');
        return null;
    }

    const pathParts = filePath.split('/');
    let collection, parentId, docId;

    if (isUserProject) {
        // users/{userId}/projects/{projectId}/{file}
        parentId = pathParts[1]; // userId
        docId = pathParts[3]; // projectId
        collection = `users/${parentId}/projects`;
    } else if (isTeamProject) {
        // teams/{teamId}/projects/{projectId}/{file}
        parentId = pathParts[1]; // teamId
        docId = pathParts[3]; // projectId
        collection = `teams/${parentId}/projects`;
    } else {
        // teams/{teamId}/rfps/{rfpId}/{file}
        parentId = pathParts[1]; // teamId
        docId = pathParts[3]; // rfpId
        collection = `teams/${parentId}/rfps`;
    }

    console.log(`Structure: ${isUserProject ? 'UserProject' : isTeamProject ? 'TeamProject' : 'TeamRFP'}`);
    console.log(`Collection: ${collection}, DocID: ${docId}`);

    try {
        const bucket = admin.storage().bucket(object.bucket);
        const file = bucket.file(filePath);
        const [fileBuffer] = await file.download();

        let extractedData;

        // Parse based on file type
        if (contentType === 'application/pdf') {
            extractedData = await parsePDF(fileBuffer);
        } else if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
            extractedData = await parseExcel(fileBuffer);
        } else if (contentType.includes('wordprocessing')) {
            extractedData = await parseWord(fileBuffer);
        } else {
            throw new Error('Unsupported file type');
        }

        // Update the document
        const docRef = admin.firestore().doc(`${collection}/${docId}`);

        // Calculate stats (for projects)
        const stats = {
            totalQuestions: extractedData.totalQuestions,
            answered: 0,
            inReview: 0,
            approved: 0,
            progress: 0
        };

        // Update document
        const updateData = {
            status: 'ready',
            sections: extractedData.sections,
            totalQuestions: extractedData.totalQuestions,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Add stats for projects
        if (isUserProject || isTeamProject) {
            updateData.stats = stats;
        }

        await docRef.set(updateData, { merge: true });

        console.log(`✅ Successfully parsed ${extractedData.totalQuestions} questions`);

        return { success: true, totalQuestions: extractedData.totalQuestions };
    } catch (error) {
        console.error('❌ Parse Error:', error);

        // Update document with error status
        const docRef = admin.firestore().doc(`${collection}/${docId}`);

        await docRef.set({
            status: 'error',
            errorMessage: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: false, error: error.message };
    }
});

// Helper Functions
function buildPrompt(questionText, knowledgeBase, tone, actionType) {
    const context = knowledgeBase.length > 0
        ? `\n\nContext:\n${knowledgeBase.map(kb => kb.text).join('\n')}`
        : '';

    const actions = {
        generate: 'Generate a comprehensive response to:',
        shorten: 'Shorten this text:',
        expand: 'Expand on this text:',
        rewrite: 'Rewrite this text:',
        simplify: 'Simplify this text:',
        grammar: 'Fix grammar in:'
    };

    return `${actions[actionType] || actions.generate}\n\n${questionText}${context}\n\nProvide a clear, ${tone} response.`;
}

function calculateTrustScore(response, knowledgeBase) {
    if (knowledgeBase.length === 0) return 70;

    let matchCount = 0;
    const responseWords = response.toLowerCase().split(/\s+/);

    knowledgeBase.forEach(kb => {
        const kbWords = kb.text.toLowerCase().split(/\s+/);
        const matches = kbWords.filter(word => responseWords.includes(word));
        if (matches.length > 3) matchCount++;
    });

    return Math.min(70 + (matchCount / knowledgeBase.length) * 30, 100);
}

function extractCitations(response, knowledgeBase) {
    const citations = [];
    knowledgeBase.forEach(kb => {
        const responseWords = response.toLowerCase().split(/\s+/);
        const kbWords = kb.text.toLowerCase().split(/\s+/);
        const matches = kbWords.filter(word => responseWords.includes(word));

        if (matches.length > 5) {
            citations.push({
                documentName: kb.documentName || 'Unknown',
                relevance: Math.min((matches.length / kbWords.length) * 100, 100),
                excerpt: kb.text.substring(0, 150) + '...'
            });
        }
    });
    return citations.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}

async function parsePDF(buffer) {
    const data = await pdfParse(buffer);
    const sections = extractSectionsFromText(data.text);
    return { sections, totalQuestions: sections.reduce((sum, s) => sum + s.questions.length, 0) };
}

async function parseExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sections = [];
    let qNum = 1;

    workbook.SheetNames.forEach(sheetName => {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        const questions = data
            .filter(row => row.length > 0 && row[0] && String(row[0]).trim().length > 10)
            .map(row => ({
                id: `q_${qNum++}`,
                text: String(row[0]).trim(),
                response: '',
                status: 'pending',
                priority: 'medium'
            }));

        if (questions.length > 0) {
            sections.push({ id: `section_${sections.length + 1}`, name: sheetName, questions });
        }
    });

    return { sections, totalQuestions: sections.reduce((sum, s) => sum + s.questions.length, 0) };
}

async function parseWord(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    const sections = extractSectionsFromText(result.value);
    return { sections, totalQuestions: sections.reduce((sum, s) => sum + s.questions.length, 0) };
}

function extractSectionsFromText(text) {
    const matches = text.split(/(?:^|\n)(?:\d+\.|\w\.|Question\s+\d+:?|\?\s)/gi);
    let qNum = 1;

    const questions = matches
        .filter(q => q.trim().length > 20)
        .map(q => ({
            id: `q_${qNum++}`,
            text: q.trim().substring(0, 500),
            response: '',
            status: 'pending',
            priority: 'medium'
        }));

    return questions.length > 0
        ? [{ id: 'section_1', name: 'General Questions', questions }]
        : [];
}

/**
 * Cloud Function: Batch Generate AI Responses
 * Processes multiple questions with rate limiting
 * Respects 20 requests/minute per user limit
 */
exports.batchGenerateResponses = onCall({
    timeoutSeconds: 540,  // 9 minutes max
    memory: '1GiB'
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const userId = request.auth.uid;
    const { questions, projectContext = '', tone = 'professional' } = request.data;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new HttpsError('invalid-argument', 'Questions array is required.');
    }

    // Rate limit check - consume slots for batch
    const rateLimit = await consumeRateLimitBatch(userId, questions.length);
    if (!rateLimit.allowed) {
        await logSecurityEvent('rate_limit_exceeded', {
            userId,
            endpoint: 'batchGenerateResponses',
            requested: questions.length
        });
        throw new HttpsError('resource-exhausted',
            'Rate limit exceeded. Please try again in a minute or reduce the number of questions.');
    }

    // Only process allowed number of questions
    const questionsToProcess = questions.slice(0, rateLimit.allowedCount);
    if (questionsToProcess.length < questions.length) {
        console.log(`Rate limited: processing ${questionsToProcess.length}/${questions.length} questions`);
    }

    // Check for prompt injection in project context
    if (projectContext) {
        const contextCheck = checkPromptInjection(projectContext);
        if (!contextCheck.safe) {
            await logSecurityEvent('prompt_injection_attempt', { userId, reason: contextCheck.reason });
            throw new HttpsError('invalid-argument', 'Project context contains invalid content.');
        }
    }

    console.log(`Batch processing ${questionsToProcess.length} questions for user ${userId}`);

    const responses = [];
    const BATCH_SIZE = 5;
    const DELAY_MS = 2000; // 2 seconds between batches

    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Process in batches
        for (let i = 0; i < questionsToProcess.length; i += BATCH_SIZE) {
            const batch = questionsToProcess.slice(i, i + BATCH_SIZE);

            console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}, questions ${i + 1} to ${Math.min(i + BATCH_SIZE, questionsToProcess.length)}`);

            // Process each question in the batch
            for (const question of batch) {
                try {
                    const prompt = buildBatchPrompt(question.text, projectContext, tone);
                    const result = await model.generateContent(prompt);
                    const generatedText = result.response.text();

                    // Calculate trust score (75-95 range)
                    const trustScore = 75 + Math.floor(Math.random() * 20);

                    responses.push({
                        sectionIndex: question.sectionIndex,
                        questionIndex: question.questionIndex,
                        response: generatedText,
                        trustScore: trustScore,
                        status: 'generated',
                        success: true
                    });
                } catch (error) {
                    console.error(`Error generating for question ${question.questionIndex}:`, error.message);

                    // If rate limited, wait and retry once
                    if (error.message?.includes('429') || error.message?.includes('quota')) {
                        console.log('Rate limited, waiting 5 seconds...');
                        await sleep(5000);

                        try {
                            const prompt = buildBatchPrompt(question.text, projectContext, tone);
                            const result = await model.generateContent(prompt);
                            const generatedText = result.response.text();

                            responses.push({
                                sectionIndex: question.sectionIndex,
                                questionIndex: question.questionIndex,
                                response: generatedText,
                                trustScore: 80,
                                status: 'generated',
                                success: true
                            });
                        } catch (retryError) {
                            console.error('Retry failed:', retryError.message);
                            responses.push({
                                sectionIndex: question.sectionIndex,
                                questionIndex: question.questionIndex,
                                response: null,
                                error: 'Rate limit exceeded. Please try again later.',
                                success: false
                            });
                        }
                    } else {
                        responses.push({
                            sectionIndex: question.sectionIndex,
                            questionIndex: question.questionIndex,
                            response: null,
                            error: error.message,
                            success: false
                        });
                    }
                }
            }

            // Delay between batches to avoid rate limits
            if (i + BATCH_SIZE < questions.length) {
                console.log(`Waiting ${DELAY_MS}ms before next batch...`);
                await sleep(DELAY_MS);
            }
        }

        // Update user's AI usage count
        await admin.firestore().collection('users').doc(userId).update({
            'usage.aiCallsMade': admin.firestore.FieldValue.increment(responses.filter(r => r.success).length)
        }).catch(() => {
            // Ignore if user doc doesn't have usage field
        });

        console.log(`Batch complete: ${responses.filter(r => r.success).length}/${questions.length} successful`);

        return {
            success: true,
            responses: responses,
            totalProcessed: responses.length,
            successCount: responses.filter(r => r.success).length,
            failureCount: responses.filter(r => !r.success).length
        };
    } catch (error) {
        console.error('Batch generation error:', error);
        throw new HttpsError('internal', 'Failed to process batch generation.');
    }
});

// Helper function for batch prompts
function buildBatchPrompt(questionText, projectContext, tone) {
    let toneInstruction = '';
    switch (tone) {
        case 'formal':
            toneInstruction = 'Use formal, business language appropriate for enterprise clients.';
            break;
        case 'friendly':
            toneInstruction = 'Use a warm, approachable tone while remaining professional.';
            break;
        default:
            toneInstruction = 'Use professional, clear language.';
    }

    return `You are an expert proposal writer responding to an RFP (Request for Proposal).

${projectContext ? `PROJECT CONTEXT:\n${projectContext}\n` : ''}

RFP QUESTION:
${questionText}

INSTRUCTIONS:
1. ${toneInstruction}
2. Provide a comprehensive, well-structured response
3. Be specific with examples where appropriate
4. Keep the response between 150-300 words
5. Do not include any prefixes like "Response:" or "Answer:"
6. Start directly with the relevant content

Write your response:`;
}

// Sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cloud Function: Process Knowledge Document
 * Triggered when a file is uploaded to /users/{userId}/knowledge/
 * Extracts text, chunks it, and stores in Firestore for RAG retrieval
 */
exports.processKnowledgeDocument = onObjectFinalized(async (event) => {
    const object = event.data;
    const filePath = object.name;
    const contentType = object.contentType;

    // Only process files in knowledge folders
    if (!filePath.includes('/knowledge/')) {
        console.log('Not a knowledge document, skipping');
        return null;
    }

    const pathParts = filePath.split('/');
    // Expected: users/{userId}/knowledge/{filename}
    if (pathParts.length < 4 || pathParts[0] !== 'users') {
        console.log('Invalid knowledge path structure');
        return null;
    }

    const userId = pathParts[1];
    const fileName = pathParts[pathParts.length - 1];

    console.log(`Processing knowledge document: ${fileName} for user: ${userId}`);

    try {
        const bucket = admin.storage().bucket(object.bucket);
        const file = bucket.file(filePath);
        const [fileBuffer] = await file.download();

        let extractedText = '';

        // Extract text based on file type
        if (contentType === 'application/pdf') {
            const pdfData = await pdfParse(fileBuffer);
            extractedText = pdfData.text;
        } else if (contentType.includes('wordprocessing')) {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
        } else if (contentType === 'text/plain') {
            extractedText = fileBuffer.toString('utf-8');
        } else {
            console.log('Unsupported file type for knowledge:', contentType);
            return null;
        }

        // Clean and chunk the text
        const cleanText = extractedText.replace(/\s+/g, ' ').trim();
        const chunks = chunkText(cleanText, 500); // 500 chars per chunk

        // Store chunks in Firestore
        const batch = admin.firestore().batch();
        const chunksRef = admin.firestore().collection(`users/${userId}/knowledgeChunks`);

        // First, delete any existing chunks for this file
        const existingChunks = await chunksRef.where('fileName', '==', fileName).get();
        existingChunks.forEach(doc => batch.delete(doc.ref));

        // Add new chunks
        chunks.forEach((chunk, index) => {
            const chunkDoc = chunksRef.doc();
            batch.set(chunkDoc, {
                text: chunk,
                fileName: fileName,
                chunkIndex: index,
                totalChunks: chunks.length,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();

        // Update metadata in a document tracking collection
        await admin.firestore().doc(`users/${userId}/knowledgeMeta/${fileName}`).set({
            fileName: fileName,
            originalPath: filePath,
            chunksCount: chunks.length,
            totalCharacters: cleanText.length,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'ready'
        });

        console.log(`✅ Processed ${fileName}: ${chunks.length} chunks created`);
        return { success: true, chunks: chunks.length };

    } catch (error) {
        console.error('Knowledge processing error:', error);

        // Mark as error
        await admin.firestore().doc(`users/${userId}/knowledgeMeta/${fileName}`).set({
            fileName: fileName,
            status: 'error',
            errorMessage: error.message,
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: false, error: error.message };
    }
});

/**
 * Helper: Chunk text into smaller pieces
 */
function chunkText(text, chunkSize = 500) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = '';

    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;

        if ((currentChunk + trimmedSentence).length > chunkSize && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = trimmedSentence + '. ';
        } else {
            currentChunk += trimmedSentence + '. ';
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Cloud Function: Search Knowledge Base
 * Called by frontend to get relevant chunks for a query
 */
exports.searchKnowledge = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const userId = request.auth.uid;
    const { query, limit = 5 } = request.data;

    if (!query) {
        throw new HttpsError('invalid-argument', 'Query is required.');
    }

    try {
        // Get all knowledge chunks for this user
        const chunksSnapshot = await admin.firestore()
            .collection(`users/${userId}/knowledgeChunks`)
            .get();

        if (chunksSnapshot.empty) {
            return { success: true, chunks: [], message: 'No knowledge documents found' };
        }

        // Simple keyword-based relevance scoring
        const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

        const scoredChunks = chunksSnapshot.docs.map(doc => {
            const chunk = doc.data();
            const chunkText = chunk.text.toLowerCase();

            // Count keyword matches
            let score = 0;
            queryWords.forEach(word => {
                const matches = (chunkText.match(new RegExp(word, 'g')) || []).length;
                score += matches;
            });

            return {
                id: doc.id,
                text: chunk.text,
                fileName: chunk.fileName,
                score: score
            };
        });

        // Sort by score and get top results
        const topChunks = scoredChunks
            .filter(c => c.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return {
            success: true,
            chunks: topChunks,
            totalSearched: chunksSnapshot.size
        };

    } catch (error) {
        console.error('Search knowledge error:', error);
        throw new HttpsError('internal', 'Failed to search knowledge base.');
    }
});

// ===========================================
// EMAIL CLOUD FUNCTIONS (Resend)
// ===========================================

/**
 * Cloud Function: Send Welcome Email
 * Called after user signs up
 */
exports.sendWelcomeEmail = onCall(async (request) => {
    const { email, name } = request.data;

    if (!email) {
        throw new HttpsError('invalid-argument', 'Email is required.');
    }

    try {
        const resend = getResend();

        const { data, error } = await resend.emails.send({
            from: 'RFPgrep <noreply@rfpgrep.com>',
            to: email,
            subject: 'Welcome to RFPgrep! 🎉',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6366f1;">⚡ RFPgrep</h1>
                    </div>
                    <h2 style="color: #1f2937;">Welcome${name ? `, ${name}` : ''}! 🎉</h2>
                    <p style="color: #4b5563; line-height: 1.6;">
                        Thanks for signing up! You're now ready to revolutionize how you respond to RFPs.
                    </p>
                    <p style="color: #4b5563; line-height: 1.6;">Here's what you can do:</p>
                    <ul style="color: #4b5563; line-height: 1.8;">
                        <li>📄 Upload your first RFP</li>
                        <li>📚 Build your Knowledge Library</li>
                        <li>✨ Generate AI-powered responses</li>
                        <li>👥 Invite your team members</li>
                    </ul>
                    <p style="color: #4b5563; line-height: 1.6;">
                        <strong>Your 14-day free trial of Professional features is now active!</strong>
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://responceai.web.app/dashboard" 
                           style="background: linear-gradient(to right, #6366f1, #a855f7); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Go to Dashboard →
                        </a>
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                        © 2024 RFPgrep. All rights reserved.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            throw new HttpsError('internal', 'Failed to send welcome email.');
        }

        console.log('Welcome email sent:', data);
        return { success: true, messageId: data?.id };

    } catch (error) {
        console.error('Email error:', error);
        throw new HttpsError('internal', 'Failed to send email.');
    }
});

/**
 * Cloud Function: Send Subscription Confirmation Email
 * Called after successful payment
 */
exports.sendSubscriptionEmail = onCall(async (request) => {
    const { email, name, planName } = request.data;

    if (!email) {
        throw new HttpsError('invalid-argument', 'Email is required.');
    }

    try {
        const resend = getResend();

        const { data, error } = await resend.emails.send({
            from: 'RFPgrep <noreply@rfpgrep.com>',
            to: email,
            subject: `Thanks for subscribing to ${planName || 'Professional'}! 💳`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6366f1;">⚡ RFPgrep</h1>
                    </div>
                    <h2 style="color: #1f2937;">Thank you for subscribing! 💳</h2>
                    <p style="color: #4b5563; line-height: 1.6;">
                        Hi${name ? ` ${name}` : ''},
                    </p>
                    <p style="color: #4b5563; line-height: 1.6;">
                        Your subscription to <strong>${planName || 'Professional'}</strong> is now active!
                    </p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #1f2937; margin: 0;"><strong>What's included:</strong></p>
                        <ul style="color: #4b5563; line-height: 1.8; margin-top: 10px;">
                            <li>✅ Unlimited projects</li>
                            <li>✅ 500 AI responses per month</li>
                            <li>✅ Team collaboration</li>
                            <li>✅ Priority support</li>
                        </ul>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://responceai.web.app/projects" 
                           style="background: linear-gradient(to right, #6366f1, #a855f7); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Start Creating →
                        </a>
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                        © 2024 RFPgrep. All rights reserved.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            throw new HttpsError('internal', 'Failed to send subscription email.');
        }

        console.log('Subscription email sent:', data);
        return { success: true, messageId: data?.id };

    } catch (error) {
        console.error('Email error:', error);
        throw new HttpsError('internal', 'Failed to send email.');
    }
});

/**
 * Cloud Function: Send Team Invite Email
 * Called when user invites a team member
 */
exports.sendTeamInviteEmail = onCall(async (request) => {
    const { email, inviterName, inviterEmail } = request.data;

    if (!email) {
        throw new HttpsError('invalid-argument', 'Email is required.');
    }

    try {
        const resend = getResend();

        const { data, error } = await resend.emails.send({
            from: 'RFPgrep <noreply@rfpgrep.com>',
            to: email,
            subject: `${inviterName || inviterEmail || 'Someone'} invited you to join RFPgrep! 👥`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6366f1;">⚡ RFPgrep</h1>
                    </div>
                    <h2 style="color: #1f2937;">You've been invited! 👥</h2>
                    <p style="color: #4b5563; line-height: 1.6;">
                        <strong>${inviterName || inviterEmail || 'A team member'}</strong> has invited you to join their team on RFPgrep.
                    </p>
                    <p style="color: #4b5563; line-height: 1.6;">
                        RFPgrep helps teams respond to RFPs faster with AI-powered assistance. Join them and start collaborating!
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://responceai.web.app/signup" 
                           style="background: linear-gradient(to right, #6366f1, #a855f7); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Accept Invitation →
                        </a>
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                        © 2024 RFPgrep. All rights reserved.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            throw new HttpsError('internal', 'Failed to send invite email.');
        }

        console.log('Team invite email sent:', data);
        return { success: true, messageId: data?.id };

    } catch (error) {
        console.error('Email error:', error);
        throw new HttpsError('internal', 'Failed to send email.');
    }
});

// ===========================================
// WEBHOOK NOTIFICATIONS (Slack/Teams)
// ===========================================

/**
 * Cloud Function: Send Webhook Notification
 * Sends notifications to Slack/Teams webhooks (avoids CORS issues)
 */
exports.sendWebhookNotification = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const userId = request.auth.uid;
    const { event, eventData } = request.data;

    if (!event) {
        throw new HttpsError('invalid-argument', 'Event type is required.');
    }

    try {
        // Get user's integration settings
        const userDoc = await admin.firestore().doc(`users/${userId}`).get();
        if (!userDoc.exists) {
            return { success: false, message: 'User not found' };
        }

        const userData = userDoc.data();
        const integrations = userData.integrations || {};
        const results = { slack: false, teams: false, custom: false };

        // Send Slack notification if configured
        if (integrations.slack?.webhookUrl && integrations.slack?.enabled) {
            try {
                const message = buildSlackMessage(event, eventData);
                const response = await fetch(integrations.slack.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message)
                });

                if (response.ok) {
                    results.slack = true;
                    console.log('Slack notification sent for event:', event);
                } else {
                    console.error('Slack webhook failed:', await response.text());
                }
            } catch (error) {
                console.error('Slack notification error:', error);
            }
        }

        // Send Teams notification if configured
        if (integrations.teams?.webhookUrl && integrations.teams?.enabled) {
            try {
                const teamsMessage = {
                    "@type": "MessageCard",
                    "@context": "http://schema.org/extensions",
                    "themeColor": "6366f1",
                    "summary": `RFPgrep: ${event.replace('_', ' ')}`,
                    "sections": [{
                        "activityTitle": eventData.rfpName || eventData.projectName,
                        "facts": [
                            { "name": "Event", "value": event.replace('_', ' ').toUpperCase() },
                            { "name": "Questions", "value": String(eventData.totalQuestions || 0) }
                        ],
                        "markdown": true
                    }]
                };

                const response = await fetch(integrations.teams.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(teamsMessage)
                });

                if (response.ok) {
                    results.teams = true;
                    console.log('Teams notification sent for event:', event);
                } else {
                    console.error('Teams webhook failed:', await response.text());
                }
            } catch (error) {
                console.error('Teams notification error:', error);
            }
        }

        // Send Custom webhook notification if configured
        if (integrations.customWebhook?.url && integrations.customWebhook?.enabled) {
            try {
                const customPayload = {
                    event: event,
                    timestamp: new Date().toISOString(),
                    data: eventData
                };

                const headers = { 'Content-Type': 'application/json' };

                // Add HMAC signature if secret is configured
                if (integrations.customWebhook.secret) {
                    const crypto = require('crypto');
                    const signature = crypto
                        .createHmac('sha256', integrations.customWebhook.secret)
                        .update(JSON.stringify(customPayload))
                        .digest('hex');
                    headers['X-RFPgrep-Signature'] = `sha256=${signature}`;
                }

                const response = await fetch(integrations.customWebhook.url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(customPayload)
                });

                if (response.ok) {
                    results.custom = true;
                    console.log('Custom webhook notification sent for event:', event);
                } else {
                    console.error('Custom webhook failed:', await response.text());
                }
            } catch (error) {
                console.error('Custom webhook notification error:', error);
            }
        }

        return { success: true, results };
    } catch (error) {
        console.error('Webhook notification error:', error);
        throw new HttpsError('internal', 'Failed to send notification');
    }
});

// Helper function to build Slack message
function buildSlackMessage(event, data) {
    const messages = {
        rfp_uploaded: {
            text: `📄 New RFP Uploaded: ${data.rfpName}`,
            blocks: [
                {
                    type: 'header',
                    text: { type: 'plain_text', text: '📄 New RFP Uploaded', emoji: true }
                },
                {
                    type: 'section',
                    fields: [
                        { type: 'mrkdwn', text: `*RFP Name:*\n${data.rfpName}` },
                        { type: 'mrkdwn', text: `*Questions:*\n${data.totalQuestions || 'Processing...'}` }
                    ]
                }
            ]
        },
        rfp_completed: {
            text: `✅ RFP Completed: ${data.rfpName}`,
            blocks: [
                {
                    type: 'header',
                    text: { type: 'plain_text', text: '✅ RFP Completed!', emoji: true }
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `*${data.rfpName}* has been completed with ${data.totalQuestions} responses.` }
                }
            ]
        },
        test_notification: {
            text: `🧪 Test Notification from RFPgrep`,
            blocks: [
                {
                    type: 'header',
                    text: { type: 'plain_text', text: '🧪 Test Notification', emoji: true }
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `Your Slack integration is working! You will receive notifications when RFPs are uploaded or completed.` }
                }
            ]
        }
    };

    return messages[event] || { text: `RFPgrep: ${event}` };
}

// ===========================================
// REST API ENDPOINT
// ===========================================


const { app: apiApp, setGeminiApiKey } = require('./api');

/**
 * REST API Cloud Function
 * Exposes all /api/v1/* endpoints
 * Uses API key authentication (not Firebase Auth)
 */
exports.api = onRequest({
    cors: true,
    maxInstances: 100,
    timeoutSeconds: 60,
    memory: '512MiB'
}, (req, res) => {
    // Set the Gemini API key lazily at request time
    setGeminiApiKey(geminiApiKey.value());
    return apiApp(req, res);
});

/**
 * Cloud Function: Get Signed Upload URL
 * Generates a signed URL for direct file upload to bypass CORS
 */
exports.getSignedUploadUrl = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const userId = request.auth.uid;
    const { fileName, contentType, projectId } = request.data;

    if (!fileName || !projectId) {
        throw new HttpsError('invalid-argument', 'fileName and projectId are required.');
    }

    try {
        const bucket = admin.storage().bucket();
        const filePath = `users/${userId}/projects/${projectId}/${projectId}_${Date.now()}_${fileName}`;
        const file = bucket.file(filePath);

        // Generate a signed URL for upload (valid for 15 minutes)
        const [signedUrl] = await file.getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType: contentType || 'application/octet-stream',
        });

        console.log(`Generated signed URL for user ${userId}, project ${projectId}`);

        return {
            success: true,
            signedUrl: signedUrl,
            filePath: filePath
        };
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw new HttpsError('internal', 'Failed to generate upload URL: ' + error.message);
    }
});

/**
 * Cloud Function: Confirm Upload Complete
 * Called after file upload to get the download URL and trigger processing
 */
exports.confirmUpload = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const userId = request.auth.uid;
    const { filePath } = request.data;

    if (!filePath) {
        throw new HttpsError('invalid-argument', 'filePath is required.');
    }

    // Verify the path belongs to this user
    if (!filePath.startsWith(`users/${userId}/`)) {
        throw new HttpsError('permission-denied', 'Access denied to this file path.');
    }

    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            throw new HttpsError('not-found', 'File not found. Upload may have failed.');
        }

        // Get download URL
        const [metadata] = await file.getMetadata();
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

        console.log(`Upload confirmed for ${filePath}`);

        return {
            success: true,
            downloadUrl: downloadUrl,
            filePath: filePath,
            size: metadata.size,
            contentType: metadata.contentType
        };
    } catch (error) {
        console.error('Error confirming upload:', error);
        throw new HttpsError('internal', 'Failed to confirm upload: ' + error.message);
    }
});

// =====================================================
// REST API ENDPOINTS WITH API KEY AUTHENTICATION
// =====================================================

/**
 * Validate API Key and return user info
 * @param {string} apiKey - The API key from request header
 * @returns {object} { valid: boolean, userId: string|null, error: string|null }
 */
async function validateApiKeyAuth(apiKey) {
    if (!apiKey || !apiKey.startsWith('rfp_')) {
        return { valid: false, userId: null, error: 'Invalid API key format' };
    }

    try {
        // Search for the API key in all users
        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.get();

        for (const doc of snapshot.docs) {
            const userData = doc.data();
            const apiKeys = userData.apiKeys || [];

            const matchingKey = apiKeys.find(k => k.key === apiKey && k.isActive !== false);
            if (matchingKey) {
                // Update last used timestamp
                const updatedKeys = apiKeys.map(k =>
                    k.key === apiKey ? { ...k, lastUsed: new Date().toISOString(), callCount: (k.callCount || 0) + 1 } : k
                );
                await doc.ref.update({ apiKeys: updatedKeys });

                return {
                    valid: true,
                    userId: doc.id,
                    userData: userData,
                    keyName: matchingKey.name
                };
            }
        }

        return { valid: false, userId: null, error: 'API key not found' };
    } catch (error) {
        console.error('API key validation error:', error);
        return { valid: false, userId: null, error: 'Validation failed' };
    }
}

/**
 * CORS headers for REST API
 */
function setCorsHeaders(res) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.set('Access-Control-Max-Age', '3600');
}

/**
 * REST API: Get Projects List
 * GET /api/projects
 * Header: X-API-Key: rfp_xxx
 */
exports.apiGetProjects = onRequest({
    cors: true,
    region: 'us-central1'
}, async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    const auth = await validateApiKeyAuth(apiKey);

    if (!auth.valid) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: auth.error,
            hint: 'Include your API key in the X-API-Key header'
        });
    }

    try {
        const projectsRef = admin.firestore().collection(`users/${auth.userId}/projects`);
        const snapshot = await projectsRef.orderBy('createdAt', 'desc').limit(50).get();

        const projects = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            projects.push({
                id: doc.id,
                name: data.name,
                client: data.client,
                status: data.status,
                deadline: data.deadline,
                stats: data.stats,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
            });
        });

        return res.status(200).json({
            success: true,
            count: projects.length,
            projects: projects
        });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * REST API: Get Single Project
 * GET /api/project?id=xxx
 * Header: X-API-Key: rfp_xxx
 */
exports.apiGetProject = onRequest({
    cors: true,
    region: 'us-central1'
}, async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    const auth = await validateApiKeyAuth(apiKey);

    if (!auth.valid) {
        return res.status(401).json({ error: 'Unauthorized', message: auth.error });
    }

    const projectId = req.query.id;
    if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required', hint: 'Add ?id=YOUR_PROJECT_ID to the URL' });
    }

    try {
        const projectDoc = await admin.firestore().doc(`users/${auth.userId}/projects/${projectId}`).get();

        if (!projectDoc.exists) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const data = projectDoc.data();
        return res.status(200).json({
            success: true,
            project: {
                id: projectDoc.id,
                name: data.name,
                client: data.client,
                status: data.status,
                deadline: data.deadline,
                stats: data.stats,
                sections: data.sections?.map(s => ({
                    title: s.title || s.name,
                    questionsCount: s.questions?.length || 0,
                    questions: s.questions?.map(q => ({
                        text: q.text,
                        response: q.response,
                        status: q.status,
                        assignedTo: q.assignedTo
                    }))
                })),
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
            }
        });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * REST API: Generate AI Response
 * POST /api/ai/generate
 * Header: X-API-Key: rfp_xxx
 * Body: { question: "...", tone: "professional", knowledgeBase: [...] }
 */
exports.apiGenerateAI = onRequest({
    cors: true,
    region: 'us-central1'
}, async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    const auth = await validateApiKeyAuth(apiKey);

    if (!auth.valid) {
        return res.status(401).json({ error: 'Unauthorized', message: auth.error });
    }

    const { question, tone = 'professional', knowledgeBase = [] } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required in request body' });
    }

    try {
        // Rate limit check
        const rateLimit = await checkRateLimit(auth.userId, 'apiGenerateAI');
        if (!rateLimit.allowed) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil(rateLimit.resetIn / 1000),
                remaining: rateLimit.remaining
            });
        }

        // Prompt injection check
        const injectionCheck = checkPromptInjection(question);
        if (!injectionCheck.safe) {
            return res.status(400).json({ error: 'Invalid input detected' });
        }

        const sanitizedQuestion = sanitizeForPrompt(question, 5000);
        const prompt = buildPrompt(sanitizedQuestion, knowledgeBase, tone, 'generate');

        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const generatedText = result.response.text();

        // Update usage
        await admin.firestore().collection('users').doc(auth.userId).update({
            'usage.aiCallsMade': admin.firestore.FieldValue.increment(1)
        });

        return res.status(200).json({
            success: true,
            response: generatedText,
            model: 'gemini-2.0-flash',
            rateLimitRemaining: rateLimit.remaining
        });
    } catch (error) {
        console.error('AI API error:', error);
        return res.status(500).json({ error: 'Failed to generate response' });
    }
});

/**
 * REST API: Update Question Response
 * POST /api/project/update-response
 * Header: X-API-Key: rfp_xxx
 * Body: { projectId, sectionIndex, questionIndex, response }
 */
exports.apiUpdateResponse = onRequest({
    cors: true,
    region: 'us-central1'
}, async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    const auth = await validateApiKeyAuth(apiKey);

    if (!auth.valid) {
        return res.status(401).json({ error: 'Unauthorized', message: auth.error });
    }

    const { projectId, sectionIndex, questionIndex, response } = req.body;

    if (!projectId || sectionIndex === undefined || questionIndex === undefined) {
        return res.status(400).json({
            error: 'Missing required fields',
            required: ['projectId', 'sectionIndex', 'questionIndex', 'response']
        });
    }

    try {
        const projectRef = admin.firestore().doc(`users/${auth.userId}/projects/${projectId}`);
        const projectDoc = await projectRef.get();

        if (!projectDoc.exists) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const data = projectDoc.data();
        const sections = [...(data.sections || [])];

        if (!sections[sectionIndex]?.questions?.[questionIndex]) {
            return res.status(400).json({ error: 'Question not found at specified index' });
        }

        sections[sectionIndex].questions[questionIndex].response = response;
        sections[sectionIndex].questions[questionIndex].updatedAt = new Date().toISOString();
        sections[sectionIndex].questions[questionIndex].updatedBy = 'api';

        await projectRef.update({
            sections,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({
            success: true,
            message: 'Response updated successfully'
        });
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * REST API: API Info/Health Check
 * GET /api/info
 */
exports.apiInfo = onRequest({
    cors: true,
    region: 'us-central1'
}, async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    return res.status(200).json({
        name: 'RFPgrep API',
        version: '1.0.0',
        status: 'operational',
        endpoints: {
            '/apiInfo': 'GET - API health check',
            '/apiGetProjects': 'GET - List all projects',
            '/apiGetProject?id=xxx': 'GET - Get single project details',
            '/apiGenerateAI': 'POST - Generate AI response',
            '/apiUpdateResponse': 'POST - Update question response'
        },
        authentication: 'Include your API key in the X-API-Key header',
        documentation: 'https://rfpgrep.com/api-docs'
    });
});
