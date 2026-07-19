const KATAKANA_PATTERN = /[\u30A1-\u30F6]/g;
const STRIP_PATTERN = /[\s!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~☆★♪]/g;

export function toHiragana(value) {
  return String(value ?? '').replace(
    KATAKANA_PATTERN,
    (char) => String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
}

export function normalize(value) {
  return toHiragana(String(value ?? '').toLowerCase()).replace(STRIP_PATTERN, '');
}
