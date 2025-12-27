# RFPgrep - AI-Powered RFP Response Automation

![RFPgrep](https://rfpgrep.com/og-image.png)

**Win more proposals with AI.** RFPgrep is an enterprise-grade platform that automates RFP (Request for Proposal) responses using artificial intelligence.

🌐 **Live Demo:** [https://rfpgrep.com](https://rfpgrep.com)

---

## ✨ Features

### 🤖 AI Response Generation
- **Gemini 2.0 Flash** - Latest AI model for high-quality responses
- **RAG Integration** - Uses your Knowledge Library for context-aware answers
- **Trust Score** - Confidence ratings for every generated response
- **Multi-language Translation** - 13+ languages supported
- **AI Quality Review** - Improvement suggestions and scoring

### 🧠 Custom AI Training
- **Learn from Wins** - AI learns from your winning RFP responses
- **Few-shot Learning** - Training examples improve future generations
- **Pattern Recognition** - Matches new questions to successful past answers
- **Category-based Learning** - Organized by question types

### 🎯 Win Rate Predictions
- **5-Factor Scoring** - Response completion, quality, time, team, history
- **Real-time Probability** - Calculate win chances instantly
- **Risk Identification** - See what's hurting your chances
- **Improvement Recommendations** - AI suggests how to improve

### 👥 Real-time Collaboration
- **Multi-user Editing** - Work together in real-time
- **Presence Indicators** - See who's viewing/editing
- **Comment Threads** - Discuss questions with @mentions
- **Version History** - Rollback to any previous version
- **Question Assignment** - Assign questions to team members

### 📧 Notifications System
- **In-app Notifications** - Bell icon with real-time updates
- **Project Lifecycle** - Creation, approval, export alerts
- **Team Events** - Invites, member joins, assignments
- **Slack/Teams Integration** - Webhook notifications

### 🔌 REST API
Full API access with key authentication:
```bash
# List projects
curl -H "X-API-Key: rfp_xxx" https://us-central1-responceai.cloudfunctions.net/apiGetProjects

# Generate AI response
curl -X POST -H "X-API-Key: rfp_xxx" -H "Content-Type: application/json" \
  -d '{"question": "Your question here", "tone": "professional"}' \
  https://us-central1-responceai.cloudfunctions.net/apiGenerateAI
```

### 📤 Export & Integration
- Export to **PDF**, **Word**, **Excel**
- Custom branding (logos, colors, headers)
- **Slack** webhook integration
- **Microsoft Teams** webhook integration
- **Custom webhook** support
- **CRM Export** (Universal CSV format)

### 📚 Knowledge Management
- **Answer Library** - Save and reuse winning answers
- **Knowledge Library** - Upload company documents
- **RAG Search** - AI finds relevant content automatically
- **Categories & Tags** - Organize for easy retrieval

### 📊 Analytics Dashboard
- Win/Loss tracking with outcomes
- Completion rate metrics
- Trust score averages
- AI usage statistics
- Team performance insights

### 🔒 Security & Compliance
- SOC 2 Type II certified infrastructure
- ISO 27001 compliant
- **Zero AI training** on your data
- Rate limiting & injection protection
- Comprehensive audit logs
- GDPR and CCPA compliant

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Firebase (Firestore, Auth, Functions, Hosting) |
| AI | Google Gemini 2.0 Flash |
| Payments | Razorpay |
| Export | jsPDF, html2canvas, docx |
| Email | Resend |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account
- Razorpay account (for payments)
- Google AI API key (for Gemini)


## 🔧 Key Services

| Service | Purpose |
|---------|---------|
| `aiGenerationService.js` | RAG-powered AI response generation |
| `trainingDataService.js` | Custom AI training from winning responses |
| `winPredictionService.js` | Win probability calculation |
| `notificationService.js` | In-app notification system |
| `teamService.js` | Team collaboration & invites |
| `commentService.js` | Comment threads on questions |
| `translationService.js` | Multi-language translation |
| `exportService.js` | PDF/Word/Excel exports |
| `integrationsService.js` | Slack/Teams webhooks |
| `apiKeyService.js` | API key management |

---


## 📊 Analytics & Insights

- **Win/Loss Tracking** - Record outcomes for each RFP
- **Win Rate Predictions** - AI-powered probability scoring
- **AI Training Progress** - Track learning from wins
- **Response Quality Metrics** - Average trust scores
- **Team Performance** - Completion rates and contributions

---

## 🔒 Security

- All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- Firebase Security Rules for fine-grained access control
- Rate limiting on all API endpoints
- Prompt injection protection
- No customer data used for AI training
- GDPR, CCPA, and HIPAA compliant

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📞 Contact

- Website: [rfpgrep.com](https://rfpgrep.com)
- Email: hello@rfpgrep.com
- Demo: [Schedule a call](https://calendly.com/sujithkallutla/30min)

---

Made with ❤️ by the RFPgrep team
