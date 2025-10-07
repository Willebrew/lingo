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
 */
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
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
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt private key with password before storage
 */
async function encryptPrivateKey(privateKey: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);

  const encoder = new TextEncoder();
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(privateKey)
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

  return naclUtil.encodeBase64(combined);
}

/**
 * Decrypt private key with password
 */
async function decryptPrivateKey(encryptedPrivateKey: string, password: string): Promise<string | null> {
  try {
    const combined = naclUtil.decodeBase64(encryptedPrivateKey);
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const key = await deriveKeyFromPassword(password, salt);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    const result = decoder.decode(decryptedData);
    return result;
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
        console.error('[encryption] No encrypted private key found in localStorage');
      }
      return null;
    }

    const decrypted = await decryptPrivateKey(encryptedKey, password);
    if (!decrypted && !silent) {
      console.error('[encryption] Failed to decrypt private key');
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
 */
export async function restorePrivateKey(userId: string, privateKey: string, password: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      // Validate that the private key is valid base64 and correct length
      const decoded = naclUtil.decodeBase64(privateKey.trim());
      if (decoded.length !== nacl.box.secretKeyLength) {
        console.error('[encryption] Invalid private key length:', decoded.length);
        return false;
      }

      // Store it encrypted with password
      const encryptedKey = await encryptPrivateKey(privateKey.trim(), password);
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
