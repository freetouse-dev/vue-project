# Project Reports & Dashboard Analytics (FastAPI Step 27)

## 1. Overview
FastAPI Step 27 introduced dedicated SQL-aggregated dashboard analytics endpoints. This replaces client-side array filtering with indexed database aggregations (`func.count()`, `group_by`).

---

## 2. API Contract & Service

### 2.1 Endpoint
```http
GET /api/v1/workspaces/{slug}/projects/{key}/dashboard
```

### 2.2 Response Schema (`ProjectDashboardResponse`)
```json
{
  "project_id": 1,
  "project_key": "MOB",
  "project_name": "Mobile Application",
  "total_tasks": 16,
  "completed_tasks": 5,
  "completion_rate_percentage": 31.25,
  "overdue_tasks": 2,
  "tasks_by_status": {
    "BACKLOG": 2,
    "TODO": 4,
    "IN_PROGRESS": 3,
    "IN_REVIEW": 2,
    "DONE": 5,
    "CANCELLED": 0
  },
  "tasks_by_priority": {
    "LOW": 4,
    "MEDIUM": 7,
    "HIGH": 3,
    "URGENT": 2
  }
}
```

---

## 3. Frontend Integration

### 3.1 Service (`reportService.ts`)
```ts
export const reportService = {
  async getProjectDashboard(workspaceSlug: string, projectKey: string): Promise<ProjectDashboardResponse> {
    const response = await apiClient.get(...)
    return response.data
  }
}
```

### 3.2 View Integration (`ProjectDetailView.vue`)
The **Overview** tab displays:
1. **KPI Metric Cards**:
   - Total Tasks
   - Closed / Completed Tasks
   - Completion Rate (%) with trending indicator
   - Overdue Tasks count (highlighted in rose if > 0)
2. **Task Completion Progress Bar**:
   - Animated visual progress bar reflecting the exact completion rate.
3. **Status Breakdown Widget**:
   - Live count breakdown across all statuses (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELLED`).
