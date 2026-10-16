# Project Management UI

A modern, responsive, and decoupled **Vue 3 + TypeScript** Single Page Application (SPA) designed to interface directly with the **FastAPI Project Management API**.

---

## 1. Technology Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup lang="ts">`)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type checking mirroring FastAPI Pydantic schemas)
- **Build Tool & Dev Server**: [Vite](https://vitejs.dev/)
- **Routing**: [Vue Router 4](https://router.vuejs.org/) (HTML5 history mode with navigation guards)
- **State Management**: [Pinia](https://pinia.vuejs.org/) (Modular stores for Auth and Workspaces)
- **HTTP Client**: [Axios](https://axios-http.com/) (Centralized instance with JWT and 401 interceptors)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Utility-first styling with custom focus rings)
- **Icons**: [Lucide Icons](https://lucide.dev/) (`lucide-vue-next`)

---

## 2. Developer Documentation Index

Detailed documentation for every architectural and feature area is organized inside the [`docs/`](./docs/) directory:

| Document | Topic | Description |
|---|---|---|
| **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** | **Application Structure** | Bootstrapping process (`main.ts`, `App.vue`), layer responsibilities, and unidirectional data flow. |
| **[`docs/ROUTES.md`](./docs/ROUTES.md)** | **Routes & Navigation** | Client-side route mapping, layout shells, route protection, and navigation guards. |
| **[`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md)** | **Authentication** | Registration, OAuth2 form login, Bearer token storage, and session expiration handling. |
| **[`docs/WORKSPACES.md`](./docs/WORKSPACES.md)** | **Workspaces** | Multi-tenant workspaces, member invitation, workspace switching, and RBAC roles. |
| **[`docs/PROJECTS.md`](./docs/PROJECTS.md)** | **Projects (Step 19)** | Nested REST routing (`/workspaces/:slug/projects/:key`), project keys, member assignments, and task roadmap. |
| **[`docs/USERS.md`](./docs/USERS.md)** | **User Profiles & Identity** | Current user profile hydration (`/users/me`), avatars, and embedded membership user models. |
| **[`docs/API_INTEGRATION.md`](./docs/API_INTEGRATION.md)** | **API Integration** | Central Axios client configuration, JWT request interceptor, error formatting, and CORS. |
| **[`docs/STATE_MANAGEMENT.md`](./docs/STATE_MANAGEMENT.md)** | **State Management** | Pinia stores (`useAuthStore`, `useWorkspaceStore`), data ownership rules, and state resetting. |
| **[`docs/TASKS.md`](./docs/TASKS.md)** | **Tasks & Kanban (Steps 20–22)** | Jira-style sequential ticket numbering (`MOB-1`), Kanban board columns, lifecycle state machine transitions, and task filtering. |
| **[`docs/THEMING_AND_DESIGN_SYSTEM.md`](./docs/THEMING_AND_DESIGN_SYSTEM.md)** | **Theming & Design System** | Light/Dark/System themes, status & priority color tokens, custom `BaseSelect`, and Tailwind v4 setup. |
| **[`docs/EMAIL_VERIFICATION_AND_PASSWORD_RESET.md`](./docs/EMAIL_VERIFICATION_AND_PASSWORD_RESET.md)** | **Email Verification & Password Reset (Steps 30–33)** | OTP-based registration confirmation, resend rules, 403 login intercept, and 3-step password recovery. |
| **[`docs/COMMENTS_AND_COLLABORATION.md`](./docs/COMMENTS_AND_COLLABORATION.md)** | **Comments & Task Activity Trail (Steps 23–25)** | Task discussion thread, role-based comment deletion, and immutable change audit logging. |
| **[`docs/REPORTS_AND_DASHBOARD.md`](./docs/REPORTS_AND_DASHBOARD.md)** | **Reports & Dashboard Analytics (Step 27)** | SQL aggregation metrics, KPI cards, status/priority breakdown, and overdue detection. |

---

## 3. Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm
- Running FastAPI backend (default: `http://localhost:8000`)

### Installation
From the `project-management-ui` directory:
```bash
npm install
```

### Environment Configuration
The application reads its backend API endpoint from `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```
A template file `.env.example` is also provided for reference.

### Development Server
Start the local Vite development server:
```bash
npm run dev
```
Open your browser and navigate to:
```text
http://localhost:5173
```

### Production Build & Type Checking
To run TypeScript validation and generate the production bundle:
```bash
npm run build
```
Preview the built production application:
```bash
npm run preview
```

---

## 4. Current Feature Implementation Matrix

| Area | Feature | Backend Endpoint | Status in UI |
|---|---|---|---|
| **Auth** | User Registration | `POST /api/v1/auth/register` | Implemented |
| **Auth** | Email Verification (OTP) | `POST /api/v1/auth/verify-email` | Implemented (`VerifyEmailView`) |
| **Auth** | Resend Verification Code | `POST /api/v1/auth/resend-verification-otp` | Implemented |
| **Auth** | Password Recovery (Forgot Password) | `POST /api/v1/auth/forgot-password` | Implemented (`ForgotPasswordView`) |
| **Auth** | Verify Password Reset OTP | `POST /api/v1/auth/verify-reset-otp` | Implemented |
| **Auth** | Reset Password | `POST /api/v1/auth/reset-password` | Implemented |
| **Auth** | User Login (OAuth2 + Verification check) | `POST /api/v1/auth/login` | Implemented |
| **Auth** | Current User Profile | `GET /api/v1/users/me` | Implemented |
| **Workspaces** | List Workspaces | `GET /api/v1/workspaces/` | Implemented |
| **Workspaces** | Create Workspace | `POST /api/v1/workspaces/` | Implemented |
| **Workspaces** | Get Workspace by Slug | `GET /api/v1/workspaces/{slug}` | Implemented |
| **Workspaces** | List Workspace Members | `GET /api/v1/workspaces/{slug}/members` | Implemented |
| **Workspaces** | Add Workspace Member | `POST /api/v1/workspaces/{slug}/members` | Implemented |
| **Workspaces** | Edit/Delete Workspace | `PUT/DELETE /workspaces/{slug}` | Under Development Modal |
| **Projects** | List Projects in Workspace | `GET /api/v1/workspaces/{slug}/projects/` | Implemented |
| **Projects** | Create Project | `POST /api/v1/workspaces/{slug}/projects/` | Implemented |
| **Projects** | Get Project by Key | `GET /api/v1/workspaces/{slug}/projects/{key}` | Implemented |
| **Projects** | List Project Members | `GET /api/v1/workspaces/{slug}/projects/{key}/members` | Implemented |
| **Projects** | Add Member to Project | `POST /api/v1/workspaces/{slug}/projects/{key}/members` | Implemented |
| **Projects** | Project Dashboard Analytics | `GET /api/v1/workspaces/{slug}/projects/{key}/dashboard` | Implemented (`reportService` & Overview KPI) |
| **Projects** | Edit/Delete Project | `PUT/DELETE /projects/{key}` | Under Development Modal |
| **Tasks** | List, Search, Filter, Sort & Paginate | `GET /api/v1/workspaces/{slug}/projects/{key}/tasks/` | Implemented (Kanban, List & Pagination) |
| **Tasks** | Create Task (Auto-Ticket Key) | `POST /api/v1/workspaces/{slug}/projects/{key}/tasks/` | Implemented (`CreateTaskModal`) |
| **Tasks** | Get Task Details | `GET /api/v1/workspaces/{slug}/projects/{key}/tasks/{task_number}` | Implemented (`TaskDetailModal`) |
| **Tasks** | State Transitions & Updates | `PATCH /api/v1/workspaces/{slug}/projects/{key}/tasks/{task_number}` | Implemented (Quick Advance & Dialog) |
| **Tasks** | Activity Audit History | `GET /api/v1/workspaces/{slug}/projects/{key}/tasks/{task_number}/activities/` | Implemented (`TaskDetailModal` Activity Tab) |
| **Comments** | List Task Comments | `GET /api/v1/workspaces/{slug}/projects/{key}/tasks/{task_number}/comments/` | Implemented (`TaskDetailModal` Comments Tab) |
| **Comments** | Add Task Comment | `POST /api/v1/workspaces/{slug}/projects/{key}/tasks/{task_number}/comments/` | Implemented (`commentService`) |
| **Comments** | Delete Task Comment | `DELETE .../tasks/{task_number}/comments/{comment_id}` | Implemented (Role-Checked) |
| **Navigation** | Dedicated Tasks & Kanban View | Route `/tasks` | Implemented (`TasksOverviewView`) |

---

## 5. Design System & Theming

The application features a centralized, token-based design system and theme management engine:

- **Theme Modes**: Supports `Light`, `Dark`, and `System` preference modes with real-time OS preference detection (`prefers-color-scheme`).
- **Persistence**: Theme choice persists across browser sessions in `localStorage` (`pm_theme`).
- **Custom Select Component (`BaseSelect.vue`)**: Replaced standard native `<select>` controls with a custom dropdown featuring colored status indicators, custom chevrons, keyboard accessibility, and light/dark theme integration.
- **Harmonized Color System (`src/utils/statusTheme.ts`)**:
  - **Task Statuses**: Slate (`BACKLOG`), Indigo (`TODO`), Amber (`IN_PROGRESS`), Purple (`IN_REVIEW`), Emerald (`DONE`), Rose (`CANCELLED`).
  - **Task Priorities**: Slate (`LOW`), Blue (`MEDIUM`), Orange (`HIGH`), Rose/Red (`URGENT`).
- **Documentation**: See [`docs/THEMING_AND_DESIGN_SYSTEM.md`](./docs/THEMING_AND_DESIGN_SYSTEM.md) for full token guides and component specifications.

