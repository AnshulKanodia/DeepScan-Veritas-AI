---
title: DeepScan Veritas AI
emoji: 🛡️
colorFrom: cyan
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Veritas AI — DeepScan Forensic

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Frontend: React Vite](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Monaco-06B6D4?logo=react&logoColor=white)](https://vitejs.dev/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-10B981?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Database: SQLAlchemy](https://img.shields.io/badge/Database-SQLite%20%7C%20Neon%20Postgres-336791?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Deployment: $0 Free Tier](https://img.shields.io/badge/Deployment-%240%2Fmo%20Free%20Tier-22C55E)](https://huggingface.co/spaces)

---

## Description

**Veritas AI (DeepScan Forensic)** is a lightweight, dual-engine forensic detector engineered to identify AI-generated prose and synthetic source code locally without relying on expensive, opaque third-party APIs. By calculating token-level log-probabilities, sentence-by-sentence linguistic perplexity, structural burstiness (Fano factor), and Abstract Syntax Tree (AST) identifier entropy, Veritas AI explains its findings with an interactive sentence-level Monaco heatmap, a detailed metrics dashboard, and cryptographic SHA-256 stamped PDF reports.

---

## Features

- **Dual-Mode Forensic Analysis:**
  - **Natural Language Engine:** Evaluates linguistic perplexity ($PPL$), structural burstiness ($\sigma^2/\mu$), and Top-$K$ (Top-10, Top-100) token distributions.
  - **Source Code (AST) Engine:** Parses Python Abstract Syntax Trees to measure nesting depth, control flow branches (cyclomatic complexity), comment density, and identifier Shannon entropy.
- **Interactive Sentence-Level Visual Heatmap:**
  - Integrated **Microsoft Monaco Editor** that paints dynamic inline background highlights using `deltaDecorations`:
    - 🟩 **Emerald Green:** Likely Human-Authored ($PPL > 45$, high burstiness)
    - 🟨 **Amber Topaz:** Mixed / Heavily Refined
    - 🟥 **Crimson Red:** Likely AI-Generated ($PPL < 25$, uniform tempo)
- **Granular Sentence-by-Sentence Breakdown:**
  - Interactive table beneath the editor providing exact Perplexity scores, AI likelihood percentages, and bidirectional click-to-highlight synchronization.
- **Real-Time Deep Statistical Dashboard:**
  - Circular radial gauge for global AI confidence.
  - Individual metric cards for Mean PPL, Minimum PPL, Burstiness Index, AST Depth, and Identifier Entropy.
- **Audit Logging & History Explorer:**
  - Automatic persistence to SQLAlchemy (SQLite locally, or Serverless PostgreSQL on Neon.tech/Supabase in production).
  - Built-in **Audit Logs** modal to inspect past scans, timestamps, and verdicts.
- **Verifiable In-Memory PDF Forensic Export:**
  - Streams verifiable, SHA-256 cryptographically stamped PDF audit reports on demand with **$0 cloud storage costs**.

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
│   │   │   ├── endpoints.py       # REST API endpoints (/analyze, /history, /export)
│   │   │   └── schemas.py         # Pydantic request/response data contracts
│   │   ├── core/
│   │   ├── db/
│   │   │   ├── database.py        # SQLAlchemy session & multi-database engine
│   │   │   └── models.py          # ScanRecord database entity
│   │   ├── ml/
│   │   │   ├── ast_analyzer.py    # Python AST & identifier entropy extractor
│   │   │   ├── features.py        # Mathematical formulas (PPL, Burstiness, Fano)
│   │   │   └── text_analyzer.py   # Token probability & perplexity calculator
│   │   ├── services/
│   │   │   └── pdf_report.py      # In-memory ReportLab PDF generator
│   │   └── main.py                # FastAPI app entrypoint (Port 7860 + CORS)
│   ├── models/
│   │   └── feature_metadata.json  # Calibrated model feature configurations
│   ├── tests/
│   │   └── test_api.py            # Pytest test suite (100% endpoint coverage)
│   ├── Dockerfile                 # Multi-stage production container (HF Spaces)
│   └── requirements.txt           # Python dependencies
├── data_engine/
│   └── train_classifier.py        # Offline feature extraction & training pipeline
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ForensicMetrics.jsx   # Statistical dashboard & radial AI gauge
│   │   │   ├── MonacoHeatmap.jsx     # Monaco Editor with dynamic decorations
│   │   │   ├── ScanHistoryModal.jsx  # Database audit history dialog
│   │   │   └── SentenceTable.jsx     # Sentence breakdown & sorting table
│   │   ├── data/
│   │   │   └── samples.js            # Preset essays and source code snippets
│   │   ├── services/
│   │   │   └── api.js                # Frontend REST client & PDF downloader
│   │   ├── App.jsx                   # Master forensic workspace application
│   │   ├── index.css                 # Pure Vanilla CSS forensic design system
│   │   └── main.jsx
│   ├── index.html                 # SEO tags, Inter & JetBrains Mono typography
│   ├── package.json
│   ├── vercel.json                # Vercel SPA routing rewrite configuration
│   └── vite.config.js
├── .gitignore                     # Comprehensive git ignore for Python & Node
├── deepscan_project_report.md     # Initial project specification
├── IMPLEMENTATION_PLAN.md         # Phased roadmap & architecture blueprint
├── LICENSE                        # MIT License
└── README.md                      # Documentation & deployment guide
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
git clone https://github.com/AnshulKanodia/DeepScan.git
cd DeepScan

# Install Python backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend (listens on default port 7860)
python backend/app/main.py
```
- API Health Check: `http://localhost:7860/health`
- Interactive Swagger UI: `http://localhost:7860/docs`

#### Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
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

### 3. $0 Budget Cloud Deployment

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
                  |    Hugging Face Spaces ($0)       |
                  |  FastAPI + ONNX Runtime (Docker)  |
                  |     (2 vCPU / 16 GB RAM Free)     |
                  +-----------------+-----------------+
                                    |
                  +-----------------+-----------------+
                  |                                   |
                  v                                   v
       +--------------------+               +-------------------+
       |  Neon.tech ($0)    |               | In-Memory Stream  |
       |  Serverless Postgres|              | Direct PDF Export |
       +--------------------+               +-------------------+
```

#### Step A: Deploy Backend to Hugging Face Spaces ($0/mo)
1. Navigate to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Name your space (e.g., `veritas-ai-api`), select license **MIT**, and choose **Docker** (Blank).
3. Connect your GitHub repository (`AnshulKanodia/DeepScan`) or push the contents of `backend/`.
4. Hugging Face Spaces will automatically build using [backend/Dockerfile](backend/Dockerfile) and expose port `7860` with **16 GB RAM completely free**.

#### Step B: Deploy Frontend to Vercel ($0/mo)
1. Go to [Vercel](https://vercel.com) and click **Add New Project**.
2. Import the `AnshulKanodia/DeepScan` repository.
3. Configure project settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-hf-username>-veritas-ai-api.hf.space`
5. Click **Deploy**. Vercel will build and deploy your app to a global edge CDN.

#### Step C: Connect Neon.tech Serverless Postgres ($0/mo, Optional)
1. Create a free project on [Neon.tech](https://neon.tech).
2. Copy your PostgreSQL connection string.
3. In Hugging Face Spaces, navigate to **Settings > Variables and secrets** and add:
   - `DATABASE_URL`: `postgresql://<user>:<password>@<host>/<dbname>?sslmode=require`
4. Veritas AI will automatically connect and create audit history tables on boot.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).
