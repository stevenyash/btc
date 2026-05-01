# myglobalrules.md

## Rule Description

This document defines the mandatory requirements, guidelines, and architectural standards for the BTC (Bits Tutor Connect) project. All contributors MUST adhere to these rules to ensure code quality, security, maintainability, and consistency across the codebase.

---

## 🛑 MANDATORY Requirements

### 1. Requirement Understanding and Acknowledgment
Before beginning any work, you MUST:
- Read and understand all rules in this document
- Review the workspace-specific rules in `.kilo/agent/workspace.md`
- Ask clarifying questions if any requirement is unclear

### 2. Verification Checklist
Before providing any response or making changes, you MUST verify:
- [ ] The current state of the environment has been assessed
- [ ] The explicit user request has been fully understood
- [ ] The potential impact of any action has been evaluated
- [ ] Clarifying questions have been asked if any doubt exists

### 3. No Blind Action
NEVER take any action (write, edit, delete, run commands) without:
- Fully understanding the current state of the environment
- Understanding the explicit user request
- Evaluating the potential impact
- Asking clarifying questions if any doubt exists

### 4. State Visibility
ALWAYS open and display any file you are about to modify in the editor view before making changes so the user can see the current state.

---

## 🛑 ANTI-HALLUCINATION & ACCURACY (MANDATORY)

### 1. Strict Grounding
Base ALL responses **only** on:
- Provided workspace files
- Explicit tech stack versions defined in this repository
- `.kilo/agent/workspace.md` project structure
- Actual files in `react-frontend/` and `nodejs-express-api/`

### 2. Admit Ignorance
If an answer is not present in the context or if you are unsure:
- **STATE**: "I do not have enough information to provide a verified answer."
- **NEVER guess** or make assumptions
- Ask for clarification or additional context

### 3. No Phantom Code
NEVER reference:
- Libraries not in `package.json`
- APIs not in the codebase
- Variables not defined in the project
- Functions that don't exist

Verify against:
- `react-frontend/package.json`
- `nodejs-express-api/package.json`
- Existing source files

### 4. Version Lock
Base all implementations on the actual versions in use:
- Check `package.json` for exact versions
- Verify syntax against installed packages
- Confirm patterns exist in the codebase

### 5. Fact-Check Logic
Before outputting code, mentally verify:
- Does this function/feature exist in the actual codebase?
- Is this pattern supported in existing files?
- Are the imports/exports correct?

---

## 🛡️ MANDATORY Requirements

### 1. Confirmation
Confirm understanding of ALL mandatory requirements before beginning work.

### 2. Verification Checklist
List and confirm completion of each numbered requirement before providing responses.

### 3. No Blind Action
NEVER act without full understanding of environment, request, and impact.

### 4. State Visibility
ALWAYS display file state before modification.

---

## 📋 Guidelines & Safety

### Deletions
- Kilo must **NEVER** delete files without explicit user permission
- ALL file deletions require confirmation
- Use `rm` commands only after explicit "yes" confirmation

### Restoration
- Provide restoration mechanism/command for any deleted file
- Track all deletions with `git status` before and after
- Example restoration: `git checkout -- <filename>` or restore from backup

### Audit Log
Track ALL file operations:
```bash
# Create
git add <file> && git commit -m "Create: <description>"

# Modify
git add <file> && git commit -m "Update: <description>"

# Delete (with confirmation)
git rm <file> && git commit -m "Delete: <description>"
```

---

## 🏗️ Project Architecture & Structure

### Repository Layout (BTC Learning Platform)
```
btc/
├── react-frontend/          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components (shadcn/ui)
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand state stores
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── services/       # API service layers
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── package.json
│
├── nodejs-express-api/     # Express + TypeScript backend
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware (auth, validation)
│   ├── models/            # Sequelize models
│   ├── routes/            # Route definitions
│   ├── services/          # Business logic services
│   ├── config/            # Configuration files
│   ├── types/             # TypeScript definitions
│   └── app.ts             # Express app entry point
│
├── docs/                  # Project documentation
├── .kilo/                 # Kilo CLI configuration
└── docker-compose.yml     # Multi-container Docker setup
```

