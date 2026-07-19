export function getDisplayTitle(song, locale) {
  if (locale === 'ko') return song.title_ko || song.title_ja;
  if (locale === 'en') return song.title_en || song.title_ja;
  return song.title_ja;
}

export function getSubTitle(song, locale) {
  if (locale === 'ko') {
    if (song.title_ko && song.title_ko !== song.title_ja) return song.title_ja;
    return song.title_ko ? null : (song.title_ja_reading || null);
  }
  if (locale === 'en') {
    return song.title_en && song.title_en !== song.title_ja
      ? song.title_ja
      : (song.title_ja_reading || null);
  }
  return song.title_ja_reading || null;
}

export function getClearValue(song) {
  return song.measured !== null ? song.measured : song.predicted;
}

export function getResultVideo(song) {
  return song ? (song.videoClear || song.video) : null;
}
