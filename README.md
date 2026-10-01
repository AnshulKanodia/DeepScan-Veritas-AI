# Veritas AI (DeepScan Forensic)
**Dual-Engine AI-Generated Text & Source Code Forensic Detector**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Monaco-06B6D4)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-10B981)](https://fastapi.tiangolo.com/)
[![Deployment Cost](https://img.shields.io/badge/Budget-%240%2Fmo%20Free%20Tier-22C55E)](https://huggingface.co/spaces)

Veritas AI is an open-source, machine-learning-powered forensic platform designed to distinguish between human-authored and AI-generated content without relying on opaque, expensive third-party APIs. It extracts token probabilities, linguistic perplexity, and structural burstiness locally, providing an interactive sentence-level Monaco heatmap and verifiable PDF forensic reports.

---

## Key Features

1. **Dual-Mode Forensic Engine:**
   - **Natural Language (Prose):** Calculates token log-probabilities, sentence-by-sentence linguistic perplexity ($PPL$), and structural burstiness (Fano factor $\sigma^2/\mu$).
   - **Source Code (AST):** Evaluates Abstract Syntax Tree (AST) max nesting depth, variable naming Shannon entropy, and cyclomatic complexity.
2. **Interactive Sentence-Level Visual Heatmap:**
   - Embedded Microsoft Monaco Editor highlighting text dynamically:
     - 🟩 **Green:** Likely Human-Written ($PPL > 45$, high burstiness)
     - 🟨 **Amber:** Mixed / Edited / Uncertain
     - 🟥 **Red:** Likely AI-Generated ($PPL < 25$, low burstiness)
3. **Deep Statistical Dashboard:**
   - Real-time gauge for AI Confidence Percentage.
   - Mean Perplexity, Minimum Perplexity, Burstiness Score, AST Depth, and Identifier Entropy.
4. **Verifiable In-Memory Forensic PDF Export:**
   - Generates and streams timestamped, SHA-256 cryptographically stamped forensic audit reports with $0 cloud storage costs.

---

## $0 Budget Deployment Architecture

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

### 1. Deploy Frontend to Vercel ($0)
1. Fork or push this repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select the `frontend` root directory:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variable:** `VITE_API_URL=https://<your-hf-space-name>.hf.space`

### 2. Deploy Backend to Hugging Face Spaces ($0)
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Set **Space SDK** to **Docker** (Blank).
3. Connect your repository or push the `backend/` folder and `backend/Dockerfile`.
4. Hugging Face Spaces automatically builds and exposes the container on port `7860` with **16 GB RAM free**.

---

## Local Development Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to project root
cd DeepScan

# Install Python requirements
pip install -r backend/requirements.txt

# Run FastAPI backend server (listens on port 7860)
python backend/app/main.py
```
Backend Swagger API documentation will be available at: `http://localhost:7860/docs`.

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Running Tests

```bash
pytest backend/tests/test_api.py
```

---

## License
Released under the [MIT License](LICENSE).
