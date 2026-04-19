# Architecture: Scaling to 100k+ Tasks

## Overview

This document outlines the strategy for scaling the Task Management System from the current SQLite prototype to handle 100,000+ tasks with high performance.

---

## 1. Database Layer

### Current State
- SQLite single-file database
- Composite index on `(status, priority, created_at)`
- Tags stored as JSON string column

### Target State
- **PostgreSQL** as primary database
- **Table partitioning** by `created_at` (monthly partitions)
- **Tags normalization**: dedicated `tags` + `task_tags` junction table with proper indexing
- **Additional indexes**:
  - `tasks(status, created_at)` for status-filtered chronological queries
  - `tasks(priority, created_at)` for priority-based views
  - `GIN index` on `tags` array column (PostgreSQL native array support)
  - `tasks(due_date)` for calendar view queries

### Migration Path
1. Replace SQLAlchemy SQLite dialect with PostgreSQL (`psycopg2` driver)
2. Run schema migration via Alembic (already included in project)
3. Bulk import existing SQLite data using `pgloader` or custom ETL script
4. Enable connection pooling with `SQLAlchemy pool_size=20, max_overflow=10`

---

## 2. Caching Layer

### Current State
- In-memory `TTLCache` (maxsize=256, ttl=60s)
- Cache invalidation by key-prefix scanning
- Single-process only, lost on restart

### Target State
- **Redis** as distributed cache
- Cache strategies:
  - **Task detail**: `task:{id}` → JSON, TTL 5min
  - **Task lists**: `tasks:list:{hash(params)}` → JSON, TTL 30s
  - **Count queries**: `tasks:count:{filters}` → integer, TTL 60s
- **Cache warming**: On server start, pre-load hot tasks (recent 1000)
- **Cache breakdown protection**: `SETNX` with short TTL for miss-penalty protection
- **Pub/Sub invalidation**: On write, publish invalidation event to all app instances

### Migration Path
1. Add `redis` to `requirements.txt`, configure `REDIS_URL` env var
2. Implement `RedisCacheService` matching current `CacheService` interface
3. Use `fakeredis` in tests to avoid Redis dependency
4. Deploy Redis alongside the application (Docker Compose already supports this)

---

## 3. API Layer

### Current State
- Offset-based pagination (`page` + `page_size`)
- Synchronous request handling
- No connection pooling

### Target State
- **Cursor-based pagination** for large datasets:
  ```
  GET /api/tasks?cursor=eyJpZCI6MTAwfQ&limit=20
  ```
  - Encodes last seen task ID in base64
  - O(1) lookup instead of OFFSET O(n) scan
  - Critical for "load more" / infinite scroll patterns
- **Async SQLAlchemy** with `asyncpg` driver for PostgreSQL
- **Connection pooling**: PgBouncer in front of PostgreSQL
- **Response compression**: gzip for list endpoints (large JSON payloads)
- **Field selection**: `?fields=id,title,status` to reduce payload size

### Migration Path
1. Add `cursor` query parameter alongside existing `page` pagination
2. Switch to `async def` route handlers with `AsyncSession`
3. Add PgBouncer to Docker Compose configuration

---

## 4. Search

### Current State
- `ILIKE` pattern matching on `title` and `description`
- Full table scan for every search query

### Target State
- **PostgreSQL Full-Text Search (FTS)** using `tsvector` + GIN index:
  ```sql
  ALTER TABLE tasks ADD COLUMN search_vector tsvector;
  CREATE INDEX idx_tasks_search ON tasks USING GIN(search_vector);
  
  UPDATE tasks SET search_vector = 
    setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description,'')), 'B');
  ```
- For >500k tasks: **Elasticsearch** with async sync pipeline
- **Search features**: ranking, fuzzy matching, autocomplete

### Migration Path
1. Add `search_vector` column with trigger to auto-update on INSERT/UPDATE
2. Replace `ILIKE` queries with `WHERE search_vector @@ to_tsquery(:q)`
3. If scale exceeds PostgreSQL FTS capacity, add Elasticsearch as secondary index

---

## 5. Deployment & Scaling

### Current State
- Single Docker container for backend
- SQLite file on local volume
- No horizontal scaling

### Target State
- **Horizontal scaling**: Multiple FastAPI instances behind Nginx load balancer
- **Container orchestration**: Kubernetes or Docker Swarm
- **Database**: Managed PostgreSQL (RDS/Cloud SQL)
- **Redis**: Managed Redis (ElastiCache/Memorystore)
- **Static assets**: CDN for frontend (CloudFront/Cloudflare)
- **Health checks**: `/api/health` with DB + Redis connectivity checks
- **Rate limiting**: Redis-based sliding window (already planned as bonus feature)

### Architecture Diagram
```
                    ┌──────────┐
                    │   CDN    │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  Nginx   │ (load balancer)
                    └────┬─────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
       ┌────▼───┐  ┌────▼───┐  ┌────▼───┐
       │ FastAPI │  │ FastAPI │  │ FastAPI │  (2-4 instances)
       │  #1    │  │  #2    │  │  #3    │
       └───┬────┘  └───┬────┘  └───┬────┘
           │           │           │
           └─────────┬─┘─────────┘
                     │
              ┌──────▼──────┐
              │  PgBouncer   │ (connection pooler)
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │ PostgreSQL  │ (primary + read replica)
              └─────────────┘
                     │
              ┌──────▼──────┐
              │   Redis     │ (cache + sessions)
              └─────────────┘
```

---

## 6. Frontend Optimization

### Current State
- Renders all tasks at once (no virtualization)
- Full page reload on filter changes
- No optimistic updates for all operations

### Target State
- **Virtual scrolling**: `react-window` or `@tanstack/virtual` for list view
  - Only render visible rows (20-30 DOM nodes for 100k tasks)
- **Infinite scroll** with cursor-based pagination
- **Debounced filter updates** (already implemented at 300ms)
- **WebSocket** for real-time task updates across tabs/users
- **Optimistic updates** for all CRUD operations with rollback on error
- **Code splitting**: lazy-load calendar view and AI components
- **Service Worker** for offline read access (PWA)

### Migration Path
1. Replace `TaskList` rendering with virtualized list component
2. Implement infinite scroll with cursor pagination
3. Add WebSocket connection for push notifications
4. Add React.lazy() for heavy components (calendar, AI features)

---

## Summary: Scaling Roadmap

| Phase | Scale Target | Key Changes |
|-------|-------------|-------------|
| **Phase 1** (current) | < 1k tasks | SQLite, in-memory cache, offset pagination |
| **Phase 2** | 1k-10k tasks | PostgreSQL, Redis, cursor pagination |
| **Phase 3** | 10k-100k tasks | PostgreSQL FTS, virtual scrolling, connection pooling |
| **Phase 4** | 100k+ tasks | Elasticsearch, horizontal scaling, read replicas |
