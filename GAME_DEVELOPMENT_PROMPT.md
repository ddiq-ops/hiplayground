# 게임 개발 프롬프트 (Weapon Level Up 게임 기반)

이 프롬프트는 `weapon-levelup` 게임의 구조와 패턴을 기반으로 작성되었으며, 새로운 게임을 개발할 때 참고할 수 있습니다.

## 📋 게임 구조 패턴

### 1. 기본 파일 구조
```
games/[game-id]/
  ├── game.js          # 게임 로직 (필수)
  ├── game.css         # 게임 스타일 (필수)
  └── manifest.json    # 게임 메타데이터 (필수)
```

### 2. 게임 코드 구조 (IIFE 패턴)

```javascript
(function() {
  // 게임 상태 변수들
  let gameState = {};
  let callbacks = {};
  let container = null;
  let isGameOver = false;
  let eventsSetup = false; // 이벤트 중복 방지
  
  // Game 객체 - 게임 인터페이스
  const Game = {
    // 필수 메서드
    init: function(gameContainer, options = {}) {
      // 1. 컨테이너와 콜백 저장
      // 2. 저장된 진행 상황 로드
      // 3. 게임 상태 초기화
      // 4. 렌더링
      // 5. 이벤트 설정
    },
    
    render: function() {
      // 게임 UI 렌더링
      // innerHTML을 사용한 동적 HTML 생성
      // 게임오버 상태에 따른 분기 처리
    },
    
    setupEvents: function() {
      // 이벤트 위임 패턴 사용
      // 중복 이벤트 방지 (eventsSetup 플래그)
      // container에 한 번만 이벤트 리스너 등록
    },
    
    reset: function() {
      // 게임 상태 초기화
      // 진행 상황 저장
      // 재렌더링
      // 이벤트 재설정
    },
    
    setMuted: function(muted) {
      // 사운드 음소거 처리 (선택)
    },
    
    // 게임별 커스텀 메서드들
    // ...
  };
  
  // Export
  if (typeof window !== 'undefined') {
    window.Game = Game;
  }
})();
```

## 🎮 게임 상태 관리

### 상태 변수 정의
```javascript
// 기본 게임 상태
let score = 0;
let level = 1;
let isGameOver = false;

// 게임별 상태 (예: 무기 강화 게임)
let weaponLevel = 1;
let gold = 50;
let totalUpgrades = 0;
let successfulUpgrades = 0;
let sellCount = 0;
let storedWeaponLevel = 0;
let potions = [1, 1, 1, 1, 1];
let activePotion = null;
let weaponProtection = 0;
```

### 진행 상황 저장/로드
```javascript
// 저장
saveProgress() {
  Storage.saveGameProgress('game-id', {
    score: score,
    level: level,
    // ... 기타 상태
    isGameOver: isGameOver
  });
}

// 로드
init: function(gameContainer, options = {}) {
  const saved = Storage.getGameProgress('game-id');
  if (saved) {
    score = saved.score || 0;
    level = saved.level || 1;
    // ... 기타 상태 복원
    isGameOver = saved.isGameOver || false;
  }
}
```

## 🎨 UI/UX 패턴

### 1. 반응형 레이아웃
```css
/* 기본 레이아웃 */
.game-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

/* 태블릿 대응 */
@media (max-width: 1024px) {
  .game-container {
    padding: var(--spacing-md);
  }
}

/* 모바일 대응 */
@media (max-width: 768px) {
  .game-container {
    padding: var(--spacing-sm);
  }
}
```

### 2. 통계 카드 패턴
```html
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-icon">💰</div>
    <div class="stat-label">골드</div>
    <div class="stat-value">${gold.toLocaleString()}</div>
  </div>
  <!-- 더 많은 통계 카드 -->
</div>
```

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.stat-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
```

### 3. 메시지 시스템
```javascript
showMessage(message, type = 'info') {
  const messageEl = document.getElementById('message');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    
    // 3초 후 자동 제거
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }, 3000);
  }
}

