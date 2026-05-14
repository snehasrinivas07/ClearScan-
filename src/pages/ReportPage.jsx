import { FileText } from 'lucide-react';
import PagePlaceholder from '../components/PagePlaceholder';

export default function ReportPage() {
  return (
    <PagePlaceholder
      icon={FileText}
      title="Radiology Report"
      subtitle="AI-generated structured report — Clinical Indication, Technique, Findings, Impression, and Recommendation sections with edit-and-export workflow."
      accent="accent"
    />
  );
}