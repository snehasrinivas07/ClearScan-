/**
 * Mock data matching the backend API response shape.
 * Backend contract:
 *   POST /analyze       → { findings[], overall_risk, heatmap_base64 }
 *   POST /generate-report → SSE stream of report sections
 *   GET  /health        → { status, model_loaded, version }
 */

export const mockFindings = [
  {
    name: 'Pneumonia',
    confidence: 0.87,
    uncertainty: 0.04,
    risk_level: 'HIGH',
    anatomical_region: 'Right lower lobe',
    recommendation: 'Urgent radiologist review recommended. Consider sputum culture and CRP.',
  },
  {
    name: 'Pleural Effusion',
    confidence: 0.71,
    uncertainty: 0.09,
    risk_level: 'MEDIUM',
    anatomical_region: 'Left costophrenic angle',
    recommendation: 'Correlate with clinical symptoms. Consider lateral decubitus view.',
  },
  {
    name: 'Cardiomegaly',
    confidence: 0.52,
    uncertainty: 0.18,
    risk_level: 'LOW',
    anatomical_region: 'Cardiac silhouette',
    recommendation: 'UNCERTAIN — correlate clinically. Cardiothoracic ratio borderline.',
  },
  {
    name: 'Atelectasis',
    confidence: 0.34,
    uncertainty: 0.12,
    risk_level: 'LOW',
    anatomical_region: 'Right middle lobe',
    recommendation: 'Low probability finding. Follow-up imaging not currently indicated.',
  },
];

export const mockAnalysis = {
  findings: mockFindings,
  overall_risk: 'HIGH',
  heatmap_base64: null, // null = use simulated CSS overlay
  scan_type: 'Chest X-ray',
  analyzed_at: new Date().toISOString(),
  model_version: 'clearscan-v1.0.3',
};

export const mockReport = {
  clinical_indication: 'Adult patient presenting with productive cough, fever (38.7°C), and right-sided pleuritic chest pain for 3 days. No known prior pulmonary disease.',
  technique: 'PA and lateral chest radiographs were obtained in inspiration with adequate exposure and patient positioning.',
  findings: 'There is a focal area of airspace consolidation in the right lower lobe with associated air bronchograms, consistent with lobar pneumonia. A small left-sided pleural effusion is noted at the costophrenic angle. The cardiac silhouette is borderline enlarged with a cardiothoracic ratio of approximately 0.51. The mediastinum is unremarkable. No pneumothorax. Visualized osseous structures are intact.',
  impression: '1. Right lower lobe pneumonia, high confidence (87%).\n2. Small left pleural effusion, likely parapneumonic.\n3. Borderline cardiomegaly — clinical correlation advised.',
  recommendation: 'Initiate empirical antibiotic therapy per institutional protocol. Repeat chest radiograph in 4–6 weeks to confirm resolution. Consider echocardiography for borderline cardiac silhouette if clinically indicated.',
};

export const mockHistory = [
  {
    id: 'scan_001',
    date: '2026-01-14',
    scan_type: 'Chest X-ray',
    primary_finding: 'Pneumonia',
    risk_level: 'HIGH',
    report_status: 'Generated',
  },
  {
    id: 'scan_002',
    date: '2026-01-12',
    scan_type: 'Chest CT',
    primary_finding: 'Pleural Effusion',
    risk_level: 'MEDIUM',
    report_status: 'Generated',
  },
  {
    id: 'scan_003',
    date: '2026-01-09',
    scan_type: 'Brain MRI',
    primary_finding: 'No acute findings',
    risk_level: 'LOW',
    report_status: 'Generated',
  },
  {
    id: 'scan_004',
    date: '2026-01-07',
    scan_type: 'Chest X-ray',
    primary_finding: 'Atelectasis',
    risk_level: 'LOW',
    report_status: 'Draft',
  },
  {
    id: 'scan_005',
    date: '2026-01-04',
    scan_type: 'Chest X-ray',
    primary_finding: 'Cardiomegaly',
    risk_level: 'MEDIUM',
    report_status: 'Generated',
  },
];

/**
 * Generates a unique-ish scan ID for new uploads.
 */
export function generateScanId() {
  return `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}