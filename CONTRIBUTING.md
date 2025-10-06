# Contributing to Lingo

Thank you for your interest in contributing to Lingo! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what's best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (browser, OS, etc.)

### Suggesting Features

1. Check if the feature has been suggested in Issues
2. Create a new issue with:
   - Clear description of the feature
   - Why it would be useful
   - Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m "Add: new feature description"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/lingo.git
cd lingo

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Fill in your Firebase and Anthropic credentials

# Run development server
npm run dev
```

### Coding Standards

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Write reusable components

### Component Guidelines

- Use functional components with hooks
- Implement proper TypeScript types
- Use Tailwind CSS for styling
- Add animations with Framer Motion
- Make components responsive
- Handle loading and error states

### Commit Message Format

```
Type: Short description

Longer description if needed

Types:
- Add: New feature
- Fix: Bug fix
- Update: Improve existing feature
- Refactor: Code restructuring
- Docs: Documentation changes
- Style: Code style changes
- Test: Add or update tests
```

### Testing Checklist

Before submitting a PR, ensure:

- [ ] Code builds without errors
- [ ] No TypeScript errors
- [ ] Tested on Chrome, Firefox, and Safari
- [ ] Tested on mobile devices
- [ ] Authentication works
- [ ] Messages send and receive correctly
- [ ] Encryption/decryption works
- [ ] Translation feature works
- [ ] Dark mode works
- [ ] Responsive design works

## Project Structure

```
src/
├── app/          # Next.js app router
├── components/   # React components
├── hooks/        # Custom hooks
├── lib/          # Libraries (Firebase, DB)
├── store/        # State management
├── types/        # TypeScript types
└── utils/        # Utility functions
```

## Key Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Firebase** - Backend (Firestore + Auth)
- **TweetNaCl** - End-to-end encryption
- **Anthropic Claude** - AI translation
- **Zustand** - State management

## Areas for Contribution

### High Priority

- [ ] Implement key backup/recovery
- [ ] Add message search functionality
- [ ] Add file/image sharing
- [ ] Improve encryption key management
- [ ] Add group chat support
- [ ] Add voice/video calling
- [ ] Add notification system

### Medium Priority

- [ ] Add message reactions
- [ ] Add typing indicators
- [ ] Add read receipts
- [ ] Add user status (online/offline)
- [ ] Add profile customization
- [ ] Add conversation settings
- [ ] Improve mobile UX

### Nice to Have

- [ ] Add more translation languages
- [ ] Add custom themes
- [ ] Add keyboard shortcuts
- [ ] Add message formatting (markdown)
- [ ] Add emoji picker
- [ ] Add GIF support
- [ ] Add chat export

## Security Considerations

When contributing, please consider:

- Never expose private keys or API keys
- Validate all user inputs
- Sanitize data before displaying
- Follow Firebase security best practices
- Review Firestore security rules carefully
- Test authentication edge cases
- Ensure encryption remains unbroken

## Questions?

- Open a Discussion on GitHub
- Check existing Issues and PRs
- Read the README.md and SETUP.md

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Lingo! 🎉
