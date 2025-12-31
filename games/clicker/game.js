/**
 * Clicker Game
 * Simple click-based score game
 */

(function() {
  let score = 0;
  let multiplier = 1;
  let callbacks = {};
  let container = null;
  
  // Game state
  const Game = {
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      // Load saved score if available
      const saved = Storage.getGameProgress('clicker');
      if (saved && saved.lastScore) {
        score = saved.lastScore;
      }
      
      this.render();
      this.setupEvents();
      
      // Update score display
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(score);
      }
    },
    
    render: function() {
      if (!container) return;
      
      container.innerHTML = `
        <div class="clicker-game">
          <h2 class="clicker-title">🎯 클리커 게임</h2>
          <div class="clicker-score" id="clicker-score">${score}</div>
          <div class="clicker-target" id="clicker-target">
            🎯
          </div>
          <div class="clicker-info">
            <p>빠르게 클릭해서 점수를 모으세요!</p>
            <div class="clicker-multiplier">배율: x${multiplier}</div>
          </div>
        </div>
      `;
    },
    
    setupEvents: function() {
      const target = document.getElementById('clicker-target');
      if (!target) return;
      
      target.addEventListener('click', () => {
        this.handleClick();
      });
    },
    
    handleClick: function() {
      // Increase score
      score += multiplier;
      
      // Update display
      const scoreEl = document.getElementById('clicker-score');
      if (scoreEl) {
        scoreEl.textContent = score;
      }
      
      // Add click animation
      const target = document.getElementById('clicker-target');
      if (target) {
        target.classList.add('clicked');
        setTimeout(() => {
          target.classList.remove('clicked');
        }, 200);
      }
      
      // Increase multiplier every 10 clicks
      if (score % 10 === 0 && score > 0) {
        multiplier++;
        const multiplierEl = document.querySelector('.clicker-multiplier');
        if (multiplierEl) {
          multiplierEl.textContent = `배율: x${multiplier}`;
        }
      }
      
      // Notify callback
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(score);
      }
      
      // Save progress
      Storage.saveGameProgress('clicker', {
        lastScore: score,
        multiplier: multiplier
      });
    },
    
    reset: function() {
      score = 0;
      multiplier = 1;
      this.render();
      this.setupEvents();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(score);
      }
      
      Storage.saveGameProgress('clicker', {
        lastScore: 0,
        multiplier: 1
      });
    },
    
    setMuted: function(muted) {
      // This game doesn't use sound, so nothing to do
    }
  };
  
  // Export game
  if (typeof window !== 'undefined') {
    window.Game = Game;
  }
})();

