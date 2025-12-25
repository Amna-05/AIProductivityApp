# Frontend API Reference - EXACT Specifications

**CRITICAL**: This document contains the **EXACT** request/response formats from the backend. Always refer to this before implementing frontend features.

---

## 📌 Base URL

```
http://localhost:8000/api/v1
```

---

## 🔐 Authentication Endpoints

### POST /auth/register
**Request Body**:
```typescript
{
  email: string;        // Required, valid email
  username: string;     // Required, min 3 chars
  password: string;     // Required, min 8 chars
}
```

**Response** (201 Created):
```typescript
{
  message: string;
  user: {
    id: number;
    email: string;
    username: string;
    is_active: boolean;
    created_at: string;  // ISO datetime
  }
}
```

**Cookies Set**: `access_token`, `refresh_token` (HttpOnly)

---

### POST /auth/login
**Request Body**:
```typescript
{
  email: string;        // ✅ Uses EMAIL, not username!
  password: string;
}
```

**Response** (200 OK):
```typescript
{
  message: string;
  user: {
    id: number;
    email: string;
    username: string;
    is_active: boolean;
    created_at: string;
  }
}
```

**Cookies Set**: `access_token`, `refresh_token` (HttpOnly)

---

### GET /auth/me
**Headers**: Cookies (automatic)

**Response** (200 OK):
```typescript
{
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}
```

---

### POST /auth/logout
**Headers**: Cookies (automatic)

**Response** (200 OK):
```typescript
{
  message: string;
}
```

**Cookies Cleared**: `access_token`, `refresh_token`

---

## ✅ Task Endpoints

### POST /tasks
**Request Body**:
```typescript
{
  title: string;                    // Required, 1-200 chars
  description?: string | null;       // Optional, max 1000 chars
  is_urgent: boolean;               // Default: false
  is_important: boolean;            // Default: false
  status: "todo" | "in_progress" | "done";  // ✅ Lowercase!
  due_date?: string | null;         // ISO datetime, optional
  category_id?: number | null;      // Optional, can be null
  tag_ids?: number[];               // Optional, array of tag IDs
}
```

**Response** (201 Created):
```typescript
{
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  is_urgent: boolean;
  is_important: boolean;
  status: "todo" | "in_progress" | "done";
  due_date: string | null;
  category_id: number | null;

  // Computed fields
  quadrant: "DO_FIRST" | "SCHEDULE" | "DELEGATE" | "ELIMINATE";
  is_overdue: boolean;
  days_until_due: number | null;

  // Relationships
  category: {
    id: number;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;

  tags: Array<{
    id: number;
    name: string;
    color: string | null;
  }>;

  // Timestamps
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

---

### GET /tasks
**Query Parameters** (all optional):
```typescript
// Basic filters
status?: "todo" | "in_progress" | "done";
category_id?: number;

// Priority matrix
is_urgent?: boolean;
is_important?: boolean;
quadrant?: "DO_FIRST" | "SCHEDULE" | "DELEGATE" | "ELIMINATE";

// Multiple filters
category_ids?: string;  // "1,2,3"
tag_ids?: string;       // "1,2,3"

// Date filters
due_before?: string;    // ISO datetime
due_after?: string;
created_after?: string;
overdue_only?: boolean;
no_due_date?: boolean;

// Completion
completed?: boolean;
completed_after?: string;

// Search
search?: string;        // Searches title and description

// Sorting
sort_by?: "created_at" | "updated_at" | "due_date" | "title" | "priority";
sort_order?: "asc" | "desc";  // Default: "desc"

// Pagination
skip?: number;          // Default: 0
limit?: number;         // Default: 100, max: 100
```

**Response** (200 OK):
```typescript
{
  total: number;
  tasks: Array<TaskResponse>;  // Same as POST /tasks response
}
```

---

### GET /tasks/{id}
**Path Parameter**: `id` (number)

**Response** (200 OK):
```typescript
TaskResponse  // Same structure as POST /tasks
```

---

### PATCH /tasks/{id}
**Path Parameter**: `id` (number)

**Request Body** (all fields optional):
```typescript
{
  title?: string;
  description?: string | null;
  is_urgent?: boolean;
  is_important?: boolean;
  status?: "todo" | "in_progress" | "done";
  due_date?: string | null;
  category_id?: number | null;
  tag_ids?: number[];
}
```

**Response** (200 OK):
```typescript
TaskResponse  // Updated task
```

---

### DELETE /tasks/{id}
**Path Parameter**: `id` (number)

**Response** (204 No Content)

---

## 📁 Category Endpoints

### POST /categories
**Request Body**:
```typescript
{
  name: string;         // Required, 1-50 chars
  color?: string;       // Optional, hex color "#RRGGBB"
  icon?: string;        // Optional, max 50 chars (emoji or icon name)
}
```

**Response** (201 Created):
```typescript
{
  id: number;
  user_id: number;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}
```

---

### GET /categories
**Response** (200 OK):
```typescript
Array<{
  id: number;
  user_id: number;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}>
