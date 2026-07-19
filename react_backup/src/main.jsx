import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import { loadSongData } from './lib/songDataLoader.js';
import { registerServiceWorker } from './lib/registerServiceWorker.js';
import './styles.css';

const LOADING_MESSAGE_DELAY_MS = 300;

function AppBootstrap() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadingMessageTimer = window.setTimeout(() => {
      if (mounted) setShowLoadingMessage(true);
    }, LOADING_MESSAGE_DELAY_MS);

    loadSongData()
      .then((data) => {
        window.clearTimeout(loadingMessageTimer);
        if (mounted) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        window.clearTimeout(loadingMessageTimer);
        console.error('Song data loading failed', error);
        if (mounted) setState({ status: 'error', data: null, error });
      });

    return () => {
      mounted = false;
      window.clearTimeout(loadingMessageTimer);
    };
  }, []);

  if (state.status === 'loading') {
    if (!showLoadingMessage) return null;

    return (
      <div className="app-shell">
        <main className="preview-panel app-state-panel" aria-live="polite">
          <section className="placeholder-card">
            <h1>데이터 불러오는 중</h1>
          </section>
        </main>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="app-shell">
        <main className="preview-panel app-state-panel" role="alert">
          <section className="placeholder-card">
            <h1>데이터를 불러오지 못했습니다</h1>
            <p>잠시 후 다시 시도해 주세요.</p>
          </section>
        </main>
      </div>
    );
  }

  return <App songData={state.data} />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppBootstrap />
  </React.StrictMode>,
);

registerServiceWorker();
