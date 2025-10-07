import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Lazy initialize Firebase Admin (only when needed, not at build time)
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const hasCredentials = !!(
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    );

    if (!hasCredentials) {
      console.error('[translate] Missing Firebase Admin credentials');
      throw new Error('Firebase Admin credentials not configured');
    }

    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getAuth();
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MAX_TEXT_LENGTH = 5000;
const ALLOWED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'sv'];

// In-memory rate limiting (for development - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per user

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Firebase Auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing authentication token' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      const auth = getFirebaseAdmin();
      decodedToken = await auth.verifyIdToken(token);
    } catch (error: any) {
      console.error('[translate] Token verification failed:', error.code, error.message);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid authentication token', details: error.message },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // 2. Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      );
    }

    // 3. Input validation
    const { text, targetLanguage } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text must be less than ${MAX_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (!targetLanguage || !ALLOWED_LANGUAGES.includes(targetLanguage)) {
      return NextResponse.json(
        { error: 'Invalid target language' },
        { status: 400 }
      );
    }

    // 4. Perform translation
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Translate the following text to ${targetLanguage}. Only return the translated text, nothing else:\n\n${text}`,
        },
      ],
    });

    const translatedText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({
      translatedText,
      sourceLanguage: 'auto-detected',
    });
  } catch (error: any) {
    console.error('Translation error:', error);

    // Handle Anthropic API specific errors
    if (error.status === 529) {
      return NextResponse.json(
        { error: 'Translation service is temporarily overloaded. Please try again in a few seconds.' },
        { status: 503 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before translating again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Translation failed. Please try again.' },
      { status: 500 }
    );
  }
}
