/**
 * Game Shell
 * Wrapper that provides common UI and functionality for all games
 * Handles loading game scripts, displaying game controls, etc.
 */

const GameShell = {
  gameId: null,
  gameInstance: null,
  isFullscreen: false,
  isMuted: false,
  
  /**
   * Initialize game shell
   */
  async init(gameId) {
    this.gameId = gameId;
    
    // Load game manifest
    const manifest = await this.loadManifest(gameId);
    if (!manifest) {
      this.showError('게임을 불러올 수 없습니다.');
      return;
    }
    
    // Setup shell UI
    this.setupUI(manifest);
    
    // Load game CSS
    this.loadGameCSS(gameId);
    
    // Load and initialize game
    await this.loadGame(gameId);
    
    // Setup event listeners
    this.setupEventListeners();
  },
  
  /**
   * Load game manifest
   */
  async loadManifest(gameId) {
    try {
      const response = await fetch(`../games/${gameId}/manifest.json`);
      if (!response.ok) throw new Error('Manifest not found');
      return await response.json();
    } catch (error) {
      console.error('Manifest load error:', error);
      return null;
    }
  },
  
  /**
   * Load game CSS
   */
  loadGameCSS(gameId) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `../games/${gameId}/game.css`;
    document.head.appendChild(link);
  },
  
  /**
   * Load game script
   */
  async loadGame(gameId) {
    try {
      // Remove previous game script if exists
      const oldScript = document.querySelector(`script[data-game-id="${gameId}"]`);
      if (oldScript) oldScript.remove();
      
      // Load new game script
      const script = document.createElement('script');
      script.src = `../games/${gameId}/game.js`;
      script.dataset.gameId = gameId;
      script.async = true;
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          // Wait a bit for game to initialize
          setTimeout(() => {
            if (window.Game && typeof window.Game.init === 'function') {
              this.gameInstance = window.Game;
              const gameContainer = document.getElementById('game-container');
              if (gameContainer && this.gameInstance.init) {
                this.gameInstance.init(gameContainer, {
                  onScoreUpdate: (score) => this.updateScore(score),
                  onGameOver: (data) => this.handleGameOver(data),
                  onLevelChange: (level) => this.updateLevel(level)
                });
              }
            }
            resolve();
          }, 100);
        };
        script.onerror = reject;
        document.body.appendChild(script);
      });
    } catch (error) {
      console.error('Game load error:', error);
      this.showError('게임을 불러오는 중 오류가 발생했습니다.');
    }
  },
  
  /**
   * Setup shell UI
   */
  setupUI(manifest) {
    const title = document.getElementById('game-title');
    if (title) {
      title.textContent = manifest.title || '게임';
    }
  },
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('btn-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }
    
    // Reset button
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetGame();
      });
    }
    
    // Fullscreen button
    const fullscreenBtn = document.getElementById('btn-fullscreen');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }
    
    // Mute button
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.toggleMute();
      });
    }
    
    // Handle fullscreen change events
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
      this.updateFullscreenButton();
    });
  },
  
  /**
   * Reset game
   */
  resetGame() {
    if (confirm('게임을 다시 시작하시겠습니까?')) {
      if (this.gameInstance && this.gameInstance.reset) {
        this.gameInstance.reset();
      } else {
        // Reload game
        this.loadGame(this.gameId);
      }
    }
  },
  
  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    if (!this.isFullscreen) {
      const gameArea = document.getElementById('game-area');
      if (gameArea && gameArea.requestFullscreen) {
        gameArea.requestFullscreen().catch(err => {
          console.error('Fullscreen error:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  },
  
  /**
   * Update fullscreen button icon
   */
  updateFullscreenButton() {
    const btn = document.getElementById('btn-fullscreen');
    if (btn) {
      btn.textContent = this.isFullscreen ? '🔳' : '⛶';
    }
  },
  
  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    const btn = document.getElementById('btn-mute');
    if (btn) {
      btn.textContent = this.isMuted ? '🔇' : '🔊';
    }
    // Notify game if needed
    if (this.gameInstance && this.gameInstance.setMuted) {
      this.gameInstance.setMuted(this.isMuted);
    }
  },
  
  /**
   * Update score display
   */
  updateScore(score) {
    const scoreEl = document.getElementById('game-score');
    if (scoreEl) {
      scoreEl.textContent = score || 0;
    }
  },
  
  /**
   * Update level display
   */
  updateLevel(level) {
    const levelEl = document.getElementById('game-level');
    if (levelEl) {
      levelEl.textContent = level || 1;
    }
  },
  
  /**
   * Handle game over
   */
  handleGameOver(data) {
    // Save progress
    if (this.gameId && data.score !== undefined) {
      Storage.saveGameProgress(this.gameId, {
        lastScore: data.score,
        completed: data.completed || false
      });
      Storage.saveLastPlayed(this.gameId);
    }
    
    // Track analytics
    Analytics.trackGameComplete(this.gameId, data.score, data.time);
    
    // Show game over message (can be enhanced with a modal)
    if (data.completed) {
      alert(`축하합니다! 점수: ${data.score || 0}`);
    }
  },
  
  /**
   * Show error
   */
  showError(message) {
    alert(message);
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.GameShell = GameShell;
}