### Frontend Structure (react-frontend/)
- **Components**: Reusable UI in `src/components/` following shadcn/ui patterns
- **Pages**: Route-level components in `src/pages/`
- **Stores**: Global state management with Zustand in `src/stores/`
- **Services**: API calls and external integrations in `src/services/`
- **Hooks**: Custom React hooks in `src/hooks/`
- **Types**: TypeScript interfaces in `src/types/`

**Key Dependencies** (check `package.json` for current versions):
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS 4 + daisyUI for styling
- Zustand for state management
- React Router DOM 7
- React Hook Form + Zod for forms
- shadcn/ui (Radix UI primitives)
- clsx, tailwind-merge for dynamic classes

### Backend Structure (nodejs-express-api/)
- **MVC Pattern**: Controllers → Services → Models
- **Sequelize ORM** for MySQL database
- **Passport.js** for JWT authentication
- **Express middleware** for request processing

**Key Layers**:
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and data processing
- **Models**: Database schema and relationships
- **Middleware**: Authentication, validation, error handling
- **Routes**: API endpoint definitions

**Key Dependencies** (check `package.json` for current versions):
- Node.js + TypeScript (ES Modules)
- Express.js
- MySQL with Sequelize ORM
- JWT + Passport.js for authentication
- Pusher for real-time features
- AWS/Bunny.net for video storage
- Nodemailer for emails

---

## 💳 Payments - Gateway-Agnostic Abstraction

### Core Principles
- **NEVER** couple payment logic to specific providers in business code
- Define provider-agnostic interfaces
- Wrap provider SDKs behind abstractions
- Use dependency injection for payment modules

### Provider-Agnostic Interface
```typescript
// nodejs-express-api/types/payment.ts
export interface PaymentProvider {
  name: string;
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  verifyTransaction(reference: string): Promise<TransactionStatus>;
  refundPayment(transactionId: string, amount?: number): Promise<RefundResult>;
  generateReceipt(transactionId: string): Promise<string>;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  accountReference: string;
  description: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  checkoutRequestID?: string;
  reference: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  provider: string;
  timestamp: Date;
}
```

