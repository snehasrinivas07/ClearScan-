import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ReportRequest, ReportResponse
from app.services.report import generate_report_with_gpt

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/report", response_model=ReportResponse, summary="Generate a radiology report draft")
async def generate_report(request: ReportRequest):
    if not request.findings:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="At least one finding is required.")
    try:
        draft, is_fallback = generate_report_with_gpt(
            findings  = request.findings,
            metadata  = request.metadata,
            scan_date = request.scan_date,
        )
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Report generation failed.")

    return ReportResponse(draft=draft, is_fallback=is_fallback)
