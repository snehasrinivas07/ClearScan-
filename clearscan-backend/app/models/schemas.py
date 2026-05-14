from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class RiskLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH     = "HIGH"
    MODERATE = "MODERATE"
    LOW      = "LOW"

class UncertaintyLevel(str, Enum):
    LOW    = "Low"
    MEDIUM = "Medium"
    HIGH   = "High"

class ScanType(str, Enum):
    CHEST_XRAY = "Chest X-ray"
    CT_SCAN    = "CT Scan"
    MRI        = "MRI"


class PatientMetadata(BaseModel):
    patient_id:  Optional[str] = Field(default="ANON")
    age:         Optional[int] = Field(default=None, ge=0, le=120)
    sex:         Optional[str] = Field(default=None, pattern="^(M|F|Other)$")
    scan_type:   ScanType      = Field(default=ScanType.CHEST_XRAY)

class Finding(BaseModel):
    label:       str
    confidence:  float = Field(ge=0.0, le=1.0)
    uncertainty: UncertaintyLevel

class AnalyseResponse(BaseModel):
    findings:       list[Finding]
    heatmap_base64: str
    risk_level:     RiskLevel
    model_version:  str = "densenet121-res224-all"
    inference_mode: str = "online"
    message:        Optional[str] = None


class ReportRequest(BaseModel):
    findings:  list[Finding]
    metadata:  PatientMetadata
    scan_date: Optional[str] = None

class ReportDraft(BaseModel):
    indication:     str
    technique:      str
    findings:       str
    impression:     str
    recommendation: str
    generated_by:   str = "Gemini (AI-assisted draft)"
    disclaimer:     str = (
        "This report was AI-generated and requires review and approval "
        "by a licensed radiologist before clinical use."
    )

class ReportResponse(BaseModel):
    draft:       ReportDraft
    is_fallback: bool = False


class HealthResponse(BaseModel):
    status:       str = "ok"
    model_loaded: bool
    llm_ready:    bool
    version:      str = "1.0.0"
    environment:  str