// 사용 예시
this.showMessage('강화 성공! 🎉', 'success');
this.showMessage('골드가 부족합니다!', 'error');
this.showMessage('정보 메시지', 'info');
```

```css
.message {
  font-size: 1.125rem;
  font-weight: 600;
  min-height: 1.5rem;
  transition: all var(--transition-base);
}

.message.success {
  color: var(--color-success);
}

.message.error {
  color: var(--color-error);
}

.message.info {
  color: var(--color-info);
}
```

### 4. 애니메이션 패턴
```css
/* 강화 애니메이션 */
@keyframes upgradeGlow {
  0%, 100% {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) brightness(1);
    transform: scale(1) rotate(0deg);
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(255, 215, 0, 1)) brightness(1.5);
    transform: scale(1.15) rotate(-5deg);
  }
}

.upgrade-animation {
  animation: upgradeGlow 1.5s ease-in-out;
}

/* 성공 애니메이션 */
@keyframes successPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
    filter: drop-shadow(0 0 40px rgba(76, 175, 80, 1));
  }
}

.success-animation {
  animation: successPulse 1s ease;
}

/* 실패 애니메이션 */
@keyframes failShake {
  0%, 100% {
    transform: translateX(0) rotate(0deg);
  }
  25%, 75% {
    transform: translateX(-15px) rotate(-5deg);
  }
  50% {
    transform: translateX(15px) rotate(5deg);
  }
}

.fail-animation {
  animation: failShake 1s ease;
}
```

```javascript
// 애니메이션 사용
playUpgradeAnimation() {
  const element = document.getElementById('target-element');
  if (element) {
    element.classList.add('upgrade-animation');
  }
}

playSuccessAnimation() {
  const element = document.getElementById('target-element');
  if (element) {
    element.classList.remove('upgrade-animation');
    element.classList.add('success-animation');
    setTimeout(() => {
      element.classList.remove('success-animation');
    }, 1000);
  }
}
```

### 5. 모달 시스템
```javascript
showModal(title, contentHTML) {
  const modalHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" id="close-modal">×</button>
        </div>
        <div class="modal-content">
          ${contentHTML}
        </div>
      </div>
    </div>
  `;
  
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  const modalElement = modalContainer.firstElementChild;
  document.body.appendChild(modalElement);
  
  // 이벤트 리스너 등록
  const closeBtn = document.getElementById('close-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => this.closeModal());
  }
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeModal();
      }
    });
  }
}

closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.remove();
  }
}
```

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
  animation: fadeIn 0.2s ease;
}

.modal {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}
```

## 🎯 게임 메커니즘 패턴

### 1. 비용 계산 시스템
```javascript
getUpgradeCost(level = currentLevel) {
  const baseCost = Math.floor(level * 20 + 15);
  const inflationMultiplier = 1 + (sellCount * 0.01); // 인플레이션
  return Math.floor(baseCost * inflationMultiplier);
}
```

### 2. 확률 시스템
```javascript
getSuccessProbability() {
  let baseProbability = 100 - (level * 1.0);
  baseProbability = Math.max(20, baseProbability); // 최소값 보장
  
  // 버프/디버프 적용
  if (activeBuff) {
    baseProbability = Math.min(100, baseProbability * 1.2);
  }
  
  return baseProbability;
}

// 확률 적용
const successRate = this.getSuccessProbability();
const isSuccess = Math.random() * 100 < successRate;
```

### 3. 가격 계산 시스템
```javascript
getSellPrice() {
  // 제곱 공식 사용 (레벨이 높을수록 기하급수적 증가)
  return Math.floor(level * level * 25 + level * 60 + 30);
}
```

### 4. 게임오버 체크
```javascript
checkGameOver() {
  if (level === 1) {
    const nextLevelCost = this.getUpgradeCost(1);
    if (gold < nextLevelCost) {
      isGameOver = true;
      return true;
    }
  }
  isGameOver = false;
  return false;
}

