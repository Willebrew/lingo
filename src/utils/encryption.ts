import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import type { EncryptionKeys } from '@/types';

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
    console.log('[encryption] Decrypting private key...');
    const combined = naclUtil.decodeBase64(encryptedPrivateKey);
    console.log('[encryption] Decoded encrypted key, length:', combined.length);
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    console.log('[encryption] Deriving key from password...');
    const key = await deriveKeyFromPassword(password, salt);

    console.log('[encryption] Attempting AES-GCM decryption...');
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    const result = decoder.decode(decryptedData);
    console.log('[encryption] Decryption successful');
    return result;
  } catch (error) {
    console.error('[encryption] Decryption failed:', error);
    console.error('[encryption] This usually means wrong password or corrupted encrypted key');
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
 * Returns recovery code that user MUST save
 */
export async function storePrivateKey(userId: string, privateKey: string, password: string): Promise<string> {
  if (typeof window !== 'undefined') {
    const encryptedKey = await encryptPrivateKey(privateKey, password);
    localStorage.setItem(`lingo_pk_${userId}`, encryptedKey);

    // Store backup recovery code (encrypted)
    const recoveryCode = generateRecoveryCode();
    const encryptedRecovery = await encryptPrivateKey(privateKey, recoveryCode);
    localStorage.setItem(`lingo_recovery_${userId}`, encryptedRecovery);

    // Return recovery code to user (they must save it!)
    return recoveryCode;
  }
  return '';
}

/**
 * Retrieve and decrypt private key from localStorage
 */
export async function getPrivateKey(userId: string, password: string): Promise<string | null> {
  if (typeof window !== 'undefined') {
    console.log('[encryption] Getting private key for user:', userId);
    const encryptedKey = localStorage.getItem(`lingo_pk_${userId}`);
    if (!encryptedKey) {
      console.error('[encryption] No encrypted private key found in localStorage');
      return null;
    }

    console.log('[encryption] Found encrypted key, attempting to decrypt...');
    const decrypted = await decryptPrivateKey(encryptedKey, password);
    if (decrypted) {
      console.log('[encryption] Private key decrypted successfully');
    } else {
      console.error('[encryption] Failed to decrypt private key - wrong password or corrupted key');
    }
    return decrypted;
  }
  return null;
}

/**
 * Recover private key using recovery code
 */
export async function recoverPrivateKey(userId: string, recoveryCode: string): Promise<string | null> {
  if (typeof window !== 'undefined') {
    const encryptedRecovery = localStorage.getItem(`lingo_recovery_${userId}`);
    if (!encryptedRecovery) return null;

    return await decryptPrivateKey(encryptedRecovery, recoveryCode);
  }
  return null;
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
 * Remove private key from localStorage
 */
export function removePrivateKey(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`lingo_pk_${userId}`);
    localStorage.removeItem(`lingo_recovery_${userId}`);
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
