(function() {
  'use strict';

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
      playCorrect: function() { 
          this.playTone(600, 'sine', 0.1); 
          setTimeout(() => this.playTone(900, 'sine', 0.2), 100); 
      },
      playWrong: function() { this.playTone(150, 'sawtooth', 0.4); },
      playWin: function() {
          [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.2), i * 100));
      }
  };

  // ================= GAME LOGIC =================
  const Game = {
      container: null,
      state: {
          score: 0,
          level: 1,
          combo: 0,
          timeLeft: 0,
          isPlaying: false,
          currentQ: null
      },
      timerId: null,

      init: function(container) {
          this.container = container;
          Sound.init();
          this.renderLayout();
          this.showModal('start');
      },

      renderLayout: function() {
          this.container.innerHTML = `
              <div class="math-wrapper">
                  <div class="game-frame">
                      <div class="math-header">
                          <div class="stat-group">
                              <div class="stat-badge">LEVEL <span id="ui-level" class="stat-value">1</span></div>
                              <div class="stat-badge">SCORE <span id="ui-score" class="stat-value accent">0</span></div>
                          </div>
                          <div class="combo-box" id="ui-combo">COMBO x2</div>
                          <div class="stat-group">
                              <button class="stat-badge" id="btn-sound" style="cursor:pointer">🔊</button>
                          </div>
                      </div>
                      <div class="timer-container"><div class="timer-bar" id="timer-bar"></div></div>
                      
                      <div class="math-body">
                          <div class="question-box" id="q-text">Ready?</div>
                          <div class="answers-grid" id="ans-grid"></div>
                          <div id="fx-layer" style="position:absolute; width:100%; height:100%; pointer-events:none;"></div>
                      </div>

                      <div class="math-modal" id="modal">
                          <div class="modal-content">
                              <div class="modal-title" id="m-title">MATH MASTER</div>
                              <div id="m-desc" style="font-size:1.2rem; color:#bdc3c7; margin-bottom:20px;"></div>
                              <button class="btn-action" id="m-btn">START GAME</button>
                          </div>
                      </div>
                  </div>
              </div>
          `;

          this.ui = {
              qText: document.getElementById('q-text'),
              ansGrid: document.getElementById('ans-grid'),
              level: document.getElementById('ui-level'),
              score: document.getElementById('ui-score'),
              combo: document.getElementById('ui-combo'),
              timer: document.getElementById('timer-bar'),
              modal: document.getElementById('modal'),
              mTitle: document.getElementById('m-title'),
              mDesc: document.getElementById('m-desc'),
              mBtn: document.getElementById('m-btn'),
              fx: document.getElementById('fx-layer'),
              btnSound: document.getElementById('btn-sound')
          };

          this.ui.mBtn.onclick = () => {
              if(Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume();
              this.startGame();
          };
          
          this.ui.btnSound.onclick = () => {
              Sound.isMuted = !Sound.isMuted;
              this.ui.btnSound.innerText = Sound.isMuted ? "🔇" : "🔊";
              this.ui.btnSound.blur();
          };
      },

      startGame: function() {
          this.ui.modal.classList.remove('active');
          this.state.score = 0;
          this.state.level = 1;
          this.state.combo = 0;
          this.state.timeLeft = 60; 
          this.state.isPlaying = true;
          
          this.updateUI();
          this.nextQuestion();
          this.startTimer();
      },

      startTimer: function() {
          if(this.timerId) clearInterval(this.timerId);
          const totalTime = 60;
          
          this.timerId = setInterval(() => {
              if(!this.state.isPlaying) return;
              
              this.state.timeLeft -= 0.1;
              const pct = (this.state.timeLeft / totalTime) * 100;
              this.ui.timer.style.width = `${Math.max(0, pct)}%`;
              
              if(pct < 30) this.ui.timer.style.background = '#e74c3c';
              else this.ui.timer.style.background = 'linear-gradient(90deg, #2ecc71, #f1c40f, #e74c3c)';

              if(this.state.timeLeft <= 0) {
                  this.gameOver();
              }
          }, 100);
      },

      nextQuestion: function() {
          if(!this.state.isPlaying) return;

          // [수정됨] 사칙연산 로직 개선
          const level = this.state.level;
          const maxNum = 10 + (level * 5); 
          
          // 연산자 결정 (레벨에 따라 해금)
          const ops = ['+', '-', '×', '÷'];
          let opIndex;
          if (level < 3) opIndex = Math.floor(Math.random() * 2); // +, -
          else if (level < 5) opIndex = Math.floor(Math.random() * 3); // +, -, *
          else opIndex = Math.floor(Math.random() * 4); // +, -, *, /
          
          const op = ops[opIndex];
          
          let n1, n2, ans;

          if (op === '+') {
              n1 = Math.floor(Math.random() * maxNum) + 1;
              n2 = Math.floor(Math.random() * maxNum) + 1;
              ans = n1 + n2;
          } else if (op === '-') {
              n1 = Math.floor(Math.random() * maxNum) + 1;
              n2 = Math.floor(Math.random() * maxNum) + 1;
              if(n1 < n2) [n1, n2] = [n2, n1]; // 음수 방지
              ans = n1 - n2;
          } else if (op === '×') {
              // 곱셈은 숫자가 너무 커지지 않게 제한
              n1 = Math.floor(Math.random() * (level * 2 + 2)) + 2;
              n2 = Math.floor(Math.random() * 9) + 2; 
              ans = n1 * n2;
          } else if (op === '÷') {
              // [신규] 나눗셈: 나누어 떨어지게 만들기
              // n2(나누는 수)와 ans(몫)를 먼저 구하고, n1(나눠지는 수)을 역산
              n2 = Math.floor(Math.random() * 9) + 2; // 2~10
              ans = Math.floor(Math.random() * (level * 2)) + 2; // 몫
              n1 = n2 * ans;
          }

          this.state.currentQ = { n1, n2, op, ans };
          this.ui.qText.innerText = `${n1} ${op} ${n2} = ?`;

          // 보기 생성
          let answers = new Set([ans]);
          while(answers.size < 4) {
              // 정답 근처의 오답 생성
              let offset = Math.floor(Math.random() * 10) - 5; // -5 ~ +4
              if (offset === 0) offset = 1;
              let fake = ans + offset;
              if(fake >= 0 && fake !== ans) answers.add(fake);
          }
          
          // 버튼 렌더링
          this.ui.ansGrid.innerHTML = '';
          Array.from(answers).sort(() => Math.random() - 0.5).forEach(val => {
              const btn = document.createElement('button');
              btn.className = 'btn-answer';
              btn.innerText = val;
              btn.onclick = (e) => this.handleAnswer(val, e.target);
              this.ui.ansGrid.appendChild(btn);
          });
      },

      handleAnswer: function(val, btn) {
          if(!this.state.isPlaying) return;

          if(val === this.state.currentQ.ans) {
              // 정답
              Sound.playCorrect();
              btn.classList.add('correct');
              
              this.state.combo++;
              // 콤보 보너스 강화
              const baseScore = 100;
              const bonus = (this.state.combo - 1) * 30;
              const totalAdd = baseScore + bonus;
              this.state.score += totalAdd;
              
              // 레벨업 (점수 기준 완화)
              if(this.state.score > this.state.level * 800) this.state.level++;

              this.showFloatingText(btn, `+${totalAdd}`);
              this.createConfetti(btn);

              setTimeout(() => this.nextQuestion(), 200);
          } else {
              // 오답
              Sound.playWrong();
              btn.classList.add('wrong');
              this.state.combo = 0;
              this.state.timeLeft = Math.max(0, this.state.timeLeft - 5);
              this.ui.timer.style.width = `${(this.state.timeLeft/60)*100}%`;
              
              btn.disabled = true;
              btn.style.opacity = 0.5;
          }
          this.updateUI();
      },

      updateUI: function() {
          this.ui.level.innerText = this.state.level;
          this.ui.score.innerText = this.state.score;
          
          if(this.state.combo > 1) {
              this.ui.combo.innerText = `${this.state.combo} COMBO!`;
              this.ui.combo.classList.add('active');
          } else {
              this.ui.combo.classList.remove('active');
          }
      },

      showFloatingText: function(target, text) {
          const el = document.createElement('div');
          el.className = 'float-score';
          el.innerText = text;
          const rect = target.getBoundingClientRect();
          const frameRect = document.querySelector('.game-frame').getBoundingClientRect();
          
          el.style.left = (rect.left - frameRect.left + rect.width/2 - 20) + 'px';
          el.style.top = (rect.top - frameRect.top) + 'px';
          
          this.ui.fx.appendChild(el);
          setTimeout(() => el.remove(), 800);
      },

      createConfetti: function(target) {
          const rect = target.getBoundingClientRect();
          const frameRect = document.querySelector('.game-frame').getBoundingClientRect();
          const x = rect.left - frameRect.left + rect.width/2;
          const y = rect.top - frameRect.top + rect.height/2;

          for(let i=0; i<10; i++) {
              const p = document.createElement('div');
              p.style.position = 'absolute';
              p.style.width = '8px'; p.style.height = '8px';
              p.style.background = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71'][Math.floor(Math.random()*4)];
              p.style.left = x + 'px'; p.style.top = y + 'px';
              p.style.transition = 'all 0.5s ease-out';
              
              this.ui.fx.appendChild(p);
              
              setTimeout(() => {
                  const angle = Math.random() * Math.PI * 2;
                  const dist = 50 + Math.random() * 50;
                  p.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(0)`;
                  p.style.opacity = 0;
              }, 10);
              
              setTimeout(() => p.remove(), 500);
          }
      },

      gameOver: function() {
          this.state.isPlaying = false;
          clearInterval(this.timerId);
          Sound.playWin(); 
          this.showModal('end');
      },

      showModal: function(type) {
          this.ui.modal.classList.add('active');
          if(type === 'start') {
              this.ui.mTitle.innerText = "MATH MASTER";
              this.ui.mDesc.innerText = "제한 시간 60초! 4가지 연산을 마스터하세요.";
              this.ui.mBtn.innerText = "START";
          } else {
              this.ui.mTitle.innerText = "GAME OVER";
              this.ui.mDesc.innerHTML = `최종 점수: <strong style="color:#f1c40f">${this.state.score}</strong><br>도달 레벨: ${this.state.level}`;
              this.ui.mBtn.innerText = "RETRY";
          }
      },
      
      reset: function() {
          this.showModal('start');
      }
  };

  if (typeof window !== 'undefined') window.Game = Game;
})();