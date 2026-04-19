# Intelligent Task Management System

A full-stack task management system with AI-powered features, built for a coding challenge.

## Role Track
Full-Stack + AI/LLM (All tracks: Backend, Frontend, Full-Stack, AI-LLM)

## Tech Stack
- **Language**: Python 3.11+ / TypeScript
- **Framework**: FastAPI (Backend) + React 19 (Frontend)
- **Database**: SQLite (via SQLAlchemy ORM)
- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **AI**: OpenAI API / Anthropic API (configurable)
- **Other tools**: Docker, Docker Compose, @hello-pangea/dnd, Axios, Lucide Icons

## Features Implemented

### Backend (Track A)
- [x] Task CRUD operations (Create, Read, Update, Delete)
- [x] Task filtering by status, priority, tags
- [x] Task sorting by creation date, priority, status
- [x] Pagination support
- [x] Task dependencies with cycle detection
- [x] Dependency tree API
- [x] Cannot complete task with unfinished dependencies
- [x] In-memory TTL caching layer
- [x] Input validation with Pydantic
- [x] Error handling with custom exceptions
- [x] Health check endpoint

### Frontend (Track B)
- [x] Task Dashboard with list and kanban views
- [x] Drag-and-drop status changes (kanban board)
- [x] Visual indicators for priority and status
- [x] Responsive design
- [x] Real-time search with debounce
- [x] Status and priority filters
- [x] Tag filter from existing tags
- [x] Task detail side panel
- [x] Create/edit task form with validation
- [x] Loading states and error messages
- [x] Quick actions (complete, delete)
- [x] State management with React Context + useReducer

### Full-Stack (Track C)
- [x] Complete backend API
- [x] Functional frontend UI
- [x] RESTful API design
- [x] Clean separation of concerns
- [x] Docker + Docker Compose setup
- [x] Environment configuration
- [x] Vite dev proxy for API calls

### AI/LLM (Track D)
- [x] Natural language task creation ("明天下午3点提醒我买菜")
- [x] Automatic tag suggestion
- [x] Priority recommendation
- [x] Task breakdown into subtasks
- [x] Task summarization
- [x] Similar task detection
- [x] Configurable AI provider (OpenAI / Anthropic)
- [x] AI settings UI for API key management

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Quick Start (Local Development)

1. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```

2. **Frontend Setup**
```bash
cd frontend
npm install

# Start frontend dev server
npm run dev
```

3. **Access the Application**
- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

### Docker Setup
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## API Documentation

### Task Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks` | List tasks (with filters, sorting, pagination) |
| `GET` | `/api/tasks/{id}` | Get single task |
| `PUT` | `/api/tasks/{id}` | Update task |
| `DELETE` | `/api/tasks/{id}` | Delete task |
| `PATCH` | `/api/tasks/{id}/status` | Quick status update |

**Query Parameters for GET /api/tasks:**
- `status` - Filter by status (pending/in_progress/completed)
- `priority` - Filter by priority (low/medium/high)
- `tags` - Filter by tags (comma-separated)
- `search` - Search in title and description
- `sort_by` - Sort field (created_at/priority/status)
- `sort_order` - Sort direction (asc/desc)
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 10, max: 100)

### Dependency Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/tasks/{id}/dependencies` | Add dependency |
| `GET` | `/api/tasks/{id}/dependencies` | List dependencies |
| `DELETE` | `/api/tasks/{id}/dependencies/{dep_id}` | Remove dependency |
| `GET` | `/api/tasks/{id}/dependency-tree` | Get dependency tree |
| `GET` | `/api/tasks/{id}/can-complete` | Check if completable |

### AI Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai/parse-task` | Parse natural language to task |
| `POST` | `/api/ai/suggest-tags` | Suggest tags for task |
| `POST` | `/api/ai/recommend-priority` | Recommend priority |
| `POST` | `/api/ai/breakdown-task` | Break task into subtasks |
| `POST` | `/api/ai/summarize-tasks` | Summarize tasks |
| `POST` | `/api/ai/detect-similar` | Find similar tasks |
| `GET` | `/api/ai/settings` | Get AI config |
| `PUT` | `/api/ai/settings` | Update AI config |

## Design Decisions

1. **SQLite over PostgreSQL**: Zero-config, no external DB service needed. Sufficient for demo purposes.
2. **Synchronous SQLAlchemy**: SQLite doesn't benefit from async; simpler code.
3. **Tags as JSON column**: Avoids JOIN complexity; SQLite supports `json_each()` for filtering.
4. **React Context + useReducer**: Built-in, no extra dependencies, sufficient for this app's state.
5. **@hello-pangea/dnd**: Maintained fork of react-beautiful-dnd, perfect for kanban boards.
6. **Strategy pattern for AI**: Clean abstraction allowing runtime provider switching.
7. **Vite over CRA**: CRA is deprecated; Vite is the modern standard.

## Challenges & Solutions

- **Python version compatibility**: Adjusted dependency versions for Python 3.10 support.
- **Vite scaffolding issue**: Manually created project structure when interactive CLI failed.
- **Circular dependency detection**: Implemented DFS-based cycle detection for task dependencies.

## Future Improvements
- User authentication and authorization
- WebSocket for real-time updates
- Full-text search with SQLite FTS5
- Rate limiting for API endpoints
- Offline support (PWA)
- Dark mode
- File attachments for tasks
- Export tasks (CSV/PDF)
- Automated E2E tests with Playwright

## Time Spent
Approximately 3.5 hours
