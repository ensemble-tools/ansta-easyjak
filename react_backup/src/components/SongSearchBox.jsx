import { useEffect, useMemo, useRef, useState } from 'react';
import { getDisplayTitle, getSubTitle } from '../lib/songs.js';
import { searchSongsForPredict } from '../lib/searchSongs.js';
import { getUnitName, TYPE_COLOR } from '../lib/unitCatalog.js';

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

export function SongSearchBox({ songs, locale, placeholder, selectedSong, emptyLabel, onSelect, onClear }) {
  const rootRef = useRef(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const results = useMemo(() => searchSongsForPredict(query, locale, songs), [query, locale, songs]);

  useEffect(() => {
    setQuery(selectedSong ? getDisplayTitle(selectedSong, locale) : '');
  }, [locale, selectedSong]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function closeOnOutsidePointer(event) {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  function selectSong(song) {
    setQuery(getDisplayTitle(song, locale));
    setIsOpen(false);
    onSelect(song);
  }

  function clearSearch() {
    setQuery('');
    setIsOpen(false);
    onClear?.();
  }

  return (
    <div className="song-search-box" ref={rootRef}>
      <div className="song-search-input-wrap">
        <span className="song-search-icon">
          <SearchIcon />
        </span>
        <input
          className="song-search-input"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (selectedSong && !query) setQuery(getDisplayTitle(selectedSong, locale));
            setIsOpen(true);
          }}
        />
        {query && (
          <button type="button" className="song-search-clear" onClick={clearSearch} aria-label="clear search">
            ×
          </button>
        )}
      </div>

      {query && isOpen && (
        <div className="song-search-results">
          {results.length === 0 && <div className="song-search-empty">{emptyLabel}</div>}
          {results.map((song) => {
            const subtitle = getSubTitle(song, locale);
            const colors = TYPE_COLOR[song.type] ?? TYPE_COLOR.All;
            return (
              <button key={`${song.title_ja}-${song.unit}-${song.totalNotes}`} type="button" onClick={() => selectSong(song)}>
                <span className="song-search-title">{getDisplayTitle(song, locale)}</span>
                {subtitle && <span className="song-search-subtitle">{subtitle}</span>}
                <span className="song-search-meta">
                  <span>{getUnitName(song.unit, locale)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="song-search-type" style={{ background: colors.bg, color: colors.color }}>{song.type}</span>
                  <span aria-hidden="true">·</span>
                  <span>{song.totalNotes}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