### M-Pesa Implementation Example
```typescript
// nodejs-express-api/services/mpesaService.ts
import { PaymentProvider, PaymentRequest, PaymentResult } from '../types/payment';
import axios from 'axios';

export class MpesaProvider implements PaymentProvider {
  name = 'M-Pesa';
  
  private config: {
    consumerKey: string;
    consumerSecret: string;
    shortCode: string;
    passKey: string;
    baseUrl: string;
  };

  constructor() {
    this.config = {
      consumerKey: process.env.MPESA_CONSUMER_KEY!,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
      shortCode: process.env.MPESA_SHORTCODE!,
      passKey: process.env.MPESA_PASSKEY!,
      baseUrl: process.env.MPESA_ENVIRONMENT === 'live' 
        ? 'https://api.safaricom.co.ke' 
        : 'https://sandbox.safaricom.co.ke',
    };
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const token = await this.generateToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);
      
      const response = await axios.post(
        `${this.config.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.config.shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: request.amount,
          PartyA: request.customerPhone,
          PartyB: this.config.shortCode,
          PhoneNumber: request.customerPhone,
          CallBackURL: request.callbackUrl || `${process.env.API_BASE_URL}/api/payments/callback`,
          AccountReference: request.accountReference,
          TransactionDesc: request.description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;
      return {
        success: result.ResponseCode === '0',
        transactionId: result.CheckoutRequestID,
        checkoutRequestID: result.CheckoutRequestID,
        reference: request.accountReference,
        amount: request.amount,
        status: result.ResponseCode === '0' ? 'PENDING' : 'FAILED',
        provider: this.name,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      throw error;
    }
  }

  async verifyTransaction(reference: string): Promise<TransactionStatus> {
    // Implementation for transaction status query
    const token = await this.generateToken();
    // ... verification logic
    return {
      transactionId: reference,
      status: 'COMPLETED',
      amount: 0,
    };
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    // Implementation for refund
    throw new Error('Refund not yet implemented');
  }

  async generateReceipt(transactionId: string): Promise<string> {
    return `${process.env.API_BASE_URL}/receipts/${transactionId}`;
  }

  private async generateToken(): Promise<string> {
    const response = await axios.get(
      `${this.config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        auth: {
          username: this.config.consumerKey,
          password: this.config.consumerSecret,
        },
      }
    );
    return response.data.access_token;
  }

  private generateTimestamp(): string {
    const date = new Date();
    return date.toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  }

  private generatePassword(timestamp: string): string {
    return Buffer.from(
      this.config.shortCode + this.config.passKey + timestamp
    ).toString('base64');
  }
}
```

#### React Payment Module Component
```tsx
// react-frontend/src/components/MpesaPaymentModule.tsx
import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MpesaPaymentModuleProps {
  amount: number;
  accountReference: string;
  businessMetadata?: Record<string, any>;
  activationType?: 'subscription' | 'weekendTutorial' | 'videoAccess';
  onSuccess?: (transaction: any) => void;
  onFailure?: (error: Error) => void;
  disabled?: boolean;
}

export const MpesaPaymentModule: React.FC<MpesaPaymentModuleProps> = ({
  amount,
  accountReference,
  businessMetadata,
  activationType = 'subscription',
  onSuccess,
  onFailure,
  disabled = false,
}) => {
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/mpesa/stkpush`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount,
          accountReference,
          customerPhone: user?.phone,
          description: `${activationType} payment`,
          metadata: {
            activationType,
            userId: user?.id,
            ...businessMetadata,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Payment request failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setError(null);
      onSuccess?.(data);
    },
    onError: (err: Error) => {
      setError(err.message);
      onFailure?.(err);
    },
  });

  const handlePayment = useCallback(() => {
    setError(null);
    paymentMutation.mutate();
  }, [paymentMutation]);

  if (!user?.phone) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Phone number is required for M-Pesa payment. Please update your profile.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">Amount</span>
          <span className="text-2xl font-bold">KES {amount.toLocaleString()}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Account: {accountReference}
        </div>
        {businessMetadata?.lessonTitle && (
          <div className="text-sm text-muted-foreground">
            Lesson: {businessMetadata.lessonTitle}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handlePayment}
        disabled={disabled || paymentMutation.isPending}
        className="w-full"
        size="lg"
      >
        {paymentMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>Pay with M-Pesa</>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center px-4">
        You will receive an M-Pesa prompt to complete the payment
      </p>
    </div>
  );
};
```

#### Payment API Route Example
```typescript
// nodejs-express-api/routes/payments.ts
import express from 'express';
import { MpesaProvider } from '../services/mpesaService';
import { PaymentRequest } from '../types/payment';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const mpesaProvider = new MpesaProvider();

router.post('/mpesa/stkpush', authMiddleware, async (req, res) => {
  try {
    const paymentRequest: PaymentRequest = {
      amount: req.body.amount,
      currency: 'KES',
      accountReference: req.body.accountReference,
      description: req.body.description,
      customerPhone: req.body.customerPhone,
      callbackUrl: `${process.env.API_BASE_URL}/api/payments/callback`,
      metadata: {
        userId: req.user.id,
        ...req.body.metadata,
      },
    };

    const result = await mpesaProvider.processPayment(paymentRequest);

    // Save transaction to database
    await req.context.db.transactions.create({
      data: {
        userId: req.user.id,
        amount: result.amount,
        status: result.status,
        checkoutRequestID: result.checkoutRequestID,
        transactionId: result.transactionId,
        paymentProvider: result.provider,
      },
    });

    res.json(result);
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Payment failed' 
    });
  }
});

router.post('/mpesa/callback', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const callbackData = JSON.parse(req.body.toString());
    // Process callback and update transaction status
    // ...
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('Callback error:', error);
    res.status(400).json({ ResultCode: 1, ResultDesc: 'Error' });
  }
});

export default router;
```

---

## 🔒 Security Guidelines

### Input Validation
Use Zod for runtime validation:
```typescript
import { z } from 'zod';