handleGameOver() {
  isGameOver = true;
  this.saveProgress();
  
  if (callbacks.onGameOver) {
    callbacks.onGameOver({
      score: level,
      completed: false,
      reason: '골드 부족'
    });
  }
  
  this.render();
}
```

### 5. 게임오버 화면
```javascript
render: function() {
  if (isGameOver) {
    container.innerHTML = `
      <div class="game-over">
        <div class="game-over-icon">💀</div>
        <h2 class="game-over-title">게임 오버</h2>
        <p class="game-over-message">${gameOverMessage}</p>
        <div class="game-over-stats">
          <!-- 통계 표시 -->
        </div>
        <button class="btn btn-primary" id="restart-btn">
          다시 시작하기
        </button>
      </div>
    `;
    return;
  }
  
  // 일반 게임 화면
  // ...
}
```

## 🔧 이벤트 처리 패턴

### 이벤트 위임 패턴
```javascript
setupEvents: function() {
  // 중복 방지
  if (eventsSetup) {
    return;
  }
  
  if (container) {
    // container에 한 번만 이벤트 리스너 등록
    container.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'action-btn') {
        e.preventDefault();
        this.handleAction();
      } else if (e.target && e.target.id === 'reset-btn') {
        e.preventDefault();
        this.reset();
      }
      // ... 더 많은 버튼들
    });
    
    eventsSetup = true;
  }
}
```

### 비동기 액션 처리
```javascript
handleAction() {
  // 버튼 비활성화
  const btn = document.getElementById('action-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '처리 중...';
  }
  
  // 애니메이션 시작
  this.playActionAnimation();
  
  // 비용 차감
  gold -= cost;
  
  // 결과 계산
  const isSuccess = this.calculateResult();
  
  // 결과 표시 (딜레이 후)
  setTimeout(() => {
    if (isSuccess) {
      this.showMessage('성공! 🎉', 'success');
      this.playSuccessAnimation();
    } else {
      this.showMessage('실패! 💔', 'error');
      this.playFailAnimation();
    }
    
    this.saveProgress();
    this.render();
    
    // 점수 업데이트
    if (callbacks.onScoreUpdate) {
      callbacks.onScoreUpdate(score);
    }
  }, 1500); // 1.5초 딜레이
}
```

## 📊 콜백 시스템

### GameShell과의 통합
```javascript
init: function(gameContainer, options = {}) {
  container = gameContainer;
  callbacks = options; // { onScoreUpdate, onGameOver, onLevelChange }
  
  // ...
}

// 점수 업데이트
if (callbacks.onScoreUpdate) {
  callbacks.onScoreUpdate(score);
}

// 게임오버 처리
if (callbacks.onGameOver) {
  callbacks.onGameOver({
    score: score,
    completed: false,
    reason: '골드 부족'
  });
}
```

## 🎨 CSS 변수 활용

### 테마 변수 사용
```css
/* 공통 변수 (theme.css에서 정의) */
.game-container {
  background-color: var(--color-bg);
  color: var(--color-text);
}

.button {
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}
```

## 📱 반응형 디자인 가이드

### 브레이크포인트
```css
/* 데스크톱: 기본 스타일 */

/* 태블릿 (1024px 이하) */
@media (max-width: 1024px) {
  .game-container {
    padding: var(--spacing-md);
  }
}

