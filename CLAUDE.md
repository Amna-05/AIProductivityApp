# CLAUDE.md
in all interactions and  messages, be extremely concise and sacrifice grammar for the sake of concision.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

At the end of each plan, give me a list of unresolved questions to answer, if any, and again, make the questions extremely concise. Sacrifice grammar for the sake of concision.

## Project Overview

ELEVATE is a production-ready full-stack task management application featuring AI-powered natural language processing, built with FastAPI (backend) and Next.js (frontend). The application implements the Eisenhower Priority Matrix for intelligent task prioritization.

## Development Commands

### Backend (Python/FastAPI)

```bash
# Install dependencies (use uv for speed)
uv sync

# Database setup
createdb task_manager_db
createdb task_manager_test_db
alembic upgrade head

# Development server
uvicorn app.main:app --reload                    # http://localhost:8000
# API docs available at http://localhost:8000/docs

# Testing
pytest                                            # Run all 34 tests
pytest tests/test_tasks.py -v                    # Single file
pytest --cov=app --cov-report=html               # With coverage
# View coverage: start htmlcov/index.html (Windows) or open htmlcov/index.html (Mac)

# Database migrations
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head                              # Apply migrations
alembic downgrade -1                              # Rollback one migration

# Admin user setup
python make_admin.py                              # Edit file first to set email
```

### Frontend (Next.js/React)

```bash
cd frontend

# Install dependencies
npm install

# Development
npm run dev       # http://localhost:3000
npm run build     # Production build
npm run start     # Run production build
npm run lint      # ESLint validation
```

## Architecture Overview

### Backend Architecture (Clean/Layered)

The backend follows a **Repository Pattern** with clear separation of concerns:

```
Request → Endpoint (thin controller)
        → Service (business logic)
        → Repository (data access)
        → Database
```

**Key Architectural Patterns:**

1. **Repository Pattern** (`app/db/repositories/`)
   - All database operations go through repositories
   - `TaskRepository`, `UserRepository`, `RefreshTokenRepository`
   - Enables easy testing with mocked repositories

2. **Service Layer** (`app/services/`)
   - Complex business logic isolated from endpoints
   - `AnalyticsService` - Handles all analytics calculations (685 lines)
   - `AITaskParserService` - Groq API integration for NLP task parsing

3. **Dependency Injection** (`app/core/dependencies.py`)
   - `get_db()` - Database session injection
   - `get_current_active_user()` - Auth check on protected routes
   - `require_admin()` - Admin-only route protection

4. **Model-Schema Separation**
   - SQLAlchemy models (`app/models/`) - Database representation
   - Pydantic schemas (`app/schemas/`) - API validation/serialization
   - Clear DTO (Data Transfer Object) pattern

**Critical Backend Files:**

- [app/main.py](app/main.py) - Application entry point, middleware registration
- [app/core/config.py](app/core/config.py) - Environment-based configuration (30+ variables)
- [app/core/security.py](app/core/security.py) - JWT token management, password hashing
- [app/db/repositories/task_repository.py](app/db/repositories/task_repository.py) - Task CRUD with 15+ query parameters
- [app/services/analytics_service.py](app/services/analytics_service.py) - Complex analytics calculations

### Frontend Architecture (Next.js App Router)

**Route Structure:**
- `app/(auth)/` - Public authentication pages (login, register, password reset)
- `app/(dashboard)/` - Protected dashboard routes (tasks, analytics, admin)
- Route groups use parentheses to organize without affecting URLs

**State Management:**
- **Zustand** - Global auth state ([lib/store/authStore.ts](frontend/lib/store/authStore.ts))
- **TanStack Query** - Server state caching, automatic refetching
- **React Hook Form** - Form state with Zod validation

