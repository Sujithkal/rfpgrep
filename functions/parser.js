const functions = require('firebase-functions');
const admin = require('firebase-admin');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const mammoth = require('mammoth');

/**
 * Cloud Function: Parse RFP File
 * 
 * Triggered by Cloud Storage upload
 * Extracts questions and metadata from PDF, Excel, or Word files
 */
exports.parseRFPFile = functions.storage.object().onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;

    // Only process files in the /teams/{teamId}/rfps/ path
    if (!filePath.startsWith('teams/') || !filePath.includes('/rfps/')) {
        console.log('Not an RFP file, skipping...');
        return null;
    }

    // Extract teamId and rfpId from path
    const pathParts = filePath.split('/');
    const teamId = pathParts[1];
    const rfpId = pathParts[3];

    console.log(`Processing RFP: ${rfpId} for team: ${teamId}`);

    try {
        // Download file from Storage
        const bucket = admin.storage().bucket(object.bucket);
        const file = bucket.file(filePath);
        const [fileBuffer] = await file.download();

        let extractedData;

        // Parse based on file type
        if (contentType === 'application/pdf') {
            extractedData = await parsePDF(fileBuffer);
        } else if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            contentType === 'application/vnd.ms-excel') {
            extractedData = await parseExcel(fileBuffer);
        } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractedData = await parseWord(fileBuffer);
        } else {
            throw new Error('Unsupported file type');
        }

        // Update RFP document with extracted data
        await admin.firestore()
            .collection('teams').doc(teamId)
            .collection('rfps').doc(rfpId)
            .update({
                status: 'ready',
                sections: extractedData.sections,
                totalQuestions: extractedData.totalQuestions,
                metadata: {
                    ...extractedData.metadata,
                    parsedAt: admin.firestore.FieldValue.serverTimestamp()
                },
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        console.log(`Successfully parsed ${extractedData.totalQuestions} questions`);
        return { success: true };

    } catch (error) {
        console.error('RFP Parsing Error:', error);

        // Update RFP status to error
        await admin.firestore()
            .collection('teams').doc(teamId)
            .collection('rfps').doc(rfpId)
            .update({
                status: 'error',
                errorMessage: error.message,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        return { success: false, error: error.message };
    }
});

/**
 * Parse PDF file
 */
async function parsePDF(buffer) {
    const data = await pdfParse(buffer);
    const text = data.text;

    // Extract sections and questions
    const sections = extractSectionsFromText(text);

    // Extract metadata
    const metadata = {
        pageCount: data.numpages,
        extractedText: text.substring(0, 500) // First 500 chars for preview
    };

    return {
        sections,
        totalQuestions: sections.reduce((sum, s) => sum + s.questions.length, 0),
        metadata
    };
}

/**
 * Parse Excel file
 */
async function parseExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sections = [];
    let questionCounter = 1;

    workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const questions = [];

        data.forEach((row, index) => {
            if (row.length > 0 && row[0]) {
                // Assume first column is question text
                const questionText = String(row[0]).trim();

                // Filter out empty rows and headers
                if (questionText.length > 10 && !isHeaderRow(questionText)) {
                    questions.push({
                        id: `q_${questionCounter++}`,
                        text: questionText,
                        response: '',
                        status: 'pending',
                        assignedTo: null,
                        priority: determinePriority(questionText),
                        trustScore: 0,
                        citations: []
                    });
                }
            }
        });

        if (questions.length > 0) {
            sections.push({
                id: `section_${sections.length + 1}`,
                name: sheetName,
                questions: questions
            });
        }
    });

    return {
        sections,
        totalQuestions: sections.reduce((sum, s) => sum + s.questions.length, 0),
        metadata: {
            sheetCount: workbook.SheetNames.length
        }
    };
}

/**
 * Parse Word file
 */
async function parseWord(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    const sections = extractSectionsFromText(text);

    return {
        sections,
        totalQuestions: sections.reduce((sum, s) => sum + s.questions.length, 0),
        metadata: {
            extractedText: text.substring(0, 500)
        }
    };
}

/**
 * Extract sections and questions from text
 */
function extractSectionsFromText(text) {
    const sections = [];
    let questionCounter = 1;

    // Split by common question patterns
    const questionPattern = /(?:^|\n)(?:\d+\.|\w\.|Question\s+\d+:?|\?\s)/gi;
    const matches = text.split(questionPattern);

    const questions = matches
        .filter(q => q.trim().length > 20)
        .map(q => ({
            id: `q_${questionCounter++}`,
            text: q.trim().substring(0, 500), // Limit question length
            response: '',
            status: 'pending',
            assignedTo: null,
            priority: determinePriority(q),
            trustScore: 0,
            citations: []
        }));

    if (questions.length > 0) {
        sections.push({
            id: 'section_1',
            name: 'General Questions',
            questions: questions
        });
    }

    return sections;
}

/**
 * Helper: Check if row is a header
 */
function isHeaderRow(text) {
    const headerKeywords = ['question', 'section', 'number', '#', 'description', 'response'];
    const lowerText = text.toLowerCase();
    return headerKeywords.some(keyword => lowerText === keyword || lowerText.includes(keyword));
}

/**
 * Helper: Determine question priority based on keywords
 */
function determinePriority(text) {
    const highPriorityKeywords = ['must', 'required', 'mandatory', 'critical', 'essential'];
    const mediumPriorityKeywords = ['should', 'recommend', 'prefer'];

    const lowerText = text.toLowerCase();

    if (highPriorityKeywords.some(kw => lowerText.includes(kw))) {
        return 'high';
    } else if (mediumPriorityKeywords.some(kw => lowerText.includes(kw))) {
        return 'medium';
    }

    return 'low';
}
