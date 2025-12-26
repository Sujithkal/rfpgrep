# Changelog

All notable changes to RFPgrep are documented here.

## [2.5.0] - 2025-12-26

### 🎉 Major Features

#### 🧠 Custom AI Training
- AI learns from your winning RFP responses
- Few-shot learning improves future generations
- "Learn from Win" button in Analytics
- Training examples stored per category
- Pattern matching for similar questions

#### 🎯 Win Rate Predictions
- 5-factor probability scoring system
  - Response completion (25%)
  - Response quality (25%)
  - Time management (15%)
  - Team collaboration (15%)
  - Historical performance (20%)
- Real-time probability calculation
- Risk factor identification
- Improvement recommendations

#### 🔌 Full REST API
- Complete API with key authentication
- Endpoints:
  - `GET /apiInfo` - Health check
  - `GET /apiGetProjects` - List projects
  - `GET /apiGetProject` - Get single project
  - `POST /apiGenerateAI` - Generate AI response
  - `POST /apiUpdateResponse` - Update responses
- Rate limiting per API key
- Usage tracking (lastUsed, callCount)

#### 📧 Notification System
- In-app notifications via bell icon
- Real-time updates using Firestore subscriptions
- Notification types:
  - Team invites
  - Member joins
  - Project created
  - Project exported
- Firestore security rules for notifications

### 🔧 Improvements

#### API Documentation Page
- Updated with real deployed endpoints
- Correct authentication format (X-API-Key)
- Example curl commands
- Interactive code samples

#### Analytics Page
- AI Training Progress card
- Learn from Win button for won projects
- Calculate Win Probability for pending projects
- Training categories display

#### Roadmap Page
- Updated to show completed features
- Q1 2025 marked as completed
- Q2 2025 (Current) with AI Training & Predictions

### 🐛 Bug Fixes
- Fixed notification security rules
- Fixed CommentThread re-subscription loop
- Fixed team invite notifications

### 📁 New Files
- `src/services/trainingDataService.js` - AI training management
- `src/services/winPredictionService.js` - Win probability calculation
- `functions/index.js` - REST API endpoints added

---

## [2.4.0] - 2025-12-25

### Features
- Team collaboration with invites
- Comment threads on questions
- Version history with rollback
- Slack/Teams webhook integrations
- Custom webhook support

---

## [2.3.0] - 2025-12-24

### Features
- Knowledge Library with RAG
- Answer Library with versioning
- Multi-language translation (13+ languages)
- AI quality review

---

## [2.2.0] - 2025-12-23

### Features
- PDF and Word export
- Custom branding (logo, colors)
- CRM export (CSV)

---

## [2.1.0] - 2025-12-22

### Features
- Gemini 2.0 Flash integration
- Trust score calculation
- Batch AI generation

---

## [2.0.0] - 2025-12-20

### Features
- Complete UI redesign
- Dark mode support
- Real-time collaboration
- Firebase backend migration

---

## [1.0.0] - 2025-12-15

### Initial Release
- RFP upload and parsing
- Basic AI response generation
- User authentication
- Project management
