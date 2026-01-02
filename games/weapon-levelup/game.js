/**
 * Weapon Level Up Game
 * Upgrade your weapon at the blacksmith, sell it at the shop
 */

(function() {
  let weaponLevel = 1;
  let gold = 50; // 초기 골드 감소 (100 -> 50)
  let totalUpgrades = 0;
  let successfulUpgrades = 0;
  let sellCount = 0; // 판매 횟수 (인플레이션 계산용)
  let storedWeaponLevel = 0; // 보관된 무기 레벨 (0이면 보관된 무기 없음)
  let callbacks = {};
  let container = null;
  let isGameOver = false;
  let eventsSetup = false; // 이벤트 리스너가 이미 등록되었는지 확인
  
  // Game state
  const Game = {
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      // Load saved progress if available
      const saved = Storage.getGameProgress('weapon-levelup');
      if (saved) {
        weaponLevel = Math.max(1, Math.min(saved.weaponLevel || 1, 100)); // 최소 1, 최대 100
        gold = saved.gold || 50;
        totalUpgrades = saved.totalUpgrades || 0;
        successfulUpgrades = saved.successfulUpgrades || 0;
        sellCount = saved.sellCount || 0;
        storedWeaponLevel = saved.storedWeaponLevel || 0;
        isGameOver = saved.isGameOver || false;
      } else {
        // 새 게임 시작 시 레벨 1로 초기화
        weaponLevel = 1;
      }
      
      // Check game over state
      this.checkGameOver();
      
      this.render();
      this.setupEvents();
      
      // Update score display
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(weaponLevel);
      }
    },
    
    /**
     * Calculate upgrade cost for a specific level
     * 인플레이션: 판매 횟수마다 1%씩 비용 증가
     * 강화 비용 증가: 레벨당 20 + 15 (더 비싸게 조정)
     */
    getUpgradeCost(level = weaponLevel) {
      const baseCost = Math.floor(level * 20 + 15);
      const inflationMultiplier = 1 + (sellCount * 0.01); // 판매 횟수마다 1% 증가
      return Math.floor(baseCost * inflationMultiplier);
    },
    
    /**
     * Check if game is over (can't afford level 2 upgrade from level 1)
     */
    checkGameOver() {
      if (weaponLevel === 1) {
        const level2Cost = this.getUpgradeCost(1);
        if (gold < level2Cost) {
          isGameOver = true;
          return true;
        }
      }
      isGameOver = false;
      return false;
    },
    
    /**
     * Calculate success probability (decreases as level increases)
     * 레벨 1: 99%, 레벨 80: 20%, 레벨 100: 20% (최소값)
     * 더 빠르게 감소하여 난이도 증가
     */
    getSuccessProbability() {
      const baseProbability = 100 - (weaponLevel * 1.0);
      return Math.max(20, baseProbability); // Minimum 20%
    },
    
    /**
     * Calculate sell price
     * 레벨 제곱에 25을 곱한 후 레벨에 60을 곱한 값을 더함
     * 판매 가격 감소로 골드 획득량 줄임 (난이도 증가)
     * 레벨 1: 85, 레벨 10: 3,110, 레벨 50: 62,810, 레벨 100: 250,610
     */
    getSellPrice() {
      return Math.floor(weaponLevel * weaponLevel * 25 + weaponLevel * 60 + 30);
    },
    
    /**
     * Attempt weapon upgrade
     */
    attemptUpgrade() {
      // 최대 레벨 체크
      if (weaponLevel >= 100) {
        this.showMessage('이미 최대 레벨(100)에 도달했습니다!', 'error');
        return;
      }
      
      const cost = this.getUpgradeCost();
      
      if (gold < cost) {
        this.showMessage('골드가 부족합니다!', 'error');
        return;
      }
      
      // 현재 레벨을 저장 (레벨업 전)
      const currentLevelBeforeUpgrade = weaponLevel;
      
      // 버튼 비활성화 및 강화 시작 애니메이션
      const upgradeBtn = document.getElementById('upgrade-btn');
      if (upgradeBtn) {
        upgradeBtn.disabled = true;
        upgradeBtn.textContent = '강화 중...';
      }
      
      // 강화 시작 애니메이션
      this.playUpgradeAnimation();
      
      // Deduct cost
      gold -= cost;
      totalUpgrades++;
      
      // Calculate success
      const successRate = this.getSuccessProbability();
      const isSuccess = Math.random() * 100 < successRate;
      
      // 결과 표시를 약간의 딜레이 후에 (애니메이션 효과를 위해)
      setTimeout(() => {
        let resultMessage = '';
        let resultType = '';
        
        if (isSuccess) {
          // 최대 레벨 체크
          if (weaponLevel >= 100) {
            resultMessage = '이미 최대 레벨에 도달했습니다!';
            resultType = 'error';
          } else {
            // 레벨 1씩 증가 (레벨 1 -> 2, 레벨 2 -> 3, ...)
            // setTimeout 내부에서도 현재 레벨을 확인
            const levelBeforeIncrease = weaponLevel;
            weaponLevel = levelBeforeIncrease + 1; // 정확히 1씩 증가
            if (weaponLevel > 100) {
              weaponLevel = 100; // 최대 100으로 제한
            }
            successfulUpgrades++;
            resultMessage = '강화 성공! 🎉';
            resultType = 'success';
            isGameOver = false; // Game is not over if we succeeded
          }
        } else {
          // 실패 시 무기가 레벨 1로 떨어짐 (보관된 무기가 있으면 자동으로 적용)
          const oldLevel = weaponLevel;
          
          if (storedWeaponLevel > 0) {
            // 보관된 무기가 있으면 자동으로 적용
            weaponLevel = storedWeaponLevel;
            storedWeaponLevel = 0; // 보관된 무기 사용
            resultMessage = `강화 실패! 💔\n보관된 레벨 ${weaponLevel} 무기가 자동으로 장착되었습니다!`;
            resultType = 'info';
            isGameOver = false; // 보관된 무기가 있으면 게임오버 아님
          } else {
            // 보관된 무기가 없으면 레벨 1로 떨어짐
            weaponLevel = 1;
            resultMessage = '강화 실패! 💔';
            resultType = 'error';
            
            // 게임오버 체크
            if (this.checkGameOver()) {
              setTimeout(() => {
                this.handleGameOver();
              }, 2000); // 2초 후 게임오버 화면 표시
            }
          }
        }
        
        this.saveProgress();
        this.render();
        
        // render() 후에 메시지 표시 (DOM이 다시 생성된 후)
        setTimeout(() => {
          this.showUpgradeResult(resultMessage, resultType);
          if (isSuccess) {
            this.playSuccessAnimation();
          } else {
            this.playFailAnimation();
          }
        }, 50);
        
        if (callbacks.onScoreUpdate) {
          callbacks.onScoreUpdate(weaponLevel);
        }
      }, 1500); // 1.5초 딜레이
    },
    
    /**
     * Store current weapon
     */
    storeWeapon() {
      if (weaponLevel === 1) {
        this.showMessage('레벨 1 무기는 보관할 수 없습니다!', 'error');
        return;
      }
      
      if (storedWeaponLevel > 0) {
        this.showMessage(`이미 레벨 ${storedWeaponLevel} 무기가 보관되어 있습니다!`, 'error');
        return;
      }
      
      storedWeaponLevel = weaponLevel;
      weaponLevel = 1; // 현재 무기는 레벨 1로 변경
      this.showMessage(`레벨 ${storedWeaponLevel} 무기를 보관했습니다! 🗄️`, 'success');
      
      this.saveProgress();
      this.render();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(weaponLevel);
      }
    },
    
    /**
     * Sell weapon at shop
     */
    sellWeapon() {
      if (weaponLevel === 1) {
        this.showMessage('레벨 1 무기는 팔 수 없습니다!', 'error');
        return;
      }
      
      const sellPrice = this.getSellPrice();
      gold += sellPrice;
      const oldLevel = weaponLevel;
      weaponLevel = 1;
      sellCount++; // 판매 횟수 증가 (인플레이션)
      
      const inflationPercent = Math.round(sellCount * 1);
      this.showMessage(`레벨 ${oldLevel} 무기를 ${sellPrice} 골드에 판매했습니다! 💰\n(강화 비용이 ${inflationPercent}% 증가했습니다)`, 'success');
      this.playSellAnimation();
      
      // 게임오버 상태 해제 (판매로 골드를 얻었으므로)
      isGameOver = false;
      
      this.saveProgress();
      this.render();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(weaponLevel);
      }
    },
    
    /**
     * Handle game over
     */
    handleGameOver() {
      isGameOver = true;
      this.saveProgress();
      
      // Track game over
      if (callbacks.onGameOver) {
        callbacks.onGameOver({
          score: weaponLevel,
          completed: false,
          reason: '골드 부족'
        });
      }
      
      this.render();
    },
    
    /**
     * Show message
     */
    showMessage(message, type = 'info') {
      const messageEl = document.getElementById('weapon-message');
      if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `weapon-message ${type}`;
        
        // Clear message after 3 seconds
        setTimeout(() => {
          messageEl.textContent = '';
          messageEl.className = 'weapon-message';
        }, 3000);
      }
    },
    
    /**
     * Show upgrade result with animation
     */
    showUpgradeResult(message, type = 'info') {
      const messageEl = document.getElementById('weapon-message');
      if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `weapon-message ${type} upgrade-result`;
        
        // Clear message after 4 seconds
        setTimeout(() => {
          messageEl.textContent = '';
          messageEl.className = 'weapon-message';
        }, 4000);
      }
    },
    
    /**
     * Play upgrade animation (before result)
     */
    playUpgradeAnimation() {
      const weaponEl = document.getElementById('weapon-display');
      if (weaponEl) {
        weaponEl.classList.add('upgrade-animation');
        // 애니메이션은 CSS에서 지속 시간을 설정
      }
    },
    
    /**
     * Play success animation
     */
    playSuccessAnimation() {
      const weaponEl = document.getElementById('weapon-display');
      if (weaponEl) {
        weaponEl.classList.remove('upgrade-animation');
        weaponEl.classList.add('success-animation');
        setTimeout(() => {
          weaponEl.classList.remove('success-animation');
        }, 1000);
      }
    },
    
    /**
     * Play fail animation
     */
    playFailAnimation() {
      const weaponEl = document.getElementById('weapon-display');
      if (weaponEl) {
        weaponEl.classList.remove('upgrade-animation');
        weaponEl.classList.add('fail-animation');
        setTimeout(() => {
          weaponEl.classList.remove('fail-animation');
        }, 1000);
      }
    },
    
    /**
     * Play sell animation
     */
    playSellAnimation() {
      const weaponEl = document.getElementById('weapon-display');
      if (weaponEl) {
        weaponEl.classList.add('sell-animation');
        setTimeout(() => {
          weaponEl.classList.remove('sell-animation');
        }, 500);
      }
    },
    
    /**
     * Save progress
     */
    saveProgress() {
      Storage.saveGameProgress('weapon-levelup', {
        weaponLevel: weaponLevel,
        gold: gold,
        totalUpgrades: totalUpgrades,
        successfulUpgrades: successfulUpgrades,
        sellCount: sellCount,
        storedWeaponLevel: storedWeaponLevel,
        isGameOver: isGameOver
      });
    },
    
    render: function() {
      if (!container) return;
      
      // 게임오버 화면 표시
      if (isGameOver) {
        const level2Cost = this.getUpgradeCost(1);
        container.innerHTML = `
          <div class="weapon-game">
            <div class="weapon-game-over">
              <div class="game-over-icon">💀</div>
              <h2 class="game-over-title">게임 오버</h2>
              <p class="game-over-message">
                레벨 2로 올라가기 위한 골드(${level2Cost.toLocaleString()})가 부족합니다!
              </p>
              <div class="game-over-stats">
                <div class="game-over-stat">
                  <span>최종 무기 레벨:</span>
                  <strong>${weaponLevel}</strong>
                </div>
                <div class="game-over-stat">
                  <span>보유 골드:</span>
                  <strong>${gold.toLocaleString()}</strong>
                </div>
                <div class="game-over-stat">
                  <span>총 강화 시도:</span>
                  <strong>${totalUpgrades}</strong>
                </div>
                <div class="game-over-stat">
                  <span>성공한 강화:</span>
                  <strong>${successfulUpgrades}</strong>
                </div>
              </div>
              <button class="btn btn-primary btn-large" id="restart-btn">
                다시 시작하기
              </button>
            </div>
          </div>
        `;
        
        // restart 버튼은 이벤트 위임으로 처리 (setupEvents에서)
        return;
      }
      
      const upgradeCost = this.getUpgradeCost();
      const successRate = this.getSuccessProbability();
      const sellPrice = this.getSellPrice();
      const successRatePercent = Math.round(successRate);
      const inflationPercent = sellCount > 0 ? Math.round(sellCount * 1) : 0;
      const isMaxLevel = weaponLevel >= 100;
      
      container.innerHTML = `
        <div class="weapon-game">
          <div class="weapon-header">
            <h2 class="weapon-title">⚔️ 내 무기만 레벨업</h2>
          </div>
          
          <div class="weapon-stats">
            <div class="weapon-stat-card">
              <div class="weapon-stat-icon">💰</div>
              <div class="weapon-stat-label">골드</div>
              <div class="weapon-stat-value" id="gold-display">${gold.toLocaleString()}</div>
            </div>
            <div class="weapon-stat-card">
              <div class="weapon-stat-icon">⚔️</div>
              <div class="weapon-stat-label">무기 레벨</div>
              <div class="weapon-stat-value" id="level-display">${weaponLevel}${isMaxLevel ? ' (최대)' : ''}</div>
            </div>
            <div class="weapon-stat-card">
              <div class="weapon-stat-icon">📊</div>
              <div class="weapon-stat-label">성공률</div>
              <div class="weapon-stat-value">${successRatePercent}%</div>
            </div>
          </div>
          
          ${inflationPercent > 0 ? `
          <div class="weapon-inflation-notice">
            <span class="inflation-icon">📈</span>
            <span>인플레이션: 강화 비용이 <strong>${inflationPercent}%</strong> 증가했습니다</span>
          </div>
          ` : ''}
          
          <div class="weapon-main-layout">
            <div class="weapon-action-section weapon-action-left">
              <h3 class="weapon-section-title">🔨 대장간</h3>
              <div class="weapon-action-info">
                <p>비용: <strong>${upgradeCost.toLocaleString()}</strong> 골드</p>
                <p>성공 확률: <strong>${successRatePercent}%</strong></p>
                <p style="color: var(--color-error); font-weight: 600;">⚠️ 실패 시 ${storedWeaponLevel > 0 ? `보관된 레벨 ${storedWeaponLevel} 무기로 변경됩니다!` : '레벨 1로 떨어집니다!'}</p>
              </div>
              <button 
                class="btn btn-primary weapon-action-btn" 
                id="upgrade-btn"
                ${gold < upgradeCost || isMaxLevel ? 'disabled' : ''}
              >
                ${isMaxLevel ? '최대 레벨 도달' : '무기 강화하기'}
              </button>
            </div>
            
            <div class="weapon-display-area">
              <div class="weapon-display" id="weapon-display">
                <div class="weapon-icon">${this.getWeaponImageHTML()}</div>
                <div class="weapon-level-badge">Lv.${weaponLevel}</div>
              </div>
              <div class="weapon-message" id="weapon-message"></div>
            </div>
            
            <div class="weapon-action-section weapon-action-right">
              <h3 class="weapon-section-title">🏪 상점</h3>
              <div class="weapon-action-info">
                <p>판매 가격: <strong>${sellPrice.toLocaleString()}</strong> 골드</p>
                <p>판매 후 레벨 1 무기로 돌아갑니다</p>
              </div>
              <button 
                class="btn btn-secondary weapon-action-btn" 
                id="sell-btn"
                ${weaponLevel === 1 ? 'disabled' : ''}
              >
                무기 판매하기
              </button>
              
              <h3 class="weapon-section-title" style="margin-top: var(--spacing-xl);">🗄️ 무기 보관</h3>
              <div class="weapon-action-info">
                ${storedWeaponLevel > 0 ? `
                  <p>보관 중: <strong>레벨 ${storedWeaponLevel}</strong> 무기</p>
                  <p style="color: var(--color-success); font-weight: 600;">강화 실패 시 자동으로 장착됩니다!</p>
                ` : `
                  <p>현재 무기를 보관합니다</p>
                  <p>보관된 무기는 강화 실패 시 자동으로 장착됩니다</p>
                `}
              </div>
              <button 
                class="btn btn-secondary weapon-action-btn" 
                id="store-btn"
                ${weaponLevel === 1 || storedWeaponLevel > 0 ? 'disabled' : ''}
              >
                ${storedWeaponLevel > 0 ? '보관 완료' : '무기 보관하기'}
              </button>
            </div>
          </div>
          
          <div class="weapon-stats-detail">
            <div class="weapon-detail-item">
              <span>총 강화 시도:</span>
              <strong>${totalUpgrades}</strong>
            </div>
            <div class="weapon-detail-item">
              <span>성공한 강화:</span>
              <strong>${successfulUpgrades}</strong>
            </div>
            ${totalUpgrades > 0 ? `
            <div class="weapon-detail-item">
              <span>성공률:</span>
              <strong>${Math.round((successfulUpgrades / totalUpgrades) * 100)}%</strong>
            </div>
            ` : ''}
          </div>
        </div>
      `;
      
      this.setupEvents();
      
      // Setup weapon image aspect ratio after render
      setTimeout(() => {
        this.setupWeaponImageAspectRatio();
      }, 100);
    },
    
    /**
     * Setup weapon image to maintain aspect ratio
     */
    setupWeaponImageAspectRatio() {
      const imageEl = document.querySelector('.weapon-image');
      if (!imageEl) return;
      
      // Load image to maintain aspect ratio
      // Each weapon image is 204.8px (1024/5) wide x 1024px tall
      // Aspect ratio: 204.8/1024 = 0.2 (width:height = 1:5)
      const img = new Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const aspectRatio = naturalWidth / naturalHeight;
        
        // Update container to maintain image aspect ratio
        const iconEl = imageEl.closest('.weapon-icon');
        if (iconEl) {
          const currentWidth = parseFloat(getComputedStyle(iconEl).width) || 150;
          // Height should be width / aspectRatio
          const calculatedHeight = currentWidth / aspectRatio;
          // Limit max height to prevent too tall images (2.5x width is reasonable for display)
          const maxHeight = currentWidth * 2.5;
          iconEl.style.height = Math.min(calculatedHeight, maxHeight) + 'px';
        }
      };
      img.onerror = () => {
        console.warn('Failed to load weapon image:', imageEl.src);
      };
      img.src = imageEl.src;
    },
    
    /**
     * Get weapon image HTML based on level
     * Uses individual WebP files for each weapon level
     */
    getWeaponImageHTML() {
      // Each level has its own WebP file: weapon-levelup01.webp, weapon-levelup02.webp, etc.
      const fileName = `weapon-levelup${String(weaponLevel).padStart(2, '0')}.webp`;
      
      // Image path (relative from pages/play.html)
      const imagePath = `../assets/games/weapon-levelup/images/webp/${fileName}`;
      
      return `<img class="weapon-image" src="${imagePath}" alt="Weapon Level ${weaponLevel}" />`;
    },
    
    setupEvents: function() {
      // 이벤트 리스너가 이미 등록되었다면 다시 등록하지 않음 (중복 방지)
      if (eventsSetup) {
        return;
      }
      
      // 이벤트 위임을 사용하여 container에 한 번만 등록
      if (container) {
        container.addEventListener('click', (e) => {
          if (e.target && e.target.id === 'upgrade-btn') {
            e.preventDefault();
            this.attemptUpgrade();
          } else if (e.target && e.target.id === 'sell-btn') {
            e.preventDefault();
            if (confirm(`레벨 ${weaponLevel} 무기를 ${this.getSellPrice().toLocaleString()} 골드에 판매하시겠습니까?`)) {
              this.sellWeapon();
            }
          } else if (e.target && e.target.id === 'store-btn') {
            e.preventDefault();
            if (confirm(`레벨 ${weaponLevel} 무기를 보관하시겠습니까?\n(보관된 무기는 강화 실패 시 자동으로 장착됩니다)`)) {
              this.storeWeapon();
            }
          } else if (e.target && e.target.id === 'restart-btn') {
            e.preventDefault();
            this.reset();
          }
        });
        eventsSetup = true;
      }
    },
    
    reset: function() {
      weaponLevel = 1; // 시작 레벨 1
      gold = 50; // 초기 골드 감소
      totalUpgrades = 0;
      successfulUpgrades = 0;
      sellCount = 0;
      storedWeaponLevel = 0; // 보관된 무기 초기화
      isGameOver = false;
      eventsSetup = false; // 이벤트 리스너 재등록을 위해 리셋
      this.saveProgress();
      this.render();
      this.setupEvents(); // 이벤트 리스너 다시 등록
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(weaponLevel);
      }
    },
    
    setMuted: function(muted) {
      // This game doesn't use sound
    }
  };
  
  // Export game
  if (typeof window !== 'undefined') {
    window.Game = Game;
  }
})();

