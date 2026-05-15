"""
Report Generation Service
Calls Google Gemini 2.5 Flash to generate structured radiology
report drafts. Falls back to rule-based template if unavailable.
Supports: Chest X-ray, Chest CT, Abdomen CT, Brain CT,
          Full Body CT, Brain MRI, Spine MRI
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
  "indication"     — why the scan was ordered (1-2 sentences, inferred from findings and scan type)
  "technique"      — imaging technique used (1 sentence, specific to the scan type provided)
  "findings"       — detailed description of detected abnormalities with confidence levels and anatomical locations
  "impression"     — 2-3 sentence summary of significant findings and likely diagnosis
  "recommendation" — clinical next steps appropriate for the scan type and findings

Use formal clinical radiology language appropriate for the scan type.
For CT scans use CT-specific terminology (Hounsfield units, windows, enhancement patterns).
For MRI use MRI-specific terminology (signal intensity, sequences, enhancement).
For X-ray use radiograph-specific terminology.
Do not include disclaimers inside the JSON."""


# ─── CT/MRI Specific Context ──────────────────────────────────────────────────

CT_CONTEXT = {
    "Chest CT": """
This is a Chest CT scan. Use CT-specific terminology:
- Describe lung parenchyma in lung windows (normal: -700 to -600 HU)
- Describe mediastinum, pleura, pericardium, great vessels
- Note any pulmonary nodules with size and morphology
- Describe lymph nodes if enlarged (>1cm short axis)
- Use terms: ground-glass opacity, consolidation, tree-in-bud, bronchiectasis
""",
    "Abdomen CT": """
This is an Abdominal CT scan. Use CT-specific terminology:
- Systematically describe: liver, gallbladder, spleen, pancreas, kidneys, adrenals, bowel, mesentery, retroperitoneum
- Note organ size, density, enhancement pattern if contrast given
- Describe any masses with size, location, attenuation (HU values)
- Note free fluid, free air, lymphadenopathy
- Use terms: hypodense, hyperdense, heterogeneous, rim-enhancing
""",
    "Brain CT": """
This is a Brain CT scan. Use CT-specific terminology:
- Describe brain parenchyma: cortex, white matter, basal ganglia, thalami, cerebellum, brainstem
- Note ventricular system size and symmetry
- Describe any hyperdense (hemorrhage ~60HU) or hypodense (infarct/edema) areas
- Comment on sulci, cisterns, midline shift
- Note calvarium and skull base
- Use terms: hyperdense, hypodense, isodense, mass effect, herniation
""",
    "Full Body CT": """
This is a Full Body CT scan. Systematically review all regions:
- Chest: lungs, mediastinum, pleura
- Abdomen: solid organs, hollow viscera, vasculature
- Pelvis: bladder, reproductive organs, rectum
- Musculoskeletal: bones, soft tissues
Note any significant findings in each region with location and characterization.
""",
    "Brain MRI": """
This is a Brain MRI. Use MRI-specific terminology:
- Describe signal on T1, T2, FLAIR sequences
- Note any diffusion restriction (DWI/ADC)
- Describe enhancement pattern on post-contrast T1
- Comment on white matter, grey matter, ventricles, posterior fossa
- Use terms: T1 hypointense/hyperintense, T2 hyperintense, FLAIR hyperintense, restricted diffusion
""",
    "Spine MRI": """
This is a Spine MRI. Use MRI-specific terminology:
- Describe vertebral bodies, disc spaces, neural foramina, spinal canal
- Note any disc herniation with direction and level
- Describe cord signal if cervical/thoracic
- Comment on alignment, degenerative changes
- Use terms: disc bulge, herniation, foraminal stenosis, cord compression, Modic changes
""",
}


# ─── Helper ───────────────────────────────────────────────────────────────────

def _get_scan_type_str(scan_type) -> str:
    """Safely extract string value from ScanType enum or plain string."""
    if hasattr(scan_type, 'value'):
        return scan_type.value
    return str(scan_type)


# ─── Prompt Builder ───────────────────────────────────────────────────────────

