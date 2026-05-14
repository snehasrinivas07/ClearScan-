import json
import io
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app
from app.models.schemas import Finding, PatientMetadata, UncertaintyLevel, ScanType

client = TestClient(app)


def make_test_image() -> bytes:
    img = Image.new("L", (224, 224), color=128)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


MOCK_FINDINGS = [
    {"label": "Pneumonia", "confidence": 0.87, "std": 0.05, "uncertainty": "Low"},
    {"label": "Effusion",  "confidence": 0.61, "std": 0.12, "uncertainty": "Medium"},
]


class TestHealth:
    def test_returns_200(self):
        assert client.get("/health").status_code == 200

    def test_schema(self):
        data = client.get("/health").json()
        assert data["status"] == "ok"
        assert "model_loaded" in data
        assert "llm_ready" in data

    def test_root(self):
        assert client.get("/").status_code == 200


class TestAnalyse:
    def test_rejects_non_image(self):
        r = client.post("/analyse",
            files={"image": ("f.pdf", b"data", "application/pdf")},
            data={"metadata": "{}"})
        assert r.status_code == 415

    def test_rejects_oversized(self):
        r = client.post("/analyse",
            files={"image": ("f.jpg", b"x" * (11*1024*1024), "image/jpeg")},
            data={"metadata": "{}"})
        assert r.status_code == 413

    def test_503_when_model_not_loaded(self):
        with patch("app.routers.analyse.is_model_loaded", return_value=False):
            r = client.post("/analyse",
                files={"image": ("f.jpg", make_test_image(), "image/jpeg")},
                data={"metadata": "{}"})
        assert r.status_code == 503

    @patch("app.routers.analyse.generate_gradcam_heatmap", return_value="heatmap")
    @patch("app.routers.analyse.run_mc_dropout", return_value=MOCK_FINDINGS)
    @patch("app.routers.analyse.is_model_loaded", return_value=True)
    def test_success(self, *mocks):
        r = client.post("/analyse",
            files={"image": ("xray.jpg", make_test_image(), "image/jpeg")},
            data={"metadata": json.dumps({
                "patient_id": "P001", "age": 45,
                "sex": "F", "scan_type": "Chest X-ray"
            })})
        assert r.status_code == 200
        data = r.json()
        assert data["findings"][0]["label"] == "Pneumonia"
        assert "heatmap_base64" in data
        assert "risk_level" in data

    @patch("app.routers.analyse.generate_gradcam_heatmap",
           side_effect=Exception("cam fail"))
    @patch("app.routers.analyse.run_mc_dropout", return_value=MOCK_FINDINGS)
    @patch("app.routers.analyse.is_model_loaded", return_value=True)
    def test_heatmap_failure_non_fatal(self, *mocks):
        r = client.post("/analyse",
            files={"image": ("xray.jpg", make_test_image(), "image/jpeg")},
            data={"metadata": "{}"})
        assert r.status_code == 200
        assert r.json()["heatmap_base64"] == ""


class TestReport:
    def test_rejects_empty_findings(self):
        r = client.post("/report", json={
            "findings": [],
            "metadata": {"scan_type": "Chest X-ray"}
        })
        assert r.status_code == 422

    @patch("app.routers.report.generate_report_with_gpt")
    def test_success_with_llm(self, mock_fn):
        from app.models.schemas import ReportDraft
        mock_fn.return_value = (ReportDraft(
            indication="Screening.", technique="PA radiograph.",
            findings="Consolidation right lower lobe.",
            impression="Pneumonia.", recommendation="Follow-up in 6 weeks."
        ), False)
        r = client.post("/report", json={
            "findings": [{"label": "Pneumonia",
                          "confidence": 0.87, "uncertainty": "Low"}],
            "metadata": {"scan_type": "Chest X-ray"}
        })
        assert r.status_code == 200
        assert r.json()["is_fallback"] == False

    @patch("app.routers.report.generate_report_with_gpt")
    def test_fallback_flag(self, mock_fn):
        from app.models.schemas import ReportDraft
        mock_fn.return_value = (ReportDraft(
            indication="Screening.", technique="PA radiograph.",
            findings="Pneumonia detected.",
            impression="Pneumonia.", recommendation="Review required.",
            generated_by="Rule-based template (Gemini unavailable)"
        ), True)
        r = client.post("/report", json={
            "findings": [{"label": "Pneumonia",
                          "confidence": 0.87, "uncertainty": "Low"}],
            "metadata": {"scan_type": "Chest X-ray"}
        })
        assert r.status_code == 200
        assert r.json()["is_fallback"] == True


class TestRiskLevel:
    def test_critical(self):
        from app.services.inference import calculate_risk_level
        assert calculate_risk_level(
            [{"label": "Pneumothorax", "confidence": 0.82}]) == "CRITICAL"

    def test_high(self):
        from app.services.inference import calculate_risk_level
        assert calculate_risk_level(
            [{"label": "Pneumonia", "confidence": 0.75}]) == "HIGH"

    def test_low_confidence(self):
        from app.services.inference import calculate_risk_level
        assert calculate_risk_level(
            [{"label": "Pneumonia", "confidence": 0.20}]) == "LOW"

    def test_empty(self):
        from app.services.inference import calculate_risk_level
        assert calculate_risk_level([]) == "LOW"
