# 🔒 Lingo - End-to-End Encrypted Messaging

A modern, secure messaging application with built-in AI-powered translation. Messages are end-to-end encrypted using NaCl encryption, ensuring complete privacy.

## ✨ Features

- 🔐 **End-to-End Encryption** - All messages are encrypted using NaCl encryption
- 🌍 **AI Translation** - Translate messages to 10+ languages powered by Claude AI
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- 🌓 **Dark Mode** - Automatic theme switching with system preference detection
- ⚡ **Real-time Messaging** - Instant message delivery with Firebase Firestore
- 📱 **Mobile Friendly** - Fully responsive design for all devices
- 🔑 **Secure Authentication** - Firebase Authentication with email/password

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Firebase account
- An Anthropic API key (for translation features)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd lingo
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in **production mode**
   - Choose your preferred location
4. Enable **Authentication**:
   - Go to Authentication
   - Click "Get started"
   - Enable "Email/Password" sign-in method
5. Get your Firebase config:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click the web icon (`</>`)
   - Register your app
   - Copy the configuration object

### 3. Firestore Security Rules

Set up these security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Conversations collection
    match /conversations/{conversationId} {
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null &&
        request.auth.uid in request.resource.data.participants;
      allow update: if request.auth != null &&
        request.auth.uid in resource.data.participants;
    }

    // Messages collection
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

### 4. Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key

### 5. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Click "Import Project"
4. Import your GitHub repository
5. Add environment variables:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Make sure to add them for Production, Preview, and Development
6. Deploy!

## 🔧 Configuration

### Firestore Indexes

For optimal performance, create these indexes in Firestore:

1. **Conversations Index**:
   - Collection: `conversations`
   - Fields: `participants` (Arrays) → `lastMessageAt` (Descending)

2. **Messages Index**:
   - Collection: `messages`
   - Fields: `conversationId` (Ascending) → `timestamp` (Ascending)

To create indexes:
1. Go to Firestore Database in Firebase Console
2. Click on "Indexes" tab
3. Click "Create Index"
4. Add the fields as specified above

## 🏗️ Project Structure

```
lingo/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   │   └── translate/ # Translation endpoint
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── AuthForm.tsx
│   │   ├── ChatLayout.tsx
│   │   ├── ChatView.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── NewConversationModal.tsx
│   │   └── Sidebar.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useConversations.ts
│   │   ├── useMessages.ts
│   │   └── useTheme.ts
│   ├── lib/             # Library code
│   │   ├── db.ts        # Firestore operations
│   │   └── firebase.ts  # Firebase config
│   ├── store/           # State management
│   │   └── useStore.ts  # Zustand store
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   └── utils/           # Utility functions
│       └── encryption.ts # E2E encryption
├── .env.example         # Example environment variables
├── .env.local          # Your environment variables (gitignored)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

## 🔐 How Encryption Works

1. **Key Generation**: Each user gets a unique public/private key pair on signup
2. **Message Encryption**: Messages are encrypted separately for each recipient using their public key
3. **Storage**: Only encrypted messages are stored in Firestore
4. **Decryption**: Messages are decrypted client-side using the recipient's private key
5. **Private Key Storage**: Private keys are stored locally in browser localStorage (never sent to server)

## 🌍 Translation

The translation feature uses Claude AI (Sonnet 4.5) to translate messages in real-time. Supported languages:

- Spanish
- French
- German
- Italian
- Portuguese
- Russian
- Japanese
- Korean
- Chinese
- Arabic
- Hindi

To translate a message:
1. Hover over any message
2. Click the three dots menu
3. Click "Translate"
4. Select target language
5. The message will be translated in place

## 📱 Usage

### Creating an Account

1. Open the app
2. Click "Don't have an account? Sign up"
3. Enter your display name, email, and password
4. Click "Sign Up"

### Starting a Conversation

1. Click "New Conversation"
2. Enter the recipient's email address
3. Click "Start Conversation"

### Sending Messages

1. Select a conversation from the sidebar
2. Type your message in the input field
3. Press Enter or click the send button

### Translating Messages

1. Hover over any message
2. Click the three dots (⋮) menu
3. Click "Translate"
4. Select your desired language
5. The message will be instantly translated

## 🛠️ Troubleshooting

### Messages not sending

- Check that Firestore security rules are correctly set
- Verify that the user is authenticated
- Check browser console for errors

### Translation not working

- Verify `ANTHROPIC_API_KEY` is set correctly in environment variables
- Check that the API key has sufficient credits
- Check browser network tab for API errors

### Private key not found

- This happens if the user clears browser data
- User will need to create a new account
- Consider implementing key backup/recovery in production

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Important Security Notes

- Private keys are stored in localStorage (consider implementing a more secure solution for production)
- Always use HTTPS in production
- Regularly update dependencies for security patches
- Consider implementing key backup/recovery mechanisms
- Review and test Firestore security rules thoroughly

## 🎨 Customization

### Changing Colors

Edit `tailwind.config.js` to customize the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors here
      },
    },
  },
}
```

### Adding More Languages

Edit the `languages` array in `src/components/MessageBubble.tsx`:

```typescript
const languages = [
  { code: 'YourLanguage', name: 'Your Language' },
  // ... more languages
];
```

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Firebase, and Claude AI
