# Phase 1 Implementation Guide

## 🎯 What We Built

Phase 1 adds **production-grade logging, monitoring, and error handling** to your task manager API.

---

## 📊 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                           │
│                 GET /api/v1/tasks                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  [1] LOGGING MIDDLEWARE                                     │
│  • Generate Correlation ID: "a1b2c3d4-..."                  │
│  • Start timer                                              │
│  • Log: "→ GET /api/v1/tasks (correlation_id=a1b2c3d4)"    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  [2] CORS MIDDLEWARE                                        │
│  • Check origin is allowed                                  │
│  • Add CORS headers                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  [3] YOUR ENDPOINT HANDLER                                  │
│  • Process request                                          │
│  • Query database                                           │
│  • Build response                                           │
│                                                             │
│  If ERROR occurs → Go to [4]                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  [4] EXCEPTION HANDLERS (if error)                          │
│  • Catch error                                              │
│  • Log with correlation ID                                  │
│  • Send to Sentry (if 500 error)                            │
│  • Return user-friendly error message                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  [5] GZIP COMPRESSION                                       │
│  • Compress response if > 1KB                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  [6] LOGGING MIDDLEWARE (response)                          │
│  • Stop timer (duration = 45ms)                             │
│  • Log: "← GET /api/v1/tasks → 200 (45ms)"                 │
│  • Add headers: X-Correlation-ID, X-Response-Time           │
│  • Alert if slow (>1s warning, >3s error)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    RESPONSE TO CLIENT
```

---

## 🔍 Component Deep Dive

### 1. Correlation ID System

**What problem does it solve?**

Imagine you're debugging a production issue:
- 1000 users making requests per minute
- Logs are mixed together
- User reports: "My request failed 2 minutes ago"
- **How do you find THAT specific request in 60,000 log entries?**

**Answer: Correlation IDs**

```
User Request #1 → correlation_id: "a1b2c3d4"
User Request #2 → correlation_id: "e5f6g7h8"
User Request #3 → correlation_id: "i9j0k1l2"
```

Now you can find ALL logs for ONE request:
```bash
grep "a1b2c3d4" logs/app_2025-12-22.log
```

Output:
```
21:07:41 | INFO | → GET /tasks (correlation_id=a1b2c3d4)
21:07:41 | INFO | Querying database (correlation_id=a1b2c3d4)
21:07:41 | INFO | Found 5 tasks (correlation_id=a1b2c3d4)
21:07:41 | INFO | ← GET /tasks → 200 (45ms) (correlation_id=a1b2c3d4)
```

**Returned to client in header:**
```
X-Correlation-ID: a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6
```

User reports issue → Give you correlation ID → You find exact logs instantly!

---

### 2. Structured Logging

**Before (with print statements):**
```python
print("User logged in")
print("Creating task")
```

**Problems:**
- No timestamp
- No log level
- No context
- No file/line number
- Can't filter or search efficiently

**After (with Loguru):**
```python
logger.info("User logged in", user_id=123, email="user@example.com")
logger.info("Creating task", user_id=123, task_title="Buy groceries")
```

**Output:**
```
2025-12-22 21:07:41 | INFO | app.api.auth:login:42 | User logged in | user_id=123 email="user@example.com"
2025-12-22 21:07:42 | INFO | app.api.tasks:create:89 | Creating task | user_id=123 task_title="Buy groceries"
```

**You get:**
- ✅ Timestamp (exact moment)
- ✅ Log level (INFO, WARNING, ERROR)
- ✅ Module, function, line number
- ✅ Message
- ✅ Structured context data

---

### 3. Log Outputs (4 simultaneous streams)

```
Your Application
       ↓
    Loguru
       ↓
    ┌──┴──┬──────────┬────────────┐
    ↓     ↓          ↓            ↓
 Console  File    Error File   JSON File
 (dev)   (prod)   (critical)   (tools)
