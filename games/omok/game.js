/**
 * Omok (Five in a Row) Game
 * 1-player with 15 difficulty levels and 2-player mode
 */

(function() {
  const BOARD_SIZE = 15;
  const EMPTY = 0;
  const BLACK = 1;
  const WHITE = 2;
  
  let board = [];
  let currentPlayer = BLACK;
  let gameMode = 'single'; // 'single' or 'multi'
  let difficulty = 1; // 1-15
  let gameOver = false;
  let winner = null;
  let moveHistory = [];
  let callbacks = {};
  let container = null;
  
  // Game state
  const Game = {
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      // Load saved progress if available
      const saved = Storage.getGameProgress('omok');
      if (saved) {
        gameMode = saved.gameMode || 'single';
        difficulty = saved.difficulty || 1;
        board = saved.board || this.createEmptyBoard();
        currentPlayer = saved.currentPlayer || BLACK;
        gameOver = saved.gameOver || false;
        winner = saved.winner || null;
        moveHistory = saved.moveHistory || [];
      } else {
        board = this.createEmptyBoard();
      }
      
      this.render();
      this.setupEvents();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(difficulty);
      }
    },
    
    /**
     * Create empty board
     */
    createEmptyBoard() {
      return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    },
    
    /**
     * Reset game
     */
    resetGame() {
      board = this.createEmptyBoard();
      currentPlayer = BLACK;
      gameOver = false;
      winner = null;
      moveHistory = [];
      this.saveProgress();
      this.render();
    },
    
    /**
     * Make a move
     */
    makeMove(row, col) {
      if (gameOver || board[row][col] !== EMPTY) {
        return false;
      }
      
      // Player move
      board[row][col] = currentPlayer;
      moveHistory.push({ row, col, player: currentPlayer });
      
      // Check win
      if (this.checkWin(row, col, currentPlayer)) {
        gameOver = true;
        winner = currentPlayer;
        this.handleGameEnd();
        return true;
      }
      
      // Check draw (board full)
      if (this.isBoardFull()) {
        gameOver = true;
        winner = null;
        this.handleGameEnd();
        return true;
      }
      
      // Switch player
      currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
      
      this.saveProgress();
      this.render();
      
      // AI move in single player mode
      if (gameMode === 'single' && currentPlayer === WHITE && !gameOver) {
        setTimeout(() => {
          this.makeAIMove();
        }, 300);
      }
      
      return true;
    },
    
    /**
     * Make AI move
     */
    makeAIMove() {
      const move = this.getAIMove();
      if (move) {
        this.makeMove(move.row, move.col);
      }
    },
    
    /**
     * Get AI move based on difficulty
     */
    getAIMove() {
      // Check for winning move (AI)
      const winMove = this.findWinningMove(WHITE);
      if (winMove) return winMove;
      
      // Check for blocking opponent's winning move
      const blockMove = this.findWinningMove(BLACK);
      if (blockMove) return blockMove;
      
      // Difficulty-based moves
      if (difficulty >= 14) {
        // Very hard: Strong strategic play
        return this.getStrongMove();
      } else if (difficulty >= 10) {
        // Hard: Good strategic play
        return this.getGoodMove();
      } else if (difficulty >= 5) {
        // Medium: Some strategy
        return this.getMediumMove();
      } else {
        // Easy: Random with some logic
        return this.getEasyMove();
      }
    },
    
    /**
     * Find winning move for a player
     */
    findWinningMove(player) {
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === EMPTY) {
            board[row][col] = player;
            if (this.checkWin(row, col, player)) {
              board[row][col] = EMPTY;
              return { row, col };
            }
            board[row][col] = EMPTY;
          }
        }
      }
      return null;
    },
    
    /**
     * Get strong move (very hard AI)
     */
    getStrongMove() {
      // Evaluate all positions and choose best
      let bestScore = -Infinity;
      let bestMove = null;
      
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === EMPTY) {
            const score = this.evaluatePosition(row, col, WHITE) - 
                         this.evaluatePosition(row, col, BLACK) * 0.8;
            if (score > bestScore) {
              bestScore = score;
              bestMove = { row, col };
            }
          }
        }
      }
      
      return bestMove || this.getRandomMove();
    },
    
    /**
     * Get good move (hard AI)
     */
    getGoodMove() {
      // Look for good positions near existing pieces
      const candidates = [];
      
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === EMPTY && this.hasNearbyPiece(row, col)) {
            const score = this.evaluatePosition(row, col, WHITE);
            candidates.push({ row, col, score });
          }
        }
      }
      
      if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0];
      }
      
      return this.getRandomMove();
    },
    
    /**
     * Get medium move
     */
    getMediumMove() {
      // 50% chance to use good move, 50% random
      if (Math.random() < 0.5) {
        return this.getGoodMove();
      }
      return this.getRandomMove();
    },
    
    /**
     * Get easy move
     */
    getEasyMove() {
      // 30% chance to use good move, 70% random
      if (Math.random() < 0.3) {
        return this.getGoodMove();
      }
      return this.getRandomMove();
    },
    
    /**
     * Evaluate position for a player
     */
    evaluatePosition(row, col, player) {
      let score = 0;
      const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1] // horizontal, vertical, diagonal
      ];
      
      for (const [dx, dy] of directions) {
        const line = this.getLine(row, col, dx, dy, player);
        score += this.scoreLine(line);
      }
      
      return score;
    },
    
    /**
     * Get line of pieces in a direction
     */
    getLine(row, col, dx, dy, player) {
      const line = [];
      for (let i = -4; i <= 4; i++) {
        const r = row + i * dx;
        const c = col + i * dy;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (r === row && c === col) {
            line.push(player);
          } else {
            line.push(board[r][c]);
          }
        }
      }
      return line;
    },
    
    /**
     * Score a line pattern
     */
    scoreLine(line) {
      const pattern = line.join('');
      const player = line[4]; // center
      
      // Five in a row
      if (pattern.includes('11111') || pattern.includes('22222')) return 100000;
      
      // Open four
      if (pattern.includes('011110') || pattern.includes('022220')) return 10000;
      
      // Closed four
      if (pattern.includes('011112') || pattern.includes('022221') ||
          pattern.includes('211110') || pattern.includes('122220')) return 1000;
      
      // Open three
      if (pattern.includes('01110') || pattern.includes('02220')) return 100;
      
      // Closed three
      if (pattern.includes('01112') || pattern.includes('02221') ||
          pattern.includes('21110') || pattern.includes('12220')) return 10;
      
      // Two in a row
      if (pattern.includes('0110') || pattern.includes('0220')) return 1;
      
      return 0;
    },
    
    /**
     * Check if position has nearby pieces
     */
    hasNearbyPiece(row, col) {
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] !== EMPTY) return true;
          }
        }
      }
      return false;
    },
    
    /**
     * Get random move
     */
    getRandomMove() {
      const emptyCells = [];
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === EMPTY) {
            emptyCells.push({ row, col });
          }
        }
      }
      
      if (emptyCells.length === 0) return null;
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    },
    
    /**
     * Check if board is full
     */
    isBoardFull() {
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === EMPTY) return false;
        }
      }
      return true;
    },
    
    /**
     * Check win condition
     */
    checkWin(row, col, player) {
      const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
      ];
      
      for (const [dx, dy] of directions) {
        let count = 1; // Count current piece
        
        // Check positive direction
        for (let i = 1; i < 5; i++) {
          const r = row + i * dx;
          const c = col + i * dy;
          if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && 
              board[r][c] === player) {
            count++;
          } else {
            break;
          }
        }
        
        // Check negative direction
        for (let i = 1; i < 5; i++) {
          const r = row - i * dx;
          const c = col - i * dy;
          if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && 
              board[r][c] === player) {
            count++;
          } else {
            break;
          }
        }
        
        if (count >= 5) return true;
      }
      
      return false;
    },
    
    /**
     * Handle game end
     */
    handleGameEnd() {
      this.saveProgress();
      
      if (callbacks.onGameOver) {
        callbacks.onGameOver({
          score: difficulty,
          completed: winner === BLACK,
          winner: winner
        });
      }
      
      // In single player mode, advance difficulty on win
      if (gameMode === 'single' && winner === BLACK && difficulty < 15) {
        difficulty++;
        this.saveProgress();
      }
      
      this.render();
    },
    
    /**
     * Save progress
     */
    saveProgress() {
      Storage.saveGameProgress('omok', {
        gameMode: gameMode,
        difficulty: difficulty,
        board: board,
        currentPlayer: currentPlayer,
        gameOver: gameOver,
        winner: winner,
        moveHistory: moveHistory
      });
    },
    
    /**
     * Switch game mode
     */
    switchMode(mode) {
      gameMode = mode;
      if (mode === 'single') {
        difficulty = 1;
      }
      this.resetGame();
    },
    
    render: function() {
      if (!container) return;
      
      const playerName = currentPlayer === BLACK ? '흑돌' : '백돌';
      const isPlayerTurn = gameMode === 'multi' || currentPlayer === BLACK;
      
      container.innerHTML = `
        <div class="omok-game">
          <div class="omok-header">
            <h2 class="omok-title">🎯 오목</h2>
            <div class="omok-mode-selector">
              <button class="btn ${gameMode === 'single' ? 'btn-primary' : 'btn-outline'}" id="mode-single">
                1인용 (난이도 ${difficulty}/15)
              </button>
              <button class="btn ${gameMode === 'multi' ? 'btn-primary' : 'btn-outline'}" id="mode-multi">
                2인용
              </button>
            </div>
          </div>
          
          ${gameOver ? `
          <div class="omok-game-over">
            ${winner === BLACK ? `
              <div class="game-over-message success">
                <h3>🎉 승리!</h3>
                ${gameMode === 'single' && difficulty < 15 ? `
                  <p>다음 난이도: ${difficulty + 1}/15</p>
                ` : gameMode === 'single' && difficulty === 15 ? `
                  <p>축하합니다! 모든 난이도를 완료했습니다! 🏆</p>
                ` : ''}
              </div>
            ` : winner === WHITE ? `
              <div class="game-over-message error">
                <h3>💔 패배</h3>
                <p>다시 도전해보세요!</p>
              </div>
            ` : `
              <div class="game-over-message">
                <h3>무승부</h3>
              </div>
            `}
            <button class="btn btn-primary" id="restart-btn">다시 시작</button>
          </div>
          ` : `
          <div class="omok-status">
            <div class="omok-status-item">
              <span class="status-label">현재 턴:</span>
              <span class="status-value ${currentPlayer === BLACK ? 'black' : 'white'}">
                ${playerName}
              </span>
            </div>
            ${gameMode === 'single' ? `
            <div class="omok-status-item">
              <span class="status-label">난이도:</span>
              <span class="status-value">${difficulty}/15</span>
            </div>
            ` : ''}
            ${!isPlayerTurn ? `
            <div class="omok-status-item">
              <span class="status-label">AI가 생각 중...</span>
            </div>
            ` : ''}
          </div>
          `}
          
          <div class="omok-board-container">
            <div class="omok-board" id="omok-board"></div>
          </div>
          
          <div class="omok-controls">
            <button class="btn btn-secondary" id="reset-btn">게임 리셋</button>
            ${moveHistory.length > 0 ? `
            <button class="btn btn-outline" id="undo-btn">한 수 되돌리기</button>
            ` : ''}
          </div>
        </div>
      `;
      
      this.renderBoard();
      this.setupEvents();
    },
    
    /**
     * Render board
     */
    renderBoard() {
      const boardEl = document.getElementById('omok-board');
      if (!boardEl) return;
      
      boardEl.innerHTML = '';
      
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const cell = document.createElement('div');
          cell.className = 'omok-cell';
          cell.dataset.row = row;
          cell.dataset.col = col;
          
          if (board[row][col] === BLACK) {
            cell.className += ' black';
            cell.textContent = '●';
          } else if (board[row][col] === WHITE) {
            cell.className += ' white';
            cell.textContent = '○';
          }
          
          boardEl.appendChild(cell);
        }
      }
    },
    
    setupEvents: function() {
      // Board clicks
      const cells = document.querySelectorAll('.omok-cell');
      cells.forEach(cell => {
        cell.addEventListener('click', () => {
          const row = parseInt(cell.dataset.row);
          const col = parseInt(cell.dataset.col);
          const isPlayerTurn = gameMode === 'multi' || currentPlayer === BLACK;
          
          if (!gameOver && isPlayerTurn) {
            this.makeMove(row, col);
          }
        });
      });
      
      // Mode buttons
      const singleBtn = document.getElementById('mode-single');
      if (singleBtn) {
        singleBtn.addEventListener('click', () => {
          this.switchMode('single');
        });
      }
      
      const multiBtn = document.getElementById('mode-multi');
      if (multiBtn) {
        multiBtn.addEventListener('click', () => {
          this.switchMode('multi');
        });
      }
      
      // Reset button
      const resetBtn = document.getElementById('reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('게임을 리셋하시겠습니까?')) {
            this.resetGame();
          }
        });
      }
      
      // Restart button
      const restartBtn = document.getElementById('restart-btn');
      if (restartBtn) {
        restartBtn.addEventListener('click', () => {
          this.resetGame();
        });
      }
      
      // Undo button
      const undoBtn = document.getElementById('undo-btn');
      if (undoBtn) {
        undoBtn.addEventListener('click', () => {
          this.undoMove();
        });
      }
    },
    
    /**
     * Undo last move
     */
    undoMove() {
      if (moveHistory.length === 0 || gameOver) return;
      
      // Remove last two moves (player + AI in single mode, or two players in multi mode)
      const movesToUndo = gameMode === 'single' ? 2 : 1;
      
      for (let i = 0; i < movesToUndo && moveHistory.length > 0; i++) {
        const move = moveHistory.pop();
        board[move.row][move.col] = EMPTY;
        currentPlayer = move.player;
      }
      
      // If only one move left and single mode, remove it too
      if (gameMode === 'single' && moveHistory.length === 1) {
        const move = moveHistory.pop();
        board[move.row][move.col] = EMPTY;
        currentPlayer = BLACK;
      }
      
      gameOver = false;
      winner = null;
      
      this.saveProgress();
      this.render();
    },
    
    reset: function() {
      this.resetGame();
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

