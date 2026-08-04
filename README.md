# Team 42 — Hybrid Decision Support System (DSS)

An enterprise-grade Decision Support System that combines **Retrieval-Augmented Generation (RAG)** with structured **Knowledge Graphs (Neo4j)** to deliver evidence-backed, explainable insights with verifiable citations.

---

## 📌 System Architecture & Data Flow

The system employs a dual-retrieval pipeline to balance structured relational context with vector similarity search and graph-based entity traversals.

```
                  ┌───────────────────────────────┐
                  │       React + TS Frontend     │
                  └───────────────┬───────────────┘
                                  │ REST API
                                  ▼
                  ┌───────────────────────────────┐
                  │       FastAPI Backend         │
                  └───────┬───────────────┬───────┘
                          │               │
        ┌─────────────────┴─┐           ┌─┴──────────────────┐
        │  Relational DB    │           │ Asynchronous Engine│
        │  (SQLAlchemy)     │           │ (Celery + Redis)   │
        └───────────────────┘           └────────────────────┘
                                                  │
                                  ┌───────────────┴───────────────┐
                                  │     Hybrid Retrieval Engine   │
                                  │   (Neo4j Graph + RAG Vector)  │
                                  └───────────────────────────────┘
```

### Core Pipeline
1. **Query Processing:** Client submits a decision query via the React interface.
2. **Context Retrieval:**
   - **Graph Search:** Queries Neo4j for entity relationships, dependencies, and triple paths ($E_1 ightarrow R ightarrow E_2$).
   - **Vector Search:** Performs semantic search across domain documents for relevant text chunks.
3. **Async Processing:** Heavy aggregation and background jobs are offloaded to **Celery workers** backed by **Redis**.
4. **Synthesis & Citation:** LLM synthesizes retrieved evidence into structured recommendations, attaching explicit source citations.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Vite |
| **Backend API** | Python 3.10+, FastAPI, SQLAlchemy |
| **Graph & Data** | Neo4j (Graph DB), PostgreSQL (Relational) |
| **Queue & Cache** | Redis, Celery (Async Task Processing) |
| **DevOps & Infra**| Docker, Docker Compose, GitHub Actions (CI/CD) |

---

## 🚀 Local Development Setup

### Prerequisites
- Docker Desktop (with Docker Compose v2)
- Node.js v18+ (for local frontend dev)
- Python 3.10+ (for local backend dev)

---

### Method 1: Quickstart with Docker Compose (Recommended)

Spins up the full stack (Frontend, FastAPI, Neo4j, Redis, Celery worker) in isolated containers:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rayantolange/Team_42_DSS.git
   cd Team_42_DSS
   ```

2. **Set up Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to supply your API keys and default database passwords.*

3. **Launch the environment:**
   ```bash
   docker-compose up --build -d
   ```

4. **Verify running services:**
   - **Frontend UI:** `http://localhost:3000`
   - **FastAPI Interactive Docs (Swagger):** `http://localhost:8000/docs`
   - **Neo4j Browser Console:** `http://localhost:7474` (Bolt port: `7687`)
   - **Redis Inspector:** `http://localhost:6379`

---

### Method 2: Manual Local Setup (Development Mode)

If you prefer running services directly on your host machine for active debugging:

#### 1. Backend & Database Setup
```bash
# Navigate to backend
cd backend

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations / Database setup
alembic upgrade head

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```

#### 2. Start Celery Worker (In a separate terminal)
```bash
celery -A app.core.celery_app worker --loglevel=info
```

#### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```

---

## 🧪 Testing & Code Quality

### Running Backend Unit & Integration Tests
```bash
pytest --cov=app tests/
```

### Running Frontend Tests
```bash
cd frontend
npm run test
```

### Code Formatting & Linting
```bash
# Backend
black .
flake8

# Frontend
npm run lint
```

---

## 📂 Repository Structure

```text
Team_42_DSS/
├── .github/              # GitHub Actions workflows & CI/CD
├── backend/
│   ├── app/
│   │   ├── api/          # REST Endpoint Routers
│   │   ├── core/         # Config, Security, Celery client
│   │   ├── db/           # SQLAlchemy & Neo4j drivers
│   │   ├── models/       # Pydantic schemas & DB ORM models
│   │   └── services/     # RAG pipeline & Graph search logic
│   ├── tests/            # Pytest test suites
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Dashboard & view routes
│   │   └── services/     # API integration logic
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml    # Multi-container orchestration config
├── .env.example          # Template for required secrets
├── LICENSE               # MIT License
└── README.md             # System documentation
```

---

## 🔒 Environment Configuration (`.env`)

Refer to `.env.example` for the full list of configurable parameters:

```env
# Database Settings
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=dss_db

# Neo4j Graph DB
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# Redis & Celery
REDIS_URL=redis://localhost:6379/0

# LLM API Credentials
OPENAI_API_KEY=your_openai_key
```
