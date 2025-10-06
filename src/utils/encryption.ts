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
 * Store private key securely in localStorage
 */
export function storePrivateKey(userId: string, privateKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`lingo_pk_${userId}`, privateKey);
  }
}

/**
 * Retrieve private key from localStorage
 */
export function getPrivateKey(userId: string): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`lingo_pk_${userId}`);
  }
  return null;
}

/**
 * Remove private key from localStorage
 */
export function removePrivateKey(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`lingo_pk_${userId}`);
  }
}