const PaymentSchema = z.object({
  amount: z.number().positive().max(100000),
  accountReference: z.string().min(1),
  customerPhone: z.string().regex(/^254[0-9]{9}$/),
});

const result = PaymentSchema.safeParse(data);
if (!result.success) {
  return res.status(400).json({ error: result.error.errors });
}
```

### SQL Injection Prevention
- **ALWAYS** use parameterized queries with Sequelize
- **NEVER** concatenate user input into SQL

```typescript
// ✅ Safe
await models.User.findOne({ where: { email: req.body.email } });

// ❌ Dangerous
await models.sequelize.query(
  `SELECT * FROM users WHERE email = '${req.body.email}'`
);
```

### XSS Prevention
- React automatically escapes content in JSX
- **NEVER** use `dangerouslySetInnerHTML` without sanitization

```typescript
// ✅ Safe - automatic escaping
<div>{userInput}</div>

// ❌ Dangerous - avoid if possible
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### Authentication & Authorization
- Use JWT tokens in `Authorization: Bearer <token>` header
- Verify tokens on every protected route

```typescript
// nodejs-express-api/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Secrets Management
- **NEVER** hardcode secrets in code
- Use `.env` files
- **NEVER** commit `.env` files to git

```env
# .env.example
JWT_SECRET=your-secret-here
MPESA_CONSUMER_KEY=your-key-here
DB_PASSWORD=your-password-here

# .gitignore
.env
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
});

app.use('/api/', apiLimiter);
```

---

## 🐛 Error Handling

### Frontend Error Boundaries
```tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2>Something went wrong</h2>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Backend Error Handling
```typescript
// nodejs-express-api/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error.message || 'Internal server error';
  
  console.error(`${req.method} ${req.url}`, {
    error: error.stack,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });
  
  res.status(statusCode).json({ 
    success: false, 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Usage
router.get('/lessons/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }
    res.json(lesson);
  } catch (error) {
    next(error);
  }
});
```

### Try-Catch Best Practices
```typescript
// ✅ Always wrap async operations
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new AppError('Operation failed', 500);
}

// ❌ Never leave async operations unprotected
const result = await riskyOperation(); // ❌ Missing error handling
```

---

## 🧪 Testing

### Backend Testing (Jest)
```typescript
// nodejs-express-api/__tests__/lessonController.test.ts
import request from 'supertest';
import app from '../app';
import { models } from '../models';

describe('Lesson Controller', () => {
  beforeEach(async () => {
    await models.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await models.sequelize.close();
  });

  describe('GET /lessons/:id', () => {
    it('should return lesson by id', async () => {
      const lesson = await models.Lesson.create({
        title: 'Test Lesson',
        price: 100,
      });

      const response = await request(app)
        .get(`/lessons/${lesson.id}`)
        .expect(200);

      expect(response.body.title).toBe('Test Lesson');
    });

    it('should return 404 for non-existent lesson', async () => {
      await request(app)
        .get('/lessons/999')
        .expect(404);
    });
  });
});
```

### Frontend Testing (React Testing Library)
```tsx
// react-frontend/src/components/__tests__/MpesaPaymentModule.test.tsx
import { render, screen } from '@testing-library/react';
import { MpesaPaymentModule } from '../MpesaPaymentModule';

describe('MpesaPaymentModule', () => {
  it('should display payment amount', () => {
    render(
      <MpesaPaymentModule amount={500} accountReference="ACC123" />
    );

    expect(screen.getByText(/KES 500/)).toBeInTheDocument();
  });
});
```

### Run Tests
```bash
# Backend
cd nodejs-express-api && npm run test

# Frontend  
cd react-frontend && npm run test
```

---

## 📄 Documentation (ARCHIVED - See New Structure)

> **NOTE**: This file has been reorganized. See `README.md` for the new structure.
> 
> New structure:
> - `global/development-philosophy.md` - Universal principles
> - `architecture/platform-architecture.md` - Platform architecture
> - `stack/react-typescript.md` - Frontend rules
> - `stack/nodejs-express.md` - Backend rules

