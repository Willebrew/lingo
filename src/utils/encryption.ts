import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import type { EncryptionKeys } from '@/types';

// Cache for decrypted private keys to avoid expensive re-decryption
const privateKeyCache = new Map<string, string>();

/**
 * Generate a new encryption key pair for E2E encryption
 */
export function generateKeyPair(): EncryptionKeys {
  const keyPair = nacl.box.keyPair();

  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    privateKey: naclUtil.encodeBase64(keyPair.secretKey),
  };
}

/**
 * Derive encryption key from password using PBKDF2
 * @param iterations - Number of PBKDF2 iterations (100k for legacy, 600k for new keys)
 */
async function deriveKeyFromPassword(password: string, salt: Uint8Array, iterations: number = 600000): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive HMAC key from password for integrity checks
 * @param iterations - Number of PBKDF2 iterations (should match encryption key)
 */
async function deriveHMACKey(password: string, salt: Uint8Array, iterations: number = 600000): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Encrypt private key with password before storage
 * Includes HMAC for integrity protection
 * Uses 600,000 PBKDF2 iterations (OWASP 2023)
 */
async function encryptPrivateKey(privateKey: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = 600000; // OWASP 2023 recommendation
  const key = await deriveKeyFromPassword(password, salt, iterations);

  const encoder = new TextEncoder();
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(privateKey)
  );

  // Generate HMAC for integrity
  const hmacKey = await deriveHMACKey(password, salt, iterations);
  const dataToSign = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  dataToSign.set(salt, 0);
  dataToSign.set(iv, salt.length);
  dataToSign.set(new Uint8Array(encryptedData), salt.length + iv.length);

  const hmacSignature = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    dataToSign
  );

  // Combine: version(1) + salt(16) + iv(12) + encrypted data + hmac(32)
  const version = new Uint8Array([2]); // Version 2 with HMAC + 600k iterations
  const combined = new Uint8Array(1 + salt.length + iv.length + encryptedData.byteLength + hmacSignature.byteLength);
  combined.set(version, 0);
  combined.set(salt, 1);
  combined.set(iv, 1 + salt.length);
  combined.set(new Uint8Array(encryptedData), 1 + salt.length + iv.length);
  combined.set(new Uint8Array(hmacSignature), 1 + salt.length + iv.length + encryptedData.byteLength);

  return naclUtil.encodeBase64(combined);
}

/**
 * Decrypt private key with password
 * Verifies HMAC integrity for version 2+ keys
 * Handles legacy keys with 100k iterations and new keys with 600k
 */
async function decryptPrivateKey(encryptedPrivateKey: string, password: string): Promise<string | null> {
  try {
    const combined = naclUtil.decodeBase64(encryptedPrivateKey);

    // Check version
    const version = combined[0];

    if (version === 2) {
      // Version 2: HMAC integrity check + 600k iterations (OWASP 2023)
      const salt = combined.slice(1, 17);
      const iv = combined.slice(17, 29);
      const hmacSize = 32; // SHA-256 HMAC is 32 bytes
      const data = combined.slice(29, combined.length - hmacSize);
      const storedHmac = combined.slice(combined.length - hmacSize);
      const iterations = 600000;

      // Verify HMAC
      const hmacKey = await deriveHMACKey(password, salt, iterations);
      const dataToVerify = combined.slice(1, combined.length - hmacSize);

      const isValid = await crypto.subtle.verify(
        'HMAC',
        hmacKey,
        storedHmac,
        dataToVerify
      );

      if (!isValid) {
        console.error('[encryption] HMAC verification failed - data may be tampered');
        return null;
      }

      // Decrypt data with 600k iterations
      const key = await deriveKeyFromPassword(password, salt, iterations);
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } else {
      // Legacy version 1 or unversioned: No HMAC, 100k iterations (backward compatibility)
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);
      const iterations = 100000; // Legacy iteration count

      const key = await deriveKeyFromPassword(password, salt, iterations);
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    }
  } catch (error) {
    console.error('[encryption] Decryption failed:', error);
    return null;
  }
}

/**
 * Encrypt a message for a specific recipient
 */
export function encryptMessage(
  message: string,
  recipientPublicKey: string,
  senderPrivateKey: string
): string {
  const messageUint8 = naclUtil.decodeUTF8(message);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const recipientPublicKeyUint8 = naclUtil.decodeBase64(recipientPublicKey);
  const senderPrivateKeyUint8 = naclUtil.decodeBase64(senderPrivateKey);

  const encrypted = nacl.box(
    messageUint8,
    nonce,
    recipientPublicKeyUint8,
    senderPrivateKeyUint8
  );

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  return naclUtil.encodeBase64(fullMessage);
}

/**
 * Decrypt a message from a specific sender
 */
