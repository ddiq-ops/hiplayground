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

---

이 프롬프트를 참고하여 새로운 게임을 개발할 때, 위의 패턴과 구조를 따라가면 일관성 있고 유지보수하기 쉬운 코드를 작성할 수 있습니다.

