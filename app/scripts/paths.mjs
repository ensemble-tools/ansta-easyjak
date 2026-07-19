import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
export const projectDir = resolve(scriptsDir, '..');

const rootSongsCandidates = [
  resolve(projectDir, '..', 'songs.js'),
  resolve(projectDir, 'songs.js'),
];

export const rootSongsPath = rootSongsCandidates.find((path) => existsSync(path)) ?? rootSongsCandidates[0];
export const generatedSongsPath = resolve(projectDir, 'src/data/songs.generated.js');
export const rootDataDir = resolve(dirname(rootSongsPath), 'data');
export const publicDataDir = resolve(projectDir, 'public/data');
