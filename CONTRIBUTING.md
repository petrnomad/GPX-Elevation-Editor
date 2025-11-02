# Contributing to Elevation Editor

First off, thank you for considering contributing to Elevation Editor! It's people like you that make this tool better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Commit Messages](#commit-messages)

## 📜 Code of Conduct

This project and everyone participating in it is governed by common sense and mutual respect. By participating, you are expected to uphold this code.

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (GPX files, screenshots, etc.)
- **Describe the behavior you observed and what you expected**
- **Include browser version and OS**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other tools**

### Your First Code Contribution

Unsure where to begin? Look for issues tagged with:
- `good first issue` - Simple issues perfect for newcomers
- `help wanted` - Issues where we need community help

### Pull Requests

- Fill in the required template
- Follow the coding standards
- Include screenshots for UI changes
- Update documentation if needed
- Add tests if applicable

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Git

### Setup Steps

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/petrnomad/GPX-Elevation-Editor.git
   cd GPX-Elevation-Editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🔄 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Add comments for complex logic

3. **Test your changes**
   - Manually test all affected functionality
   - Ensure no console errors
   - Test in different browsers if UI changes

4. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Use a clear title
   - Describe what changed and why
   - Reference any related issues
   - Add screenshots for visual changes

## 💻 Coding Standards

### TypeScript

- **Use TypeScript** - No plain JavaScript
- **Type everything** - Avoid `any` types
- **Use interfaces** - For object shapes
- **Document public APIs** - Use JSDoc comments

### React

- **Functional components** - Use hooks
- **Custom hooks** - For reusable logic
- **Prop types** - Always type component props
- **Component structure**:
  ```typescript
  // Imports
  import { useState } from 'react';

  // Types
  interface MyComponentProps {
    title: string;
  }

  // Component
  export function MyComponent({ title }: MyComponentProps) {
    // Hooks
    const [state, setState] = useState();

    // Event handlers
    const handleClick = () => {};

    // Render
    return <div>{title}</div>;
  }
  ```

### Styling

- **Use Tailwind CSS** - Utility-first approach
- **Component variants** - Use `cn()` utility
- **Responsive design** - Mobile-first approach
- **Dark mode support** - Use Tailwind dark: prefix

### File Organization

- **Group by feature** - Not by file type
- **Index files** - For clean exports
- **Naming conventions**:
  - Components: `PascalCase.tsx`
  - Hooks: `useCamelCase.ts`
  - Utils: `camelCase.ts`
  - Constants: `UPPER_SNAKE_CASE`

## 📁 Project Structure

```
elevation-editor/
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── elevation-editor/   # Main feature
│   │   ├── algorithms/     # Core algorithms
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilities
│   │   ├── constants.ts    # Config
│   │   └── types.ts        # Types
│   └── ui/                 # Shared UI components
├── lib/                    # Core libraries
└── public/                 # Static assets
```

### Adding New Features

1. **Create feature branch** from `main`
2. **Add files** in appropriate directories
3. **Export** from index files
4. **Document** with comments
5. **Test** thoroughly
6. **Submit PR**

## 🧪 Testing

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Works in Chrome, Firefox, Safari
- [ ] Dark mode works correctly
- [ ] Accessibility (keyboard navigation)

### Unit Tests

If adding complex algorithms:

```typescript
describe('MyFeature', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected);
  });
});
```

## 📝 Commit Messages

Follow conventional commits format:

```
type(scope): subject

body

footer
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Build/config changes

### Examples

```
feat(chart): add zoom controls
fix(parser): handle missing timestamps
docs(readme): update installation steps
refactor(hooks): extract useChartInteractions
```

## 🐛 Bug Triage

### Priority Levels

- **Critical**: App is broken, data loss
- **High**: Major feature broken
- **Medium**: Minor feature issue
- **Low**: Cosmetic issue, typo

### Labels

- `bug` - Something isn't working
- `enhancement` - New feature request
- `documentation` - Docs improvements
- `good first issue` - Good for newcomers
- `help wanted` - Need community help
- `question` - Question about usage

## 💡 Tips

- **Start small** - Don't try to refactor everything
- **Ask questions** - Better to ask than guess
- **Be patient** - Reviews take time
- **Have fun** - We're here to learn and build!

## 📧 Contact

- **Email**: jsem@petrnovak.com
- **GitHub Issues**: For bugs and features
- **Discussions**: For questions and ideas

## 🙏 Thank You

Your contributions make this project better for everyone. Whether it's:
- Fixing a typo
- Reporting a bug
- Suggesting a feature
- Writing code

Every contribution matters. Thank you! ❤️

---

**Ready to contribute?** Fork the repo and start coding! 🚀
