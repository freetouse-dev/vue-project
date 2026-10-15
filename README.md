# Project Management UI (Vue 3 + TypeScript + Tailwind CSS)

A decoupled, lightweight Vue 3 Single Page Application for testing and experiencing the FastAPI project management backend.

## Tech Stack
- **Vue 3** (Composition API, `<script setup lang="ts">`)
- **TypeScript** (Type safety mirroring Pydantic models)
- **Vite** (Next-gen build tool & dev server)
- **Vue Router 4** (Client-side routing & navigation guards)
- **Pinia** (Central state store for Auth & Workspaces)
- **Axios** (Centralized API client with interceptors)
- **Tailwind CSS v4** (Utility-first responsive styling)
- **Lucide Icons** (`lucide-vue-next`)

## Getting Started

### 1. Install Dependencies
Run from inside this directory:
```bash
npm install
```

### 2. Configure Environment
A `.env` file has been pre-configured with the default FastAPI backend URL:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Run Development Server
```bash
npm run dev
```
The application will start on `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```

---

## Features Implemented & Ready to Test

1. **Authentication Flow (`/login`, `/register`)**:
   - User Registration (`POST /auth/register`).
   - OAuth2 Password Form Login (`POST /auth/login`).
   - Authenticated User Profile retrieval (`GET /users/me`).
   - Navigation guards protecting authenticated routes.

2. **Workspace Management (`/workspaces`, `/workspaces/:slug`)**:
   - List all user workspaces (`GET /workspaces/`).
   - Create workspace modal (`POST /workspaces/`).
   - Workspace details and member list (`GET /workspaces/:slug`, `GET /workspaces/:slug/members`).
   - Add new member modal (`POST /workspaces/:slug/members`).

3. **Honest Incomplete / Under-Development States**:
   - Reusable `<UnderDevelopmentModal />` for unimplemented backend endpoints (e.g. Workspace Edit, Delete, Settings).
   - Projects dashboard (`/projects`) indicating status and waiting for backend router exposure.