**API Integration:**
- [lib/api/client.ts](frontend/lib/api/client.ts) - Axios instance with token refresh interceptor
- [lib/api/*.ts](frontend/lib/api/) - Modular API functions per resource (tasks, auth, analytics, categories, tags)

**Critical Frontend Files:**
- [frontend/lib/api/client.ts](frontend/lib/api/client.ts) - API client with auto token refresh
- [frontend/lib/store/authStore.ts](frontend/lib/store/authStore.ts) - Authentication state
- [frontend/components/tasks/TaskFormDialog.tsx](frontend/components/tasks/TaskFormDialog.tsx) - Main task creation/editing form

## Database Schema & Migrations

**Schema Overview:**
```
users (email, username, hashed_password, is_superuser)
  ↓
tasks (title, description, is_urgent, is_important, status, due_date)
  ↓
categories (user-owned organization)
tags (many-to-many with tasks via task_tags junction table)
refresh_tokens (JWT token management & password reset tokens)
```

**Working with Migrations:**
```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Add new field to tasks"

# Review generated migration in alembic/versions/
# Edit if needed (alembic can't detect all changes)

# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

**Important:** Alembic auto-generation doesn't detect:
- Changes to table names
- Changes to column constraints (CHECK, UNIQUE modifications)
- Complex index changes

Always review generated migrations before applying.

## Authentication Flow

**Token Strategy:**
- Access tokens: 15 minutes (short-lived)
- Refresh tokens: 7 days (stored in httpOnly cookies)
- Tokens stored in database for revocation support

**Flow:**
1. User logs in → Backend creates access + refresh tokens
2. Tokens stored in httpOnly cookies (prevents XSS)
3. Frontend includes cookies automatically with requests
4. On 401 error → Frontend auto-refreshes using refresh token
5. New access token issued, request retried

**Implementation:**
- Backend: [app/api/endpoints/auth.py](app/api/endpoints/auth.py)
- Frontend interceptor: [frontend/lib/api/client.ts](frontend/lib/api/client.ts) (see response interceptor)

## Testing Strategy

**Backend Testing (pytest):**
```bash
# Test structure
tests/
├── unit/                       # Isolated unit tests
│   ├── test_user_repository.py
│   ├── test_task_repository.py
│   ├── test_ai_task_parser.py
│   └── test_security.py
├── test_auth.py                # Auth integration tests
├── test_tasks.py               # Task CRUD tests
└── conftest.py                 # Pytest fixtures (test_db, test_user, etc.)
```

**Key Testing Patterns:**
- Use `@pytest_asyncio.fixture` for async fixtures
- In-memory SQLite for fast tests (`conftest.py` sets up fresh DB per test)
- Mock external APIs (Groq) using `pytest-mock`
- Coverage target: 80%+ (current: 35%, key components 94%+)

**Running Specific Tests:**
```bash
pytest tests/unit/test_user_repository.py::test_create_user -v
pytest -k "test_create" -v      # Run all tests matching pattern
pytest --lf                      # Run last failed tests
```

## Environment Configuration

**Required Environment Variables:**

Backend (`.env` in root):
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/task_manager_db
DATABASE_URL_SYNC=postgresql://user:pass@localhost:5432/task_manager_db  # For Alembic

# Security
SECRET_KEY=<generate-with-secrets-token-urlsafe>
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI Features
GROQ_API_KEY=<from-groq-console>

# Email (optional - falls back to console logging)
RESEND_API_KEY=<from-resend.com>
EMAIL_FROM=ELEVATE <onboarding@resend.dev>
FRONTEND_URL=http://localhost:3000

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

Frontend (`.env.local` in frontend/):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Getting API Keys:**
- Groq: https://console.groq.com (free tier available)
- Resend: https://resend.com (100 emails/day free)

## AI Integration (Groq API)

**Natural Language Task Parsing:**

The AI feature parses natural language input into structured task data:

```
User input: "urgent meeting tomorrow at 2pm with client"
              ↓
AITaskParser service
              ↓
Groq LLaMA 3.3 70B model
              ↓
{
  title: "Meeting with client",
  due_date: "2024-12-27T14:00:00Z",
  is_urgent: true,
  is_important: true,
  confidence: 0.95
}
```

**Implementation:**
- Service: [app/services/ai_task_parser.py](app/services/ai_task_parser.py)
- Endpoint: [app/api/endpoints/ai.py](app/api/endpoints/ai.py)
- Frontend: [frontend/components/ai/AITaskParserDialog.tsx](frontend/components/ai/AITaskParserDialog.tsx)

**Testing AI Features:**
- Mock Groq API calls in tests using `pytest-mock`
- See [tests/unit/test_ai_task_parser.py](tests/unit/test_ai_task_parser.py) for examples

## Common Development Patterns

### Adding a New Endpoint

1. **Create Pydantic schemas** (`app/schemas/`)
   ```python
   class FeatureCreate(BaseModel):
       name: str

   class FeatureResponse(BaseModel):
       id: int
       name: str
       created_at: datetime
   ```

2. **Create SQLAlchemy model** (`app/models/`)
   ```python
   class Feature(Base):
       __tablename__ = "features"
       id = Column(Integer, primary_key=True)
       name = Column(String, nullable=False)
   ```

3. **Create repository** (`app/db/repositories/`)
   ```python
   class FeatureRepository:
       async def create(self, data: FeatureCreate) -> Feature:
           # Database operations here
   ```

4. **Create endpoint** (`app/api/endpoints/`)
   ```python
   @router.post("/", response_model=FeatureResponse)
   async def create_feature(
       data: FeatureCreate,
       db: AsyncSession = Depends(get_db),
       current_user: User = Depends(get_current_active_user)
   ):
       repo = FeatureRepository(db)
       return await repo.create(data)
   ```

5. **Register router** in [app/main.py](app/main.py)

6. **Generate migration**
   ```bash
   alembic revision --autogenerate -m "Add features table"
   alembic upgrade head
   ```

### Query Optimization

**Prevent N+1 Queries:**
```python
# ❌ BAD - N+1 query problem
tasks = await db.execute(select(Task).where(Task.user_id == user_id))
for task in tasks:
    category = task.category  # Lazy load - triggers extra query

# ✅ GOOD - Eager loading
from sqlalchemy.orm import selectinload
tasks = await db.execute(
    select(Task)
    .where(Task.user_id == user_id)
    .options(selectinload(Task.category), selectinload(Task.tags))
)
```

**Pagination:**
```python
# Always include skip/limit for list endpoints
query = select(Task).offset(skip).limit(limit)
```

### Frontend API Calls

**Using React Query:**
```typescript
// Read operation
const { data, isLoading, error } = useQuery({
  queryKey: ["tasks", filters],
  queryFn: () => tasksApi.getAll(filters),
  staleTime: 60000  // Cache for 1 minute
});

// Mutation (create/update/delete)
const mutation = useMutation({
  mutationFn: tasksApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    toast.success("Task created!");
  }
});
```

## Security Considerations

**User Data Isolation:**
- All queries MUST filter by `user_id` from authenticated user
- Never trust user_id from request body - always use `get_current_active_user()`

**Admin Routes:**
```python
@router.get("/admin/stats")
async def get_stats(
    current_user: User = Depends(require_admin)  # Admin-only
):
    ...
```

**Password Reset:**
- Tokens are one-time use only
- 1-hour expiration
- All refresh tokens revoked on password reset (forces re-login)

## Logging & Debugging

**Structured Logging with Loguru:**

Backend logs include:
- Correlation IDs (trace requests across services)
- User IDs (track user actions)
- Performance metrics (slow request alerts)

```python
# In code
from app.core.logging_config import logger

logger.info("Task created", task_id=task.id, user_id=user.id)
logger.warning("Slow query", duration=duration, query=query)
```

**Log Files:**
- `logs/app_YYYY-MM-DD.log` - All logs
- `logs/app_json_YYYY-MM-DD.log` - JSON format (for log aggregation)
- `logs/error_YYYY-MM-DD.log` - Errors only

**Finding Issues:**
```bash
# Search logs by correlation ID
grep "correlation_id=550e8400" logs/app_*.log

# View recent errors
tail -f logs/error_*.log
```

## Performance Considerations

**Database Connection Pooling:**
- Pool size: 5 connections
- Max overflow: 10 additional connections
- Timeout: 30 seconds
- Recycle: 3600 seconds (1 hour)

Configured in [app/core/config.py](app/core/config.py)

**Async All The Way:**
- All database operations use `async/await`
- Use `AsyncSession` from SQLAlchemy 2.0
- Never block the event loop with sync I/O

**Frontend Performance:**
- React Query caches API responses
- Debounce search inputs
- Pagination for large lists

## Project-Specific Conventions

**Quadrant Naming (Eisenhower Matrix):**
- `DO_FIRST` - Urgent + Important
- `SCHEDULE` - Not Urgent + Important
- `DELEGATE` - Urgent + Not Important
- `ELIMINATE` - Not Urgent + Not Important

**Task Status Enum:**
- `todo` - Not started
- `in_progress` - Currently working
- `done` - Completed

**Timestamp Fields:**
- `created_at` - Auto-set on creation
- `updated_at` - Auto-updated on modification
- `completed_at` - Set when status changes to 'done'

## Troubleshooting

**Common Issues:**

1. **"Module not found" in frontend**
   ```bash
   cd frontend && npm install
   # Delete .next folder and restart dev server
   rm -rf .next
   npm run dev
   ```

2. **Database connection errors**
   ```bash
   # Verify PostgreSQL is running
   pg_isready

   # Check DATABASE_URL format
   # Must use postgresql+asyncpg:// for backend
   # Use postgresql:// for Alembic migrations
   ```

3. **Alembic migration conflicts**
   ```bash
   # Reset to last working migration
   alembic downgrade <revision>

   # Delete problematic migration file
   # Re-generate
   alembic revision --autogenerate -m "description"
   ```

4. **Test database errors**
   ```bash
   # Recreate test database
   dropdb task_manager_test_db
   createdb task_manager_test_db
   ```

5. **CORS errors in frontend**
   - Verify `BACKEND_CORS_ORIGINS` in backend `.env` includes frontend URL
   - Check frontend is making requests to correct backend URL

## Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend Framework | FastAPI | 0.118+ |
| Frontend Framework | Next.js | 15.5.9 |
| Database | PostgreSQL | 14+ |
| ORM | SQLAlchemy | 2.0+ |
| Validation | Pydantic | v2 |
| Auth | JWT (python-jose) | - |
| AI | Groq LLaMA 3.3 70B | - |
| State Management | Zustand + React Query | 5.0+ / 5.90+ |
| Styling | Tailwind CSS | 4.0 |
| Testing | pytest + pytest-asyncio | - |
| Package Manager (Backend) | uv | - |
| Package Manager (Frontend) | npm | - |

## Additional Resources

- API Documentation: http://localhost:8000/docs (when backend running)
- README: [README.md](README.md) - Comprehensive project documentation
- Environment Variables: [.env.example](.env.example) - All configuration options
