(function() {
  'use strict';

  // ================= SOUND ENGINE =================
  const SoundEngine = {
      ctx: null,
      isMuted: false,
      init: function() {
          window.AudioContext = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioContext();
      },
      playTone: function(freq, type, duration, vol = 0.1) {
          if (this.isMuted || !this.ctx) return;
          if (this.ctx.state === 'suspended') this.ctx.resume();
          
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(vol, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + duration);
      },
      playFlip: function() { this.playTone(400, 'sine', 0.1, 0.05); }, // 틱
      playMatch: function() { 
          this.playTone(600, 'sine', 0.1, 0.1); 
          setTimeout(() => this.playTone(900, 'sine', 0.2, 0.1), 100); 
      }, // 띠링!
      playFail: function() { this.playTone(150, 'sawtooth', 0.3, 0.1); }, // 뿡...
      playWin: function() {
          [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.2, 0.1), i * 100));
      }
  };

  // ================= DATA & CONFIG =================
  // 사용할 이모지 풀 (충분히 많이 준비)
  const EMOJIS = [
      '🍎','🍌','🍇','🍓','🍉','🥝','🍒','🍑','🍍','🥥',
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
      '⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸',
      '🚗','🚕','🚙','🚌','🚒','🚑','🚓','🚜','🚲','🚀',
      '⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','📷','📹','📺'
  ];

  // 레벨 디자인 (그리드 크기, 제한 시간)
  const LEVELS = [
      { rows: 3, cols: 4, time: 30 }, // Lv 1: 12장 (6쌍)
      { rows: 4, cols: 4, time: 45 }, // Lv 2: 16장 (8쌍)
      { rows: 4, cols: 5, time: 60 }, // Lv 3: 20장 (10쌍)
      { rows: 4, cols: 6, time: 75 }, // Lv 4: 24장 (12쌍)
      { rows: 5, cols: 6, time: 90 }, // Lv 5: 30장 (15쌍)
      { rows: 6, cols: 6, time: 120 } // Lv 6: 36장 (18쌍)
  ];

  const Game = {
      container: null,
      state: {
          level: 0,
          score: 0,
          cards: [],
          flipped: [],
          matches: 0,
          isLocked: false,
          timeLeft: 0,
          timerId: null
      },
      callbacks: {},

      init: function(container, options = {}) {
          this.container = container;
          this.callbacks = options;
          SoundEngine.init();
          
          this.renderLayout();
          this.showModal('start');
      },

      renderLayout: function() {
          this.container.innerHTML = `
              <div class="mem-wrapper">
                  <div class="game-frame">
                      <div class="mem-header">
                          <div class="mem-info">
                              <div class="mem-badge">LEVEL <span id="ui-level">1</span></div>
                              <div class="mem-badge">SCORE <span id="ui-score" class="accent">0</span></div>
                          </div>
                          <div class="mem-info">
                              <button class="btn-icon" id="btn-sound">🔊</button>
                              <button class="btn-icon" id="btn-help">?</button>
                          </div>
                      </div>
                      <div class="timer-container"><div class="timer-bar" id="timer-bar"></div></div>
                      
                      <div class="mem-board">
                          <div class="card-grid" id="grid"></div>
                      </div>

                      <div class="mem-modal" id="modal">
                          <div class="modal-content">
                              <div class="modal-title" id="m-title">READY</div>
                              <div class="modal-desc" id="m-desc">같은 그림의 카드를 찾아주세요!</div>
                              <button class="btn-action" id="m-btn">START</button>
                          </div>
                      </div>
                  </div>
              </div>
          `;

          // UI Elements
          this.ui = {
              grid: document.getElementById('grid'),
              level: document.getElementById('ui-level'),
              score: document.getElementById('ui-score'),
              timer: document.getElementById('timer-bar'),
              modal: document.getElementById('modal'),
              mTitle: document.getElementById('m-title'),
              mDesc: document.getElementById('m-desc'),
              mBtn: document.getElementById('m-btn'),
              btnSound: document.getElementById('btn-sound'),
              btnHelp: document.getElementById('btn-help')
          };

          // Event Listeners
          this.ui.mBtn.onclick = () => this.handleModalAction();
          this.ui.btnHelp.onclick = () => this.showModal('help');
          this.ui.btnSound.onclick = () => {
              SoundEngine.isMuted = !SoundEngine.isMuted;
              this.ui.btnSound.innerText = SoundEngine.isMuted ? "🔇" : "🔊";
              this.ui.btnSound.blur();
          };
      },

      startLevel: function() {
          const config = LEVELS[Math.min(this.state.level, LEVELS.length - 1)];
          const pairCount = (config.rows * config.cols) / 2;
          
          // 1. 카드 데이터 생성
          const selectedEmojis = EMOJIS.sort(() => 0.5 - Math.random()).slice(0, pairCount);
          const deck = [...selectedEmojis, ...selectedEmojis].sort(() => 0.5 - Math.random());
          
          this.state.cards = deck;
          this.state.flipped = [];
          this.state.matches = 0;
          this.state.isLocked = false;
          this.state.timeLeft = config.time;
          
          // UI 업데이트
          this.ui.level.innerText = this.state.level + 1;
          this.ui.score.innerText = this.state.score;
          this.ui.timer.style.width = '100%';
          
          // 2. 그리드 그리기 (CSS Grid 동적 설정)
          this.ui.grid.innerHTML = '';
          this.ui.grid.style.gridTemplateColumns = `repeat(${config.cols}, 1fr)`;
          this.ui.grid.style.gridTemplateRows = `repeat(${config.rows}, 1fr)`;

          deck.forEach((emoji, idx) => {
              const card = document.createElement('div');
              card.className = 'card';
              card.dataset.idx = idx;
              card.innerHTML = `
                  <div class="card-inner">
                      <div class="card-front">?</div>
                      <div class="card-back">${emoji}</div>
                  </div>
              `;
              card.onclick = () => this.handleCardClick(card, idx);
              this.ui.grid.appendChild(card);
          });

          // 3. 타이머 시작
          this.startTimer(config.time);
      },

      handleCardClick: function(card, idx) {
          // 클릭 불가능 조건 (이미 뒤집힘, 매칭됨, 처리중, 타임오버)
          if (this.state.isLocked) return;
          if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

          SoundEngine.playFlip();
          card.classList.add('flipped');
          this.state.flipped.push({ card, idx, emoji: this.state.cards[idx] });

          // 두 장 뒤집었을 때
          if (this.state.flipped.length === 2) {
              this.checkMatch();
          }
      },

      checkMatch: function() {
          this.state.isLocked = true; // 입력 잠금
          const [first, second] = this.state.flipped;

          if (first.emoji === second.emoji) {
              // 매칭 성공
              setTimeout(() => {
                  SoundEngine.playMatch();
                  first.card.classList.add('matched');
                  second.card.classList.add('matched');
                  this.state.flipped = [];
                  this.state.isLocked = false;
                  this.state.matches++;
                  this.state.score += 100;
                  this.ui.score.innerText = this.state.score;

                  // 클리어 체크
                  if (this.state.matches === this.state.cards.length / 2) {
                      this.levelClear();
                  }
              }, 500);
          } else {
              // 매칭 실패
              setTimeout(() => {
                  SoundEngine.playFail();
                  first.card.classList.remove('flipped');
                  second.card.classList.remove('flipped');
                  this.state.flipped = [];
                  this.state.isLocked = false;
              }, 1000);
          }
      },

      startTimer: function(duration) {
          if (this.state.timerId) clearInterval(this.state.timerId);
          
          const totalTime = duration * 1000;
          let remaining = totalTime;
          const interval = 100; // 업데이트 주기

          this.state.timerId = setInterval(() => {
              remaining -= interval;
              const percent = (remaining / totalTime) * 100;
              this.ui.timer.style.width = `${percent}%`;

              if (remaining <= 0) {
                  clearInterval(this.state.timerId);
                  this.gameOver();
              }
          }, interval);
      },

      levelClear: function() {
          clearInterval(this.state.timerId);
          SoundEngine.playWin();
          
          // 보너스 점수
          const bonus = Math.floor(parseInt(this.ui.timer.style.width) || 0) * 10;
          this.state.score += bonus;
          
          if (this.state.level < LEVELS.length - 1) {
              this.showModal('clear', `보너스 점수: ${bonus}`);
          } else {
              this.showModal('allclear', `최종 점수: ${this.state.score}`);
          }
      },

      gameOver: function() {
          SoundEngine.playFail();
          this.showModal('fail');
      },

      // --- 모달 관리 ---
      showModal: function(type, msg = '') {
          this.ui.modal.classList.add('active');
          this.currentModalType = type;

          switch(type) {
              case 'start':
                  this.ui.mTitle.innerText = "기억력 마스터";
                  this.ui.mDesc.innerText = "제한 시간 안에 모든 카드의 짝을 맞춰주세요!";
                  this.ui.mBtn.innerText = "게임 시작";
                  break;
              case 'clear':
                  this.ui.mTitle.innerText = "STAGE CLEAR!";
                  this.ui.mDesc.innerText = msg || "다음 단계로 넘어갑니다.";
                  this.ui.mBtn.innerText = "다음 레벨";
                  break;
              case 'fail':
                  this.ui.mTitle.innerText = "TIME OVER";
                  this.ui.mDesc.innerText = "시간이 초과되었습니다.";
                  this.ui.mBtn.innerText = "다시 도전";
                  break;
              case 'allclear':
                  this.ui.mTitle.innerText = "LEGENDARY!";
                  this.ui.mDesc.innerText = msg;
                  this.ui.mBtn.innerText = "처음부터 다시";
                  break;
              case 'help':
                  this.ui.mTitle.innerText = "게임 방법";
                  this.ui.mDesc.innerHTML = "1. 카드를 뒤집어 짝을 찾으세요.<br>2. 틀리면 다시 뒤집힙니다.<br>3. 시간 안에 모두 찾으면 승리!";
                  this.ui.mBtn.innerText = "닫기";
                  break;
          }
          this.ui.mBtn.focus();
      },

      handleModalAction: function() {
          this.ui.modal.classList.remove('active');
          
          switch(this.currentModalType) {
              case 'start':
                  this.state.level = 0;
                  this.state.score = 0;
                  this.startLevel();
                  break;
              case 'clear':
                  this.state.level++;
                  this.startLevel();
                  break;
              case 'fail':
                  // 현재 레벨 재시작
                  this.startLevel();
                  break;
              case 'allclear':
                  this.state.level = 0;
                  this.state.score = 0;
                  this.startLevel();
                  break;
              case 'help':
                  // 그냥 닫기 (게임 중이면 그대로 진행)
                  break;
          }
      },
      
      reset: function() {
          this.state.level = 0;
          this.state.score = 0;
          this.showModal('start');
      }
  };

  if (typeof window !== 'undefined') window.Game = Game;
})();