# ⚛️ React + TypeScript Stack Rules

## Frontend Architecture

### Separation of Concerns

Component layers should be distinct:

```
Container Components    → Manage state/data
    ↓
Presentational Components → Render UI
    ↓
UI Components (shadcn)  → Reusable primitives
```

### Rules for Separation

1. **Container Components**
   - Fetch/manage data
   - Handle business logic
   - Pass data to presentational components
   - Know about stores and APIs

2. **Presentational Components**
   - Receive data via props
   - Handle UI interactions
   - Emit events via callbacks
   - Don't know about stores or APIs

3. **UI Components**
   - Pure visual elements
   - No business logic
   - Highly reusable
   - Styled with Tailwind

**Example**:
```typescript
// Container (manages state)
function UserListContainer() {
  const { users } = useUserStore();
  return <UserList users={users} onSelect={handleSelect} />;
}

// Presentational (manages UI)
function UserList({ users, onSelect }: UserListProps) {
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} onClick={() => onSelect(user)} />
      ))}
    </div>
  );
}
```
```
src/components/
├── ui/              # Shadcn/Radix primitives (Button, Card, etc.)
├── layout/          # Layout components (Header, Sidebar, etc.)
├── modules/         # Feature modules (complex composites)
├── shared/          # Shared components (used across features)
└── features/        # Feature-specific components
```

### Component Rules
- **Single Responsibility**: One concern per component
- **Composition over Inheritance**: Build with children and props
- **Controlled Components**: Form inputs always controlled
- **Uncontrolled for Performance**: When real-time validation not needed
- **Keep it Small**: < 200 lines ideally
- **Extract Early**: Duplication = extraction candidate

### File Structure
```
ComponentName/
├── ComponentName.tsx      # Main component
├── ComponentName.test.tsx  # Tests
├── ComponentName.stories.tsx  # Storybook (if used)
└── index.ts               # Export
```

## TypeScript Rules

### Type Definitions
```typescript
// ✅ Prefer interfaces for public APIs
export interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Use types for unions and complex types
export type UserRole = 'admin' | 'subscriber' | 'teacher' | 'guest';

// ✅ Use type for function signatures
type EventHandler = (event: MouseEvent) => void;

// ❌ Avoid any
const data: any = fetchData(); // NEVER

// ✅ Use unknown + type guards
const data: unknown = fetchData();
if (isUser(data)) {
  // use data safely
}
```

### Generics
```typescript
// ✅ Generic for reusable components
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// ✅ Constrain generics
function processItems<T extends { id: string }>(items: T[]): T[] {
  return items;
}
```

### Type Guards
```typescript
// ✅ User-defined type guards
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'name' in obj;
}

// ✅ Discriminated unions
type Success<T> = { type: 'success'; data: T };
type Failure = { type: 'error'; error: string };
type Result<T> = Success<T> | Failure;

function handleResult<T>(result: Result<T>) {
  if (result.type === 'success') {
    // TypeScript knows result.data is T
    console.log(result.data);
  }
}
```

## State Management

### Zustand Stores
```typescript
// src/stores/useStoreName.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface StoreState {
  data: SomeType | null;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
  setData: (data: SomeType) => void;
}

export const useStoreName = create<StoreState>()(
  devtools(
    persist(
      (set) => ({
        data: null,
        loading: false,
        error: null,
        fetchData: async () => {
          set({ loading: true });
          try {
            const data = await apiService.get('/data');
            set({ data, loading: false });
          } catch (error) {
            set({ error: error.message, loading: false });
          }
        },
        setData: (data) => set({ data }),
      }),
      {
        name: 'store-name',
      }
    )
  )
);
```

### Store Rules
- **One store per domain** (auth, user, notifications, etc.)
- **Keep state minimal** (compute derived state)
- **No business logic in components**
- **Actions return promises for async**
- **Use middleware**: devtools, persist
- **Type all state and actions**

## Component Patterns

### Container/Presentational
```typescript
// Container (manages state)
export function UserListContainer() {
  const { users, loading } = useUserStore();
  const { permissions } = useAuthStore();
  
  if (loading) return <Loading />;
  if (!permissions.canViewUsers) return <AccessDenied />;
  
  return <UserList users={users} />;
}

// Presentational (manages UI)
interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
  return (
    <div className="space-y-4">
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## Reusable Component Patterns

### When to Extract a Reusable Component

Extract a component when you find:
- **Duplication**: Same UI pattern in 3+ places
- **Complexity**: Component > 200 lines
- **Isolation**: Clear, single responsibility
- **Configurability**: Same pattern with different data

### Reusable Component Guidelines

#### 1. Keep Props Minimal
```typescript
// ✅ Good: Minimal, focused props
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
}

