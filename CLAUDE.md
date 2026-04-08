# easyjak 프로젝트 지침서

## 프로젝트 개요
앙상블 스타즈!! Music Easy 난이도 클리어 최소 콤보 예측 웹앱.
- Python 회귀 모델(`enstars_regression_v3.py`) → `songs.js` 자동 생성 → 프론트엔드 소비
- 배포 대상: GitHub Pages

---

## 파일 수정 규칙 ⚠️

| 파일 | 규칙 |
|---|---|
| `ja-ko.html` | **수정 가능** — 기본 작업 대상 |
| `ja-en.html` | **명시적 지시가 있을 때만 수정** |
| `songs.js` | `enstars_regression_v3.py`로 자동 생성 — 직접 수정 비권장 |

> 코드 변경 요청이 오면 `ja-ko.html`만 수정한다.  
> `ja-en.html` 수정은 사용자가 "ja-en도 수정해줘" 라고 명시할 때만 한다.

---

## 작업 방식
- 파일 수정 시 전체를 읽지 말고 grep으로 필요한 부분만 찾아서 str_replace로 수정할 것

## 프로젝트 구조

```
easyjak/
├── CLAUDE.md                  # 이 파일
├── ja-ko.html                 # 메인 프론트엔드 (한국어)
├── ja-en.html                 # 영문 버전 (명시적 지시 시에만 수정)
├── songs.js                   # 자동 생성 데이터 (직접 수정 비권장)
├── enstars_regression_v3.py   # 회귀 모델 + songs.js 생성 스크립트
└── data/
    └── (엑셀 데이터 파일)
```

---

## 데이터 구조

### songs.js
- `SONGS` 배열: 곡별 객체
- 주요 필드: `type`, `unit`, `units[]`, `title_ja`, `title_ko`, `totalNotes`, `duration`, `etStart`, `etEnd`, `predicted`, `measured`
- 콜라보 곡은 `units`가 2개 이상

### 엑셀 시트 구성
`starmaker`, `cosmic`, `rhythm_link`, `new_dimension`, `others` 5개 시트

---

## 회귀 모델 핵심 사항

- **3변수 OLS**: `total_notes`, `et_start_ratio`, `et_end_ratio`
- **안전 마진**: 예측값 + 10 콤보 (표시값은 항상 마진 포함)
- 클리어 시작점은 총 노트 수의 ~53–56% 수렴
- 더 복잡한 모델(GBM 등)은 LOO-MAE 개선 미미 → 채택 안 함

---

## 프론트엔드 구조 (ja-ko.html)

### 탭 구성
- **탭1** 클리어 예측: 곡 선택 → 예측 콤보 표시
- **탭2** 악곡 검색: 유닛 트리 필터 + 테이블

### 유닛 카테고리 구조
```javascript
const UNIT_CATEGORY = {
  // starmaker / cosmic / rhythm_link / new_dimension / others
};
const UNIT_GROUPS = {
  'Adam·Eve': ['Adam','Eve'], 'MaM·DF': ['MaM','DF'],
  '주년·기념': ['주년','만우절','새해'],
  '셔플': ['셔플','셔플_10주년'],
  '콜라보·드림유닛': ['콜라보','드림유닛'],
  '추억·J&A·기타': ['추억','J&A','기타'],
};
```

### Others 서브그룹 표시 순서
`['주년·기념', '셔플', '콜라보·드림유닛', '추억·J&A·기타']`

---

## 코드 스타일

- 프레임워크 없는 Vanilla JS + 단일 HTML 파일
- CSS 변수로 라이트/다크 모드 지원 (`var(--navy)`, `var(--bg)`, `var(--border)` 등)
- Chart.js 사용 (CDN)
- `songs.js`는 `<script src="songs.js">` 로 로드 (CORS 우회 목적)
- 변경 시 전체 파일 재작성보다 **해당 블록만 교체** 선호
