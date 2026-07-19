import { useEffect, useMemo, useState } from 'react';
import { getClearValue, getDisplayTitle } from '../lib/songs.js';
import {
  DEFAULT_TABLE_FILTER_STATE,
  DEFAULT_TABLE_FILTERS,
  DEFAULT_TABLE_SEARCH,
  DEFAULT_TABLE_SORT,
  getFilteredTableSongs,
  getPageItems,
  getPaginationItems,
} from '../lib/tableSongs.js';
import { getSongThumbnail } from '../lib/thumbnails.js';
import { getUnitName, TYPE_COLOR, UNIT_FILTER_GROUPS } from '../lib/unitCatalog.js';

const TYPE_FILTERS = [null, 'All', 'Sparkle', 'Brilliant', 'Glitter', 'Flash'];
const DURATION_FILTERS = ['all', 'short', 'mid1', 'mid2', 'long'];
const CLEAR_FILTERS = ['all', 'yes', 'no'];
const SORT_KEYS = ['type', 'unit', 'totalNotes', 'durationSec', 'predicted'];
const DESKTOP_THUMBNAIL_SIZE = 294;
const DESKTOP_THUMBNAIL_GAP = 18;
const DESKTOP_THUMBNAIL_MARGIN = 8;

function getSongKey(song) {
  return `${song.title_ja}-${song.unit}-${song.totalNotes}`;
}

function getTypeStyle(type, active) {
  const chipColors = {
    null: { bg: '#f1f5f9', color: '#1e3a6e' },
    All: { bg: '#f0fdf4', color: '#166534' },
    Flash: TYPE_COLOR.Flash,
    Brilliant: TYPE_COLOR.Brilliant,
    Glitter: TYPE_COLOR.Glitter,
    Sparkle: TYPE_COLOR.Sparkle,
  };
  const colors = type === null ? chipColors.null : chipColors[type] ?? TYPE_COLOR.All;
  return {
    background: colors.bg,
    color: colors.color,
    borderColor: active ? colors.color : 'transparent',
  };
}

function ToggleButton({ active, children, onClick }) {
  return (
    <button type="button" className={active ? 'filter-chip active' : 'filter-chip'} onClick={onClick}>
      {children}
    </button>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function NaturalSortIcon({ direction }) {
  const arrowPath = direction === 1
    ? 'M17 4v13M13 13l4 4 4-4'
    : 'M17 20V7M13 11l4-4 4 4';

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h7" />
      <path d="M4 12h6" />
      <path d="M4 17h5" />
      <path d={arrowPath} />
    </svg>
  );
}

function ThumbnailImage({ song }) {
  const thumbnail = getSongThumbnail(song);
  const sources = thumbnail?.sources ?? (thumbnail?.src ? [thumbnail.src, thumbnail.fallbackSrc].filter(Boolean) : []);
  const [sourceIndex, setSourceIndex] = useState(0);
  const src = sources[sourceIndex] ?? null;

  useEffect(() => {
    setSourceIndex(0);
  }, [thumbnail?.src]);

  if (!thumbnail || !src) {
    return null;
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => {
        setSourceIndex((current) => (
          current + 1 < sources.length ? current + 1 : sources.length
        ));
      }}
    />
  );
}

function DesktopThumbnailPreview({ preview }) {
  if (!preview) return null;

  return (
    <div
      className="desktop-thumb-preview"
      style={{ left: preview.left, top: preview.top }}
      aria-hidden="true"
    >
      <ThumbnailImage song={preview.song} />
    </div>
  );
}

