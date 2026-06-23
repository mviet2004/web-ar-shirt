import MindARViewer from '../ar/MindARViewer';
import { defaultARTarget } from '../config/arTargets';

export default function ScanPage() {
  return (
    <main className="scan-page">
      <MindARViewer target={defaultARTarget} />
    </main>
  );
}
