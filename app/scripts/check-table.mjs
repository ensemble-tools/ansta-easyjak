import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { normalize } from '../src/lib/normalize.js';
import {
  DEFAULT_TABLE_FILTERS,
  getFilteredTableSongs,
  getDurationSec,
  getPageItems,
  getPaginationItems,
} from '../src/lib/tableSongs.js';
import { extractYoutubeId, getSongThumbnail, getYoutubeThumbnail } from '../src/lib/thumbnails.js';
import { UNIT_FILTER_GROUPS } from '../src/lib/unitCatalog.js';

const generatedUrl = pathToFileURL(resolve(process.cwd(), 'src/data/songs.generated.js'));
generatedUrl.search = `?t=${Date.now()}`;
const { SONGS } = await import(generatedUrl.href);

const UNIT_KO_MAP = {
  트릭스타: 'Trickstar',
  피네: 'fine',
  알칼로이드: 'ALKALOID',
  에덴: 'Eden',
  발키리: 'Valkyrie',
  크레이지비: 'Crazy:B',
  크비: 'Crazy:B',
  트윙크: '2wink',
  아담: 'Adam',
  이브: 'Eve',
  언데드: 'UNDEAD',
  라비츠: 'Ra*bits',
  멜로우디어어스: 'MDU',
  멜로디: 'MDU',
  멜디: 'MDU',
  나이츠: 'Knights',
  스위치: 'Switch',
  마무: 'MaM',
  맘: 'MaM',
  덥페: 'DF',
  더블페이스: 'DF',
  doubleface: 'DF',
  에스프리: 'S-Pri',
  진앤아: 'J&A',
};

const LEGACY_UNIT_FILTER_GROUPS = [
  [
    { label: 'fine', units: ['fine'] },
    { label: 'Trickstar', units: ['Trickstar'] },
    { label: '유성대', units: ['유성대'] },
    { label: 'ALKALOID', units: ['ALKALOID'] },
  ],
  [
    { label: 'Eden', units: ['Eden'] },
    { label: 'Valkyrie', units: ['Valkyrie'] },
    { label: 'Crazy:B', units: ['Crazy:B'] },
    { label: '2wink', units: ['2wink'] },
    { label: 'Adam·Eve', units: ['Adam', 'Eve'] },
  ],
  [
    { label: 'UNDEAD', units: ['UNDEAD'] },
    { label: 'Ra*bits', units: ['Ra*bits'] },
    { label: '홍월', units: ['홍월'] },
    { label: 'MDU', units: ['MDU'] },
  ],
  [
    { label: 'Knights', units: ['Knights'] },
    { label: 'Switch', units: ['Switch'] },
    { label: 'MaM·DF', units: ['MaM', 'DF'] },
    { label: 'S-Pri', units: ['S-Pri'] },
  ],
  [
    { label: '주년·새해·만우절', units: ['주년', '만우절', '새해'] },
    { label: '셔플', units: ['셔플', '셔플_10주년'] },
    { label: '콜라보·J&A', units: ['콜라보', 'J&A'] },
    { label: '추억·기타', units: ['추억', '기타'] },
  ],
];

function legacyClearValue(song) {
  return song.measured !== null ? song.measured : song.predicted;
}

