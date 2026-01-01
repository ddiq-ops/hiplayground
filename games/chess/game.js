/**
 * Chess Game
 * 1-player with difficulty levels and 2-player mode
 * 체스: 전략적 보드 게임
 */

(function() {
  const BOARD_SIZE = 8;
  const EMPTY = 0;
  const WHITE = 1;
  const BLACK = 2;
  
  // Piece types
  const KING = 'K';
  const QUEEN = 'Q';
  const ROOK = 'R';
  const BISHOP = 'B';
  const KNIGHT = 'N';
  const PAWN = 'P';
  
  let board = [];
  let currentPlayer = WHITE;
  let gameMode = 'single'; // 'single' or 'multi'
  let difficulty = 1; // 1-15
  let gameOver = false;
  let winner = null;
  let moveHistory = [];
  let selectedSquare = null;
  let validMoves = [];
  let callbacks = {};
  let container = null;
  let boardElement = null;
  let whiteKingPos = { row: 7, col: 4 };
  let blackKingPos = { row: 0, col: 4 };
  let canCastle = {
    white: { kingside: true, queenside: true },
    black: { kingside: true, queenside: true }
  };
  let enPassantTarget = null;
  let pendingPromotion = null;
  let checkmateState = {
    white: false,
    black: false
  };
  
  // Game state
  const Game = {
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      // Load saved progress if available
      const saved = Storage.getGameProgress('chess');
      if (saved && saved.board && !saved.gameOver) {
        gameMode = saved.gameMode || 'single';
        difficulty = saved.difficulty || 1;
        board = saved.board;
        currentPlayer = saved.currentPlayer || WHITE;
        gameOver = false; // Always start fresh
        winner = null;
        moveHistory = saved.moveHistory || [];
        canCastle = saved.canCastle || {
          white: { kingside: true, queenside: true },
          black: { kingside: true, queenside: true }
        };
        enPassantTarget = saved.enPassantTarget || null;
        this.updateKingPositions();
      } else {
        board = this.createInitialBoard();
        gameOver = false;
        winner = null;
        currentPlayer = WHITE;
        moveHistory = [];
        canCastle = {
          white: { kingside: true, queenside: true },
          black: { kingside: true, queenside: true }
        };
        enPassantTarget = null;
        checkmateState = {
          white: false,
          black: false
        };
        this.updateKingPositions();
      }
      
      this.render();
      this.setupEvents();
    },
    
    /**
     * Create initial chess board
     */
    createInitialBoard() {
      const b = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
      
      // Black pieces (top)
      b[0][0] = { type: ROOK, color: BLACK };
      b[0][1] = { type: KNIGHT, color: BLACK };
      b[0][2] = { type: BISHOP, color: BLACK };
      b[0][3] = { type: QUEEN, color: BLACK };
      b[0][4] = { type: KING, color: BLACK };
      b[0][5] = { type: BISHOP, color: BLACK };
      b[0][6] = { type: KNIGHT, color: BLACK };
      b[0][7] = { type: ROOK, color: BLACK };
      for (let i = 0; i < 8; i++) {
        b[1][i] = { type: PAWN, color: BLACK };
      }
      
      // White pieces (bottom)
      b[7][0] = { type: ROOK, color: WHITE };
      b[7][1] = { type: KNIGHT, color: WHITE };
      b[7][2] = { type: BISHOP, color: WHITE };
      b[7][3] = { type: QUEEN, color: WHITE };
      b[7][4] = { type: KING, color: WHITE };
      b[7][5] = { type: BISHOP, color: WHITE };
      b[7][6] = { type: KNIGHT, color: WHITE };
      b[7][7] = { type: ROOK, color: WHITE };
      for (let i = 0; i < 8; i++) {
        b[6][i] = { type: PAWN, color: WHITE };
      }
      
      return b;
    },
    
    /**
     * Update king positions
     */
    updateKingPositions() {
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];
          if (piece && piece.type === KING) {
            if (piece.color === WHITE) {
              whiteKingPos = { row, col };
            } else {
              blackKingPos = { row, col };
            }
          }
        }
      }
    },
    
    /**
     * Reset game
     */
    resetGame() {
      board = this.createInitialBoard();
      currentPlayer = WHITE;
      gameOver = false;
      winner = null;
      moveHistory = [];
      selectedSquare = null;
      validMoves = [];
      canCastle = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      };
      enPassantTarget = null;
      checkmateState = {
        white: false,
        black: false
      };
      this.updateKingPositions();
      this.saveProgress();
      this.render();
    },
    
    /**
     * Get piece symbol
     */
    getPieceSymbol(piece) {
      if (!piece) return '';
      const symbols = {
        [KING]: '♔',
        [QUEEN]: '♕',
        [ROOK]: '♖',
        [BISHOP]: '♗',
        [KNIGHT]: '♘',
        [PAWN]: '♙'
      };
      const blackSymbols = {
        [KING]: '♚',
        [QUEEN]: '♛',
        [ROOK]: '♜',
        [BISHOP]: '♝',
        [KNIGHT]: '♞',
        [PAWN]: '♟'
      };
      return piece.color === WHITE ? symbols[piece.type] : blackSymbols[piece.type];
    },
    
    /**
     * Get valid moves for a piece
     */
    getValidMoves(row, col, forColor = null) {
      const piece = board[row][col];
      const color = forColor || currentPlayer;
      if (!piece || piece.color !== color) return [];
      
      let moves = [];
      
      switch (piece.type) {
        case PAWN:
          moves = this.getPawnMoves(row, col, piece);
          break;
        case ROOK:
          moves = this.getRookMoves(row, col, piece);
          break;
        case KNIGHT:
          moves = this.getKnightMoves(row, col, piece);
          break;
        case BISHOP:
          moves = this.getBishopMoves(row, col, piece);
          break;
        case QUEEN:
          moves = this.getQueenMoves(row, col, piece);
          break;
        case KING:
          moves = this.getKingMoves(row, col, piece);
          break;
      }
      
      // Allow all moves - don't filter out moves that would put own king in check
      // This allows players to move freely even in check/checkmate situations
      return moves;
    },
    
    /**
     * Get pawn moves
     */
    getPawnMoves(row, col, piece) {
      const moves = [];
      const direction = piece.color === WHITE ? -1 : 1;
      const startRow = piece.color === WHITE ? 6 : 1;
      
      // Move forward one square
      if (row + direction >= 0 && row + direction < BOARD_SIZE) {
        if (board[row + direction][col] === EMPTY) {
          moves.push({ row: row + direction, col });
          
          // Move forward two squares from starting position
          if (row === startRow && board[row + 2 * direction][col] === EMPTY) {
            moves.push({ row: row + 2 * direction, col });
          }
        }
      }
      
      // Capture diagonally
      for (const dcol of [-1, 1]) {
        const newCol = col + dcol;
        if (newCol >= 0 && newCol < BOARD_SIZE && row + direction >= 0 && row + direction < BOARD_SIZE) {
          const target = board[row + direction][newCol];
          if (target && target.color !== piece.color) {
            moves.push({ row: row + direction, col: newCol });
          }
          // En passant
          if (enPassantTarget && enPassantTarget.row === row + direction && enPassantTarget.col === newCol) {
            moves.push({ row: row + direction, col: newCol, enPassant: true });
          }
        }
      }
      
      return moves;
    },
    
    /**
     * Get rook moves
     */
    getRookMoves(row, col, piece) {
      const moves = [];
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      
      for (const [dr, dc] of directions) {
        for (let i = 1; i < BOARD_SIZE; i++) {
          const newRow = row + dr * i;
          const newCol = col + dc * i;
          
          if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
          
          const target = board[newRow][newCol];
          if (target === EMPTY) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (target.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
        }
      }
      
      return moves;
    },
    
    /**
     * Get knight moves
     */
    getKnightMoves(row, col, piece) {
      const moves = [];
      const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      
      for (const [dr, dc] of offsets) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
          const target = board[newRow][newCol];
          if (target === EMPTY || target.color !== piece.color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
      
      return moves;
    },
    
    /**
     * Get bishop moves
     */
    getBishopMoves(row, col, piece) {
      const moves = [];
      const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      
      for (const [dr, dc] of directions) {
        for (let i = 1; i < BOARD_SIZE; i++) {
          const newRow = row + dr * i;
          const newCol = col + dc * i;
          
          if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) break;
          
          const target = board[newRow][newCol];
          if (target === EMPTY) {
            moves.push({ row: newRow, col: newCol });
          } else {
            if (target.color !== piece.color) {
              moves.push({ row: newRow, col: newCol });
            }
            break;
          }
        }
      }
      
      return moves;
    },
    
    /**
     * Get queen moves
     */
    getQueenMoves(row, col, piece) {
      return [...this.getRookMoves(row, col, piece), ...this.getBishopMoves(row, col, piece)];
    },
    
    /**
     * Get king moves
     */
    getKingMoves(row, col, piece) {
      const moves = [];
      const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      
      for (const [dr, dc] of offsets) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
          const target = board[newRow][newCol];
          if (target === EMPTY || target.color !== piece.color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
      }
      
      // Castling
      const colorKey = piece.color === WHITE ? 'white' : 'black';
      const kingRow = piece.color === WHITE ? 7 : 0;
      
      if (row === kingRow && col === 4) {
        // Kingside castling
        if (canCastle[colorKey].kingside && 
            board[kingRow][5] === EMPTY && 
            board[kingRow][6] === EMPTY &&
            board[kingRow][7] && 
            board[kingRow][7].type === ROOK && 
            board[kingRow][7].color === piece.color) {
          if (!this.isSquareAttacked(kingRow, 4, piece.color === WHITE ? BLACK : WHITE) &&
              !this.isSquareAttacked(kingRow, 5, piece.color === WHITE ? BLACK : WHITE) &&
              !this.isSquareAttacked(kingRow, 6, piece.color === WHITE ? BLACK : WHITE)) {
            moves.push({ row: kingRow, col: 6, castling: 'kingside' });
          }
        }
        
        // Queenside castling
        if (canCastle[colorKey].queenside && 
            board[kingRow][1] === EMPTY && 
            board[kingRow][2] === EMPTY &&
            board[kingRow][3] === EMPTY &&
            board[kingRow][0] && 
            board[kingRow][0].type === ROOK && 
            board[kingRow][0].color === piece.color) {
          if (!this.isSquareAttacked(kingRow, 4, piece.color === WHITE ? BLACK : WHITE) &&
              !this.isSquareAttacked(kingRow, 3, piece.color === WHITE ? BLACK : WHITE) &&
              !this.isSquareAttacked(kingRow, 2, piece.color === WHITE ? BLACK : WHITE)) {
            moves.push({ row: kingRow, col: 2, castling: 'queenside' });
          }
        }
      }
      
      return moves;
    },
    
    /**
     * Check if square is attacked by opponent
     */
    isSquareAttacked(row, col, byColor) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const piece = board[r][c];
          if (piece && piece.color === byColor) {
            const moves = this.getPieceMovesWithoutCheck(r, c, piece);
            if (moves.some(m => m.row === row && m.col === col)) {
              return true;
            }
          }
        }
      }
      return false;
    },
    
    /**
     * Get piece moves without check validation (for attack checking)
     */
    getPieceMovesWithoutCheck(row, col, piece) {
      if (!piece) return [];
      
      switch (piece.type) {
        case PAWN:
          return this.getPawnMoves(row, col, piece);
        case ROOK:
          return this.getRookMoves(row, col, piece);
        case KNIGHT:
          return this.getKnightMoves(row, col, piece);
        case BISHOP:
          return this.getBishopMoves(row, col, piece);
        case QUEEN:
          return this.getQueenMoves(row, col, piece);
        case KING:
          const moves = [];
          const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
          for (const [dr, dc] of offsets) {
            const newRow = row + dr;
            const newCol = col + dc;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
              const target = board[newRow][newCol];
              if (target === EMPTY || target.color !== piece.color) {
                moves.push({ row: newRow, col: newCol });
              }
            }
          }
          return moves;
        default:
          return [];
      }
    },
    
    /**
     * Check if move would put own king in check
     */
    wouldMovePutKingInCheck(fromRow, fromCol, toRow, toCol) {
      const piece = board[fromRow][fromCol];
      const captured = board[toRow][toCol];
      
      // Make move temporarily
      board[toRow][toCol] = piece;
      board[fromRow][fromCol] = EMPTY;
      
      // Update king position if moving king
      let kingPos = piece.color === WHITE ? whiteKingPos : blackKingPos;
      if (piece.type === KING) {
        kingPos = { row: toRow, col: toCol };
      }
      
      const inCheck = this.isSquareAttacked(kingPos.row, kingPos.col, piece.color === WHITE ? BLACK : WHITE);
      
      // Undo move
      board[fromRow][fromCol] = piece;
      board[toRow][toCol] = captured;
      
      return inCheck;
    },
    
    /**
     * Check if player is in check
     */
    isInCheck(color) {
      const kingPos = color === WHITE ? whiteKingPos : blackKingPos;
      return this.isSquareAttacked(kingPos.row, kingPos.col, color === WHITE ? BLACK : WHITE);
    },
    
    /**
     * Check if player is in checkmate
     */
    isCheckmate(color) {
      if (!this.isInCheck(color)) return false;
      
      // Check if any move can get out of check
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];
          if (piece && piece.color === color) {
            const moves = this.getValidMoves(row, col, color);
            if (moves.length > 0) return false;
          }
        }
      }
      
      return true;
    },
    
    /**
     * Check if player is in stalemate
     */
    isStalemate(color) {
      // Stalemate can only occur if player is not in check
      if (this.isInCheck(color)) return false;
      
      // Check if player has any legal moves
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];
          if (piece && piece.color === color) {
            const moves = this.getValidMoves(row, col, color);
            if (moves.length > 0) {
              return false; // Player has at least one legal move
            }
          }
        }
      }
      
      // No legal moves and not in check = stalemate
      return true;
    },
    
    /**
     * Make a move
     */
    makeMove(fromRow, fromCol, toRow, toCol, promotion = null) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== currentPlayer) return false;
      
      const moves = this.getValidMoves(fromRow, fromCol);
      const move = moves.find(m => m.row === toRow && m.col === toCol);
      if (!move) return false;
      
      const captured = board[toRow][toCol];
      
      // Check if king is captured - end game immediately
      if (captured && captured.type === KING) {
        gameOver = true;
        winner = currentPlayer;
        this.handleGameEnd();
        // Make the move to show the final position
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = EMPTY;
        this.saveProgress();
        this.render();
        return true;
      }
      
      // Make the move
      board[toRow][toCol] = piece;
      board[fromRow][fromCol] = EMPTY;
      
      // Handle special moves
      if (move.castling) {
        const kingRow = piece.color === WHITE ? 7 : 0;
        if (move.castling === 'kingside') {
          board[kingRow][5] = board[kingRow][7];
          board[kingRow][7] = EMPTY;
        } else {
          board[kingRow][3] = board[kingRow][0];
          board[kingRow][0] = EMPTY;
        }
        const colorKey = piece.color === WHITE ? 'white' : 'black';
        canCastle[colorKey].kingside = false;
        canCastle[colorKey].queenside = false;
      }
      
      if (move.enPassant) {
        const direction = piece.color === WHITE ? 1 : -1;
        board[toRow + direction][toCol] = EMPTY;
      }
      
      // Update en passant target
      enPassantTarget = null;
      if (piece.type === PAWN && Math.abs(toRow - fromRow) === 2) {
        enPassantTarget = { row: (fromRow + toRow) / 2, col: toCol };
      }
      
      // Handle promotion
      if (piece.type === PAWN && (toRow === 0 || toRow === 7)) {
        if (promotion) {
          board[toRow][toCol] = { 
            type: promotion, 
            color: piece.color 
          };
        } else {
          // Show promotion dialog for player
          if (gameMode === 'multi' || currentPlayer === WHITE) {
            pendingPromotion = { 
              row: toRow, 
              col: toCol, 
              color: piece.color,
              fromRow: fromRow,
              fromCol: fromCol,
              captured: captured
            };
            // Update castling rights and king position before showing dialog
            if (piece.type === KING) {
              const colorKey = piece.color === WHITE ? 'white' : 'black';
              canCastle[colorKey].kingside = false;
              canCastle[colorKey].queenside = false;
            }
            if (piece.type === ROOK) {
              const colorKey = piece.color === WHITE ? 'white' : 'black';
              if (fromCol === 0) canCastle[colorKey].queenside = false;
              if (fromCol === 7) canCastle[colorKey].kingside = false;
            }
            if (piece.type === KING) {
              if (piece.color === WHITE) {
                whiteKingPos = { row: toRow, col: toCol };
              } else {
                blackKingPos = { row: toRow, col: toCol };
              }
            }
            this.showPromotionDialog(toRow, toCol, piece.color, fromRow, fromCol, captured);
            this.saveProgress();
            this.render();
            return true;
          } else {
            // AI always promotes to queen
            board[toRow][toCol] = { 
              type: QUEEN, 
              color: piece.color 
            };
          }
        }
      }
      
      // Update castling rights
      if (piece.type === KING) {
        const colorKey = piece.color === WHITE ? 'white' : 'black';
        canCastle[colorKey].kingside = false;
        canCastle[colorKey].queenside = false;
      }
      if (piece.type === ROOK) {
        const colorKey = piece.color === WHITE ? 'white' : 'black';
        if (fromCol === 0) canCastle[colorKey].queenside = false;
        if (fromCol === 7) canCastle[colorKey].kingside = false;
      }
      
      // Update king position
      if (piece.type === KING) {
        if (piece.color === WHITE) {
          whiteKingPos = { row: toRow, col: toCol };
        } else {
          blackKingPos = { row: toRow, col: toCol };
        }
      }
      
      // Save move to history
      moveHistory.push({
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece: piece.type,
        captured: captured,
        promotion: promotion
      });
      
      // Check for checkmate/stalemate (but don't end game immediately)
      const opponentColor = currentPlayer === WHITE ? BLACK : WHITE;
      if (this.isCheckmate(opponentColor)) {
        checkmateState[opponentColor === WHITE ? 'white' : 'black'] = true;
        // Don't end game - allow player to continue moving
      } else {
        checkmateState[opponentColor === WHITE ? 'white' : 'black'] = false;
      }
      
      if (this.isStalemate(opponentColor) && !checkmateState[opponentColor === WHITE ? 'white' : 'black']) {
        gameOver = true;
        winner = null;
        this.handleGameEnd();
      }
      
      // Switch player
      currentPlayer = currentPlayer === WHITE ? BLACK : WHITE;
      
      this.saveProgress();
      this.render();
      
      // AI move in single player mode
      if (gameMode === 'single' && currentPlayer === BLACK && !gameOver) {
        setTimeout(() => {
          this.makeAIMove();
        }, 500);
      }
      
      return true;
    },
    
    /**
     * Handle game end
     */
    handleGameEnd() {
      this.saveProgress();
      
      if (callbacks.onGameOver) {
        callbacks.onGameOver({
          score: difficulty,
          completed: winner === WHITE,
          winner: winner
        });
      }
      
      // In single player mode, advance difficulty on win
      if (gameMode === 'single' && winner === WHITE && difficulty < 15) {
        difficulty++;
        this.saveProgress();
      }
    },
    
    /**
     * Save progress
     */
    saveProgress() {
      Storage.saveGameProgress('chess', {
        gameMode: gameMode,
        difficulty: difficulty,
        board: board,
        currentPlayer: currentPlayer,
        gameOver: gameOver,
        winner: winner,
        moveHistory: moveHistory,
        canCastle: canCastle,
        enPassantTarget: enPassantTarget,
        checkmateState: checkmateState
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
    
    /**
     * Show promotion dialog
     */
    showPromotionDialog(row, col, color, fromRow, fromCol, captured) {
      const dialog = document.createElement('div');
      dialog.className = 'promotion-dialog';
      dialog.innerHTML = `
        <div class="promotion-options">
          <h3>프로모션 선택</h3>
          <div class="promotion-pieces">
            <button class="promotion-piece" data-type="${QUEEN}">
              ${this.getPieceSymbol({ type: QUEEN, color })}
              <span>퀸</span>
            </button>
            <button class="promotion-piece" data-type="${ROOK}">
              ${this.getPieceSymbol({ type: ROOK, color })}
              <span>룩</span>
            </button>
            <button class="promotion-piece" data-type="${BISHOP}">
              ${this.getPieceSymbol({ type: BISHOP, color })}
              <span>비숍</span>
            </button>
            <button class="promotion-piece" data-type="${KNIGHT}">
              ${this.getPieceSymbol({ type: KNIGHT, color })}
              <span>나이트</span>
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      const pieces = dialog.querySelectorAll('.promotion-piece');
      pieces.forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type;
          board[row][col] = { type, color };
          pendingPromotion = null;
          document.body.removeChild(dialog);
          
          // Check if king was captured - end game immediately
          if (captured && captured.type === KING) {
            gameOver = true;
            winner = currentPlayer;
            this.handleGameEnd();
            // Save move to history
            moveHistory.push({
              from: { row: fromRow, col: fromCol },
              to: { row, col },
              piece: PAWN,
              captured: captured,
              promotion: type
            });
            this.saveProgress();
            this.render();
            return;
          }
          
          // Save move to history
          moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row, col },
            piece: PAWN,
            captured: captured,
            promotion: type
          });
          
          // Check for game end
          const opponentColor = currentPlayer === WHITE ? BLACK : WHITE;
          // Check for checkmate/stalemate (but don't end game immediately)
          if (this.isCheckmate(opponentColor)) {
            checkmateState[opponentColor === WHITE ? 'white' : 'black'] = true;
            // Don't end game - allow player to continue moving
          } else {
            checkmateState[opponentColor === WHITE ? 'white' : 'black'] = false;
          }
          
          if (this.isStalemate(opponentColor) && !checkmateState[opponentColor === WHITE ? 'white' : 'black']) {
            gameOver = true;
            winner = null;
            this.handleGameEnd();
          }
          
          // Switch player
          currentPlayer = currentPlayer === WHITE ? BLACK : WHITE;
          
          this.saveProgress();
          this.render();
          
          // AI move in single player mode
          if (gameMode === 'single' && currentPlayer === BLACK && !gameOver) {
            setTimeout(() => {
              this.makeAIMove();
            }, 500);
          }
        });
      });
    },
    
    /**
     * Render game
     */
    render: function() {
      if (!container) return;
      
      const playerName = currentPlayer === WHITE ? '흰색' : '검은색';
      const isPlayerTurn = gameMode === 'multi' || currentPlayer === WHITE;
      const inCheck = this.isInCheck(currentPlayer);
      const inCheckmate = checkmateState[currentPlayer === WHITE ? 'white' : 'black'];
      
      container.innerHTML = `
        <div class="chess-game">
          <div class="chess-header">
            <h2 class="chess-title">♟️ 체스</h2>
            <div class="chess-mode-selector">
              <button class="btn ${gameMode === 'single' ? 'btn-primary' : 'btn-outline'}" id="mode-single">
                1인용 (난이도 ${difficulty}/15)
              </button>
              <button class="btn ${gameMode === 'multi' ? 'btn-primary' : 'btn-outline'}" id="mode-multi">
                2인용
              </button>
            </div>
          </div>
          
          ${gameOver ? `
          <div class="chess-game-over">
            ${winner === WHITE ? `
              <div class="game-over-message success">
                <h3>🎉 흰색 승리!</h3>
                ${gameMode === 'single' && difficulty < 15 ? `
                  <p>다음 난이도: ${difficulty + 1}/15</p>
                ` : gameMode === 'single' && difficulty === 15 ? `
                  <p>축하합니다! 모든 난이도를 완료했습니다! 🏆</p>
                ` : ''}
              </div>
            ` : winner === BLACK ? `
              <div class="game-over-message error">
                <h3>💔 검은색 승리</h3>
                <p>다시 도전해보세요!</p>
              </div>
            ` : `
              <div class="game-over-message">
                <h3>무승부</h3>
                <p>스테일메이트입니다.</p>
              </div>
            `}
            <button class="btn btn-primary" id="restart-btn">다시 시작</button>
          </div>
          ` : `
          <div class="chess-status">
            <div class="chess-status-item">
              <span class="status-label">현재 턴:</span>
              <span class="status-value ${currentPlayer === WHITE ? 'white' : 'black'}">
                ${playerName}
              </span>
            </div>
            ${gameMode === 'single' ? `
            <div class="chess-status-item">
              <span class="status-label">난이도:</span>
              <span class="status-value">${difficulty}/15</span>
            </div>
            ${!isPlayerTurn ? `
            <div class="chess-status-item">
              <span class="status-label">🤖 AI가 생각 중...</span>
            </div>
            ` : ''}
            ` : ''}
            ${inCheck ? `
            <div class="chess-status-item">
              <span class="status-label check-warning">⚠️ 체크!</span>
            </div>
            ` : ''}
            ${inCheckmate ? `
            <div class="chess-status-item">
              <span class="status-label checkmate-warning">💀 체크메이트!</span>
            </div>
            ` : ''}
          </div>
          `}
          
          <div class="chess-board-container">
            <div class="chess-board" id="chess-board"></div>
            ${pendingPromotion ? `
            <div class="promotion-overlay"></div>
            ` : ''}
          </div>
          
          <div class="chess-controls">
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
     * Render chess board
     */
    renderBoard() {
      const boardEl = document.getElementById('chess-board');
      if (!boardEl) return;
      
      boardEl.innerHTML = '';
      boardElement = boardEl;
      
      // Create board squares
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const square = document.createElement('div');
          square.className = 'chess-square';
          square.dataset.row = row;
          square.dataset.col = col;
          
          // Alternate colors
          const isLight = (row + col) % 2 === 0;
          square.classList.add(isLight ? 'light' : 'dark');
          
          // Highlight selected square
          if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
            square.classList.add('selected');
          }
          
          // Highlight valid moves
          if (validMoves.some(m => m.row === row && m.col === col)) {
            square.classList.add('valid-move');
          }
          
          // Add piece
          const piece = board[row][col];
          if (piece) {
            square.textContent = this.getPieceSymbol(piece);
            square.classList.add('has-piece');
            square.classList.add(piece.color === WHITE ? 'white-piece' : 'black-piece');
          }
          
          boardEl.appendChild(square);
        }
      }
    },
    
    /**
     * Setup event listeners
     */
    setupEvents: function() {
      // Board clicks
      const squares = document.querySelectorAll('.chess-square');
      squares.forEach(square => {
        square.addEventListener('click', (e) => {
          if (gameOver) return;
          
          const row = parseInt(square.dataset.row);
          const col = parseInt(square.dataset.col);
          const isPlayerTurn = gameMode === 'multi' || currentPlayer === WHITE;
          
          if (!isPlayerTurn) return;
          
          // If a piece is selected, try to move
          if (selectedSquare) {
            if (this.makeMove(selectedSquare.row, selectedSquare.col, row, col)) {
              selectedSquare = null;
              validMoves = [];
            } else {
              // Select new piece or deselect
              const piece = board[row][col];
              if (piece && piece.color === currentPlayer) {
                selectedSquare = { row, col };
                validMoves = this.getValidMoves(row, col);
              } else {
                selectedSquare = null;
                validMoves = [];
              }
            }
          } else {
            // Select piece
            const piece = board[row][col];
            if (piece && piece.color === currentPlayer) {
              selectedSquare = { row, col };
              validMoves = this.getValidMoves(row, col);
            }
          }
          
          this.render();
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
      
      // Simple undo - just reset the game for now
      // Full undo implementation would require storing full game state
      if (confirm('게임을 리셋하시겠습니까?')) {
        this.resetGame();
      }
    },
    
    /**
     * Make AI move
     */
    makeAIMove() {
      if (gameOver) return;
      
      const move = this.getAIMove();
      if (move) {
        this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col, move.promotion);
      }
    },
    
    /**
     * Get AI move based on difficulty
     */
    getAIMove() {
      // Check for winning move (checkmate)
      const checkmateMove = this.findCheckmateMove();
      if (checkmateMove) return checkmateMove;
      
      // Check for capturing valuable pieces
      const captureMove = this.findBestCapture();
      if (captureMove) return captureMove;
      
      // Difficulty-based moves
      if (difficulty >= 15) {
        return this.getMinimaxMove(4);
      } else if (difficulty >= 12) {
        return this.getMinimaxMove(3);
      } else if (difficulty >= 8) {
        return this.getMinimaxMove(2);
      } else if (difficulty >= 4) {
        return this.getMinimaxMove(2);
      } else if (difficulty >= 2) {
        return this.getMinimaxMove(1);
      } else {
        return this.getRandomMove();
      }
    },
    
    /**
     * Find checkmate move
     */
    findCheckmateMove() {
      const allMoves = this.getAllMoves(BLACK);
      for (const move of allMoves) {
        // Temporarily make move
        const piece = board[move.from.row][move.from.col];
        const captured = board[move.to.row][move.to.col];
        board[move.to.row][move.to.col] = piece;
        board[move.from.row][move.from.col] = EMPTY;
        
        if (this.isCheckmate(WHITE)) {
          // Undo move
          board[move.from.row][move.from.col] = piece;
          board[move.to.row][move.to.col] = captured;
          return move;
        }
        
        // Undo move
        board[move.from.row][move.from.col] = piece;
        board[move.to.row][move.to.col] = captured;
      }
      return null;
    },
    
    /**
     * Find best capture
     */
    findBestCapture() {
      const allMoves = this.getAllMoves(BLACK);
      let bestMove = null;
      let bestValue = -Infinity;
      
      const pieceValues = { [PAWN]: 1, [KNIGHT]: 3, [BISHOP]: 3, [ROOK]: 5, [QUEEN]: 9, [KING]: 100 };
      
      for (const move of allMoves) {
        const captured = board[move.to.row][move.to.col];
        if (captured) {
          const value = pieceValues[captured.type] || 0;
          if (value > bestValue) {
            bestValue = value;
            bestMove = move;
          }
        }
      }
      
      return bestMove;
    },
    
    /**
     * Get all moves for a player
     */
    getAllMoves(color) {
      const moves = [];
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];
          if (piece && piece.color === color) {
            const validMoves = this.getValidMoves(row, col);
            for (const move of validMoves) {
              moves.push({
                from: { row, col },
                to: { row: move.row, col: move.col },
                promotion: move.promotion || null
              });
            }
          }
        }
      }
      return moves;
    },
    
    /**
     * Get random move
     */
    getRandomMove() {
      const allMoves = this.getAllMoves(BLACK);
      if (allMoves.length === 0) return null;
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    },
    
    /**
     * Minimax algorithm
     */
    getMinimaxMove(depth) {
      const allMoves = this.getAllMoves(BLACK);
      if (allMoves.length === 0) return null;
      
      // Sort moves by priority (captures first)
      allMoves.sort((a, b) => {
        const aCapture = board[a.to.row][a.to.col] ? 1 : 0;
        const bCapture = board[b.to.row][b.to.col] ? 1 : 0;
        return bCapture - aCapture;
      });
      
      let bestScore = -Infinity;
      let bestMove = allMoves[0];
      const maxMoves = difficulty >= 12 ? 30 : difficulty >= 8 ? 20 : 15;
      
      for (const move of allMoves.slice(0, maxMoves)) {
        const score = this.minimax(depth, false, -Infinity, Infinity, move);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
      
      return bestMove;
    },
    
    /**
     * Minimax with alpha-beta pruning
     */
    minimax(depth, isMaximizing, alpha, beta, move) {
      // Make move
      const piece = board[move.from.row][move.from.col];
      const captured = board[move.to.row][move.to.col];
      const oldWhiteKingPos = { ...whiteKingPos };
      const oldBlackKingPos = { ...blackKingPos };
      
      board[move.to.row][move.to.col] = piece;
      board[move.from.row][move.from.col] = EMPTY;
      
      // Handle promotion (always promote to queen for AI)
      if (piece.type === PAWN && (move.to.row === 0 || move.to.row === 7)) {
        board[move.to.row][move.to.col] = { type: QUEEN, color: piece.color };
      }
      
      // Update king position
      if (piece.type === KING) {
        if (piece.color === WHITE) {
          whiteKingPos = { row: move.to.row, col: move.to.col };
        } else {
          blackKingPos = { row: move.to.row, col: move.to.col };
        }
      }
      
      // Terminal conditions
      if (depth === 0) {
        const score = this.evaluateBoard();
        // Undo move
        board[move.from.row][move.from.col] = piece;
        board[move.to.row][move.to.col] = captured;
        whiteKingPos = oldWhiteKingPos;
        blackKingPos = oldBlackKingPos;
        return score;
      }
      
      // Check for checkmate
      if (isMaximizing) {
        if (this.isCheckmate(WHITE)) {
          board[move.from.row][move.from.col] = piece;
          board[move.to.row][move.to.col] = captured;
          whiteKingPos = oldWhiteKingPos;
          blackKingPos = oldBlackKingPos;
          return 10000;
        }
      } else {
        if (this.isCheckmate(BLACK)) {
          board[move.from.row][move.from.col] = piece;
          board[move.to.row][move.to.col] = captured;
          whiteKingPos = oldWhiteKingPos;
          blackKingPos = oldBlackKingPos;
          return -10000;
        }
      }
      
      const currentColor = isMaximizing ? BLACK : WHITE;
      const moves = this.getAllMoves(currentColor);
      
      if (moves.length === 0) {
        // Stalemate or checkmate
        const score = this.isInCheck(currentColor) ? (isMaximizing ? 10000 : -10000) : 0;
        board[move.from.row][move.from.col] = piece;
        board[move.to.row][move.to.col] = captured;
        whiteKingPos = oldWhiteKingPos;
        blackKingPos = oldBlackKingPos;
        return score;
      }
      
      if (isMaximizing) {
        let maxScore = -Infinity;
        const maxMoves = difficulty >= 12 ? 15 : difficulty >= 8 ? 10 : 8;
        for (const m of moves.slice(0, maxMoves)) {
          const score = this.minimax(depth - 1, false, alpha, beta, m);
          maxScore = Math.max(maxScore, score);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break;
        }
        board[move.from.row][move.from.col] = piece;
        board[move.to.row][move.to.col] = captured;
        whiteKingPos = oldWhiteKingPos;
        blackKingPos = oldBlackKingPos;
        return maxScore;
      } else {
        let minScore = Infinity;
        const maxMoves = difficulty >= 12 ? 15 : difficulty >= 8 ? 10 : 8;
        for (const m of moves.slice(0, maxMoves)) {
          const score = this.minimax(depth - 1, true, alpha, beta, m);
          minScore = Math.min(minScore, score);
          beta = Math.min(beta, score);
          if (beta <= alpha) break;
        }
        board[move.from.row][move.from.col] = piece;
        board[move.to.row][move.to.col] = captured;
        whiteKingPos = oldWhiteKingPos;
        blackKingPos = oldBlackKingPos;
        return minScore;
      }
    },
    
    /**
     * Evaluate board position
     */
    evaluateBoard() {
      let score = 0;
      const pieceValues = { [PAWN]: 100, [KNIGHT]: 320, [BISHOP]: 330, [ROOK]: 500, [QUEEN]: 900, [KING]: 20000 };
      
      // Piece values
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];
          if (piece) {
            const value = pieceValues[piece.type] || 0;
            if (piece.color === BLACK) {
              score += value;
            } else {
              score -= value;
            }
            
            // Position bonuses
            const positionBonus = this.getPositionBonus(piece, row, col);
            if (piece.color === BLACK) {
              score += positionBonus;
            } else {
              score -= positionBonus;
            }
          }
        }
      }
      
      // Check/checkmate bonuses
      if (this.isInCheck(WHITE)) {
        score += 50;
      }
      if (this.isInCheck(BLACK)) {
        score -= 50;
      }
      
      return score;
    },
    
    /**
     * Get position bonus for piece
     */
    getPositionBonus(piece, row, col) {
      // Center control bonus
      const centerDistance = Math.abs(row - 3.5) + Math.abs(col - 3.5);
      let bonus = (7 - centerDistance) * 5;
      
      // Piece-specific bonuses
      if (piece.type === PAWN) {
        // Pawns are better when advanced
        if (piece.color === WHITE) {
          bonus += (7 - row) * 10;
        } else {
          bonus += row * 10;
        }
      } else if (piece.type === KNIGHT || piece.type === BISHOP) {
        // Knights and bishops are better in center
        bonus += (7 - centerDistance) * 3;
      }
      
      return bonus;
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


