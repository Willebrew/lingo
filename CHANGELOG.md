# Changelog

## [1.0.0] - 2025-10-07

### Added
- End-to-end encrypted messaging with NaCl encryption
- AI-powered translation using Claude Sonnet 4.5
- Real-time messaging with Firebase Firestore
- Group chat support with participant management
- Custom conversation naming
- Key recovery system with base64 recovery codes
- Dark mode with system preference detection
- Mobile-optimized UI with bottom navigation
- Smart notifications with unread counts
- Contact management system

### Security
- PBKDF2 key derivation with 600,000 iterations
- Private key ownership verification
- Password-encrypted private keys
- Session-based password persistence (cleared on browser close)
- Firestore security rules enforcing E2E encryption
- Server-side authentication for translation API

### Fixed
- Critical password persistence issue causing app breakage on refresh
- Private key validation now verifies cryptographic ownership
- Translation button positioning and dropdown off-screen issues
- Sidebar delete button centering and visual artifacts
- Double toast notifications on conversation deletion
- Mobile input box visibility with bottom navigation
- Firebase Admin lazy initialization for Vercel builds
- Translation API error handling with user-friendly messages

### Documentation
- Complete setup guide with Firebase Admin SDK instructions
- Deployment instructions for Vercel
- Security documentation
- Troubleshooting section
