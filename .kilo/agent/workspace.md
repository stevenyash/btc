---
name: workspace
description: Project structure and conventions for BTC Learning Platform
---
# Project Structure

## Overview
BTC (Bits Tutor Connect) - A full-stack learning platform with React frontend and Node.js Express backend.

### Repository Layout
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
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4 + daisyUI
- **State:** Zustand
- **Routing:** React Router DOM 7
- **Forms:** React Hook Form + Zod validation
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Utilities:** clsx, tailwind-merge, lucide-react icons

### Backend
- **Runtime:** Node.js + TypeScript (ES Modules)
- **Framework:** Express.js
- **Database:** MySQL with Sequelize ORM
- **Auth:** JWT + Passport.js
- **Video:** AWS CloudFront + S3 signed URLs / Bunny.net Storage
- **Real-time:** Pusher
- **Payments:** M-Pesa (Daraja API)
- **Email:** Nodemailer

## Key Conventions

### Frontend Patterns
- Functional components with hooks only
- Shadcn/ui components for UI primitives
- Zustand stores for global state
- Services layer for API calls
- Type-safe with strict TypeScript

### Backend Patterns
- MVC pattern with controllers, middleware, models
- Sequelize models with associations
- JWT-based authentication middleware
- Async/await with proper error handling

### Permission System
Role-based access control:
- `admin` / `superadmin` - Full system access
- `subscriber` / `student` / `client` - Standard users
- `marketer` - Affiliate access
- `teacher` - Content management
- `guest` - Phone-verified limited access

Components:
- `useAuthStore()` - Auth state
- `usePermission(action, resource)` - Check permissions
- `WithPermission`, `WithRole`, `CanI` - Guard components

## Important Files

### Configuration
- `react-frontend/.env` - Frontend env vars (VITE_API_URL, etc.)
- `nodejs-express-api/.env` - Backend env vars (DB credentials, API keys)
- `react-frontend/vite.config.ts` - Vite configuration
- `nodejs-express-api/app.ts` - Express app setup
- `nodejs-express-api/env.ts` - Env validation

### Database Models (Backend)
- `users` - User accounts
- `subscriptions` - User subscriptions
- `lessons` - Video lessons
- `learning_areas` - Subject areas
- `learning_levels` - Grade levels
- `topics`, `subtopics` - Lesson hierarchy
- `transactions` - Payment records
- `marketers`, `marketer_commissions` - Affiliate system

### Page-Permissions Mapping
| Page | Route | Required Permission |
|------|-------|--------------------|
| Weekend Tutorials | `/weekend-tutorials` | `weekendtutorials.view` (public) |
| Go To Class | `/gotoclass`, `/class` | `lessons.view` + active subscription/guest verification |
| Admin Dashboard | `/admin` | `admin` role |

## Commands

### Development
```bash
# Frontend
cd react-frontend && npm run dev        # Start dev server
cd react-frontend && npm run build      # Production build
cd react-frontend && npm run lint       # ESLint check

# Backend
cd nodejs-express-api && npm run dev    # Start with nodemon
cd nodejs-express-api && npm run typecheck  # TypeScript check
cd nodejs-express-api && npm run test   # Jest tests

# Both
docker-compose up                       # Full stack Docker
```

## API Structure

### Base URLs
- Frontend expects API at `VITE_API_URL` (default: `http://localhost:3000`)
- Backend runs on port 3000 by default

### Authentication Flow
1. Login → JWT token stored in localStorage
2. Token sent in `Authorization: Bearer <token>` header
3. Protected routes use `authMiddleware.ts`
4. Guest access via phone verification (SMS)

## Notes for Kilo

When working with this codebase:
1. Use `react-frontend/` for all frontend changes (NOT `frontend-react`)
2. Use `nodejs-express-api/` for backend changes (NOT `backend`)
3. Frontend components go in `src/components/` (shadcn/ui pattern)
4. Backend controllers in `controllers/`, routes in `routes/`
5. Follow existing permission patterns (role-based)
6. Use existing stores (Zustand) for global state
7. Backend uses Sequelize models - run migrations for DB changes
8. Video streaming uses signed URLs (CloudFront or Bunny.net)

## Environment Variables

### Frontend (.env)
- `VITE_API_URL` - Backend API base URL
- `VITE_APP_NAME` - App name

### Backend (.env)
- `PORT` - Server port (default 3000)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL credentials
- `JWT_SECRET` - JWT signing secret
- `MPESA_*` - M-Pesa API credentials
- `AWS_*` or `BUNNY_*` - Video storage credentials
- `PUSHER_*` - Pusher real-time keys

## Testing
- Frontend: No formal tests (manual browser testing)
- Backend: Jest unit/integration tests in `__tests__` directories

## Deployment
- Docker multi-container setup
- Nginx reverse proxy
- SSL termination at load balancer
- Environment-specific `.env` files
