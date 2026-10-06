# TriageFlow

**TriageFlow** is a production-style support ticket management and intelligent triage API built with **Node.js, TypeScript, Express, PostgreSQL, Prisma, JWT, Docker, Pino, Prometheus metrics, Jest, and GitHub Actions**.

It demonstrates more than CRUD: secure API design, relational data modeling, authentication and authorization, observability, operational health checks, automated triage, external integrations, testing, containerization, and CI.

## What TriageFlow does

TriageFlow lets authenticated support agents create and manage support tickets, then automatically:

- classify each ticket into an operational category,
- infer its priority,
- route it to the appropriate team,
- attach a confidence score,
- persist the result in PostgreSQL,
- expose health and performance telemetry for operations.

A verified end-to-end example:

```json
{
  "subject": "SIM activation failed",
  "description": "Customer cannot activate the eSIM after payment",
  "status": "OPEN",
  "priority": "HIGH",
  "category": "ACTIVATION",
  "assignedTeam": "Technical Support",
  "triageConfidence": 0.98
}
```

## Architecture

```text
Client
  |
  v
Express API
  |
  +-- Helmet / CORS
  +-- Request IDs
  +-- Pino structured logging
  +-- Prometheus metrics
  +-- JWT authentication
  +-- Role-based access control
  |
  +--> Auth Controller
  |      |
  |      +--> Auth Service
  |              |
  |              +--> PostgreSQL / Prisma
  |
  +--> Ticket Controller
         |
         +--> Triage Service
         |      |
         |      +--> Category
         |      +--> Priority
         |      +--> Team routing
         |      +--> Confidence
         |
         +--> PostgreSQL / Prisma
         |
         +--> Optional webhook integration
```

The service separates HTTP concerns, validation, authentication, business rules, persistence, and external integrations to keep the codebase maintainable and testable.

## Tech stack

| Area | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| API | Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT + bcrypt |
| Authorization | Role-based access control |
| Validation | Zod |
| Logging | Pino |
| Metrics | Prometheus-compatible `prom-client` |
| Security middleware | Helmet + CORS |
| Testing | Jest + Supertest |
| Containers | Docker + Docker Compose |
| CI | GitHub Actions |

## Features

- RESTful ticket CRUD
- PostgreSQL persistence with Prisma
- JWT authentication
- `ADMIN` and `AGENT` roles
- Automated category, priority, team, and confidence assignment
- Optional outbound webhook after triage
- Structured JSON logging
- Authorization-header and password redaction
- Correlation/request IDs
- Prometheus-compatible metrics
- Database-aware health checks
- Zod request validation
- Centralized error handling
- Pagination
- Database indexes for commonly queried fields
- Graceful shutdown
- Dockerized PostgreSQL
- Fully containerized deployment option
- Jest/Supertest tests
- GitHub Actions CI

## API endpoints

| Method | Endpoint | Authentication | Purpose |
|---|---|---:|---|
| GET | `/` | No | Service metadata |
| GET | `/health` | No | API/database health |
| GET | `/metrics` | No | Prometheus metrics |
| POST | `/api/auth/register` | No | Register an agent |
| POST | `/api/auth/login` | No | Login and receive JWT |
| POST | `/api/tickets` | Yes | Create a ticket |
| GET | `/api/tickets` | Yes | List/paginate tickets |
| GET | `/api/tickets/:id` | Yes | Get one ticket |
| PATCH | `/api/tickets/:id` | Yes | Update a ticket |
| DELETE | `/api/tickets/:id` | Admin | Delete a ticket |
| POST | `/api/tickets/:id/triage` | Yes | Classify, prioritize, and route |

## Verified health and observability

The health endpoint performs a real database probe rather than returning a hard-coded success response.

Example:

```json
{
  "status": "ok",
  "service": "triageflow-api",
  "database": "up",
  "latencyMs": 64
}
```

The `/metrics` endpoint exposes Node.js/process metrics plus the custom request-latency histogram:

```text
triageflow_http_request_duration_seconds
```

Metrics include:

- request duration,
- HTTP status codes,
- event-loop lag,
- memory usage,
- CPU usage,
- active handles/resources,
- garbage-collection telemetry.

## Run in GitHub Codespaces

This is the recommended development workflow.

### 1. Install dependencies

```bash
npm install
cp .env.example .env
npx prisma generate
```

### 2. Start PostgreSQL

```bash
docker compose up -d db
```

Check that it is healthy:

```bash
docker compose ps
```

### 3. Apply database migrations

```bash
npx prisma migrate deploy
```

### 4. Start the API

```bash
npm run dev
```

The API runs on:

```text
http://localhost:3000
```

Codespaces will also forward port `3000` automatically.

### 5. Verify it

```bash
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```

