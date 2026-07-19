export function extractYoutubeId(url) {
  if (!url) return null;
  const match = String(url).match(/(?:youtu\.be\/|[?&]v=|\/embed\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function getYoutubeThumbnail(videoUrl) {
  const id = extractYoutubeId(videoUrl);
  if (!id) return null;
  const sources = [
    `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${id}/sddefault.jpg`,
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
  ];

  return {
    src: sources[0],
    fallbackSrc: sources[sources.length - 1],
    sources,
  };
}

export function getSongThumbnail(song) {
  return getYoutubeThumbnail(song?.video);
}
