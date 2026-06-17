import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';

type Route = 'home' | 'scan';

function routeFromPath(): Route {
  return window.location.pathname === '/scan' ? 'scan' : 'home';
}

export default function App() {
  const [route, setRoute] = useState<Route>(routeFromPath);

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const goToScan = () => {
    window.history.pushState(null, '', '/scan');
    setRoute('scan');
  };

  const goHome = () => {
    window.history.pushState(null, '', '/');
    setRoute('home');
  };

  return route === 'scan' ? (
    <ScanPage onBack={goHome} />
  ) : (
    <HomePage onStartScan={goToScan} />
  );
}
