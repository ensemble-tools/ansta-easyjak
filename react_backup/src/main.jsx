import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import { loadSongData } from './lib/songDataLoader.js';
import { registerServiceWorker } from './lib/registerServiceWorker.js';
import './styles.css';

function AppBootstrap() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    let mounted = true;

    loadSongData()
      .then((data) => {
        if (mounted) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        console.error('Song data loading failed', error);
        if (mounted) setState({ status: 'error', data: null, error });
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (state.status === 'loading') {
    return null;
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