/* 모바일 (768px 이하) */
@media (max-width: 768px) {
  .game-container {
    padding: var(--spacing-sm);
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 작은 모바일 (480px 이하) */
@media (max-width: 480px) {
  .game-container {
    padding: var(--spacing-xs);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
```

## 🎮 게임 밸런싱 팁

### 1. 난이도 곡선
- 초반: 쉬움 (높은 성공률, 낮은 비용)
- 중반: 점진적 증가 (성공률 감소, 비용 증가)
- 후반: 어려움 (낮은 성공률, 높은 비용)

### 2. 인플레이션 시스템
- 플레이어 행동에 따라 비용 증가
- 예: 판매 횟수마다 강화 비용 1% 증가

### 3. 리스크 관리
- 실패 시 페널티 (레벨 하락, 골드 손실 등)
- 보호 시스템 (아이템, 버프 등)

### 4. 보상 시스템
- 성공 시 보상 (레벨 상승, 골드 획득 등)
- 판매 시스템 (레벨에 따른 가격 차등)

## 📝 manifest.json 구조

```json
{
  "id": "game-id",
  "title": "게임 제목",
  "titleEn": "Game Title",
  "description": "게임 설명",
  "descriptionEn": "Game Description",
  "icon": "🎮",
  "category": "puzzle|action|strategy|arcade",
  "difficulty": "easy|medium|hard",
  "version": "1.0.0"
}
```

## 🔍 디버깅 팁

### 1. 콘솔 로깅
```javascript
console.log('Game state:', { score, level, gold });
console.log('Success rate:', this.getSuccessProbability());
```

### 2. 상태 검증
```javascript
// 저장 전 검증
saveProgress() {
  const progress = {
    score: Math.max(0, score),
    level: Math.max(1, Math.min(level, 100)), // 최소 1, 최대 100
    gold: Math.max(0, gold)
  };
  Storage.saveGameProgress('game-id', progress);
}
```

### 3. 이벤트 중복 방지
```javascript
let eventsSetup = false;

setupEvents() {
  if (eventsSetup) {
    return; // 이미 설정됨
  }
  // 이벤트 설정
  eventsSetup = true;
}

reset() {
  // ...
  eventsSetup = false; // 리셋 시 플래그 초기화
  this.setupEvents();
}
```

## ✅ 체크리스트

게임 개발 시 확인할 사항:

- [ ] `init`, `render`, `setupEvents`, `reset` 메서드 구현
- [ ] `manifest.json` 파일 생성
- [ ] `game.css` 파일 생성 (반응형 디자인 포함)
- [ ] 진행 상황 저장/로드 기능
- [ ] 게임오버 처리
- [ ] 콜백 시스템 통합 (`onScoreUpdate`, `onGameOver`)
- [ ] 이벤트 위임 패턴 사용
- [ ] 중복 이벤트 방지
- [ ] 모바일 반응형 디자인
- [ ] 애니메이션 효과 (선택)
- [ ] 메시지 시스템 (선택)
- [ ] 모달 시스템 (필요 시)

## 🚀 빠른 시작 템플릿

```javascript
(function() {
  let score = 0;
  let level = 1;
  let callbacks = {};
  let container = null;
  let isGameOver = false;
  let eventsSetup = false;
  
  const Game = {
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      const saved = Storage.getGameProgress('game-id');
      if (saved) {
        score = saved.score || 0;
        level = saved.level || 1;
        isGameOver = saved.isGameOver || false;
      }
      
      this.render();
      this.setupEvents();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(score);
      }
    },
    
    render: function() {
      if (!container) return;
      
      if (isGameOver) {
        container.innerHTML = `
          <div class="game-over">
            <h2>게임 오버</h2>
            <p>최종 점수: ${score}</p>
            <button class="btn btn-primary" id="restart-btn">다시 시작</button>
          </div>
        `;
        return;
      }
      
      container.innerHTML = `
        <div class="game">
          <div class="stats">
            <div>점수: ${score}</div>
            <div>레벨: ${level}</div>
          </div>
          <button class="btn btn-primary" id="action-btn">액션</button>
        </div>
      `;
      
      this.setupEvents();
    },
    
    setupEvents: function() {
      if (eventsSetup) return;
      
      if (container) {
        container.addEventListener('click', (e) => {
          if (e.target.id === 'action-btn') {
            this.handleAction();
          } else if (e.target.id === 'restart-btn') {
            this.reset();
          }
        });
        eventsSetup = true;
      }
    },
    
    handleAction: function() {
      // 게임 로직
      score += 10;
      this.saveProgress();
      this.render();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(score);
      }
    },
    
    saveProgress: function() {
      Storage.saveGameProgress('game-id', {
        score: score,
        level: level,
        isGameOver: isGameOver
      });
    },
    
    reset: function() {
      score = 0;
      level = 1;
      isGameOver = false;
      eventsSetup = false;
      this.saveProgress();
      this.render();
      this.setupEvents();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(score);
      }
    },
    
    setMuted: function(muted) {
      // 사운드 처리
    }
  };
  
  if (typeof window !== 'undefined') {
    window.Game = Game;
  }
})();
```

## 🌐 메인 페이지 구조 및 게임 표시

### 1. 메인 페이지 레이아웃

현재 메인 페이지(`index.html`)는 다음과 같은 구조를 가집니다:

```html
<main class="container">
  <!-- 검색 박스 -->
  <div class="search-box">
    <span class="search-icon">🔍</span>
    <input type="text" id="search-input" class="search-input" placeholder="게임 검색...">
  </div>

  <!-- 이어서 하기 섹션 (선택적) -->
  <section class="continue-section" id="continue-section" style="display: none;">
    <h2 class="section-title">이어서 하기</h2>
    <div id="continue-game"></div>
  </section>

  <!-- 모든 게임 섹션 -->
  <section class="section">
    <h2 class="section-title">모든 게임</h2>
    <div class="grid grid-3" id="all-games-grid">
      <!-- 게임 카드들이 여기에 동적으로 추가됩니다 -->
    </div>
  </section>