```

#### Output 1: Console (Development)
```
[32m2025-12-22 21:07:41[0m | [1mINFO[0m | app.main:lifespan:55 | Starting API v1.0.0
                          ↑ Colors for readability
```

#### Output 2: File (Production Logs)
```
File: logs/app_2025-12-22.log
Rotation: Daily at midnight
Retention: 30 days
Compression: Zip old files

2025-12-22 21:07:41 | INFO | app.main:lifespan:55 | Starting API v1.0.0
2025-12-22 21:07:42 | INFO | app.middleware.logging_middleware:dispatch:47 | → GET /health
2025-12-22 21:07:42 | INFO | app.middleware.logging_middleware:dispatch:85 | ← GET /health → 200 (2.5ms)
```

#### Output 3: Error File (Critical Issues)
```
File: logs/error_2025-12-22.log
Rotation: 10 MB
Retention: 60 days (kept longer!)
Content: ONLY errors

2025-12-22 21:15:23 | ERROR | app.db.repositories.task_repository:get_by_id:45 | Database connection lost
Traceback (most recent call last):
  File "app/db/repositories/task_repository.py", line 45, in get_by_id
    task = await self.db.execute(query)
  sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) connection closed
```

#### Output 4: JSON File (For Tools)
```
File: logs/app_json_2025-12-22.log
Rotation: 100 MB
Format: JSON (one per line)

{"text":"Starting API","level":"INFO","timestamp":"2025-12-22T21:07:41Z","module":"app.main"}
{"text":"Request","level":"INFO","timestamp":"2025-12-22T21:07:42Z","method":"GET","path":"/health"}
```

**Use with tools:**
```bash
# Parse with jq
cat logs/app_json_2025-12-22.log | jq 'select(.level == "ERROR")'

# Import to ELK Stack (Elasticsearch, Logstash, Kibana)
# Import to Splunk
# Import to DataDog
```

---

### 4. Error Handling

**Scenario: User sends invalid data**

```python
# Request
POST /api/v1/tasks
{
  "invalid": "data"
  # Missing: title, is_urgent, is_important
}
```

**Without error handler:**
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```
😕 Confusing, technical, no correlation ID

**With our error handler:**
```json
{
  "error": "ValidationError",
  "detail": "Request validation failed",
  "errors": [
    {
      "field": "title",
      "message": "field required",
      "type": "value_error.missing",
      "input": null
    }
  ],
  "correlation_id": "a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6"
}
```
✅ Clear, structured, includes correlation ID for support

**Logged automatically:**
```
2025-12-22 21:10:15 | WARNING | app.middleware.error_handler | Validation error on POST /tasks | correlation_id=a1b2c3d4 errors=[...]
```

---

### 5. Performance Monitoring

**Automatic slow request detection:**

```python
# In logging_middleware.py
SLOW_REQUEST_THRESHOLD = 1.0      # 1 second
VERY_SLOW_REQUEST_THRESHOLD = 3.0  # 3 seconds

if duration > VERY_SLOW_REQUEST_THRESHOLD:
    logger.error("⚠️  VERY SLOW REQUEST - investigate immediately!")
elif duration > SLOW_REQUEST_THRESHOLD:
    logger.warning("⚠️  Slow request - consider optimization")
```

**Example log output:**
```
21:10:25 | WARNING | app.middleware.logging_middleware | ⚠️  Slow request: GET /tasks/stats took 1.2s | duration_seconds=1.2 threshold="slow"
```

**Response headers (returned to client):**
```
X-Response-Time: 1200ms
X-Correlation-ID: a1b2c3d4-5e6f-7g8h-9i0j-k1l2m3n4o5p6
```

Client can see exactly how long each request took!

---

### 6. Sensitive Data Filtering

**Automatically removes from logs and Sentry:**

```python
sensitive_fields = [
    "password",
    "token",
    "api_key",
    "secret",
    "authorization",
    "cookie",
    "session",
    "csrf",
]
```

**Example:**

```python
# Your code
logger.info("User registered", email="user@example.com", password="secret123")

# What gets logged
logger.info("User registered", email="user@example.com", password="[REDACTED]")
```

**Prevents:**
- Passwords in logs
- API keys in error reports
- Tokens leaked to Sentry
- GDPR violations

---

## 🧪 How to Test

### Step 1: Start the server

```bash
cd d:\Desktop\deployed-project\task-manager-app
uvicorn app.main:app --reload
```

**Watch the console output:**
```
INFO:     Started server process [12345]
2025-12-22 21:07:41 | INFO | Logging system initialized | environment="production" level="INFO"
2025-12-22 21:07:41 | WARNING | Sentry DSN not configured (this is OK for now)
2025-12-22 21:07:41 | INFO | Starting Productivity App API v1.0.0
2025-12-22 21:07:41 | INFO | Environment: development
2025-12-22 21:07:41 | INFO | Documentation: http://localhost:8000/docs
```

### Step 2: Run the test script

```bash
# In a new terminal
cd d:\Desktop\deployed-project\task-manager-app
uv run python test_phase1.py
```

This will:
1. Make test requests
2. Show correlation IDs
3. Demonstrate error handling
4. Check performance monitoring
5. Explain log files

### Step 3: Check the logs

```bash
# View live logs
tail -f logs/app_2025-12-22.log

# View only errors
tail -f logs/error_2025-12-22.log

# Search for specific correlation ID
grep "a1b2c3d4" logs/app_2025-12-22.log
```

### Step 4: Make some API requests

```bash
# Health check
curl http://localhost:8000/health

# Check response headers
curl -I http://localhost:8000/health
# Look for:
# X-Correlation-ID: ...
# X-Response-Time: ...

# Trigger validation error
curl -X POST http://localhost:8000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Check the logs to see error logged with correlation ID
```

### Step 5: Open Swagger docs

```
http://localhost:8000/docs
```

Try making requests through Swagger and watch logs update in real-time!

---

## 📁 Files Changed/Created

### Created Files:
```
app/
├── core/
│   └── logging_config.py          ← Loguru + Sentry setup
├── middleware/
│   ├── __init__.py
│   ├── logging_middleware.py      ← Correlation IDs, timing
│   └── error_handler.py           ← Global error handling

logs/                              ← Auto-created
├── app_2025-12-22.log
├── error_2025-12-22.log
└── app_json_2025-12-22.log

.env.example                       ← Updated with new vars
test_phase1.py                     ← Test script
PHASE1_GUIDE.md                    ← This file!
```

### Modified Files:
```
app/
├── main.py                        ← Integrated middleware, handlers
└── core/
    └── config.py                  ← Added new settings

pyproject.toml                     ← Added 8 new dependencies
```

---

## 🎯 Key Concepts Recap

### 1. **Correlation ID** = Unique ID per request
   - Traces request through all logs
   - Returned in response header
   - Critical for debugging production issues

### 2. **Structured Logging** = Logs with context
   - Timestamp, level, module, line number
   - Searchable, filterable, parseable
   - 4 outputs: console, file, error file, JSON

### 3. **Error Handling** = Consistent error responses
   - User-friendly messages
   - Includes correlation ID
   - Automatic Sentry reporting for 500 errors

### 4. **Performance Monitoring** = Automatic timing
   - Every request timed
   - Slow request alerts
   - Response time in headers

### 5. **Sensitive Data Filtering** = Privacy protection
   - Removes passwords, tokens, API keys
   - GDPR compliant
   - Prevents accidental leaks

---

## 🚀 Next Steps

### Enable Sentry (Optional but recommended)

1. **Sign up:** https://sentry.io (free account)
2. **Create project:** Choose "FastAPI" as framework
3. **Get DSN:** Copy the DSN URL
4. **Add to .env:**
   ```
   SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456
   ```
5. **Restart server**

Now all 500 errors automatically go to Sentry dashboard!

### Configure for production

In `.env`:
```
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
SENTRY_DSN=https://...
```

---

## 🐛 Troubleshooting

### Logs directory not created
```bash
mkdir logs
```

### Can't see colored logs
On Windows, install `colorama`:
```bash
pip install colorama
```

### Encoding errors on Windows
Already fixed! We removed emojis from log messages for Windows compatibility.

---

## 📚 Further Reading

- **Loguru docs:** https://loguru.readthedocs.io/
- **Sentry docs:** https://docs.sentry.io/platforms/python/guides/fastapi/
- **Correlation IDs:** https://www.rapid7.com/blog/post/2016/12/23/the-value-of-correlation-ids/
- **Structured Logging:** https://www.loggly.com/blog/why-json-is-the-best-application-log-format/

---

## ✅ Success Checklist

- [ ] Server starts without errors
- [ ] Logs directory created with 3 log files
- [ ] test_phase1.py runs successfully
- [ ] Can see correlation IDs in response headers
- [ ] Can grep logs by correlation ID
- [ ] Validation errors return user-friendly messages
- [ ] Slow requests logged (if any >1s)
- [ ] (Optional) Sentry configured and receiving errors

---

**You now have production-grade logging and monitoring! 🎉**

Ready for Phase 2: AI-powered priority suggestions with semantic embeddings!
