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

    // Prefer static SEO article for AdSense; if present, suppress dynamic section
    this.preferStaticSeoArticle();
    
    // Load game CSS
    this.loadGameCSS(gameId);
    
    // Load and initialize game
    await this.loadGame(gameId);
    
    // Setup event listeners
    this.setupEventListeners();
  },

  /**
   * Prefer static SEO article when present; hide dynamic description section
   */
  preferStaticSeoArticle() {
    try {
      const staticArticle = document.querySelector('article.game-seo-content');
      if (staticArticle) {
        // Mark global flag for other scripts (defensive)
        if (typeof window !== 'undefined') {
          window.__STATIC_SEO_PRESENT = true;
        }
        // Hide dynamic section if present
        const dynamicSection = document.getElementById('game-description-section');
        const dynamicContent = document.getElementById('game-description-content');
        if (dynamicContent) dynamicContent.innerHTML = '';
        if (dynamicSection && dynamicSection.parentElement) {
          // Remove the dynamic section entirely to prevent later scripts from re-showing it
          dynamicSection.parentElement.removeChild(dynamicSection);
        }
      }
    } catch (error) {
      console.warn('Failed to prefer static SEO article:', error);
    }
  },
  
  /**
   * Get base path for game files
   */
  getBasePath() {
    // Use App.getBasePath if available, otherwise fallback to simple check
    if (typeof App !== 'undefined' && App.getBasePath) {
      return App.getBasePath();
    }
    
    // Fallback: check for pages/game/ (2 levels deep) or pages/ (1 level deep)
    const href = window.location.href;
    const pathname = window.location.pathname;
    
    // Check if we're in pages/game/ folder (2 levels deep)
    if (href.includes('/pages/game/') || href.includes('\\pages\\game\\') || 
        pathname.includes('/pages/game/') || pathname.includes('\\pages\\game\\')) {
      return '../../';
    }
    
    // Check if we're in pages/ folder (1 level deep)
    if (href.includes('/pages/') || href.includes('\\pages\\') || 
        pathname.includes('/pages/') || pathname.includes('\\pages\\')) {
      return '../';
    }
    
    // Root level
    return './';
  },
  
  /**
   * Load game manifest
   */
  async loadManifest(gameId) {
    try {
      const basePath = this.getBasePath();
      const response = await fetch(`${basePath}games/${gameId}/manifest.json`);
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
    const basePath = this.getBasePath();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${basePath}games/${gameId}/game.css`;
    document.head.appendChild(link);
  },
  
  /**
   * Load game script
   */
  async loadGame(gameId) {
    try {
      // Clear previous game instance
      this.gameInstance = null;
      window.Game = null;
      
      // Remove previous game script if exists
      const oldScript = document.querySelector(`script[data-game-id="${gameId}"]`);
      if (oldScript) oldScript.remove();
      
      // Clear game container (remove loading spinner)
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) {
        gameContainer.innerHTML = '';
      }
      
      // Load new game script
      const basePath = this.getBasePath();
      const script = document.createElement('script');
      script.src = `${basePath}games/${gameId}/game.js`;
      script.dataset.gameId = gameId;
      script.async = true; // Load asynchronously
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          console.log(`Game script loaded for: ${gameId}`);
          // IIFE executes immediately when script loads, so Game should be available
          // Use a small delay to ensure the script has fully executed
          setTimeout(() => {
            console.log('Checking for window.Game:', window.Game);
            if (window.Game && typeof window.Game.init === 'function') {
              console.log('Game found, initializing...');
              this.gameInstance = window.Game;
              const gameContainer = document.getElementById('game-container');
              if (gameContainer) {
                try {
                  this.gameInstance.init(gameContainer, {
                    onScoreUpdate: (score) => this.updateScore(score),
                    onGameOver: (data) => this.handleGameOver(data),
                    onLevelChange: (level) => this.updateLevel(level)
                  });
                  console.log('Game initialized successfully');
                  resolve();
                } catch (initError) {
                  console.error('Game init error:', initError);
                  this.showError('게임 초기화 중 오류가 발생했습니다: ' + initError.message);
                  reject(initError);
                }
              } else {
                console.error('Game container not found');
                this.showError('게임 컨테이너를 찾을 수 없습니다.');
                reject(new Error('Game container not found'));
              }
            } else {
              console.error('Game not found or init function missing. window.Game:', window.Game);
              const basePath = this.getBasePath();
              console.error('Expected path:', `${basePath}games/${gameId}/game.js`);
              this.showError(`게임을 불러올 수 없습니다. (게임 ID: ${gameId}) 콘솔을 확인해주세요.`);
              reject(new Error('Game not found'));
            }
          }, 100);
        };
        script.onerror = (error) => {
          console.error('Script load error:', error);
          this.showError('게임 스크립트를 불러오는 중 오류가 발생했습니다.');
          reject(error);
        };
        document.body.appendChild(script);
      });
    } catch (error) {
      console.error('Game load error:', error);
      this.showError('게임을 불러오는 중 오류가 발생했습니다.');
      throw error;
    }
  },
  
  /**
   * Setup shell UI
   */
  setupUI(manifest) {
    const title = document.getElementById('game-title');
    if (title) {
      // Use I18n to get translated title
      if (typeof I18n !== 'undefined') {
        title.textContent = I18n.getGameTitle(this.gameId, manifest);
      } else {
        // Fallback to manifest title
        const lang = document.documentElement.lang || 'ko';
        if (lang === 'en' && manifest.titleEn) {
          title.textContent = manifest.titleEn;
        } else {
          title.textContent = manifest.title || '게임';
        }
      }
    }
    
    // 오목 게임은 점수/레벨 표시를 사용하지 않음
    if (this.gameId === 'omok') {
      const statsBar = document.getElementById('game-stats');
      if (statsBar) {
        statsBar.style.display = 'none';
      }
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
      // Show stats bar if it's hidden
      const statsBar = document.getElementById('game-stats');
      if (statsBar && statsBar.style.display === 'none') {
        statsBar.style.display = 'flex';
      }
    }
  },
  
  /**
   * Update level display
   */
  updateLevel(level) {
    const levelEl = document.getElementById('game-level');
    if (levelEl) {
      levelEl.textContent = level || 1;
      // Show stats bar if it's hidden
      const statsBar = document.getElementById('game-stats');
      if (statsBar && statsBar.style.display === 'none') {
        statsBar.style.display = 'flex';
      }
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

