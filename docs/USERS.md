# User Profile & Identity

This document covers how user identity, profiles, and memberships are represented and handled across the **Project Management UI**.

---

## 1. Feature Purpose

The user module manages:
- The authenticated user's personal identity and profile information.
- Display of user details (avatars, full names, emails) across the application shell.
- Nested user representations inside workspace and project membership records.

---

## 2. Main Files & Responsibilities

| File | Path | Responsibility |
|---|---|---|
| **`auth.types.ts`** | `src/features/auth/types/auth.types.ts` | Defines the core `User` TypeScript interface matching FastAPI's `UserResponse` Pydantic schema. |
| **`authService.ts`** | `src/features/auth/services/authService.ts` | Implements `getCurrentUser()`, calling `GET /api/v1/users/me`. |
| **`auth.ts`** | `src/stores/auth.ts` | Stores the reactive `user` reference (`ref<User | null>`) accessible application-wide. |
| **`Navbar.vue`** | `src/components/layout/Navbar.vue` | Header bar that displays the current user's initials avatar, full name, email, and sign-out button. |

---

## 3. Backend API Endpoints Used

| Endpoint | HTTP Method | Headers Required | Response Schema | Description |
|---|---|---|---|---|
| `/users/me` | `GET` | `Authorization: Bearer <token>` | `UserResponse` | Fetches the full account profile of the currently signed-in user. |

### User Schema Structure

```typescript
export interface User {
  id: number
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
}
```

---

## 4. How User Identity Flows Through the App

### A. Profile Hydration on Login & Startup
1. When a user logs in or reloads the browser, `authService.getCurrentUser()` is called with the stored Bearer token.
2. The returned `User` object is saved in `authStore.user`.
3. Any component can access the active user via:
   ```typescript
   import { useAuthStore } from '@/stores/auth'
   const authStore = useAuthStore()
   const currentUser = computed(() => authStore.user)
   ```

### B. User Representation in Memberships
FastAPI's SQLAlchemy models use eager loading relationships for memberships. Both `WorkspaceMember` and `ProjectMember` return nested `User` objects:

```typescript
// Workspace Member
export interface WorkspaceMember {
  id: number
  workspace_id: number
  user_id: number
  role: WorkspaceRole
  joined_at: string
  user: User // Embedded User object
}

// Project Member
export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  role: ProjectRole
  joined_at: string
  user: User // Embedded User object
}
```

This design allows views (`WorkspaceDetailView.vue` and `ProjectDetailView.vue`) to render the member's full name, email, and avatar directly from the member list without requiring secondary queries.

---

## 5. UI Presentation & Initials Avatars

To avoid heavy external image dependencies while maintaining a polished look, user avatars are dynamically generated using their initials:

```html
<div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
  {{ member.user.full_name.slice(0, 2).toUpperCase() }}
</div>
```

- **Top Navbar**: Displays the signed-in user's initials avatar, their full name, and email address.
- **Team Tables**: Every row in the workspace and project member tables displays this avatar alongside the user's name and role badge.