```

---

### GET /categories/{id}
**Response** (200 OK):
```typescript
{
  id: number;
  user_id: number;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: string;
}
```

---

### PATCH /categories/{id}
**Request Body** (all optional):
```typescript
{
  name?: string;
  color?: string;
  icon?: string;
}
```

**Response** (200 OK):
```typescript
CategoryResponse  // Updated category
```

---

### DELETE /categories/{id}
**Response** (204 No Content)

---

## 🏷️ Tag Endpoints

### POST /tags
**Request Body**:
```typescript
{
  name: string;         // Required, 1-30 chars
  color?: string;       // Optional, hex color "#RRGGBB", default: "#3B82F6"
}
```

**Response** (201 Created):
```typescript
{
  id: number;
  user_id: number;
  name: string;
  color: string;        // Default color if not provided
  created_at: string;
}
```

---

### GET /tags
**Response** (200 OK):
```typescript
Array<{
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}>
```

---

### GET /tags/{id}
**Response** (200 OK):
```typescript
{
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}
```

---

### PATCH /tags/{id}
**Request Body** (all optional):
```typescript
{
  name?: string;
  color?: string;
}
```

**Response** (200 OK):
```typescript
TagResponse  // Updated tag
```

---

### DELETE /tags/{id}
**Response** (204 No Content)

---

## 🤖 AI Endpoints

### POST /ai/parse
**Request Body**:
```typescript
{
  text: string;  // Natural language task description
}
```

**Response** (200 OK):
```typescript
{
  title: string;
  description: string | null;
  due_date: string | null;
  is_urgent: boolean;
  is_important: boolean;
  tags: string[];           // Suggested tag names
  confidence: number;       // 0-1
  reasoning: string;
}
```

---

### POST /ai/priority/tasks/{task_id}/suggest
**Path Parameter**: `task_id` (number)

**Response** (200 OK):
```typescript
{
  suggested_is_urgent: boolean;
  suggested_is_important: boolean;
  confidence: number;           // 0-1
  reasoning: string;
  similar_tasks_count: number;
}
```

---

### GET /ai/priority/tasks/{task_id}/similar
**Path Parameter**: `task_id` (number)

**Query Parameters**:
```typescript
limit?: number;  // Default: 5, max: 20
```

**Response** (200 OK):
```typescript
{
  task_id: number;
  similar_tasks: Array<{
    id: number;
    title: string;
    is_urgent: boolean;
    is_important: boolean;
    similarity_score: number;  // 0-1
  }>;
}
```

---

## 📊 Analytics Endpoints

### GET /analytics/overview
**Query Parameters**:
```typescript
days?: number;  // Default: 30
```

**Response** (200 OK):
```typescript
{
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  todo_tasks: number;
  completion_rate: number;        // Percentage
  productivity_score: number;      // 0-100
  average_completion_time: number | null;  // In hours
  overdue_tasks: number;
}
```

---

### GET /analytics/trends
**Query Parameters**:
```typescript
days?: number;  // Default: 30
```

**Response** (200 OK):
```typescript
{
  daily_completion: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
}
```

---

### GET /analytics/priority-distribution
**Response** (200 OK):
```typescript
{
  do_first: number;      // Urgent + Important
  schedule: number;      // Important, not urgent
  delegate: number;      // Urgent, not important
  eliminate: number;     // Neither urgent nor important
}
```

---

### GET /analytics/category-performance
**Response** (200 OK):
```typescript
Array<{
  category_id: number | null;
  category_name: string | null;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
}>
```

---

### GET /analytics/tag-usage
**Response** (200 OK):
```typescript
Array<{
  tag_id: number;
  tag_name: string;
  task_count: number;
}>
```

---

## 🚨 Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```typescript
{
  detail: string;  // Error message
}
```

### 401 Unauthorized
```typescript
{
  detail: "Not authenticated"
}
```

### 404 Not Found
```typescript
{
  detail: "Task not found" | "Category not found" | "Tag not found"
}
```

### 422 Validation Error
```typescript
{
  error: "ValidationError";
  detail: string;
  errors: Array<{
    field: string;
    message: string;
    type: string;
    input: any;
  }>;
  correlation_id: string;
}
```

---

## 📝 Important Notes

### 1. Authentication
- All endpoints except `/auth/register` and `/auth/login` require authentication
- Authentication uses **HttpOnly cookies** (automatic with `withCredentials: true`)
- Access token expires in **15 minutes**
- Refresh token expires in **7 days**

### 2. Task Status Values
- ✅ **CORRECT**: `"todo"`, `"in_progress"`, `"done"`
- ❌ **WRONG**: `"TODO"`, `"IN_PROGRESS"`, `"DONE"`

### 3. Category/Tag IDs
- Use `null` or `0` to remove category from task
- Use empty array `[]` to remove all tags
- Backend validates and filters out invalid IDs

### 4. Date Formats
- All dates are **ISO 8601 strings**: `"2025-12-24T10:30:00Z"`
- Use `new Date().toISOString()` in JavaScript

### 5. Pagination
- Default limit: 100 tasks
- Maximum limit: 100 tasks
- Use `skip` and `limit` for pagination

---

**Always check this document before implementing API calls!**
