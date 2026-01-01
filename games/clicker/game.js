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
  let currentPlayerTurn = 1; // 1 or 2 for two-player modes
  let player1RoundClicks = 0; // Clicks in current round
  let player2RoundClicks = 0; // Clicks in current round
  
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
      
      // For two-player modes, check if this is the first game or player 2's turn
      if (gameMode === 'coop' || gameMode === 'versus') {
        // If it's player 1's turn, reset everything (new game)
        if (currentPlayerTurn === 1) {
          currentClicks = 0;
          player1Clicks = 0;
          player2Clicks = 0;
          player1RoundClicks = 0;
          player2RoundClicks = 0;
          coopTotalClicks = 0;
        } else {
          // If it's player 2's turn, only reset player 2's round clicks
          player2RoundClicks = 0;
        }
      } else {
        // Single player mode: reset everything
        currentClicks = 0;
        player1Clicks = 0;
        player2Clicks = 0;
        player1RoundClicks = 0;
        player2RoundClicks = 0;
        coopTotalClicks = 0;
      }
      
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
    handleClick() {
      if (!gameActive || countdownActive) return;
      
      if (gameMode === 'single') {
        currentClicks++;
      } else if (gameMode === 'coop' || gameMode === 'versus') {
        // Two-player modes: only current player can click
        if (currentPlayerTurn === 1) {
          player1RoundClicks++;
          player1Clicks++;
        } else {
          player2RoundClicks++;
          player2Clicks++;
        }
        
        if (gameMode === 'coop') {
          coopTotalClicks = player1Clicks + player2Clicks;
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
      
      if (gameMode === 'single') {
        gameActive = false;
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
      } else if (gameMode === 'coop') {
        // For coop mode, stage complete only after both players finish
        // This will be handled in endGame when player 2's turn ends
        if (currentPlayerTurn === 1) {
          // Player 1 completed, wait for player 2 to start
          gameActive = false;
          currentPlayerTurn = 2;
          player2RoundClicks = 0;
          timeLeft = TIME_LIMIT;
          
          // Show start screen for player 2
          this.render();
          this.setupEvents();
        } else {
          // Player 2 completed - check if target reached
          // This should not happen here as target check is in endGame
          // But if it does, check target
          if (coopTotalClicks >= coopTargetClicks) {
            // Target reached, stage complete
            gameActive = false;
            if (stage < MAX_STAGE) {
              stage++;
              this.calculateTargets();
              // Reset for next stage
              player1Clicks = 0;
              player2Clicks = 0;
              coopTotalClicks = 0;
              currentPlayerTurn = 1;
              this.saveProgress();
              
              setTimeout(() => {
                alert(`스테이지 ${stage - 1} 완료! 다음 스테이지로 진행합니다.`);
                this.render();
                this.setupEvents();
              }, 500);
            } else {
              alert('축하합니다! 모든 스테이지를 완료했습니다! 🎉');
              this.saveProgress();
              this.render();
              this.setupEvents();
            }
          }
        }
      }
    },
    
    /**
     * End game (time up or failure)
     */
    endGame() {
      this.stopTimer();
      
      if (gameMode === 'single') {
        gameActive = false;
        if (currentClicks < targetClicks) {
          // Failed - reset to stage 1
          stage = 1;
          this.calculateTargets();
          alert(`시간 초과! 스테이지 ${stage} 실패. 1스테이지부터 다시 시작합니다.`);
        }
        this.saveProgress();
        this.render();
        this.setupEvents();
      } else if (gameMode === 'coop' || gameMode === 'versus') {
        // Two-player modes: switch turns or end game
        if (currentPlayerTurn === 1) {
          // Player 1's turn ended, wait for player 2 to start
          gameActive = false;
          currentPlayerTurn = 2;
          player2RoundClicks = 0;
          timeLeft = TIME_LIMIT;
          
          // Show start screen for player 2
          this.render();
          this.setupEvents();
        } else {
          // Player 2's turn ended
          gameActive = false;
          
          if (gameMode === 'coop') {
            // Check if target reached
            if (coopTotalClicks >= coopTargetClicks) {
              // Target reached, stage complete - go to next stage
              if (stage < MAX_STAGE) {
                stage++;
                this.calculateTargets();
                // Reset all clicks for next stage
                player1Clicks = 0;
                player2Clicks = 0;
                coopTotalClicks = 0;
                currentPlayerTurn = 1; // Start from player 1
                this.saveProgress();
                
                setTimeout(() => {
                  alert(`스테이지 ${stage - 1} 완료! 다음 스테이지로 진행합니다.`);
                  this.render();
                  this.setupEvents();
                }, 500);
              } else {
                alert('축하합니다! 모든 스테이지를 완료했습니다! 🎉');
                this.saveProgress();
                this.render();
                this.setupEvents();
              }
            } else {
              // Target not reached - game over, reset to stage 1
              stage = 1;
              this.calculateTargets();
              // Reset all clicks
              player1Clicks = 0;
              player2Clicks = 0;
              coopTotalClicks = 0;
              currentPlayerTurn = 1;
              this.saveProgress();
              
              alert(`시간 초과! 스테이지 실패. 1스테이지부터 다시 시작합니다.`);
              this.render();
              this.setupEvents();
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
            
            // Show result
            let resultMessage = '';
            if (winner === 0) {
              resultMessage = `무승부! (플레이어 1: ${player1Clicks}클릭, 플레이어 2: ${player2Clicks}클릭)`;
            } else {
              resultMessage = `플레이어 ${winner} 승리! 🎉 (플레이어 1: ${player1Clicks}클릭, 플레이어 2: ${player2Clicks}클릭)`;
            }
            
            // Reset all records and start from player 1
            player1Clicks = 0;
            player2Clicks = 0;
            player1RoundClicks = 0;
            player2RoundClicks = 0;
            currentPlayerTurn = 1;
            
            alert(resultMessage);
          }
          
          this.saveProgress();
          this.render();
          this.setupEvents();
        }
      }
    },
    
    /**
     * Switch game mode
     */
    switchMode(mode) {
      gameMode = mode;
      stage = 1;
      currentPlayerTurn = 1;
      player1RoundClicks = 0;
      player2RoundClicks = 0;
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
        const currentClicksEl = document.getElementById('coop-current-clicks');
        const remainingEl = document.getElementById('coop-remaining');
        const totalClicksEl = document.getElementById('coop-total-clicks');
        const targetEl = document.getElementById('coop-target');
        const timeEl = document.getElementById('coop-time');
        const progressEl = document.getElementById('coop-progress');
        const turnEl = document.getElementById('coop-turn');
        
        const currentRoundClicks = currentPlayerTurn === 1 ? player1RoundClicks : player2RoundClicks;
        const remaining = Math.max(0, coopTargetClicks - coopTotalClicks);
        
        if (currentClicksEl) currentClicksEl.textContent = currentRoundClicks;
        if (remainingEl) remainingEl.textContent = remaining;
        if (totalClicksEl) totalClicksEl.textContent = coopTotalClicks;
        if (targetEl) targetEl.textContent = coopTargetClicks;
        if (turnEl) turnEl.textContent = `플레이어 ${currentPlayerTurn}의 턴`;
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
        const currentClicksEl = document.getElementById('versus-current-clicks');
        const p1ClicksEl = document.getElementById('versus-p1-clicks');
        const timeEl = document.getElementById('versus-time');
        const turnEl = document.getElementById('versus-turn');
        const comparisonBarEl = document.getElementById('versus-p1-comparison-bar');
        const comparisonValueEl = document.querySelector('.comparison-value');
        
        const currentRoundClicks = currentPlayerTurn === 1 ? player1RoundClicks : player2RoundClicks;
        
        if (currentClicksEl) currentClicksEl.textContent = currentRoundClicks;
        if (p1ClicksEl) {
          if (currentPlayerTurn === 2) {
            p1ClicksEl.textContent = player1Clicks;
            p1ClicksEl.style.display = 'block';
          } else {
            p1ClicksEl.style.display = 'none';
          }
        }
        if (turnEl) turnEl.textContent = `플레이어 ${currentPlayerTurn}의 턴`;
        if (timeEl) {
          if (countdownActive) {
            timeEl.textContent = countdownValue > 0 ? countdownValue : '시작!';
          } else {
            timeEl.textContent = timeLeft.toFixed(1);
          }
        }
        
        // No comparison bar for versus mode
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
        const remaining = Math.max(0, coopTargetClicks - coopTotalClicks);
        const currentRoundClicks = currentPlayerTurn === 1 ? player1RoundClicks : player2RoundClicks;
        
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
              ${currentPlayerTurn === 2 ? `
              <div class="coop-progress-info">
                <div class="progress-info-label">현재 진행 상황</div>
                <div class="progress-info-value">${coopTotalClicks} / ${coopTargetClicks}</div>
                <div class="progress-container">
                  <div class="progress-bar" style="width: ${Math.min((coopTotalClicks / coopTargetClicks) * 100, 100)}%"></div>
                </div>
                <div class="progress-info-remaining">남은 클릭 수: <strong>${Math.max(0, coopTargetClicks - coopTotalClicks)}</strong></div>
              </div>
              ` : ''}
              <div class="clicker-target" id="clicker-target">
                🎯
              </div>
              <button class="btn btn-primary btn-large" id="start-btn">게임 시작</button>
              <div class="clicker-info">
                ${currentPlayerTurn === 1 ? `
                <p>10초 안에 <strong>${coopTargetClicks}</strong>번 클릭하세요! (협동)</p>
                <p>플레이어 1이 먼저, 플레이어 2가 두 번째로 진행합니다.</p>
                ` : `
                <p>플레이어 2의 턴입니다. 남은 클릭 수: <strong>${Math.max(0, coopTargetClicks - coopTotalClicks)}</strong></p>
                <p>목표: <strong>${coopTargetClicks}</strong>클릭</p>
                `}
              </div>
            </div>
            ` : `
            <div class="clicker-game-active">
              ${countdownActive ? `
              <div class="countdown-overlay">
                <div class="countdown-display" id="countdown">${countdownValue}</div>
              </div>
              ` : ''}
              <div class="clicker-turn-indicator" id="coop-turn">
                플레이어 ${currentPlayerTurn}의 턴
              </div>
              
              <div class="clicker-stats">
                <div class="stat-item">
                  <div class="stat-label">현재 클릭 수</div>
                  <div class="stat-value" id="coop-current-clicks">${currentRoundClicks}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">남은 클릭 수</div>
                  <div class="stat-value" id="coop-remaining">${remaining}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">남은 시간</div>
                  <div class="stat-value time-critical" id="coop-time">${timeLeft.toFixed(1)}</div>
                </div>
              </div>
              
              <div class="progress-container">
                <div class="progress-bar" id="coop-progress" style="width: ${Math.min((coopTotalClicks / coopTargetClicks) * 100, 100)}%"></div>
              </div>
              
              <div class="clicker-target" id="clicker-target">
                🎯
              </div>
              
              <div class="clicker-info">
                <p>플레이어 ${currentPlayerTurn}의 턴입니다. 빠르게 클릭하세요!</p>
                <p>총 클릭 수: <strong id="coop-total-clicks">${coopTotalClicks}</strong> / 목표: <strong id="coop-target">${coopTargetClicks}</strong></p>
              </div>
            </div>
            `}
          </div>
        `;
      } else if (gameMode === 'versus') {
        const currentRoundClicks = currentPlayerTurn === 1 ? player1RoundClicks : player2RoundClicks;
        
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
              <div class="clicker-target" id="clicker-target">
                🎯
              </div>
              <button class="btn btn-primary btn-large" id="start-btn">게임 시작</button>
              <div class="clicker-info">
                ${currentPlayerTurn === 1 ? `
                <p>10초 동안 더 많이 클릭한 사람이 승리합니다!</p>
                <p>플레이어 1이 먼저, 플레이어 2가 두 번째로 진행합니다.</p>
                ` : `
                <p>플레이어 2의 턴입니다. 10초 동안 더 많이 클릭하세요!</p>
                <p>플레이어 1: <strong>${player1Clicks}</strong>클릭</p>
                `}
              </div>
            </div>
            ` : `
            <div class="clicker-game-active">
              ${countdownActive ? `
              <div class="countdown-overlay">
                <div class="countdown-display" id="countdown">${countdownValue}</div>
              </div>
              ` : ''}
              <div class="clicker-turn-indicator" id="versus-turn">
                플레이어 ${currentPlayerTurn}의 턴
              </div>
              
              <div class="clicker-stats">
                <div class="stat-item">
                  <div class="stat-label">현재 클릭 수</div>
                  <div class="stat-value" id="versus-current-clicks">${currentRoundClicks}</div>
                </div>
                ${currentPlayerTurn === 2 ? `
                <div class="stat-item">
                  <div class="stat-label">플레이어 1 클릭 수</div>
                  <div class="stat-value" id="versus-p1-clicks">${player1Clicks}</div>
                </div>
                ` : ''}
                <div class="stat-item">
                  <div class="stat-label">남은 시간</div>
                  <div class="stat-value time-critical" id="versus-time">${timeLeft.toFixed(1)}</div>
                </div>
              </div>
              
              <div class="clicker-target" id="clicker-target">
                🎯
              </div>
              
              <div class="clicker-info">
                <p>플레이어 ${currentPlayerTurn}의 턴입니다. 빠르게 클릭하세요!</p>
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
      // Use touchstart for faster mobile response, click for desktop
      const target = document.getElementById('clicker-target');
      if (target) {
        // Clone and replace to remove all event listeners
        const newTarget = target.cloneNode(true);
        target.parentNode.replaceChild(newTarget, target);
        
        const handleInteraction = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleClick();
          newTarget.classList.add('clicked');
          setTimeout(() => {
            newTarget.classList.remove('clicked');
          }, 50);
        };
        
        newTarget.addEventListener('touchstart', handleInteraction, { passive: false });
        newTarget.addEventListener('click', handleInteraction);
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
      currentPlayerTurn = 1;
      player1RoundClicks = 0;
      player2RoundClicks = 0;
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
