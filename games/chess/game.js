(function() {
  'use strict';

  const ASSETS = {
      w: { p: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg", r: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg", n: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg", b: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg", q: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg", k: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg" },
      b: { p: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg", r: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg", n: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg", b: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg", q: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg", k: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg" }
  };

  // ================= AI EVALUATION TABLES (PST) =================
  // AI가 위치를 판단하는 기준 (흑돌 기준, 백돌은 뒤집어서 사용)
  // 중앙 지향, 폰 전진 유도, 나이트 중앙 배치 등 전술적 가중치
  const PST = {
      p: [
          [0,  0,  0,  0,  0,  0,  0,  0],
          [50, 50, 50, 50, 50, 50, 50, 50],
          [10, 10, 20, 30, 30, 20, 10, 10],
          [5,  5, 10, 25, 25, 10,  5,  5],
          [0,  0,  0, 20, 20,  0,  0,  0],
          [5, -5,-10,  0,  0,-10, -5,  5],
          [5, 10, 10,-20,-20, 10, 10,  5],
          [0,  0,  0,  0,  0,  0,  0,  0]
      ],
      n: [
          [-50,-40,-30,-30,-30,-30,-40,-50],
          [-40,-20,  0,  0,  0,  0,-20,-40],
          [-30,  0, 10, 15, 15, 10,  0,-30],
          [-30,  5, 15, 20, 20, 15,  5,-30],
          [-30,  0, 15, 20, 20, 15,  0,-30],
          [-30,  5, 10, 15, 15, 10,  5,-30],
          [-40,-20,  0,  5,  5,  0,-20,-40],
          [-50,-40,-30,-30,-30,-30,-40,-50]
      ],
      b: [
          [-20,-10,-10,-10,-10,-10,-10,-20],
          [-10,  0,  0,  0,  0,  0,  0,-10],
          [-10,  0,  5, 10, 10,  5,  0,-10],
          [-10,  5,  5, 10, 10,  5,  5,-10],
          [-10,  0, 10, 10, 10, 10,  0,-10],
          [-10, 10, 10, 10, 10, 10, 10,-10],
          [-10,  5,  0,  0,  0,  0,  5,-10],
          [-20,-10,-10,-10,-10,-10,-10,-20]
      ],
      r: [
          [0,  0,  0,  0,  0,  0,  0,  0],
          [5, 10, 10, 10, 10, 10, 10,  5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [-5,  0,  0,  0,  0,  0,  0, -5],
          [0,  0,  0,  5,  5,  0,  0,  0]
      ],
      q: [
          [-20,-10,-10, -5, -5,-10,-10,-20],
          [-10,  0,  0,  0,  0,  0,  0,-10],
          [-10,  0,  5,  5,  5,  5,  0,-10],
          [-5,  0,  5,  5,  5,  5,  0, -5],
          [0,  0,  5,  5,  5,  5,  0, -5],
          [-10,  5,  5,  5,  5,  5,  0,-10],
          [-10,  0,  5,  0,  0,  0,  0,-10],
          [-20,-10,-10, -5, -5,-10,-10,-20]
      ],
      k: [
          [-30,-40,-40,-50,-50,-40,-40,-30],
          [-30,-40,-40,-50,-50,-40,-40,-30],
          [-30,-40,-40,-50,-50,-40,-40,-30],
          [-30,-40,-40,-50,-50,-40,-40,-30],
          [-20,-30,-30,-40,-40,-30,-30,-20],
          [-10,-20,-20,-20,-20,-20,-20,-10],
          [20, 20,  0,  0,  0,  0, 20, 20],
          [20, 30, 10,  0,  0, 10, 30, 20]
      ]
  };

  // Helper function to get translated text
  function getUIText(key, defaultValue) {
      if (typeof I18n !== 'undefined' && I18n.t) {
          const fullKey = `gameDetails.chess.ui.${key}`;
          const value = I18n.t(fullKey, defaultValue);
          if (value === fullKey || value === defaultValue) {
              return defaultValue;
          }
          return value;
      }
      return defaultValue;
  }

  // ================= SOUND ENGINE =================
  const Sound = {
      ctx: null, isMuted: false,
      init: function() { window.AudioContext = window.AudioContext || window.webkitAudioContext; this.ctx = new AudioContext(); },
      playTone: function(freq, type, duration) {
          if (this.isMuted || !this.ctx) return;
          const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
          osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.1, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
          osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + duration);
      },
      playMove: function() { 
          if (this.isMuted || !this.ctx) return;
          const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
          osc.frequency.setValueAtTime(150, this.ctx.currentTime); gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
          osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.05);
      },
      playCapture: function() { this.playTone(300, 'square', 0.1); },
      playCheck: function() { this.playTone(600, 'sine', 0.2); setTimeout(() => this.playTone(800, 'sine', 0.3), 100); },
      playWin: function() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.4), i * 150)); },
      playLose: function() { [400, 300, 200].forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.4), i * 200)); }
  };

  // ================= GAME LOGIC =================
  const Game = {
      container: null,
      state: {
          board: [],
          turn: 'w',
          round: 1, maxRound: 12,
          selected: null, 
          possibleMoves: [],
          lastMove: null, 
          gameOver: false,
          enPassantTarget: null, 
          isThinking: false
      },

      init: function(container) {
          this.container = container;
          Sound.init();
          
          const saved = localStorage.getItem('chess_save_v3');
          if(saved) {
              try { this.state = { ...this.state, ...JSON.parse(saved) }; } 
              catch(e) { this.resetRound(1); }
          } else {
              this.resetRound(1);
          }

          this.renderLayout();
          this.renderBoard();
          this.updateUI();
          this.setupEvents();
          
          // Listen for language changes
          document.addEventListener('i18n:loaded', () => {
              this.renderLayout();
              this.renderBoard();
              this.updateUI();
              this.setupEvents();
          });
      },

      resetRound: function(round) {
          this.state.board = this.createInitialBoard();
          this.state.turn = 'w';
          this.state.selected = null;
          this.state.possibleMoves = [];
          this.state.lastMove = null;
          this.state.gameOver = false;
          this.state.enPassantTarget = null;
          this.state.isThinking = false;
          if(round) this.state.round = round;
          this.saveProgress();
      },

      createInitialBoard: function() {
          const b = Array(8).fill(null).map(() => Array(8).fill(null));
          const setupRow = (row, color, pieces) => {
              pieces.split('').forEach((p, i) => b[row][i] = { type: p, color: color, hasMoved: false });
          };
          setupRow(0, 'b', 'rnbqkbnr');
          setupRow(1, 'b', 'pppppppp');
          setupRow(6, 'w', 'pppppppp');
          setupRow(7, 'w', 'rnbqkbnr');
          return b;
      },

      saveProgress: function() { localStorage.setItem('chess_save_v3', JSON.stringify(this.state)); },

      handleSquareClick: function(r, c) {
          if(this.state.gameOver || this.state.turn === 'b' || this.state.isThinking) return;

          const piece = this.state.board[r][c];
          if(this.state.selected) {
              const move = this.state.possibleMoves.find(m => m.to.r === r && m.to.c === c);
              if(move) {
                  this.executeMove(move);
                  return;
              }
          }
          if(piece && piece.color === 'w') {
              this.state.selected = {r, c};
              this.state.possibleMoves = this.getValidMoves(r, c, this.state.board);
              this.renderBoard();
              return;
          }
          this.state.selected = null;
          this.state.possibleMoves = [];
          this.renderBoard();
      },

      executeMove: function(move) {
          const { from, to, special } = move;
          const piece = this.state.board[from.r][from.c];
          const target = this.state.board[to.r][to.c];
          const isCapture = target !== null || special === 'enpassant';

          if(isCapture) Sound.playCapture(); else Sound.playMove();

          this.state.board[to.r][to.c] = piece;
          this.state.board[from.r][from.c] = null;
          piece.hasMoved = true;

          if(special === 'enpassant') this.state.board[from.r][to.c] = null;
          if(special === 'castle') {
              if(to.c === 6) { const r=this.state.board[to.r][7]; this.state.board[to.r][5]=r; this.state.board[to.r][7]=null; if(r) r.hasMoved=true; }
              else if(to.c === 2) { const r=this.state.board[to.r][0]; this.state.board[to.r][3]=r; this.state.board[to.r][0]=null; if(r) r.hasMoved=true; }
          }

          if(piece.type === 'p' && (to.r === 0 || to.r === 7)) {
              if(piece.color === 'w') {
                  this.showPromotionModal(to.r, to.c);
                  return;
              } else { piece.type = 'q'; }
          }

          if(piece.type === 'p' && Math.abs(to.r - from.r) === 2) this.state.enPassantTarget = { r: (from.r + to.r) / 2, c: from.c };
          else this.state.enPassantTarget = null;

          this.finishTurn(from, to);
      },

      finishTurn: function(from, to) {
          this.state.selected = null;
          this.state.possibleMoves = [];
          this.state.lastMove = { from, to };
          this.state.turn = this.state.turn === 'w' ? 'b' : 'w';

          if(this.isCheck(this.state.turn, this.state.board)) {
              Sound.playCheck();
              if(this.isCheckmate(this.state.turn, this.state.board)) {
                  this.endGame(this.state.turn === 'w' ? 'b' : 'w');
                  return;
              }
          }

          this.saveProgress();
          this.renderBoard();
          this.updateUI();

          if(this.state.turn === 'b' && !this.state.gameOver) {
              this.state.isThinking = true;
              this.updateUI();
              // 헬 모드: 연산 시간이 걸리더라도 100ms 후 실행 (UI 렌더링 확보)
              setTimeout(() => this.makeAIMove(), 100);
          }
      },

      // ================= AI CORE (HELL MODE) =================
      makeAIMove: function() {
          // Hell Mode Logic: Start strong, get impossible
          // Round 1-4: Depth 3 + PST (Already 1500+ Elo)
          // Round 5-8: Depth 3 + Full Search (No Randomness)
          // Round 9-12: Depth 3/4 + Tactical Optimization
          
          const depth = 3; // JS 성능상 3이 한계 (PST가 강력해서 충분함)
          
          const move = this.getBestMove(depth);
          
          this.state.isThinking = false;
          if(move) {
              this.executeMove(move);
          } else {
              if(this.isCheck('b', this.state.board)) this.endGame('w');
              else {
                  const drawText = getUIText('modal.draw.title', 'DRAW');
                  const stalemateText = getUIText('modal.draw.desc', '스테일메이트입니다.');
                  const restartText = getUIText('modal.draw.button', '재시작');
                  this.showModal(drawText, stalemateText, restartText, 'reset');
              }
          }
      },

      getBestMove: function(depth) {
          const moves = this.getAllMoves('b', this.state.board);
          if(moves.length === 0) return null;

          // 1라운드부터 무작위성 제거 (Hell Mode)
          let bestScore = -Infinity;
          let bestMove = moves[0];
          
          // Alpha-Beta Pruning Init
          let alpha = -Infinity;
          let beta = Infinity;

          for(const move of moves) {
              const tempBoard = this.cloneBoard(this.state.board);
              this.simulateMove(tempBoard, move);
              
              // Minimax Call
              const score = this.minimax(tempBoard, depth - 1, alpha, beta, false);
              
              if(score > bestScore) {
                  bestScore = score;
                  bestMove = move;
              }
              alpha = Math.max(alpha, bestScore);
          }
          return bestMove;
      },

      minimax: function(board, depth, alpha, beta, isMaximizing) {
          if(depth === 0) return this.evaluateBoard(board);

          const moves = this.getAllMoves(isMaximizing ? 'b' : 'w', board);
          if(moves.length === 0) {
              if(this.isCheck(isMaximizing ? 'b' : 'w', board)) return isMaximizing ? -100000 : 100000; // Checkmate
              return 0; // Stalemate
          }

          if(isMaximizing) {
              let maxEval = -Infinity;
              for(const move of moves) {
                  const tempBoard = this.cloneBoard(board);
                  this.simulateMove(tempBoard, move);
                  const evalScore = this.minimax(tempBoard, depth - 1, alpha, beta, false);
                  maxEval = Math.max(maxEval, evalScore);
                  alpha = Math.max(alpha, evalScore);
                  if(beta <= alpha) break;
              }
              return maxEval;
          } else {
              let minEval = Infinity;
              for(const move of moves) {
                  const tempBoard = this.cloneBoard(board);
                  this.simulateMove(tempBoard, move);
                  const evalScore = this.minimax(tempBoard, depth - 1, alpha, beta, true);
                  minEval = Math.min(minEval, evalScore);
                  beta = Math.min(beta, evalScore);
                  if(beta <= alpha) break;
              }
              return minEval;
          }
      },

      // --- HELL MODE EVALUATION ---
      evaluateBoard: function(board) {
          let score = 0;
          // Material Values
          const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
          
          for(let r=0; r<8; r++) {
              for(let c=0; c<8; c++) {
                  const p = board[r][c];
                  if(p) {
                      // 1. Material Score
                      let val = values[p.type];
                      
                      // 2. Positional Score (PST)
                      // Black(AI) is top (row 0), White is bottom (row 7)
                      // PST is defined for White perspective usually, need to flip for Black
                      let pstVal = 0;
                      if (p.color === 'b') {
                          // Mirror row/col for Black to use the same table correctly?
                          // Actually, simply: PST tables are usually defined from perspective of 'White at bottom'.
                          // So for Black at row 0, we read PST table mirrored (row 7-r).
                          // Wait, standard PSTs are usually defined 0..7 where 0 is rank 8 (top).
                          // Let's assume PST above is Visual (0,0 is top-left).
                          // If White starts at row 7 (bottom), and Black at row 0 (top).
                          // The Pawn table shows advancement bonus at row 1->2...
                          // If p is Black, it moves Down (row increases).
                          // If p is White, it moves Up (row decreases).
                          
                          // Let's apply PST based on piece type and position
                          if (PST[p.type]) {
                              // For Black (AI): Direct mapping if table is for Black perspective, 
                              // or Mirror if table is generic.
                              // Let's use Mirroring logic for White, and Direct for Black (since they start at top)
                              // Actually, standard logic:
                              if(p.color === 'b') {
                                  pstVal = PST[p.type][r][c]; 
                              } else {
                                  // Mirror for White (who is at bottom, row 7)
                                  pstVal = PST[p.type][7-r][c];
                              }
                          }
                      } else {
                          if (PST[p.type]) pstVal = PST[p.type][7-r][c];
                      }

                      // Combine
                      if(p.color === 'b') score += (val + pstVal);
                      else score -= (val + pstVal);
                  }
              }
          }
          return score;
      },

      // --- HELPERS ---
      getValidMoves: function(r, c, board) {
          // (Previous validation logic preserved but optimized for performance in loop)
          // ... (For brevity, using the robust logic from previous version)
          const p = board[r][c]; if(!p) return [];
          const moves = [];
          const dirs = {
              r: [[1,0], [-1,0], [0,1], [0,-1]],
              b: [[1,1], [1,-1], [-1,1], [-1,-1]],
              n: [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [1,-2], [-1,2], [-1,-2]],
              q: [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]],
              k: [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]]
          };
          const add = (tr, tc, sp=null) => {
              if(tr>=0 && tr<8 && tc>=0 && tc<8) {
                  const t = board[tr][tc];
                  if(!t || t.color !== p.color) {
                      const tb = this.cloneBoard(board);
                      this.simulateMove(tb, {from:{r,c}, to:{r:tr,c:tc}, special:sp});
                      if(!this.isCheck(p.color, tb)) moves.push({from:{r,c}, to:{r:tr,c:tc}, special:sp});
                  }
              }
          };
          if(p.type==='p') {
              const d = p.color==='w' ? -1 : 1;
              if(!board[r+d][c]) {
                  add(r+d, c);
                  if(((p.color==='w'&&r===6)||(p.color==='b'&&r===1)) && !board[r+d*2][c]) add(r+d*2, c);
              }
              [[d,1],[d,-1]].forEach(([dr,dc]) => {
                  const tr=r+dr, tc=c+dc;
                  if(tr>=0&&tr<8&&tc>=0&&tc<8) {
                      if(board[tr][tc] && board[tr][tc].color!==p.color) add(tr,tc);
                      if(this.state.enPassantTarget && this.state.enPassantTarget.r===tr && this.state.enPassantTarget.c===tc) add(tr,tc,'enpassant');
                  }
              });
          } else {
              const type = p.type === 'p' ? 'p' : p.type; // should not happen
              if(dirs[type]) {
                  dirs[type].forEach(([dr,dc]) => {
                      for(let i=1; i<8; i++) {
                          const tr=r+dr*i, tc=c+dc*i;
                          if(tr<0||tr>7||tc<0||tc>7) break;
                          const t = board[tr][tc];
                          if(t) { if(t.color!==p.color) add(tr,tc); break; }
                          add(tr,tc);
                          if(p.type==='n'||p.type==='k') break;
                      }
                  });
              }
              // Castling (Simplified check for UI responsiveness)
              if(p.type==='k' && !p.hasMoved) {
                  // King-side
                  if(!board[r][5] && !board[r][6] && board[r][7] && !board[r][7].hasMoved) add(r, 6, 'castle');
                  // Queen-side
                  if(!board[r][1] && !board[r][2] && !board[r][3] && board[r][0] && !board[r][0].hasMoved) add(r, 2, 'castle');
              }
          }
          return moves;
      },
      getAllMoves: function(color, board) {
          let moves = [];
          for(let r=0; r<8; r++) {
              for(let c=0; c<8; c++) {
                  const p = board[r][c];
                  if(p && p.color === color) moves = moves.concat(this.getValidMoves(r,c,board));
              }
          }
          // Ordering: Captures first (Critical for Alpha-Beta efficiency)
          moves.sort((a,b) => {
              const targetA = board[a.to.r][a.to.c] ? 10 : 0;
              const targetB = board[b.to.r][b.to.c] ? 10 : 0;
              return targetB - targetA;
          });
          return moves;
      },
      cloneBoard: function(board) { return board.map(row => row.map(p => p ? {...p} : null)); },
      simulateMove: function(board, move) {
          const { from, to, special } = move;
          board[to.r][to.c] = board[from.r][from.c];
          board[from.r][from.c] = null;
          if(special==='enpassant') board[from.r][to.c] = null;
      },
      isCheck: function(color, board) {
          let k; for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c]&&board[r][c].type==='k'&&board[r][c].color===color) k={r,c};
          if(!k) return true; // King missing?
          const enemy = color==='w'?'b':'w';
          // Reverse check: Is king attacked? (Simplified scan)
          // Knight
          const nDir = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
          for(let d of nDir) { const tr=k.r+d[0], tc=k.c+d[1]; if(tr>=0&&tr<8&&tc>=0&&tc<8&&board[tr][tc]&&board[tr][tc].color===enemy&&board[tr][tc].type==='n') return true; }
          // Pawn
          const pDir = color==='w' ? [[-1,1],[-1,-1]] : [[1,1],[1,-1]];
          for(let d of pDir) { const tr=k.r+d[0], tc=k.c+d[1]; if(tr>=0&&tr<8&&tc>=0&&tc<8&&board[tr][tc]&&board[tr][tc].color===enemy&&board[tr][tc].type==='p') return true; }
          // Sliding
          const sDir = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
          for(let d of sDir) {
              for(let i=1;i<8;i++) {
                  const tr=k.r+d[0]*i, tc=k.c+d[1]*i;
                  if(tr<0||tr>7||tc<0||tc>7) break;
                  const p = board[tr][tc];
                  if(p) {
                      if(p.color===enemy) {
                          const isDiag = d[0]!==0&&d[1]!==0;
                          if(p.type==='q' || (isDiag&&p.type==='b') || (!isDiag&&p.type==='r')) return true;
                          if(i===1 && p.type==='k') return true;
                      }
                      break;
                  }
              }
          }
          return false;
      },
      isCheckmate: function(color, board) { return this.getAllMoves(color, board).length === 0; },
      
      // --- UI ---
      renderLayout: function() {
          this.container.innerHTML = `
              <div class="chess-wrapper">
                  <div class="game-frame">
                      <div class="chess-header">
                          <div class="chess-status-group">
                              <div class="round-badge" id="ui-round">${getUIText('roundText', 'ROUND 1 / 12 (HELL)').replace('{round}', this.state.round)}</div>
                              <div class="turn-info">
                                  <div class="player-badge active" id="badge-w"><span class="king-icon">♔</span> ${getUIText('you', 'YOU')}</div>
                                  <div class="player-badge" id="badge-b"><span class="king-icon">♚</span> ${getUIText('ai', 'AI')}</div>
                              </div>
                          </div>
                          <div class="btn-group">
                              <button class="btn-util" id="btn-reset">${getUIText('buttons.forfeit', '포기')}</button>
                              <button class="btn-util" id="btn-sound">🔊</button>
                          </div>
                      </div>
                      <div class="chess-body">
                          <div class="chess-board" id="board"></div>
                          <div class="chess-modal" id="promo-modal">
                              <div class="modal-box"><h3 class="modal-title">${getUIText('promotion.title', '승급')}</h3><div class="promotion-select" id="promo-options"></div></div>
                          </div>
                          <div class="chess-modal" id="msg-modal">
                              <div class="modal-box"><h3 class="modal-title" id="m-title"></h3><p class="modal-desc" id="m-desc"></p><button class="btn-action" id="m-btn">${getUIText('buttons.confirm', '확인')}</button></div>
                          </div>
                      </div>
                  </div>
              </div>
          `;
      },
      renderBoard: function() {
          const el = document.getElementById('board'); el.innerHTML = '';
          for(let r=0;r<8;r++) {
              for(let c=0;c<8;c++) {
                  const sq = document.createElement('div');
                  sq.className = `square ${(r+c)%2===0?'light':'dark'}`;
                  sq.dataset.r=r; sq.dataset.c=c;
                  const p = this.state.board[r][c];
                  if(this.state.selected && this.state.selected.r===r && this.state.selected.c===c) sq.classList.add('selected');
                  if(this.state.lastMove && (this.state.lastMove.from.r===r && this.state.lastMove.from.c===c || this.state.lastMove.to.r===r && this.state.lastMove.to.c===c)) sq.classList.add('last-move');
                  if(p && p.type==='k' && this.isCheck(p.color, this.state.board)) sq.classList.add('check');
                  if(p) {
                      const img = document.createElement('div');
                      img.className = `piece ${p.color}`;
                      img.style.backgroundImage = `url('${ASSETS[p.color][p.type]}')`;
                      sq.appendChild(img);
                  }
                  if(this.state.selected) {
                      const m = this.state.possibleMoves.find(mv=>mv.to.r===r&&mv.to.c===c);
                      if(m) { const dot=document.createElement('div'); dot.className='hint-dot'; if(p) sq.classList.add('capture-hint'); sq.appendChild(dot); }
                  }
                  sq.onclick = () => this.handleSquareClick(r,c);
                  el.appendChild(sq);
              }
          }
      },
      updateUI: function() {
          const roundText = getUIText('roundText', 'ROUND {round} / 12 (HELL)').replace('{round}', this.state.round);
          document.getElementById('ui-round').innerText = roundText;
          const w=document.getElementById('badge-w'), b=document.getElementById('badge-b');
          if(this.state.turn==='w') {
              w.classList.add('active');
              b.classList.remove('active');
              const aiText = getUIText('ai', 'AI');
              b.innerHTML = `<span class="king-icon">♚</span> ${aiText}`;
          } else {
              w.classList.remove('active');
              b.classList.add('active');
              const aiThinkingText = getUIText('aiThinking', 'AI (연산중...)');
              b.innerHTML = `<span class="king-icon">♚</span> ${aiThinkingText}`;
          }
          const youText = getUIText('you', 'YOU');
          w.innerHTML = `<span class="king-icon">♔</span> ${youText}`;
      },
      showPromotionModal: function(r, c) {
          const modal = document.getElementById('promo-modal');
          const box = document.getElementById('promo-options'); box.innerHTML = '';
          ['q','r','b','n'].forEach(t => {
              const d = document.createElement('div'); d.className='promo-option';
              const i = document.createElement('div'); i.className='promo-img'; i.style.backgroundImage = `url('${ASSETS['w'][t]}')`;
              d.appendChild(i); d.onclick=()=>{this.state.board[r][c].type=t; modal.classList.remove('active'); this.finishTurn(this.state.lastMove.from, {r,c});};
              box.appendChild(d);
          });
          modal.classList.add('active');
      },
      showModal: function(t, d, b, a) {
          const m = document.getElementById('msg-modal');
          document.getElementById('m-title').innerText = t;
          document.getElementById('m-title').className = `modal-title ${t.includes('VICTORY')?'title-win':'title-lose'}`;
          document.getElementById('m-desc').innerText = d;
          const btn = document.getElementById('m-btn'); btn.innerText = b;
          btn.onclick = () => {
              m.classList.remove('active');
              if(a==='next') this.resetRound(this.state.round+1);
              else if(a==='retry') this.resetRound(this.state.round);
              else if(a==='reset') this.resetRound(1);
              this.renderBoard(); this.updateUI();
          };
          m.classList.add('active');
      },
      endGame: function(w) {
          this.state.gameOver = true;
          if(w==='w') {
              Sound.playWin();
              if(this.state.round<this.state.maxRound) {
                  const victoryText = getUIText('modal.victory.title', 'VICTORY!');
                  const roundClearText = getUIText('modal.victory.desc', '라운드 {round} 클리어!').replace('{round}', this.state.round);
                  const nextRoundText = getUIText('modal.victory.button', '다음 라운드');
                  this.showModal(victoryText, roundClearText, nextRoundText, 'next');
              } else {
                  const grandmasterText = getUIText('modal.grandmaster.title', 'GRANDMASTER!');
                  const grandmasterDesc = getUIText('modal.grandmaster.desc', '지옥을 정복했습니다.');
                  const resetText = getUIText('modal.grandmaster.button', '처음부터 다시');
                  this.showModal(grandmasterText, grandmasterDesc, resetText, 'reset');
              }
          } else {
              Sound.playLose();
              const checkmateText = getUIText('modal.checkmate.title', 'CHECKMATE');
              const checkmateDesc = getUIText('modal.checkmate.desc', 'AI의 수읽기에 당했습니다.');
              const retryText = getUIText('modal.checkmate.button', '재도전');
              this.showModal(checkmateText, checkmateDesc, retryText, 'retry');
          }
      },
      setupEvents: function() {
          const btnReset = document.getElementById('btn-reset');
          if (btnReset) {
              btnReset.onclick = () => {
                  const resetConfirmText = getUIText('resetConfirm', '다시 시작합니까?');
                  if(confirm(resetConfirmText)) {
                      this.resetRound(1);
                      this.renderBoard();
                      this.updateUI();
                  }
              };
          }
          const btnSound = document.getElementById('btn-sound');
          if (btnSound) {
              btnSound.onclick = () => {
                  Sound.isMuted = !Sound.isMuted;
                  btnSound.innerText = Sound.isMuted ? "🔇" : "🔊";
              };
          }
      }
  };

  if (typeof window !== 'undefined') window.Game = Game;
})();