function MobileSongCard({ song, locale, t, activeThumbnailKey, onTitleTap }) {
  const colors = TYPE_COLOR[song.type] ?? TYPE_COLOR.All;
  const clearValue = getClearValue(song);
  const songKey = getSongKey(song);
  const hasMeasuredVideo = song.measured !== null && song.video;
  const thumbnailOpen = activeThumbnailKey === songKey;

  return (
    <article className="mobile-song-card">
      <div className="mobile-song-top">
        <div className="mobile-song-meta">
          <span className="type-badge" style={{ background: colors.bg, color: colors.color }}>{song.type}</span>
          <span className="mobile-song-unit">{getUnitName(song.unit, locale)}</span>
        </div>
        {hasMeasuredVideo
          ? (
            <a
              className="mobile-video-link"
              href={song.video}
              target="_blank"
              rel="noreferrer"
              title={t('table.openVideo')}
              aria-label={t('table.openVideo')}
            >
              <ExternalLinkIcon />
            </a>
          )
          : <span className="mobile-no-video">-</span>}
      </div>

      <button
        type="button"
        className={thumbnailOpen ? 'mobile-song-title open' : 'mobile-song-title'}
        onClick={() => onTitleTap(songKey)}
        aria-expanded={thumbnailOpen}
      >
        <span className="song-title-text">{getDisplayTitle(song, locale)}</span>
      </button>

      <div className="mobile-song-stats">
        <div>
          <span>{t('col.totalNotes')}</span>
          <strong>{song.totalNotes}</strong>
        </div>
        <div>
          <span>{t('col.predicted')}</span>
          <strong>
            <span className={song.measured !== null ? 'clear-dot measured' : 'clear-dot'} />
            {clearValue}
          </strong>
        </div>
        <div>
          <span>{t('col.durationSec')}</span>
          <strong>{song.duration || '-'}</strong>
        </div>
      </div>
    </article>
  );
}

