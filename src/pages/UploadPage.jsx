import { Upload } from 'lucide-react';
import PagePlaceholder from '../components/PagePlaceholder';

export default function UploadPage() {
  return (
    <PagePlaceholder
      icon={Upload}
      title="AI Diagnostic Assistant for Medical Imaging"
      subtitle="Upload X-Ray, CT, or MRI scans to receive AI-assisted analysis with confidence-scored findings and a structured radiology report."
      accent="accent"
    />
  );
}