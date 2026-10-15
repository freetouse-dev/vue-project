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
| **Auth** | User Login (OAuth2) | `POST /api/v1/auth/login` | Implemented |
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
| **Projects** | Edit/Delete Project | `PUT/DELETE /projects/{key}` | Under Development Modal |
| **Tasks** | Task Board & Sprints | Pending FastAPI Step 20 | Under Development Preview |
