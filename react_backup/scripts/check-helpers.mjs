import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import {
  getClearValue,
  getDisplayTitle,
  getResultVideo,
  getSubTitle,
} from '../src/lib/songs.js';
import { normalize, toHiragana } from '../src/lib/normalize.js';

const generatedUrl = pathToFileURL(resolve(process.cwd(), 'src/data/songs.generated.js'));
generatedUrl.search = `?t=${Date.now()}`;
const { SONGS } = await import(generatedUrl.href);

function legacyToHiragana(value) {
  return value.replace(/[\u30A1-\u30F6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

function legacyNormalize(value) {
  return legacyToHiragana((value || '').toLowerCase()).replace(/[\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~☆★♪]/g, '');
}

function legacyDisplayTitle(song, locale) {
  return locale === 'ko' ? (song.title_ko || song.title_ja) : song.title_ja;
}

function legacySubTitle(song, locale) {
  if (locale === 'ko') {
    if (song.title_ko && song.title_ko !== song.title_ja) return song.title_ja;
    return song.title_ko ? null : (song.title_ja_reading || null);
  }
  return song.title_ja_reading || null;
}

for (const sample of ['キセキ', 'Miracle Dream Traveler', 'ONLY YOUR STARS!', 'Aisle, be with you', null, undefined]) {
  assert.equal(normalize(sample), legacyNormalize(sample), `normalize mismatch for ${sample}`);
}

assert.equal(toHiragana('アイウエオ'), 'あいうえお');

for (const song of SONGS) {
  for (const locale of ['ko', 'ja']) {
    assert.equal(getDisplayTitle(song, locale), legacyDisplayTitle(song, locale), `display title mismatch: ${song.title_ja}/${locale}`);
    assert.equal(getSubTitle(song, locale), legacySubTitle(song, locale), `subtitle mismatch: ${song.title_ja}/${locale}`);
  }

  assert.equal(getClearValue(song), song.measured !== null ? song.measured : song.predicted, `clear value mismatch: ${song.title_ja}`);
  assert.equal(getResultVideo(song), song.videoClear || song.video, `result video mismatch: ${song.title_ja}`);
}

const kiseki = SONGS.find((song) => song.title_ja === 'キセキ');
assert.ok(kiseki, 'expected キセキ fixture');
assert.equal(normalize(kiseki.title_ja), 'きせき');
assert.equal(getDisplayTitle(kiseki, 'en'), kiseki.title_en || kiseki.title_ja);
assert.equal(getSubTitle(kiseki, 'en'), kiseki.title_ja);

console.log(`helper behavior matches display/subtitle rules | checked songs=${SONGS.length}`);
