# 🔒 Security Documentation

## Overview

Lingo implements end-to-end encryption (E2EE) for all messages using industry-standard cryptographic libraries. This document outlines our security architecture, implemented protections, and known limitations.

## Security Model

### Threat Model

**What we protect against:**
- ✅ Server operators reading your messages
- ✅ Database breaches exposing message content
- ✅ Network eavesdroppers intercepting messages
- ✅ XSS attacks stealing private keys (with limitations)
- ✅ Unauthorized users reading your conversations

**What we DON'T fully protect against:**
- ❌ Compromised user devices
- ❌ Malicious browser extensions
- ❌ Forward secrecy (if private key compromised, all past messages readable)
- ❌ Metadata analysis (who talks to whom, when, how often)

## Cryptographic Implementation

### Encryption Algorithm

- **Library:** TweetNaCl (NaCl/libsodium JavaScript port)
- **Algorithm:** Curve25519-XSalsa20-Poly1305 (`nacl.box`)
- **Key Exchange:** Elliptic Curve Diffie-Hellman (ECDH)
- **Authentication:** Poly1305 MAC (prevents tampering)
- **Nonce:** 192-bit random (generated per message)

### Key Management

**Key Generation:**
- Ed25519 key pairs generated client-side only
- 256-bit private keys, never transmitted
- Public keys stored in Firestore for key exchange

**Private Key Storage:**
- Encrypted with user password using PBKDF2 + AES-GCM
- PBKDF2: 100,000 iterations, SHA-256
- AES-GCM: 256-bit key, 96-bit IV, authenticated encryption
- Stored in localStorage (encrypted form only)
- Session password kept in memory (Zustand store)

**Key Recovery:**
- 6-word recovery code generated at signup
- Recovery code encrypts backup copy of private key
- Stored locally (encrypted with recovery code)
- Users MUST save recovery code offline

### Message Encryption

**Process:**
1. Sender retrieves recipient's public key
2. Decrypts own private key with password
3. Encrypts message separately for each recipient
4. Only encrypted ciphertexts stored in Firestore
5. Recipients decrypt with their private keys

**Encryption Per Recipient:**
```
encryptedMessage = nacl.box(
  plaintext,
  nonce,
  recipientPublicKey,
  senderPrivateKey
)
```

## Security Features Implemented

### ✅ Critical Protections

1. **Firestore Security Rules**
   - Messages readable only by conversation participants
   - Verified server-side via Firestore rules
   - Prevents authenticated users from reading others' messages

2. **Password-Encrypted Private Keys**
   - Private keys never stored in plaintext
   - PBKDF2 key derivation (100k iterations)
   - AES-GCM authenticated encryption
   - Mitigates XSS key theft

3. **Key Backup & Recovery**
   - Automatic recovery code generation
   - Offline backup encouraged (copy/download)
   - Alternative decryption path if password forgotten

4. **Translation Warning**
   - Explicit consent required before translation
   - Warns that E2EE is broken during translation
   - User must acknowledge security implications

5. **Key Fingerprint Verification**
   - Public keys have verifiable fingerprints
   - Enables manual MITM detection
   - Future: in-app key verification UI

## Known Limitations & Risks

### 🔴 Critical Limitations

**1. No Forward Secrecy**
- If private key compromised → all past messages readable
- Recommendation: Implement Double Ratchet (Signal Protocol)

**2. localStorage Vulnerabilities**
- Accessible to JavaScript (XSS attacks)
- Cleared if user clears browser data
- Even encrypted keys can be stolen
- Mitigation: Password encryption reduces but doesn't eliminate risk

**3. Translation Breaks E2EE**
- Plaintext sent to server during translation
- Sent to third-party (Anthropic Claude API)
- Warning shown, but user may not understand implications

**4. Metadata Leakage**
- Who talks to whom (participant lists)
- Message timestamps
- Message frequency patterns
- Unencrypted in database

### 🟡 Medium Severity

**5. No Key Rotation**
- Keys used indefinitely
- Compromised key → all future messages compromised

**6. Single Device Limitation**
- Keys tied to single browser/device
- No multi-device sync
- Clear data = permanent message loss (without recovery code)

