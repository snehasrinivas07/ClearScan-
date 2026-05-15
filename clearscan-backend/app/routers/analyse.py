"""
/analyse Router
Accepts medical scan images (X-ray, CT, MRI).
Runs MC Dropout inference + Grad-CAM heatmap.
"""

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

ALLOWED_TYPES = {
    "image/jpeg", "image/jpg", "image/png",
    "image/webp", "image/tiff", "image/tif"
}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB for CT scans


@router.post(
    "/analyse",
    response_model=AnalyseResponse,
    summary="Analyse a medical scan image",
    description=(
        "Upload an X-ray, CT or MRI image and patient metadata. "
        "Returns AI findings with confidence scores, uncertainty levels, "
        "a Grad-CAM heatmap overlay, and an overall risk level. "
        "Supports: Chest X-ray, Chest CT, Abdomen CT, Brain CT, "
        "Full Body CT, Brain MRI, Spine MRI."
    ),
)
async def analyse_scan(
    image: UploadFile = File(
        ...,
        description="Medical scan image (JPEG, PNG, TIFF — max 25MB)"
    ),
    metadata: str = Form(
        default='{"patient_id":"ANON","scan_type":"Chest X-ray"}',
        description="JSON string of PatientMetadata",
    ),
):
    # ── 1. Validate model ─────────────────────────────────────────────────────
    if not is_model_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model is not loaded yet. Please try again shortly.",
        )

    # ── 2. Validate file type ─────────────────────────────────────────────────
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type: {image.content_type}. "
                f"Use JPEG, PNG, or TIFF."
            ),
        )

    # ── 3. Read and validate size ─────────────────────────────────────────────
    image_bytes = await image.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 25MB.",
        )

    # ── 4. Parse metadata ─────────────────────────────────────────────────────
    try:
        meta_dict = json.loads(metadata)
        patient   = PatientMetadata(**meta_dict)
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid metadata JSON: {e}",
        )

    # ── 5. Run inference ──────────────────────────────────────────────────────
    try:
        logger.info(
            f"Running inference | Patient: {patient.patient_id} | "
            f"Scan: {patient.scan_type}"
        )
        raw_findings = run_mc_dropout(image_bytes)
    except Exception as e:
        logger.error(f"Inference failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI inference failed. Please try again.",
        )

    # ── 6. Generate Grad-CAM heatmap ──────────────────────────────────────────
    try:
        top_label   = raw_findings[0]["label"] if raw_findings else None
        heatmap_b64 = generate_gradcam_heatmap(image_bytes, top_label)
    except Exception as e:
        logger.warning(f"Grad-CAM failed (non-fatal): {e}")
        heatmap_b64 = ""

    # ── 7. Build response ─────────────────────────────────────────────────────
    findings = [
        Finding(
            label       = f["label"],
            confidence  = f["confidence"],
            uncertainty = UncertaintyLevel(f["uncertainty"]),
        )
        for f in raw_findings
    ]
    risk_level = calculate_risk_level(raw_findings)

    logger.info(
        f"Analysis complete | Patient: {patient.patient_id} | "
        f"Scan: {patient.scan_type} | "
        f"Top: {findings[0].label if findings else 'None'} | "
        f"Risk: {risk_level}"
    )

    return AnalyseResponse(
        findings       = findings,
        heatmap_base64 = heatmap_b64,
        risk_level     = risk_level,
        inference_mode = "online",
    )