</main>
```

**중요 사항:**
- 메인 페이지에는 **카테고리 섹션과 인기 게임 섹션이 없습니다**
- 모든 게임이 한 번에 표시됩니다 (`id="all-games-grid"`)
- 검색 기능을 통해 게임을 필터링할 수 있습니다
- `grid-3` 클래스를 사용하여 3열 그리드 레이아웃을 사용합니다

### 2. 메인 페이지 초기화 스크립트

```javascript
(async function() {
  // App 초기화 대기
  await App.init();
  
  // 모든 게임 로드
  const allGames = App.getGames();
  const allGamesGrid = document.getElementById('all-games-grid');
  UI.renderGameCards(allGamesGrid, allGames);
  
  // 이어서 하기 기능 (선택적)
  const lastPlayed = Storage.getLastPlayed();
  if (lastPlayed && lastPlayed.gameId) {
    const game = App.getGameById(lastPlayed.gameId);
    if (game) {
      const continueSection = document.getElementById('continue-section');
      const continueGame = document.getElementById('continue-game');
      continueSection.style.display = 'block';
      
      // 이어서 하기 카드 생성
      const continueCard = document.createElement('div');
      continueCard.className = 'continue-game-card';
      continueCard.onclick = () => Router.goToPlay(game.id);
      continueCard.innerHTML = `
        <div class="continue-game-icon">${game.icon}</div>
        <div>
          <div style="font-weight: 700; font-size: 1.25rem;">${game.title}</div>
          <div style="color: var(--color-text-light);">계속해서 플레이하세요!</div>
        </div>
      `;
      continueGame.appendChild(continueCard);
    }
  }
  
  // 검색 기능 설정
  const searchInput = document.getElementById('search-input');
  const handleSearch = UI.debounce((query) => {
    if (!query.trim()) {
      UI.renderGameCards(allGamesGrid, allGames);
      return;
    }
    const results = App.searchGames(query);
    UI.renderGameCards(allGamesGrid, results);
  }, 300);
  
  searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });
  
  // 페이지뷰 추적
  Analytics.trackPageView('home');
})();
```

## 🎴 게임 카드 아이콘 처리

### 1. 아이콘 타입 지원

게임 카드는 **이모지**와 **이미지 파일** 두 가지 아이콘 타입을 지원합니다:

- **이모지**: `"icon": "🎮"` (문자열)
- **이미지**: `"icon": "assets/games/omok/icon/icon.webp"` (경로 문자열)

### 2. UI.renderIcon() 메서드

`shared/ui.js`의 `renderIcon()` 메서드는 자동으로 아이콘 타입을 감지합니다:

```javascript
renderIcon(icon, className = 'game-card-icon') {
  if (!icon) return '<div class="' + className + '">🎮</div>';
  
  // 이미지 경로 감지 (http://, https://, /, ./, ../, assets/로 시작하거나 이미지 확장자 포함)
  if (icon.match(/^(https?:\/\/|\/|\.\/|\.\.\/|assets\/)/) || icon.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
    const basePath = this.getBasePath();
    const iconPath = icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') 
      ? icon 
      : basePath + icon;
    return `<img src="${iconPath}" alt="Game icon" class="${className} game-icon-image" />`;
  }
  
  // 이모지로 처리
  return `<div class="${className}">${icon}</div>`;
}
```

**중요 사항:**
- 이미지 경로는 상대 경로를 지원하며, `getBasePath()`를 통해 현재 페이지 위치에 맞게 자동 조정됩니다
- 이미지 아이콘에는 `game-icon-image` 클래스가 추가됩니다
- 이모지 아이콘은 `<div>` 요소로 렌더링됩니다

### 3. 게임 카드 아이콘 CSS 스타일

**중요:** 이미지 아이콘과 이모지 아이콘의 높이를 동일하게 맞춰야 텍스트 위치가 일치합니다:

```css
.game-card-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
  display: block;
  height: 4rem;              /* 고정 높이 필수 */
  line-height: 4rem;         /* 이모지 수직 정렬 */
  text-align: center;        /* 이모지 중앙 정렬 */
}