export function decryptMessage(
  encryptedMessage: string,
  senderPublicKey: string,
  recipientPrivateKey: string
): string | null {
  try {
    const messageWithNonceAsUint8Array = naclUtil.decodeBase64(encryptedMessage);
    const nonce = messageWithNonceAsUint8Array.slice(0, nacl.box.nonceLength);
    const message = messageWithNonceAsUint8Array.slice(nacl.box.nonceLength);

    const senderPublicKeyUint8 = naclUtil.decodeBase64(senderPublicKey);
    const recipientPrivateKeyUint8 = naclUtil.decodeBase64(recipientPrivateKey);

    const decrypted = nacl.box.open(
      message,
      nonce,
      senderPublicKeyUint8,
      recipientPrivateKeyUint8
    );

    if (!decrypted) {
      return null;
    }

    return naclUtil.encodeUTF8(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

/**
 * Store private key securely in localStorage (encrypted with password)
 * Returns the BASE64-ENCODED PRIVATE KEY that user MUST save
 */
export async function storePrivateKey(userId: string, privateKey: string, password: string): Promise<string> {
  if (typeof window !== 'undefined') {
    const encryptedKey = await encryptPrivateKey(privateKey, password);
    localStorage.setItem(`lingo_pk_${userId}`, encryptedKey);
    return privateKey;
  }
  return '';
}

/**
 * Retrieve and decrypt private key from localStorage
 */
export async function getPrivateKey(userId: string, password: string, silent: boolean = false): Promise<string | null> {
  if (typeof window !== 'undefined') {
    // Check cache first
    const cacheKey = `${userId}:${password}`;
    const cached = privateKeyCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const encryptedKey = localStorage.getItem(`lingo_pk_${userId}`);
    if (!encryptedKey) {
      if (!silent) {
        console.error('[encryption] No encrypted private key found in localStorage for user:', userId);
      }
      return null;
    }

    const decrypted = await decryptPrivateKey(encryptedKey, password);
    if (!decrypted && !silent) {
      console.error('[encryption] Failed to decrypt private key for user:', userId);
    }

    // Store in cache if successful
    if (decrypted) {
      privateKeyCache.set(cacheKey, decrypted);
    }

    return decrypted;
  }
  return null;
}

/**
 * Restore private key from saved backup (the actual base64 private key)
 * Verifies the private key matches the user's public key
 */
export async function restorePrivateKey(userId: string, privateKey: string, password: string, userPublicKey: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const trimmedKey = privateKey.trim();

      // Strict validation: Must be valid base64 with no invalid characters
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(trimmedKey)) {
        console.error('[encryption] Invalid private key format - not valid base64');
        return false;
      }

      // Decode and validate length
      let decoded: Uint8Array;
      try {
        decoded = naclUtil.decodeBase64(trimmedKey);
      } catch (e) {
        console.error('[encryption] Failed to decode private key as base64');
        return false;
      }

      if (decoded.length !== nacl.box.secretKeyLength) {
        console.error('[encryption] Invalid private key length:', decoded.length, 'expected:', nacl.box.secretKeyLength);
        return false;
      }

      // CRITICAL: Verify this private key matches the user's public key
      try {
        const keyPair = nacl.box.keyPair.fromSecretKey(decoded);
        const derivedPublicKey = naclUtil.encodeBase64(keyPair.publicKey);

        if (derivedPublicKey !== userPublicKey) {
          console.error('[encryption] Private key does not match user\'s public key');
          return false;
        }
      } catch (e) {
        console.error('[encryption] Failed to derive public key from private key');
        return false;
      }

      // Store it encrypted with password
      const encryptedKey = await encryptPrivateKey(trimmedKey, password);
      localStorage.setItem(`lingo_pk_${userId}`, encryptedKey);

      return true;
    } catch (error) {
      console.error('[encryption] Failed to restore private key:', error);
      return false;
    }
  }
  return false;
}

/**
 * Generate a cryptographically secure random recovery code
 */
function generateRecoveryCode(): string {
  const words: string[] = [];
  const wordList = [
    'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
    'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
    'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray',
    'yankee', 'zulu', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
    'eight', 'nine'
  ];

  // Use crypto.getRandomValues for cryptographic randomness
  const randomValues = new Uint32Array(6);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < 6; i++) {
    words.push(wordList[randomValues[i] % wordList.length]);
  }

  return words.join('-');
}

/**
 * Remove private key from localStorage and cache
 */
export function removePrivateKey(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`lingo_pk_${userId}`);
    // Clear all cache entries for this user
    for (const key of privateKeyCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        privateKeyCache.delete(key);
      }
    }
  }
}

/**
 * Generate key fingerprint for verification
 */
export function generateKeyFingerprint(publicKey: string): string {
  const hash = nacl.hash(naclUtil.decodeBase64(publicKey));
  const fingerprint = naclUtil.encodeBase64(hash.slice(0, 8));
  return fingerprint.slice(0, 12).toUpperCase();
}
