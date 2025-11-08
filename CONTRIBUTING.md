# Contributing to nextjs-telegram-notify

Thank you for your interest in contributing! 🎉

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm
- A Telegram bot token (for testing)

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/nextjs-telegram-notify.git
   cd nextjs-telegram-notify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the package**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Test with the example app**
   ```bash
   cd examples/basic
   npm install
   cp .env.example .env
   # Add your Telegram credentials
   npm run dev
   ```

## Development Workflow

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Run tests**
   ```bash
   npm run test:coverage
   ```

4. **Type check**
   ```bash
   npm run typecheck
   ```

5. **Build the package**
   ```bash
   npm run build
   ```

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test updates
- `chore:` - Build/tooling changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements

**Examples:**
```bash
git commit -m "feat: add support for inline keyboards"
git commit -m "fix: handle rate limit 429 errors properly"
git commit -m "docs: update API reference for new options"
```

### Pull Request Process

1. **Update documentation**
   - Update README.md if needed
   - Add entries to CHANGELOG.md
   - Update API documentation

2. **Ensure tests pass**
   - All existing tests pass
   - New tests cover your changes
   - Code coverage doesn't decrease

3. **Submit Pull Request**
   - Fill out the PR template
   - Link related issues
   - Request review from maintainers

4. **Address feedback**
   - Respond to review comments
   - Make requested changes
   - Push updates to your branch

## Project Structure

```
nextjs-telegram-notify/
├── src/
│   ├── hooks/           # Client-side React hooks
│   ├── lib/             # Utility functions
│   ├── route/           # API route handlers
│   ├── server/          # Server-side functions
│   └── types/           # TypeScript types
├── tests/               # Test files
├── examples/            # Example applications
└── dist/                # Built files (generated)
```

## Code Style

- **TypeScript**: Use strict mode, avoid `any` types
- **Formatting**: Follow existing patterns
- **Comments**: Add JSDoc comments for public APIs
- **Naming**: Use descriptive, camelCase names
- **Functions**: Keep functions small and focused

## Testing

### Writing Tests

1. **Unit tests** for utility functions
   ```typescript
   describe('formatMessageWithTimestamp', () => {
     it('should add timestamp to message', () => {
       const result = formatMessageWithTimestamp('Hello');
       expect(result).toContain('Hello');
       expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
     });
   });
   ```

2. **Integration tests** for API handlers
   ```typescript
   describe('POST /api/telegram-notify', () => {
     it('should send notification', async () => {
       const response = await handler(mockRequest);
       expect(response.status).toBe(200);
     });
   });
   ```

3. **Run specific tests**
   ```bash
   npm test -- formatter.test.ts
   npm test -- -t "should handle rate limiting"
   ```

## Documentation

### README Updates

- Keep examples clear and concise
- Test all code examples
- Update table of contents
- Add screenshots/GIFs when helpful

### API Documentation

- Use JSDoc comments
- Include parameter descriptions
- Provide usage examples
- Document return types

### CHANGELOG

Follow [Keep a Changelog](https://keepachangelog.com/):

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- Breaking change description

### Fixed
- Bug fix description
```

## Reporting Issues

### Bug Reports

Include:
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Step-by-step instructions
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Node.js version, OS, Next.js version
- **Code Sample**: Minimal reproducible example

### Feature Requests

Include:
- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Examples**: Similar features in other libraries

## Release Process

Maintainers only:

1. **Update version**
   ```bash
   npm version [patch|minor|major]
   ```

2. **Update CHANGELOG.md**
   - Move items from `[Unreleased]` to new version section
   - Add release date

3. **Create release on GitHub**
   - Tag format: `v1.2.3`
   - Include changelog in release notes

4. **Publish to npm** (automated via GitHub Actions)
   - Triggered by GitHub release
   - Publishes to npm with provenance

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security**: Email security@example.com (don't use public issues)
- **Chat**: Join our Discord (coming soon)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## Recognition

Contributors are recognized in:
- GitHub Contributors page
- CHANGELOG.md credits
- README.md acknowledgments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making nextjs-telegram-notify better! 🙏
