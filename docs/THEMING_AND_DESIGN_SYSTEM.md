# Theming and Design System

This document outlines the design system, color tokens, theming architecture (Light and Dark mode), and custom UI components implemented in the **Project Management UI** (`project-management-ui`).

---

## 1. Design System Overview

The application follows a clean, modern, and accessible design system powered by **Tailwind CSS v4** and customized design tokens:
- **Primary Accent**: Indigo (`#6366f1` / `#4f46e5`) for brand identity, primary actions, and focused states.
- **Surface Elevation**: Distinct background layers for page backdrop, surface cards, modals, and popover menus.
- **Accessibility & Contrast**: All text, status indicators, and badges maintain WCAG 2.1 AA compliance in both Light and Dark themes.
- **Keyboard Navigation**: Dedicated, accessible focus rings (`ring-2 ring-indigo-500` in light mode, `ring-[#818cf8]` in dark mode) replacing unsightly browser defaults.

---

## 2. Light & Dark Mode Architecture

The theming engine supports three modes:
1. **Light Mode**: Clean white cards with subtle slate borders and slate-50 backgrounds.
2. **Dark Mode**: High-contrast slate-900 / slate-950 surfaces with dark slate-800 borders and muted slate-400 secondary typography.
3. **System Preference**: Automatically aligns with the user's OS preference (`prefers-color-scheme: dark`) and updates dynamically in real-time when the system setting changes.

### A. Tailwind CSS v4 Dark Mode Configuration
In Tailwind CSS v4, class-based dark mode is activated via `@custom-variant` inside `src/assets/main.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));
```
When the `.dark` class is present on `document.documentElement`, all `dark:...` utility classes take effect immediately across all components.

### B. The `useTheme` Composable (`src/composables/useTheme.ts`)
The `useTheme` composable manages theme state, persistence, and OS listeners:
- **State**: `theme` ref with values `'light' | 'dark' | 'system'`.
- **Computed**: `isDark` boolean indicating whether the UI is currently rendering dark mode.
- **Storage**: Persists user selection in `localStorage` under the key `pm_theme`.
- **Listener**: Attaches a `change` event listener on `window.matchMedia('(prefers-color-scheme: dark)')` to support automatic system changes without page refreshes.

```typescript
import { useTheme } from '@/composables/useTheme'

const { theme, isDark, setTheme } = useTheme()
// Switch mode
setTheme('dark') // 'light' | 'dark' | 'system'
```

### C. Header Theme Switcher (`src/components/common/ThemeToggle.vue`)
An accessible theme switcher button embedded in the main navigation bar (`Navbar.vue`):
- Displays current theme icon (Sun for Light, Moon for Dark, Laptop for System).
- Opens an animated popover dropdown with full keyboard and click-outside dismissal.
- Highlights the currently active mode with an active checkmark.

---

## 3. Custom Accessible Select Dropdown (`BaseSelect.vue`)

The custom `BaseSelect.vue` component (`src/components/common/BaseSelect.vue`) replaces basic native `<select>` dropdowns across the application with a polished, accessible custom dropdown.

### Component Features
- **Visual Status Dots & Badges**: Custom options can display color dots (`dotColor`) or badge styles (`badgeClass`).
- **Full Keyboard Navigation**:
  - `Enter` / `Space`: Opens the dropdown or selects the active option.
  - `ArrowDown` / `ArrowUp`: Navigates up and down through options.
  - `Escape` / `Tab`: Dismisses the dropdown.
- **Click Outside Dismissal**: Automatically closes when clicking anywhere outside the component.
- **Multiple Sizes**: Supports `sm` (compact filter bars) and `md` (modal forms).
- **Light & Dark Theme Ready**: Fully styled with proper hover, selected, and border states in both color modes.

### Props & Events API
| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `string \| number \| null` | `undefined` | Two-way binding value for selected option |
| `options` | `SelectOption[]` | `[]` | Array of selectable options (`{ value, label, dotColor?, badgeClass? }`) |
| `label` | `string` | `''` | Optional form label displayed above dropdown |
| `placeholder` | `string` | `'Select...'` | Placeholder text when no option is selected |
| `size` | `'sm' \| 'md'` | `'sm'` | Size variant |
| `disabled` | `boolean` | `false` | Whether the select is disabled |
| `fullWidth` | `boolean` | `false` | Whether trigger expands to 100% width |

```vue
<BaseSelect
  v-model="selectedPriority"
  label="Priority"
  :options="TASK_PRIORITY_SELECT_OPTIONS"
  size="md"
/>
```

---

## 4. Centralized Status & Priority Color Tokens (`statusTheme.ts`)

All color codes, badges, dots, and Kanban borders are centralized in `src/utils/statusTheme.ts`. This ensures visual consistency across task cards, Kanban boards, table rows, and modal dialogs.

### Task Status Visual Theme
| Status | Label | Dot Color | Badge Style (Light / Dark) |
|---|---|---|---|
| `TODO` | To Do | Sky Blue (`bg-sky-500`) | `bg-sky-50 text-sky-700` / `dark:bg-sky-950/60 dark:text-sky-300` |
| `IN_PROGRESS` | In Progress | Indigo (`bg-indigo-500`) | `bg-indigo-50 text-indigo-700` / `dark:bg-indigo-950/60 dark:text-indigo-300` |
| `IN_REVIEW` | In Review | Amber (`bg-amber-500`) | `bg-amber-50 text-amber-700` / `dark:bg-amber-950/60 dark:text-amber-300` |
| `DONE` | Done | Emerald (`bg-emerald-500`) | `bg-emerald-50 text-emerald-700` / `dark:bg-emerald-950/60 dark:text-emerald-300` |
| `BACKLOG` | Backlog | Slate (`bg-slate-400`) | `bg-slate-100 text-slate-700` / `dark:bg-slate-800 dark:text-slate-300` |
| `CANCELLED` | Cancelled | Rose (`bg-rose-400`) | `bg-rose-50 text-rose-700` / `dark:bg-rose-950/60 dark:text-rose-300` |

### Task Priority Visual Theme
| Priority | Dot Color | Badge Style (Light / Dark) |
|---|---|---|
| `URGENT` | Rose (`bg-rose-500`) | `bg-rose-50 text-rose-700` / `dark:bg-rose-950/60 dark:text-rose-300` |
| `HIGH` | Amber (`bg-amber-500`) | `bg-amber-50 text-amber-700` / `dark:bg-amber-950/60 dark:text-amber-300` |
| `MEDIUM` | Indigo (`bg-indigo-500`) | `bg-indigo-50 text-indigo-700` / `dark:bg-indigo-950/60 dark:text-indigo-300` |
| `LOW` | Slate (`bg-slate-400`) | `bg-slate-100 text-slate-700` / `dark:bg-slate-800 dark:text-slate-300` |

### Kanban Primary Columns
`KANBAN_PRIMARY_COLUMNS` exports configurations for the 4 core lifecycle stages (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`), standardizing column headers, counters, and column background tints.

---

## 5. Sidebar Navigation & Feature Development Labels

Incorrect development badges have been fixed:
- **Projects**: Outdated `dev` badge removed; displays clean active status.
- **Tasks & Board**: Outdated `soon` badge removed; button converted to active `<router-link to="/tasks">`.
- **UnderDevelopmentModal**: Reserved strictly for features whose backend endpoints have not been implemented in FastAPI (e.g. Workspace deletion, project deletion). Real, live endpoints are never locked behind under-development modals.
