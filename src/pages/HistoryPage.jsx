import { History } from 'lucide-react';
import PagePlaceholder from '../components/PagePlaceholder';

export default function HistoryPage() {
  return (
    <PagePlaceholder
      icon={History}
      title="Scan History"
      subtitle="Local archive of every scan analyzed on this device — fully offline, searchable by date, risk level, and scan type."
      accent="accent"
    />
  );
}