# 🚀 ResponseAI Deployment Guide

## Step-by-Step Deployment Process

Follow these steps to deploy your ResponseAI application with Cloud Functions and AI features.

---

## 📋 Prerequisites Checklist

- [x] Node.js installed (v18+)
- [x] Firebase project created
- [x] Firebase credentials in `.env`
- [ ] Firebase CLI installed
- [ ] Gemini API key obtained
- [ ] Functions dependencies installed

---

## Part 1: Install Firebase CLI

### Windows (PowerShell as Administrator):
```powershell
npm install -g firebase-tools
```

### Verify installation:
```bash
firebase --version
```

---

## Part 2: Login to Firebase

```bash
firebase login
```

This will:
1. Open your browser
2. Ask you to sign in with Google
3. Authorize Firebase CLI

---

## Part 3: Initialize Firebase Functions

**Navigate to your project:**
```bash
cd C:\Users\ACER\.gemini\antigravity\scratch\responseai-app
```

**Initialize (if not done):**
```bash
firebase init
```

Select:
- ✅ Functions
- ✅ Firestore
- ✅ Storage
- ✅ Hosting (optional)

When prompted:
- Choose "Use an existing project"
- Select your Firebase project
- Choose JavaScript (not TypeScript)
- Install dependencies: Yes

---

## Part 4: Install Functions Dependencies

```bash
cd functions
npm install
```

This installs:
- `firebase-admin`
- `firebase-functions`
- `@google/generative-ai` (Gemini)
- `pdf-parse` (PDF parsing)
- `xlsx` (Excel parsing)
- `mammoth` (Word parsing)

---

## Part 5: Get Gemini API Key

### Option A: Google AI Studio (Recommended)
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API key"
3. Select your Google Cloud project (or create new)
4. Copy the API key

### Option B: Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Navigate to "APIs & Services" → "Credentials"
3. Create API key
4. Enable "Generative Language API"

**Keep this key safe - you'll need it in the next step!**

---

## Part 6: Configure Gemini API Key

**Set the API key in Firebase config:**
```bash
firebase functions:config:set gemini.apikey="YOUR_GEMINI_API_KEY_HERE"
```

Replace `YOUR_GEMINI_API_KEY_HERE` with your actual key.

**Verify it's set:**
```bash
firebase functions:config:get
```

You should see:
```json
{
  "gemini": {
    "apikey": "AIza..."
  }
}
```

---

## Part 7: Deploy Cloud Functions

**Deploy all functions:**
```bash
firebase deploy --only functions
```

This will:
1. Upload your function code
2. Install dependencies on Firebase servers
3. Deploy both `generateAIResponse` and `parseRFPFile`
4. Take 2-5 minutes

**Expected output:**
```
✔  Deploy complete!

Functions:
- generateAIResponse (us-central1)
- parseRFPFile (us-central1)
```

---

## Part 8: Deploy Firestore Rules & Storage Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

This secures your database and storage.

---

## Part 9: Test Your Functions

### Test 1: AI Response Generation

**In your browser:**
1. Go to http://localhost:5173
2. Login to your account
3. Go to `/editor`
4. Click "Generate Response"
5. Watch the AI create a response!

### Test 2: File Upload & Parsing

1. Go to `/upload`
2. Upload a PDF/Excel/Word file
3. Check Firebase Console → Functions → Logs
4. You should see parsing logs
5. Check Firestore to see extracted questions

---

## Part 10: Monitor & Debug

### View Function Logs:
```bash
firebase functions:log
```

### Check Function Status:
Firebase Console → Functions → Dashboard

### View Usage:
Firebase Console → Functions → Usage

---

## 🎯 Success Criteria

After deployment, you should have:

- ✅ 2 Cloud Functions deployed
- ✅ AI responses generated in real-time
- ✅ Files automatically parsed on upload
- ✅ Trust scores calculated
- ✅ Citations extracted
- ✅ Firestore security rules active
- ✅ Storage security rules active

---

## 💰 Cost Estimate

### Free Tier Limits:
- **Cloud Functions:** 2M invocations/month
- **Gemini API:** 1,500 requests/day (free tier)
- **Firestore:** 50K reads/day, 20K writes/day
- **Storage:** 5GB stored, 1GB downloaded/day

### Typical Usage for 10 users:
- ~500 AI calls/month: **FREE**
- ~100 file uploads/month: **FREE**
- Storage ~2GB: **FREE**

You'll likely stay in free tier for testing and small-scale use!

---

## 🐛 Troubleshooting

### Error: "firebase: command not found"
```bash
npm install -g firebase-tools
```

### Error: "Permission denied"
Run PowerShell as Administrator

### Error: "Gemini API key not found"
```bash
firebase functions:config:set gemini.apikey="YOUR_KEY"
firebase deploy --only functions
```

### Error: "Function deployment failed"
- Check `functions/package.json` exists
- Run `npm install` in functions directory
- Check Firebase Console for detailed error

---

## ✅ Next Steps After Deployment

1. **Test the AI features** - Generate responses for RFP questions
2. **Upload test files** - Try PDF, Excel, Word uploads
3. **Monitor usage** - Check Firebase Console for function calls
4. **Optimize costs** - Review usage and adjust limits
5. **Add team features** - Invite users, collaboration
6. **Deploy frontend** - Put on Vercel/Firebase Hosting

---

## 📞 Support

If you encounter issues:
1. Check Firebase Console logs
2. Run `firebase functions:log` for detailed errors
3. Verify Gemini API key is set correctly
4. Check Firestore security rules are deployed

Your AI-powered RFP platform is ready to go live! 🎉
