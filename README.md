# TacticalLens ⚽📐🤖

> **Simplifying Football Tactics with Spatial Pitch Geometry & AI**

TacticalLens is a full-stack football tactical analysis platform that combines **deterministic 105m × 68m spatial pitch geometry**, **vector-based tactical knowledge retrieval (RAG)**, and **large language model reasoning (Groq Llama 3.3 70B)** to make complex tactical structures intuitive, measurable, and actionable for coaches, analysts, and enthusiasts.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Proposed Data Flow Diagram (DFD)](#proposed-data-flow-diagram-dfd)
- [Feature Status & Completed Capabilities](#feature-status--completed-capabilities)
  - [Frontend Scenario Builder & Interactive Pitch](#1-frontend-scenario-builder--interactive-pitch)
  - [Deterministic Spatial Tactical Engine](#2-deterministic-spatial-tactical-engine)
  - [PostgreSQL Vector RAG & Knowledge Retrieval](#3-postgresql-vector-rag--knowledge-retrieval)
  - [Groq LLM Reasoning & Zod Schema Validation](#4-groq-llm-reasoning--zod-schema-validation)
  - [Single-Agent Orchestration & Follow-Up Q&A](#5-single-agent-orchestration--follow-up-qa)
- [🛡️ Defense Analysis Module (Coming Soon)](#️-defense-analysis-module-coming-soon)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started & Local Setup](#getting-started--local-setup)
  - [Prerequisites](#prerequisites)
  - [1. Database Configuration (PostgreSQL + pgvector)](#1-database-configuration-postgresql--pgvector)
  - [2. Backend Setup (`backend-2/`)](#2-backend-setup-backend-2)
  - [3. Frontend Setup (`frontend/`)](#3-frontend-setup-frontend)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Modern football analysis often suffers from two extremes: rigid statistical dashboards detached from spatial pitch reality, or qualitative commentary lacking mathematical rigor. **TacticalLens bridges this gap.**

1. **Interactive Pitch Representation**: Uses a true-to-scale **105m × 68m FIFA-standard pitch** SVG canvas where every player and the ball possess exact Cartesian coordinates `(x, y)`.
2. **Deterministic Geometric Math**: Computes Euclidean player distances, ball carrier tracking, pressing approach vectors, pressing funnels (Inside, Outside, Sideline traps), cover-shadow cones, passing lane blockages, convex hull compactness, vertical line distances, and Zone 14 central screening ratios without relying on LLM guesswork.
3. **Domain Knowledge Retrieval (RAG)**: Generates 384-dimensional dense semantic embeddings using `@huggingface/transformers` (`Xenova/bge-small-en-v1.5`) and queries curated tactical principles via PostgreSQL `pgvector`.
4. **Structured AI Synthesis**: Synthesizes the quantitative geometry and retrieved coaching principles into a strict 10-section tactical report validated with **Zod** via Groq's high-speed `llama-3.3-70b-versatile` engine.

---

## Proposed Data Flow Diagram (DFD)

The following architectural diagram illustrates the complete data lifecycle of TacticalLens—from user pitch interaction to geometric analysis, vector search, LLM synthesis, and persistence:

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + TypeScript + SVG)"]
        UI["Landing Page / Dashboard / Scenario Builder"]
        PitchSVG["Interactive Pitch (105m × 68m SVG Canvas)"]
        RosterPanel["Player Roster & Inspector Panel"]
        ReportViewer["Tactical Report & Follow-Up Chat"]
    end

    subgraph APILayer ["API & Middleware Layer (Node.js / Express)"]
        Router["Express Router (/api/v1)"]
        ValidationMiddleware["Zod Request Validation Middleware"]
        LoggingMiddleware["Centralized Structured Logger"]
    end

    subgraph TacticalPipeline ["Tactical & AI Orchestration Pipeline (backend-2)"]
        Orchestrator["Single-Agent Orchestrator (orchestrator.ts)"]
        ValTool["Pitch Boundary & Player Count Validator (validationTool.ts)"]
        ZoneTool["18-Zone Spatial Mapping Tool (pitchZones.ts)"]
        GeomEngine["Spatial & Pressing Tactical Engine (tacticalEngine.ts)"]
        EmbedService["Local Embeddings Service (Xenova/bge-small-en-v1.5)"]
        GroqClient["Groq LLM Client (llama-3.3-70b-versatile)"]
        ZodValidator["Report Schema Enforcer (schemas/analysis.ts)"]
        FallbackGenerator["Deterministic Fallback Engine (fallbackReport.ts)"]
    end

    subgraph DataLayer ["Data & Storage Layer (PostgreSQL + pgvector)"]
        DB_Scenarios[("scenarios Table")]
        DB_Analyses[("analyses Table")]
        DB_Knowledge[("knowledge_chunks & pgvector Table")]
        DB_Messages[("conversation_messages Table")]
    end

    %% Client to API
    UI -->|1. Configure Scenario / Formations| PitchSVG
    RosterPanel -->|Update Player Positions & Roles| PitchSVG
    PitchSVG -->|2. POST /api/v1/scenarios| Router
    ReportViewer -->|3. POST /api/v1/analysis| Router
    ReportViewer -->|4. POST /api/v1/analysis/:id/follow-up| Router

    %% API to Orchestration
    Router --> ValidationMiddleware
    ValidationMiddleware --> Orchestrator

    %% Orchestrator Execution Flow
    Orchestrator -->|Step 1: Validate Bounds & Rules| ValTool
    Orchestrator -->|Step 2: Map 18 Tactical Zones| ZoneTool
    Orchestrator -->|Step 3: Calculate Spatial Geometry| GeomEngine
    
    %% Spatial Math Computations
    GeomEngine -.->|Euclidean Distances & Pressing Vectors| GeomEngine
    GeomEngine -.->|Cover Shadow Cones & Passing Lanes| GeomEngine
    GeomEngine -.->|Low-Block Compactness & Zone 14 Density| GeomEngine

    %% Vector RAG Flow
    Orchestrator -->|Step 4: Vector Embedding Query| EmbedService
    EmbedService -->|Cosine Distance (<=>) Similarity Query| DB_Knowledge
    DB_Knowledge -->|Top Tactical Concepts & Principles| Orchestrator

    %% Prompt Construction & LLM Inference
    Orchestrator -->|Step 5: Assemble Structured Prompt| GroqClient
    GroqClient -->|Step 6: Stream/Complete JSON| ZodValidator

    %% Fallback on Failure
    GroqClient -.->|On Timeout / Quota Exhaustion| FallbackGenerator
    FallbackGenerator -.-> ZodValidator

    %% Persistence
    ZodValidator -->|Step 7: Persist Analysis & Status| DB_Analyses
    Router -->|Persist Scenarios| DB_Scenarios
    Router -->|Persist Q&A History| DB_Messages

    %% Response to UI
    ZodValidator -->|Step 8: 10-Section Analysis Report JSON| ReportViewer
```

---

## Feature Status & Completed Capabilities

### 1. Frontend Scenario Builder & Interactive Pitch
- **Coordinate-Mapped Pitch (105m × 68m)**: True-to-scale SVG rendering adhering to FIFA pitch dimensions, complete with penalty boxes, goal areas, center circle, and corner arcs.
- **Drag-and-Drop Player Placement**: Clean pointer tracking (`pointerdown` → `pointermove` → `pointerup`), pointer capture release, empty pitch click-to-deselect, and `Escape` key cancellation.
- **9 Formations Supported for Both Teams**:
  - `4-3-3`, `4-2-3-1`, `4-4-2`, `3-2-4-1`, `3-5-2`, `5-3-2`, `5-4-1`, `4-1-4-1`, `3-4-3`.
  - Immediate coordinate calculation and role assignment across both Attacking and Defending sides without falling back to default shapes.
- **Player Inspector & Roster Panel**:
  - Live editing of player names and tactical role labels (`GK`, `CB`, `LCB`, `RCB`, `LWB`, `RWB`, `DM`, `CM`, `AM`, `LW`, `RW`, `ST`).
  - Radio toggle to dynamically assign ball carrier possession to any attacking player.
- **Match Context Controls**: Preset selection for match phases (Open Play, High Press, Mid Block, Low Block, Build Up, Transition, Counter Attack).
- **Dedicated Landing Page (`/`)**: Engaging overview simplifying tactical concepts with strategy cards, feature deep-dives, and direct CTAs to the Scenario Builder (`/builder`).

### 2. Deterministic Spatial Tactical Engine
- **Pitch Validation (`validationTool.ts`)**: Bounds checking against 105m × 68m, player count verification (minimum 3, up to 22 players), team separation, and confidence scoring (`High`, `Medium`, `Low`).
- **18-Zone Spatial Mapping (`pitchZones.ts`)**: Divides the pitch into 6 vertical bands and 3 horizontal corridors, identifying Zone 14, half-spaces, wide channels, and defensive thirds.
- **Pressing & Cover Shadow Mechanics (`tacticalEngine.ts`)**:
  - Euclidean distance calculations between all players and the ball carrier.
  - Identification of primary and secondary pressers.
  - Pressing vector computation (direction, speed, angle of approach).
  - Pressing funnel classification (`Inside`, `Outside`, `Sideline trap`).
  - Cover-shadow cone projections calculated geometrically from presser position relative to ball carrier.
  - Passing lane classification for all teammates: `Blocked` (inside cover shadow), `Contested` (within interception radius), or `Open`.
- **Defensive Line Metrics**:
  - Convex hull defensive compactness area ($m^2$).
  - Low-block ("haramball") vertical compactness measuring the vertical gap between defensive and midfield lines.
  - Zone 14 central density scoring (defensive screening ratio in the crucial central pocket).
  - Step-out pressing trigger detection (identifying when a central defender breaks structure to press an attacking midfielder or striker).

### 3. PostgreSQL Vector RAG & Knowledge Retrieval
- **Local Dense Embeddings (`embeddingService.ts`)**:
  - Integrated `@huggingface/transformers` (`Xenova/bge-small-en-v1.5`) generating 384-dimensional dense vectors locally.
  - Deterministic fallback vector generator for offline, air-gapped, or test environments.
- **Vector Search & Document Chunking (`knowledgeService.ts`)**:
  - Fast cosine similarity search (`<=>`) against `knowledge_chunks` stored in PostgreSQL.
  - Curated tactical knowledge seed covering pressing triggers, Gegenpressing, passing lane traps, Simeone-style low blocks, vertical compactness, and central lane denial.

### 4. Groq LLM Reasoning & Zod Schema Validation
- **Groq Integration (`groqClient.ts`)**:
  - Uses `llama-3.3-70b-versatile` with configurable timeouts and exponential backoff retry mechanics.
- **Strict Zod Output Validation (`schemas/analysis.ts`)**:
  - Guarantees complete adherence to the 10-section `FullTacticalAnalysisReport`:
    1. Executive Summary
    2. Pressing Structure & Funnels
    3. Cover Shadows & Blocked Passing Lanes
    4. Defensive Block & Low-Block Compactness
    5. Zone 14 Central Density & Screening
    6. Pressing Triggers & Vulnerabilities
    7. Counter-Pressing Recommendations
    8. Passing Options & Escapes for Attacking Team
    9. Defensive Adjustments & Tactical Fixes
    10. Confidence Score & Spatial Metrics Breakdown
- **Deterministic Fallback Engine (`fallbackReport.ts`)**:
  - Generates a mathematically accurate 10-section report directly from calculated spatial metrics if the external LLM is unreachable or times out.

### 5. Single-Agent Orchestration & Follow-Up Q&A
- **Sequential Orchestrator (`orchestrator.ts`)**:
  - Executes the analysis pipeline cleanly: `Validate Pitch -> Inspect Zones -> Calculate Spatial Geometry -> Query Vector Knowledge RAG -> Groq LLM Inference -> Zod Validation -> Persist Analysis`.
- **Interactive Follow-Up Chat**:
  - Endpoint `POST /api/v1/analysis/:id/follow-up` allowing analysts to ask tactical follow-up questions referencing the scenario's spatial context and generated report.

---

## 🛡️ Defense Analysis Module (Coming Soon)

> **Status: Core Spatial Calculations Complete; Dedicated Visualizer & Tactical Module Coming Soon**

While the core mathematical engine (`tacticalEngine.ts`) already performs deterministic computations for defensive metrics—including vertical compactness, Zone 14 central screening ratios, defensive polygon compactness area, and step-out pressing triggers—the **Dedicated Defense Analysis Visualizer & Tactical Module** is currently **Coming Soon** on the frontend and orchestration layer.

### What is Coming in the Defense Analysis Module:
- **Visual Defensive Line Overlays**: Dedicated SVG line projections marking the back four/five defensive line, midfield screening line, and inter-line pocket distances directly on the pitch.
- **Dynamic Offside Line Tracking**: Visualized reference line benchmarked against the last defender's coordinate relative to attacking runners.
- **Low-Block & Haramball Phase Transitions**: Visual state heatmaps showing how defensive blocks contract into low-block bunkers when play enters the defensive third.
- **Zone 14 Congestion Radar**: Interactive radial indicator displaying defender-to-attacker congestion ratios in Zone 14.
- **Defensive Tactical Drills**: Automated tactical adjustment recommendations generated specifically for defensive units facing counter-attacks and overload over-shifts.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, React Router 7, Lucide Icons, Pure SVG Pitch Canvas |
| **Backend API** | Node.js, Express, TypeScript, Drizzle ORM, Zod, Vitest |
| **Spatial & Math Engine**| Deterministic Cartesian Geometry, Convex Hull Algorithms, Trigonometric Cone Projection |
| **Embeddings & RAG** | `@huggingface/transformers` (`Xenova/bge-small-en-v1.5`), PostgreSQL `pgvector` |
| **LLM Reasoning** | Groq SDK (`llama-3.3-70b-versatile`), Structured JSON mode |
| **Database** | PostgreSQL 15+ (tables: `scenarios`, `analyses`, `conversation_messages`, `knowledge_documents`, `knowledge_chunks`) |
| **Reference Architecture**| Preserved Python FastAPI reference backend (`backend/`) |

---

## Project Structure

```text
Tactical-Lens/
├── backend-2/                  # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # Centralized environment configuration
│   │   ├── controllers/        # Express route controllers
│   │   ├── db/                 # PostgreSQL pool and Drizzle ORM schemas
│   │   ├── engine/             # Spatial math, pitch zones, orchestrator & fallback
│   │   │   ├── fallbackReport.ts
│   │   │   ├── orchestrator.ts
│   │   │   ├── pitchZones.ts
│   │   │   ├── prompts.ts
│   │   │   ├── scenarioTool.ts
│   │   │   ├── tacticalEngine.ts
│   │   │   └── validationTool.ts
│   │   ├── integrations/       # Groq LLM client with retry mechanics
│   │   ├── middleware/         # Zod validator, error handling & logging
│   │   ├── routes/             # Versioned REST routes (/api/v1)
│   │   ├── schemas/            # Zod validation schemas for requests & reports
│   │   ├── services/           # Scenario, analysis, embeddings & knowledge services
│   │   └── utils/              # Custom errors and structured logger
│   ├── test/                   # Vitest unit & integration test suites
│   ├── .env.example            # Backend environment template
│   └── package.json
│
├── frontend/                   # React 19 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── api/                # Typed API client services
│   │   ├── components/         # Reusable UI, pitch canvas & roster components
│   │   │   └── pitch/          # TacticalPitch.tsx (105m × 68m SVG canvas)
│   │   ├── layouts/            # App navigation and layout shells
│   │   ├── pages/              # Landing page, Scenario Builder, Analysis views
│   │   │   ├── landing/        # Dedicated TacticalLens Landing Page
│   │   │   └── scenario/       # ScenarioBuilderPage.tsx & detail pages
│   │   ├── router/             # React Router v7 route definitions
│   │   └── types/              # Domain TypeScript interfaces
│   ├── .env.example            # Frontend environment template
│   └── package.json
│
├── backend/                    # Preserved Python reference implementation
└── README.md                   # Project documentation
```

---

## Getting Started & Local Setup

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **PostgreSQL**: v15 or higher with the `pgvector` extension enabled
- **Git**

---

### 1. Database Configuration (PostgreSQL + pgvector)

Create a PostgreSQL database and enable `pgvector`:

```sql
CREATE DATABASE presslens;
\c presslens;
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### 2. Backend Setup (`backend-2/`)

1. **Navigate to the backend directory**:
   ```bash
   cd backend-2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to match your local setup:
   ```env
   NODE_ENV=development
   PORT=8000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/presslens
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   EMBEDDING_MODEL=Xenova/bge-small-en-v1.5
   EMBEDDING_DIMENSION=384
   ```
   *(Note: If no `GROQ_API_KEY` is provided, the backend automatically uses the deterministic fallback analysis generator).*

4. **Run the test suite**:
   ```bash
   npm test
   ```

5. **Start the development server with hot-reload**:
   ```bash
   npm run dev
   ```
   The backend API will be live at `http://localhost:8000`.

---

### 3. Frontend Setup (`frontend/`)

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Ensure the API URL points to your running backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

4. **Verify TypeScript & Linting**:
   ```bash
   npm run lint
   npx tsc -b
   ```

5. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## API Reference

All API routes are prefixed under `/api/v1`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root API welcome and server metadata |
| `GET` | `/api/v1/health` | Health check verifying PostgreSQL and schema readiness |
| `GET` | `/api/v1/scenarios` | List saved tactical scenarios with pagination and match phase filters |
| `POST` | `/api/v1/scenarios` | Create and save a new scenario with 105×68m player coordinates |
| `GET` | `/api/v1/scenarios/:id` | Fetch scenario details by UUID |
| `PUT` / `PATCH` | `/api/v1/scenarios/:id` | Update an existing tactical scenario with Zod validation |
| `DELETE` | `/api/v1/scenarios/:id` | Delete a saved scenario (204 No Content) |
| `GET` | `/api/v1/analysis` | List tactical analysis execution history |
| `POST` | `/api/v1/analysis` | Run full analysis pipeline (Spatial Math + RAG + Groq LLM) |
| `GET` | `/api/v1/analysis/:id` | Retrieve full 10-section analysis report by ID |
| `GET` | `/api/v1/analysis/:id/status`| Poll execution status of an analysis job |
| `POST` | `/api/v1/analysis/:id/follow-up` | Ask conversational follow-up questions referencing analysis context |
| `GET` | `/api/v1/knowledge/topics` | List available tactical knowledge topics |
| `POST` | `/api/v1/knowledge/seed` | Seed tactical coaching literature and generate vector embeddings |

---

## Roadmap

- [x] **Phase 1: Foundation & Infrastructure** — Node.js/Express, PostgreSQL schema mirroring, and REST endpoints.
- [x] **Phase 2: Spatial & Pressing Geometry Engine** — 105×68m pitch coordinates, pressing vectors, cover shadows, passing lanes, and low-block metrics.
- [x] **Phase 3: Vector RAG & Groq LLM Orchestration** — HuggingFace embeddings, Groq Llama 3.3 70B, Zod validation, and follow-up Q&A.
- [x] **Frontend Landing Page & UI Polish** — Landing page homepage, formation coordinate mapping, and player inspector.
- [ ] **🛡️ Defense Analysis Visualizer (Coming Soon)** — Dedicated visual defensive line overlays, dynamic offside line indicator, and Haramball transition diagrams.
- [ ] **Real-time Tracking Data Ingestion** — Support for SkillCorner and StatsBomb event/tracking data feeds.
- [ ] **Pitch Simulation Animation** — Animated pass sequence replay and dynamic pressing movement simulations.
- [ ] **Export Options** — One-click PDF match report export and PNG tactical board downloads.

---

## License

This project is licensed under the [MIT License](LICENSE).
