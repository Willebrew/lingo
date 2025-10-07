# Security Audit Report - Lingo E2E Encrypted Messaging
**Date:** 2025-10-07
**Auditor:** Claude (Sonnet 4.5)
**Scope:** Full repository security review

## Executive Summary

This comprehensive security audit evaluated the Lingo end-to-end encrypted messaging application across authentication, encryption, data storage, API security, and common web vulnerabilities. The application demonstrates **strong cryptographic foundations** but has **critical security concerns** that require immediate attention, particularly around client-side key storage and API security.

### Overall Security Rating: **MODERATE** ⚠️

**Critical Issues:** 2
**High Priority:** 4
**Medium Priority:** 5
**Low Priority:** 3
**Informational:** 6

---

## 🔴 CRITICAL ISSUES (Immediate Action Required)

### 1. Password Stored in sessionStorage
**Severity:** CRITICAL
**Location:** `src/hooks/useAuth.ts:88, 112, 134`

**Issue:**
```typescript
sessionStorage.setItem(`lingo_session_${user.uid}`, password);
```

User passwords are stored in plaintext in sessionStorage. This is a **critical security vulnerability** because:

- **XSS Attacks:** Any XSS vulnerability could steal all user passwords
- **Browser Extensions:** Malicious extensions can read sessionStorage
- **Developer Tools:** Passwords visible in browser dev tools
- **No Encryption:** Completely unencrypted storage
- **Session Persistence:** Available until browser closed

**Impact:** Complete account compromise, ability to decrypt all messages

**Recommendation:**
```typescript
// REMOVE password from sessionStorage entirely
// Option 1: Re-prompt for password when needed
// Option 2: Use WebCrypto to derive session keys from password on-demand
// Option 3: Implement proper session management with short-lived tokens

// Example secure approach:
async function deriveSessionKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: userSalt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

### 2. Translation API Has No Authentication
**Severity:** CRITICAL
**Location:** `src/app/api/translate/route.ts`

**Issue:**
The `/api/translate` endpoint accepts any request without authentication:

```typescript
export async function POST(request: NextRequest) {
  const { text, targetLanguage } = await request.json();
  // NO AUTH CHECK!
  const message = await anthropic.messages.create({...});
}
```

**Impact:**
- **Cost Abuse:** Attackers can drain your Anthropic API credits
- **API Key Exposure:** Unlimited free translation for anyone who finds the endpoint
- **Rate Limit Exhaustion:** Can exhaust your API quota
- **DoS Attacks:** Can make your API key rate-limited/blocked

**Recommendation:**
```typescript
import { auth } from '@/lib/firebase';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: NextRequest) {
  // Verify Firebase Auth token
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);

    // Add rate limiting per user
    const { text, targetLanguage } = await request.json();

    // Input validation
    if (!text || text.length > 5000) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Proceed with translation...
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

---

## 🟠 HIGH PRIORITY ISSUES

### 3. Private Keys Stored in localStorage
**Severity:** HIGH
**Location:** `src/utils/encryption.ts:166`

**Issue:**
Encrypted private keys are stored in localStorage, which is accessible to:
- XSS attacks
- Malicious browser extensions
- Other scripts on the same origin

**Current Implementation:**
```typescript
localStorage.setItem(`lingo_pk_${userId}`, encryptedKey);
```

**Impact:** While the keys are encrypted with the user's password, localStorage is still vulnerable to:
- XSS attacks that could exfiltrate encrypted keys
- Persistence across sessions (no expiration)
- No integrity protection

**Recommendation:**
```typescript
// Option 1: Use IndexedDB with encryption
// Option 2: Implement key rotation with short-lived derived keys
// Option 3: Add integrity checks (HMAC) to detect tampering

async function storePrivateKeySecure(userId: string, privateKey: string, password: string) {
  const encryptedKey = await encryptPrivateKey(privateKey, password);

  // Add HMAC for integrity
  const hmacKey = await deriveHMACKey(password);
  const hmac = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    new TextEncoder().encode(encryptedKey)
  );

  const secureBlob = {
    encryptedKey,
    hmac: btoa(String.fromCharCode(...new Uint8Array(hmac))),
    version: 1,
    timestamp: Date.now()
  };

  localStorage.setItem(`lingo_pk_${userId}`, JSON.stringify(secureBlob));
}
```

