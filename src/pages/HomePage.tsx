import { type CSSProperties, useRef, useState } from 'react';

type HomePageProps = {
  onStartScan: () => void;
};

export default function HomePage({ onStartScan }: HomePageProps) {
  const startButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [transitionOrigin, setTransitionOrigin] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const openScanner = () => {
    if (isOpening) {
      return;
    }

    const buttonRect = startButtonRef.current?.getBoundingClientRect();

    if (buttonRect) {
      setTransitionOrigin({
        x: buttonRect.left + buttonRect.width / 2,
        y: buttonRect.top + buttonRect.height / 2,
      });
    }

    setIsOpening(true);
    window.setTimeout(onStartScan, 420);
  };

  const pageStyle = {
    '--scan-origin-x': `${transitionOrigin.x}px`,
    '--scan-origin-y': `${transitionOrigin.y}px`,
  } as CSSProperties;

  return (
    <main
      className={`home-page${isOpening ? ' home-page--opening' : ''}`}
      style={pageStyle}
    >
      <div className="scan-start-transition" aria-hidden="true" />
      <section className="home-panel">
        <p className="eyebrow">AR shirt experience</p>
        <h1>Bring the shirt graphic to life.</h1>
        <p className="home-copy">
          Point your phone camera at the printed shirt graphic and watch the
          animation appear on top of it.
        </p>
        <button
          ref={startButtonRef}
          className="primary-button"
          type="button"
          onClick={openScanner}
        >
          Start Scan
        </button>
      </section>
    </main>
  );
}
