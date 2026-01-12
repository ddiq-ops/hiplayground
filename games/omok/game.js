(function() {
  'use strict';

  const BOARD_SIZE = 15;
  const EMPTY = 0;
  const BLACK = 1; // 플레이어
  const WHITE = 2; // AI

  // Helper function to get translated text
  function getUIText(key, defaultValue) {
      if (typeof I18n !== 'undefined' && I18n.t) {
          const fullKey = `gameDetails.omok.ui.${key}`;
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
      ctx: null,
      isMuted: false,
      init: function() {
          window.AudioContext = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioContext();
      },
      playTone: function(freq, type, duration) {
          if (this.isMuted || !this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(); osc.stop(this.ctx.currentTime + duration);
      },
      playPlace: function() {
          if (this.isMuted || !this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.frequency.setValueAtTime(200, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.05);
          gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
          osc.connect(gain); gain.connect(this.ctx.destination);
          osc.start(); osc.stop(this.ctx.currentTime + 0.05);
      },
      playWin: function() {
          [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.4), i * 150));
      },
      playLose: function() {
          [400, 300, 200].forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.4), i * 200));
      }
  };

  // ================= GAME LOGIC =================
  const Game = {
      container: null,
      state: {
          board: [],
          currentPlayer: BLACK,
          round: 1, 
          maxRound: 12,
          gameOver: false,
          winner: null,
          moveHistory: [],
          isThinking: false
      },

      init: function(container) {
          this.container = container;
          Sound.init();
          
          const saved = localStorage.getItem('omok_save_v4'); // Save version up
          if (saved) {
              try {
                  const parsed = JSON.parse(saved);
                  this.state = { ...this.state, ...parsed };
              } catch(e) { this.resetRound(1); }
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
          this.state.board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
          this.state.currentPlayer = BLACK;
          this.state.gameOver = false;
          this.state.winner = null;
          this.state.moveHistory = [];
          this.state.isThinking = false;
          if (round) this.state.round = round;
          this.saveProgress();
      },

      saveProgress: function() {
          localStorage.setItem('omok_save_v4', JSON.stringify(this.state));
      },

      makeMove: function(row, col) {
          if (this.state.gameOver || this.state.board[row][col] !== EMPTY || this.state.isThinking) return;

          this.placeStone(row, col, this.state.currentPlayer);

          if (this.checkWin(row, col, this.state.currentPlayer)) {
              this.endGame(this.state.currentPlayer);
              return;
          }

          this.state.currentPlayer = this.state.currentPlayer === BLACK ? WHITE : BLACK;
          this.updateUI();

          if (this.state.currentPlayer === WHITE) {
              this.state.isThinking = true;
              this.updateUI();
              // 난이도가 높을수록 계산량이 많아 UI 멈춤 방지를 위해 딜레이
              setTimeout(() => {
                  this.makeAIMove();
                  this.state.isThinking = false;
                  this.updateUI();
              }, 100);
          }
      },

      placeStone: function(row, col, player) {
          this.state.board[row][col] = player;
          this.state.moveHistory.push({ row, col, player });
          Sound.playPlace();
          
          const cell = document.querySelector(`.cell[data-r="${row}"][data-c="${col}"]`);
          if (cell) {
              const ghost = cell.querySelector('.ghost');
              if (ghost) ghost.remove();
              
              const stone = document.createElement('div');
              stone.className = `stone ${player === BLACK ? 'black' : 'white'} placed`;
              cell.appendChild(stone);

              this.clearHighlight();
              const marker = document.createElement('div');
              marker.className = 'last-move-marker';
              cell.appendChild(marker);
          }
          this.saveProgress();
      },

      makeAIMove: function() {
          if (this.state.gameOver) return;
          const move = this.getAIMove();
          if (move) {
              this.placeStone(move.row, move.col, WHITE);
              if (this.checkWin(move.row, move.col, WHITE)) {
                  this.endGame(WHITE);
                  return;
              }
              this.state.currentPlayer = BLACK;
              this.updateUI();
          }
      },

      // ================= AI CORE (HELL MODE) =================
      getAIMove: function() {
          const round = this.state.round;
          
          // 1. 킬각 체크 (필수)
          const winMove = this.findWinningMove(WHITE);
          if (winMove) return winMove;

          // 2. 방어 체크 (필수)
          const blockMove = this.findWinningMove(BLACK);
          if (blockMove) return blockMove;

          // 3. 헬 모드 난이도 설정
          // Round 1부터 이미 기존 최상위 난이도 적용
          let depth = 3;           // 수읽기 깊이 (기본 3수 앞)
          let checkCount = 20;     // 고려할 후보 수
          let defenseWeight = 1.0; // 방어 가중치

          if (round === 1) {
              // 시작부터 가차없음
              depth = 3; checkCount = 20; defenseWeight = 1.0; 
          } else if (round <= 4) {
              // 조금 더 넓게 봄
              depth = 3; checkCount = 30; defenseWeight = 1.2;
          } else if (round <= 8) {
              // 철벽 방어 시작
              depth = 3; checkCount = 40; defenseWeight = 1.5;
          } else {
              // Round 9 ~ 12: 신의 영역 (Depth 4 시도 - 성능 주의)
              // 브라우저 성능을 위해 Depth 4는 후보군을 좁혀서 실행
              depth = 4; checkCount = 10; defenseWeight = 2.0;
          }

          return this.minimaxRoot(depth, checkCount, defenseWeight);
      },

      minimaxRoot: function(depth, checkCount, defenseWeight) {
          const candidates = this.getCandidateMoves();
          const topCandidates = candidates.slice(0, checkCount);
          
          if (topCandidates.length === 0) return { row: 7, col: 7 };

          let bestScore = -Infinity;
          let bestMove = topCandidates[0];

          for (const move of topCandidates) {
              this.state.board[move.row][move.col] = WHITE;
              
              // Minimax 실행
              let score = this.minimax(depth - 1, -Infinity, Infinity, false);
              
              // 추가 전략: 상대의 공격을 원천 봉쇄하기 위한 위치 평가
              // defenseWeight가 높을수록 상대가 두었을 때 점수가 높은 곳을 우선적으로 차지함
              const defenseScore = this.evaluatePosition(move.row, move.col, BLACK);
              score += defenseScore * (defenseWeight * 0.1); // 방어 점수 반영

              this.state.board[move.row][move.col] = EMPTY;

              if (score > bestScore) {
                  bestScore = score;
                  bestMove = move;
              }
          }
          return bestMove;
      },

      minimax: function(depth, alpha, beta, isMaximizing) {
          if (depth === 0) {
              // AI(White) 유리함 - 플레이어(Black) 유리함
              return this.evaluateBoard(WHITE) - this.evaluateBoard(BLACK) * 1.1; 
          }

          const candidates = this.getCandidateMoves().slice(0, 8); // 깊은 탐색은 상위 8개만
          if (candidates.length === 0) return 0;

          if (isMaximizing) {
              let maxEval = -Infinity;
              for (const move of candidates) {
                  this.state.board[move.row][move.col] = WHITE;
                  const evalScore = this.minimax(depth - 1, alpha, beta, false);
                  this.state.board[move.row][move.col] = EMPTY;
                  maxEval = Math.max(maxEval, evalScore);
                  alpha = Math.max(alpha, evalScore);
                  if (beta <= alpha) break;
              }
              return maxEval;
          } else {
              let minEval = Infinity;
              for (const move of candidates) {
                  this.state.board[move.row][move.col] = BLACK;
                  const evalScore = this.minimax(depth - 1, alpha, beta, true);
                  this.state.board[move.row][move.col] = EMPTY;
                  minEval = Math.min(minEval, evalScore);
                  beta = Math.min(beta, evalScore);
                  if (beta <= alpha) break;
              }
              return minEval;
          }
      },

      // --- 승리/방어 필수 체크 (4목, 3목 등) ---
      findWinningMove: function(player) {
          // 1순위: 4목 -> 5목 만들기
          for (let r = 0; r < BOARD_SIZE; r++) {
              for (let c = 0; c < BOARD_SIZE; c++) {
                  if (this.state.board[r][c] === EMPTY) {
                      this.state.board[r][c] = player;
                      if (this.checkWin(r, c, player)) {
                          this.state.board[r][c] = EMPTY;
                          return { row: r, col: c };
                      }
                      this.state.board[r][c] = EMPTY;
                  }
              }
          }
          // 2순위: 열린 3목 막기/만들기 (간단 체크)
          // 성능상 모든 패턴 매칭은 무거우므로 Minimax에 위임하되,
          // 헬 모드에서는 더 깊게 탐색하므로 Minimax가 처리함.
          return null;
      },

      getCandidateMoves: function() {
          const candidates = [];
          for (let r = 0; r < BOARD_SIZE; r++) {
              for (let c = 0; c < BOARD_SIZE; c++) {
                  if (this.state.board[r][c] !== EMPTY) continue;
                  if (this.hasNearbyPiece(r, c, 2)) {
                      // 중앙 점수 + 해당 위치의 공격/방어 가치
                      let score = (7 - Math.abs(r - 7)) + (7 - Math.abs(c - 7));
                      
                      // 휴리스틱: 이 위치가 얼마나 가치있는지 약식 평가
                      score += this.evaluatePosition(r, c, WHITE); // 공격 가치
                      score += this.evaluatePosition(r, c, BLACK); // 방어 가치
                      
                      candidates.push({ row: r, col: c, baseScore: score });
                  }
              }
          }
          return candidates.sort((a, b) => b.baseScore - a.baseScore);
      },

      hasNearbyPiece: function(r, c, dist) {
          const minR = Math.max(0, r - dist), maxR = Math.min(BOARD_SIZE - 1, r + dist);
          const minC = Math.max(0, c - dist), maxC = Math.min(BOARD_SIZE - 1, c + dist);
          for (let i = minR; i <= maxR; i++) {
              for (let j = minC; j <= maxC; j++) {
                  if (this.state.board[i][j] !== EMPTY) return true;
              }
          }
          return false;
      },

      // 패턴 점수 계산 (연속된 돌의 개수)
      evaluatePosition: function(r, c, player) {
          let totalScore = 0;
          const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
          
          this.state.board[r][c] = player; 
          
          for(const [dr, dc] of directions) {
              let count = 1;
              let openEnds = 0;
              
              // 정방향 탐색
              let i = 1;
              while(this.isValidAndOwner(r+dr*i, c+dc*i, player)) { count++; i++; }
              if(this.isValidAndEmpty(r+dr*i, c+dc*i)) openEnds++;
              
              // 역방향 탐색
              let j = 1;
              while(this.isValidAndOwner(r-dr*j, c-dc*j, player)) { count++; j++; }
              if(this.isValidAndEmpty(r-dr*j, c-dc*j)) openEnds++;

              // 점수 부여 (열린 3목, 4목 등에 큰 점수)
              if(count >= 5) totalScore += 100000;
              else if(count === 4) {
                  if(openEnds > 0) totalScore += 10000; // 닫힌 4목도 위험
                  if(openEnds === 2) totalScore += 40000; // 열린 4목 (필승)
              }
              else if(count === 3 && openEnds === 2) totalScore += 5000; // 열린 3목
              else if(count === 2 && openEnds === 2) totalScore += 100;
          }
          
          this.state.board[r][c] = EMPTY; 
          return totalScore;
      },

      evaluateBoard: function(player) {
          // 전체 보드 상황 평가 (랜덤성 제거, 순수 실력)
          let score = 0;
          // 간단하게 현재 보드에서 유리한 패턴이 얼마나 많은지 체크
          // (성능을 위해 후보군 평가로 대체됨, 여기선 기본 점수만 반환)
          return score;
      },

      isValidAndOwner: function(r, c, player) {
          return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.state.board[r][c] === player;
      },
      isValidAndEmpty: function(r, c) {
          return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.state.board[r][c] === EMPTY;
      },

      checkWin: function(row, col, player) {
          const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
          for (const [dr, dc] of directions) {
              let count = 1;
              for (let i = 1; i < 5; i++) {
                  const r = row + dr * i, c = col + dc * i;
                  if (!this.isValidAndOwner(r, c, player)) break;
                  count++;
              }
              for (let i = 1; i < 5; i++) {
                  const r = row - dr * i, c = col - dc * i;
                  if (!this.isValidAndOwner(r, c, player)) break;
                  count++;
              }
              if (count >= 5) return true;
          }
          return false;
      },

      endGame: function(winner) {
          this.state.gameOver = true;
          this.state.winner = winner;
          this.saveProgress();

          if (winner === BLACK) { // 플레이어 승리
              Sound.playWin();
              if (this.state.round < this.state.maxRound) {
                  const title = getUIText('modal.miracle.title', '기적입니다!');
                  const desc = getUIText('modal.miracle.desc', '라운드 {round} 돌파!').replace('{round}', this.state.round);
                  const button = getUIText('modal.miracle.button', '다음 지옥으로');
                  this.showModal(title, desc, button, 'next');
              } else {
                  const title = getUIText('modal.godlike.title', 'GODLIKE!');
                  const desc = getUIText('modal.godlike.desc', '인간의 승리입니다. 당신은 전설입니다.');
                  const button = getUIText('modal.godlike.button', '처음부터 다시');
                  this.showModal(title, desc, button, 'reset');
              }
          } else { // 패배
              Sound.playLose();
              const title = getUIText('modal.youDied.title', 'YOU DIED');
              const desc = getUIText('modal.youDied.desc', 'AI의 벽은 높았습니다...');
              const button = getUIText('modal.youDied.button', '재도전');
              this.showModal(title, desc, button, 'retry');
          }
      },

      handleAction: function(action) {
          document.getElementById('modal').classList.remove('active');
          if (action === 'next') this.resetRound(this.state.round + 1);
          else if (action === 'retry') this.resetRound(this.state.round);
          else if (action === 'reset') this.resetRound(1);
          this.renderBoard();
          this.updateUI();
      },

      renderLayout: function() {
          this.container.innerHTML = `
              <div class="omok-wrapper">
                  <div class="game-frame">
                      <div class="omok-header">
                          <div class="omok-status-group">
                              <div class="round-badge" id="ui-round">${getUIText('roundText', 'ROUND 1 / 12 (HELL)').replace('{round}', this.state.round)}</div>
                              <div class="turn-info">
                                  <div class="player-badge active" id="badge-black"><span class="stone-icon black"></span> ${getUIText('you', 'YOU')}</div>
                                  <div class="player-badge" id="badge-white"><span class="stone-icon white"></span> ${getUIText('ai', 'AI')}</div>
                              </div>
                          </div>
                          <div class="btn-group">
                              <button class="btn-util" id="btn-undo">${getUIText('buttons.undo', '무르기')}</button>
                              <button class="btn-util" id="btn-reset">${getUIText('buttons.forfeit', '포기')}</button>
                              <button class="btn-util" id="btn-sound">🔊</button>
                          </div>
                      </div>
                      <div class="omok-body">
                          <div class="omok-board" id="board">
                              <svg class="grid-lines" width="100%" height="100%">${this.createGridLines()}${this.createDots()}</svg>
                          </div>
                      </div>
                      <div class="omok-modal" id="modal">
                          <div class="modal-box">
                              <div class="modal-title" id="m-title"></div>
                              <div class="modal-desc" id="m-desc"></div>
                              <button class="btn-action" id="m-btn">${getUIText('buttons.confirm', '확인')}</button>
                          </div>
                      </div>
                  </div>
              </div>
          `;
      },

      updateUI: function() {
          const roundText = getUIText('roundText', 'ROUND {round} / 12 (HELL)').replace('{round}', this.state.round);
          document.getElementById('ui-round').innerText = roundText;
          const bBadge = document.getElementById('badge-black');
          const wBadge = document.getElementById('badge-white');
          if (this.state.currentPlayer === BLACK) {
              bBadge.classList.add('active'); wBadge.classList.remove('active');
              if(this.state.isThinking) {
                  wBadge.innerText = getUIText('aiThinking', 'AI (연산중...)');
              }
          } else {
              bBadge.classList.remove('active'); wBadge.classList.add('active');
              if(this.state.isThinking) {
                  wBadge.innerText = getUIText('aiThinking', 'AI (연산중...)');
              }
          }
          if(!this.state.isThinking) {
              const youText = getUIText('you', 'YOU');
              const aiText = getUIText('ai', 'AI');
              document.getElementById('badge-black').innerHTML = `<span class="stone-icon black"></span> ${youText}`;
              document.getElementById('badge-white').innerHTML = `<span class="stone-icon white"></span> ${aiText}`;
          }
      },

      createGridLines: function() {
          let lines = ''; const step = 100/15, half = step/2;
          for (let i=0; i<15; i++) {
              const pos = half + i*step;
              lines += `<line x1="${pos}%" y1="${half}%" x2="${pos}%" y2="${100-half}%" stroke="#5d4037" stroke-width="1" />`;
              lines += `<line x1="${half}%" y1="${pos}%" x2="${100-half}%" y2="${pos}%" stroke="#5d4037" stroke-width="1" />`;
          }
          return lines;
      },
      createDots: function() {
          let dots = ''; const step = 100/15, half = step/2;
          [3,7,11].forEach(r => [3,7,11].forEach(c => dots += `<circle cx="${half+c*step}%" cy="${half+r*step}%" r="2.5" fill="#5d4037" />`));
          return dots;
      },
      renderBoard: function() {
          const boardEl = document.getElementById('board');
          boardEl.querySelectorAll('.cell').forEach(el => el.remove());
          for (let r=0; r<BOARD_SIZE; r++) {
              for (let c=0; c<BOARD_SIZE; c++) {
                  const cell = document.createElement('div');
                  cell.className = 'cell'; cell.dataset.r = r; cell.dataset.c = c;
                  if (this.state.board[r][c] !== EMPTY) {
                      const stone = document.createElement('div');
                      stone.className = `stone ${this.state.board[r][c] === BLACK ? 'black' : 'white'} placed`;
                      cell.appendChild(stone);
                  }
                  cell.onclick = () => this.makeMove(r, c);
                  cell.onmouseenter = () => this.onHover(r, c);
                  cell.onmouseleave = () => this.onLeave(r, c);
                  boardEl.appendChild(cell);
              }
          }
          if(this.state.moveHistory.length > 0) {
              const last = this.state.moveHistory[this.state.moveHistory.length-1];
              this.highlightLastMove(last.row, last.col);
          }
      },
      onHover: function(r, c) {
          if(this.state.gameOver || this.state.currentPlayer === WHITE || this.state.board[r][c] !== EMPTY) return;
          const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
          if(cell && !cell.hasChildNodes()) {
              const ghost = document.createElement('div'); ghost.className = 'stone black ghost'; cell.appendChild(ghost);
          }
      },
      onLeave: function(r, c) {
          const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
          const ghost = cell ? cell.querySelector('.ghost') : null;
          if(ghost) ghost.remove();
      },
      clearHighlight: function() { document.querySelectorAll('.last-move-marker').forEach(el => el.remove()); },
      highlightLastMove: function(r, c) {
          this.clearHighlight();
          const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
          if(cell) { const m = document.createElement('div'); m.className = 'last-move-marker'; cell.appendChild(m); }
      },
      undoMove: function() {
          if(this.state.moveHistory.length < 2 || this.state.gameOver) return;
          // AI와 나, 두 수를 물림
          for(let i=0; i<2; i++) {
              const last = this.state.moveHistory.pop();
              this.state.board[last.row][last.col] = EMPTY;
          }
          this.renderBoard(); this.saveProgress();
      },
      showModal: function(title, desc, btnText, action) {
          const modal = document.getElementById('modal');
          document.getElementById('m-title').innerText = title;
          document.getElementById('m-desc').innerText = desc;
          const btn = document.getElementById('m-btn');
          btn.innerText = btnText;
          btn.onclick = () => this.handleAction(action);
          modal.classList.add('active');
      },
      setupEvents: function() {
          const btnUndo = document.getElementById('btn-undo');
          if (btnUndo) btnUndo.onclick = () => this.undoMove();
          
          const btnReset = document.getElementById('btn-reset');
          if (btnReset) {
              btnReset.onclick = () => {
                  const resetConfirmText = getUIText('resetConfirm', '처음부터 다시 시작합니까?');
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
                  btnSound.blur();
              };
          }
      }
  };

  if (typeof window !== 'undefined') window.Game = Game;
})();