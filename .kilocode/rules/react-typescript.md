# React + TypeScript Rules

## Payments
Use the reusable `MpesaPaymentModule` component for M-Pesa integrations:
```tsx
import { MpesaPaymentModule } from "@/components/MpesaPaymentModule";

<MpesaPaymentModule
  amount={500}
  accountReference="ACC123"
  businessMetadata={businessMetadata}
  activationType="subscription" // or "weekendTutorial"
  onSuccess={(tx) => {
    console.log("Paid:", tx.checkoutRequestID);
  }}
  onFailure={(err) => {
    console.error("Failed:", err);
  }}
/>
```

## Authentication & Permissions
The app uses a role-based permission system with the following components:

### Auth Store (`useAuthStore`)
```ts
import { useAuthStore } from "@/stores/useAuthStore";

// Get auth state
const { user, isAuthenticated, permissions } = useAuthStore();

// Check roles
const { isAdmin, isSub, isMarketer, isTeacher } = useRole();

// Check permissions
const canEdit = useAuthStore.getState().hasPermission("users.edit");
```

### Permission Components
```tsx
import { WithPermission } from "@/components/WithPermission";
import { WithRole } from "@/components/WithRole";
import { CanI } from "@/components/CanI";

// Conditionally render based on permission
<WithPermission permission="users.edit">
  <Button>Edit User</Button>
</WithPermission>

// Conditionally render based on role
<WithRole roles={['admin', 'superadmin']}>
  <AdminPanel />
</WithRole>

// Inline permission check with render prop
<CanI action="edit" resource="lessons">
  {can => <Button disabled={!can}>Edit</Button>}
</CanI>
```

### Permission Hooks
```ts
import { usePermission } from "@/hooks/usePermission";
import { useRole } from "@/hooks/useRole";

// Simple permission check
const canViewUsers = usePermission("users.list");

// Role check with derived booleans
const { isAdmin, isSub, isMarketer, isTeacher, userRole } = useRole();
```

### Available Roles
- `admin` / `superadmin` - Full access
- `subscriber` / `student` / `client` - Standard user
- `marketer` - Affiliate access
- `teacher` - Content management
- `guest` - Unauthenticated/phone-verified limited access

### Page-Based Permissions
The application uses page-based permissions via `role_permissions` table. Each page (e.g., `weekendtutorials`, `gotoclass`, `lessons`) has CRUD flags (`list`, `view`, `edit`, `remove`, `store`) per role.

### New Pages: WeekendTutorialsPage & GoToClassPage

**WeekendTutorialsPage** (`/weekend-tutorials`):
- Publicly accessible (no auth required)
- Permissions needed:
  - Page: `weekendtutorials` with `view` allowed for all roles
  - Direct permission: `weekendtutorials.view`, `weekendtutorials.purchase` (for payment actions)
- Payment actions require authenticated subscriber or guest with verified phone

**GoToClassPage** (`/gotoclass`, `/class`):
- Mixed access:
  - Subscribers: require active subscription
  - Guests: require phone verification
  - Page permission: `lessons.view` (video lessons access)
- Video streaming requires purchase or subscription credit

### Permission Usage Examples
```tsx
// Check permission in component
const canViewTutorials = usePermission("weekendtutorials.view");

// Wrap page sections
<WithPermission permission="weekendtutorials.purchase">
  <MpesaPaymentModule ... />
</WithPermission>

// Role-based rendering
<WithRole roles={['subscriber', 'admin']}>
  <DashboardLink />
</WithRole>
```

### Backend Endpoints
- `GET /api/auth/me` - Returns user with `role_id`, `role_name`, `permissions`
- `POST /api/userprivileges/grant-multiple` - Grant privileges to user
- `POST /api/userprivileges/revoke` - Revoke privilege

### Route Protection
- Public pages: `weekendtutorials` (no auth required)
- Protected pages: `gotoclass` (requires auth or guest verification)
- Use `authMiddleware.ts` `publicPages` array to whitelist unauthenticated routes

## Tech Stack
- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Zustand (state management)
- React Router DOM 7
- Zod for validation
- Shadcn-like components (Radix UI)

## State Management
Use Zustand stores for global state. Import types from stores.

## Database Schema
Reference the database schema from `C:\Users\eldrid\Downloads\btc.sql`. Key tables:

- `users` - User accounts with id, username, phone, email, subscription_code, referred_by
- `subscriptions` - User subscriptions with user_id, subscription_type_id, status, start_date, expiry_date
- `subscription_types` - Subscription plans with name, membership_fee, months
- `packages` - Subscription packages with subscription_type_id, name, fee, no_of_lessons
- `transactions` - Payment transactions with user_id, phone_number, amount, status, checkout_request_id
- `marketers` - Affiliate marketers with referral_code, points, commission_rate, total_earnings
- `marketer_commissions` - Commissions with marketer_id, user_id, commission_amount, status
- `lessons` - Video lessons with area_id, title, s3_url, price, is_preview_available
- `learning_areas` - Subject areas with name, color, icon
- `learning_levels` - Grade levels with name, description
- `grades` - Grades with name, level_id
- `topics` / `subtopics` - Lesson organization hierarchy
- `lesson_access_logs` - Track lesson views with user_id, lesson_id, access_type, watch_time
- `guest_tracker` / `guest_users` - Anonymous user tracking
- `tutorial_register` - Weekend tutorial registrations
- `purchases` - Purchase records with user_id, package_id, transaction_status