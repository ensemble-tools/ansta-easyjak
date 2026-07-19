import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const publicDir = resolve(process.cwd(), 'public');
const manifestPath = resolve(publicDir, 'manifest.webmanifest');
const serviceWorkerPath = resolve(publicDir, 'sw.js');
const indexPath = resolve(process.cwd(), 'index.html');
const registerPath = resolve(process.cwd(), 'src/lib/registerServiceWorker.js');
const mainPath = resolve(process.cwd(), 'src/main.jsx');
const packagePath = resolve(process.cwd(), 'package.json');
const viteConfigPath = resolve(process.cwd(), 'vite.config.js');

assert.ok(existsSync(manifestPath), 'missing public/manifest.webmanifest');
assert.ok(existsSync(serviceWorkerPath), 'missing public/sw.js');
assert.ok(existsSync(registerPath), 'missing src/lib/registerServiceWorker.js');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
assert.equal(manifest.start_url, './', 'manifest start_url must be relative');
assert.equal(manifest.scope, './', 'manifest scope must be relative');
assert.equal(manifest.id, './', 'manifest id must be relative');
assert.equal(manifest.display, 'standalone', 'manifest display must be standalone');
assert.equal(manifest.theme_color, '#1e3a6e', 'manifest theme_color mismatch');
assert.equal(manifest.background_color, '#f0f3f9', 'manifest background_color mismatch');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest needs icons');

for (const icon of manifest.icons) {
  assert.ok(icon.src, 'manifest icon missing src');
  assert.ok(icon.sizes, `manifest icon missing sizes: ${icon.src}`);
  assert.ok(icon.type === 'image/png', `manifest icon must be png: ${icon.src}`);
  assert.ok(existsSync(resolve(publicDir, icon.src)), `missing manifest icon file: ${icon.src}`);
}
assert.ok(existsSync(resolve(publicDir, 'icons/apple-touch-icon.png')), 'missing apple touch icon');

const indexHtml = readFileSync(indexPath, 'utf8');
assert.match(indexHtml, /<link rel="manifest" href="manifest\.webmanifest" \/>/, 'index must link React manifest relative to React base');
assert.match(indexHtml, /<meta name="theme-color" content="#1e3a6e" \/>/, 'index must include theme-color');
assert.match(indexHtml, /apple-mobile-web-app-capable/, 'index must include apple mobile web app capable meta');
assert.match(indexHtml, /apple-mobile-web-app-status-bar-style/, 'index must include apple status bar meta');
assert.match(indexHtml, /apple-mobile-web-app-title/, 'index must include apple title meta');
assert.match(indexHtml, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png" \/>/, 'index must link apple touch icon relative to React base');

const registerSource = readFileSync(registerPath, 'utf8');
assert.match(registerSource, /import\.meta\.env\.BASE_URL/, 'service worker registration must use import.meta.env.BASE_URL');
assert.match(registerSource, /import\.meta\.env\.PROD/, 'service worker registration must only run in production');
assert.match(registerSource, /new URL\(import\.meta\.env\.BASE_URL \|\| '\.\/'/, 'service worker registration must resolve relative base URL');
assert.match(registerSource, /`\$\{basePath\}sw\.js`/, 'service worker registration must append sw.js to resolved base path');
assert.match(registerSource, /navigator\.serviceWorker\.register\(swUrl, \{ scope: basePath \}\)/, 'service worker registration must set base scope');

const mainSource = readFileSync(mainPath, 'utf8');
assert.match(mainSource, /registerServiceWorker/, 'main must import/call registerServiceWorker');
assert.match(mainSource, /LOADING_MESSAGE_DELAY_MS = 300/, 'loading message must be delayed to avoid first-paint flicker');
assert.match(mainSource, /setShowLoadingMessage\(true\)/, 'loading message delay state must be enabled by timer');
assert.match(mainSource, /if \(!showLoadingMessage\) return null/, 'loading state must render nothing before the delay');

const serviceWorkerSource = readFileSync(serviceWorkerPath, 'utf8');
assert.match(serviceWorkerSource, /CACHE_VERSION = 'easyjak-react-v2'/, 'service worker must use current React cache version');
assert.match(serviceWorkerSource, /self\.registration\.scope/, 'service worker must derive base path from its registration scope');
assert.match(serviceWorkerSource, /isYoutubeRequest/, 'service worker must define YouTube bypass');
assert.match(serviceWorkerSource, /isDataRequest/, 'service worker must define data bypass');
assert.match(serviceWorkerSource, /fetch\(request, \{ cache: 'no-store' \}\)/, 'service worker must fetch data without cache');
assert.match(serviceWorkerSource, /getBuildAssetUrls/, 'service worker must discover built assets for app shell precache');
assert.match(serviceWorkerSource, /img\.youtube\.com/, 'service worker must exclude YouTube thumbnails');
assert.match(serviceWorkerSource, /youtube-nocookie/, 'service worker must exclude YouTube embeds');
assert.match(serviceWorkerSource, /googlevideo/, 'service worker must exclude YouTube media');
assert.match(serviceWorkerSource, /startsWith\(appPath\('assets\/'\)\)/, 'service worker must cache built static assets');
assert.match(serviceWorkerSource, /assetPattern = .*src\|href.*assets/, 'service worker must parse index asset references');
assert.match(serviceWorkerSource, /request\.mode === 'navigate'/, 'service worker must handle app shell navigation');
assert.doesNotMatch(serviceWorkerSource, /youtube.*cache\.put|cache\.put.*youtube/i, 'service worker must not cache YouTube requests');

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
assert.equal(packageJson.scripts['check:pwa'], 'node scripts/check-pwa.mjs', 'missing check:pwa script');
assert.ok(!packageJson.scripts['build:preview'], 'preview-specific build script should be removed');

const viteConfig = readFileSync(viteConfigPath, 'utf8');
assert.match(viteConfig, /process\.env\.EASYJAK_BASE \|\| '\.\/'/, 'Vite default base must be relative');

console.log('pwa manifest, icons, service worker, and registration checks passed');
