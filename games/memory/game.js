/**
 * Memory Game
 * Card matching memory game
 */

(function() {
  let cards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  let startTime = null;
  let timerInterval = null;
  let callbacks = {};
  let container = null;
  let isProcessing = false;
  
  // Card symbols (emoji pairs)
  const SYMBOLS = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🥝', '🍑'];
  
  const Game = {
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      this.startNewGame();
    },
    
    startNewGame: function() {
      // Create card pairs
      const pairs = [...SYMBOLS, ...SYMBOLS];
      
      // Shuffle cards
      cards = this.shuffleArray([...pairs]);
      
      flippedCards = [];
      matchedPairs = 0;
      moves = 0;
      startTime = Date.now();
      isProcessing = false;
      
      // Clear timer
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      
      this.render();
      this.setupEvents();
      this.startTimer();
    },
    
    shuffleArray: function(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    },
    
    render: function() {
      if (!container) return;
      
      const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      
      container.innerHTML = `
        <div class="memory-game">
          <div class="memory-header">
            <h2 class="memory-title">🧠 기억력 게임</h2>
            <div class="memory-stats">
              <div class="memory-stat">
                <div class="memory-stat-label">이동 횟수</div>
                <div class="memory-stat-value" id="memory-moves">${moves}</div>
              </div>
              <div class="memory-stat">
                <div class="memory-stat-label">시간</div>
                <div class="memory-stat-value" id="memory-time">${elapsed}</div>
              </div>
              <div class="memory-stat">
                <div class="memory-stat-label">매칭</div>
                <div class="memory-stat-value" id="memory-matched">${matchedPairs}</div>
              </div>
            </div>
          </div>
          <div class="memory-grid" id="memory-grid"></div>
          <div class="memory-controls">
            <button class="btn btn-primary" id="memory-reset">새 게임</button>
          </div>
        </div>
      `;
      
      // Render cards
      const grid = document.getElementById('memory-grid');
      if (grid) {
        cards.forEach((symbol, index) => {
          const card = document.createElement('div');
          card.className = 'memory-card';
          card.dataset.index = index;
          card.dataset.symbol = symbol;
          card.innerHTML = `
            <div class="memory-card-front">❓</div>
            <div class="memory-card-back">${symbol}</div>
          `;
          grid.appendChild(card);
        });
      }
      
      // Update stats
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(matchedPairs);
      }
    },
    
    setupEvents: function() {
      // Card click handlers
      const cardElements = document.querySelectorAll('.memory-card');
      cardElements.forEach(card => {
        card.addEventListener('click', () => {
          const index = parseInt(card.dataset.index);
          this.handleCardClick(index, card);
        });
      });
      
      // Reset button
      const resetBtn = document.getElementById('memory-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.startNewGame();
        });
      }
    },
    
    handleCardClick: function(index, cardElement) {
      if (isProcessing) return;
      if (cardElement.classList.contains('flipped')) return;
      if (cardElement.classList.contains('matched')) return;
      if (flippedCards.length >= 2) return;
      
      // Flip card
      cardElement.classList.add('flipped');
      flippedCards.push({ index, element: cardElement, symbol: cards[index] });
      
      // If two cards are flipped, check for match
      if (flippedCards.length === 2) {
        isProcessing = true;
        moves++;
        this.updateStats();
        
        setTimeout(() => {
          this.checkMatch();
        }, 1000);
      }
    },
    
    checkMatch: function() {
      const [card1, card2] = flippedCards;
      
      if (card1.symbol === card2.symbol) {
        // Match!
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');
        matchedPairs++;
        
        // Check if game is complete
        if (matchedPairs === SYMBOLS.length) {
          this.gameComplete();
        }
      } else {
        // No match, flip back
        card1.element.classList.remove('flipped');
        card2.element.classList.remove('flipped');
      }
      
      flippedCards = [];
      isProcessing = false;
      this.updateStats();
    },
    
    updateStats: function() {
      const movesEl = document.getElementById('memory-moves');
      if (movesEl) {
        movesEl.textContent = moves;
      }
      
      const matchedEl = document.getElementById('memory-matched');
      if (matchedEl) {
        matchedEl.textContent = matchedPairs;
      }
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(matchedPairs);
      }
    },
    
    startTimer: function() {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      
      timerInterval = setInterval(() => {
        if (startTime) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const timeEl = document.getElementById('memory-time');
          if (timeEl) {
            timeEl.textContent = elapsed;
          }
        }
      }, 1000);
    },
    
    gameComplete: function() {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      
      // Save progress
      Storage.saveGameProgress('memory', {
        lastMoves: moves,
        lastTime: elapsed,
        completed: true
      });
      
      // Notify callback
      if (callbacks.onGameOver) {
        callbacks.onGameOver({
          score: matchedPairs,
          moves: moves,
          time: elapsed,
          completed: true
        });
      }
      
      // Show completion message
      setTimeout(() => {
        alert(`축하합니다! 모든 카드를 맞췄습니다!\n이동 횟수: ${moves}\n시간: ${elapsed}초`);
      }, 500);
    },
    
    reset: function() {
      this.startNewGame();
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

