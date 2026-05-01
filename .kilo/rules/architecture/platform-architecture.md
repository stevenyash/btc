# 🏗️ Platform Architecture Rules

## Separation of Concern in Architecture

Architecture-level separation ensures that different parts of the system can evolve independently while working together cohesively.

### Architectural Boundaries

**Vertical Separation** (by feature/domain)
- Each business capability is self-contained
- Minimizes cross-team dependencies
- Example: Payment module, User module, Lesson module

**Horizontal Separation** (by technical layer)
- Presentation, Application, Domain, Infrastructure
- Enables technology swaps
- Example: React frontend can be replaced without touching backend

## System Boundaries

### Monorepo Structure
```
btc/
├── react-frontend/          # Presentation layer
├── nodejs-express-api/      # Application layer
├── database/               # Data layer
└── docs/                   # Documentation
```

### Layer Responsibilities

#### Frontend (React/TypeScript)
- User interface rendering
- Client-side validation
- State management (UI state only)
- API communication
- Routing

#### Backend (Node.js/Express)
- Business logic
- Data validation
- Authentication/Authorization
- Database operations
- Third-party integrations
- API orchestration

#### Database (MySQL)
- Data persistence
- Data integrity
- Query optimization
- Transaction management

## Data Flow Architecture

### Unidirectional Flow
```
UI → API Request → Controller → Service → Repository → Database
   ← Response  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←
```

### Never Cross Layer Boundaries
- Frontend never talks directly to database
- Backend never renders UI
- Database never contains business logic

## Integration Patterns

### Payment Abstraction
```
          
  Frontend    Payment    Provider  
              Service           (M-Pesa,    
          Interface                      etc.)    
          
                                 
          
                             Backend   
                             Service   
          
```

### Rules for Abstractions
1. **Define interfaces at layer boundaries**
2. **Implementations live in infrastructure layer**
3. **Core logic depends on abstractions, not concretions**
4. **Dependency injection for testability**

## Database Design Rules

### Naming Conventions
- **Tables**: plural snake_case (`users`, `payment_transactions`)
- **Columns**: snake_case (`user_id`, `created_at`)
- **Foreign Keys**: `{referenced_table}_id`
- **Primary Keys**: `id` (auto-increment) or `uuid`
- **Timestamps**: `created_at`, `updated_at`
- **Soft Deletes**: `deleted_at`

### Column Types
- **IDs**: `INT UNSIGNED AUTO_INCREMENT` or `CHAR(36)` for UUID
- **Names/Titles**: `VARCHAR(255)` max
- **Descriptions**: `TEXT`
- **Prices/Amounts**: `DECIMAL(10,2)`
- **Booleans**: `TINYINT(1)`
- **JSON**: `JSON` type
- **Timestamps**: `DATETIME` or `TIMESTAMP`

### Indexing Strategy
- **Primary Key**: Automatic
- **Foreign Keys**: Always index
- **Query Columns**: Index columns in WHERE, JOIN, ORDER BY
- **Composite Indexes**: Order by cardinality (highest first)
- **Max Indexes per Table**: 5 (evaluate if more needed)

### Constraints
- **Foreign Keys**: Always use with `ON DELETE CASCADE` or `ON DELETE SET NULL`
- **NOT NULL**: Default unless explicitly optional
- **UNIQUE**: For natural unique keys (not surrogate keys)
- **CHECK**: For simple domain constraints

## Reusable Architecture Patterns

### When to Generalize
Build reusable architecture components when:
- **Used 3+ times** across the system (rule of three)
- **Stable requirements** (domain concept is clear)
- **Cross-cutting concern** (needed by many modules)
- **Swappable implementation** (different providers/configs)

### Reusable Components in This System

#### 1. Payment Gateway Abstraction
```typescript
// Used by multiple features: subscriptions, purchases, tips
// Swappable implementations: M-Pesa, cards, bank transfer
type PaymentProvider {
  process(payment: PaymentRequest): Promise<PaymentResult>;
  verify(reference: string): Promise<TransactionStatus>;
  refund(id: string): Promise<RefundResult>;
}
```

#### 2. Notification Service
```typescript
// Used by: orders, payments, account, security
// Multiple channels: SMS, email, push
interface NotificationService {
  send(recipient: string, template: string, data: any): Promise<void>;
}
```

#### 3. File Storage Abstraction
```typescript
// Used by: lessons, profiles, receipts
// Backends: S3, BunnyCDN, local
interface FileStorage {
  upload(file: Buffer, path: string): Promise<string>;
  get(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
}
```

#### 4. Audit Logger
```typescript
// Cross-cutting: track all important changes
// Used everywhere but implemented once
interface AuditLogger {
  log(action: string, userId: string, details: any): Promise<void>;
}
```

### Avoiding Over-Generalization

❌ **Too generic**:
```typescript
interface IRepository<T> {
  // Trying to handle all cases
  find(criteria: any): Promise<T[]>;
  save(entity: any): Promise<T>;
  // Becomes too abstract to be useful
}
```

✅ **Just right**:
```typescript
interface UserRepository {
  // Specific to users, clear purpose
  findByEmail(email: string): Promise<User>;
  findBySubscription(status: string): Promise<User[]>;
  save(user: User): Promise<User>;
}
```

