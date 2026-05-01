# 🔷 Node.js + Express Stack Rules

## Backend Architecture

### Separation of Concerns

This stack follows strict layer separation to enable independent evolution and testing.

**Dependency Flow (inward only)**:
```
Controller (HTTP) → Service (Business) → Repository (Data)
     ↓                    ↓                    ↓
  Express          Pure Logic          Sequelize
```

### Why This Separation?
- **Controllers** handle HTTP concerns (headers, status codes, serialization)
- **Services** contain pure business logic (frameworks don't matter)
- **Repositories** manage data access (can swap ORM without changing services)

Each layer:
- Knows about layers below it
- **Never** knows about layers above it
- Has its own test scope
```
src/
├── controllers/      # HTTP request handlers
├── services/         # Business logic
├── repositories/     # Database access
├── models/           # Sequelize models
├── middleware/       # Request processing
├── routes/           # Endpoint definitions
├── types/            # TypeScript definitions
├── utils/            # Shared utilities
├── config/           # Configuration
└── app.ts            # Express application setup
```

### Request Flow
```
1. Request → Router (routes/)
2. Router → Controller (controllers/)
3. Controller → Service (services/)
4. Service → Repository (repositories/)
5. Repository → Model (models/)
6. Model → Database
   ↓
7. Database → Model → Repository → Service → Controller → Response
```

## TypeScript Rules

### Strict Mode Required
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Async/Await Pattern
```typescript
// ✅ Always use try-catch
async function getUser(id: string): Promise<User> {
  try {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new InternalError('Failed to fetch user', error);
  }
}

// ❌ Never leave unhandled
const user = await getUser(id); // ❌ No try-catch
```

## Sequelize ORM Rules

### Model Definition
```typescript
// src/models/User.ts
import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class User extends Model {
  public id!: string;
  public email!: string;
  public name!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  paranoid: true, // Soft delete
});
```

### Query Patterns
```typescript
// ✅ Safe - Parameterized
await User.findOne({
  where: { email: userEmail },
});

// ✅ Safe - Prepared statement
await sequelize.query(
  'SELECT * FROM users WHERE email = ?',
  { replacements: [userEmail] }
);

// ❌ Dangerous - String concatenation
await sequelize.query(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

### Transactions
```typescript
// Always use transactions for multiple operations
async function createUserWithProfile(userData: CreateUserDto) {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await User.create(userData, { transaction });
    const profile = await Profile.create(
      { userId: user.id, ...profileData },
      { transaction }
    );
    
    await transaction.commit();
    return { user, profile };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

### Eager Loading
```typescript
// ✅ Eager load associations to avoid N+1
await User.findByPk(id, {
  include: [
    { model: Profile, as: 'profile' },
    { 
      model: Post, 
      as: 'posts',
      where: { published: true },
      required: false,
    },
  ],
});

// ❌ Avoid N+1 queries
const user = await User.findByPk(id);
const posts = await Post.findAll({ where: { userId: user.id } }); // ❌ Extra query
```

## Controller Rules

### Request Handler Pattern
```typescript
// src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userService.getUser(req.params.id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
};
```

### Validation
```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().regex(/^254[0-9]{9}$/),
});

export const validateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = CreateUserSchema.parse(req.body);
    req.validatedData = data;
    next();
  } catch (error) {
    next(new ValidationError(error.errors));
  }
};

// Route
router.post('/users', validateUser, userController.create);
```

## Service Layer

### Service Pattern
```typescript
// src/services/userService.ts
import { User } from '../models/User';
import { UserRepository } from '../repositories/userRepository';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    // Business logic here
    if (await this.userRepository.existsByEmail(data.email)) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    return this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }
}
```

### Dependency Injection
```typescript
// src/config/di.ts
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { sequelize } from './database';

const userRepository = new UserRepository(sequelize);
const userService = new UserService(userRepository);

export const container = {
  userService,
  // Add other services
};
```

## Repository Pattern

### Base Repository
```typescript
// src/repositories/baseRepository.ts
import { Model, ModelStatic, WhereOptions } from 'sequelize';

export abstract class BaseRepository<T extends Model> {
  protected model: ModelStatic<T>;

  constructor(model: ModelStatic<T>) {
    this.model = model;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findByPk(id);
  }

  async findAll(options?: any): Promise<T[]> {
    return this.model.findAll(options);
  }

  async findOne(where: WhereOptions): Promise<T | null> {
    return this.model.findOne({ where });
  }

  async create(data: any): Promise<T> {
    return this.model.create(data);
  }

  async update(id: string, data: any): Promise<[number]> {
    return this.model.update(data, { where: { id } });
  }

  async delete(id: string): Promise<number> {
    return this.model.destroy({ where: { id } });
  }
}
```

### Specific Repository
```typescript
// src/repositories/userRepository.ts
import { BaseRepository } from './baseRepository';
import { User } from '../models/User';

export class UserRepository extends BaseRepository<User> {
  async findByEmail(email: string): Promise<User | null> {
    return this.model.findOne({ where: { email } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.model.count({ where: { email } });
    return count > 0;
  }
}
```

## Reusable Service Patterns

### Creating Reusable Services

Build services that are:
- **Independent**: Don't depend on other business services
- **Composable**: Can be combined with other services
- **Testable**: Can be tested in isolation
- **Swappable**: Can be replaced without affecting callers

### Example: Notification Service
```typescript
// src/services/notificationService.ts
import { EmailService } from './emailService';
import { SmsService } from './smsService';

export interface NotificationChannel {
  send(recipient: string, message: string): Promise<void>;
}

export class NotificationService {
  private channels: Map<string, NotificationChannel> = new Map();

  constructor(
    private emailService: EmailService,
    private smsService: SmsService
  ) {
    this.channels.set('email', emailService);
    this.channels.set('sms', smsService);
  }

  async notify(
    userId: string,
    template: string,
    channel: 'email' | 'sms' | 'both' = 'email'
  ) {
    const user = await this.getUserById(userId);
    const message = this.renderTemplate(template, user);

    if (channel === 'email' || channel === 'both') {
      await this.channels.get('email')!.send(user.email, message);
    }
    if (channel === 'sms' || channel === 'both') {
      await this.channels.get('sms')!.send(user.phone, message);
    }
  }
}
```

### Example: Payment Service (Reusable)
```typescript
// src/services/paymentService.ts
import { PaymentProvider } from '../types/payment';

export class PaymentService {
  // Accept any payment provider - makes it reusable
  constructor(private provider: PaymentProvider) {}

  async processPayment(
    userId: string,
    amount: number,
    reference: string
  ) {
    const user = await this.validateUser(userId);
    
    if (!user.phone) {
      throw new Error('User phone number required');
    }

    const result = await this.provider.processPayment({
      amount,
      currency: 'KES',
      accountReference: reference,
      customerPhone: user.phone,
      description: 'Payment',
    });

    await this.saveTransaction(userId, result);
    
    return result;
  }
}

// Can be used with any provider that implements PaymentProvider
const mpesaPayment = new PaymentService(new MpesaProvider());
const cardPayment = new PaymentService(new CardProvider());
```

### Avoiding Service Coupling

❌ **Tightly coupled**:
```typescript
class OrderService {
  constructor(
    private paymentService: PaymentService,
    private emailService: EmailService,
    private inventoryService: InventoryService,
    const shippingService: ShippingService,
    // Too many dependencies = too many reasons to change
  ) {}
  
  async createOrder(orderData) {
    // Orchestrates everything - brittle
  }
}
```

✅ **Loosely coupled**:
```typescript
class OrderService {
  constructor(
    private paymentGateway: PaymentProvider, // Abstraction
    private eventBus: EventBus, // Decoupled communication
  ) {}
  
  async createOrder(orderData) {
    const payment = await this.paymentGateway.process(paymentData);
    
    // Publish events, don't call directly
    await this.eventBus.publish('order.created', {
      orderId: orderData.id,
      userId: orderData.userId,
    });
    
    return payment;
  }
}

// Separate services listen to events
class EmailService {
  onOrderCreated(event) {
    this.sendConfirmationEmail(event.userId);
  }
}

class InventoryService {
  onOrderCreated(event) {
    this.reserveItems(event.orderId);
  }
}
```

## Middleware

### Authentication Middleware
```typescript
// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: User;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};
```

### Error Handling Middleware
```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`${req.method} ${req.url}`, {
    error: error.stack,
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error',
  });
};
```

## Database Migrations

```bash
# Create migration
npx sequelize-cli migration:generate --name create-users-table

# Run migrations
npx sequelize-cli db:migrate

# Rollback
npx sequelize-cli db:migrate:undo
```

## Security Rules

### SQL Injection Prevention
- **Always** use Sequelize parameterized queries
- **Never** concatenate user input into SQL
- **Use** prepared statements for raw queries

### Password Security
```typescript
import bcrypt from 'bcrypt';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

## Testing

### Unit Testing
```typescript
// src/__tests__/userService.test.ts
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';

describe('UserService', () => {
  let userService: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      create: jest.fn(),
    } as any;
    userService = new UserService(mockRepo);
  });

  it('should get user by id', async () => {
    const user = { id: '1', name: 'Test' };
    mockRepo.findById.mockResolvedValue(user);

    const result = await userService.getUser('1');
    expect(result).toEqual(user);
  });
});
```

### Integration Testing
```typescript
import request from 'supertest';
import app from '../app';
import { sequelize } from '../config/database';

describe('User API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
  });
});
```

## Performance

### Query Optimization
```typescript
// ✅ Select only needed fields
await User.findAll({
  attributes: ['id', 'name', 'email'],
});

// ❌ Select all fields
await User.findAll();

// ✅ Add indexes for frequent queries
await User.findAll({
  where: { email },
}); // Index on email column
```

### Connection Pooling
```typescript
// src/config/database.ts
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
```

## Logging

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

## Checklist Before Deployment

- [ ] All TypeScript types compile without error
- [ ] No `any` types in production code
- [ ] ESLint passes
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Database migrations are versioned
- [ ] Environment variables documented
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] Error handling in place
- [ ] Logging configured
- [ ] Connection pooling configured
- [ ] API documentation updated
- [ ] Performance tests pass