// ❌ Bad: Too many props (hard to reuse)
interface ButtonProps {
  variant?: string;
  size?: string;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  // ... 20 more optional props
}
```

#### 2. Use Composition
```typescript
// ✅ Composable: Flexible and reusable
interface CardProps {
  children: React.ReactNode;
}

function Card({ children }: CardProps) {
  return <div className="rounded-lg border bg-white p-4">{children}</div>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 border-b pb-2">{children}</div>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// Usage
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content here</CardBody>
</Card>
```

#### 3. Use Generic Data
```typescript
// ✅ Generic: Reusable across data types
interface TableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: T[keyof T]) => React.ReactNode;
  }>;
}

function Table<T extends { id: string }>({ data, columns }: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={String(col.key)}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={row.id}>
            {columns.map(col => (
              <td key={String(col.key)}>
                {col.render ? col.render(row[col.key]) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Reusable Hooks

#### Custom Hook Pattern
```typescript
// ✅ Reusable: Generic data fetching
function useData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: { enabled?: boolean }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.enabled === false) {
      setLoading(false);
      return;
    }

    fetchFn()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key, fetchFn, options?.enabled]);

  return { data, loading, error };
}

// Usage
    const { data: users, loading } = useData(
      'users',
      () => apiService.get('/api/users')
    );
```

#### Reusable Form Hook
```typescript
// ✅ Reusable: Generic form handling
function useForm<T extends Record<string, any>>(
  initialValues: T,
  validate: (values: T) => Partial<Record<keyof T, string>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const newErrors = validate(values);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { values, errors, handleChange, validateForm, setValues };
}
```

### Reusable Utility Functions

#### Share Across Components
```typescript
// src/utils/format.ts
export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-KE');

// Usage in any component
const total = formatCurrency(1500); // "KES 1,500.00"
```

### When NOT to Extract

❌ **Don't extract if:**
- Used only once
- Requirements are volatile
- Overly specific to one context
- Adds unnecessary complexity
- Harder to understand than inline code

```typescript
// ❌ Unnecessary extraction
function UserEmailDisplay({ email }: { email: string }) {
  return <span>{email}</span>;
}

// ✅ Keep it simple
<span>{user.email}</span>
```

### Composition vs. Inheritance

✅ **Prefer Composition**:
```typescript
// Reusable layout components
function PageLayout({ 
  title,
  children,
  actions 
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div>
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {actions}
      </header>
      <main>{children}</main>
    </div>
  );
}

// Flexible usage
<PageLayout 
  title="Users"
  actions={<Button>Add User</Button>}
>
  <UserList />
</PageLayout>
```

❌ **Avoid Inheritance**:
```typescript
// ❌ Hard to reuse, rigid
class BaseComponent extends React.Component {
  // Too many concerns mixed together
}

class UserList extends BaseComponent {
  // Inherits unwanted behavior
}
```

## Testing for Reusability

### Test Reusable Components Isolated
```typescript
describe('Button', () => {
  it('renders with different variants', () => {
    render(<Button variant="primary">Click</Button>);
    expect(screen.getByText('Click')).toHaveClass('bg-blue-500');
    
    render(<Button variant="secondary">Click</Button>);
    expect(screen.getByText('Click')).toHaveClass('bg-gray-500');
  });
});
```

### Document Usage
```typescript
/**
 * Reusable button component
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Submit
 * </Button>
 * ```
 */
export function Button({ variant, children, onClick }: ButtonProps) {
  // ...
}
```

## Checklist for Reusable Components

- [ ] Has a single, clear purpose
- [ ] Props are minimal and well-typed
- [ ] Default values for optional props
- [ ] Handles common edge cases (empty state, loading)
- [ ] Documented with examples
- [ ] Tested with different inputs
- [ ] Accessible (ARIA, keyboard nav)
- [ ] Can be styled externally (className prop)

### Compound Components
```typescript
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export function Tabs({ children, defaultTab }: { children: ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

export function Tab({ id, label }: { id: string; label: string }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');
  
  return (
    <button
      className={context.activeTab === id ? 'active' : ''}
      onClick={() => context.setActiveTab(id)}
    >
      {label}
    </button>
  );
}
```

## Hooks

### Custom Hook Rules
- **Name starts with `use`**
- **Composition over reimplementation**
- **Return stable references** (useCallback, useMemo)
- **Handle all loading/error states**
- **Clean up subscriptions**

```typescript
// ✅ Good custom hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((value: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setValue(value);
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  }, [key]);

  return [value, setStoredValue] as const;
}
```

## Styling Rules

### Tailwind CSS
```typescript
// ✅ Use className composition
import { cn } from '@/lib/utils';

function Component({ className }: { className?: string }) {
  return <div className={cn('base-classes', 'responsive-classes', className)} />;
}

// ✅ Use Tailwind for everything possible
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" />

// ❌ Avoid inline styles unless dynamic
<div style={{ color: 'red' }} /> // Only if color is computed
```

### Component Styling
```typescript
// Use CSS variables for theming
export function Card({ className }: { className?: string }) {
  return (
    <div className={cn(
      'bg-card text-card-foreground border',
      'rounded-lg p-6 shadow-sm',
      className
    )} />
  );
}
```

## Form Handling

### React Hook Form + Zod
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^254[0-9]{9}$/, 'Invalid phone'),
});

type FormData = z.infer<typeof schema>;

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input {...register('phone')} />
      {errors.phone && <span>{errors.phone.message}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Data Fetching

### React Query Pattern
```typescript
// src/services/useData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiService.get('/api/users');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (user: CreateUserDto) => {
      const response = await apiService.post('/api/users', user);
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

## Performance

### Optimization Rules
```typescript
// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() => computeExpensive(a, b), [a, b]);

// ✅ Memoize callbacks
const handleClick = useCallback(() => doSomething(id), [id]);

// ✅ Lazy load components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// ✅ Virtualize long lists
import { Virtuoso } from 'react-virtuoso';

// ❌ Avoid inline object creation in render
<UserCard style={{ margin: 0 }} /> // Creates new object each render

// ✅ Extract or use className
<UserCard className="m-0" />
```

## Testing

### Component Testing
```typescript
// src/components/__tests__/Component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from '../Component';

describe('Component', () => {
  it('renders with default props', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Clicked')).toBeInTheDocument();
  });
});
```

### Test Coverage
- **Components**: All user interactions
- **Hooks**: All state transitions
- **Utils**: All edge cases
- **Integration**: Critical user flows

## Accessibility

### ARIA Rules
```typescript
// ✅ Semantic HTML
<button>Click me</button> // not <div onClick={}>

// ✅ ARIA labels for icon-only buttons
<button aria-label="Close dialog">
  <XIcon />
</button>

// ✅ Required fields
<input aria-required="true" />

// ✅ Error messages
<input aria-invalid={!!error} aria-describedby="error-message" />
{error && <span id="error-message">{error}</span>}
```

## Internationalization

```typescript
// Use react-i18next or similar
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('welcome.title')}</h1>;
}
```

## Build & Deploy

### Vite Configuration
```typescript
// viterc optimization
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true, // for production debugging
  },
});
```

### Environment Variables
```bash
# .env.local
VITE_API_URL=https://api.example.com
VITE_ENABLE_ANALYTICS=true
```

## Security

### XSS Prevention
```typescript
// ✅ Automatic escaping
<div>{userContent}</div>

// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ If you must, sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userContent) 
}} />
```

### CSRF Protection
- Include anti-CSRF token in forms
- Use same-site cookies
- Validate origin header

## Monitoring

### Error Tracking
```typescript
// Global error boundary
export class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logErrorToService(error, info.componentStack);
  }
}
```

### Performance Tracking
```typescript
// Track component mount time
useEffect(() => {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    logMetric('ComponentMount', duration);
  };
}, []);
```

## Checklist Before Deployment

- [ ] All TypeScript types compile
- [ ] No `any` types in codebase
- [ ] ESLint passes
- [ ] All tests pass
- [ ] Accessibility audit passes
- [ ] Lighthouse score > 90
- [ ] Bundle size analyzed (< 200KB gzipped)
- [ ] Environment variables set
- [ ] Error boundaries in place
- [ ] Analytics configured