## API Design Rules

### RESTful Principles
- **Nouns for resources**: `/users`, `/lessons`, `/payments`
- **HTTP methods for actions**: GET, POST, PUT, DELETE, PATCH
- **No verbs in URLs**: Use POST for actions
- **Plural resource names**: `/users` not `/user`

### Versioning
- **URL versioning**: `/api/v1/users`
- **Breaking changes**: Increment major version
- **Non-breaking**: Backward compatible, same version

### Request/Response Format
```json
// Request
{
  "data": {
    "email": "user@example.com",
    "phone": "254712345678"
  },
  "metadata": {
    "timezone": "Africa/Nairobi"
  }
}

// Success Response
{
  "success": true,
  "data": {},
  "message": "Operation completed"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": [
      {"field": "phone", "message": "Must start with 254"}
    ]
  }
}
```

### Status Codes
- **200**: Success (GET, PUT, DELETE, PATCH)
- **201**: Created (POST)
- **204**: No Content (DELETE success)
- **400**: Bad Request (validation)
- **401**: Unauthorized (no/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Too Many Requests
- **500**: Internal Server Error
- **502/503/504**: External service failures

## Security Architecture

### Authentication Flow
```
1. Client → Login endpoint (credentials)
2. Server → Verify credentials
3. Server → Generate JWT (1h expiry)
4. Server → Return token
5. Client → Include in Authorization header
6. Server → Verify token on each request
```

### Authorization Model
- **Role-Based Access Control (RBAC)**
- **Permissions attached to roles**
- **Users assigned roles**
- **Page-level permissions**
- **Resource-level permissions**

### Data Protection
- **Encryption at rest**: Database level
- **Encryption in transit**: TLS 1.3 minimum
- **Password hashing**: bcrypt (cost 12)
- **Secrets**: Environment variables only
- **API Keys**: Rotate quarterly

## Scalability Patterns

### Horizontal Scaling
- **Stateless services**: Easy to scale
- **Session data**: In Redis, not memory
- **File storage**: S3/object storage
- **Database**: Read replicas for scaling reads

### Caching Strategy
```
Level 1: Application (memory) - Hot data, 5min TTL
Level 2: Redis - Shared cache, 15min TTL  
Level 3: Database - Source of truth
```

### Background Processing
- **Synchronous**: User requires immediate result
- **Asynchronous**: Email, notifications, reports
- **Queue**: RabbitMQ/SQS for reliability
- **Workers**: Process queue items

## Monitoring & Observability

### Logging Levels
- **DEBUG**: Development troubleshooting
- **INFO**: Normal operations
- **WARN**: Unexpected but handled
- **ERROR**: Failed operations, requires attention
- **FATAL**: Critical failures, immediate action

### What to Log
- All requests (method, path, status, duration)
- All errors (stack trace, context)
- Security events (logins, permission denied)
- Business events (payments, registrations)

### Metrics to Track
- Request rate and latency
- Error rate
- Database query performance
- Queue depth
- Third-party API latency

## Deployment Architecture

### Environments
- **Local**: Developer machines
- **Development**: Integration testing
- **Staging**: Pre-production (production mirror)
- **Production**: Live system

### Deployment Strategy
- **Blue-Green**: Zero-downtime deployments
- **Database Migrations**: Versioned, backward compatible
- **Feature Flags**: Toggle features without deployment
- **Health Checks**: Automatic rollback on failure

## Code Organization

### Backend Structure
```
src/
├── controllers/      # HTTP request handlers
├── services/         # Business logic
├── repositories/     # Database access
├── models/           # Database schemas
├── middleware/       # Request processing
├── routes/           # Endpoint definitions
├── types/            # TypeScript definitions
├── utils/            # Shared utilities
└── config/           # Configuration
```

### Frontend Structure
```
src/
├── components/       # Reusable UI
├── pages/            # Route-level components
├── stores/           # Global state
├── hooks/            # Custom hooks
├── services/         # API clients
├── types/            # TypeScript definitions
├── utils/            # Shared utilities
└── lib/              # Third-party config
```

## Dependency Management

### Rules
1. **Keep dependencies minimal**
2. **Document why each dependency is needed**
3. **Regular security audits (monthly)**
4. **Update on schedule (quarterly)**
5. **Major version updates require testing**

### Allowed Dependencies
- **Frontend**: React ecosystem, Tailwind, state management
- **Backend**: Express, database ORM, auth, validation
- **Shared**: TypeScript, linting, testing

## Documentation Standards

### Architecture Decision Records (ADRs)
```
# docs/adr/0001-payment-abstraction.md

## Status
Proposed | Accepted | Deprecated

## Context
What problem are we solving?

## Decision
What did we decide?

## Consequences
Benefits and trade-offs
```

### Runbooks
- Incident response procedures
- Deployment checklists
- Database migration guides
- Rollback procedures

## Team Collaboration

### Code Reviews
- Minimum 1 reviewer
- Review within 24 hours
- Check architecture alignment
- Test coverage required
- Documentation updates

### Pair Programming
- Complex features
- Critical bug fixes
- Knowledge transfer
- Architecture decisions

### Knowledge Sharing
- Weekly tech talks
- ADR documentation
- Code walkthroughs
- Shared learning sessions