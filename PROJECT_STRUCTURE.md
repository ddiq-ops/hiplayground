# Hi Playground - 프로젝트 구조 문서

이 문서는 Hi Playground 웹사이트의 구조와 시스템을 설명합니다. AI 도구(Gemini, ChatGPT 등)가 프로젝트를 이해하고 작업할 수 있도록 작성되었습니다.

## 프로젝트 개요

**Hi Playground**는 초등학생을 대상으로 한 미니 게임 플랫폼입니다.
- **기술 스택**: HTML, CSS, JavaScript (순수 프론트엔드, 빌드 도구 없음)
- **목표**: 확장 가능한 구조로 100개 이상의 게임을 호스팅
- **타겟**: 초등학생 (태블릿 PC, 모바일 최적화)

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
│   │   └── analytics.js      # 분석 추적
│   └── games/                # 게임별 에셋 (이미지 등)
│       ├── omok/
│       └── weapon-levelup/
├── data/                      # 데이터 파일 (JSON)
│   ├── games.json            # 게임 목록 및 메타데이터
│   ├── categories.json       # 카테고리 정의
│   └── i18n/                 # 번역 파일
│       ├── ko.json           # 한국어
│       └── en.json           # 영어
├── games/                     # 게임 코드
│   ├── {game-id}/            # 각 게임 디렉토리
│   │   ├── game.js           # 게임 로직 (필수)
│   │   ├── game.css          # 게임 스타일 (필수)
│   │   └── manifest.json     # 게임 메타데이터 (필수)
│   ├── clicker/
│   ├── memory/
│   ├── math-quiz/
│   ├── chess/
│   ├── omok/
│   └── weapon-levelup/
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
4. `games/{game-id}/game.css` 로드 (자동)
5. `games/{game-id}/game.js` 로드
6. `window.Game.init(gameContainer, callbacks)` 호출

### 2. 데이터 시스템

#### games.json 구조
```json
[
  {
    "id": "game-id",              // 고유 ID (디렉토리 이름과 일치)
    "title": "게임 제목",          // 한국어 제목
    "titleEn": "Game Title",       // 영어 제목
    "category": "action",          // 카테고리 ID
    "difficulty": "medium",        // easy | medium | hard
    "description": "설명",
    "descriptionEn": "Description",
    "icon": "🎮",                  // 이모지 또는 경로
    "tags": ["태그1", "태그2"],
    "popularity": 85,              // 인기 점수 (0-100)
    "releaseDate": "2024-01-01"    // YYYY-MM-DD 형식
  }
]
```

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

### 5. 다국어 시스템

**assets/js/i18n.js**와 **data/i18n/** 파일들이 다국어를 지원합니다.
- 기본 언어: 한국어 (ko)
- 지원 언어: 영어 (en)
- `I18n.t(key)` - 번역 텍스트 가져오기

## 주요 페이지 구조

### index.html (메인 페이지)
- 카테고리 그리드
- 인기 게임 목록 (6개)
- 이어서 하기 (마지막 플레이 게임)
- 검색 기능

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

2. **init 메서드 구현**
   ```javascript
   init: function(gameContainer, options = {}) {
     // gameContainer: DOM 요소
     // options.onScoreUpdate(score) - 점수 업데이트 콜백
     // options.onGameOver(data) - 게임 종료 콜백
     // options.onLevelChange(level) - 레벨 변경 콜백
   }
   ```

3. **반응형 디자인**
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

1. **clicker** - 클리커 게임 (액션, 쉬움)
2. **memory** - 기억력 게임 (퍼즐, 보통)
3. **math-quiz** - 수학 퀴즈 (수학, 보통)
4. **chess** - 체스 (보드, 어려움)
5. **omok** - 오목 (퍼즐, 보통)
6. **weapon-levelup** - 내 무기만 레벨업 (퍼즐, 보통)

## 카테고리 목록

1. **action** - 액션
2. **puzzle** - 퍼즐
3. **math** - 수학
4. **memory** - 기억력
5. **board** - 보드 게임
6. **casual** - 캐주얼
7. **sports** - 스포츠

## 기술 스택 상세

- **빌드 도구**: 없음 (순수 HTML/CSS/JS)
- **프레임워크**: 없음 (바닐라 JavaScript)
- **패키지 관리자**: 없음
- **로컬 서버**: 필요 없음 (index.html을 직접 열어도 작동)
- **브라우저 호환성**: 모던 브라우저 (ES6+)

## 파일 확장 규칙

- 게임 ID는 하이픈으로 구분 (예: `weapon-levelup`)
- 디렉토리 이름과 게임 ID는 일치해야 함
- manifest.json의 id 필드와 디렉토리 이름은 일치해야 함

## 주의사항

1. 게임은 `window.Game` 객체로 노출되어야 함
2. 게임 CSS는 게임 ID를 prefix로 사용 권장 (충돌 방지)
3. 게임은 독립적으로 작동해야 함 (다른 게임에 의존하면 안 됨)
4. 모든 게임은 모바일/태블릿에서 테스트 필요

## 추가 리소스

- 게임 에셋은 `assets/games/{game-id}/`에 저장
- 게임 로직은 `games/{game-id}/game.js`에만 구현
- 공통 UI는 `shared/game-shell.js`를 통해 제공

---

이 문서는 프로젝트 구조를 이해하고 새로운 게임을 추가하거나 기존 코드를 수정할 때 참고할 수 있도록 작성되었습니다.