.game-card-icon.game-icon-image {
  width: 4rem;
  height: 4rem;              /* 이미지 고정 높이 (이모지와 동일) */
  object-fit: contain;       /* 비율 유지하며 크기 조정 */
  margin: 0 auto var(--spacing-md);
  display: block;
}
```

**핵심 포인트:**
- 이모지 아이콘: `height: 4rem` + `line-height: 4rem`으로 고정 높이와 수직 정렬 보장
- 이미지 아이콘: `width: 4rem` + `height: 4rem`으로 고정 크기 설정
- 두 타입 모두 동일한 `margin-bottom`을 사용하여 텍스트와의 간격 일치

### 4. 게임 카드 생성

```javascript
createGameCard(game) {
  const card = document.createElement('div');
  card.className = 'card game-card';
  card.dataset.gameId = game.id;
  
  const isFavorite = Storage.isFavorite(game.id);
  
  card.innerHTML = `
    ${isFavorite ? '<div class="game-card-badge">⭐</div>' : ''}
    ${this.renderIcon(game.icon)}  <!-- 아이콘 자동 렌더링 -->
    <div class="game-card-title">${game.title}</div>
    <div class="game-card-description">${game.description}</div>
    <button class="btn btn-primary">플레이</button>
  `;
  
  return card;
}
```

## 📐 UI 컴포넌트 스타일링 가이드

### 1. 게임 카드 스타일

```css
.game-card {
  cursor: pointer;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.game-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text);
}

.game-card-description {
  font-size: 0.875rem;
  color: var(--color-text-light);
  margin-bottom: var(--spacing-md);
}
```

### 2. 그리드 레이아웃

```css
.grid {
  display: grid;
  gap: var(--spacing-lg);
}

