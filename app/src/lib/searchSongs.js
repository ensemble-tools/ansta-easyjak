import { normalize } from './normalize.js';

const BASE_PREDICT_FIELDS = [
  'title_ja',
  'title_ja_reading',
  'title_ko',
  'title_ko_reading',
];

const EN_PREDICT_FIELDS = [
  'title_en',
  'title_en_reading',
  ...BASE_PREDICT_FIELDS,
];

function getPredictFields(locale) {
  return locale === 'en' ? EN_PREDICT_FIELDS : BASE_PREDICT_FIELDS;
}

export function searchSongsForPredict(query, locale, songs) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];
  if (!Array.isArray(songs)) return [];

  const fields = getPredictFields(locale);
  return songs
    .filter((song) => fields.some((field) => {
      const value = song[field];
      return value && normalize(value).includes(normalizedQuery);
    }))
    .slice(0, 12);
}
