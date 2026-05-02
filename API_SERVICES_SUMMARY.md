# API Services Summary - BTC Learning Platform

## Overview
This document summarizes all API services in the frontend codebase and evaluates their usage of the centralized API service.

## Current State Analysis

### Centralized API Service (`src/services/api.ts`)
✅ **Well-implemented foundation**
- Provides Axios instances with base URL configuration
- Includes request/response interceptors for:
  - Automatic token attachment
  - Error handling (401, 403, 429, 500)
  - Redirects for auth errors
- Exports `apiService` with typed CRUD methods
- Exports raw `api` and `publicApi` instances for direct use

### Service Layer Usage Patterns

#### 1. Services Using Centralized API ✅
- **auth.ts** - Uses `api` and `tokenService` from api.ts
- **subscription.ts** - Uses both `api` and `publicApi`
- **marketer.ts** - Uses `api`
- **admin.ts** - Uses `api`
- **guest.ts** - Uses `publicApi`
- **mpesaStore.ts** - Uses `publicApi` and `api`

#### 2. Services Using Centralized API ❌ (Needs Improvement)
- **bunny-sync.ts** (NEW) - Properly uses `apiService` ✅
- **tutorial.ts** - Not reviewed but should follow pattern
- **newsletter.ts** - Not reviewed but should follow pattern

#### 3. Stores Making Direct Fetch Calls ❌ (Needs Refactoring)
- **useBunnySyncStore.ts** - REFACTORED to use bunny-sync service ✅
- Other stores use service layer appropriately

## Services That Should Be Centralized

### Priority 1: Refactor to Use Centralized API
1. **guest.ts** - Already uses publicApi, but should use apiService for consistency
2. **mpesaStore.ts** - Mix of direct publicApi/api calls, should use apiService

### Priority 2: Create New Services Following Pattern
Any new services should follow the pattern established in:
- **bunny-sync.ts** (newly created)
- **subscription.ts**
- **auth.ts**

### Priority 3: Ensure Consistent Error Handling
All services should leverage the interceptors in api.ts rather than duplicating error handling logic.

## Recommendations

### 1. Standardize Service Creation
All new services should:
- Import from ` "@/services/api" ` 
- Use `apiService` for method consistency
- Return typed promises
- Let interceptors handle common errors (401, 403, etc.)
- Only handle service-specific errors

### 2. Create Additional Specialized Services
Consider creating services for:
- Lesson-related APIs
- Payment-related APIs (beyond M-Pesa)
- Notification APIs
- Analytics APIs

### 3. Update Documentation
Update service documentation to reflect the standardized approach.

### 4. Consider a Service Factory
For simple CRUD services, consider a factory function similar to `createGenericStore`.

## Benefits Achieved
1. **Consistency** - All API calls go through same configuration
2. **Maintainability** - Centralized error handling and auth
3. **Type Safety** - Better TypeScript support through apiService
4. **Reduced Duplication** - No repeated interceptors or base URL logic
5. **Easier Testing** - Mock apiService instead of individual fetch calls

## Files Created/Modified
1. **Created**: `src/services/bunny-sync.ts` - New service using apiService
2. **Modified**: `src/stores/useBunnySyncStore.ts` - Refactored to use bunny-sync service
3. **Created**: `API_SERVICES_SUMMARY.md` - This document

## Next Steps
1. Refactor remaining services (guest.ts, mpesaStore.ts) to use apiService
2. Create services for any missing API domains
3. Ensure all new services follow the established pattern
4. Consider creating abstract base service for common patterns