### Code Comments
```typescript
/**
 * Processes M-Pesa STK Push payment
 * @param amount - Payment amount in KES
 * @param accountReference - Customer account reference
 * @param phone - Customer phone number (254 format)
 * @returns Payment result with transaction ID
 * @throws {AppError} When payment processing fails
 */
async processPayment(request: PaymentRequest): Promise<PaymentResult> {
  // Implementation
}
```

---

## 🔄 Git Workflow

### Branch Naming
```
feature/<description>     # New features
fix/<description>         # Bug fixes
hotfix/<description>      # Urgent fixes
refactor/<description>    # Code refactoring
```

### Commit Format
```
feat(payments): add M-Pesa payment provider

- Implement PaymentProvider interface
- Add MpesaProvider class
- Integrate with STK Push API
- Add error handling and logging
```

### Commit Commands
```bash
# Create feature branch
git checkout -b feature/payment-module

# Stage and commit
git add .
git commit -m "feat: add payment module"

# Push
git push origin feature/payment-module
```

---

## 👥 Role-Based Access Control

### Available Roles
- **admin** / **superadmin** - Full system access
- **subscriber** / **student** / **client** - Standard users
- **marketer** - Affiliate access
- **teacher** - Content management
- **guest** - Phone-verified limited access

### Permission Checks
```tsx
import { usePermission } from '@/hooks/usePermission';

const canProcessPayment = usePermission('payments.process');
const canViewAdmin = usePermission('admin.view');
```

```tsx
import { WithRole } from '@/components/WithRole';

<WithRole roles={['admin', 'superadmin']}>
  <AdminPanel />
</WithRole>
```

---

## 🎯 Page Permissions

### Weekend Tutorials Page
- **Route**: `/weekend-tutorials`
- **Access**: Public (no auth required)
- **Permissions**: `weekendtutorials.view`, `weekendtutorials.purchase`
- **Payment**: Guests with verified phone can purchase

### Go To Class Page
- **Route**: `/gotoclass`, `/class`
- **Access**: Mixed
  - Subscribers: Active subscription required
  - Guests: Phone verification required
- **Permissions**: `lessons.view`
- **Video Streaming**: Purchase or subscription credit

---

## 🚫 Anti-Patterns to Avoid

### Frontend
```typescript
// ❌ Avoid: Any type
const data: any = fetchData();

// ✅ Use: Proper typing
interface UserData { id: number; name: string; }
const data: UserData = fetchData();
```

### Backend
```typescript
// ❌ Avoid: Raw SQL concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Use: Sequelize parameterized
const user = await User.findByPk(userId);
```

### Security
```typescript
// ❌ Avoid: Hardcoded secrets
const JWT_SECRET = 'my-secret-key';

// ✅ Use: Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
```

---

## ✅ Checklist Before Deployment

- [ ] All TypeScript code compiles without errors
- [ ] ESLint passes without errors
- [ ] Tests pass
- [ ] No `any` types in codebase
- [ ] All secrets in environment variables
- [ ] Input validation on all endpoints
- [ ] Error boundaries in place
- [ ] Logging configured
- [ ] Security review completed
- [ ] Database migrations ready

---

## 📚 References

- [README.md](./README.md) - **Start here for reorganized rules**
- [global/development-philosophy.md](./global/development-philosophy.md) - Universal principles
- [architecture/platform-architecture.md](./architecture/platform-architecture.md) - Platform architecture
- [stack/react-typescript.md](./stack/react-typescript.md) - Frontend guidelines
- [stack/nodejs-express.md](./stack/nodejs-express.md) - Backend guidelines
- [workspace.md](./workspace.md) - Project structure and conventions
- [react-typescript.md](../.kilocode/rules/react-typescript.md) - Frontend rules (legacy location)

---

## 🆘 Getting Help

If you need assistance or have questions:
1. Check this document for relevant guidelines
2. Review [workspace.md](./workspace.md)
3. Ask for clarification if requirements are unclear
4. Never guess - admit ignorance and seek information

**Remember**: It's better to ask and get it right than to guess and break things!
