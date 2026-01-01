/**
 * Omok (Five in a Row) Game
 * 1-player with 15 difficulty levels and 2-player mode
 * 오목: 바둑판의 교차점에 돌을 놓는 게임
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
  let boardElement = null;
  
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
      
      // 오목 게임은 점수/레벨 표시를 사용하지 않음
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
      
      // Check for creating double threat (4-3, 3-3, etc.)
      if (difficulty >= 8) {
        const doubleThreat = this.findDoubleThreat(WHITE);
        if (doubleThreat) return doubleThreat;
        
        const blockDoubleThreat = this.findDoubleThreat(BLACK);
        if (blockDoubleThreat) return blockDoubleThreat;
      }
      
      // Difficulty-based moves - 미니맥스 깊이 조정
      if (difficulty >= 15) {
        // 최고 난이도: 최대 깊이 미니맥스
        return this.getMinimaxMove(7);
      } else if (difficulty >= 12) {
        // 매우 어려움: 깊이 5 탐색
        return this.getMinimaxMove(5);
      } else if (difficulty >= 8) {
        // 어려움: 깊이 4 탐색
        return this.getMinimaxMove(4);
      } else if (difficulty >= 4) {
        // 중간: 깊이 3 탐색
        return this.getMinimaxMove(3);
      } else if (difficulty >= 2) {
        // 중하: 깊이 2 탐색
        return this.getMinimaxMove(2);
      } else {
        // 쉬움: 랜덤과 약간의 로직
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
      const candidates = [];
      
      // Only consider moves near existing pieces (more efficient)
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === EMPTY) {
            // Prioritize moves near existing pieces
            if (this.hasNearbyPiece(row, col) || this.getMoveCount() < 5) {
              const attackScore = this.evaluatePosition(row, col, WHITE);
              const defenseScore = this.evaluatePosition(row, col, BLACK);
              const positionScore = this.getPositionValue(row, col);
              const totalScore = attackScore * 2.0 + defenseScore * 1.8 + positionScore;
              candidates.push({ row, col, score: totalScore });
            }
          }
        }
      }
      
      if (candidates.length === 0) {
        // Fallback to all empty cells
        for (let row = 0; row < BOARD_SIZE; row++) {
          for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === EMPTY) {
              const attackScore = this.evaluatePosition(row, col, WHITE);
              const defenseScore = this.evaluatePosition(row, col, BLACK);
              const positionScore = this.getPositionValue(row, col);
              const totalScore = attackScore * 2.0 + defenseScore * 1.8 + positionScore;
              candidates.push({ row, col, score: totalScore });
            }
          }
        }
      }
      
      if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        // 최고 점수만 선택 (랜덤성 제거)
        return candidates[0];
      }
      
      return this.getRandomMove();
    },
    
    /**
     * Get position value (center and connectivity bonus)
     */
    getPositionValue(row, col) {
      let value = 0;
      const center = BOARD_SIZE / 2;
      const distanceFromCenter = Math.abs(row - center) + Math.abs(col - center);
      value += (BOARD_SIZE - distanceFromCenter) * 2; // 중앙 선호
      
      // 연결성 보너스
      const connections = this.countConnections(row, col);
      value += connections * 5;
      
      return value;
    },
    
    /**
     * Count connections to nearby pieces
     */
    countConnections(row, col) {
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            if (board[r][c] !== EMPTY) count++;
          }
        }
      }
      return count;
    },
    
    /**
     * Get move count
     */
    getMoveCount() {
      let count = 0;
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] !== EMPTY) count++;
        }
      }
      return count;
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
      const opponent = player === BLACK ? WHITE : BLACK;
      
      // Convert line to string for pattern matching
      const lineStr = line.map(x => {
        if (x === player) return '1';
        if (x === opponent) return '2';
        if (x === EMPTY) return '0';
        return 'X'; // Out of bounds
      }).join('');
      
      // Check for patterns in all possible 5-length segments
      for (let i = 0; i <= lineStr.length - 5; i++) {
        const segment = lineStr.slice(i, i + 5);
        
        // Five in a row (11111) - winning
        if (segment === '11111') score += 100000;
        
        // Open four (011110) - can win next turn
        if (segment === '011110' || segment === '01111') score += 10000;
        
        // Closed four (011112, 211110, 01112, 21111) - can win in 2 turns
        if (segment === '011112' || segment === '211110' || 
            segment === '01112' || segment === '21111') score += 5000;
        
        // Open three (01110) - can become open four
        if (segment === '01110') score += 1000;
        
        // Closed three (01112, 21110, 0112, 2110) - can become closed four
        if (segment === '01112' || segment === '21110' ||
            segment === '0112' || segment === '2110') score += 100;
        
        // Open two (0110) - can become open three
        if (segment.includes('0110') || segment.includes('011')) score += 10;
        
        // Single piece (01 or 10) - building
        if (segment.includes('01') || segment.includes('10')) score += 1;
      }
      
      // Check for special patterns (4-3, 3-3, etc.) in longer segments
      for (let len = 6; len <= Math.min(9, lineStr.length); len++) {
        for (let i = 0; i <= lineStr.length - len; i++) {
          const segment = lineStr.slice(i, i + len);
          // Count potential threats
          const openFours = (segment.match(/011110/g) || []).length;
          const openThrees = (segment.match(/01110/g) || []).length;
          
          // Double threat patterns
          if (openFours >= 2) score += 50000; // Double open four
          if (openFours >= 1 && openThrees >= 1) score += 20000; // 4-3 threat
          if (openThrees >= 2) score += 5000; // Double open three (3-3)
        }
      }
      
      return score;
    },
    
    /**
     * Find double threat move (4-3, 3-3, etc.) - 더 정교하게!
     */
    findDoubleThreat(player) {
      const candidates = [];
      const visited = new Set();
      
      // 기존 돌 주변만 체크 (효율성)
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] !== EMPTY) {
            for (let dr = -3; dr <= 3; dr++) {
              for (let dc = -3; dc <= 3; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                const key = `${r},${c}`;
                
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE &&
                    board[r][c] === EMPTY && !visited.has(key)) {
                  visited.add(key);
                  
                  board[r][c] = player;
                  const threatInfo = this.analyzeThreats(r, c, player);
                  board[r][c] = EMPTY;
                  
                  if (threatInfo.totalThreats >= 2) {
                    candidates.push({ 
                      row: r, 
                      col: c, 
                      threats: threatInfo.totalThreats,
                      openFours: threatInfo.openFours,
                      openThrees: threatInfo.openThrees,
                      score: threatInfo.score
                    });
                  }
                }
              }
            }
          }
        }
      }
      
      if (candidates.length > 0) {
        // 점수로 정렬 (더블 오픈 포 > 4-3 > 더블 오픈 삼)
        candidates.sort((a, b) => {
          if (a.openFours >= 2 && b.openFours < 2) return -1;
          if (a.openFours < 2 && b.openFours >= 2) return 1;
          if (a.openFours >= 1 && a.openThrees >= 1 && 
              !(b.openFours >= 1 && b.openThrees >= 1)) return -1;
          if (b.openFours >= 1 && b.openThrees >= 1 && 
              !(a.openFours >= 1 && a.openThrees >= 1)) return 1;
          return b.score - a.score;
        });
        return candidates[0];
      }
      
      return null;
    },
    
    /**
     * Analyze threats at a position - 더 정교한 분석
     */
    analyzeThreats(row, col, player) {
      let openFours = 0;
      let openThrees = 0;
      let closedFours = 0;
      let totalThreats = 0;
      let score = 0;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      
      for (const [dx, dy] of directions) {
        const line = this.getLine(row, col, dx, dy, player);
        const lineStr = line.map(x => {
          if (x === player) return '1';
          if (x === EMPTY) return '0';
          return 'X';
        }).join('');
        
        // 열린 사 체크
        if (lineStr.includes('011110') || lineStr.includes('01111')) {
          openFours++;
          totalThreats++;
          score += 50000;
        }
        
        // 막힌 사 체크
        if (lineStr.includes('011112') || lineStr.includes('211110') ||
            lineStr.includes('01112') || lineStr.includes('21111')) {
          closedFours++;
          totalThreats++;
          score += 10000;
        }
        
        // 열린 삼 체크
        if (lineStr.includes('01110')) {
          openThrees++;
          totalThreats++;
          score += 2000;
        }
      }
      
      return { openFours, openThrees, closedFours, totalThreats, score };
    },
    
    /**
     * Minimax algorithm with alpha-beta pruning
     */
    getMinimaxMove(depth) {
      const candidates = this.getCandidateMoves();
      
      if (candidates.length === 0) return this.getRandomMove();
      
      let bestScore = -Infinity;
      let bestMove = candidates[0];
      
      // 더 많은 후보를 고려 (난이도에 따라)
      const candidateCount = difficulty >= 13 ? 20 : (difficulty >= 11 ? 15 : 10);
      
      for (const move of candidates.slice(0, candidateCount)) {
        board[move.row][move.col] = WHITE;
        const score = this.minimax(depth - 1, false, -Infinity, Infinity, BLACK, 0);
        board[move.row][move.col] = EMPTY;
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      
      return bestMove;
    },
    
    /**
     * Minimax with alpha-beta pruning - 훨씬 더 강력하게!
     */
    minimax(depth, isMaximizing, alpha, beta, player, moveCount = 0) {
      // Terminal conditions
      if (depth === 0) {
        return this.evaluateBoardAdvanced(WHITE) - this.evaluateBoardAdvanced(BLACK);
      }
      
      // Check for win/loss (더 빠른 종료)
      if (isMaximizing) {
        const winMove = this.findWinningMove(WHITE);
        if (winMove) return 1000000 - moveCount; // 빠를수록 좋음
      } else {
        const winMove = this.findWinningMove(BLACK);
        if (winMove) return -1000000 + moveCount;
      }
      
      // 상대방의 승리 수 차단
      if (isMaximizing) {
        const blockMove = this.findWinningMove(BLACK);
        if (blockMove) return -500000;
      } else {
        const blockMove = this.findWinningMove(WHITE);
        if (blockMove) return 500000;
      }
      
      const candidates = this.getCandidateMoves();
      if (candidates.length === 0) return 0;
      
      // 깊이에 따라 후보 수 조정
      const maxCandidates = depth >= 3 ? 10 : (depth >= 2 ? 8 : 6);
      
      if (isMaximizing) {
        let maxScore = -Infinity;
        for (const move of candidates.slice(0, maxCandidates)) {
          board[move.row][move.col] = WHITE;
          const score = this.minimax(depth - 1, false, alpha, beta, BLACK, moveCount + 1);
          board[move.row][move.col] = EMPTY;
          maxScore = Math.max(maxScore, score);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break; // Alpha-beta pruning
        }
        return maxScore;
      } else {
        let minScore = Infinity;
        for (const move of candidates.slice(0, maxCandidates)) {
          board[move.row][move.col] = BLACK;
          const score = this.minimax(depth - 1, true, alpha, beta, WHITE, moveCount + 1);
          board[move.row][move.col] = EMPTY;
          minScore = Math.min(minScore, score);
          beta = Math.min(beta, score);
          if (beta <= alpha) break; // Alpha-beta pruning
        }
        return minScore;
      }
    },
    
    /**
     * Get candidate moves (near existing pieces) - 더 정교하게!
     */
    getCandidateMoves() {
      const candidates = [];
      const visited = new Set();
      
      // 더 넓은 범위 탐색 (난이도에 따라)
      const searchRadius = difficulty >= 13 ? 3 : 2;
      
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] !== EMPTY) {
            // Add nearby empty cells
            for (let dr = -searchRadius; dr <= searchRadius; dr++) {
              for (let dc = -searchRadius; dc <= searchRadius; dc++) {
                if (dr === 0 && dc === 0) continue;
                const r = row + dr;
                const c = col + dc;
                const key = `${r},${c}`;
                
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE &&
                    board[r][c] === EMPTY && !visited.has(key)) {
                  const attackScore = this.evaluatePositionAdvanced(r, c, WHITE);
                  const defenseScore = this.evaluatePositionAdvanced(r, c, BLACK);
                  const positionScore = this.getPositionValue(r, c);
                  const totalScore = attackScore * 1.5 + defenseScore * 1.3 + positionScore;
                  candidates.push({ row: r, col: c, score: totalScore });
                  visited.add(key);
                }
              }
            }
          }
        }
      }
      
      // Sort by score
      candidates.sort((a, b) => b.score - a.score);
      
      // If no candidates (empty board), return center area
      if (candidates.length === 0) {
        const center = Math.floor(BOARD_SIZE / 2);
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            candidates.push({ row: center + dr, col: center + dc, score: 100 });
          }
        }
      }
      
      return candidates;
    },
    
    /**
     * Evaluate entire board for a player
     */
    evaluateBoard(player) {
      let score = 0;
      
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === player) {
            score += this.evaluatePosition(row, col, player);
          }
        }
      }
      
      return score;
    },
    
    /**
     * Advanced board evaluation - 더 정교한 평가
     */
    evaluateBoardAdvanced(player) {
      let score = 0;
      const opponent = player === BLACK ? WHITE : BLACK;
      
      // 모든 돌의 위치 평가
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === player) {
            score += this.evaluatePositionAdvanced(row, col, player);
          } else if (board[row][col] === opponent) {
            score -= this.evaluatePositionAdvanced(row, col, opponent) * 0.9; // 상대방 수비 고려
          }
        }
      }
      
      // 전체적인 패턴 평가
      score += this.evaluateGlobalPatterns(player) * 100;
      
      return score;
    },
    
    /**
     * Advanced position evaluation
     */
    evaluatePositionAdvanced(row, col, player) {
      let score = 0;
      const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
      
      for (const [dx, dy] of directions) {
        const line = this.getLine(row, col, dx, dy, player);
        score += this.scoreLineAdvanced(line, player);
      }
      
      return score;
    },
    
    /**
     * Advanced line scoring - 더 정교한 패턴 인식
     */
    scoreLineAdvanced(line, player) {
      let score = 0;
      const opponent = player === BLACK ? WHITE : BLACK;
      
      const lineStr = line.map(x => {
        if (x === player) return '1';
        if (x === opponent) return '2';
        if (x === EMPTY) return '0';
        return 'X';
      }).join('');
      
      // 더 긴 패턴 체크 (최대 9개까지)
      for (let len = 5; len <= Math.min(9, lineStr.length); len++) {
        for (let i = 0; i <= lineStr.length - len; i++) {
          const segment = lineStr.slice(i, i + len);
          
          // 5개 연속 (승리)
          if (segment === '11111') score += 1000000;
          
          // 열린 사 (011110) - 다음 턴에 승리 가능
          if (segment === '011110') score += 50000;
          
          // 막힌 사 (011112, 211110) - 2턴 내 승리 가능
          if (segment === '011112' || segment === '211110') score += 10000;
          
          // 열린 삼 (01110) - 2턴 내 열린 사 가능
          if (segment === '01110') score += 2000;
          
          // 막힌 삼 (01112, 21110) - 3턴 내 막힌 사 가능
          if (segment === '01112' || segment === '21110') score += 500;
          
          // 열린 이 (0110) - 3턴 내 열린 삼 가능
          if (segment.includes('0110') && !segment.includes('2')) score += 50;
          
          // 막힌 이 (0112, 2110) - 4턴 내 막힌 삼 가능
          if (segment.includes('0112') || segment.includes('2110')) score += 10;
        }
      }
      
      // 더블 위협 체크
      const openFours = (lineStr.match(/011110/g) || []).length;
      const openThrees = (lineStr.match(/01110/g) || []).length;
      
      if (openFours >= 2) score += 200000; // 더블 오픈 포
      if (openFours >= 1 && openThrees >= 1) score += 100000; // 4-3 위협
      if (openThrees >= 2) score += 50000; // 더블 오픈 삼 (3-3)
      
      return score;
    },
    
    /**
     * Evaluate global patterns (연결성, 중심성 등)
     */
    evaluateGlobalPatterns(player) {
      let score = 0;
      const center = BOARD_SIZE / 2;
      
      // 중심에 가까운 돌에 보너스
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === player) {
            const distFromCenter = Math.abs(row - center) + Math.abs(col - center);
            score += (BOARD_SIZE - distFromCenter) * 0.1;
          }
        }
      }
      
      // 연결성 보너스
      const groups = this.findGroups(player);
      score += groups.length * 2; // 더 많은 그룹 = 더 좋음
      
      return score;
    },
    
    /**
     * Find connected groups
     */
    findGroups(player) {
      const visited = new Set();
      const groups = [];
      
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (board[row][col] === player && !visited.has(`${row},${col}`)) {
            const group = [];
            this.dfsGroup(row, col, player, visited, group);
            if (group.length > 0) groups.push(group);
          }
        }
      }
      
      return groups;
    },
    
    /**
     * DFS to find connected group
     */
    dfsGroup(row, col, player, visited, group) {
      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
      if (board[row][col] !== player) return;
      const key = `${row},${col}`;
      if (visited.has(key)) return;
      
      visited.add(key);
      group.push({ row, col });
      
      // Check 8 directions
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          this.dfsGroup(row + dr, col + dc, player, visited, group);
        }
      }
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
              <li>번갈아가며 <strong>교차점</strong>에 돌을 놓습니다</li>
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
     * Render board with intersection points
     */
    renderBoard() {
      const boardEl = document.getElementById('omok-board');
      if (!boardEl) return;
      
      boardEl.innerHTML = '';
      boardElement = boardEl;
      
      // Create SVG for grid lines - 정확한 교차점에 선을 그림
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'omok-grid-svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.position = 'absolute';
      svg.style.top = '0';
      svg.style.left = '0';
      svg.style.pointerEvents = 'none';
      svg.style.zIndex = '1';
      
      // Draw horizontal lines - 각 셀의 중심(50%)을 지나가도록
      for (let i = 0; i < BOARD_SIZE; i++) {
        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const yPercent = ((i + 0.5) / BOARD_SIZE) * 100;
        hLine.setAttribute('x1', '0%');
        hLine.setAttribute('y1', `${yPercent}%`);
        hLine.setAttribute('x2', '100%');
        hLine.setAttribute('y2', `${yPercent}%`);
        hLine.setAttribute('stroke', '#8b6914');
        hLine.setAttribute('stroke-width', '1.5');
        svg.appendChild(hLine);
      }
      
      // Draw vertical lines - 각 셀의 중심(50%)을 지나가도록
      for (let i = 0; i < BOARD_SIZE; i++) {
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const xPercent = ((i + 0.5) / BOARD_SIZE) * 100;
        vLine.setAttribute('x1', `${xPercent}%`);
        vLine.setAttribute('y1', '0%');
        vLine.setAttribute('x2', `${xPercent}%`);
        vLine.setAttribute('y2', '100%');
        vLine.setAttribute('stroke', '#8b6914');
        vLine.setAttribute('stroke-width', '1.5');
        svg.appendChild(vLine);
      }
      
      boardEl.appendChild(svg);
      
      // Create intersection points (15x15 = 225 points)
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const point = document.createElement('div');
          point.className = 'omok-point';
          point.dataset.row = row;
          point.dataset.col = col;
          
          if (board[row][col] === BLACK) {
            point.classList.add('black');
          } else if (board[row][col] === WHITE) {
            point.classList.add('white');
          } else {
            point.classList.add('empty');
          }
          
          boardEl.appendChild(point);
        }
      }
    },
    
    setupEvents: function() {
      // Board clicks on intersection points
      const points = document.querySelectorAll('.omok-point');
      points.forEach(point => {
        point.addEventListener('click', (e) => {
          if (gameOver) return;
          
          const row = parseInt(point.dataset.row);
          const col = parseInt(point.dataset.col);
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
