#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "▶ songs.js 재생성..."
python3 enstars_regression_v3.py --export

echo "▶ React 데이터 동기화..."
cd react_backup && npm run sync:data

echo "▶ React 빌드..."
npm run build

echo "▶ React 배포 폴더 갱신..."
cd ..
rsync -a --delete react_backup/dist/ react/

echo "✓ 완료"