## Fully containerized run

To run both PostgreSQL and the API in Docker:

```bash
docker compose --profile full up --build
```

The API is exposed on port `3000`.

## End-to-end API walkthrough

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com","password":"StrongPass123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com","password":"StrongPass123"}'
```

Save the returned JWT only in your current terminal session:

```bash
TOKEN='PASTE_JWT_HERE'
```

### Create a ticket

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject":"SIM activation failed",
    "description":"Customer cannot activate the eSIM after payment"
  }'
```

A newly created ticket begins unclassified:

```json
{
  "status": "OPEN",
  "priority": "MEDIUM",
  "category": null,
  "assignedTeam": null,
  "triageConfidence": null
}
```

### Triage the ticket

```bash
curl -X POST http://localhost:3000/api/tickets/TICKET_ID/triage \
  -H "Authorization: Bearer $TOKEN"
```

### Verify the persisted result

```bash
curl http://localhost:3000/api/tickets/TICKET_ID \
  -H "Authorization: Bearer $TOKEN"
```

A tested ticket produced:

```json
{
  "priority": "HIGH",
  "category": "ACTIVATION",
  "assignedTeam": "Technical Support",
  "triageConfidence": 0.98
}
```

## Triage design

The current triage implementation is deterministic and testable. It scores operational keywords and maps tickets to categories such as:

- `ACTIVATION`
- `BILLING`
- `CONNECTIVITY`
- `SECURITY`
- `GENERAL_SUPPORT`

Priority is independently inferred from urgency and incident language.

This design intentionally keeps the triage layer behind a service boundary so it can later be replaced or augmented by an ML/LLM classifier without rewriting the API or persistence layer.

## Observability

Every request receives an `x-request-id` if the client does not provide one.

Pino produces structured logs containing request context while sensitive values such as authorization headers and passwords are redacted.

`GET /metrics` exposes Prometheus-compatible telemetry.

`GET /health` checks PostgreSQL connectivity and returns HTTP `503` if the database is unavailable.

## Reliability decisions

- Database readiness is checked before fully containerized startup.
- External webhook requests have a 3-second timeout.
- Webhook failures do not roll back an already successful triage operation.
- Input validation occurs at API boundaries.
- Unexpected exceptions are handled centrally.
- List endpoints are paginated and capped at 100 records per request.
- Frequently filtered fields are indexed.
- SIGTERM/SIGINT trigger graceful HTTP shutdown and Prisma disconnection.
- Database migrations are versioned through Prisma.

## Security decisions

Implemented:

- password hashing with bcrypt,
- JWT authentication,
- role-based authorization,
- Helmet security headers,
- CORS middleware,
- input validation,
- sensitive-field log redaction,
- environment-based secrets.

For an internet-facing production deployment, the next security improvements would include rate limiting, refresh-token rotation or an external identity provider, managed secret storage, stricter origin policies, TLS termination, dependency/container scanning, and environment-specific access controls.

## Testing

Run:

```bash
npm test
npm run build
```

The test suite covers the triage engine and system endpoints.

GitHub Actions is configured to run:

1. dependency installation,
2. Prisma client generation,
3. TypeScript compilation,
4. automated tests

for pushes and pull requests to `main`.

## Project structure

```text
src/
├── config/
│   ├── env.ts
│   ├── logger.ts
│   └── prisma.ts
├── controllers/
│   ├── auth.controller.ts
│   └── ticket.controller.ts
├── middleware/
│   ├── auth.ts
│   ├── errorHandler.ts
│   └── requestMetrics.ts
├── routes/
│   ├── auth.routes.ts
│   ├── system.routes.ts
│   └── ticket.routes.ts
├── services/
│   ├── auth.service.ts
│   ├── triage.service.ts
│   └── webhook.service.ts
├── types/
├── utils/
├── app.ts
└── server.ts

prisma/
├── migrations/
└── schema.prisma

scripts/
└── wait-for-db.js

tests/
├── root.test.ts
└── triage.service.test.ts
```

## Roadmap

- OpenAPI / Swagger documentation
- Redis-backed rate limiting
- PostgreSQL integration tests
- OpenTelemetry distributed tracing
- Queue-backed webhook delivery with retries and a dead-letter queue
- ML/LLM triage adapter with evaluation and confidence thresholds
- Kubernetes manifests
- Grafana dashboard
- deployment to a public cloud environment

## Engineering focus

TriageFlow is built around the concerns expected in production software engineering roles:

**RESTful APIs · Node.js · TypeScript · PostgreSQL · system integrations · authentication · RBAC · Docker · CI/CD · logging · monitoring · health checks · debugging · reliability · maintainable service architecture**

---

Built by [Nuaima Saeed](https://github.com/Nuaima).
