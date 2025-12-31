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
      }
      
      this.render();
      this.setupEvents();
      
      // Update score display
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(weaponLevel);
      }
    },
    
    /**
     * Calculate upgrade cost
     */
    getUpgradeCost() {
      return Math.floor(weaponLevel * 15 + 10);
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
      } else {
        this.showMessage(`레벨업 실패... 다시 시도해보세요! 💪`, 'error');
        this.playFailAnimation();
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
      
      this.saveProgress();
      this.render();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(weaponLevel);
      }
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
        successfulUpgrades: successfulUpgrades
      });
    },
    
    render: function() {
      if (!container) return;
      
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

