/**
 * Clicker Game
 * Time-based clicking game with 100 stages
 * 클리커 게임: 10초 안에 목표 클릭 수 달성
 */

(function() {
  const TIME_LIMIT = 10; // 10 seconds
  const MAX_STAGE = 100;
  
  let gameMode = 'single'; // 'single', 'coop', 'versus'
  let stage = 1;
  let currentClicks = 0;
  let targetClicks = 0;
  let timeLeft = TIME_LIMIT;
  let gameActive = false;
  let timerInterval = null;
  let callbacks = {};
  let container = null;
  
  // Two player modes
  let player1Clicks = 0;
  let player2Clicks = 0;
  let player1Target = 0;
  let player2Target = 0;
  let coopTotalClicks = 0;
  let coopTargetClicks = 0;
  let countdownActive = false;
  let countdownValue = 3;
  
  // Game state
  const Game = {
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      // Load saved progress if available
      const saved = Storage.getGameProgress('clicker');
      if (saved) {
        gameMode = saved.gameMode || 'single';
        stage = saved.stage || 1;
      } else {
        stage = 1;
      }
      
      this.calculateTargets();
      this.render();
      this.setupEvents();
    },
    
    /**
     * Calculate target clicks based on stage
     */
    calculateTargets() {
      // Target increases by 3 per stage
      // Stage 1: 10, Stage 2: 13, Stage 3: 16, Stage 4: 19, etc.
      const baseTarget = 10;
      targetClicks = baseTarget + (stage - 1) * 3;
      
      if (gameMode === 'coop') {
        coopTargetClicks = targetClicks * 2;
      }
      // Versus mode doesn't need targets - just compare clicks after time runs out
    },
    
    /**
     * Start game with countdown
     */
    startGame() {
      if (gameActive || countdownActive) return;
      
      // Reset values
      currentClicks = 0;
      player1Clicks = 0;
      player2Clicks = 0;
      coopTotalClicks = 0;
      timeLeft = TIME_LIMIT;
      countdownValue = 3;
      countdownActive = true;
      
      // Render to show countdown overlay
      this.render();
      this.setupEvents();
      
      // Show countdown
      this.showCountdown();
    },
    
    /**
     * Show countdown before game starts
     */
    showCountdown() {
      if (countdownValue > 0) {
        // Update countdown display
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
          countdownEl.textContent = countdownValue;
        }
        
        setTimeout(() => {
          countdownValue--;
          this.showCountdown();
        }, 1000);
      } else {
        // Start actual game
        countdownActive = false;
        gameActive = true;
        
        // Hide countdown and show game
        const countdownEl = document.getElementById('countdown');
        if (countdownEl && countdownEl.parentElement) {
          countdownEl.parentElement.style.display = 'none';
        }
        
        this.updateDisplay();
        this.startTimer();
      }
    },
    
    /**
     * Start countdown timer
     */
    startTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      
      timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        
        if (timeLeft <= 0) {
          this.endGame();
        } else {
          this.updateDisplay();
        }
      }, 100);
    },
    
    /**
     * Stop timer
     */
    stopTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    },
    
    /**
     * Handle click
     */
    handleClick(player = 1) {
      if (!gameActive || countdownActive) return;
      
      if (gameMode === 'single') {
        currentClicks++;
      } else if (gameMode === 'coop') {
        if (player === 1) {
          player1Clicks++;
        } else {
          player2Clicks++;
        }
        coopTotalClicks = player1Clicks + player2Clicks;
      } else if (gameMode === 'versus') {
        if (player === 1) {
          player1Clicks++;
        } else {
          player2Clicks++;
        }
      }
      
      this.updateDisplay();
      this.checkWin();
    },
    
    /**
     * Check if target is reached
     */
    checkWin() {
      if (gameMode === 'single') {
        if (currentClicks >= targetClicks) {
          this.stageComplete();
        }
      } else if (gameMode === 'coop') {
        if (coopTotalClicks >= coopTargetClicks) {
          this.stageComplete();
        }
      }
      // Versus mode: winner is determined when time runs out (no early win)
    },
    
    /**
     * Stage complete
     */
    stageComplete() {
      this.stopTimer();
      gameActive = false;
      
      if (gameMode === 'single' || gameMode === 'coop') {
        if (stage < MAX_STAGE) {
          stage++;
          this.calculateTargets();
          this.saveProgress();
          
          // Show success message
          setTimeout(() => {
            alert(`스테이지 ${stage - 1} 완료! 다음 스테이지로 진행합니다.`);
            this.render();
            this.setupEvents();
          }, 500);
        } else {
          // All stages completed
          alert('축하합니다! 모든 스테이지를 완료했습니다! 🎉');
          this.saveProgress();
          this.render();
          this.setupEvents();
        }
      }
    },
    
    /**
     * End game (time up or failure)
     */
    endGame() {
      this.stopTimer();
      gameActive = false;
      
      if (gameMode === 'single') {
        if (currentClicks < targetClicks) {
          // Failed - reset to stage 1
          stage = 1;
          this.calculateTargets();
          alert(`시간 초과! 스테이지 ${stage} 실패. 1스테이지부터 다시 시작합니다.`);
        }
      } else if (gameMode === 'coop') {
        if (coopTotalClicks < coopTargetClicks) {
          // Failed - reset to stage 1
          stage = 1;
          this.calculateTargets();
          alert(`시간 초과! 스테이지 ${stage} 실패. 1스테이지부터 다시 시작합니다.`);
        }
      } else if (gameMode === 'versus') {
        // Determine winner: most clicks wins
        let winner = null;
        if (player1Clicks > player2Clicks) {
          winner = 1;
        } else if (player2Clicks > player1Clicks) {
          winner = 2;
        } else {
          winner = 0; // Draw
        }
        
        if (winner === 0) {
          alert(`무승부! (플레이어 1: ${player1Clicks}클릭, 플레이어 2: ${player2Clicks}클릭)`);
        } else {
          alert(`플레이어 ${winner} 승리! 🎉 (플레이어 1: ${player1Clicks}클릭, 플레이어 2: ${player2Clicks}클릭)`);
        }
      }
      
      this.saveProgress();
      this.render();
      this.setupEvents();
    },
    
    /**
     * Switch game mode
     */
    switchMode(mode) {
      gameMode = mode;
      stage = 1;
      this.calculateTargets();
      this.stopTimer();
      gameActive = false;
      countdownActive = false;
      this.saveProgress();
      this.render();
      this.setupEvents();
    },
    
    /**
     * Update display
     */
    updateDisplay() {
      // Update countdown display
      const countdownEl = document.getElementById('countdown');
      if (countdownEl) {
        if (countdownActive) {
          countdownEl.textContent = countdownValue > 0 ? countdownValue : '시작!';
          countdownEl.style.display = 'block';
        } else {
          countdownEl.style.display = 'none';
        }
      }
      
      if (gameMode === 'single') {
        const clicksEl = document.getElementById('current-clicks');
        const targetEl = document.getElementById('target-clicks');
        const timeEl = document.getElementById('time-left');
        const progressEl = document.getElementById('progress-bar');
        
        if (clicksEl) clicksEl.textContent = currentClicks;
        if (targetEl) targetEl.textContent = targetClicks;
        if (timeEl) {
          if (countdownActive) {
            timeEl.textContent = '준비...';
          } else {
            timeEl.textContent = timeLeft.toFixed(1);
          }
        }
        
        if (progressEl) {
          const progress = Math.min((currentClicks / targetClicks) * 100, 100);
          progressEl.style.width = `${progress}%`;
        }
      } else if (gameMode === 'coop') {
        const p1ClicksEl = document.getElementById('coop-p1-clicks');
        const p2ClicksEl = document.getElementById('coop-p2-clicks');
        const totalClicksEl = document.getElementById('coop-total-clicks');
        const activeTotalEl = document.getElementById('coop-active-total');
        const startTotalEl = document.getElementById('coop-start-total');
        const targetEl = document.getElementById('coop-target');
        const timeEl = document.getElementById('coop-time');
        const progressEl = document.getElementById('coop-progress');
        
        if (p1ClicksEl) p1ClicksEl.textContent = player1Clicks;
        if (p2ClicksEl) p2ClicksEl.textContent = player2Clicks;
        if (totalClicksEl) totalClicksEl.textContent = coopTotalClicks;
        if (activeTotalEl) activeTotalEl.textContent = coopTotalClicks;
        if (startTotalEl) startTotalEl.textContent = coopTotalClicks;
        if (targetEl) targetEl.textContent = coopTargetClicks;
        if (timeEl) {
          if (countdownActive) {
            timeEl.textContent = '준비...';
          } else {
            timeEl.textContent = timeLeft.toFixed(1);
          }
        }
        
        if (progressEl) {
          const progress = Math.min((coopTotalClicks / coopTargetClicks) * 100, 100);
          progressEl.style.width = `${progress}%`;
        }
      } else if (gameMode === 'versus') {
        const p1ClicksEl = document.getElementById('p1-clicks');
        const p2ClicksEl = document.getElementById('p2-clicks');
        const timeEl = document.getElementById('versus-time');
        const p1ProgressEl = document.getElementById('p1-progress');
        const p2ProgressEl = document.getElementById('p2-progress');
        
        if (p1ClicksEl) p1ClicksEl.textContent = player1Clicks;
        if (p2ClicksEl) p2ClicksEl.textContent = player2Clicks;
        if (timeEl) {
          if (countdownActive) {
            timeEl.textContent = countdownValue > 0 ? countdownValue : '시작!';
          } else {
            timeEl.textContent = timeLeft.toFixed(1);
          }
        }
        
        // Progress bars show relative comparison (not target-based)
        if (p1ProgressEl && p2ProgressEl) {
          const maxClicks = Math.max(player1Clicks, player2Clicks, 1);
          const p1Progress = (player1Clicks / maxClicks) * 100;
          const p2Progress = (player2Clicks / maxClicks) * 100;
          p1ProgressEl.style.width = `${p1Progress}%`;
          p2ProgressEl.style.width = `${p2Progress}%`;
        }
      }
    },
    
    /**
     * Render game
     */
    render: function() {
      if (!container) return;
      
      if (gameMode === 'single') {
        container.innerHTML = `
          <div class="clicker-game">
            <h2 class="clicker-title">🎯 클리커 게임</h2>
            <div class="clicker-mode-selector">
              <button class="btn ${gameMode === 'single' ? 'btn-primary' : 'btn-outline'}" id="mode-single">1인용</button>
              <button class="btn ${gameMode === 'coop' ? 'btn-primary' : 'btn-outline'}" id="mode-coop">2인용 협동</button>
              <button class="btn ${gameMode === 'versus' ? 'btn-primary' : 'btn-outline'}" id="mode-versus">2인용 경쟁</button>
            </div>
            
            <div class="clicker-stage-info">
              <div class="stage-label">스테이지</div>
              <div class="stage-number">${stage} / ${MAX_STAGE}</div>
            </div>
            
            ${!gameActive && !countdownActive ? `
            <div class="clicker-start-area">
              <div class="clicker-target" id="clicker-target">
                🎯
              </div>
              <button class="btn btn-primary btn-large" id="start-btn">게임 시작</button>
              <div class="clicker-info">
                <p>10초 안에 <strong>${targetClicks}</strong>번 클릭하세요!</p>
              </div>
            </div>
            ` : `
            <div class="clicker-game-active">
              ${countdownActive ? `
              <div class="countdown-overlay">
                <div class="countdown-display" id="countdown">${countdownValue}</div>
              </div>
              ` : ''}
              <div class="clicker-stats">
                <div class="stat-item">
                  <div class="stat-label">클릭 수</div>
                  <div class="stat-value" id="current-clicks">${currentClicks}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">목표</div>
                  <div class="stat-value" id="target-clicks">${targetClicks}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">남은 시간</div>
                  <div class="stat-value time-critical" id="time-left">${timeLeft.toFixed(1)}</div>
                </div>
              </div>
              
              <div class="progress-container">
                <div class="progress-bar" id="progress-bar" style="width: ${Math.min((currentClicks / targetClicks) * 100, 100)}%"></div>
              </div>
              
              <div class="clicker-target" id="clicker-target">
                🎯
              </div>
              
              <div class="clicker-info">
                <p>빠르게 클릭하세요!</p>
              </div>
            </div>
            `}
          </div>
        `;
      } else if (gameMode === 'coop') {
        container.innerHTML = `
          <div class="clicker-game">
            <h2 class="clicker-title">🎯 클리커 게임 (협동전)</h2>
            <div class="clicker-mode-selector">
              <button class="btn ${gameMode === 'single' ? 'btn-primary' : 'btn-outline'}" id="mode-single">1인용</button>
              <button class="btn ${gameMode === 'coop' ? 'btn-primary' : 'btn-outline'}" id="mode-coop">2인용 협동</button>
              <button class="btn ${gameMode === 'versus' ? 'btn-primary' : 'btn-outline'}" id="mode-versus">2인용 경쟁</button>
            </div>
            
            <div class="clicker-stage-info">
              <div class="stage-label">스테이지</div>
              <div class="stage-number">${stage} / ${MAX_STAGE}</div>
            </div>
            
            ${!gameActive && !countdownActive ? `
            <div class="clicker-start-area">
              <div class="versus-targets">
                <div class="versus-player">
                  <div class="player-label">플레이어 1</div>
                  <div class="clicker-target" id="target-p1">🎯</div>
                  <div class="player-clicks-display">0</div>
                </div>
                <div class="versus-vs coop-total">합계: <span id="coop-start-total">0</span></div>
                <div class="versus-player">
                  <div class="player-label">플레이어 2</div>
                  <div class="clicker-target" id="target-p2">🎯</div>
                  <div class="player-clicks-display">0</div>
                </div>
              </div>
              <button class="btn btn-primary btn-large" id="start-btn">게임 시작</button>
              <div class="clicker-info">
                <p>10초 안에 <strong>${coopTargetClicks}</strong>번 클릭하세요! (협동)</p>
              </div>
            </div>
            ` : `
            <div class="clicker-game-active">
              ${countdownActive ? `
              <div class="countdown-overlay">
                <div class="countdown-display" id="countdown">${countdownValue}</div>
              </div>
              ` : ''}
              <div class="clicker-stats">
                <div class="stat-item">
                  <div class="stat-label">총 클릭 수</div>
                  <div class="stat-value" id="coop-total-clicks">${coopTotalClicks}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">목표</div>
                  <div class="stat-value" id="coop-target">${coopTargetClicks}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">남은 시간</div>
                  <div class="stat-value time-critical" id="coop-time">${timeLeft.toFixed(1)}</div>
                </div>
              </div>
              
              <div class="progress-container">
                <div class="progress-bar" id="coop-progress" style="width: ${Math.min((coopTotalClicks / coopTargetClicks) * 100, 100)}%"></div>
              </div>
              
              <div class="versus-players">
                <div class="versus-player-area">
                  <div class="player-label">플레이어 1</div>
                  <div class="clicker-target" id="target-p1">🎯</div>
                  <div class="player-clicks-display" id="coop-p1-clicks">${player1Clicks}</div>
                </div>
                
                <div class="versus-vs coop-total">합계: <span id="coop-active-total">${coopTotalClicks}</span></div>
                
                <div class="versus-player-area">
                  <div class="player-label">플레이어 2</div>
                  <div class="clicker-target" id="target-p2">🎯</div>
                  <div class="player-clicks-display" id="coop-p2-clicks">${player2Clicks}</div>
                </div>
              </div>
              
              <div class="clicker-info">
                <p>둘이 함께 빠르게 클릭하세요!</p>
              </div>
            </div>
            `}
          </div>
        `;
      } else if (gameMode === 'versus') {
        container.innerHTML = `
          <div class="clicker-game">
            <h2 class="clicker-title">🎯 클리커 게임 (경쟁전)</h2>
            <div class="clicker-mode-selector">
              <button class="btn ${gameMode === 'single' ? 'btn-primary' : 'btn-outline'}" id="mode-single">1인용</button>
              <button class="btn ${gameMode === 'coop' ? 'btn-primary' : 'btn-outline'}" id="mode-coop">2인용 협동</button>
              <button class="btn ${gameMode === 'versus' ? 'btn-primary' : 'btn-outline'}" id="mode-versus">2인용 경쟁</button>
            </div>
            
            ${!gameActive && !countdownActive ? `
            <div class="clicker-start-area">
              <div class="versus-targets">
                <div class="versus-player">
                  <div class="player-label">플레이어 1</div>
                  <div class="clicker-target" id="target-p1">🎯</div>
                  <div class="player-clicks-display">0</div>
                </div>
                <div class="versus-vs">VS</div>
                <div class="versus-player">
                  <div class="player-label">플레이어 2</div>
                  <div class="clicker-target" id="target-p2">🎯</div>
                  <div class="player-clicks-display">0</div>
                </div>
              </div>
              <button class="btn btn-primary btn-large" id="start-btn">게임 시작</button>
              <div class="clicker-info">
                <p>10초 동안 더 많이 클릭한 사람이 승리합니다!</p>
              </div>
            </div>
            ` : `
            <div class="clicker-game-active">
              ${countdownActive ? `
              <div class="countdown-overlay">
                <div class="countdown-display" id="countdown">${countdownValue}</div>
              </div>
              ` : ''}
              <div class="versus-time">
                <div class="time-display" id="versus-time">${timeLeft.toFixed(1)}</div>
              </div>
              
              <div class="versus-players">
                <div class="versus-player-area">
                  <div class="player-label">플레이어 1</div>
                  <div class="clicker-target" id="target-p1">🎯</div>
                  <div class="player-clicks-display" id="p1-clicks">${player1Clicks}</div>
                  <div class="progress-container">
                    <div class="progress-bar" id="p1-progress" style="width: ${Math.max(player1Clicks, player2Clicks) > 0 ? (player1Clicks / Math.max(player1Clicks, player2Clicks, 1)) * 100 : 0}%"></div>
                  </div>
                </div>
                
                <div class="versus-player-area">
                  <div class="player-label">플레이어 2</div>
                  <div class="clicker-target" id="target-p2">🎯</div>
                  <div class="player-clicks-display" id="p2-clicks">${player2Clicks}</div>
                  <div class="progress-container">
                    <div class="progress-bar" id="p2-progress" style="width: ${Math.max(player1Clicks, player2Clicks) > 0 ? (player2Clicks / Math.max(player1Clicks, player2Clicks, 1)) * 100 : 0}%"></div>
                  </div>
                </div>
              </div>
            </div>
            `}
          </div>
        `;
      }
      
      this.setupEvents();
    },
    
    /**
     * Setup event listeners
     */
    setupEvents: function() {
      // Mode selector buttons
      const singleBtn = document.getElementById('mode-single');
      if (singleBtn) {
        singleBtn.addEventListener('click', () => {
          this.switchMode('single');
        });
      }
      
      const coopBtn = document.getElementById('mode-coop');
      if (coopBtn) {
        coopBtn.addEventListener('click', () => {
          this.switchMode('coop');
        });
      }
      
      const versusBtn = document.getElementById('mode-versus');
      if (versusBtn) {
        versusBtn.addEventListener('click', () => {
          this.switchMode('versus');
        });
      }
      
      // Start button
      const startBtn = document.getElementById('start-btn');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          this.startGame();
        });
      }
      
      // Click targets - remove old listeners first to prevent duplicates
      if (gameMode === 'single') {
        const target = document.getElementById('clicker-target');
        if (target) {
          // Clone and replace to remove all event listeners
          const newTarget = target.cloneNode(true);
          target.parentNode.replaceChild(newTarget, target);
          
          newTarget.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleClick();
            newTarget.classList.add('clicked');
            setTimeout(() => {
              newTarget.classList.remove('clicked');
            }, 100);
          });
        }
      } else if (gameMode === 'coop' || gameMode === 'versus') {
        const targetP1 = document.getElementById('target-p1');
        const targetP2 = document.getElementById('target-p2');
        
        if (targetP1) {
          // Clone and replace to remove all event listeners
          const newTargetP1 = targetP1.cloneNode(true);
          targetP1.parentNode.replaceChild(newTargetP1, targetP1);
          
          newTargetP1.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleClick(1);
            newTargetP1.classList.add('clicked');
            setTimeout(() => {
              newTargetP1.classList.remove('clicked');
            }, 100);
          });
        }
        
        if (targetP2) {
          // Clone and replace to remove all event listeners
          const newTargetP2 = targetP2.cloneNode(true);
          targetP2.parentNode.replaceChild(newTargetP2, targetP2);
          
          newTargetP2.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleClick(2);
            newTargetP2.classList.add('clicked');
            setTimeout(() => {
              newTargetP2.classList.remove('clicked');
            }, 100);
          });
        }
      }
    },
    
    /**
     * Save progress
     */
    saveProgress() {
      Storage.saveGameProgress('clicker', {
        gameMode: gameMode,
        stage: stage
      });
    },
    
    reset: function() {
      stage = 1;
      gameActive = false;
      countdownActive = false;
      this.stopTimer();
      this.calculateTargets();
      this.saveProgress();
      this.render();
      this.setupEvents();
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
