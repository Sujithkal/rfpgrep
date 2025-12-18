# RFPgrep - AI-Powered RFP Response Automation

![RFPgrep](https://rfpgrep.com/og-image.png)

**Win more proposals with AI.** RFPgrep is an enterprise-grade platform that automates RFP (Request for Proposal) responses using artificial intelligence.

🌐 **Live Demo:** [https://rfpgrep.com](https://rfpgrep.com)

---

## ✨ Features

### AI Response Generation
- Generate tailored responses using your company knowledge base
- Trust Score analysis with confidence ratings
- Multi-language translation (13+ languages)
- AI quality review with improvement suggestions

### Real-time Collaboration
- Multi-user document editing
- Presence indicators (see who's viewing/editing)
- Comment threads on questions
- Version history with rollback

### Enterprise Workflow
- Customizable approval workflows (Draft → Review → Approved → Final)
- Role-based permissions
- Auto-assignment by expertise
- Deadline reminders and notifications

### Export & Integration
- Export to PDF, Word, Excel
- Branding customization (logos, colors)
- Webhook integrations
- API access

### Security & Compliance
- SOC 2 Type II certified
- ISO 27001 compliant
- Zero AI model training on your data
- Comprehensive audit logs

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Firebase (Firestore, Auth, Functions, Hosting) |
| AI | Google Gemini API |
| Payments | Stripe |
| Export | jsPDF, html2canvas |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rfpgrep.git
   cd rfpgrep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   VITE_GEMINI_API_KEY=your_gemini_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

---

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CommentThread.jsx
│   ├── NotificationCenter.jsx
│   ├── ThemeToggle.jsx
│   └── VersionHistoryModal.jsx
├── context/            # React context providers
│   └── AuthContext.jsx
├── pages/              # Page components
│   ├── LandingPage.jsx
│   ├── DashboardPage.jsx
│   ├── EditorPage.jsx
│   ├── UploadPage.jsx
│   └── ...
├── services/           # Backend service modules
│   ├── firebase.js
│   ├── aiService.js
│   ├── commentService.js
│   ├── translationService.js
│   └── ...
└── App.jsx             # Main app component
```

---

## 🔧 Key Services

| Service | Purpose |
|---------|---------|
| `aiService.js` | AI response generation (Gemini) |
| `commentService.js` | Comment threads on questions |
| `translationService.js` | Multi-language translation |
| `aiReviewService.js` | Answer quality analysis |
| `gamificationService.js` | Badges, points, levels |
| `autoAssignService.js` | Smart question assignment |
| `auditLogService.js` | Activity tracking |

---

## 📊 Analytics & Insights

- Team performance dashboards
- Response time analytics
- Win rate tracking
- AI usage statistics

---

## 🔒 Security

- All data encrypted in transit and at rest
- Firebase Security Rules for data access
- No customer data used for AI training
- GDPR and CCPA compliant

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
