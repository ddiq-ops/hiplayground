/**
 * Weapon Level Up Game
 * Upgrade your weapon at the blacksmith, sell it at the shop
 */

(function() {
  let weaponLevel = 1;
  let gold = 100;
  let totalUpgrades = 0;
  let successfulUpgrades = 0;
  let callbacks = {};
  let container = null;
  let isGameOver = false;
  
  // Game state
  const Game = {
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      // Load saved progress if available
      const saved = Storage.getGameProgress('weapon-levelup');
      if (saved) {
        weaponLevel = saved.weaponLevel || 1;
        gold = saved.gold || 100;
        totalUpgrades = saved.totalUpgrades || 0;
        successfulUpgrades = saved.successfulUpgrades || 0;
        isGameOver = saved.isGameOver || false;
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
     */
    getUpgradeCost(level = weaponLevel) {
      return Math.floor(level * 15 + 10);
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
     */
    getSuccessProbability() {
      const baseProbability = 100 - (weaponLevel * 4);
      return Math.max(10, baseProbability); // Minimum 10%
    },
    
    /**
     * Calculate reward for successful upgrade
     */
    getUpgradeReward() {
      return Math.floor(weaponLevel * 25 + 20);
    },
    
    /**
     * Calculate sell price
     */
    getSellPrice() {
      return Math.floor(weaponLevel * weaponLevel * 60 + 50);
    },
    
    /**
     * Attempt weapon upgrade
     */
    attemptUpgrade() {
      const cost = this.getUpgradeCost();
      
      if (gold < cost) {
        this.showMessage('골드가 부족합니다!', 'error');
        return;
      }
      
      // Deduct cost
      gold -= cost;
      totalUpgrades++;
      
      // Calculate success
      const successRate = this.getSuccessProbability();
      const isSuccess = Math.random() * 100 < successRate;
      
      if (isSuccess) {
        weaponLevel++;
        successfulUpgrades++;
        const reward = this.getUpgradeReward();
        gold += reward;
        
        this.showMessage(`레벨업 성공! +${reward} 골드 획득! 🎉`, 'success');
        this.playSuccessAnimation();
        isGameOver = false; // Game is not over if we succeeded
      } else {
        // 실패 시 무기가 레벨 1로 떨어짐
        const oldLevel = weaponLevel;
        weaponLevel = 1;
        
        this.showMessage(`레벨업 실패! 무기가 레벨 1로 떨어졌습니다... 💔`, 'error');
        this.playFailAnimation();
        
        // 게임오버 체크
        if (this.checkGameOver()) {
          this.handleGameOver();
        }
      }
      
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
      
      this.showMessage(`레벨 ${oldLevel} 무기를 ${sellPrice} 골드에 판매했습니다! 💰`, 'success');
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
     * Play success animation
     */
    playSuccessAnimation() {
      const weaponEl = document.getElementById('weapon-display');
      if (weaponEl) {
        weaponEl.classList.add('success-animation');
        setTimeout(() => {
          weaponEl.classList.remove('success-animation');
        }, 500);
      }
    },
    
    /**
     * Play fail animation
     */
    playFailAnimation() {
      const weaponEl = document.getElementById('weapon-display');
      if (weaponEl) {
        weaponEl.classList.add('fail-animation');
        setTimeout(() => {
          weaponEl.classList.remove('fail-animation');
        }, 500);
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
        
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
          restartBtn.addEventListener('click', () => {
            this.reset();
          });
        }
        return;
      }
      
      const upgradeCost = this.getUpgradeCost();
      const successRate = this.getSuccessProbability();
      const sellPrice = this.getSellPrice();
      const successRatePercent = Math.round(successRate);
      
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
              <div class="weapon-stat-value" id="level-display">${weaponLevel}</div>
            </div>
            <div class="weapon-stat-card">
              <div class="weapon-stat-icon">📊</div>
              <div class="weapon-stat-label">성공률</div>
              <div class="weapon-stat-value">${successRatePercent}%</div>
            </div>
          </div>
          
          <div class="weapon-display-area">
            <div class="weapon-display" id="weapon-display">
              <div class="weapon-icon">${this.getWeaponIcon()}</div>
              <div class="weapon-level-badge">Lv.${weaponLevel}</div>
            </div>
            <div class="weapon-message" id="weapon-message"></div>
          </div>
          
          <div class="weapon-actions">
            <div class="weapon-action-section">
              <h3 class="weapon-section-title">🔨 대장간</h3>
              <div class="weapon-action-info">
                <p>비용: <strong>${upgradeCost.toLocaleString()}</strong> 골드</p>
                <p>성공 확률: <strong>${successRatePercent}%</strong></p>
                <p>성공 시 보상: <strong>${this.getUpgradeReward().toLocaleString()}</strong> 골드</p>
                <p style="color: var(--color-error); font-weight: 600;">⚠️ 실패 시 레벨 1로 떨어집니다!</p>
              </div>
              <button 
                class="btn btn-primary weapon-action-btn" 
                id="upgrade-btn"
                ${gold < upgradeCost ? 'disabled' : ''}
              >
                무기 강화하기
              </button>
            </div>
            
            <div class="weapon-action-section">
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
    },
    
    /**
     * Get weapon icon based on level
     */
    getWeaponIcon() {
      if (weaponLevel >= 20) return '🗡️';
      if (weaponLevel >= 15) return '⚔️';
      if (weaponLevel >= 10) return '🔪';
      if (weaponLevel >= 5) return '🗡️';
      return '⚔️';
    },
    
    setupEvents: function() {
      const upgradeBtn = document.getElementById('upgrade-btn');
      if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
          this.attemptUpgrade();
        });
      }
      
      const sellBtn = document.getElementById('sell-btn');
      if (sellBtn) {
        sellBtn.addEventListener('click', () => {
          if (confirm(`레벨 ${weaponLevel} 무기를 ${this.getSellPrice().toLocaleString()} 골드에 판매하시겠습니까?`)) {
            this.sellWeapon();
          }
        });
      }
    },
    
    reset: function() {
      weaponLevel = 1;
      gold = 100;
      totalUpgrades = 0;
      successfulUpgrades = 0;
      isGameOver = false;
      this.saveProgress();
      this.render();
      
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