### 4. No Rate Limiting on Any Endpoints
**Severity:** HIGH
**Location:** All API routes

**Issue:** No rate limiting implemented anywhere in the application.

**Impact:**
- Brute force attacks on authentication
- API abuse and cost exploitation
- DoS attacks
- Account enumeration

**Recommendation:**
```typescript
// Install: npm install @upstash/ratelimit @upstash/redis

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Continue with request...
}
```

### 5. Firestore Rules Allow Contact List Manipulation
**Severity:** HIGH
**Location:** `firestore.rules:8-18`

**Issue:**
The rules allow any authenticated user to add/remove themselves from another user's contacts:

```javascript
allow update: if request.auth != null && (
  // Can add themselves to another user's contacts
  (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['contacts']) &&
   request.auth.uid in request.resource.data.contacts) ||
  // Can remove themselves from another user's contacts
  (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['contacts']) &&
   request.auth.uid in resource.data.contacts &&
   !(request.auth.uid in request.resource.data.contacts))
);
```

**Impact:**
- Users can be added to contacts without consent
- Potential for spam/harassment
- Contact list pollution
- No contact request/approval flow

**Recommendation:**
```javascript
// Implement proper contact management with requests
match /users/{userId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && request.auth.uid == userId;
  allow delete: if request.auth != null && request.auth.uid == userId;
}

// Add new collection for contact requests
match /contactRequests/{requestId} {
  allow create: if request.auth != null &&
                   request.resource.data.fromUserId == request.auth.uid;
  allow read: if request.auth != null &&
                 (request.auth.uid == resource.data.fromUserId ||
                  request.auth.uid == resource.data.toUserId);
  allow update: if request.auth != null &&
                   request.auth.uid == resource.data.toUserId;
  allow delete: if request.auth != null &&
                   (request.auth.uid == resource.data.fromUserId ||
                    request.auth.uid == resource.data.toUserId);
}
```

### 6. No Multi-Factor Authentication (MFA)
**Severity:** HIGH
**Location:** Authentication system

**Issue:** No MFA/2FA implementation. Single factor (password) is the only protection.

**Impact:**
- Account takeover via password compromise
- No additional security layer for sensitive operations
- Increased risk from phishing attacks

**Recommendation:**
```typescript
// Implement Firebase MFA
import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator
} from 'firebase/auth';

async function enrollMFA(user: FirebaseUser, phoneNumber: string) {
  const multiFactorSession = await multiFactor(user).getSession();
  const phoneAuthProvider = new PhoneAuthProvider(auth);

  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    phoneNumber,
    multiFactorSession
  );

  // User enters verification code
  const verificationCode = await promptUserForCode();
  const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

  await multiFactor(user).enroll(multiFactorAssertion, 'Phone Number');
}
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 7. Translation API Has No Input Validation
**Severity:** MEDIUM
**Location:** `src/app/api/translate/route.ts:10`

**Issue:**
```typescript
const { text, targetLanguage } = await request.json();
// No validation of text length, content, or language code
```

**Impact:**
- Excessive API costs from large inputs
- Potential injection if language code is misused
- Server resource exhaustion

**Recommendation:**
```typescript
const MAX_TEXT_LENGTH = 5000;
const ALLOWED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'sv'];

const { text, targetLanguage } = await request.json();

if (!text || typeof text !== 'string' || text.length > MAX_TEXT_LENGTH) {
  return NextResponse.json(
    { error: `Text must be a string between 1 and ${MAX_TEXT_LENGTH} characters` },
    { status: 400 }
  );
}

