import { cp, readFile, stat, writeFile } from 'node:fs/promises';
import { generatedSongsPath, publicDataDir, rootDataDir, rootSongsPath } from './paths.mjs';

const source = await readFile(rootSongsPath, 'utf8');
const generated = `${source.trimEnd()}

export { SONGS, MODEL_PARAMS };
`;

await writeFile(generatedSongsPath, generated, 'utf8');
console.log(`synced ${rootSongsPath} -> ${generatedSongsPath}`);

try {
  await stat(rootDataDir);
} catch (error) {
  throw new Error(`missing ${rootDataDir}; run python3 enstars_regression_v3.py --export first`);
}

await cp(rootDataDir, publicDataDir, { recursive: true });
console.log(`synced ${rootDataDir} -> ${publicDataDir}`);
