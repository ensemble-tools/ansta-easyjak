import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { normalize } from '../src/lib/normalize.js';
import { searchSongsForPredict } from '../src/lib/searchSongs.js';

const generatedUrl = pathToFileURL(resolve(process.cwd(), 'src/data/songs.generated.js'));
generatedUrl.search = `?t=${Date.now()}`;
const { SONGS } = await import(generatedUrl.href);

function legacyPredictSearch(query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  return SONGS.filter((song) => (
    normalize(song.title_ja).includes(normalizedQuery) ||
    (song.title_ja_reading && normalize(song.title_ja_reading).includes(normalizedQuery)) ||
    (song.title_ko && normalize(song.title_ko).includes(normalizedQuery)) ||
    (song.title_ko_reading && normalize(song.title_ko_reading).includes(normalizedQuery))
  )).slice(0, 12);
}

for (const query of ['キセキ', '기적', 'ONLY', '온리', '트릭스타', '']) {
  assert.deepEqual(
    searchSongsForPredict(query, 'ko', SONGS),
    legacyPredictSearch(query),
    `ko search mismatch for "${query}"`,
  );
  assert.deepEqual(
    searchSongsForPredict(query, 'ja', SONGS),
    legacyPredictSearch(query),
    `ja search mismatch for "${query}"`,
  );
}

const miracleEnResults = searchSongsForPredict('miracle', 'en', SONGS);
assert.ok(miracleEnResults.length <= 12, 'en search should cap at 12 results');
assert.ok(
  miracleEnResults.some((song) => song.title_en === 'Miracle'),
  'en search should include title_en match for Miracle',
);

const miracleLegacyResults = legacyPredictSearch('miracle');
assert.equal(
  miracleLegacyResults.some((song) => song.title_en === 'Miracle'),
  false,
  'legacy ko/ja search should not match English-only fields',
);

console.log(`predict search matches legacy ko/ja logic and supports en priority fields | checked songs=${SONGS.length}`);