def _build_user_prompt(
    findings: list[Finding],
    metadata: PatientMetadata,
    scan_date: str | None,
) -> str:
    date_str     = scan_date or date.today().isoformat()
    age_str      = f"{metadata.age}y" if metadata.age else "Age unknown"
    sex_str      = metadata.sex or "Sex unknown"
    patient_str  = f"Patient: {metadata.patient_id} | {age_str} | {sex_str}"
    scan_type_str = _get_scan_type_str(metadata.scan_type)

    finding_lines = [
        f"  {i}. {f.label} — confidence {f.confidence * 100:.0f}%, "
        f"uncertainty {f.uncertainty.value if hasattr(f.uncertainty, 'value') else f.uncertainty}"
        for i, f in enumerate(findings, 1)
    ] or ["  No significant findings detected."]

    modality_context = CT_CONTEXT.get(scan_type_str, "")

    return (
        f"Generate a radiology report draft for the following:\n\n"
        f"Scan Type: {scan_type_str}\n"
        f"Date: {date_str}\n"
        f"{patient_str}\n"
        f"{modality_context}\n"
        f"AI-Detected Findings (ranked by confidence):\n"
        f"{chr(10).join(finding_lines)}\n\n"
        f"Return ONLY the JSON object as described."
    )


# ─── Gemini API Call ──────────────────────────────────────────────────────────

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
        user_prompt   = _build_user_prompt(findings, metadata, scan_date)
        scan_type_str = _get_scan_type_str(metadata.scan_type)

        logger.info(
            f"Calling Gemini for {scan_type_str} report. "
            f"Model: {settings.gemini_model}"
        )

        response = model.generate_content(
            user_prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=1000,
                response_mime_type="application/json",
            ),
        )

        raw   = response.text.strip()
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
        logger.error("Gemini rate limit — using fallback")
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
    return bool(
        s.gemini_api_key and
        s.gemini_api_key != "your-gemini-key-here"
    )


# ─── Rule-Based Fallback ──────────────────────────────────────────────────────

TECHNIQUE_MAP = {
    "Chest X-ray":   "Posteroanterior (PA) chest radiograph in standard inspiration.",
    "Chest CT":      "CT of the chest performed with standard protocol. "
                     "Axial images reviewed with lung and mediastinal windows.",
    "Abdomen CT":    "CT of the abdomen and pelvis performed with standard protocol. "
                     "Axial, coronal and sagittal reconstructions reviewed.",
    "Brain CT":      "Non-contrast CT of the brain performed with standard protocol. "
                     "Axial images reviewed on brain and bone windows.",
    "Full Body CT":  "CT of chest, abdomen and pelvis performed with standard protocol.",
    "Brain MRI":     "MRI of the brain performed with standard sequences including "
                     "T1, T2, FLAIR and DWI.",
    "Spine MRI":     "MRI of the spine performed with T1 and T2 weighted sequences "
                     "in sagittal and axial planes.",
}

INDICATION_MAP = {
    "Chest X-ray":   "Chest radiograph for evaluation of cardiopulmonary pathology.",
    "Chest CT":      "CT chest for detailed evaluation of pulmonary and mediastinal structures.",
    "Abdomen CT":    "CT abdomen/pelvis for evaluation of abdominal pathology.",
    "Brain CT":      "CT brain for evaluation of intracranial pathology.",
    "Full Body CT":  "Full body CT for comprehensive evaluation.",
    "Brain MRI":     "MRI brain for detailed evaluation of intracranial structures.",
    "Spine MRI":     "MRI spine for evaluation of spinal pathology.",
}


def _fallback_report(
    findings: list[Finding],
    metadata: PatientMetadata,
) -> ReportDraft:
    scan = _get_scan_type_str(metadata.scan_type)

    if findings:
        summary   = "; ".join(
            f"{f.label} ({f.confidence * 100:.0f}%, "
            f"{f.uncertainty.value if hasattr(f.uncertainty, 'value') else f.uncertainty} uncertainty)"
            for f in findings
        ) + "."
        top_label = findings[0].label
        top_conf  = f"{findings[0].confidence * 100:.0f}%"
    else:
        summary   = "No significant abnormalities detected."
        top_label = "No significant finding"
        top_conf  = "N/A"

    return ReportDraft(
        indication     = INDICATION_MAP.get(scan,
            f"Clinical evaluation using {scan}."),
        technique      = TECHNIQUE_MAP.get(scan,
            "Standard imaging protocol applied."),
        findings       = (
            f"AI analysis detected: {summary} "
            f"Full radiologist review required to confirm these findings."
        ),
        impression     = (
            f"AI identified {top_label} as primary finding "
            f"(confidence: {top_conf}). "
            f"Clinical correlation and formal radiologist interpretation recommended."
        ),
        recommendation = (
            "Formal radiologist review required before clinical decisions. "
            "If findings confirmed, appropriate follow-up imaging or "
            "specialist referral should be arranged."
        ),
        generated_by   = "Rule-based template (Gemini unavailable)",
    )