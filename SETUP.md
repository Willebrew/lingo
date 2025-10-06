# 🚀 Lingo Setup Guide

This guide will walk you through setting up Lingo from scratch in under 10 minutes.

## Step 1: Firebase Project Setup (3 minutes)

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "lingo-app")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Firestore Database

1. In Firebase Console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Select "Start in production mode"
4. Choose your preferred location (closest to your users)
5. Click "Enable"

### Set Firestore Security Rules

1. Click on the "Rules" tab in Firestore
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /conversations/{conversationId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.participants;
      allow create: if request.auth != null && request.auth.uid in request.resource.data.participants;
      allow update: if request.auth != null && request.auth.uid in resource.data.participants;
    }

    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

### Create Firestore Indexes

1. Click on the "Indexes" tab
2. Click "Create Index"
3. Create first index:
   - Collection ID: `conversations`
   - Field 1: `participants` (Arrays)
   - Field 2: `lastMessageAt` (Descending)
   - Click "Create"
4. Create second index:
   - Collection ID: `messages`
   - Field 1: `conversationId` (Ascending)
   - Field 2: `timestamp` (Ascending)
   - Click "Create"

### Enable Authentication

1. Click "Authentication" in the left sidebar
2. Click "Get started"
3. Click on "Email/Password"
4. Enable the first toggle (Email/Password)
5. Click "Save"

### Get Firebase Configuration

1. Click the gear icon (⚙️) next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon (`</>`)
5. Register app with a nickname (e.g., "lingo-web")
6. Copy the `firebaseConfig` object - you'll need these values!

## Step 2: Anthropic API Setup (2 minutes)

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Click on "API Keys" in the dashboard
4. Click "Create Key"
5. Give it a name (e.g., "lingo-translation")
6. Copy the API key - you'll need this!

## Step 3: Local Development Setup (2 minutes)

### Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd lingo

# Install dependencies
npm install
```

### Configure Environment Variables

1. Create `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

2. Open `.env.local` and fill in your values:

```env
# Firebase Config (from Step 1)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Anthropic API Key (from Step 2)
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the login page! 🎉

## Step 4: Deploy to Vercel (3 minutes)

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add each variable from `.env.local`:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
     - `ANTHROPIC_API_KEY`
   - For each variable, select: Production, Preview, and Development

6. Click "Deploy"

Your app will be live in ~2 minutes! 🚀

## Step 5: Test Your Deployment

1. Open your Vercel deployment URL
2. Create an account
3. Open the app in another browser/incognito window
4. Create another account with a different email
5. Start a conversation using the other user's email
6. Send messages back and forth
7. Try translating a message!

## Troubleshooting

### "Firebase: Error (auth/operation-not-allowed)"

- Make sure Email/Password authentication is enabled in Firebase Console

### "Insufficient permissions"

- Check that Firestore security rules are published correctly
- Make sure you're signed in

### Translation not working

- Verify ANTHROPIC_API_KEY is set correctly
- Check that the API key has credits available
- Check browser console for errors

### Firestore indexes error

- Wait a few minutes for indexes to build
- Check Firebase Console → Firestore → Indexes tab
- Make sure both indexes show "Enabled" status

## Next Steps

- Customize the theme in `tailwind.config.js`
- Add more translation languages in `MessageBubble.tsx`
- Invite friends to test!
- ⭐ Star the repo if you found this helpful!

---

**Need help?** Open an issue on GitHub or check the main README.md for more details.
