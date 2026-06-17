type HomePageProps = {
  onStartScan: () => void;
};

export default function HomePage({ onStartScan }: HomePageProps) {
  return (
    <main className="home-page">
      <section className="home-panel">
        <p className="eyebrow">AR shirt experience</p>
        <h1>Bring the shirt graphic to life.</h1>
        <p className="home-copy">
          Point your phone camera at the printed shirt graphic and watch the
          animation appear on top of it.
        </p>
        <button className="primary-button" type="button" onClick={onStartScan}>
          Start Scan
        </button>
      </section>
    </main>
  );
}
