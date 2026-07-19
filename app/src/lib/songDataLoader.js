function unique(values) {
  return [...new Set(values)];
}

function resolveAppUrl(path, basePath = import.meta.env.BASE_URL) {
  return new URL(path, new URL(basePath || './', window.location.href)).toString();
}

export function getDataManifestUrlCandidates(basePath = import.meta.env.BASE_URL) {
  return unique([
    resolveAppUrl('data/manifest.json', basePath),
  ]);
}

async function fetchJson(url, label) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`${label} request failed: ${response.status}`);
  }
  return response.json();
}

function resolveDataUrl(path, manifestUrl) {
  return new URL(path, new URL(manifestUrl, window.location.origin)).toString();
}

function assertSongDataShape(data) {
  if (!Array.isArray(data.songs)) {
    throw new Error('songs data must be an array');
  }
  if (!data.modelParams || !Array.isArray(data.modelParams.coefs)) {
    throw new Error('model data is missing required coefficients');
  }
}

export async function loadSongData() {
  const manifestUrls = getDataManifestUrlCandidates();
  let lastError = null;

  for (const manifestUrl of manifestUrls) {
    try {
      const manifest = await fetchJson(manifestUrl, 'data manifest');
      const songsPath = manifest.files?.songs ?? 'songs.json';
      const modelPath = manifest.files?.model ?? 'model.json';
      const [songs, modelParams] = await Promise.all([
        fetchJson(resolveDataUrl(songsPath, manifestUrl), 'songs data'),
        fetchJson(resolveDataUrl(modelPath, manifestUrl), 'model data'),
      ]);
      const data = { songs, modelParams, manifest };
      assertSongDataShape(data);
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('song data could not be loaded');
}
