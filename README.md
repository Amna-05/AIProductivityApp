# ELEVATE - AI-Powered Task Management

A production-ready full-stack task management application with AI-powered natural language processing, Eisenhower Priority Matrix, and comprehensive analytics.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.118+-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com/)

**Live Demo:** [Frontend on Vercel](https://your-app.vercel.app) | [API on Railway](https://your-app.railway.app/docs)

## ✨ Features

### Core Functionality
- **Task Management** - Full CRUD with advanced filtering (15+ query parameters)
- **Priority Matrix** - Eisenhower Matrix quadrants (Urgent/Important classification)
- **User Authentication** - JWT-based auth with httpOnly cookies + auto token refresh
- **Role-Based Authorization** - Admin dashboard with user management capabilities
- **Analytics Dashboard** - Comprehensive insights (trends, distributions, productivity metrics)
- **AI Task Parser** - Natural language & voice input task creation using Groq LLaMA 3.3 70B
- **Category & Tag System** - Flexible organization with many-to-many relationships

### Frontend Features

- **Modern React 19** - Latest React with Next.js 15 App Router
- **Responsive Design** - Mobile-first with Tailwind CSS 4.0
- **Dark/Light Mode Ready** - Theme system built-in
- **Real-time Updates** - TanStack Query with automatic cache invalidation
- **Voice Input** - Web Speech API for hands-free task creation
- **Animations** - Smooth transitions with CSS animations

### Technical Highlights
- **Clean Architecture** - Repository pattern with service layer separation
- **Type Safety** - Pydantic v2 (backend) + TypeScript (frontend)
- **Async/Await** - Fully asynchronous SQLAlchemy 2.0 ORM
- **Production Logging** - Structured logging with Loguru, correlation IDs
- **Database Migrations** - Alembic with version control
- **Comprehensive Testing** - 34 unit tests with pytest-asyncio

## 🏗️ Project Structure

```
task-manager-app/
├── app/                         # Backend (FastAPI)
│   ├── api/endpoints/           # API route handlers
│   ├── core/                    # Config, security, logging
│   ├── db/repositories/         # Data access layer
│   ├── middleware/              # Request/response processing
│   ├── models/                  # SQLAlchemy ORM models
│   ├── schemas/                 # Pydantic schemas
│   └── services/                # Business logic
├── frontend/                    # Frontend (Next.js)
│   ├── app/                     # Next.js App Router pages
│   │   ├── (auth)/              # Public auth pages
│   │   └── (dashboard)/         # Protected dashboard
│   ├── components/              # React components
│   │   ├── ai/                  # AI task parser
│   │   ├── layout/              # Sidebar, headers
│   │   ├── tasks/               # Task cards, forms
│   │   └── ui/                  # shadcn/ui components
│   └── lib/                     # Utils, API client, stores
├── alembic/                     # Database migrations
├── tests/                       # Backend tests
├── Dockerfile                   # Railway deployment
└── railway.toml                 # Railway config
```

**Design Patterns**: Repository Pattern, Dependency Injection, Service Layer, Zustand State Management

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- [uv](https://github.com/astral-sh/uv) (recommended) or pip

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd task-manager-app

# Install dependencies with uv (fast)
uv sync

# Or with pip
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Create databases
createdb task_manager_db
createdb task_manager_test_db

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

Server runs at: http://localhost:8000
API Documentation: http://localhost:8000/docs (Swagger UI)

### Creating an Admin User

After registration, promote a user to admin using the provided script:

```bash
# Edit make_admin.py to set your email
# Then run:
uv run python make_admin.py

# Or manually via SQL:
# UPDATE users SET is_superuser = true WHERE email = 'your-email@example.com';
```

Admin users can access:

- Admin dashboard at `/admin` (frontend) or `/api/v1/admin/*` (API)
- User management (toggle admin/active status)
- System statistics

## 📊 API Overview

### Authentication
```http
POST   /api/v1/auth/register          # Create new user
POST   /api/v1/auth/login             # Login with credentials
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/logout            # Logout (revoke refresh token)
POST   /api/v1/auth/forgot-password   # Request password reset (logs token to console)
POST   /api/v1/auth/reset-password    # Reset password with token
GET    /api/v1/auth/me                # Get current user info
```

### Admin (Requires Admin Role)

```http
GET    /api/v1/admin/stats                      # System statistics
GET    /api/v1/admin/users                      # List all users with task counts
PATCH  /api/v1/admin/users/{id}/toggle-admin    # Toggle admin status
PATCH  /api/v1/admin/users/{id}/toggle-active   # Toggle active status
```

### Tasks
```http
GET    /api/v1/tasks                  # List tasks (with advanced filters)
POST   /api/v1/tasks                  # Create task
GET    /api/v1/tasks/{id}             # Get task details
PATCH  /api/v1/tasks/{id}             # Update task
DELETE /api/v1/tasks/{id}             # Delete task
```

**Advanced Filtering** (15+ query parameters):
- Status: `status=todo|in_progress|done`
- Priority: `is_urgent=true`, `is_important=true`, `quadrant=DO_FIRST`
- Categories/Tags: `category_id=1`, `tag_ids=1,2,3`
- Dates: `due_before=2024-12-31`, `due_after=2024-01-01`, `overdue_only=true`
- Search: `search=keyword`
- Pagination: `skip=0`, `limit=20`, `sort_by=due_date`, `sort_order=asc`

### Analytics
```http
GET    /api/v1/analytics/overview                    # Summary metrics
GET    /api/v1/analytics/priority-distribution       # Quadrant breakdown
GET    /api/v1/analytics/completion-trends           # Time-series data
GET    /api/v1/analytics/category-performance        # Category stats
GET    /api/v1/analytics/dashboard                   # Combined endpoint
```

### AI Features
```http
POST   /api/v1/ai/tasks/parse         # Parse natural language to task
POST   /api/v1/ai/tasks/create-from-voice  # Create task from transcription
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_user_repository.py -v

# View coverage report
start htmlcov/index.html  # Windows
open htmlcov/index.html   # Mac/Linux
```

### Test Coverage Highlights
- **Security utilities**: 94%
- **User repository**: 93%
- **AI task parser**: 100%
- **34 unit tests** covering repositories, services, and core utilities

## 🛠️ Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | FastAPI 0.115+ | High-performance async web framework |
| **ORM** | SQLAlchemy 2.0 | Async database toolkit |
| **Database** | PostgreSQL 14+ | Relational database |
| **Validation** | Pydantic v2 | Data validation and serialization |
| **Auth** | python-jose, passlib | JWT tokens, password hashing |
| **AI** | Groq API (LLaMA 3.3) | Natural language task parsing |
| **Logging** | Loguru | Structured logging with rotation |
| **Testing** | pytest, pytest-asyncio | Unit and integration testing |
| **Migrations** | Alembic | Database version control |
| **Package Manager** | uv | Fast Python package installer |

## 📁 Key Files

### Application Core
- [app/main.py](app/main.py) - FastAPI application setup, middleware, CORS
- [app/core/config.py](app/core/config.py) - Environment-based configuration (Pydantic Settings)
- [app/core/security.py](app/core/security.py) - JWT tokens, password hashing (bcrypt)

### Repositories (Data Access Layer)
- [app/db/repositories/task_repository.py](app/db/repositories/task_repository.py) - Task CRUD with complex filtering (314 lines)
- [app/db/repositories/user_repository.py](app/db/repositories/user_repository.py) - User management and authentication

### Services (Business Logic)
- [app/services/analytics_service.py](app/services/analytics_service.py) - Analytics calculations (685 lines)
- [app/services/ai_task_parser.py](app/services/ai_task_parser.py) - AI-powered task parsing

### API Endpoints
- [app/api/endpoints/tasks.py](app/api/endpoints/tasks.py) - Task management endpoints (291 lines)
- [app/api/endpoints/analytics.py](app/api/endpoints/analytics.py) - Analytics endpoints
- [app/api/endpoints/auth.py](app/api/endpoints/auth.py) - Authentication + password reset
- [app/api/endpoints/admin.py](app/api/endpoints/admin.py) - Admin user management

### Middleware
- [app/middleware/logging_middleware.py](app/middleware/logging_middleware.py) - Request logging with correlation IDs
- [app/middleware/error_handler.py](app/middleware/error_handler.py) - Global exception handling

## 📝 Database Schema

```sql
users
├── id (PK)
├── email (unique)
├── username (unique)
├── hashed_password
├── is_active
├── is_superuser (admin role)
└── timestamps

tasks
├── id (PK)
├── user_id (FK → users)
├── category_id (FK → categories)
├── title, description
├── is_urgent, is_important
├── status (todo|in_progress|done)
├── due_date, completed_at
└── timestamps

categories, tags (many-to-many with tasks via task_tags)
refresh_tokens (for JWT token management & password reset)
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Authentication**: Access tokens (15 min) + Refresh tokens (7 days)
- **Password Reset**: Token-based reset with one-time use tokens
- **HttpOnly Cookies**: CSRF protection
- **Token Revocation**: Refresh tokens stored in database
- **Role-Based Access Control**: Admin-only routes with `require_admin()` dependency
- **User Isolation**: All queries filtered by `user_id`
- **Input Validation**: Pydantic schemas with type checking
- **CORS Configuration**: Restricted origins
- **Admin Protection**: Prevents self-demotion and self-deactivation

## 📊 Logging & Monitoring

**Structured Logging** with Loguru:
- Daily rotation with 30-day retention
- Multiple outputs: console, file, JSON, errors-only
- Correlation IDs for request tracing
- Performance monitoring (alerts on slow requests >1s, >3s)
- Sensitive data filtering (passwords, tokens)

**Log Files**:
- `logs/app_YYYY-MM-DD.log` - Application logs
- `logs/app_json_YYYY-MM-DD.log` - JSON format
- `logs/error_YYYY-MM-DD.log` - Errors only

**Monitoring Ready**:
- Sentry integration prepared (add `SENTRY_DSN` to `.env`)
- Correlation IDs in all logs for distributed tracing

## 🚦 API Response Format

### Success Response
```json
{
  "id": 1,
  "title": "Complete project documentation",
  "status": "in_progress",
  "is_urgent": true,
  "is_important": true,
  "quadrant": "DO_FIRST",
  "due_date": "2024-12-31T23:59:59Z",
  "created_at": "2024-12-26T10:00:00Z"
}
```

### Error Response
```json
{
  "error": "ValidationError",
  "detail": "Task title is required",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 🔧 Configuration

Environment variables (`.env`):

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/task_manager_db

# Security
SECRET_KEY=<generate-with-secrets-token>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI Services
GROQ_API_KEY=<your-groq-api-key>

# Optional: Monitoring
SENTRY_DSN=<your-sentry-dsn>
```

## 📈 Performance Considerations

- **Connection Pooling**: Configured pool (size=5, max_overflow=10, timeout=30s)
- **Async Operations**: All I/O operations use async/await
- **Eager Loading**: Uses `selectinload()` to prevent N+1 queries
- **Pagination**: Offset/limit pagination for list endpoints
- **Index Optimization**: Indexes on frequently queried columns

## 🚢 Deployment

### Backend → Railway

1. Create new project in [Railway](https://railway.app)
2. Deploy from GitHub repo
3. Add PostgreSQL plugin
4. Set environment variables:

```bash
ENVIRONMENT=production
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app"]
FRONTEND_URL=https://your-app.vercel.app
GROQ_API_KEY=<your-key>
# DATABASE_URL auto-injected by Railway
```

### Frontend → Vercel

1. Import `frontend` folder to [Vercel](https://vercel.com)
2. Set environment variable:

```bash
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api/v1
```

Deploy and update Railway CORS with your Vercel domain.

### Local Development

```bash
# Backend
uvicorn app.main:app --reload  # http://localhost:8000

# Frontend
cd frontend && npm run dev     # http://localhost:3000
```

## 🛣️ Roadmap

**Completed** ✅

- [x] Task CRUD with advanced filtering
- [x] User authentication with JWT + auto refresh
- [x] Password reset functionality
- [x] Role-based authorization (Admin)
- [x] Admin dashboard & user management
- [x] Analytics dashboard
- [x] AI-powered task parsing with voice input
- [x] Comprehensive unit tests
- [x] Structured logging
- [x] Production deployment (Railway + Vercel)

**Planned** 🔮

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Push notifications

## 🔑 Password Reset Flow

The password reset feature supports **two modes**:

### Development Mode (Default)
Without email configuration, tokens are logged to the backend console:

1. User requests password reset via `/auth/forgot-password`
2. Reset token is **logged to backend console** (development mode)
3. User clicks reset link: `http://localhost:3000/reset-password?token=<TOKEN>`
4. User enters new password
5. All refresh tokens are revoked (forces re-login)

### Production Mode (Email-Based)
With **Resend API configured**, users receive professional HTML emails:

1. User requests password reset
2. System sends **HTML email** with reset link via Resend
3. User clicks link in email to reset password
4. Password is updated and all sessions are invalidated

**Setting Up Email (Recommended for Production):**

```bash
# 1. Get free Resend API key (100 emails/day free tier)
# Visit: https://resend.com

# 2. Add to your .env file
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=ELEVATE <onboarding@resend.dev>  # Use this for testing
FRONTEND_URL=http://localhost:3000  # Update for production

# 3. Restart backend server
# Emails will now be sent automatically!
```

**Email Features:**
- Professional HTML templates with branding
- Secure reset links with 1-hour expiration
- Automatic fallback to console logging if email fails
- Graceful degradation (works without email configured)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Amazing async Python framework
- [SQLAlchemy](https://www.sqlalchemy.org/) - Powerful ORM toolkit
- [Groq](https://groq.com/) - Ultra-fast AI inference
- [Pydantic](https://docs.pydantic.dev/) - Data validation library

---

**Built with** ❤️ **using modern Python best practices**

*For detailed API documentation, visit* `/docs` *when running the server*
