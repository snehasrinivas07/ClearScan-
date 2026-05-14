# ClearScan AI — Backend

FastAPI backend for AI-powered medical imaging diagnostics.

## Stack
- **FastAPI** — REST API framework
- **torchxrayvision** — Pre-trained chest X-ray DenseNet-121
- **pytorch-grad-cam** — Grad-CAM++ heatmap generation
- **OpenAI GPT-4o** — Radiology report generation
- **Render.com** — Deployment

---

## Local Setup (5 minutes)

### 1. Clone and enter the backend folder
```bash
git clone https://github.com/your-team/clearscan-ai.git
cd clearscan-ai/backend
```

### 2. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```
> ⚠️ PyTorch + torchxrayvision install is ~1.5GB. Grab a coffee.

### 4. Set up environment variables
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 5. Run the server
```bash
uvicorn app.main:app --reload --port 8000
```

Server is live at: **http://localhost:8000**
API docs at:       **http://localhost:8000/docs**

---

## API Endpoints

### `GET /health`
Returns system status.
```json
{
  "status": "ok",
  "model_loaded": true,
  "openai_ready": true,
  "version": "1.0.0",
  "environment": "development"
}
```

---

### `POST /analyse`
Accepts a scan image + metadata. Returns findings, heatmap, risk level.

**Request** — multipart/form-data:
```
image:    <JPEG or PNG file, max 10MB>
metadata: {"patient_id": "P001", "age": 45, "sex": "F", "scan_type": "Chest X-ray"}
```

**Response:**
```json
{
  "findings": [
    {"label": "Pneumonia",  "confidence": 0.87, "uncertainty": "Low"},
    {"label": "Effusion",   "confidence": 0.61, "uncertainty": "Medium"}
  ],
  "heatmap_base64": "iVBORw0KGgo...",
  "risk_level": "HIGH",
  "model_version": "densenet121-res224-all",
  "inference_mode": "online"
}
```

**cURL example:**
```bash
curl -X POST http://localhost:8000/analyse \
  -F "image=@chest_xray.jpg" \
  -F 'metadata={"patient_id":"P001","age":45,"sex":"F","scan_type":"Chest X-ray"}'
```

---

### `POST /report`
Accepts findings + metadata. Returns GPT-4o report draft.

**Request:**
```json
{
  "findings": [
    {"label": "Pneumonia", "confidence": 0.87, "uncertainty": "Low"}
  ],
  "metadata": {
    "patient_id": "P001",
    "age": 45,
    "sex": "F",
    "scan_type": "Chest X-ray"
  },
  "scan_date": "2026-05-14"
}
```

**Response:**
```json
{
  "draft": {
    "indication":     "Evaluation for pulmonary infection...",
    "technique":      "PA chest radiograph in full inspiration.",
    "findings":       "Right lower lobe consolidation...",
    "impression":     "Right lower lobe pneumonia.",
    "recommendation": "Clinical correlation. Follow-up in 4-6 weeks.",
    "generated_by":   "GPT-4o (gpt-4o)",
    "disclaimer":     "This report was AI-generated..."
  },
  "is_fallback": false
}
```

> If `is_fallback: true`, the GPT-4o call failed and a rule-based template was used.

---

## Running Tests

```bash
pip install pytest httpx
pytest tests/ -v
```

Expected: **13 tests passing**

---

## Deployment — Render.com

### One-time setup:
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — click **Deploy**
5. In Render dashboard → Environment → Add:
   - `OPENAI_API_KEY` = your key
   - `ALLOWED_ORIGINS` = your Vercel frontend URL

### After deploy:
- Backend URL: `https://clearscan-backend.onrender.com`
- Give to P1 (Frontend) so they can set `VITE_API_URL` in their `.env`

> ⚠️ Free tier spins down after 15min inactivity (cold start ~30s).
> The frontend calls `/health` on load to wake it up automatically.

---

## Project Structure

```
backend/
├── app/
│   ├── main.py               ← FastAPI app factory + lifespan
│   ├── core/
│   │   └── config.py         ← Settings via pydantic-settings
│   ├── models/
│   │   └── schemas.py        ← All Pydantic request/response schemas
│   ├── routers/
│   │   ├── analyse.py        ← POST /analyse
│   │   ├── report.py         ← POST /report
│   │   └── health.py         ← GET /health
│   └── services/
│       ├── inference.py      ← ML model, Grad-CAM, MC Dropout
│       └── report.py         ← OpenAI GPT-4o + fallback template
├── tests/
│   └── test_api.py           ← Full test suite
├── requirements.txt
├── render.yaml               ← Render deployment config
├── .env.example              ← Environment variable template
└── .gitignore
```

---

## Handoff to Frontend (P1)

Once deployed, send P1 these two things:
1. **Production URL**: `https://clearscan-backend.onrender.com`
2. **API contract**: See `/docs` for interactive Swagger UI

Frontend environment variable to set:
```
VITE_API_BASE_URL=https://clearscan-backend.onrender.com
```

---

## Handoff to AI/ML (P3)

The `export_to_onnx()` function in `app/services/inference.py` is ready.
P3 just needs to call it after the model loads:

```python
from app.services.inference import load_model, export_to_onnx
load_model()
export_to_onnx("ml/model.onnx")
```

The resulting `model.onnx` goes to `/frontend/public/models/` for offline inference.
