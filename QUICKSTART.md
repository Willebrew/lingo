# ⚡ Quick Start - Get Running in 5 Minutes

## 1. Install Dependencies (1 min)

```bash
npm install
```

## 2. Set Up Firebase (2 min)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable Firestore Database (production mode)
4. Enable Email/Password Authentication
5. Get your config from Project Settings

## 3. Get Anthropic API Key (1 min)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy it

## 4. Configure Environment (30 sec)

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx

ANTHROPIC_API_KEY=xxx
```

## 5. Run! (30 sec)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push

# Then on vercel.com:
# 1. Import your repo
# 2. Add environment variables
# 3. Deploy!
```

## Need Help?

- See [SETUP.md](SETUP.md) for detailed instructions
- See [README.md](README.md) for full documentation
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for development guide

---

**That's it!** You now have a fully functional end-to-end encrypted messaging app with AI translation! 🚀
