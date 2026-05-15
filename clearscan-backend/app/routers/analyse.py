import json
import logging
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, status
from app.models.schemas import (
    AnalyseResponse, Finding, PatientMetadata, UncertaintyLevel
)
from app.services.inference import (
    is_model_loaded, run_mc_dropout,
    generate_gradcam_heatmap, calculate_risk_level
)

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE  = 10 * 1024 * 1024


@router.post("/analyse", response_model=AnalyseResponse,
             summary="Analyse a medical scan image")
async def analyse_scan(
    image: UploadFile = File(...),
    metadata: str = Form(
        default='{"patient_id":"ANON","scan_type":"Chest X-ray"}'
    ),
):
    
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            detail=f"Unsupported type: {image.content_type}.")

    image_bytes = await image.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File too large. Max 10MB.")
    if not is_model_loaded():
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="AI model is not loaded yet.")
    try:
        meta_dict = json.loads(metadata)
        patient   = PatientMetadata(**meta_dict)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail=f"Invalid metadata: {e}")
    SUPPORTED_SCAN_TYPES = {"Chest X-ray", "chest_xray", "chest x-ray", "Chest X-Ray"}
    if patient.scan_type not in SUPPORTED_SCAN_TYPES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Scan type '{patient.scan_type}' is not supported. This model only supports Chest X-ray. CT and MRI support coming soon."
        )

    try:
        raw_findings = run_mc_dropout(image_bytes)
    except Exception as e:
        logger.error(f"Inference failed: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="AI inference failed.")

    try:
        top_label   = raw_findings[0]["label"] if raw_findings else None
        heatmap_b64 = generate_gradcam_heatmap(image_bytes, top_label)
    except Exception as e:
        logger.warning(f"Grad-CAM failed (non-fatal): {e}")
        heatmap_b64 = ""

    findings = [
        Finding(
            label       = f["label"],
            confidence  = f["confidence"],
            uncertainty = UncertaintyLevel(f["uncertainty"]),
        )
        for f in raw_findings
    ]
    risk_level = calculate_risk_level(raw_findings)

    return AnalyseResponse(
        findings       = findings,
        heatmap_base64 = heatmap_b64,
        risk_level     = risk_level,
        inference_mode = "online",
    )
