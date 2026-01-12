# Hi Playground - 프로젝트 구조 문서

이 문서는 Hi Playground 웹사이트의 구조와 시스템을 설명합니다. AI 도구(Gemini, ChatGPT 등)가 프로젝트를 이해하고 작업할 수 있도록 작성되었습니다.

## 프로젝트 개요

**Hi Playground**는 초등학생을 대상으로 한 미니 게임 플랫폼입니다.
- **기술 스택**: HTML, CSS, JavaScript (순수 프론트엔드, 빌드 도구 없음)
- **목표**: 확장 가능한 구조로 100개 이상의 게임을 호스팅
- **타겟**: 일반인 (태블릿 PC, 모바일 최적화)

## 디렉토리 구조

```
hiplayground/
├── index.html                 # 메인 페이지
├── pages/                     # 각종 페이지
│   ├── games.html            # 게임 목록 페이지
│   ├── category.html         # 카테고리별 게임 목록
│   ├── play.html             # 게임 플레이 페이지
│   ├── about.html            # 소개 페이지
│   ├── privacy.html          # 개인정보처리방침
│   ├── terms.html            # 이용약관
│   └── 404.html              # 404 에러 페이지
├── assets/                    # 정적 리소스
│   ├── css/                  # 스타일시트
│   │   ├── base.css          # 기본 스타일
│   │   ├── theme.css         # 테마 색상
│   │   └── components.css    # 컴포넌트 스타일
│   ├── js/                   # JavaScript 모듈
│   │   ├── app.js            # 메인 애플리케이션 로직
│   │   ├── router.js         # 라우팅 처리
│   │   ├── storage.js        # 로컬 스토리지 관리
│   │   ├── i18n.js           # 다국어 지원
│   │   ├── language-selector.js  # 언어 선택기 UI
│   │   └── analytics.js      # 분석 추적
│   └── games/                # 게임별 에셋 (이미지 등)
│       ├── omok/
│       └── weapon-levelup/
├── data/                      # 데이터 파일 (JSON)
│   ├── games.json            # 게임 목록 및 메타데이터
│   ├── categories.json       # 카테고리 정의
│   └── i18n/                 # 번역 파일
│       ├── ko.json           # 한국어
│       ├── en.json           # 영어
│       └── zh-HK.json        # 홍콩 번체
├── games/                     # 게임 코드
│   ├── {game-id}/            # 각 게임 디렉토리
│   │   ├── game.js           # 게임 로직 (필수)
│   │   ├── game.css          # 게임 스타일 (필수)
│   │   └── manifest.json     # 게임 메타데이터 (필수)
│   ├── clicker/
│   ├── memory/
│   ├── math-quiz/
│   ├── math-quiz-hard/
│   ├── chess/
│   ├── omok/
│   ├── weapon-levelup/
│   ├── speed-number/
│   ├── physics-box/
│   ├── gravity-run/
│   ├── infinite-space/
│   └── mystic-fortune/
├── shared/                    # 공유 컴포넌트
│   ├── game-shell.js         # 게임 래퍼 (게임 로딩 및 UI)
│   ├── game-shell.css        # 게임 쉘 스타일
│   └── ui.js                 # UI 헬퍼 함수
└── README.md                  # 프로젝트 설명

```

## 핵심 시스템

### 1. 게임 시스템

#### 게임 등록
게임을 추가하려면 다음이 필요합니다:

