# TriageFlow

**TriageFlow** is a production-style support ticket API built to demonstrate backend engineering, operational ownership, observability, secure API design, and external-system integration.

It is implemented with **Node.js, TypeScript, Express, PostgreSQL, Prisma, JWT, Pino, Prometheus metrics, Docker, Jest, and GitHub Actions**.

## Why this project

Modern business applications are not just CRUD endpoints. They need authentication, authorization, structured logs, health checks, measurable performance, predictable failure handling, database indexing, automated tests, deployment automation, and integrations.

TriageFlow brings those concerns together in a compact service modeled around a real operational workflow: support ticket creation, triage, routing, and lifecycle management.

## Architecture

```text
Client
  |
  v
Express API
  |-- Helmet / CORS
  |-- Request ID + Pino structured logging
  |-- Prometheus request metrics
  |-- JWT authentication + RBAC
  |
  +--> Auth Controller ----> Auth Service ----> PostgreSQL / Prisma
  |
  +--> Ticket Controller --> Triage Service --> PostgreSQL / Prisma
                              |
                              +--> Optional Webhook Integration
```

The service is layered so HTTP concerns, business rules, persistence, and external integration logic remain separated.

## Features

- RESTful ticket CRUD
- PostgreSQL persistence through Prisma
- JWT authentication
- Role-based authorization
- Deterministic ticket categorization and priority routing
- Optional outbound webhook after triage
- Structured JSON logging with sensitive-field redaction
- Correlation/request IDs
- Prometheus-compatible metrics
- Database-aware health check
- Centralized validation and error handling
- Pagination and indexed ticket fields
- Graceful shutdown
- Docker and Docker Compose
- Jest/Supertest tests
- GitHub Actions CI

## API

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/` | No | Service metadata |
| GET | `/health` | No | Service/database health |
| GET | `/metrics` | No | Prometheus metrics |
| POST | `/api/auth/register` | No | Register an agent |
| POST | `/api/auth/login` | No | Login and receive JWT |
| POST | `/api/tickets` | Yes | Create ticket |
| GET | `/api/tickets` | Yes | List/paginate tickets |
| GET | `/api/tickets/:id` | Yes | Read ticket |
| PATCH | `/api/tickets/:id` | Yes | Update ticket |
| DELETE | `/api/tickets/:id` | Admin | Delete ticket |
| POST | `/api/tickets/:id/triage` | Yes | Categorize, prioritize and route |

## Example triage

Create a ticket:

```json
{
  "subject": "SIM activation failed",
  "description": "Customer cannot activate the eSIM after payment"
}
```

A triage operation can produce:

```json
{
  "category": "ACTIVATION",
  "priority": "HIGH",
  "assignedTeam": "Technical Support",
  "confidence": 0.88,
  "reasons": [
    "Matched 2 category keyword(s)",
    "Priority inferred from ticket language: HIGH"
  ]
}
```

The rules engine is deliberately deterministic and testable. It can later be replaced or augmented with an LLM/classifier behind the same service boundary.

## Run locally

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ or Docker

### Option A: Docker

```bash
git clone https://github.com/Nuaima/TriageFlow.git
cd TriageFlow
docker compose up --build
```

The API will be available at `http://localhost:3000`.

### Option B: Local Node.js

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## Authentication walkthrough

Register:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com","password":"StrongPass123"}'
```

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"agent@example.com","password":"StrongPass123"}'
```

Use the returned token:

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"SIM activation failed","description":"Customer cannot activate the eSIM after payment"}'
```

Then triage:

```bash
curl -X POST http://localhost:3000/api/tickets/TICKET_ID/triage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Observability

Every request receives an `x-request-id` if one was not supplied. Pino emits structured JSON logs that include this correlation ID, while authorization headers and password fields are redacted.

`GET /metrics` exposes Node.js process metrics plus the custom `triageflow_http_request_duration_seconds` histogram.

`GET /health` performs an actual database probe and reports a degraded status with HTTP 503 if PostgreSQL is unavailable.

## Reliability choices

- External webhook calls have a 3-second timeout.
- Webhook failure does not roll back successful ticket triage.
- Validation happens at API boundaries with Zod.
- Central error middleware prevents internal exceptions from leaking implementation details.
- Ticket list requests are paginated and capped at 100 records.
- Frequently filtered fields are indexed.
- SIGTERM/SIGINT trigger graceful HTTP shutdown and database disconnection.

## Testing and CI

Run:

```bash
npm test
npm run build
```

GitHub Actions runs dependency installation, Prisma client generation, TypeScript compilation, and tests for pushes and pull requests to `main`.

## Security notes

This repository is a portfolio/reference service, not a complete security product. Before internet-facing production deployment, add rate limiting, refresh-token rotation or an external identity provider, secret management, TLS termination, stricter CORS rules, dependency scanning, container scanning, and environment-specific access controls.

## Roadmap

- OpenAPI/Swagger documentation
- Redis-backed rate limiting
- Full integration tests against ephemeral PostgreSQL
- OpenTelemetry traces
- Queue-backed webhook delivery with retries and dead-letter handling
- ML/LLM triage adapter with evaluation and confidence thresholds
- Kubernetes manifests and deployment dashboards

## Engineering focus

TriageFlow is intentionally designed around the skills expected in production software engineering roles: **RESTful APIs, relational databases, system integrations, secure service development, monitoring/logging, health checks, deployment automation, incident-oriented observability, and maintainable architecture.**
