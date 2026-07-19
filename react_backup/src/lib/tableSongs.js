import { normalize } from './normalize.js';
import { getClearValue } from './songs.js';
import { UNIT_KO_MAP } from './unitCatalog.js';

export const PAGE_SIZE = 20;

export const DEFAULT_TABLE_SEARCH = {
  mode: 'song',
  query: '',
};

export const DEFAULT_TABLE_FILTER_STATE = {
  type: null,
  duration: 'all',
  clear: 'all',
  units: [],
};

export const DEFAULT_TABLE_SORT = {
  sortKey: null,
  sortDir: 1,
  naturalDir: 1,
};

export const DEFAULT_TABLE_FILTERS = {
  ...DEFAULT_TABLE_SEARCH,
  ...DEFAULT_TABLE_FILTER_STATE,
  ...DEFAULT_TABLE_SORT,
  page: 1,
};

function matchesDuration(song, duration) {
  const durationSec = getDurationSec(song);
  if (duration === 'short') return durationSec <= 140;
  if (duration === 'mid1') return durationSec >= 141 && durationSec <= 150;
  if (duration === 'mid2') return durationSec >= 151 && durationSec <= 160;
  if (duration === 'long') return durationSec >= 161;
  return true;
}

export function getDurationSec(song) {
  if (Number.isFinite(song.durationSec)) return song.durationSec;
  const parts = String(song.duration ?? '').split(':');
  if (parts.length !== 2) return 0;
  return Number.parseInt(parts[0], 10) * 60 + Number.parseInt(parts[1], 10);
}

export function songMatchesTableFilters(song, filters) {
  if (filters.type !== null && song.type !== filters.type) return false;
  if (!matchesDuration(song, filters.duration)) return false;
  if (filters.clear === 'yes' && song.measured === null) return false;
  if (filters.clear === 'no' && song.measured !== null) return false;

  const activeUnits = new Set(filters.units ?? []);
  if (activeUnits.size > 0 && !song.units.some((unit) => activeUnits.has(unit))) {
    return false;
  }

  const query = filters.mode === 'song' ? normalize(filters.query) : '';
  if (!query) return true;

  return (
    normalize(song.title_ja).includes(query) ||
    (song.title_ja_reading && normalize(song.title_ja_reading).includes(query)) ||
    (song.title_ko && normalize(song.title_ko).includes(query)) ||
    (song.title_ko_reading && normalize(song.title_ko_reading).includes(query)) ||
    song.units.some((unit) => normalize(unit).includes(query)) ||
    Object.entries(UNIT_KO_MAP).some(([ko, unit]) => ko.includes(query) && song.units.includes(unit))
  );
}

export function getTableSortValue(song, key) {
  if (key === 'durationSec') return getDurationSec(song);
  return key === 'predicted' ? getClearValue(song) : song[key];
}

export function getFilteredTableSongs(songs, filters) {
  const list = songs.filter((song) => songMatchesTableFilters(song, filters));

  if (filters.sortKey) {
    return list.sort((a, b) => {
      const left = getTableSortValue(a, filters.sortKey);
      const right = getTableSortValue(b, filters.sortKey);
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;
      if (typeof left === 'string') return left.localeCompare(right) * filters.sortDir;
      return (left - right) * filters.sortDir;
    });
  }

  if (filters.naturalDir === -1) return list.reverse();
  return list;
}

export function getPageItems(list, page, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    start,
    end: Math.min(start + pageSize, list.length),
    items: list.slice(start, start + pageSize),
  };
}

export function getPaginationItems(currentPage, totalPages, maxShow = 7) {
  if (totalPages <= maxShow) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  let start = Math.max(2, currentPage - 2);
  let end = Math.min(totalPages - 1, currentPage + 2);

  if (currentPage <= 3) end = Math.min(5, totalPages - 1);
  if (currentPage >= totalPages - 2) start = Math.max(2, totalPages - 4);
  if (start > 2) pages.push('ellipsis-start');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('ellipsis-end');
  pages.push(totalPages);
  return pages;
}
