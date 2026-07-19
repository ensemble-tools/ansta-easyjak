#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "▶ songs.js 재생성..."
python3 enstars_regression_v3.py --export

echo "▶ React 데이터 동기화..."
cd react_backup && npm run sync:data

echo "▶ React 빌드..."
npm run build

echo "▶ 루트 배포 파일 갱신..."
cd ..
rsync -a --delete react_backup/dist/assets/ assets/
rsync -a --delete react_backup/dist/icons/ icons/
cp react_backup/dist/index.html index.html
cp react_backup/dist/en.html en.html
cp react_backup/dist/manifest.webmanifest manifest.webmanifest
cp react_backup/dist/sw.js sw.js
cp react_backup/dist/img.png img.png

echo "▶ /react 호환 리다이렉트 갱신..."
rm -rf react
mkdir -p react
cat > react/index.html <<'HTML'
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="0; url=../" />
    <title>앙스타 이지작 계산기</title>
    <script>
      window.location.replace(new URL('../', window.location.href));
    </script>
  </head>
  <body>
    <p><a href="../">앙스타 이지작 계산기 열기</a></p>
  </body>
</html>
HTML
cat > react/en.html <<'HTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="0; url=../?lang=en" />
    <title>Easyjak</title>
    <script>
      const url = new URL('../', window.location.href);
      url.searchParams.set('lang', 'en');
      window.location.replace(url);
    </script>
  </head>
  <body>
    <p><a href="../?lang=en">Open Easyjak in English</a></p>
  </body>
</html>
HTML
cat > react/sw.js <<'JS'
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key.includes('easyjak-react-preview')).map((key) => caches.delete(key)))),
      self.registration.unregister(),
      self.clients.claim(),
    ]),
  );
});
JS

echo "✓ 완료"