export function SongTableTab({ songs, locale, t }) {
  const [searchState, setSearchState] = useState(DEFAULT_TABLE_SEARCH);
  const [filterState, setFilterState] = useState(DEFAULT_TABLE_FILTER_STATE);
  const [sortState, setSortState] = useState(DEFAULT_TABLE_SORT);
  const [activeThumbnailKey, setActiveThumbnailKey] = useState(null);
  const [hoverThumbnail, setHoverThumbnail] = useState(null);
  const [page, setPage] = useState(DEFAULT_TABLE_FILTERS.page);
  const tableState = useMemo(
    () => ({
      ...DEFAULT_TABLE_FILTERS,
      ...searchState,
      ...filterState,
      ...sortState,
      page,
    }),
    [filterState, page, searchState, sortState],
  );
  const filteredSongs = useMemo(() => getFilteredTableSongs(songs, tableState), [songs, tableState]);
  const pageData = useMemo(
    () => getPageItems(filteredSongs, page),
    [filteredSongs, page],
  );
  const activeThumbnailSong = useMemo(
    () => pageData.items.find((song) => getSongKey(song) === activeThumbnailKey) ?? null,
    [activeThumbnailKey, pageData.items],
  );
  const paginationItems = useMemo(
    () => getPaginationItems(pageData.page, pageData.totalPages),
    [pageData.page, pageData.totalPages],
  );
  const hasSidebarFilter =
    filterState.type !== null ||
    filterState.duration !== 'all' ||
    filterState.clear !== 'all';

  function patchSearchState(patch) {
    setSearchState((current) => ({ ...current, ...patch }));
    setHoverThumbnail(null);
    setActiveThumbnailKey(null);
    setPage(1);
  }

  function patchFilterState(patch) {
    setFilterState((current) => ({ ...current, ...patch }));
    setHoverThumbnail(null);
    setActiveThumbnailKey(null);
    setPage(1);
  }

  function setTablePage(nextPage) {
    setHoverThumbnail(null);
    setActiveThumbnailKey(null);
    setPage(nextPage);
  }

  function selectType(type) {
    patchFilterState({ type: filterState.type === type ? null : type });
  }

  function toggleUnit(units) {
    const next = new Set(filterState.units);
    const enabled = units.every((unit) => next.has(unit));
    units.forEach((unit) => {
      if (enabled) next.delete(unit);
      else next.add(unit);
    });
    patchFilterState({ units: Array.from(next) });
  }

  function setSearchMode(mode) {
    if (mode === 'unit') {
      patchSearchState({ mode, query: '' });
    } else {
      patchSearchState({ mode });
      patchFilterState({ units: [] });
    }
  }

  function sortBy(key) {
    setSortState((current) => ({
      ...current,
      sortKey: current.sortKey === key ? key : key,
      sortDir: current.sortKey === key ? current.sortDir * -1 : 1,
      naturalDir: 1,
    }));
    setHoverThumbnail(null);
    setActiveThumbnailKey(null);
    setPage(1);
  }

  function toggleNaturalSort() {
    setSortState((current) => ({
      ...current,
      sortKey: null,
      sortDir: 1,
      naturalDir: current.naturalDir * -1,
    }));
    setHoverThumbnail(null);
    setActiveThumbnailKey(null);
    setPage(1);
  }

  function sortByDuration(direction) {
    setSortState((current) => {
      if (current.sortKey === 'durationSec' && current.sortDir === direction) {
        return DEFAULT_TABLE_SORT;
      }

      return {
        ...current,
        sortKey: 'durationSec',
        sortDir: direction,
        naturalDir: 1,
      };
    });
    setHoverThumbnail(null);
    setActiveThumbnailKey(null);
    setPage(1);
  }

  function resetSidebarFilters() {
    patchFilterState({ type: null, duration: 'all', clear: 'all' });
    setPage(1);
  }

  function resetUnitFilters() {
    patchFilterState({ units: [] });
  }

  function getSortMark(key) {
    if (sortState.sortKey !== key) return '↕';
    return sortState.sortDir === 1 ? '↑' : '↓';
  }

  function toggleMobileThumbnail(songKey) {
    setActiveThumbnailKey((current) => (current === songKey ? null : songKey));
  }

  function getDesktopThumbnailPosition(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxLeft = Math.max(DESKTOP_THUMBNAIL_MARGIN, viewportWidth - DESKTOP_THUMBNAIL_MARGIN - DESKTOP_THUMBNAIL_SIZE);
    const maxTop = Math.max(DESKTOP_THUMBNAIL_MARGIN, viewportHeight - DESKTOP_THUMBNAIL_MARGIN - DESKTOP_THUMBNAIL_SIZE);
    const hasPointerPosition = event.type !== 'focus' && Number.isFinite(event.clientX) && Number.isFinite(event.clientY);

    if (hasPointerPosition) {
      const preferredLeft = event.clientX + DESKTOP_THUMBNAIL_GAP;
      const rawLeft = preferredLeft + DESKTOP_THUMBNAIL_SIZE <= viewportWidth - DESKTOP_THUMBNAIL_MARGIN
        ? preferredLeft
        : event.clientX - DESKTOP_THUMBNAIL_GAP - DESKTOP_THUMBNAIL_SIZE;

      return {
        left: Math.min(Math.max(rawLeft, DESKTOP_THUMBNAIL_MARGIN), maxLeft),
        top: Math.min(Math.max(event.clientY - 80, DESKTOP_THUMBNAIL_MARGIN), maxTop),
      };
    }

    const fitsRight = rect.right + DESKTOP_THUMBNAIL_GAP + DESKTOP_THUMBNAIL_SIZE <= viewportWidth - DESKTOP_THUMBNAIL_MARGIN;
    const rawLeft = fitsRight
      ? rect.right + DESKTOP_THUMBNAIL_GAP
      : rect.left - DESKTOP_THUMBNAIL_GAP - DESKTOP_THUMBNAIL_SIZE;
    const top = Math.min(
      Math.max(rect.top + rect.height / 2 - DESKTOP_THUMBNAIL_SIZE / 2, DESKTOP_THUMBNAIL_MARGIN),
      maxTop,
    );

    return {
      left: Math.min(Math.max(rawLeft, DESKTOP_THUMBNAIL_MARGIN), maxLeft),
      top,
    };
  }

  function showDesktopThumbnail(song, event) {
    if (!getSongThumbnail(song)) {
      setHoverThumbnail(null);
      return;
    }

    setHoverThumbnail({ song, ...getDesktopThumbnailPosition(event) });
  }

  useEffect(() => {
    if (!activeThumbnailKey) return undefined;

    function closeThumbnailOnOutsideTouch(event) {
      if (event.target.closest('.mobile-song-title')) return;
      setActiveThumbnailKey(null);
    }

    document.addEventListener('pointerdown', closeThumbnailOnOutsideTouch);
    return () => {
      document.removeEventListener('pointerdown', closeThumbnailOnOutsideTouch);
    };
  }, [activeThumbnailKey]);

  return (
    <section className="songs-layout" aria-label={t('tabs.songs')}>
      <aside className="songs-sidebar">
        <div className="sidebar-section sidebar-hint">{t('sidebar.unitHint')}</div>

        <div className="sidebar-section">
          <div className="sidebar-title">{t('sidebar.typeTitle')}</div>
          <div className="type-chips">
            {TYPE_FILTERS.map((type) => {
              const active = filterState.type === type;
              return (
                <button
                  key={type ?? 'all-types'}
                  type="button"
                  className={active ? 'type-chip active' : 'type-chip'}
                  style={getTypeStyle(type, active)}
                  onClick={() => selectType(type)}
                >
                  {type ?? t('type.all')}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">{t('sidebar.durationTitle')}</div>
          <div className="filter-chip-grid">
            {DURATION_FILTERS.map((duration) => (
              <ToggleButton
                key={duration}
                active={filterState.duration === duration}
                onClick={() => patchFilterState({ duration })}
              >
                {t(`duration.${duration}`)}
              </ToggleButton>
            ))}
          </div>
          <div className="duration-sort-row">
            <ToggleButton
              active={sortState.sortKey === 'durationSec' && sortState.sortDir === 1}
              onClick={() => sortByDuration(1)}
            >
              {t('duration.sortShort')}
            </ToggleButton>
            <ToggleButton
              active={sortState.sortKey === 'durationSec' && sortState.sortDir === -1}
              onClick={() => sortByDuration(-1)}
            >
              {t('duration.sortLong')}
            </ToggleButton>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">{t('sidebar.clearTitle')}</div>
          <div className="filter-chip-grid">
            {CLEAR_FILTERS.map((clear) => (
              <ToggleButton key={clear} active={filterState.clear === clear} onClick={() => patchFilterState({ clear })}>
                {t(`clear.${clear}`)}
              </ToggleButton>
            ))}
          </div>
        </div>

        {hasSidebarFilter && (
          <button type="button" className="unit-reset-btn" onClick={resetSidebarFilters}>
            {t('filters.reset')}
          </button>
        )}
      </aside>

      <div className="table-panel">
        <div className="table-search-bar">
          <div className="table-search-top">
            <select
              className="search-mode-select"
              value={searchState.mode}
              onChange={(event) => setSearchMode(event.target.value)}
            >
              <option value="song">{t('searchMode.song')}</option>
              <option value="unit">{t('searchMode.unit')}</option>
            </select>

            {searchState.mode === 'song' && (
              <div className="table-search-wrap">
                <input
                  className="table-search-input"
                  type="text"
                  value={searchState.query}
                  placeholder={t('table.searchPlaceholder')}
                  onChange={(event) => patchSearchState({ query: event.target.value })}
                />
                {searchState.query && (
                  <button type="button" className="table-clear-btn" onClick={() => patchSearchState({ query: '' })}>
                    ×
                  </button>
                )}
              </div>
            )}

            <button type="button" className="natural-sort-btn" onClick={toggleNaturalSort} title={t('sort.natural')}>
              <NaturalSortIcon direction={sortState.naturalDir} />
            </button>
          </div>

          {searchState.mode === 'unit' && (
            <div className="unit-filter-panel">
              <div className="unit-filter-inner">
                {UNIT_FILTER_GROUPS.map((group, index) => (
                  <div className="unit-filter-line" key={`group-${index}`}>
                    {group.map((item) => {
                      const active = item.units.every((unit) => filterState.units.includes(unit));
                      return (
                        <label key={item.label} className="unit-filter-item">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleUnit(item.units)}
                          />
                          <span>{getUnitName(item.label, locale)}</span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
              {filterState.units.length > 0 && (
                <button type="button" className="unit-reset-btn" onClick={resetUnitFilters}>
                  {t('filters.reset')}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="songs-table-wrap">
          <table className="songs-table">
            <thead>
              <tr>
                {SORT_KEYS.slice(0, 2).map((key) => (
                  <th key={key}>
                    <button type="button" onClick={() => sortBy(key)}>
                      {t(`col.${key}`)} <span>{getSortMark(key)}</span>
                    </button>
                  </th>
                ))}
                <th>{t('col.title')}</th>
                {SORT_KEYS.slice(2).map((key) => (
                  <th key={key}>
                    <button type="button" onClick={() => sortBy(key)}>
                      {t(`col.${key}`)} <span>{getSortMark(key)}</span>
                    </button>
                  </th>
                ))}
                <th>{t('col.video')}</th>
              </tr>
            </thead>
            <tbody>
              {pageData.items.length === 0 && (
                <tr>
                  <td colSpan="7" className="table-empty">{t('table.empty')}</td>
                </tr>
              )}

              {pageData.items.map((song) => {
                const colors = TYPE_COLOR[song.type] ?? TYPE_COLOR.All;
                const clearValue = getClearValue(song);
                const hasMeasuredVideo = song.measured !== null && song.video;
                return (
                  <tr key={getSongKey(song)}>
                    <td className="col-type" data-label={t('col.type')}>
                      <span className="type-badge" style={{ background: colors.bg, color: colors.color }}>{song.type}</span>
                    </td>
                    <td className="col-unit" data-label={t('col.unit')}>{getUnitName(song.unit, locale)}</td>
                    <td
                      className="col-title"
                      data-label={t('col.title')}
                      onMouseEnter={(event) => showDesktopThumbnail(song, event)}
                      onMouseMove={(event) => showDesktopThumbnail(song, event)}
                      onMouseLeave={() => setHoverThumbnail(null)}
                      onFocus={(event) => showDesktopThumbnail(song, event)}
                      onBlur={() => setHoverThumbnail(null)}
                    >
                      <span className="song-title-inner">
                        <span className="song-title-text">{getDisplayTitle(song, locale)}</span>
                      </span>
                    </td>
                    <td className="col-num" data-label={t('col.totalNotes')}>{song.totalNotes}</td>
                    <td className="col-dur" data-label={t('col.durationSec')}>{song.duration || '-'}</td>
                    <td className="col-num col-clear" data-label={t('col.predicted')}>
                      <span className={song.measured !== null ? 'clear-dot measured' : 'clear-dot'} />
                      {clearValue}
                    </td>
                    <td className="col-video" data-label={t('col.video')}>
                      {hasMeasuredVideo
                        ? (
                          <a
                            href={song.video}
                            target="_blank"
                            rel="noreferrer"
                            title={t('table.openVideo')}
                            aria-label={t('table.openVideo')}
                          >
                            <ExternalLinkIcon />
                          </a>
                        )
                        : <span>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mobile-song-list">
          {pageData.items.length === 0 && (
            <div className="mobile-table-empty">{t('table.empty')}</div>
          )}
          {pageData.items.map((song) => (
            <MobileSongCard
              key={getSongKey(song)}
              song={song}
              locale={locale}
              t={t}
              activeThumbnailKey={activeThumbnailKey}
              onTitleTap={toggleMobileThumbnail}
            />
          ))}
        </div>

        {filteredSongs.length > 0 && (
          <div className="table-footer">
            <span>{pageData.start + 1}-{pageData.end} / {filteredSongs.length}</span>
            {pageData.totalPages > 1 && (
              <div className="paging-bar">
                <button type="button" disabled={pageData.page === 1} onClick={() => setTablePage(pageData.page - 1)}>
                  ‹
                </button>
                {paginationItems.map((item) => (
                  typeof item === 'number'
                    ? (
                      <button
                        key={item}
                        type="button"
                        className={item === pageData.page ? 'active' : ''}
                        onClick={() => setTablePage(item)}
                      >
                        {item}
                      </button>
                    )
                    : <span key={item}>…</span>
                ))}
                <button
                  type="button"
                  disabled={pageData.page === pageData.totalPages}
                  onClick={() => setTablePage(pageData.page + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}

        {activeThumbnailSong && (
          <div
            className="mobile-thumb-backdrop"
            role="dialog"
            aria-modal="true"
            onPointerDown={() => setActiveThumbnailKey(null)}
          >
            <div className="mobile-thumb-modal" onPointerDown={(event) => event.stopPropagation()}>
              <ThumbnailImage song={activeThumbnailSong} />
            </div>
          </div>
        )}
        <DesktopThumbnailPreview preview={hoverThumbnail} />
      </div>
    </section>
  );
}