if (!targetLanguage || !ALLOWED_LANGUAGES.includes(targetLanguage)) {
  return NextResponse.json(
    { error: 'Invalid target language' },
    { status: 400 }
  );
}
```

### 8. PBKDF2 Iterations Could Be Higher
**Severity:** MEDIUM
**Location:** `src/utils/encryption.ts:37`

**Issue:**
```typescript
iterations: 100000, // OWASP recommends 600,000+ for PBKDF2-SHA256
```

**Impact:** Faster brute-force attacks on passwords if encrypted keys are stolen

**Recommendation:**
```typescript
// Increase to OWASP 2023 recommendations
{
  name: 'PBKDF2',
  salt: salt,
  iterations: 600000, // OWASP 2023 recommendation
  hash: 'SHA-256',
}
```

### 9. No Content Security Policy (CSP)
**Severity:** MEDIUM
**Location:** Security headers

**Issue:** No CSP headers configured to prevent XSS attacks.

**Impact:** Increased XSS risk, no defense-in-depth

**Recommendation:**
```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust based on needs
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.anthropic.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};
```

### 10. Recovery Code Generation Uses Limited Entropy
**Severity:** MEDIUM
**Location:** `src/utils/encryption.ts:236-255`

**Issue:**
Recovery codes use only 36 words and 6 selections, providing ~31 bits of entropy:
```typescript
const wordList = ['alpha', 'bravo', ...]; // 36 words
const randomValues = new Uint32Array(6); // 6 words
// Entropy: log2(36^6) ≈ 31 bits
```

**Impact:** Recovery codes may be vulnerable to brute force attacks

**Recommendation:**
```typescript
// Use BIP39 standard wordlist (2048 words) for higher entropy
import { generateMnemonic } from 'bip39';

function generateRecoveryCode(): string {
  // Generates 12-word mnemonic with 128 bits of entropy
  return generateMnemonic(128);
}

// Or expand current wordlist:
const BIP39_WORDLIST = [...]; // 2048 words
const randomValues = new Uint32Array(12); // 12 words
// Entropy: log2(2048^12) ≈ 132 bits
```

### 11. No HTTPS Enforcement in Code
**Severity:** MEDIUM
**Location:** Application configuration

**Issue:** No code-level HTTPS enforcement. Relies on deployment platform.

**Recommendation:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production' &&
      request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }

  return NextResponse.next();
}
```

---

## 🔵 LOW PRIORITY ISSUES

### 12. Console Logging Contains Debug Information
**Severity:** LOW
**Location:** Multiple files

**Issue:** Debug console.log statements throughout production code:
- `src/hooks/useAuth.ts:89, 90, 113`
- `src/lib/db.ts:103, 121, 126, 131`
- `src/hooks/useMessages.ts:89`

**Recommendation:**
```typescript
// Remove all console.log statements or use proper logging
// Install: npm install winston

import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Usage:
logger.debug('[useAuth] Password stored');
logger.error('[db] Failed to send message:', error);
```

### 13. No Account Lockout After Failed Login Attempts
**Severity:** LOW
**Location:** Authentication flow

**Issue:** No account lockout mechanism after repeated failed login attempts.

**Recommendation:** Implement progressive delays or account lockout using Firebase Auth policies or custom logic.

### 14. Key Fingerprints Use Only 8 Bytes
**Severity:** LOW
**Location:** `src/utils/encryption.ts:275-279`

**Issue:**
```typescript
const fingerprint = naclUtil.encodeBase64(hash.slice(0, 8));
return fingerprint.slice(0, 12).toUpperCase();
```

Only 8 bytes (64 bits) of the hash are used for fingerprints.

**Recommendation:** Use at least 16 bytes (128 bits) for stronger collision resistance.

---

## ℹ️ INFORMATIONAL FINDINGS

### 15. No Session Timeout
Users remain logged in indefinitely with no automatic session expiration.

**Recommendation:** Implement session timeout with Firebase Auth token refresh limits.

### 16. No Audit Logging
No security event logging (logins, failed attempts, key operations).

**Recommendation:** Implement audit logging for security-sensitive operations.

### 17. Private Key Cache Never Cleared
In-memory private key cache (`privateKeyCache`) persists until page reload.

**Recommendation:** Clear cache on logout or implement TTL.

### 18. No Key Rotation Mechanism
No ability to rotate encryption keys.

**Recommendation:** Plan for future key rotation support.

### 19. Recovery Codes Not Stored Securely
Recovery codes shown once but not hashed in any persistent storage for verification.

