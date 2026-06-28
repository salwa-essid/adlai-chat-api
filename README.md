# ADLAI Chat Persistence API

A standalone REST API for storing and retrieving ADLAI chat sessions and messages server-side, replacing browser `localStorage` with a durable, evidentiary-grade persistence layer.

**Stack:** Node.js · Express · PostgreSQL

---

## Project Structure

```
adlai-chat-api/
├── src/
│   ├── config/
│   │   └── db.js                      ← PostgreSQL connection pool
│   ├── controllers/
│   │   ├── sessionController.js       ← session logic + input validation
│   │   └── messageController.js       ← message logic + input validation
│   ├── migrations/
│   │   ├── create_chat_tables.sql     ← schema: sessions + messages + cascade
│   │   └── run.js                     ← migration runner
│   ├── models/
│   │   ├── sessionModel.js            ← parameterised session queries
│   │   └── messageModel.js            ← parameterised message queries
│   └── routes/
│       └── sessionRoutes.js           ← all 6 endpoints wired here
├── tests/
│   └── session.test.js                ← integration tests (real DB)
├── app.js
├── server.js
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── .dockerignore
```

---

## Data Model

### `sessions`

| Column       | Type      | Notes                        |
|--------------|-----------|------------------------------|
| `id`         | UUID PK   | `gen_random_uuid()`          |
| `user_id`    | VARCHAR   | Required                     |
| `title`      | VARCHAR   | Defaults to `'New Chat'`     |
| `created_at` | TIMESTAMP | Auto-set on insert           |
| `updated_at` | TIMESTAMP | Auto-set on insert           |

### `messages`

| Column       | Type      | Notes                              |
|--------------|-----------|------------------------------------|
| `id`         | UUID PK   | `gen_random_uuid()`                |
| `session_id` | UUID FK   | `ON DELETE CASCADE`                |
| `role`       | VARCHAR   | `'user'` or `'assistant'`          |
| `content`    | TEXT      | Required                           |
| `citations`  | JSONB     | Nullable — stores source references|
| `created_at` | TIMESTAMP | Auto-set on insert                 |

Deleting a session automatically cascades to all its messages — no orphans possible.

---

## Option A — Docker (recommended)

Spin up Postgres + the API with a single command:

```bash
docker-compose up --build
```

This will:
1. Pull Postgres 16
2. Build the Node.js API image
3. Wait for Postgres to be healthy
4. Run migrations automatically
5. Start the API on **http://localhost:3000**

To stop and wipe all data:
```bash
docker-compose down -v
```

---

## Option B — Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your Postgres credentials
```

### 3. Create the database
```bash
psql -U postgres -c "CREATE DATABASE adlai;"
```

### 4. Run migrations
```bash
npm run migrate
```

### 5. Start the server
```bash
npm start

# Or with auto-reload during development:
npm run dev
```

The API is now running at **http://localhost:3000**

---

## Endpoints & curl Examples

### `GET /health` — liveness check

```bash
curl http://localhost:3000/health
```
```json
{ "status": "ok" }
```

---

### `POST /sessions` — create a session

```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{ "user_id": "user-123", "title": "UAE Labour Law Q&A" }'
```
```json
{
  "id": "a1b2c3d4-...",
  "user_id": "user-123",
  "title": "UAE Labour Law Q&A",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T10:00:00.000Z"
}
```

---

### `GET /sessions?user_id=...` — list a user's sessions (newest first)

```bash
curl "http://localhost:3000/sessions?user_id=user-123"
```
```json
[
  { "id": "...", "user_id": "user-123", "title": "UAE Labour Law Q&A", "created_at": "...", "updated_at": "..." }
]
```

---

### `GET /sessions/:id` — get a session with its messages

```bash
curl http://localhost:3000/sessions/SESSION_ID
```
```json
{
  "id": "...",
  "user_id": "user-123",
  "title": "UAE Labour Law Q&A",
  "messages": [
    { "role": "user",      "content": "What does Article 47 say?", "citations": null },
    { "role": "assistant", "content": "Article 47 covers...",       "citations": [{ "source": "UAE Labour Law", "article": "47" }] }
  ]
}
```

---

### `POST /sessions/:id/messages` — append a message

```bash
# User message
curl -X POST http://localhost:3000/sessions/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{ "role": "user", "content": "What does Article 47 say?" }'

# Assistant message with citations
curl -X POST http://localhost:3000/sessions/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "role": "assistant",
    "content": "Article 47 covers end-of-service gratuity...",
    "citations": [{ "source": "UAE Labour Law", "article": "47" }]
  }'
```
```json
{
  "id": "...",
  "session_id": "SESSION_ID",
  "role": "user",
  "content": "What does Article 47 say?",
  "citations": null,
  "created_at": "..."
}
```

---

### `DELETE /sessions/:id` — delete a session (cascades to messages)

```bash
curl -X DELETE http://localhost:3000/sessions/SESSION_ID
# → 204 No Content
```

---

## Running Tests

Tests run against a real database. Point `TEST_DB_NAME` at a separate test database (recommended) or the same dev DB — tests clean up after themselves.

```bash
# 1. Create a test database
psql -U postgres -c "CREATE DATABASE adlai_test;"

# 2. Run migrations against the test DB
NODE_ENV=test npm run migrate

# 3. Run the test suite
npm test
```

---

## Error Responses

All errors return a consistent JSON shape:

```json
{ "error": "Human-readable description of the problem." }
```

| Status | When |
|--------|------|
| `400`  | Missing or invalid fields (user_id, role, content), malformed UUID |
| `404`  | Session not found |
| `500`  | Unexpected server error (stack trace never exposed to client) |

Example `400`:
```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{ "title": "Missing user_id" }'
```
```json
{ "error": "user_id or title are required" }
```

---

## Security

- **Parameterised queries** — every SQL statement uses `$1, $2, ...` placeholders via the `pg` driver. No string-concatenated SQL anywhere in the codebase.
- **Secrets out of git** — `.env` is listed in `.gitignore`. Only `.env.example` (with placeholder values) is committed.
- **No sensitive data in logs** — DB credentials are never printed to stdout.
- **No stack traces to clients** — the global error handler returns a generic message, never internal details.
