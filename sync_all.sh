#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "▶ songs.js 재생성..."
python3 enstars_regression_v3.py --export

echo "▶ React 데이터 동기화..."
cd react_backup && npm run sync:data

echo "▶ React preview 빌드..."
npm run build:preview

echo "▶ React preview 배포 폴더 갱신..."
cd ..
rsync -a --delete react_backup/dist/ react/
cp react_backup/public/manifest.preview.webmanifest react/manifest.webmanifest
cp react_backup/public/sw.preview.js react/sw.js

echo "▶ React 메인 빌드..."
cd react_backup && npm run build

echo "▶ 루트 배포 파일 갱신..."
cd ..
rsync -a --delete react_backup/dist/assets/ assets/
rsync -a --delete react_backup/dist/icons/ icons/
cp react_backup/dist/index.html index.html
cp react_backup/dist/en.html en.html
cp react_backup/dist/manifest.webmanifest manifest.webmanifest
cp react_backup/dist/sw.js sw.js
cp react_backup/dist/img.png img.png

echo "✓ 완료"
