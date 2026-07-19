import { useMemo, useState } from 'react';
import messages from './data/i18n.json';
import { ResultBar } from './components/ResultBar.jsx';
import { InfoTab } from './components/InfoTab.jsx';
import { SongSearchBox } from './components/SongSearchBox.jsx';
import { SongTableTab } from './components/SongTableTab.jsx';
import { createPrediction } from './lib/prediction.js';
import { getClearValue, getDisplayTitle, getResultVideo } from './lib/songs.js';
import { extractYoutubeId, getYoutubeThumbnail } from './lib/thumbnails.js';
import { getUnitName, TYPE_COLOR } from './lib/unitCatalog.js';

const LOCALES = ['ko', 'ja', 'en'];
const LOCALE_LABELS = {
  ko: '한국어',
  ja: '日本語',
  en: 'Eng',
};
const TABS = ['predict', 'songs', 'info'];

function ResetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-2" />
    </svg>
  );
}

function PredictNoticeCard({ t }) {
  const notices = ['predictNotice.coverVideo', 'predictNotice.enSearch'];

  return (
    <section className="predict-notice-card" aria-label={t('predictNotice.label')}>
      <ul className="notice-list">
        {notices.map((key) => (
          <li key={key}>
            <span className="notice-badge badge-info">INFO</span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResultVideo({ url, label, playLabel }) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractYoutubeId(url);
  const thumbnail = getYoutubeThumbnail(url);

  if (!videoId || !thumbnail) return null;

  const startMatch = url?.match(/[?&]t=(\d+)/);
  const startParam = startMatch ? `&start=${startMatch[1]}` : '';
  const playbackParams = `autoplay=1&rel=0&modestbranding=1&playsinline=1&hd=1&vq=hd720${startParam}`;

  return (
    <div className="video-section">
      <div className="video-label">{label}</div>
      <button type="button" className="video-thumb-wrap" onClick={() => setPlaying(true)}>
        {playing
          ? (
            <iframe
              title={label}
              src={`https://www.youtube.com/embed/${videoId}?${playbackParams}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )
          : (
            <>
              <img src={thumbnail.src} alt="" loading="lazy" />
              <span className="video-play-overlay">
                <span className="video-play-circle">
                  <svg className="video-play-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </span>
              </span>
              <span className="video-yt-badge">{playLabel}</span>
            </>
          )}
      </button>
    </div>
  );
}

function getInitialLocale() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('lang');
  if (LOCALES.includes(requested)) return requested;

  const saved = window.localStorage.getItem('easyjak-react-lang');
  if (LOCALES.includes(saved)) return saved;

  const browserLang = window.navigator.language.slice(0, 2);
  return LOCALES.includes(browserLang) ? browserLang : 'ko';
}

export function App({ songData }) {
  const { songs, modelParams } = songData;
  const [locale, setLocale] = useState(getInitialLocale);
  const [form, setForm] = useState({ notesRaw: '', etStartRaw: '', etEndRaw: '' });
  const [selectedSong, setSelectedSong] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('predict');
  const t = useMemo(() => {
    const dictionary = messages[locale] ?? messages.ko;
    return (key) => dictionary[key] ?? messages.ko[key] ?? key;
  }, [locale]);

  function changeLocale(nextLocale) {
    setLocale(nextLocale);
    window.localStorage.setItem('easyjak-react-lang', nextLocale);
    document.documentElement.lang = nextLocale;

    const url = new URL(window.location.href);
    url.searchParams.set('lang', nextLocale);
    window.history.replaceState(null, '', url);
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    if (name === 'notesRaw' && selectedSong && Number(value) !== selectedSong.totalNotes) {
      setSelectedSong(null);
      setForm((current) => ({ ...current, etStartRaw: '', etEndRaw: '' }));
      setPrediction(null);
    }
    setError(null);
  }

  function resetPrediction() {
    setForm({ notesRaw: '', etStartRaw: '', etEndRaw: '' });
    setSelectedSong(null);
    setPrediction(null);
    setError(null);
  }

  function changeTab(nextTab) {
    if (nextTab === activeTab) return;
    resetPrediction();
    setActiveTab(nextTab);
  }

  function selectSong(song) {
    setSelectedSong(song);
    setForm({
      notesRaw: String(song.totalNotes),
      etStartRaw: song.etStart ? String(song.etStart) : '',
      etEndRaw: song.etEnd ? String(song.etEnd) : '',
    });
    setPrediction(null);
    setError(null);
  }

  function clearSelectedSong() {
    setSelectedSong(null);
    setForm({ notesRaw: '', etStartRaw: '', etEndRaw: '' });
    setPrediction(null);
    setError(null);
  }

  function runPrediction(event) {
    event.preventDefault();

    if (selectedSong) {
      setError(null);
      setPrediction({
        ok: true,
        source: 'song',
        song: selectedSong,
        parsed: {
          notes: selectedSong.totalNotes,
          etStart: selectedSong.etStart || null,
          etEnd: selectedSong.etEnd || null,
        },
        displayValue: getClearValue(selectedSong),
        resultVideo: getResultVideo(selectedSong),
      });
      return;
    }

    const nextPrediction = createPrediction(form, modelParams);
    if (!nextPrediction.ok) {
      setPrediction(null);
      setError(nextPrediction.error);
      return;
    }

    setError(null);
    setPrediction({
      ...nextPrediction,
      source: 'manual',
      displayValue: nextPrediction.predicted,
      resultVideo: null,
    });
  }

  const resultMode = prediction?.source === 'song' && prediction.song.measured !== null ? 'measured' : 'predicted';
  const stats = useMemo(() => ({
    total: songs.length - 1,
    measured: songs.filter((song) => song.measured !== null).length - 1,
    unmeasured: songs.filter((song) => song.measured === null).length,
  }), [songs]);
  const resultTypeColors = prediction?.song
    ? (TYPE_COLOR[prediction.song.type] ?? TYPE_COLOR.All)
    : null;

  return (
    <div className="app-shell">
      <header className="app-nav">
        <div>
          <h1>{t('app.title')}</h1>
        </div>

        <div className="language-switcher" aria-label={t('language.label')}>
          {LOCALES.map((item) => (
            <button
              key={item}
              type="button"
              className={item === locale ? 'active' : ''}
              onClick={() => changeLocale(item)}
              aria-pressed={item === locale}
            >
              {LOCALE_LABELS[item]}
            </button>
          ))}
        </div>
      </header>

      <main className="preview-panel">
        <nav className="tab-preview" aria-label={t('tabs.label')}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'active' : ''}
              onClick={() => changeTab(tab)}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </nav>

        {activeTab === 'predict' && (
        <>
        <PredictNoticeCard t={t} />

        <section className="placeholder-card predict-card">
          <div className="card-label-row">
            <div>
              <h2>{t('phase.title')}</h2>
            </div>
            <button type="button" className="reset-btn" onClick={resetPrediction} aria-label={t('actions.reset')}>
              <ResetIcon />
            </button>
          </div>

          <form className="prediction-form" onSubmit={runPrediction}>
            <div className="search-row">
              <SongSearchBox
                songs={songs}
                locale={locale}
                placeholder={t('search.placeholder')}
                selectedSong={selectedSong}
                emptyLabel={t('search.noResult')}
                onSelect={selectSong}
                onClear={clearSelectedSong}
              />
            </div>

            <label className="input-group">
              <span>{t('form.notes')} <strong>*</strong></span>
              <input
                className={error?.fields.includes('inputNotes') ? 'num-input error' : 'num-input'}
                inputMode="numeric"
                value={form.notesRaw}
                placeholder={t('form.notesPlaceholder')}
                onChange={(event) => updateField('notesRaw', event.target.value)}
              />
            </label>

            <label className="input-group et-combo-field">
              <span>{t('form.etStart')}</span>
              <input
                className={error?.fields.includes('inputETStart') ? 'num-input error' : 'num-input'}
                inputMode="numeric"
                value={form.etStartRaw}
                placeholder={t('form.optional')}
                disabled={Boolean(selectedSong)}
                onChange={(event) => updateField('etStartRaw', event.target.value)}
              />
            </label>

            <label className="input-group et-combo-field">
              <span>{t('form.etEnd')}</span>
              <input
                className={error?.fields.includes('inputETEnd') ? 'num-input error' : 'num-input'}
                inputMode="numeric"
                value={form.etEndRaw}
                placeholder={t('form.optional')}
                disabled={Boolean(selectedSong)}
                onChange={(event) => updateField('etEndRaw', event.target.value)}
              />
            </label>

            <button type="submit" className="predict-btn">{t('actions.calculate')}</button>
          </form>

          {error && <div className="predict-error visible">{t(`errors.${error.code}`)}</div>}

          {prediction?.ok && (
            <div className="result-card visible">
              <div className="result-header">
                <div>
                  <p className="result-song-title">
                    {prediction.source === 'song'
                      ? getDisplayTitle(prediction.song, locale)
                      : t('result.directInput')}
                  </p>
                  {prediction.source === 'song' ? (
                    <p className="result-song-meta">
                      <span className="type-badge" style={{ background: resultTypeColors.bg, color: resultTypeColors.color }}>
                        {prediction.song.type}
                      </span>
                      <span>{getUnitName(prediction.song.unit, locale)}</span>
                    </p>
                  ) : (
                    <p className="result-song-meta">
                      {prediction.parsed.etStart
                        ? t('result.etRange')
                          .replace('{start}', prediction.parsed.etStart)
                          .replace('{end}', prediction.parsed.etEnd)
                        : t('result.noEt')}
                    </p>
                  )}
                </div>
                <span className={`result-mode-badge ${resultMode}`}>{t(`result.${resultMode}`)}</span>
              </div>

              <div className="combo-display">
                <span className="combo-num">{prediction.displayValue}</span>
                <span className="combo-word">{t('result.combo')}</span>
                <span className="combo-unit">{t('result.comboUnit')}</span>
              </div>

              <ResultBar
                labels={{ clear: t('legend.clear'), et: t('legend.et') }}
                notes={prediction.parsed.notes}
                value={prediction.displayValue}
                etStart={prediction.parsed.etStart}
                etEnd={prediction.parsed.etEnd}
              />

              {prediction.resultVideo && (
                <ResultVideo
                  key={prediction.resultVideo}
                  url={prediction.resultVideo}
                  label={t('result.video')}
                  playLabel={t('result.videoPlay')}
                />
              )}
            </div>
          )}
        </section>

        <section className="stats-card">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-val">{stats.total}</div>
              <div className="stat-lbl">{t('stats.total')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">{stats.measured}</div>
              <div className="stat-lbl">{t('stats.measured')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">{stats.unmeasured}</div>
              <div className="stat-lbl">{t('stats.unmeasured')}</div>
            </div>
          </div>
        </section>
        </>
        )}

        {activeTab === 'songs' && <SongTableTab songs={songs} locale={locale} t={t} />}

        {activeTab === 'info' && <InfoTab locale={locale} t={t} />}
      </main>
    </div>
  );
}
