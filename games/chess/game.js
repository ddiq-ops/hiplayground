(function() {
  'use strict';

  const PIECES = {
      p: 'pawn', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king'
  };
  const SYMBOLS = {
      w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
      b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' }
  };
  
  // 기물 이미지 URL (위키미디어 SVG)
  const ASSETS = {
      w: {
          p: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
          r: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
          n: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
          b: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
          q: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
          k: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg"
      },
      b: {
          p: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
          r: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
          n: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
          b: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
          q: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
          k: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg"
      }
  };

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
      playMove: function() { // 탁!
          if (this.isMuted || !this.ctx) return;
          const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
          osc.frequency.setValueAtTime(150, this.ctx.currentTime); gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
          osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.05);
      },
      playCapture: function() { // 팍!
          this.playTone(300, 'square', 0.1);
      },
      playCheck: function() { // 띠링
          this.playTone(600, 'sine', 0.2); setTimeout(() => this.playTone(800, 'sine', 0.3), 100);
      },
      playWin: function() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.4), i * 150)); },
      playLose: function() { [400, 300, 200].forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.4), i * 200)); }
  };

  // ================= GAME LOGIC =================
  const Game = {
      container: null,
      state: {
          board: [], // 8x8 array: { type: 'p', color: 'w', hasMoved: false }
          turn: 'w',
          round: 1, maxRound: 12,
          selected: null, // {r, c}
          possibleMoves: [],
          lastMove: null, // {from: {r,c}, to: {r,c}}
          gameOver: false,
          enPassantTarget: null, // {r, c} target square for en passant
          halfMoveClock: 0, // 50-move rule
      },

      init: function(container) {
          this.container = container;
          Sound.init();
          
          // Load or New Game
          const saved = localStorage.getItem('chess_save_v2');
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
      },

      resetRound: function(round) {
          this.state.board = this.createInitialBoard();
          this.state.turn = 'w';
          this.state.selected = null;
          this.state.possibleMoves = [];
          this.state.lastMove = null;
          this.state.gameOver = false;
          this.state.enPassantTarget = null;
          this.state.halfMoveClock = 0;
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

      saveProgress: function() { localStorage.setItem('chess_save_v2', JSON.stringify(this.state)); },

      // --- MOVE LOGIC ---
      handleSquareClick: function(r, c) {
          if(this.state.gameOver || this.state.turn === 'b') return; // AI Turn Block

          const piece = this.state.board[r][c];
          
          // 1. 이미 선택된 기물을 다른 곳으로 이동
          if(this.state.selected) {
              const move = this.state.possibleMoves.find(m => m.to.r === r && m.to.c === c);
              if(move) {
                  this.executeMove(move);
                  return;
              }
          }

          // 2. 내 기물 선택
          if(piece && piece.color === 'w') {
              this.state.selected = {r, c};
              this.state.possibleMoves = this.getValidMoves(r, c, this.state.board);
              this.renderBoard();
              return;
          }

          // 3. 빈 땅 클릭 -> 선택 해제
          this.state.selected = null;
          this.state.possibleMoves = [];
          this.renderBoard();
      },

      executeMove: function(move) {
          const { from, to, special } = move;
          const piece = this.state.board[from.r][from.c];
          const target = this.state.board[to.r][to.c];
          const isCapture = target !== null || special === 'enpassant';

          // 사운드
          if(isCapture) Sound.playCapture(); else Sound.playMove();

          // 이동 처리
          this.state.board[to.r][to.c] = piece;
          this.state.board[from.r][from.c] = null;
          piece.hasMoved = true;

          // 특수 규칙 처리
          // 1. 앙파상
          if(special === 'enpassant') {
              const captureR = from.r; // 잡히는 폰의 행 (현재 행)
              const captureC = to.c;
              this.state.board[captureR][captureC] = null;
          }
          
          // 2. 캐슬링
          if(special === 'castle') {
              if(to.c === 6) { // King-side
                  const rook = this.state.board[to.r][7];
                  this.state.board[to.r][5] = rook;
                  this.state.board[to.r][7] = null;
                  if(rook) rook.hasMoved = true;
              } else if(to.c === 2) { // Queen-side
                  const rook = this.state.board[to.r][0];
                  this.state.board[to.r][3] = rook;
                  this.state.board[to.r][0] = null;
                  if(rook) rook.hasMoved = true;
              }
          }

          // 3. 프로모션 (플레이어인 경우 팝업, AI는 퀸 자동)
          if(piece.type === 'p' && (to.r === 0 || to.r === 7)) {
              if(piece.color === 'w') {
                  this.showPromotionModal(to.r, to.c);
                  return; // 모달에서 처리 후 턴 넘김
              } else {
                  piece.type = 'q'; // AI는 항상 퀸
              }
          }

          // 4. 앙파상 타겟 설정
          if(piece.type === 'p' && Math.abs(to.r - from.r) === 2) {
              this.state.enPassantTarget = { r: (from.r + to.r) / 2, c: from.c };
          } else {
              this.state.enPassantTarget = null;
          }

          // 턴 종료 처리
          this.finishTurn(from, to);
      },

      finishTurn: function(from, to) {
          this.state.selected = null;
          this.state.possibleMoves = [];
          this.state.lastMove = { from, to };
          this.state.turn = this.state.turn === 'w' ? 'b' : 'w';

          // 체크/메이트 확인
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

          // AI Turn
          if(this.state.turn === 'b' && !this.state.gameOver) {
              setTimeout(() => this.makeAIMove(), 500);
          }
      },

      // ================= AI CORE =================
      makeAIMove: function() {
          const depth = Math.min(3, Math.ceil(this.state.round / 4)); // 난이도에 따라 깊이 1~3
          const move = this.getBestMove(depth);
          
          if(move) {
              this.executeMove(move);
          } else {
              // 수가 없으면 스테일메이트 or 체크메이트
              if(this.isCheck('b', this.state.board)) this.endGame('w');
              else this.showModal("DRAW", "스테일메이트입니다.", "재시작", 'reset');
          }
      },

      getBestMove: function(depth) {
          const moves = this.getAllMoves('b', this.state.board);
          if(moves.length === 0) return null;

          // 라운드 낮으면 랜덤성 추가
          if(this.state.round <= 3 && Math.random() < 0.3) {
              return moves[Math.floor(Math.random() * moves.length)];
          }

          let bestScore = -Infinity;
          let bestMove = moves[0];

          for(const move of moves) {
              const tempBoard = this.cloneBoard(this.state.board);
              this.simulateMove(tempBoard, move);
              const score = this.minimax(tempBoard, depth - 1, -Infinity, Infinity, false);
              
              if(score > bestScore) {
                  bestScore = score;
                  bestMove = move;
              }
          }
          return bestMove;
      },

      minimax: function(board, depth, alpha, beta, isMaximizing) {
          if(depth === 0) return this.evaluateBoard(board);

          const moves = this.getAllMoves(isMaximizing ? 'b' : 'w', board);
          if(moves.length === 0) return isMaximizing ? -Infinity : Infinity;

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

      evaluateBoard: function(board) {
          let score = 0;
          const values = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
          
          for(let r=0; r<8; r++) {
              for(let c=0; c<8; c++) {
                  const p = board[r][c];
                  if(p) {
                      const val = values[p.type] + (p.type === 'p' && p.color === 'b' ? r : 0); // 전진 가중치
                      score += p.color === 'b' ? val : -val;
                  }
              }
          }
          return score;
      },

      // --- HELPER FUNCTIONS ---
      getValidMoves: function(r, c, board) {
          const p = board[r][c];
          if(!p) return [];
          const moves = [];
          
          // 기물별 이동 규칙 (간략화)
          const directions = {
              r: [[1,0], [-1,0], [0,1], [0,-1]],
              b: [[1,1], [1,-1], [-1,1], [-1,-1]],
              n: [[2,1], [2,-1], [-2,1], [-2,-1], [1,2], [1,-2], [-1,2], [-1,-2]],
              q: [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]],
              k: [[1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1]]
          };

          const addIfValid = (tr, tc, special=null) => {
              if(tr>=0 && tr<8 && tc>=0 && tc<8) {
                  const target = board[tr][tc];
                  if(!target || target.color !== p.color) {
                      // 체크 여부 시뮬레이션
                      const tempBoard = this.cloneBoard(board);
                      this.simulateMove(tempBoard, {from:{r,c}, to:{r:tr,c:tc}, special});
                      if(!this.isCheck(p.color, tempBoard)) {
                          moves.push({ from: {r,c}, to: {r:tr, c:tc}, special });
                      }
                  }
              }
          };

          if(p.type === 'p') {
              const dir = p.color === 'w' ? -1 : 1;
              // 전진
              if(!board[r+dir][c]) {
                  addIfValid(r+dir, c);
                  if(((p.color==='w' && r===6) || (p.color==='b' && r===1)) && !board[r+dir*2][c]) {
                      addIfValid(r+dir*2, c);
                  }
              }
              // 대각선 공격
              [[dir, 1], [dir, -1]].forEach(([dr, dc]) => {
                  const tr = r+dr, tc = c+dc;
                  if(tr>=0 && tr<8 && tc>=0 && tc<8) {
                      if(board[tr][tc] && board[tr][tc].color !== p.color) addIfValid(tr, tc);
                      // 앙파상
                      if(this.state.enPassantTarget && this.state.enPassantTarget.r === tr && this.state.enPassantTarget.c === tc) {
                          addIfValid(tr, tc, 'enpassant');
                      }
                  }
              });
          } else if (p.type === 'n' || p.type === 'k') {
              directions[p.type].forEach(([dr, dc]) => addIfValid(r+dr, c+dc));
              // 캐슬링 (킹) - 로직 간소화 (체크 상태 등 검사 필요)
              if(p.type === 'k' && !p.hasMoved) {
                  if(!this.isCheck(p.color, board)) { // 체크 상태 아닐 때만
                      // King-side
                      if(!board[r][5] && !board[r][6] && board[r][7] && !board[r][7].hasMoved) {
                          addIfValid(r, 6, 'castle');
                      }
                      // Queen-side
                      if(!board[r][1] && !board[r][2] && !board[r][3] && board[r][0] && !board[r][0].hasMoved) {
                          addIfValid(r, 2, 'castle');
                      }
                  }
              }
          } else { // Sliding pieces (r, b, q)
              directions[p.type].forEach(([dr, dc]) => {
                  for(let i=1; i<8; i++) {
                      const tr = r + dr*i, tc = c + dc*i;
                      if(tr<0 || tr>=8 || tc<0 || tc>=8) break;
                      const target = board[tr][tc];
                      if(target) {
                          if(target.color !== p.color) addIfValid(tr, tc);
                          break;
                      }
                      addIfValid(tr, tc);
                  }
              });
          }
          return moves;
      },

      getAllMoves: function(color, board) {
          let moves = [];
          for(let r=0; r<8; r++) {
              for(let c=0; c<8; c++) {
                  const p = board[r][c];
                  if(p && p.color === color) {
                      moves = moves.concat(this.getValidMoves(r, c, board));
                  }
              }
          }
          return moves;
      },

      isCheck: function(color, board) {
          // 킹 위치 찾기
          let kr, kc;
          for(let r=0; r<8; r++) {
              for(let c=0; c<8; c++) {
                  const p = board[r][c];
                  if(p && p.type === 'k' && p.color === color) { kr=r; kc=c; break; }
              }
          }
          // 적의 공격 범위에 킹이 있는지 확인
          const enemy = color === 'w' ? 'b' : 'w';
          // (성능상 약식 구현: 모든 적의 ValidMove를 구하지 않고, 킹 위치에서 역으로 공격자가 있는지 확인)
          // 여기선 편의상 전체 스캔
          for(let r=0; r<8; r++) {
              for(let c=0; c<8; c++) {
                  const p = board[r][c];
                  if(p && p.color === enemy) {
                      // 킹을 잡을 수 있는가? (단, 킹 이동은 제외 - 무한루프 방지)
                      // 여기서는 간단하게 폰/나이트/직선/대각선 위협만 체크해도 됨.
                      // 정확성을 위해 getValidMoves 사용하되, 재귀 호출 제한 필요.
                      // *임시*: simulateMove 없이 단순 경로 체크만 수행하여 성능 확보
                      if(this.canAttack(r, c, kr, kc, board)) return true;
                  }
              }
          }
          return false;
      },

      canAttack: function(r, c, tr, tc, board) {
          // (r,c)의 기물이 (tr,tc)를 공격 가능한지 단순 기하학적 체크 (경로상 장애물 확인)
          const p = board[r][c];
          const dr = tr - r, dc = tc - c;
          const absDr = Math.abs(dr), absDc = Math.abs(dc);
          
          if(p.type === 'n') return (absDr===2 && absDc===1) || (absDr===1 && absDc===2);
          if(p.type === 'p') {
              const dir = p.color === 'w' ? -1 : 1;
              return dr === dir && absDc === 1;
          }
          if(p.type === 'k') return absDr <= 1 && absDc <= 1;
          
          // Sliding pieces
          const stepR = dr === 0 ? 0 : dr / absDr;
          const stepC = dc === 0 ? 0 : dc / absDc;
          
          if(p.type === 'r' && (dr!==0 && dc!==0)) return false;
          if(p.type === 'b' && (absDr !== absDc)) return false;
          if(p.type === 'q' && (dr!==0 && dc!==0) && (absDr !== absDc)) return false;

          let curR = r + stepR, curC = c + stepC;
          while(curR !== tr || curC !== tc) {
              if(board[curR][curC]) return false; // Blocked
              curR += stepR; curC += stepC;
          }
          return true;
      },

      isCheckmate: function(color, board) {
          const moves = this.getAllMoves(color, board);
          return moves.length === 0;
      },

      cloneBoard: function(board) {
          return board.map(row => row.map(p => p ? {...p} : null));
      },

      simulateMove: function(board, move) {
          const { from, to, special } = move;
          const p = board[from.r][from.c];
          board[to.r][to.c] = p;
          board[from.r][from.c] = null;
          if(special === 'enpassant') {
              board[from.r][to.c] = null;
          }
          // 프로모션 가정 (퀸)
          if(p.type === 'p' && (to.r === 0 || to.r === 7)) p.type = 'q';
      },

      // --- UI ---
      renderLayout: function() {
          this.container.innerHTML = `
              <div class="chess-wrapper">
                  <div class="game-frame">
                      <div class="chess-header">
                          <div class="chess-status-group">
                              <div class="round-badge" id="ui-round">ROUND 1</div>
                              <div class="turn-info">
                                  <div class="player-badge active" id="badge-w">
                                      <span class="king-icon">♔</span> WHITE
                                  </div>
                                  <div class="player-badge" id="badge-b">
                                      <span class="king-icon">♚</span> BLACK
                                  </div>
                              </div>
                          </div>
                          <div class="btn-group">
                              <button class="btn-util" id="btn-reset">재시작</button>
                              <button class="btn-util" id="btn-sound">🔊</button>
                          </div>
                      </div>

                      <div class="chess-body">
                          <div class="chess-board" id="board"></div>
                          <div class="chess-modal" id="promo-modal">
                              <div class="modal-box">
                                  <h3 class="modal-title">승급 선택</h3>
                                  <div class="promotion-select" id="promo-options"></div>
                              </div>
                          </div>
                          <div class="chess-modal" id="msg-modal">
                              <div class="modal-box">
                                  <h3 class="modal-title" id="m-title"></h3>
                                  <p class="modal-desc" id="m-desc"></p>
                                  <button class="btn-action" id="m-btn">확인</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          `;
      },

      renderBoard: function() {
          const boardEl = document.getElementById('board');
          boardEl.innerHTML = ''; // Clear

          for(let r=0; r<8; r++) {
              for(let c=0; c<8; c++) {
                  const sq = document.createElement('div');
                  sq.className = `square ${(r+c)%2===0 ? 'light' : 'dark'}`;
                  sq.dataset.r = r; sq.dataset.c = c;
                  
                  // Highlight selected
                  if(this.state.selected && this.state.selected.r === r && this.state.selected.c === c) {
                      sq.classList.add('selected');
                  }
                  // Highlight last move
                  if(this.state.lastMove && (
                      (this.state.lastMove.from.r === r && this.state.lastMove.from.c === c) ||
                      (this.state.lastMove.to.r === r && this.state.lastMove.to.c === c)
                  )) {
                      sq.classList.add('last-move');
                  }
                  // Check highlight
                  const p = this.state.board[r][c];
                  if(p && p.type === 'k' && this.isCheck(p.color, this.state.board)) {
                      sq.classList.add('check');
                  }

                  // Render Piece
                  if(p) {
                      const img = document.createElement('div');
                      img.className = `piece ${p.color}`;
                      img.style.backgroundImage = `url('${ASSETS[p.color][p.type]}')`;
                      sq.appendChild(img);
                  }

                  // Render Move Hint
                  if(this.state.selected) {
                      const move = this.state.possibleMoves.find(m => m.to.r === r && m.to.c === c);
                      if(move) {
                          const dot = document.createElement('div');
                          dot.className = 'hint-dot';
                          if(p) sq.classList.add('capture-hint');
                          sq.appendChild(dot);
                      }
                  }

                  sq.onclick = () => this.handleSquareClick(r, c);
                  boardEl.appendChild(sq);
              }
          }
      },

      updateUI: function() {
          document.getElementById('ui-round').innerText = `ROUND ${this.state.round} / 12`;
          const wBadge = document.getElementById('badge-w');
          const bBadge = document.getElementById('badge-b');
          
          if(this.state.turn === 'w') {
              wBadge.classList.add('active'); bBadge.classList.remove('active');
          } else {
              wBadge.classList.remove('active'); bBadge.classList.add('active');
          }
      },

      showPromotionModal: function(r, c) {
          const modal = document.getElementById('promo-modal');
          const container = document.getElementById('promo-options');
          container.innerHTML = '';
          
          ['q', 'r', 'b', 'n'].forEach(type => {
              const opt = document.createElement('div');
              opt.className = 'promo-option';
              const img = document.createElement('div');
              img.className = 'promo-img';
              img.style.backgroundImage = `url('${ASSETS['w'][type]}')`;
              opt.appendChild(img);
              opt.onclick = () => {
                  this.state.board[r][c].type = type;
                  modal.classList.remove('active');
                  this.finishTurn(this.state.lastMove.from, {r, c}); // 턴 종료 재개
              };
              container.appendChild(opt);
          });
          modal.classList.add('active');
      },

      showModal: function(title, desc, btnText, action) {
          const modal = document.getElementById('msg-modal');
          document.getElementById('m-title').innerText = title;
          document.getElementById('m-desc').innerText = desc;
          const btn = document.getElementById('m-btn');
          btn.innerText = btnText;
          btn.onclick = () => {
              modal.classList.remove('active');
              if(action === 'next') this.resetRound(this.state.round + 1);
              if(action === 'retry') this.resetRound(this.state.round);
              if(action === 'reset') this.resetRound(1);
              this.renderBoard();
              this.updateUI();
          };
          modal.classList.add('active');
      },

      endGame: function(winner) {
          this.state.gameOver = true;
          if(winner === 'w') {
              Sound.playWin();
              if(this.state.round < this.state.maxRound) {
                  this.showModal("VICTORY!", `라운드 ${this.state.round} 클리어!`, "다음 라운드", 'next');
              } else {
                  this.showModal("GRANDMASTER!", "모든 상대를 제압했습니다.", "처음부터 다시", 'reset');
              }
          } else {
              Sound.playLose();
              this.showModal("DEFEAT", "체크메이트...", "재도전", 'retry');
          }
      },

      setupEvents: function() {
          document.getElementById('btn-reset').onclick = () => {
              if(confirm("게임을 초기화하시겠습니까?")) { this.resetRound(1); this.renderBoard(); this.updateUI(); }
          };
          const btnSound = document.getElementById('btn-sound');
          btnSound.onclick = () => {
              Sound.isMuted = !Sound.isMuted;
              btnSound.innerText = Sound.isMuted ? "🔇" : "🔊";
          };
      }
  };

  if (typeof window !== 'undefined') window.Game = Game;
})();