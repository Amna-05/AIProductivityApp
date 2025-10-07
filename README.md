# Task Manager API — FastAPI

A minimal yet production-oriented FastAPI backend for managing tasks with PostgreSQL. It follows clean architecture and uses modern Python features like async SQLAlchemy, Pydantic models, and environment-based configurations.

---

## Features

* CRUD operations for tasks
* Async PostgreSQL integration
* Pydantic models with field validation and enums
* Repository pattern for clean architecture
* Centralized configs and environment variables
* API versioning (`/api/v1`)
* Custom error handling and responses

---

## Tech Stack

* **FastAPI** — async web framework
* **SQLAlchemy (async)** — ORM
* **PostgreSQL** — database
* **Pydantic v2** — data validation
* **Alembic** — database migrations
* **Uvicorn** — ASGI server

---

## Project Structure (example)

```
task_manager/
├── app/
│   ├── api/v1/routers/tasks.py
│   ├── core/config.py
│   ├── db/models.py
│   ├── repositories/task_repo.py
│   ├── schemas/task.py
│   └── main.py
├── alembic/
├── .env
├── requirements.txt
└── README.md
```

---

## Quick Start

1. Clone repo & create venv

```bash
git clone <repo-url>
cd task_manager
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
```

2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Setup environment

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/task_db
```


4. Start server

```bash
uvicorn app.main:app --reload
```

Visit: `http://localhost:8000/docs`

---

## Example Schema (Pydantic)

```python
from pydantic import BaseModel, field_validator
from enum import Enum

class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TaskCreate(BaseModel):
    title: str
    priority: Priority = Priority.medium

    @field_validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v
```

---

## Run with Docker

```bash
docker-compose up --build
```

---

## Next Steps

* Add user authentication (JWT)
* Implement task filtering and pagination
* Add tests and CI/CD pipeline
* Deploy with Docker or cloud service

---

**License:** MIT