.grid-3 {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .grid-3 {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
```

### 3. 검색 박스

```css
.search-box {
  position: relative;
  margin-bottom: var(--spacing-xl);
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  font-size: 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg-card);
  transition: border-color var(--transition-fast);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  color: var(--color-text-lighter);
}
```

## 🔍 데이터 구조 및 API 사용

### 1. 게임 데이터 구조 (data/games.json)

```json
{
  "id": "game-id",
  "title": "게임 제목",
  "titleEn": "Game Title",
  "category": "action|puzzle|math|board",
  "difficulty": "easy|medium|hard",
  "description": "게임 설명",
  "descriptionEn": "Game Description",
  "icon": "🎮",  // 또는 "assets/games/game-id/icon/icon.webp"
  "tags": ["태그1", "태그2"],
  "popularity": 95,
  "releaseDate": "2024-01-01"
}
```

### 2. App API 사용법

```javascript
// App 초기화 (필수)
await App.init();

// 모든 게임 가져오기
const allGames = App.getGames();

// ID로 게임 찾기
const game = App.getGameById('game-id');

// 카테고리로 게임 필터링
const games = App.getGamesByCategory('puzzle');

// 게임 검색
const results = App.searchGames('검색어');

// 필터 및 정렬
const filtered = App.filterAndSortGames(allGames, {
  category: 'puzzle',
  difficulty: 'medium',
  sort: 'popular'  // 또는 'new'
});
```

### 3. UI API 사용법

```javascript
// 게임 카드 렌더링
UI.renderGameCards(containerElement, gamesArray);

// 카테고리 카드 렌더링
UI.renderCategoryCards(containerElement, categoriesArray);

// 아이콘 렌더링
const iconHTML = UI.renderIcon(game.icon);

// 디바운스 함수 (검색 등에 사용)
const debouncedSearch = UI.debounce((query) => {
  // 검색 로직
}, 300);
```

## ⚠️ 주의사항 및 베스트 프랙티스

### 1. 아이콘 처리 시 주의사항

- **이미지 아이콘 사용 시**: `assets/games/[game-id]/icon/icon.webp` 경로를 사용하는 것을 권장합니다
- **이모지 아이콘 사용 시**: 단일 이모지 문자를 사용하세요 (예: `"🎮"`)
- **아이콘 높이**: CSS에서 이모지와 이미지 모두 동일한 높이(`4rem`)를 사용해야 텍스트 정렬이 일치합니다

### 2. 메인 페이지 수정 시

- **절대 제거하지 말 것**: 검색 박스, 모든 게임 섹션
- **추가 가능**: 이어서 하기 섹션은 선택적이지만, 이미 구현되어 있음
- **그리드 클래스**: `grid-3`을 사용하여 일관된 레이아웃 유지

### 3. 게임 카드 스타일 수정 시

- 아이콘 높이를 변경하면 이모지와 이미지 모두 동일하게 변경해야 합니다
- `margin-bottom` 값도 일치시켜야 텍스트 위치가 일관됩니다
- 반응형 디자인을 고려하여 모바일에서도 적절한 크기를 유지해야 합니다

---

## 🌐 다국어 지원 시스템 (i18n)

### 현재 구현 상태 (2024년 기준)

사이트는 한국어(ko), 영어(en), 번체 중국어(zh-HK, 홍콩) 3가지 언어를 지원합니다.

### 1. 번역 파일 구조

번역 파일은 `data/i18n/` 디렉토리에 언어별 JSON 파일로 관리됩니다:
- `data/i18n/ko.json` - 한국어
- `data/i18n/en.json` - 영어  
- `data/i18n/zh-HK.json` - 번체 중국어(홍콩)

### 2. 번역 파일 구조 예시

```json
{
  "site": {
    "name": "하이 플레이그라운드",
    "tagline": "재미있는 미니 게임 놀이터"
  },
  "nav": {
    "home": "홈",
    "games": "게임",
    "about": "소개"
  },
  "games": {
    "title": "게임 목록",
    "play": "플레이"
  },
  "play": {
    "back": "뒤로",
    "reset": "리셋",
    "fullscreen": "전체화면",
    "mute": "음소거"
  },
  "games": {
    "[game-id]": {
      "title": "게임 제목",
      "description": "게임 설명",
      "howToPlay": {
        "title": "게임 방법",
        "steps": ["1단계", "2단계", ...]
      },
      "strategy": {
        "title": "공략 팁",
        "tips": ["팁1", "팁2", ...]
      },
      "about": {
        "title": "게임 소개",
        "description": "상세 설명"
      }
    }
  }
}
```

### 3. HTML에서 번역 사용

HTML 요소에 `data-i18n` 속성을 추가하여 자동 번역:

```html
<h1 data-i18n="site.name">하이 플레이그라운드</h1>
<a data-i18n="nav.home">홈</a>
<button data-i18n-title="play.back" title="뒤로">←</button>
<input data-i18n="home.search" placeholder="게임 검색...">
```

- `data-i18n`: 요소의 텍스트 내용을 번역
- `data-i18n-title`: 요소의 title 속성을 번역 (버튼 툴팁 등)

### 4. JavaScript에서 번역 사용

```javascript
// 기본 번역 함수
const text = I18n.t('nav.home'); // "홈" 또는 "Home" 등

// 중첩된 키 지원
const text = I18n.t('games.clicker.title');

// 기본값 제공
const text = I18n.t('games.unknown.title', '기본 제목');
```

### 5. 언어 변경 시스템

사용자가 언어를 선택하면:
1. `I18n.setLanguage(lang)` 호출
2. 번역 파일 로드
3. `translatePage()` 함수가 `data-i18n` 속성을 가진 모든 요소를 자동으로 번역
4. 언어 설정이 localStorage에 저장되어 다음 방문 시에도 유지

### 6. 게임 설명 번역

게임 설명은 `data/i18n/*.json` 파일의 `games.[game-id]` 섹션에 저장됩니다.

현재 구조:
- 각 게임별로 `howToPlay`, `strategy`, `about` 섹션 지원
- `howToPlay.steps`는 배열로 단계별 설명
- `strategy.tips`는 배열로 팁 목록
- `about.description`은 문자열로 상세 설명

### 7. Manifest.json 번역

게임의 `manifest.json` 파일에는 기본 한국어 title/description이 있고, 영어 버전은 `titleEn`/`descriptionEn`으로 제공됩니다.

번역 시스템에서는 `data/i18n/*.json`의 `games.[game-id].title`과 `games.[game-id].description`을 우선 사용하며, 없으면 manifest의 값을 사용합니다.

### 8. 게임 번역 시스템 통합 (2024년 구현 완료)

게임 제목, 설명, 상세 설명(howToPlay, strategy, about)이 번역 시스템과 통합되었습니다.

#### 8.1 I18n 헬퍼 함수

`assets/js/i18n.js`에 다음 함수들이 추가되었습니다:

- `I18n.getGameTitle(gameId, manifest, gameData)`: 게임 제목을 현재 언어로 가져옴
- `I18n.getGameDescription(gameId, manifest, gameData)`: 게임 설명을 현재 언어로 가져옴
- `I18n.getGameDescriptionData(gameId)`: 게임 상세 설명(howToPlay, strategy, about)을 현재 언어로 가져옴

이 함수들은 다음 순서로 fallback을 사용합니다:
1. `data/i18n/*.json`의 `games.[gameId]` 섹션 (우선순위)
2. manifest.json의 `titleEn`/`descriptionEn` (영어만)
3. manifest.json의 `title`/`description` (한국어 기본값)
4. GameDescriptions 객체 (게임 설명만)

#### 8.2 번역 데이터 구조

게임 번역 데이터는 `data/i18n/*.json` 파일의 `games` 섹션에 추가합니다:

```json
{
  "games": {
    "clicker": {
      "title": "클리커 게임",
      "description": "빠르게 클릭해서 점수를 모아보세요!",
      "howToPlay": {
        "title": "게임 방법",
        "steps": [
          "시작 버튼을 클릭하여 게임을 시작합니다.",
          "화면 중앙의 큰 버튼을 클릭하여 에너지를 모읍니다."
        ]
      },
      "strategy": {
        "title": "공략 팁",
        "tips": [
          "초반에는 수동 클릭으로 에너지를 모은 후...",
          "업그레이드 비용은 구매할 때마다 1.25배씩 증가..."
        ]
      },
      "about": {
        "title": "게임 소개",
        "description": "클리커 게임은 단순하면서도 중독성 있는..."
      }
    }
  }
}
```

#### 8.3 자동 번역 시스템

- `game-shell.js`의 `setupUI()`에서 `I18n.getGameTitle()`을 사용하여 게임 제목을 자동으로 번역
- `pages/play.html`의 `loadGameDescription()`에서 `I18n.getGameDescriptionData()`를 사용하여 게임 설명을 자동으로 번역
- 언어 변경 시 (`i18n:loaded` 이벤트) 게임 제목과 설명이 자동으로 업데이트됨

#### 8.4 작업 예정 사항

- [ ] 모든 게임 설명을 3개 언어(ko, en, zh-HK)로 번역하여 `data/i18n/*.json`에 추가
- [ ] 각 게임의 manifest.json에서 title/description 번역 데이터 추가 (선택사항)
- [ ] 게임 내 텍스트들도 번역 시스템에 통합 (게임별로 필요시)

### 9. 언어 선택 UI

우측 상단에 지구본 아이콘(🌐)이 있으며, 클릭하면 언어 선택 드롭다운이 나타납니다:
- 한국어
- English  
- 繁體中文(香港)

---

이 프롬프트를 참고하여 새로운 게임을 개발할 때, 위의 패턴과 구조를 따라가면 일관성 있고 유지보수하기 쉬운 코드를 작성할 수 있습니다.