**7. Public Key Trust**
- No verification that public keys are authentic
- Firestore compromise could swap keys (MITM)
- Mitigation: Key fingerprints (not yet in UI)

**8. Session Password in Memory**
- Password stored in Zustand during session
- Accessible in browser memory
- Could be extracted by malicious extension

## Best Practices for Users

### For Maximum Security:

1. **Use a Strong Password**
   - 12+ characters
   - Mix of letters, numbers, symbols
   - Don't reuse from other services

2. **Save Your Recovery Code**
   - Write it down physically
   - Store in password manager
   - Keep separate from password

3. **Be Cautious with Translation**
   - Only translate when necessary
   - Understand E2EE is broken during translation
   - Sensitive messages: don't translate

4. **Verify Contacts' Keys** (when UI available)
   - Compare key fingerprints manually
   - Especially for sensitive conversations

5. **Use Trusted Devices**
   - Don't use on public/shared computers
   - Keep browser and OS updated
   - Avoid suspicious browser extensions

## Security Audit Findings

### Addressed Issues ✅

- ✅ **Firestore Rules:** Fixed critical flaw allowing any user to read all messages
- ✅ **Private Key Storage:** Implemented password encryption
- ✅ **Key Recovery:** Added recovery code system
- ✅ **Translation Warning:** Explicit E2EE break notification
- ✅ **Key Fingerprints:** Generation function implemented

### Remaining Issues ⚠️

- ⚠️ **Forward Secrecy:** Not implemented (complex, requires Double Ratchet)
- ⚠️ **Key Rotation:** Not implemented
- ⚠️ **Multi-Device:** Not supported
- ⚠️ **Metadata Protection:** No obfuscation

## Recommended Improvements

### High Priority

1. **Implement Forward Secrecy**
   - Use Double Ratchet algorithm (Signal Protocol)
   - Rotating ephemeral keys per message
   - Past messages safe even if current key compromised

2. **Client-Side Translation**
   - Use local translation models (WASM)
   - Keep messages encrypted during translation
   - Fallback to server translation with warning

3. **Key Verification UI**
   - Display key fingerprints in settings
   - In-chat verification flow
   - Visual indicators for verified contacts

### Medium Priority

4. **Key Rotation**
   - Periodic automatic key updates
   - Manual rotation option
   - Secure key migration

5. **Better Key Storage**
   - IndexedDB instead of localStorage
   - Web Crypto API non-exportable keys
   - Hardware security module support (where available)

6. **Session Security**
   - Auto-logout after inactivity
   - Session timeout warnings
   - Secure password clearing from memory

### Low Priority

7. **Metadata Minimization**
   - Obfuscate message timing
   - Padding to hide message lengths
   - Dummy traffic generation

8. **Multi-Device Support**
   - Encrypted key backup to cloud
   - QR code device pairing
   - Per-device keys with cross-signing

## Incident Response

### If You Suspect Compromise:

1. **Change Password Immediately**
   - Generates new encrypted key storage
   - Old encrypted keys become inaccessible

2. **Rotate Encryption Keys**
   - Currently requires new account
   - Future: in-app key rotation

3. **Inform Contacts**
   - Especially for sensitive conversations
   - Verify new keys manually

4. **Review Account Activity**
   - Check for unauthorized conversations
   - Look for suspicious message patterns

## Compliance & Regulations

### GDPR Considerations

- ✅ Data minimization (only encrypted messages stored)
- ✅ User control (can delete account/messages)
- ✅ Data portability (messages downloadable)
- ⚠️ Right to erasure (metadata remains)

### Legal Disclaimer

**This software is provided "as is" without warranty.** While we implement industry-standard encryption, no system is perfectly secure. Users are responsible for:
- Protecting their passwords and recovery codes
- Assessing security needs for their use case
- Understanding the limitations documented here

## Reporting Security Issues

**Found a vulnerability?**
- Email: security@lingo.app (if available)
- GitHub: Open a security advisory (private)
- DO NOT publicly disclose until coordinated

We appreciate responsible disclosure and will credit researchers.

## Version History

- **v1.1.0** (Current) - Password-encrypted keys, recovery codes, Firestore rules fix
- **v1.0.0** - Initial E2EE implementation (insecure private key storage)

---

**Last Updated:** 2025
**Security Contact:** See CONTRIBUTING.md
