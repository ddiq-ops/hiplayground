/**
 * Omok (Five in a Row) Game
 * 1-player with 15 difficulty levels and 2-player mode
 * 오목: 정확히 5개를 연속으로 놓으면 승리
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
      if (saved && saved.board) {
        gameMode = saved.gameMode || 'single';
        difficulty = saved.difficulty || 1;
        board = saved.board;
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
        this.render();
        return true;
      }
      
      // Check draw (board full)
      if (this.isBoardFull()) {
        gameOver = true;
        winner = null;
        this.handleGameEnd();
        this.render();
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
        }, 500);
      }
      
      return true;
    },
    
    /**
     * Make AI move
     */
    makeAIMove() {
      if (gameOver) return;
      
      const move = this.getAIMove();
      if (move) {
        this.makeMove(move.row, move.col);
      }
    },
    
    /**
     * Get AI move based on difficulty
     */
    getAIMove() {
      // Check for winning move (AI must win)
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
     * Find winning move for a player (exactly 5 in a row)
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
      let bestScore = -Infinity;
      let bestMove = null;
      
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === EMPTY) {
            const score = this.evaluatePosition(row, col, WHITE) * 1.2 - 
                         this.evaluatePosition(row, col, BLACK) * 1.0;
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
      if (Math.random() < 0.5) {
        return this.getGoodMove();
      }
      return this.getRandomMove();
    },
    
    /**
     * Get easy move
     */
    getEasyMove() {
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
        [0, 1], [1, 0], [1, 1], [1, -1]
      ];
      
      for (const [dx, dy] of directions) {
        const line = this.getLine(row, col, dx, dy, player);
        score += this.scoreLine(line, player);
      }
      
      return score;
    },
    
    /**
     * Get line of pieces in a direction
     */
    getLine(row, col, dx, dy, player) {
      const line = [];
      for (let i = -5; i <= 5; i++) {
        const r = row + i * dx;
        const c = col + i * dy;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (r === row && c === col) {
            line.push(player);
          } else {
            line.push(board[r][c]);
          }
        } else {
          line.push(-1); // Out of bounds
        }
      }
      return line;
    },
    
    /**
     * Score a line pattern
     */
    scoreLine(line, player) {
      let score = 0;
      const playerStr = player.toString();
      const opponentStr = (player === BLACK ? WHITE : BLACK).toString();
      
      // Check for patterns
      for (let i = 0; i <= line.length - 5; i++) {
        const segment = line.slice(i, i + 5).map(x => x === player ? playerStr : (x === EMPTY ? '0' : opponentStr)).join('');
        
        // Open four (011110)
        if (segment === '011110') score += 10000;
        // Closed four (011112 or 211110)
        if (segment === '011112' || segment === '211110') score += 1000;
        // Open three (01110)
        if (segment === '01110') score += 100;
        // Closed three (01112 or 21110)
        if (segment === '01112' || segment === '21110') score += 10;
        // Two in a row (0110)
        if (segment.includes('0110')) score += 1;
      }
      
      return score;
    },
    
    /**
     * Check if position has nearby pieces
     */
    hasNearbyPiece(row, col) {
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (dr === 0 && dc === 0) continue;
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
     * Check win condition - 정확히 5개 연속 (오목 규칙)
     */
    checkWin(row, col, player) {
      const directions = [
        [0, 1],   // 가로
        [1, 0],   // 세로
        [1, 1],   // 대각선 \
        [1, -1]   // 대각선 /
      ];
      
      for (const [dx, dy] of directions) {
        let count = 1; // 현재 돌 포함
        
        // 양방향으로 연속된 돌 개수 세기
        let leftCount = 0;
        let rightCount = 0;
        
        // 오른쪽 방향
        for (let i = 1; i < 6; i++) {
          const r = row + i * dx;
          const c = col + i * dy;
          if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && 
              board[r][c] === player) {
            rightCount++;
          } else {
            break;
          }
        }
        
        // 왼쪽 방향
        for (let i = 1; i < 6; i++) {
          const r = row - i * dx;
          const c = col - i * dy;
          if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && 
              board[r][c] === player) {
            leftCount++;
          } else {
            break;
          }
        }
        
        const totalCount = 1 + leftCount + rightCount;
        
        // 정확히 5개인지 확인 (6개 이상은 승리 아님)
        if (totalCount === 5) {
          // 양쪽 끝이 비어있거나 보드 밖인지 확인 (장목 방지)
          const leftEndR = row - (leftCount + 1) * dx;
          const leftEndC = col - (leftCount + 1) * dy;
          const rightEndR = row + (rightCount + 1) * dx;
          const rightEndC = col + (rightCount + 1) * dy;
          
          const leftEndEmpty = (leftEndR < 0 || leftEndR >= BOARD_SIZE || 
                                leftEndC < 0 || leftEndC >= BOARD_SIZE ||
                                board[leftEndR][leftEndC] === EMPTY);
          const rightEndEmpty = (rightEndR < 0 || rightEndR >= BOARD_SIZE || 
                                rightEndC < 0 || rightEndC >= BOARD_SIZE ||
                                board[rightEndR][rightEndC] === EMPTY);
          
          // 정확히 5개이고 양쪽 끝 중 하나라도 비어있으면 승리
          if (leftEndEmpty || rightEndEmpty) {
            return true;
          }
        }
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
                <h3>🎉 흑돌 승리!</h3>
                ${gameMode === 'single' && difficulty < 15 ? `
                  <p>다음 난이도: ${difficulty + 1}/15</p>
                ` : gameMode === 'single' && difficulty === 15 ? `
                  <p>축하합니다! 모든 난이도를 완료했습니다! 🏆</p>
                ` : ''}
              </div>
            ` : winner === WHITE ? `
              <div class="game-over-message error">
                <h3>💔 백돌 승리</h3>
                <p>다시 도전해보세요!</p>
              </div>
            ` : `
              <div class="game-over-message">
                <h3>무승부</h3>
                <p>보드가 가득 찼습니다.</p>
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
            ${!isPlayerTurn ? `
            <div class="omok-status-item">
              <span class="status-label">🤖 AI가 생각 중...</span>
            </div>
            ` : ''}
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
          
          <div class="omok-rules">
            <h4>게임 규칙</h4>
            <ul>
              <li>흑돌이 먼저 시작합니다</li>
              <li>번갈아가며 돌을 놓습니다</li>
              <li>가로, 세로, 대각선 중 하나로 <strong>정확히 5개</strong>를 연속으로 놓으면 승리합니다</li>
              <li>6개 이상 연속은 승리가 아닙니다</li>
            </ul>
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
            cell.classList.add('black');
          } else if (board[row][col] === WHITE) {
            cell.classList.add('white');
          } else {
            cell.classList.add('empty');
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
          if (gameOver) return;
          
          const row = parseInt(cell.dataset.row);
          const col = parseInt(cell.dataset.col);
          const isPlayerTurn = gameMode === 'multi' || currentPlayer === BLACK;
          
          if (isPlayerTurn && board[row][col] === EMPTY) {
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
