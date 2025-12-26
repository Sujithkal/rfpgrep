// Set CORS on Firebase Storage bucket using service account
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Path to service account key
const keyFilePath = path.join(__dirname, 'responceai-firebase-adminsdk-fbsvc-1cd4fb2148.json');

// Initialize storage with service account
const storage = new Storage({
    keyFilename: keyFilePath,
    projectId: 'responceai'
});

const bucketName = 'responceai.firebasestorage.app';

const corsConfiguration = [
    {
        origin: ['*'],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        maxAgeSeconds: 3600,
        responseHeader: [
            'Content-Type',
            'Authorization',
            'Content-Length',
            'X-Upload-Content-Type',
            'X-Upload-Content-Length',
            'X-Requested-With',
            'x-goog-resumable',
            'x-goog-*'
        ]
    }
];

async function setCors() {
    try {
        console.log(`Setting CORS for bucket: ${bucketName}`);

        const bucket = storage.bucket(bucketName);

        await bucket.setCorsConfiguration(corsConfiguration);

        console.log('✅ CORS configuration set successfully!');

        // Verify by getting the CORS config
        const [metadata] = await bucket.getMetadata();
        console.log('Current CORS config:', JSON.stringify(metadata.cors, null, 2));

    } catch (error) {
        console.error('❌ Error setting CORS:', error.message);
        console.error('Full error:', error);
    }
}

setCors();
