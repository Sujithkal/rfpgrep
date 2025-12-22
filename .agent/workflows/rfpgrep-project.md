---
description: RFPgrep - AI-powered RFP response automation app
---

# RFPgrep Project Overview

## Project Location
- **Path**: `C:\Users\ACER\.gemini\antigravity\scratch\responseai-app`
- **Live URL**: https://responceai.web.app
- **Firebase Project**: `responceai`

## Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Hosting, Functions, Storage)
- **AI**: Google Gemini API

## Key Features
1. **RFP Project Management** - Upload RFP documents, extract questions, generate AI responses
2. **Answer Library** - Store reusable Q&A pairs for similar questions
3. **Knowledge Library** - Upload company documents for RAG context
4. **RAG Integration** - AI uses Answer + Knowledge libraries for better responses
5. **Team Collaboration** - Multi-user support with roles
6. **Export** - Word, PDF, Excel export of responses

## Important Directories
```
src/
├── pages/           # Main page components
│   ├── DashboardPage.jsx
│   ├── ProjectsPage.jsx
│   ├── EditorPage.jsx      # Main RFP editing with AI generation
│   ├── AnswersPage.jsx     # Answer Library
│   └── KnowledgePage.jsx   # Knowledge Library
├── services/        # Firebase & business logic
│   ├── aiGenerationService.js  # RAG-powered AI responses
│   ├── answerLibraryService.js
│   ├── knowledgeService.js
│   ├── projectService.js
│   └── firebase.js
├── components/      # Reusable UI components
└── context/         # React context (AuthContext)
```

## Common Commands
// turbo-all
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Build and deploy (one command)
npm run build && firebase deploy --only hosting
```

## Firebase Structure
```
users/{userId}/
├── projects/{projectId}/
│   └── questions/{questionId}
├── answers/{answerId}          # Answer Library
├── knowledge/{fileId}          # Knowledge Library docs
└── knowledgeChunks/{chunkId}   # Parsed knowledge chunks
```

## Recent Changes (as of Dec 2024)
1. RAG Integration - AI now uses Answer & Knowledge libraries
2. Won/Lost/Pending buttons fixed on Projects page
3. Dashboard status badges now show all statuses correctly
4. Knowledge Library file upload working

## How to Continue Development
1. Make code changes
2. Test locally with `npm run dev`
3. Deploy with `npm run build && firebase deploy --only hosting`

## Notes
- Firebase admin SDK key is gitignored - never commit it
- The app auto-deploys changes to https://responceai.web.app
