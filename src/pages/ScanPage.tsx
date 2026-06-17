import MindARViewer from '../ar/MindARViewer';
import { defaultARTarget } from '../config/arTargets';

type ScanPageProps = {
  onBack: () => void;
};

export default function ScanPage({ onBack }: ScanPageProps) {
  return (
    <main className="scan-page">
      <MindARViewer target={defaultARTarget} />
      <button className="back-button" type="button" onClick={onBack}>
        Back
      </button>
    </main>
  );
}
