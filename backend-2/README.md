# PressLens Backend 2.0 (Node.js + Express Foundation)

Modern Node.js and TypeScript REST API foundation for the PressLens tactical football analysis application, built with Express, Drizzle ORM, and PostgreSQL.

---

## 1. Architecture & Layering

The codebase is organized into clean, single-responsibility layers:

```text
backend-2/
├── .env.example              # Centralized environment variable template
├── .gitignore                # Git ignore patterns
├── package.json              # ES Modules package configuration
├── tsconfig.json             # TypeScript compiler configuration
├── scripts/
│   └── test-api.js           # Automated verification test suite (44 assertions)
└── src/
    ├── server.ts             # Application bootstrapper and graceful shutdown
    ├── app.ts                # Express app configuration, CORS, routes & error handling
    ├── config/
    │   └── env.ts            # Centralized environment configuration (dotenv)
    ├── db/
    │   ├── index.ts          # PostgreSQL pool & connection readiness checks
    │   └── schema.ts         # Drizzle ORM schema mirroring PostgreSQL tables
    ├── schemas/
    │   ├── common.ts         # Shared pagination and UUID Zod schemas
    │   ├── health.ts         # Health check response schemas
    │   ├── scenario.ts       # Spatial coordinates, teams, players, and scenario schemas
    │   └── analysis.ts       # Analysis history and status response schemas
    ├── middleware/
    │   ├── errorHandler.ts   # Centralized JSON error handling
    │   ├── logging.ts        # Structured HTTP request/response logging
    │   └── validate.ts       # Generic Zod validation middleware (body, query, params)
    ├── controllers/
    │   ├── healthController.ts    # Health & schema readiness controller
    │   ├── scenarioController.ts  # CRUD scenario controller
    │   └── analysisController.ts  # Analysis history & status controller
    ├── services/
    │   ├── healthService.ts       # DB connectivity & schema check service
    │   ├── scenarioService.ts     # Scenario query & persistence service
    │   └── analysisService.ts     # Analysis retrieval service
    ├── routes/
    │   ├── index.ts               # Versioned API router (/api/v1)
    │   ├── healthRoutes.ts        # /api/v1/health
    │   ├── scenarioRoutes.ts      # /api/v1/scenarios
    │   └── analysisRoutes.ts      # /api/v1/analysis
    └── utils/
        ├── errors.ts              # Custom application error classes
        └── logger.ts              # Structured JSON logger
```

---

## 2. Mirrored PostgreSQL Tables

All five existing PostgreSQL tables are mirrored via Drizzle ORM in `src/db/schema.ts`:

1. `scenarios`: Full match scenarios, team tactical formations, player coordinates, ball location, and match context.
2. `analyses`: Tactical analysis records, pressing intensity, structured tactical report JSONB, and spatial metrics.
3. `conversation_messages`: Conversational agent turns and follow-up history.
4. `knowledge_documents`: Curated tactical knowledge documents, principles, metadata, and document embeddings.
5. `knowledge_chunks`: Atomic searchable chunks with vector embeddings.

---

## 3. Endpoints Implemented

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Service welcome and status metadata |
| `GET` | `/api/v1/health` | Health check verifying PostgreSQL connectivity and `to_regclass('public.scenarios')` schema readiness (returns 503 if missing) |
| `GET` | `/api/v1/scenarios` | List scenarios with pagination (`skip`, `limit`) and filters (`match_phase`, `is_prepared`) |
| `GET` | `/api/v1/scenarios/:scenario_id` | Get single scenario by UUID with player coordinates and team formations |
| `POST` | `/api/v1/scenarios` | Create custom scenario with Zod validation |
| `DELETE` | `/api/v1/scenarios/:scenario_id` | Delete scenario by UUID (HTTP 204 No Content) |
| `GET` | `/api/v1/analysis` | List analysis history with optional `scenario_id` filter |
| `GET` | `/api/v1/analysis/:id` | Get single analysis with structured tactical report and conversation messages |
| `GET` | `/api/v1/analysis/:id/status` | Get lightweight analysis execution status |

---

## 4. Setup & Commands

```bash
# Install dependencies
npm install

# Build TypeScript to dist/
npm run build

# Run automated verification tests
npm test

# Start production server
npm start

# Run with hot reloading (development)
npm run dev
```