1. **games/{game-id}/** 디렉토리 생성
2. **manifest.json** 파일 생성:
```json
{
  "id": "game-id",
  "title": "게임 제목",
  "titleEn": "Game Title",
  "description": "게임 설명",
  "descriptionEn": "Game Description",
  "icon": "🎮",
  "category": "action",
  "difficulty": "medium",
  "version": "1.0.0"
}
```

3. **game.js** 파일 생성 (IIFE 패턴):
```javascript
(function() {
  'use strict';
  
  const Game = {
    init: function(gameContainer, options = {}) {
      // options: { onScoreUpdate, onGameOver, onLevelChange }
      // gameContainer: DOM 요소 (게임을 렌더링할 컨테이너)
      // 게임 초기화 로직
    },
    
    reset: function() {
      // 게임 리셋 로직 (선택사항)
    }
  };
  
  // 필수: window.Game으로 노출
  if (typeof window !== 'undefined') {
    window.Game = Game;
  }
})();
```

4. **game.css** 파일 생성 (게임 전용 스타일)

5. **data/games.json**에 게임 정보 추가:
```json
{
  "id": "game-id",
  "title": "게임 제목",
  "titleEn": "Game Title",
  "category": "action",
  "difficulty": "medium",
  "description": "게임 설명",
  "descriptionEn": "Game Description",
  "icon": "🎮",
  "tags": ["태그1", "태그2"],
  "popularity": 85,
  "releaseDate": "2024-01-01"
}
```

#### 게임 로딩 프로세스
1. `pages/play.html?id={game-id}` 접속
2. `GameShell.init(gameId)` 호출
3. `games/{game-id}/manifest.json` 로드
4. `games/{game-id}/game.css` 로드 (자동, `<link>` 태그로 추가)
5. `games/{game-id}/game.js` 로드 (동적 `<script>` 태그로 추가)
6. 스크립트 로드 완료 후 100ms 대기 (IIFE 실행 보장)
7. `window.Game` 객체 확인
8. `window.Game.init(gameContainer, callbacks)` 호출
9. 게임 초기화 완료

**오류 처리**:
- `window.Game`이 없거나 `init` 메서드가 없으면 오류 표시
- `init` 메서드 실행 중 오류 발생 시 오류 메시지 표시

### 2. 데이터 시스템

#### games.json 구조
```json
[
  {
    "id": "game-id",              // 고유 ID (디렉토리 이름과 정확히 일치, 소문자 하이픈)
    "title": "게임 제목",          // 한국어 제목
    "titleEn": "Game Title",       // 영어 제목
    "category": "action",          // 카테고리 ID
    "difficulty": "easy",          // easy | medium | hard
    "description": "설명",
    "descriptionEn": "Description",
    "icon": "🎮",                  // 이모지 또는 경로 (예: "assets/games/omok/icon/icon.webp")
    "tags": ["태그1", "태그2"],
    "popularity": 85,              // 인기 점수 (0-100)
    "releaseDate": "2024-01-01",   // YYYY-MM-DD 형식
    "version": "1.0.0",            // 선택적: 버전 정보
    "orientation": "portrait"      // 선택적: portrait | landscape
  }
]
```

**중요 규칙**:
- `id` 필드는 폴더 이름과 정확히 일치해야 함 (대소문자 구분)
- 폴더 이름은 소문자 하이픈 형식 권장 (예: `mystic-fortune`)
- `icon` 필드는 이모지 문자열 또는 이미지 경로 문자열

#### categories.json 구조
```json
[
  {
    "id": "action",
    "name": "액션",
    "nameEn": "Action",
    "icon": "⚡",
    "description": "설명",
    "descriptionEn": "Description"
  }
]
```

### 3. 라우팅 시스템

**assets/js/router.js**가 단일 페이지 라우팅을 처리합니다.
- `Router.goTo(page, params)` - 페이지 이동
- `Router.goToPlay(gameId)` - 게임 플레이 페이지로 이동
- `Router.goToCategory(categoryId)` - 카테고리 페이지로 이동

### 4. 스토리지 시스템

**assets/js/storage.js**가 로컬 스토리지를 관리합니다.
- `Storage.getLastPlayed()` - 마지막 플레이한 게임 정보
- `Storage.setLastPlayed(gameId, data)` - 마지막 플레이 저장
- `Storage.getGameProgress(gameId)` - 게임 진행 상황 조회
- `Storage.setGameProgress(gameId, data)` - 게임 진행 상황 저장
- `Storage.getFavorites()` - 즐겨찾기 목록
- `Storage.addFavorite(gameId)` - 즐겨찾기 추가
- `Storage.removeFavorite(gameId)` - 즐겨찾기 제거

### 5. 다국어 시스템 (i18n)

**assets/js/i18n.js**와 **data/i18n/** 파일들이 다국어를 지원합니다.

#### 지원 언어
- **한국어 (ko)**: 기본 언어
- **영어 (en)**: English
- **홍콩 번체 (zh-HK)**: 繁體中文(香港) - Traditional Chinese (Hong Kong)

#### 주요 기능
- `I18n.t(key, defaultValue)` - 번역 텍스트 가져오기
- `I18n.setLanguage(lang)` - 언어 변경 (자동 저장 및 페이지 업데이트)
- `I18n.getGameTitle(gameId, manifest, gameData)` - 게임 제목 번역
- `I18n.getGameDescription(gameId, manifest, gameData)` - 게임 설명 번역
- `I18n.getGameDescriptionData(gameId)` - 게임 상세 정보 (howToPlay, strategy, about) 번역

#### 언어 선택기
- **위치**: 모든 페이지의 우측 상단
- **구현**: `assets/js/language-selector.js`
- **UI**: 지구본 아이콘 클릭 시 드롭다운 메뉴 표시
- **저장**: 선택한 언어는 로컬 스토리지에 저장되어 다음 방문 시 자동 적용

#### 번역 파일 구조
```
data/i18n/
├── ko.json          # 한국어 번역
├── en.json          # 영어 번역
└── zh-HK.json       # 홍콩 번체 번역
```

각 번역 파일은 다음 구조를 가집니다:
```json
{
  "site": { ... },
  "nav": { ... },
  "home": { ... },
  "games": { ... },
  "play": { ... },
  "common": { ... },
  "privacyPolicy": { ... },
  "termsOfService": { ... },
  "footer": { ... },
  "gameDetails": {
    "game-id": {
      "ui": {
        "buttonText": "...",
        "labelText": "..."
      },
      "howToPlay": "...",
      "strategy": "...",
      "about": "..."
    }
  }
}
```

#### 게임 내 번역
각 게임은 `getUIText(key, defaultValue)` 헬퍼 함수를 사용하여 UI 텍스트를 번역합니다:
```javascript
function getUIText(key, defaultValue) {
  if (typeof I18n !== 'undefined' && I18n.t && I18n.translations && Object.keys(I18n.translations).length > 0) {
    const fullKey = `gameDetails.${gameId}.ui.${key}`;
    const value = I18n.t(fullKey, defaultValue);
    if (value === fullKey || value === defaultValue) {
      return defaultValue;
    }
    return value;
  }
  return defaultValue;
}
```

게임은 `i18n:loaded` 이벤트를 리스닝하여 언어 변경 시 UI를 업데이트합니다:
```javascript
document.addEventListener('i18n:loaded', () => {
  // UI 재렌더링
  this.renderLayout();
  this.updateUI();
});
```

### 6. App API

**assets/js/app.js**의 `App` 객체가 게임 데이터를 관리합니다.

#### 주요 메서드
```javascript
// App 초기화 (필수, 페이지 로드 시 호출)
await App.init();

// 모든 게임 가져오기
const allGames = App.getGames();

// ID로 게임 찾기
const game = App.getGameById('game-id');

// 카테고리로 게임 필터링
const games = App.getGamesByCategory('puzzle');

// 게임 검색 (제목, 설명, 태그에서 검색)
const results = App.searchGames('검색어');

// 필터 및 정렬
const filtered = App.filterAndSortGames(allGames, {
  category: 'puzzle',      // 카테고리 필터
  difficulty: 'medium',    // 난이도 필터
  sort: 'popular'          // 정렬: 'popular' | 'new'
});

// 카테고리 목록 가져오기
const categories = App.getCategories();

// ID로 카테고리 찾기
const category = App.getCategoryById('puzzle');
```

#### UI API (shared/ui.js)

```javascript
// 게임 카드 렌더링
UI.renderGameCards(containerElement, gamesArray);

// 카테고리 카드 렌더링
UI.renderCategoryCards(containerElement, categoriesArray);

// 아이콘 렌더링 (이모지/이미지 자동 감지)
const iconHTML = UI.renderIcon(game.icon);

// 디바운스 함수 (검색 등에 사용)
const debouncedSearch = UI.debounce((query) => {
  // 검색 로직
}, 300);
```

## 주요 페이지 구조

### index.html (메인 페이지)
- **모든 게임 섹션**: 모든 게임을 한 번에 표시 (카테고리/인기 게임 구분 없음)
- 이어서 하기 (마지막 플레이 게임, 선택적)
- 검색 기능 (실시간 필터링)
- **참고**: 카테고리 섹션과 인기 게임 섹션은 제거됨

### pages/games.html (게임 목록)
- 모든 게임 표시
- 필터: 카테고리, 난이도
- 정렬: 인기순, 최신순
- 검색 기능

### pages/category.html?c={category-id}
- 특정 카테고리의 게임만 표시
- 필터 및 정렬 기능

### pages/play.html?id={game-id}
- `GameShell`을 사용하여 게임 로드
- 공통 UI: 뒤로가기, 리셋, 전체화면, 음소거
- 게임 컨테이너: `#game-container`

## 게임 개발 가이드

### 필수 구현 사항

1. **window.Game 객체 노출**
   - IIFE 패턴으로 구현
   - `window.Game = Game` 형태로 노출
   - **중요**: 자동 실행 코드 금지 (DOMContentLoaded 이벤트 리스너나 즉시 실행 init 호출 금지)

2. **init 메서드 구현** (필수)
   ```javascript
   init: function(gameContainer, options = {}) {
     // gameContainer: DOM 요소 (GameShell이 제공)
     // options.onScoreUpdate(score) - 점수 업데이트 콜백
     // options.onGameOver(data) - 게임 종료 콜백
     // options.onLevelChange(level) - 레벨 변경 콜백
     
     // 필수: container에 게임 UI 렌더링
     container.innerHTML = '';
     // 게임 초기화 및 렌더링 로직
   }
   ```

3. **render 메서드** (선택적)
   ```javascript
   render: function() {
     // 게임 UI 재렌더링
   }
   ```

4. **reset 메서드** (선택적)
   ```javascript
   reset: function() {
     // 게임 상태 초기화 및 재시작
   }
   ```

5. **setMuted 메서드** (선택적)
   ```javascript
   setMuted: function(muted) {
     // 사운드 음소거 처리
   }
   ```

6. **반응형 디자인**
   - 태블릿 및 모바일 최적화
   - 터치 이벤트 지원 권장

### 게임 콜백 사용 예시

```javascript
// 점수 업데이트
if (callbacks.onScoreUpdate) {
  callbacks.onScoreUpdate(currentScore);
}

// 게임 종료
if (callbacks.onGameOver) {
  callbacks.onGameOver({
    score: finalScore,
    stage: currentStage,
    win: true  // 또는 false
  });
}

// 레벨 변경
if (callbacks.onLevelChange) {
  callbacks.onLevelChange(currentLevel);
}
```

## 현재 게임 목록

1. **clicker** - 클리커 게임 (액션, 쉬움) ✅ 다국어 지원
2. **memory** - 기억력 게임 (퍼즐, 보통) ✅ 다국어 지원
3. **math-quiz** - 초등 수학 마스터 (교육, 보통) ✅ 다국어 지원
4. **math-quiz-hard** - 암산 천재 (고학년) (교육, 어려움) ✅ 다국어 지원
5. **chess** - 체스 (보드, 어려움) ✅ 다국어 지원
6. **omok** - 오목 마스터 (보드, 어려움) ✅ 다국어 지원
7. **weapon-levelup** - 내 무기만 레벨업 (퍼즐, 보통) ✅ 다국어 지원
8. **speed-number** - 순발력 숫자 터치 (액션, 쉬움) ✅ 다국어 지원
9. **physics-box** - 와르르 상자 (액션, 보통) ✅ 다국어 지원
10. **gravity-run** - 그래비티 런: 제로 (액션, 어려움) ✅ 다국어 지원
11. **infinite-space** - 인피니티 스페이스: 로그 (슈팅, 어려움) ✅ 다국어 지원
12. **mystic-fortune** - 오늘의 운세 (라이프스타일, 쉬움) ✅ 다국어 지원 (내부 언어 관리)
13. **word-pop** - 단어 터치 게임 (교육, 쉬움) ✅ 다국어 지원
14. **code-rabbit** - 코드 토끼 (교육, 보통) ✅ 다국어 지원
15. **guardian-defense** - 가디언 디펜스 (전략, 보통) ✅ 다국어 지원
16. **idle-factory** - 아이들 팩토리 (시뮬레이션, 쉬움) ✅ 다국어 지원
17. **emoji-survivor** - 이모지 서바이버 (액션, 보통) ✅ 다국어 지원
18. **jelly-legend** - 젤리 레전드 (액션, 보통) ✅ 다국어 지원
19. **neon-beat** - 네온 비트 (리듬, 보통) ✅ 다국어 지원

**참고**: ✅ 표시는 한국어, 영어, 홍콩 번체를 모두 지원하는 게임입니다.

## 카테고리 목록

1. **action** - 액션
2. **puzzle** - 퍼즐
3. **education** - 교육 (수학 포함)
4. **board** - 보드 게임
5. **shooting** - 슈팅
6. **lifestyle** - 라이프스타일

## 기술 스택 상세

- **빌드 도구**: 없음 (순수 HTML/CSS/JS)
- **프레임워크**: 없음 (바닐라 JavaScript)
- **패키지 관리자**: 없음
- **로컬 서버**: 필요 없음 (index.html을 직접 열어도 작동)
- **브라우저 호환성**: 모던 브라우저 (ES6+)

## 파일 확장 규칙

- **게임 ID는 소문자 하이픈으로 구분** (예: `mystic-fortune`, `weapon-levelup`)
- **디렉토리 이름과 게임 ID는 정확히 일치해야 함** (대소문자 구분)
- **manifest.json의 id 필드와 디렉토리 이름은 일치해야 함**
- **중요**: 웹 서버는 대소문자를 구분하므로, 폴더 이름도 소문자 하이픈 형식을 사용해야 함

## 주의사항

1. **게임은 `window.Game` 객체로 노출되어야 함** (GameShell 인터페이스 필수)
2. **Game 객체는 반드시 `init(gameContainer, options)` 메서드를 가져야 함**
3. 게임 CSS는 게임 ID를 prefix로 사용 권장 (충돌 방지)
4. 게임은 독립적으로 작동해야 함 (다른 게임에 의존하면 안 됨)
5. 모든 게임은 모바일/태블릿에서 테스트 필요
6. **폴더 이름은 소문자 하이픈 형식 사용** (예: `mystic-fortune`, `weapon-levelup`)
7. **게임 아이콘은 이모지 또는 이미지 경로 지원** (이미지 사용 시 WebP 권장)

## 추가 리소스

- 게임 에셋은 `assets/games/{game-id}/`에 저장
- 게임 로직은 `games/{game-id}/game.js`에만 구현
- 공통 UI는 `shared/game-shell.js`를 통해 제공

## UI 컴포넌트 시스템

### 게임 카드 렌더링

**shared/ui.js**의 `renderGameCards()` 함수가 게임 카드를 렌더링합니다.

#### 아이콘 처리
- **이모지 아이콘**: `"icon": "🎮"` (문자열)
- **이미지 아이콘**: `"icon": "assets/games/omok/icon/icon.webp"` (경로)
- `UI.renderIcon()` 메서드가 자동으로 타입을 감지하여 처리
- **중요**: 이미지와 이모지 아이콘의 높이를 동일하게 맞춰야 텍스트 정렬이 일치함
  - CSS에서 `.game-card-icon`에 `height: 4rem`과 `line-height: 4rem` 설정 필수
  - 이미지 아이콘은 `.game-icon-image` 클래스가 자동 추가됨

#### 게임 카드 구조
```html
<div class="card game-card" data-game-id="game-id">
  <div class="game-card-icon">🎮</div> <!-- 또는 <img> -->
  <div class="game-card-title">게임 제목</div>
  <div class="game-card-description">게임 설명</div>
  <button class="btn btn-primary">플레이</button>
</div>
```

### 메인 페이지 구조

**index.html**의 메인 콘텐츠 구조:
```html
<main class="container">
  <!-- 검색 박스 -->
  <div class="search-box">...</div>
  
  <!-- 이어서 하기 (선택적) -->
  <section class="continue-section" id="continue-section" style="display: none;">
    <h2>이어서 하기</h2>
    <div id="continue-game"></div>
  </section>
  
  <!-- 모든 게임 섹션 -->
  <section class="section">
    <h2>모든 게임</h2>
    <div class="grid grid-3" id="all-games-grid">
      <!-- 게임 카드들이 동적으로 추가됨 -->
    </div>
  </section>
</main>
```

**초기화 스크립트**:
```javascript
// 모든 게임 로드
const allGames = App.getGames();
const allGamesGrid = document.getElementById('all-games-grid');
UI.renderGameCards(allGamesGrid, allGames);

// 검색 기능
const handleSearch = UI.debounce((query) => {
  if (!query.trim()) {
    UI.renderGameCards(allGamesGrid, allGames);
    return;
  }
  const results = App.searchGames(query);
  UI.renderGameCards(allGamesGrid, results);
}, 300);
```

## GameShell 인터페이스

모든 게임은 다음 인터페이스를 구현해야 합니다:

```javascript
const Game = {
  init: function(gameContainer, options = {}) {
    // gameContainer: DOM 요소 (게임을 렌더링할 컨테이너)
    // options: { onScoreUpdate, onGameOver, onLevelChange }
    // 필수: container에 게임 UI를 렌더링
  },
  
  render: function() {
    // 선택적: 게임 UI 재렌더링
  },
  
  reset: function() {
    // 선택적: 게임 리셋
  },
  
  setMuted: function(muted) {
    // 선택적: 사운드 음소거 처리
  }
};

// 필수: window.Game으로 export
if (typeof window !== 'undefined') {
  window.Game = Game;
}
```

**중요**: 
- 게임은 자동 실행되면 안 됨 (IIFE 내부에서 자동 init 호출 금지)
- GameShell이 `Game.init()`을 호출할 때까지 대기해야 함
- `gameContainer`는 GameShell이 제공하는 DOM 요소임

## 최근 주요 변경 사항

### 다국어 지원 시스템 구축 (2024)
- **3개 언어 지원**: 한국어, 영어, 홍콩 번체 (繁體中文(香港))
- **언어 선택기 UI**: 모든 페이지 우측 상단에 지구본 아이콘 추가
- **자동 언어 저장**: 선택한 언어는 로컬 스토리지에 저장되어 다음 방문 시 자동 적용
- **실시간 언어 변경**: 페이지 새로고침 없이 즉시 텍스트 변경
- **게임 내 번역**: 모든 게임의 UI 텍스트가 선택한 언어로 표시
- **게임 설명 번역**: 게임 방법, 공략 팁, 게임 소개 섹션도 모두 번역됨

#### 게임 번역 상태
- 모든 게임이 한국어, 영어, 홍콩 번체를 지원합니다
- 각 게임은 `getUIText()` 헬퍼 함수를 사용하여 UI 텍스트를 번역합니다
- 게임은 `i18n:loaded` 이벤트를 리스닝하여 언어 변경 시 자동으로 UI를 업데이트합니다
- `mystic-fortune` 게임은 자체 언어 관리 시스템을 사용합니다

#### 번역 파일 구조
- `data/i18n/ko.json`: 한국어 번역 (기본)
- `data/i18n/en.json`: 영어 번역
- `data/i18n/zh-HK.json`: 홍콩 번체 번역
- 각 파일에는 사이트 전체 UI, 게임별 UI, 게임 설명 등이 포함됩니다

### 메인 페이지 구조 변경
- **카테고리 섹션 제거**: 메인 페이지에서 카테고리 그리드 제거
- **인기 게임 섹션 제거**: 인기 게임만 보여주던 섹션 제거
- **모든 게임 섹션 추가**: 모든 게임을 한 번에 표시하는 단일 섹션으로 통합
- 검색 기능은 유지되어 실시간으로 게임을 필터링할 수 있음

### 게임 카드 아이콘 정렬
- 이미지 아이콘과 이모지 아이콘의 높이를 동일하게 맞춤
- CSS에서 `.game-card-icon`에 `height: 4rem`과 `line-height: 4rem` 설정 필수
- 이미지 아이콘은 `.game-icon-image` 클래스가 자동 추가됨

### 폴더 이름 규칙 강화
- **게임 ID와 폴더 이름은 정확히 일치해야 함** (대소문자 구분)
- **소문자 하이픈 형식 권장** (예: `mystic-fortune`, `weapon-levelup`)
- 웹 서버는 대소문자를 구분하므로 일치하지 않으면 게임 로드 실패

### GameShell 인터페이스 필수화
- 모든 게임은 `window.Game` 객체를 export해야 함
- `Game.init(gameContainer, options)` 메서드 필수
- 자동 실행 코드 금지 (GameShell이 init을 호출할 때까지 대기)

---

이 문서는 프로젝트 구조를 이해하고 새로운 게임을 추가하거나 기존 코드를 수정할 때 참고할 수 있도록 작성되었습니다.

