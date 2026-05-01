# 📚 Rules Documentation Index

This file serves as the entry point for all project rules and guidelines. The rules are organized into three layers:

## 📂 Structure

```
.kilo/rules/
├── global/              # Universal principles (language/framework agnostic)
│   └── development-philosophy.md  ← Enhanced: Separation & Reusability
├── architecture/        # Platform architecture (tech-agnostic)
│   └── platform-architecture.md   ← Enhanced: Separation & Reusability patterns
└── stack/               # Technology-specific implementation
    ├── react-typescript.md      # Frontend rules ← Enhanced: Separation & Reusability
    └── nodejs-express.md        # Backend rules ← Enhanced: Separation & Reusability
```

## 🎯 Key Focus Areas

### 1. Operation Discipline
- **ALWAYS read before edit** - Open file, view state, understand context
- **Edit with precision** - Minimal, focused changes
- **Verify after edit** - Test, lint, confirm

### 2. Separation of Concern
Each layer and component should have a single, well-defined responsibility:
- **Global**: Principles that apply everywhere
- **Architecture**: System boundaries and integration patterns
- **Stack**: Technology-specific implementations
- **Components**: Single-purpose, focused functionality

### 3. Reusability Principles
Build once, use many - but only when it makes sense:
- **Rule of Three**: Extract when used 3+ times
- **Stable Requirements**: Don't abstract volatile concepts
- **Clear Interfaces**: Well-defined boundaries enable reuse
- **Composition over Inheritance**: Build flexible, combinable pieces

## 🔄 How to Use These Rules

### For New Team Members
1. Read **global/development-philosophy.md** first (esp. Separation & Reusability)
2. Review **architecture/platform-architecture.md** for system boundaries
3. Study stack rules relevant to your work

### When Designing New Features
1. Check: Which layer does this belong in?
2. Ask: Can this be separated into distinct concerns?
3. Ask: Is this reusable? Should it be?
4. Document: Where does it fit in the architecture?

### When Onboarding to a New Stack
- Frontend work: Read **stack/react-typescript.md**
- Backend work: Read **stack/nodejs-express.md**
- Full stack: Read all stack rules + architecture

## 📊 What's New in v2.0

### Enhanced Focus
- ✨ **Separation of Concern**: Detailed layering strategies
- 🔄 **Reusability**: When and how to build reusable components
- 🏗️ **Architecture Patterns**: Reusable system-level abstractions
- ⚛️ **Component Patterns**: Reusable UI and hooks
- 🔧 **Service Patterns**: Reusable backend services

### Key Additions
- Domain-driven design boundaries
- Reusable architecture patterns (Payment, Notification, File Storage)
- Component composition patterns
- Custom hook patterns
- Service coupling avoidance strategies

## 🔍 Quick Reference

### Current Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Node.js + Express + TypeScript + MySQL
- **State**: Zustand (frontend), Database (backend)
- **Auth**: JWT + Passport.js
- **Payments**: M-Pesa (gateway-agnostic abstraction)

### Key Files by Topic

| Topic | File | New Content |
|-------|------|-------------|
| Development philosophy | `global/development-philosophy.md` | ✨ Separation & Reusability |
| System architecture | `architecture/platform-architecture.md` | ✨ Reusable patterns |
| Frontend rules | `stack/react-typescript.md` | ✨ Component & hook patterns |
| Backend rules | `stack/nodejs-express.md` | ✨ Service patterns & DI |
| Payment integration | See stack rules | Gateway abstraction |
| Auth & permissions | `stack/react-typescript.md` | RBAC implementation |

## 🔄 Evolution

These rules evolve through use:

1. **Pattern emerges** in code reviews
2. **Document pattern** as guideline
3. **Apply pattern** consistently
4. **Refine guideline** based on experience
5. **Elevate** to appropriate layer

## 🎓 Learning Resources

### Separation & Reusability Deep Dives
- **Domain-Driven Design**: Bounded contexts and layering
- **Clean Architecture**: Dependency inversion principle
- **Component Composition**: React patterns and best practices
- **Design Patterns**: Strategy, Factory, Decorator

### Project-Specific Examples
- Payment gateway abstraction (reusable service)
- Notification service (cross-cutting concern)
- Generic Table component (reusable UI)
- useData hook (reusable data fetching)

## ❓ Questions?

If you need clarification:
1. Check relevant rule file
2. Search codebase for examples
3. Ask about separation boundaries
4. Discuss reusability trade-offs
5. Document the answer here

## 📈 Rule Hierarchy

```
Global Principles (Universal)
    ↓
    Separation of Concern
    Reusability Guidelines
    ↓
Architecture Rules (Platform)
    ↓
    Reusable System Patterns
    ↓
Stack Rules (Technology)
    ↓
    Component/Service Patterns
    ↓
Project Code
```

**Higher levels constrain lower levels** but don't specify implementation details.

## ✅ Checklist Before Creating/Modifying

- [ ] **Read**: Open file, view current state, understand context
- [ ] Is this in the right layer?
- [ ] Can concerns be separated further?
- [ ] Is this truly reusable or just similar?
- [ ] Does it have a single responsibility?
- [ ] Are dependencies flowing correctly?
- [ ] Can it be tested in isolation?
- [ ] Is the interface/API clear?
- [ ] Examples documented?
- [ ] **Edit**: Make minimal, focused changes
- [ ] **Verify**: Test, lint, confirm correctness

---

**Last Updated**: 2026-05-01  
**Version**: 2.1 (Enhanced with Separation & Reusability)  
**Next Review**: 2026-08-01