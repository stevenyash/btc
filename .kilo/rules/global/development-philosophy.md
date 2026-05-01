# 🌍 Global Development Philosophy

## Universal Principles

### Core Values
- **Clarity over cleverness**: Write code that's easy to understand
- **Safety over speed**: Always consider edge cases and error handling
- **Maintainability over convenience**: Future developers will thank you
- **Consistency over personal preference**: Follow established patterns
- **Reusability over duplication**: Build once, use everywhere
- **Separation over entanglement**: Keep concerns distinct and focused

### The Three Laws of Kilo
1. **Never guess** - Admit ignorance and seek information
2. **Never assume** - Verify state before acting
3. **Never hide** - Make changes visible and traceable

### The Three Operations of Kilo
1. **ALWAYS read before edit** - Open file, view current state, understand context
2. **Edit with precision** - Make minimal, focused changes
3. **Verify after edit** - Test, lint, confirm correctness

## Separation of Concern

### Why Separate Concerns?
- **Change isolation**: Modify one part without breaking others
- **Testability**: Test components in isolation
- **Reusability**: Mix and match well-defined pieces
- **Clarity**: Understand what each part does
- **Team scaling**: Multiple developers can work independently

### Separation Boundaries

#### Logical Separation
```
Business Logic    ≠    Presentation    ≠    Data Access
   (What)                (How it looks)       (How it's stored)
```

#### Physical Separation
```
src/
├── domain/          # Business rules (pure, framework-free)
├── application/     # Use cases, orchestration
├── infrastructure/  # Technical details (DB, APIs, framework)
└── presentation/    # UI / API endpoints
```

### Domain-Driven Boundaries
- **Domain Layer**: Pure business logic, no dependencies
- **Application Layer**: Coordinates domain objects
- **Infrastructure Layer**: Implements technical details
- **Interface Layer**: Handles user/API interaction

### Rules for Separation
1. **Never leak implementation details upward**
   - Domain doesn't know about database
   - Application doesn't know about HTTP
   - Infrastructure implements interfaces

2. **Dependencies point inward**
   ```
   Presentation → Application → Domain
                          ↓
                   Infrastructure
   ```

3. **Each layer has a single responsibility**
   - Domain: Business rules
   - Application: Use case coordination
   - Infrastructure: Technical plumbing
   - Presentation: User interaction

### Cross-Cutting Concerns
Handle these without violating separation:
- **Logging**: Use decorators/interceptors
- **Validation**: At boundary entry points
- **Security**: Guard at edge, propagate identity
- **Transactions**: At use case level
- **Caching**: In infrastructure layer

## Reusability Principles

### The DRY Spectrum
```
Copy-Paste (0% DRY) ←─ Good for →── Stability ↗
                                    (changing requirements)
    ↓                                      ↓
Shared Function (50% DRY) ←─ Good for → Maturity ↗
                                    (proven patterns)
    ↓                                      ↓
Framework/Platform (100% DRY) ←── for → Stability ↗
                                    (infrastructure)
```

### When to Reuse
✅ **Reuse when:**
- Code is stable and well-tested
- Used in 3+ places (rule of three)
- Logic is pure (no side effects)
- Domain concept is clear
- Change in one place should affect all

