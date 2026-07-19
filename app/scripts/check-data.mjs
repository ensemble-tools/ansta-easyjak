import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Script, createContext } from 'node:vm';
import { generatedSongsPath, rootDataDir, rootSongsPath } from './paths.mjs';

async function loadRootSongs() {
  const source = await readFile(rootSongsPath, 'utf8');
  const sandbox = {};
  createContext(sandbox);
  new Script(`${source}\nthis.SONGS = SONGS; this.MODEL_PARAMS = MODEL_PARAMS;`).runInContext(sandbox);
  return {
    songs: sandbox.SONGS,
    modelParams: sandbox.MODEL_PARAMS,
  };
}

async function loadGeneratedSongs() {
  const generatedUrl = pathToFileURL(generatedSongsPath);
  generatedUrl.search = `?t=${Date.now()}`;
  const module = await import(generatedUrl.href);
  return {
    songs: module.SONGS,
    modelParams: module.MODEL_PARAMS,
  };
}

async function loadStaticData() {
  const [songs, modelParams, manifest] = await Promise.all([
    readFile(`${rootDataDir}/songs.json`, 'utf8').then(JSON.parse),
    readFile(`${rootDataDir}/model.json`, 'utf8').then(JSON.parse),
    readFile(`${rootDataDir}/manifest.json`, 'utf8').then(JSON.parse),
  ]);
  return { songs, modelParams, manifest };
}

function assertSongShape(song, index) {
  const requiredFields = [
    'type',
    'unit',
    'units',
    'title_ja',
    'title_ja_reading',
    'title_ko',
    'title_ko_reading',
    'title_en',
    'title_en_reading',
    'totalNotes',
    'duration',
    'etStart',
    'etEnd',
    'measured',
    'category',
    'video',
    'videoClear',
    'predicted',
  ];

  for (const field of requiredFields) {
    assert.ok(Object.hasOwn(song, field), `song[${index}] is missing field: ${field}`);
  }

  assert.equal(typeof song.type, 'string', `song[${index}].type must be string`);
  assert.equal(typeof song.unit, 'string', `song[${index}].unit must be string`);
  assert.ok(Array.isArray(song.units), `song[${index}].units must be array`);
  assert.equal(typeof song.title_ja, 'string', `song[${index}].title_ja must be string`);
  assert.equal(typeof song.totalNotes, 'number', `song[${index}].totalNotes must be number`);
  assert.ok(song.duration === null || typeof song.duration === 'string', `song[${index}].duration must be string/null`);
  assert.ok(song.measured === null || typeof song.measured === 'number', `song[${index}].measured must be number/null`);
  assert.equal(typeof song.predicted, 'number', `song[${index}].predicted must be number`);
  assert.ok(song.video === null || typeof song.video === 'string', `song[${index}].video must be string/null`);
  assert.ok(song.videoClear === null || typeof song.videoClear === 'string', `song[${index}].videoClear must be string/null`);
}

function normalizeJson(value) {
  return JSON.parse(JSON.stringify(value));
}

const rootData = await loadRootSongs();
const generatedData = await loadGeneratedSongs();
const staticData = await loadStaticData();
const rootSongs = normalizeJson(rootData.songs);
const generatedSongs = normalizeJson(generatedData.songs);
const staticSongs = normalizeJson(staticData.songs);
const rootModelParams = normalizeJson(rootData.modelParams);
const generatedModelParams = normalizeJson(generatedData.modelParams);
const staticModelParams = normalizeJson(staticData.modelParams);

assert.equal(generatedSongs.length, rootSongs.length, 'song count changed');
assert.deepEqual(generatedModelParams, rootModelParams, 'MODEL_PARAMS changed');
assert.deepEqual(generatedSongs, rootSongs, 'SONGS data changed');
assert.equal(staticSongs.length, rootSongs.length, 'static song count changed');
assert.deepEqual(staticModelParams, rootModelParams, 'static MODEL_PARAMS changed');
assert.deepEqual(staticSongs, rootSongs, 'static SONGS data changed');

generatedSongs.forEach(assertSongShape);
staticSongs.forEach(assertSongShape);

assert.equal(staticData.manifest.schemaVersion, 1, 'manifest schemaVersion changed');
assert.equal(staticData.manifest.songCount, rootSongs.length, 'manifest songCount mismatch');
assert.equal(staticData.manifest.measuredCount, rootSongs.filter((song) => song.measured !== null).length, 'manifest measuredCount mismatch');
assert.equal(staticData.manifest.predictedOnlyCount, rootSongs.filter((song) => song.measured === null).length, 'manifest predictedOnlyCount mismatch');
assert.match(staticData.manifest.version, /^[a-f0-9]{12}$/, 'manifest version must be a 12-char content hash');
assert.match(staticData.manifest.files.songs, /^songs\.json\?v=[a-f0-9]{12}$/, 'manifest songs path must include version');
assert.match(staticData.manifest.files.model, /^model\.json\?v=[a-f0-9]{12}$/, 'manifest model path must include version');

const measuredCount = generatedSongs.filter((song) => song.measured !== null).length;
const predictedOnlyCount = generatedSongs.filter((song) => song.measured === null).length;
const videoCount = generatedSongs.filter((song) => song.video !== null).length;
const videoClearCount = generatedSongs.filter((song) => song.videoClear !== null).length;

console.log([
  'generated data matches root songs.js',
  `version=${staticData.manifest.version}`,
  `songs=${generatedSongs.length}`,
  `measured=${measuredCount}`,
  `predictedOnly=${predictedOnlyCount}`,
  `video=${videoCount}`,
  `videoClear=${videoClearCount}`,
].join(' | '));