function legacyMatches(song, filters) {
  const durationSec = getDurationSec(song);
  if (filters.type !== null && song.type !== filters.type) return false;
  if (filters.units.length > 0 && !song.units.some((unit) => filters.units.includes(unit))) return false;
  if (filters.duration === 'short' && durationSec > 140) return false;
  if (filters.duration === 'mid1' && (durationSec < 141 || durationSec > 150)) return false;
  if (filters.duration === 'mid2' && (durationSec < 151 || durationSec > 160)) return false;
  if (filters.duration === 'long' && durationSec < 161) return false;
  if (filters.clear === 'yes' && song.measured === null) return false;
  if (filters.clear === 'no' && song.measured !== null) return false;

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

function legacyFiltered(filters) {
  const list = SONGS.filter((song) => legacyMatches(song, filters));
  if (filters.sortKey) {
    return list.sort((a, b) => {
      const left = filters.sortKey === 'predicted' ? legacyClearValue(a) : a[filters.sortKey];
      const right = filters.sortKey === 'predicted' ? legacyClearValue(b) : b[filters.sortKey];
      const safeLeft = filters.sortKey === 'durationSec' ? getDurationSec(a) : left;
      const safeRight = filters.sortKey === 'durationSec' ? getDurationSec(b) : right;
      if (safeLeft === null || safeLeft === undefined) return 1;
      if (safeRight === null || safeRight === undefined) return -1;
      if (typeof safeLeft === 'string') return safeLeft.localeCompare(safeRight) * filters.sortDir;
      return (safeLeft - safeRight) * filters.sortDir;
    });
  }
  if (filters.naturalDir === -1) return list.reverse();
  return list;
}

const cases = [
  DEFAULT_TABLE_FILTERS,
  { ...DEFAULT_TABLE_FILTERS, query: '기적' },
  { ...DEFAULT_TABLE_FILTERS, query: '트릭스타' },
  { ...DEFAULT_TABLE_FILTERS, query: '트릭스타', type: 'Sparkle' },
  { ...DEFAULT_TABLE_FILTERS, query: 'double face' },
  { ...DEFAULT_TABLE_FILTERS, type: 'Sparkle' },
  { ...DEFAULT_TABLE_FILTERS, duration: 'short' },
  { ...DEFAULT_TABLE_FILTERS, duration: 'mid1' },
  { ...DEFAULT_TABLE_FILTERS, duration: 'mid2' },
  { ...DEFAULT_TABLE_FILTERS, duration: 'long' },
  { ...DEFAULT_TABLE_FILTERS, clear: 'yes' },
  { ...DEFAULT_TABLE_FILTERS, clear: 'no' },
  { ...DEFAULT_TABLE_FILTERS, mode: 'unit', query: 'ignored text', units: ['Valkyrie'] },
  { ...DEFAULT_TABLE_FILTERS, mode: 'unit', units: ['Adam', 'Eve'] },
  { ...DEFAULT_TABLE_FILTERS, mode: 'unit', units: ['셔플', '셔플_10주년'], sortKey: 'type', sortDir: 1 },
  { ...DEFAULT_TABLE_FILTERS, sortKey: 'unit', sortDir: 1 },
  { ...DEFAULT_TABLE_FILTERS, sortKey: 'predicted', sortDir: 1 },
  { ...DEFAULT_TABLE_FILTERS, sortKey: 'durationSec', sortDir: -1 },
  { ...DEFAULT_TABLE_FILTERS, query: 'love', naturalDir: -1 },
  { ...DEFAULT_TABLE_FILTERS, naturalDir: -1 },
];

for (const filters of cases) {
  assert.deepEqual(
    getFilteredTableSongs(SONGS, filters),
    legacyFiltered(filters),
    `table filter mismatch for ${JSON.stringify(filters)}`,
  );
}

assert.deepEqual(UNIT_FILTER_GROUPS, LEGACY_UNIT_FILTER_GROUPS, 'unit filter groups must keep legacy order');
assert.equal(extractYoutubeId('https://youtu.be/M7WUWIYr6u4'), 'M7WUWIYr6u4');
assert.equal(extractYoutubeId('https://www.youtube.com/watch?v=M7WUWIYr6u4&t=1'), 'M7WUWIYr6u4');
assert.equal(extractYoutubeId('https://www.youtube.com/embed/M7WUWIYr6u4'), 'M7WUWIYr6u4');
assert.equal(extractYoutubeId(null), null);
assert.deepEqual(getYoutubeThumbnail('https://youtu.be/M7WUWIYr6u4'), {
  src: 'https://img.youtube.com/vi/M7WUWIYr6u4/maxresdefault.jpg',
  fallbackSrc: 'https://img.youtube.com/vi/M7WUWIYr6u4/mqdefault.jpg',
  sources: [
    'https://img.youtube.com/vi/M7WUWIYr6u4/maxresdefault.jpg',
    'https://img.youtube.com/vi/M7WUWIYr6u4/sddefault.jpg',
    'https://img.youtube.com/vi/M7WUWIYr6u4/hqdefault.jpg',
    'https://img.youtube.com/vi/M7WUWIYr6u4/mqdefault.jpg',
  ],
});
assert.equal(getSongThumbnail({ video: null }), null);

const page = getPageItems(SONGS, 2);
assert.equal(page.items.length, 20);
assert.equal(page.start, 20);
assert.equal(page.end, 40);
assert.deepEqual(getPaginationItems(1, 3), [1, 2, 3]);
assert.deepEqual(getPaginationItems(8, 12), [1, 'ellipsis-start', 6, 7, 8, 9, 10, 'ellipsis-end', 12]);

console.log(`table filters match legacy logic | checked songs=${SONGS.length}`);
