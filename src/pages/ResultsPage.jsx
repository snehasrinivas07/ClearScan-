import { ScanLine } from 'lucide-react';
import PagePlaceholder from '../components/PagePlaceholder';

export default function ResultsPage() {
  return (
    <PagePlaceholder
      icon={ScanLine}
      title="Analysis Results"
      subtitle="Grad-CAM heatmap overlay, per-finding confidence scores, anatomical region attribution, and clinical recommendations."
      accent="accent"
    />
  );
}