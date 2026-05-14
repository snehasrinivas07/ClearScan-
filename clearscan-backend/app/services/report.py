"""
Report Generation Service
Calls Google Gemini 2.5 Flash to generate structured radiology
report drafts. Falls back to rule-based template if unavailable.
"""

import json
import logging
from datetime import date

import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError, ResourceExhausted
from app.core.config import get_settings
from app.models.schemas import Finding, PatientMetadata, ReportDraft

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a senior radiologist assistant generating structured radiology report drafts.

Your output must be ONLY a valid JSON object — no markdown, no backticks, no preamble, no extra text.

The JSON must have exactly these five string keys:
  "indication"     — why the scan was ordered (1-2 sentences, inferred from findings)
  "technique"      — imaging technique used (1 sentence, based on scan type provided)
  "findings"       — detailed description of detected abnormalities with confidence levels
  "impression"     — 2-3 sentence summary of significant findings and likely diagnosis
  "recommendation" — clinical next steps

Use formal clinical radiology language. Do not include disclaimers inside the JSON."""


def _build_user_prompt(
    findings: list[Finding],
    metadata: PatientMetadata,
    scan_date: str | None,
) -> str:
    date_str    = scan_date or date.today().isoformat()
    age_str     = f"{metadata.age}y" if metadata.age else "Age unknown"
    sex_str     = metadata.sex or "Sex unknown"
    patient_str = f"Patient: {metadata.patient_id} | {age_str} | {sex_str}"
    finding_lines = [
        f"  {i}. {f.label} — confidence {f.confidence * 100:.0f}%, "
        f"uncertainty {f.uncertainty}"
        for i, f in enumerate(findings, 1)
    ] or ["  No significant findings detected."]
    return (
        f"Generate a radiology report draft for the following:\n\n"
        f"Scan Type: {metadata.scan_type}\n"
        f"Date: {date_str}\n"
        f"{patient_str}\n\n"
        f"AI-Detected Findings (ranked by confidence):\n"
        f"{chr(10).join(finding_lines)}\n\n"
        f"Return ONLY the JSON object as described."
    )


def generate_report_with_gpt(
    findings: list[Finding],
    metadata: PatientMetadata,
    scan_date: str | None = None,
) -> tuple[ReportDraft, bool]:
    settings = get_settings()

    if not settings.gemini_api_key or \
       settings.gemini_api_key == "your-gemini-key-here":
        logger.warning("Gemini API key not set — using fallback template")
        return _fallback_report(findings, metadata), True

    try:
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=SYSTEM_PROMPT,
        )
        user_prompt = _build_user_prompt(findings, metadata, scan_date)
        logger.info(f"Calling Gemini. Model: {settings.gemini_model}")
        response = model.generate_content(
            user_prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=800,
                response_mime_type="application/json",
            ),
        )
        raw = response.text.strip()
        clean = raw.removeprefix("```json").removeprefix("```") \
                   .removesuffix("```").strip()
        parsed = json.loads(clean)
        return ReportDraft(
            indication     = parsed.get("indication", ""),
            technique      = parsed.get("technique", ""),
            findings       = parsed.get("findings", ""),
            impression     = parsed.get("impression", ""),
            recommendation = parsed.get("recommendation", ""),
            generated_by   = f"Gemini ({settings.gemini_model})",
        ), False

    except ResourceExhausted:
        logger.error("Gemini rate limit hit — using fallback")
        return _fallback_report(findings, metadata), True
    except GoogleAPIError as e:
        logger.error(f"Gemini API error: {e} — using fallback")
        return _fallback_report(findings, metadata), True
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.error(f"JSON parse error: {e} — using fallback")
        return _fallback_report(findings, metadata), True
    except Exception as e:
        logger.error(f"Unexpected error: {e} — using fallback")
        return _fallback_report(findings, metadata), True


def is_llm_configured() -> bool:
    s = get_settings()
    return bool(s.gemini_api_key and
                s.gemini_api_key != "your-gemini-key-here")


def _fallback_report(
    findings: list[Finding],
    metadata: PatientMetadata,
) -> ReportDraft:
    scan = metadata.scan_type
    if findings:
        summary = "; ".join(
            f"{f.label} ({f.confidence * 100:.0f}%, {f.uncertainty} uncertainty)"
            for f in findings
        ) + "."
        top_label = findings[0].label
        top_conf  = f"{findings[0].confidence * 100:.0f}%"
    else:
        summary   = "No significant abnormalities detected."
        top_label = "No significant finding"
        top_conf  = "N/A"

    technique_map = {
        "Chest X-ray": "Posteroanterior (PA) chest radiograph in standard inspiration.",
        "CT Scan":      "Computed tomography with standard protocol.",
        "MRI":          "Magnetic resonance imaging with standard sequences.",
    }
    return ReportDraft(
        indication     = (f"Clinical evaluation using {scan}. "
                          f"AI-assisted screening for abnormalities."),
        technique      = technique_map.get(scan, "Standard imaging protocol."),
        findings       = (f"AI analysis detected: {summary} "
                          f"Full radiologist review required."),
        impression     = (f"AI identified {top_label} as primary finding "
                          f"(confidence: {top_conf}). Clinical correlation recommended."),
        recommendation = ("Formal radiologist review required before clinical decisions. "
                          "Follow-up imaging or specialist referral if findings confirmed."),
        generated_by   = "Rule-based template (Gemini unavailable)",
    )