**Recommendation:** If recovery codes need verification, store bcrypt hashes.

### 20. No Subresource Integrity (SRI)
External resources loaded without SRI checks.

**Recommendation:** Add SRI hashes for any CDN resources.

---

## ✅ POSITIVE SECURITY FINDINGS

1. **Strong Encryption:** NaCl (Curve25519-XSalsa20-Poly1305) is cryptographically sound
2. **End-to-End Encryption:** Properly implemented with per-recipient encryption
3. **Password Encryption:** Private keys encrypted before storage with AES-GCM-256
4. **Firestore Rules:** Good conversation/message isolation based on participants
5. **No Vulnerable Dependencies:** npm audit shows 0 vulnerabilities in production
6. **XSS Protection:** React's built-in escaping, no dangerouslySetInnerHTML found
7. **Git Security:** .env.local properly gitignored, no secrets in repository
8. **Environment Variables:** Proper separation of public/private configuration
9. **Input Handling:** React prevents most injection attacks automatically
10. **Secure Random:** Uses `crypto.getRandomValues()` for nonces and salts

---

## PRIORITY REMEDIATION ROADMAP

### Immediate (Next 24 hours)
1. ✅ **Remove password from sessionStorage** - CRITICAL
2. ✅ **Add authentication to /api/translate** - CRITICAL
3. ✅ **Implement rate limiting** - HIGH

### Short-term (Next week)
4. ✅ **Add input validation to translation API** - MEDIUM
5. ✅ **Implement proper CSP headers** - MEDIUM
6. ✅ **Fix contact manipulation in Firestore rules** - HIGH
7. ✅ **Increase PBKDF2 iterations to 600k** - MEDIUM

### Medium-term (Next month)
8. ✅ **Implement MFA/2FA** - HIGH
9. ✅ **Add integrity checks to private key storage** - HIGH
10. ✅ **Implement audit logging** - INFORMATIONAL
11. ✅ **Add session timeout** - INFORMATIONAL

### Long-term (Next quarter)
12. ✅ **Implement key rotation** - INFORMATIONAL
13. ✅ **Add proper contact request flow** - MEDIUM
14. ✅ **Implement account lockout** - LOW

---

## TESTING RECOMMENDATIONS

### Security Testing Checklist

- [ ] Penetration testing for XSS vulnerabilities
- [ ] API fuzzing and authentication bypass testing
- [ ] Firestore rules testing with various user permissions
- [ ] Encryption key lifecycle testing
- [ ] Session management security testing
- [ ] Rate limiting effectiveness testing
- [ ] Recovery code generation randomness testing
- [ ] HTTPS/TLS configuration review
- [ ] Dependency scanning (automated via npm audit)
- [ ] Code static analysis (consider SonarQube)

---

## COMPLIANCE CONSIDERATIONS

### GDPR
- ✅ Users can delete their accounts
- ✅ Data is encrypted at rest and in transit
- ⚠️ No clear data retention/deletion policies documented
- ⚠️ No privacy policy or terms of service

### CCPA
- ⚠️ No mechanism for users to export their data
- ⚠️ No privacy controls beyond basic account settings

### HIPAA (if handling health data)
- ❌ Current implementation NOT HIPAA compliant
- ❌ Would require Business Associate Agreement
- ❌ Would need comprehensive audit logging
- ❌ Would need encryption key escrow/recovery

---

## CONCLUSION

Lingo demonstrates **strong cryptographic implementation** with proper end-to-end encryption using industry-standard algorithms. However, **critical vulnerabilities** in authentication security (password storage) and API security (no authentication on translation endpoint) pose immediate risks that must be addressed before production deployment.

The application would benefit significantly from:
1. Removing plaintext password storage
2. Implementing comprehensive authentication on all API endpoints
3. Adding rate limiting and input validation
4. Implementing multi-factor authentication
5. Proper security headers and CSP

**Recommended Action:** Address all CRITICAL and HIGH priority issues before launching to production users.

---

**Report End**
*Generated: 2025-10-07*
*Next Review Recommended: After critical issues resolved*
