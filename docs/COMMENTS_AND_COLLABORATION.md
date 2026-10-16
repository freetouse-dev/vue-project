# Comments & Task Activity History (FastAPI Steps 23–25)

## 1. Overview
This document details the frontend implementation for **Task Comments & Collaboration** and **Task Activity Audit History** as introduced in FastAPI Steps 23–25.

---

## 2. Architecture & Data Flow

### 2.1 Task Comments (`commentService.ts`)
Tasks support chronological discussions and notes:
- **List Comments**:
  ```http
  GET /api/v1/workspaces/{slug}/projects/{key}/tasks/{task_number}/comments/
  ```
  Returns `list[CommentResponse]`.
- **Post Comment**:
  ```http
  POST /api/v1/workspaces/{slug}/projects/{key}/tasks/{task_number}/comments/
  ```
  Body: `{ "content": "..." }`.
  - Permissions: Requires Workspace member with role higher than Viewer.
- **Delete Comment**:
  ```http
  DELETE /api/v1/workspaces/{slug}/projects/{key}/tasks/{task_number}/comments/{comment_id}
  ```
  - Permissions: Allowed only for the comment author, workspace admin/owner, or superuser. The UI selectively displays the delete trash button only when this permission check passes.

### 2.2 Task Activity Audit Log (`taskService.getTaskActivities`)
FastAPI records immutable audit entries whenever task attributes change:
- **Fetch Audit Trail**:
  ```http
  GET /api/v1/workspaces/{slug}/projects/{key}/tasks/{task_number}/activities/
  ```
- **Recorded Actions (`ActivityAction`)**:
  - `TASK_CREATED`
  - `STATUS_CHANGED` (`old_value` &rarr; `new_value`)
  - `PRIORITY_CHANGED` (`old_value` &rarr; `new_value`)
  - `ASSIGNEE_CHANGED`
  - `TITLE_CHANGED`
  - `DESCRIPTION_CHANGED`
  - `DUE_DATE_CHANGED`

---

## 3. UI Component Integration: `TaskDetailModal.vue`
Inside the task detail inspector, users can switch between three tabs:
1. **Details**: Title, description, priority, assignee, due date, timestamps, and editing mode.
2. **Comments**: Real-time comment count badge, discussion thread, auto-expanding comment input with send button, and delete controls.
3. **Activity Log**: Chronological audit timeline with actor initials, readable change descriptions, and timestamps.
