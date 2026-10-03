# Veritas AI — DeepScan Forensic

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Frontend: React & Monaco](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%20%7C%20Monaco-06B6D4?logo=react&logoColor=white)](https://vitejs.dev/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-10B981?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Deployment: Vercel](https://img.shields.io/badge/Deployment-Vercel%20Serverless%20%7C%20%240%20Tier-black?logo=vercel&logoColor=white)](https://deepscan-veritas-ai.vercel.app/)
[![Database: SQLAlchemy](https://img.shields.io/badge/Database-SQLite%20%7C%20PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.sqlalchemy.org/)
[![Engine: Multi-Language AST & Perplexity](https://img.shields.io/badge/Engine-Perplexity%20%7C%20Multi--Language%20AST-8B5CF6)](https://github.com/AnshulKanodia/DeepScan-Veritas-AI)

---

## Small Description

**Veritas AI (DeepScan Forensic)** is a high-assurance, dual-modality authenticity engine engineered to detect AI-generated prose, humanized paraphrasing, and synthetic source code without relying on expensive, black-box third-party APIs. By fusing n-gram linguistic perplexity ($PPL$), structural burstiness (Fano factor), anti-humanizer paraphrase signatures, multi-language Abstract Syntax Tree (AST) analysis, and Shannon entropy, Veritas AI explains its findings through an interactive sentence-level Monaco heatmap, deep statistical telemetry, and verifiable cryptographic SHA-256 PDF audit certificates—all deployable on a $0 free tier budget.

---

## Features

- **Dual-Modality Forensic Architecture**:
  - **Natural Language Engine:** Evaluates sentence-by-sentence linguistic perplexity ($PPL$), structural burstiness ($\sigma^2/\mu$), and Top-$K$ (Top-10, Top-100) token distributions.
  - **Anti-Humanizer & Paraphraser Detection:** Identifies evasion signatures produced by AI humanizing tools (e.g., QuillBot, StealthGPT, Undetectable AI) via synonym substitution entropy and structural variance smoothing.
  - **Multi-Language Source Code (AST) Engine:** Structural analysis across **Python, JavaScript, TypeScript, Java, C++, and Go**; measures AST nesting depth, cyclomatic branching complexity, comment density, and identifier Shannon entropy.
- **Interactive Monaco Editor Visual Heatmap**:
  - Integrated **Microsoft Monaco Editor** with dynamic sentence-level `deltaDecorations` and automatic highlight reset upon typing:
    - 🟩 **Likely Human (<35% AI Prob):** High structural perplexity and organic burstiness.
    - 🟨 **Mixed / Refined (35–70% AI Prob):** Hybrid editing, translation, or AI-assisted composition.
    - 🟥 **Likely AI (>70% AI Prob):** Low perplexity uniformity characteristic of large language models.
- **Universal Document Extraction & Web Ingestion**:
  - Native file upload and drag-and-drop support for **PDF** (`.pdf`), **Word** (`.docx`), plain text (`.txt`), and source code files.
  - Built-in **Web & GitHub URL Scanner** to extract and inspect live online articles and repositories.
- **Granular Segment Breakdown**:
  - Sentence-by-sentence and line-by-line inspection table with bidirectional click-to-highlight synchronization, sorting, and individual confidence ratings.
- **Deep Statistical Telemetry Dashboard**:
  - High-precision radial SVG gauge displaying global AI probability.
  - Granular telemetry cards for Mean PPL, Minimum PPL, Burstiness Index, AST Depth, and Information Entropy.
  - Active segment inspector displaying raw excerpt and perplexity metrics.
- **Cryptographic Audit Logs & In-Memory PDF Export**:
  - Persistent scan history with audit records stored via SQLAlchemy (SQLite locally or serverless PostgreSQL in production).
  - Built-in audit log modal to explore historical scans, timestamps, and classifications.
  - Verifiable, cryptographically stamped (SHA-256) PDF audit certificates streamed in-memory via ReportLab with **$0 cloud storage overhead**.

---

## File Structure

```text
DeepScan/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated testing & build pipeline
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints.py       # REST endpoints (/analyze, /extract-file, /url, /history, /export/pdf)
│   │   │   └── schemas.py         # Pydantic request/response data contracts
│   │   ├── db/
│   │   │   ├── database.py        # SQLAlchemy session & database engine
│   │   │   └── models.py          # ScanRecord database entity
│   │   ├── ml/
│   │   │   ├── ast_analyzer.py    # Multi-language AST parser & identifier entropy calculator
│   │   │   ├── features.py        # Mathematical formulas (PPL, Burstiness, Fano factor)
│   │   │   └── text_analyzer.py   # Perplexity, burstiness & humanizer detection engine
│   │   ├── services/
│   │   │   └── pdf_report.py      # In-memory ReportLab PDF generator
│   │   └── main.py                # FastAPI entrypoint (Port 7860 + CORS)
│   ├── models/
│   │   └── feature_metadata.json  # Calibrated model feature configurations
│   ├── tests/
│   │   └── test_api.py            # Pytest test suite (100% endpoint coverage)
│   ├── Dockerfile                 # Multi-stage production container
│   └── requirements.txt           # Python dependencies (FastAPI, pypdf, reportlab, uvicorn)
├── data_engine/
│   └── train_classifier.py        # Offline feature extraction & training pipeline
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ForensicMetrics.jsx   # Statistical dashboard & radial AI gauge
│   │   │   ├── MonacoHeatmap.jsx     # Monaco Editor with dynamic decorations
│   │   │   ├── ScanHistoryModal.jsx  # Database audit history dialog
│   │   │   ├── SentenceTable.jsx     # Sentence breakdown & sorting table
│   │   │   └── UrlScanModal.jsx      # Web & GitHub URL ingestion dialog
│   │   ├── services/
│   │   │   └── api.js                # Frontend REST client & PDF downloader
│   │   ├── App.jsx                   # Master forensic workspace application
│   │   ├── index.css                 # Pure Vanilla CSS forensic design system
│   │   └── main.jsx
│   ├── index.html                 # SEO tags, Inter & JetBrains Mono typography
│   ├── package.json
│   └── vite.config.js
├── .gitignore                     # Git ignore rules for Python, Node, & caches
├── deepscan_project_report.md     # Initial project specification
├── IMPLEMENTATION_PLAN.md         # Phased roadmap & architecture blueprint
├── LICENSE                        # MIT License
├── README.md                      # Documentation & deployment guide
├── TEST_SAMPLES.txt               # Verification sample dataset (AI, Human, Mixed, Code)
└── vercel.json                    # Unified multi-service routing configuration
```

---

## Setup & Deployment

### 1. Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** 18 or higher (with `npm`)
- **Git**

---

### 2. Local Development Setup

#### Backend Setup
```bash
# Clone the repository
git clone https://github.com/AnshulKanodia/DeepScan-Veritas-AI.git
cd DeepScan-Veritas-AI

# Install Python backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend (runs on port 7860)
python backend/app/main.py
```
- API Health Check: `http://localhost:7860/health`
- Interactive Swagger UI: `http://localhost:7860/docs`

#### Frontend Setup
```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

#### Running Tests
```bash
pytest backend/tests/test_api.py -v
```

---

### 3. Setup & Cloud Deployment ($0 Budget)

Veritas AI is designed to run seamlessly on modern zero-cost cloud tiers.

```
                  +-----------------------------------+
                  |           Vercel ($0)             |
                  |     React (Vite) + Monaco SPA     |
                  +-----------------+-----------------+
                                    |
                            HTTPS REST Calls
                                    |
                                    v
                  +-----------------------------------+
                  |      Vercel / HF Spaces ($0)      |
                  |  FastAPI + In-Memory Python Engine|
                  +-----------------+-----------------+
                                    |
                  +-----------------+-----------------+
                  |                                   |
                  v                                   v
       +--------------------+               +-------------------+
       | SQLite / Postgres  |               | In-Memory Stream  |
       |  Audit Log DB ($0) |               | Direct PDF Export |
       +--------------------+               +-------------------+
```

#### Option A: Unified Vercel Serverless Deployment ($0/mo, Recommended)
1. Fork or push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import the `DeepScan-Veritas-AI` repository.
4. Keep the root directory as `./` (Vercel automatically detects [`vercel.json`](vercel.json) to build the FastAPI backend and React frontend simultaneously).
5. Click **Deploy**. Vercel will deploy both the API and the web frontend to a global edge network.

#### Option B: Hugging Face Spaces (Docker Container, $0/mo)
1. Navigate to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Select **Docker** (Blank) and set your license to **MIT**.
3. Connect your GitHub repository (`AnshulKanodia/DeepScan-Veritas-AI`).
4. Hugging Face Spaces will build the application using [`backend/Dockerfile`](backend/Dockerfile) and expose port `7860` with **16 GB RAM completely free**.

#### Option C: Serverless PostgreSQL (Optional)
To persist audit logs across serverless instances:
1. Create a free PostgreSQL instance on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).
2. Set the `DATABASE_URL` environment variable in your deployment dashboard:
   ```env
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   ```
3. Veritas AI will automatically connect and create audit history tables on boot.

---

## License

This project is open-source and licensed under the terms of the [MIT License](LICENSE).