❌ **Don't reuse when:**
- Requirements are volatile
- Similar but not identical (YAGNI - You Ain't Gonna Need It)
- Premature abstraction (early in project)
- Would introduce coupling
- Different rates of change

### Abstraction Guidelines

#### Good Abstraction (Reusable)
```typescript
// Payment processing (stable domain concept)
interface PaymentProcessor {
  process(payment: PaymentRequest): Promise<PaymentResult>;
  refund(transactionId: string): Promise<RefundResult>;
}

// Used in 5+ places, logic stable, clear purpose
// Implementations: StripeProcessor, PayPalProcessor, MpesaProcessor
```

#### Bad Abstraction (Premature)
```typescript
// "Generic" data thing (unclear purpose)
interface DataHandler<T> {
  doSomething(data: T): Promise<Something>;
  // What does doSomething actually do?
  // Changes differently in each use case?
}

// Used in 2 places, requirements evolving weekly
// Each implementation does something different
```

### Reusability Patterns

#### 1. Parameterization
```typescript
// ✅ Reusable: Configurable behavior
function createRepository<T extends Model>(
  model: ModelStatic<T>,
  options: RepositoryOptions
) {
  return {
    findById: (id: string) => model.findByPk(id, options),
    // ...
  };
}
```

#### 2. Composition
```typescript
// ✅ Reusable: Mix behaviors
function withLogging<T extends object>(
  target: T
): T & { logAccess: () => void } {
  return {
    ...target,
    logAccess: () => console.log('Accessed:', target.constructor.name),
  };
}

// ✅ Reusable: Combine small functions
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);

const formatTransaction = (t: Transaction) =>
  `${formatCurrency(t.amount)} - ${t.description}`;
```

#### 3. Strategy Pattern
```typescript
// ✅ Reusable: Swappable algorithms
interface NotificationStrategy {
  send(recipient: string, message: string): Promise<void>;
}

class EmailNotification implements NotificationStrategy { /*...*/ }
class SmsNotification implements NotificationStrategy { /*...*/ }
class PushNotification implements NotificationStrategy { /*...*/ }

// Inject the strategy
class NotificationService {
  constructor(private strategy: NotificationStrategy) {}
  
  notify(user: User, message: string) {
    return this.strategy.send(user.contact, message);
  }
}
```

### Avoiding Reusability Traps

#### 1. The "Framework" Trap
```typescript
// ❌ Don't build internal frameworks
interface OurFrameworkBaseClass {
  // Trying to be everything for everyone
  beforeAction() {}
  afterAction() {}
  aroundAction() {}
  onError() {}
  onSuccess() {}
  // ... 20 more hooks nobody uses
}

// ✅ Build specific, focused utilities
function withTransaction<T>(
  fn: () => Promise<T>
): Promise<T> {
  // One thing, well
  return sequelize.transaction(async (t) => {
    return fn();
  });
}
```

#### 2. The "God Abstraction" Trap
```typescript
// ❌ One abstraction to rule them all
interface IDataAccess {
  // SQL databases
  find(query: SqlQuery): Promise<any>;
  // NoSQL databases  
  find(documentQuery: MongoQuery): Promise<any>;
  // REST APIs
  find(apiEndpoint: string): Promise<any>;
  // Files
  find(filePath: string): Promise<any>;
}

// ✅ Separate, focused interfaces
interface SqlRepository {
  findByQuery(query: SqlQuery): Promise<any>;
}

interface DocumentRepository {
  findByFilter(filter: MongoFilter): Promise<any>;
}
```

#### 3. The "Over-Engineering" Trap
```typescript
// ❌ Abstracting too early
interface IUserRepository {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  findByPhone(phone: string): Promise<User>;
}

class UserRepository implements IUserRepository { /*...*/ }

// Only one implementation, never changes
// No testing benefits, just ceremony

// ✅ Start concrete, extract when needed
class UserRepository {
  findByEmail(email: string): Promise<User> {
    // Direct implementation
  }
}

// Later, if we need to swap implementations:
interface UserRepositoryInterface {
  findByEmail(email: string): Promise<User>;
}

class UserRepository implements UserRepositoryInterface { /*...*/ }
```

## Applying Both Together

### Good Example
```typescript
// Clear separation + high reusability

// Domain (pure business logic)
// src/domain/payment.ts
export class Payment {
  constructor(
    public readonly amount: Money,
    public readonly recipient: AccountId
  ) {}
  
  // Stable domain concept
  validate(): ValidationResult {
    return this.amount.isPositive() 
      ? ValidationResult.valid()
      : ValidationResult.invalid('Amount must be positive');
  }
}

// Application (coordinates use cases)
// src/application/processPayment.ts
export class ProcessPaymentUseCase {
  constructor(
    private paymentRepo: PaymentRepository,
    private notificationService: NotificationService
  ) {}
  
  // Orchestrates domain objects
  async execute(command: ProcessPaymentCommand) {
    const payment = new Payment(command.amount, command.recipient);
    
    const validation = payment.validate();
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }
    
    await this.paymentRepo.save(payment);
    await this.notificationService.notify(payment);
    
    return payment;
  }
}

// Infrastructure (technical details)
// src/infrastructure/MpesaGateway.ts
export class MpesaGateway implements PaymentGateway {
  // Reusable payment gateway implementation
  async process(payment: Payment): Promise<PaymentResult> {
    // M-Pesa specific logic
  }
}

// Infrastructure (reusable decorator)
// src/infrastructure/LoggingDecorator.ts
export class LoggingPaymentGateway implements PaymentGateway {
  constructor(
    private wrapped: PaymentGateway,
    private logger: Logger
  ) {}
  
  async process(payment: Payment) {
    this.logger.info('Processing payment', { amount: payment.amount });
    const result = await this.wrapped.process(payment);
    this.logger.info('Payment processed', { success: result.success });
    return result;
  }
}
```

### Bad Example
```typescript
// ❌ No separation, low reusability

// src/controllers/paymentController.ts
export class PaymentController {
  async process(req: Request, res: Response) {
    // Mixing concerns everywhere
    
    // Validation (domain concern in controller)
    if (!req.body.amount || req.body.amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // Business logic (should be in domain)
    const fee = req.body.amount * 0.05;
    const total = req.body.amount + fee;
    
    // Data access (should be in repository)
    const user = await db.query(
      'SELECT * FROM users WHERE id = ?', 
      [req.body.userId]
    );
    
    // Notification (should be separate service)
    await sendSms(user.phone, `Payment of ${total} received`);
    
    // Logging (should be cross-cutting)
    console.log(`Payment processed: ${total}`);
    
    // Response
    res.json({ total });
  }
}

// src/controllers/refundController.ts
export class RefundController {
  async process(req: Request, res: Response) {
    // Copy-pasted logic ❌
    
    if (!req.body.amount || req.body.amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    const fee = req.body.amount * 0.05;
    const total = req.body.amount - fee;
    
    const user = await db.query(
      'SELECT * FROM users WHERE id = ?', 
      [req.body.userId]
    );
    
    await sendSms(user.phone, `Refund of ${total} processed`);
    
    console.log(`Refund processed: ${total}`);
    
    res.json({ total });
  }
}
```

## Team Practices

### Code Review Checklist
- [ ] Are concerns properly separated?
- [ ] Is this logic reusable in other contexts?
- [ ] Are dependencies flowing correctly?
- [ ] Is there unnecessary coupling?
- [ ] Could this be tested in isolation?

### Refactoring Triggers
When you see:
- **Copy-paste code** → Consider extraction
- **God classes/modules** → Split by responsibility
- **Mixed concerns** → Separate into layers
- **Hard to test** → Introduce boundaries
- **Changing together** → Might need same abstraction
- **Changing differently** → Definitely separate

### Measuring Success
- **Separation**: Can modify one layer without touching others?
- **Reusability**: How many places use this component?
- **Testability**: Can test without 10 mocks?
- **Clarity**: Can new dev understand the structure in 1 day?
- **Flexibility**: Can swap implementations easily?

## Summary

**Separation of Concern** = "Do one thing well"
- Keeps code organized
- Enables independent evolution
- Simplifies understanding

**Reusability** = "Build once, use many"
- Reduces duplication
- Ensures consistency
- Saves development time

**Together** = Build systems that are:
- Easy to understand
- Easy to change
- Easy to test
- Easy to extend

Remember: "Separation enables reuse, but overengineering kills both."

## Development Workflow

### Before You Code
- [ ] Read relevant documentation
- [ ] Understand the problem domain
- [ ] Identify affected components
- [ ] Check for existing patterns

### While Coding
- [ ] Write tests alongside implementation
- [ ] Keep functions small and focused (SRP)
- [ ] Add type definitions for all data structures
- [ ] Document non-obvious decisions

### After Coding
- [ ] Run all tests
- [ ] Verify linting passes
- [ ] Review own code critically
- [ ] Update documentation

## Communication Standards

### Commit Messages
Follow Conventional Commits:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation only
- `style`: Formatting, semicolons, etc.
- `test`: Adding tests
- `chore`: Maintenance tasks

### Pull Requests
- One logical change per PR
- Reference related issues
- Include test results
- Note breaking changes

## Error Philosophy

### Fail Fast, Fail Loudly
- Don't swallow errors
- Provide context with every error
- Use appropriate error types
- Log at the right level

### Error Hierarchy
```
AppError (base)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
└── InternalError (500)
```

## Testing Philosophy

### Test Pyramid
- **70% Unit tests**: Fast, isolated, focused
- **20% Integration tests**: Component interactions
- **10% E2E tests**: Critical user journeys

### Test Naming
```
describe('Component/Function', () => {
  it('should do something when condition', () => {})
  it('should handle error when condition', () => {})
})
```

## Documentation Standards

### Code Comments
- **Why**, not what (code should be self-explanatory)
- Document assumptions
- Explain complex algorithms
- Mark TODOs with owner and date

### API Documentation
- Every endpoint needs:
  - Purpose
  - Request format
  - Response format
  - Error codes
  - Examples

## Security Mindset

### Assume Breach
- Validate all inputs
- Sanitize all outputs
- Never trust client data
- Principle of least privilege

### Secrets Management
- Never in code
- Never in version control
- Use environment variables
- Rotate regularly

## Performance Awareness

### Golden Rules
- Measure before optimizing
- Cache strategically
- Lazy load non-critical resources
- Batch operations when possible

### Red Flags
- Nested loops over large datasets
- Synchronous I/O in request paths
- Unbounded result sets
- Memory leaks in long-running processes