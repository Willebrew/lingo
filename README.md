# 🔒 Lingo - End-to-End Encrypted Messaging

A modern, secure messaging application with built-in AI-powered translation. Messages are end-to-end encrypted using NaCl encryption, ensuring complete privacy.

## ✨ Features

### Core Messaging
- 🔐 **End-to-End Encryption** - All messages encrypted using NaCl (Curve25519-XSalsa20-Poly1305)
- 🔒 **Password-Encrypted Keys** - Private keys encrypted with PBKDF2 + AES-GCM before storage
- 🔑 **Key Recovery System** - Automatic recovery codes for account backup
- ⚡ **Real-time Messaging** - Instant message delivery with Firebase Firestore
- 👥 **Group Chats** - Create conversations with multiple participants
- 💬 **Custom Chat Names** - Name your conversations with system notifications on changes
- 🛡️ **Secure Firestore Rules** - Messages readable only by conversation participants

### User Experience
- 🎨 **Beautiful UI** - Modern, responsive design with smooth animations
- 🌓 **Dark Mode** - Automatic theme switching with system preference detection
- 📱 **Mobile Optimized** - Intuitive bottom navigation and touch-friendly interface
- 🔔 **Smart Notifications** - Real-time notification badges with unread counts
- 👤 **Contact Management** - Add, remove, and organize your contacts
- 🔄 **Real-time Updates** - Live conversation updates and instant synchronization

### Advanced Features
- 🌍 **AI Translation** - Translate messages to 13+ languages powered by Claude AI (with E2E warning)
- 🎯 **System Messages** - Automatic notifications for chat name changes and events
- 💾 **Smart Caching** - Optimized performance with intelligent key caching
- 🔐 **Account Security** - Secure account deletion with conversation cleanup

## 🔒 Security Features

**Cryptographic Implementation:**
- **Encryption:** NaCl `box` (Curve25519-XSalsa20-Poly1305)
- **Key Derivation:** PBKDF2 with 100,000 iterations (SHA-256)
- **Private Key Storage:** AES-GCM-256 encrypted with user password
- **Recovery System:** 6-word recovery codes for key backup
- **Key Fingerprints:** SHA-512 fingerprints for manual verification

**Security Protections:**
- ✅ Messages encrypted client-side before transmission
- ✅ Private keys never sent to server (stored encrypted locally)
- ✅ Firestore rules prevent unauthorized message access
- ✅ Password-based key encryption mitigates XSS attacks
- ✅ Recovery codes enable account restoration
- ✅ Translation feature warns about E2E encryption break

**See [SECURITY.md](SECURITY.md) for complete security documentation.**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Firebase account
- An Anthropic API key (for translation features)

### 1. Clone and Install

```bash
git clone https://github.com/Willebrew/lingo
cd lingo
npm install
```

### 2. Firebase Setup

#### Step 2.1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and create a new project

#### Step 2.2: Enable Firestore Database

1. In your Firebase project, go to **Firestore Database** (left sidebar)
2. Click "Create database"
3. Select **"Start in production mode"**
4. Choose your preferred location (closest to your users)
5. Click "Enable"

#### Step 2.3: Enable Authentication

1. Go to **Authentication** (left sidebar)
2. Click "Get started"
3. Click on "Email/Password" provider
4. Enable the first toggle (Email/Password)
5. Click "Save"

#### Step 2.4: Get Firebase Configuration

1. Click the **gear icon** (⚙️) next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the **web icon** (`</>`) to add a web app
5. Register your app with a nickname (e.g., "lingo-web")
6. **Copy the `firebaseConfig` object** - you'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx"
};
```

7. **Keep this tab open** - you'll need these values for the next step!

### 3. Firestore Security Rules

Deploy the security rules to Firestore:

```bash
firebase deploy --only firestore:rules
```

Or manually copy the rules from [`firestore.rules`](firestore.rules) to the Firebase Console:
1. Go to Firestore Database → Rules tab
2. Copy the contents of `firestore.rules`
3. Paste and publish

**Note:** The authoritative security rules are maintained in [`firestore.rules`](firestore.rules). Always refer to that file for the latest rules.

### 4. Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key

### 5. Environment Variables

Copy the example environment file and add your keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your actual values:

```env
# Firebase Configuration (from Step 2.4)
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Anthropic API Key (from Step 4)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Create Firestore Indexes (IMPORTANT!)

**When you first try to view conversations**, you'll see an error in the console with a link. This is normal!

**To fix:**
1. Look for an error message like: `The query requires an index. You can create it here: https://console.firebase.google.com/...`
2. **Click that link** - it will open Firebase Console
3. Click **"Create Index"**
4. Wait 1-2 minutes for the index to build
5. Refresh the page

You'll need to do this **twice** (once for conversations, once for messages).

**Alternative - Manual Index Creation:**

Go to Firebase Console → Firestore → Indexes tab and create these:

**Index 1 - Conversations:**
- Collection ID: `conversations`
- Fields to index:
  - `participants` (Arrays)
  - `lastMessageAt` (Descending)

**Index 2 - Messages:**
- Collection ID: `messages`
- Fields to index:
  - `conversationId` (Ascending)
  - `timestamp` (Ascending)

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

- 🇬🇧 English
- 🇪🇸 Spanish (Español)
- 🇫🇷 French (Français)
- 🇩🇪 German (Deutsch)
- 🇮🇹 Italian (Italiano)
- 🇵🇹 Portuguese (Português)
- 🇷🇺 Russian (Русский)
- 🇨🇳 Chinese (中文)
- 🇯🇵 Japanese (日本語)
- 🇰🇷 Korean (한국어)
- 🇸🇦 Arabic (العربية)
- 🇮🇳 Hindi (हिन्दी)
- 🇸🇪 Swedish (Svenska)

**Security Notice:** When you translate a message, it's sent to Claude AI for processing. This temporarily breaks end-to-end encryption for that message. The app will warn you before translating.

## 📱 Usage

### Creating an Account

1. Open the app
2. Click "Don't have an account? Sign up"
3. Enter your display name, email, and password
4. Click "Sign Up"
5. **Important:** Save your recovery code - you'll need it if you lose access

### Managing Contacts

1. Click the "Contacts" tab
2. Click "Add Contact"
3. Enter their email address
4. They'll appear in your contacts list once added

### Starting a Conversation

**One-on-One Chat:**
1. Click "New Conversation"
2. Select a contact from your list
3. Click "Start Conversation"

**Group Chat:**
1. Click "New Conversation"
2. Select multiple contacts using checkboxes
3. Click "Create Group Chat"

### Naming Conversations

1. Open any conversation
2. Click the menu (⋮) in the top right
3. Click "Edit Name"
4. Enter a custom name or leave empty to use participant names
5. Everyone in the chat will see a system message about the name change

### Adding Participants to Group Chats

1. Open a conversation
2. Click the menu (⋮) in the top right
3. Click "Add Participant"
4. Select a contact from your list
5. Click "Add"

### Sending Messages

1. Select a conversation from the sidebar
2. Type your message in the input field
3. Press Enter or click the send button
4. **Mobile:** Use the back arrow to return to conversation list

### Translating Messages

1. Hover over any message (or tap on mobile)
2. Click the three dots (⋮) menu
3. Click "Translate"
4. **Note:** A security warning will appear (translation breaks E2E encryption)
5. Select your desired language
6. The message will be instantly translated

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
