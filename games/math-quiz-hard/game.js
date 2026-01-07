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
            this.playTone(800, 'sine', 0.1); 
            setTimeout(() => this.playTone(1200, 'sine', 0.2), 100); 
        },
        playWrong: function() { this.playTone(150, 'sawtooth', 0.4); },
        playWin: function() {
            [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.2), i * 100));
        }
    };

    // ================= GAME LOGIC (고학년용) =================
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
                <div class="math-h-wrapper">
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
                                <div class="modal-title" id="m-title">MENTAL MATH</div>
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
                else this.ui.timer.style.background = 'linear-gradient(90deg, #3498db, #9b59b6, #e74c3c)';

                if(this.state.timeLeft <= 0) this.gameOver();
            }, 100);
        },

        // [핵심] 고학년용 문제 출제 로직
        nextQuestion: function() {
            if(!this.state.isPlaying) return;

            const lv = this.state.level;
            let qStr = "";
            let ans = 0;

            // Lv 1: 두 자리 수 덧셈/뺄셈 (큰 수 암산)
            if (lv === 1) {
                const n1 = Math.floor(Math.random() * 80) + 10; // 10~89
                const n2 = Math.floor(Math.random() * 80) + 10;
                if (Math.random() > 0.5) {
                    qStr = `${n1} + ${n2}`;
                    ans = n1 + n2;
                } else {
                    const big = Math.max(n1, n2);
                    const small = Math.min(n1, n2);
                    qStr = `${big} - ${small}`;
                    ans = big - small;
                }
            } 
            // Lv 2: 곱셈 혼합 (A + B x C) -> 곱셈 먼저!
            else if (lv === 2) {
                const n1 = Math.floor(Math.random() * 20) + 1;
                const n2 = Math.floor(Math.random() * 8) + 2;
                const n3 = Math.floor(Math.random() * 8) + 2;
                
                if (Math.random() > 0.5) {
                    qStr = `${n1} + ${n2} × ${n3}`;
                    ans = n1 + (n2 * n3);
                } else {
                    const temp = n2 * n3; 
                    const start = temp + Math.floor(Math.random() * 20) + 5; // 결과가 양수 나오도록
                    qStr = `${start} - ${n2} × ${n3}`;
                    ans = start - (n2 * n3);
                }
            }
            // Lv 3: 나눗셈 혼합 (A - B / C) -> 나눗셈 먼저!
            else if (lv === 3) {
                const n3 = Math.floor(Math.random() * 8) + 2; // 나누는 수
                const quotient = Math.floor(Math.random() * 9) + 2; // 몫
                const n2 = n3 * quotient; // 나눠지는 수 (딱 떨어짐)
                const n1 = Math.floor(Math.random() * 50) + 10;

                if (Math.random() > 0.5) {
                    qStr = `${n1} + ${n2} ÷ ${n3}`;
                    ans = n1 + quotient;
                } else {
                    // 뺄셈 시 음수 방지
                    const start = Math.max(n1, quotient + Math.floor(Math.random()*10));
                    qStr = `${start} - ${n2} ÷ ${n3}`;
                    ans = start - quotient;
                }
            }
            // Lv 4+: 세 자리 수 or 복합
            else {
                const mode = Math.floor(Math.random() * 3);
                if (mode === 0) { // 세 자리 덧셈
                    const n1 = Math.floor(Math.random() * 400) + 100;
                    const n2 = Math.floor(Math.random() * 400) + 100;
                    qStr = `${n1} + ${n2}`;
                    ans = n1 + n2;
                } else if (mode === 1) { // 괄호 없는 3연산 (A + B - C)
                    const n1 = Math.floor(Math.random() * 50) + 20;
                    const n2 = Math.floor(Math.random() * 30) + 10;
                    const n3 = Math.floor(Math.random() * 20) + 5;
                    qStr = `${n1} + ${n2} - ${n3}`;
                    ans = n1 + n2 - n3;
                } else { // 곱셈 섞기
                    const n1 = Math.floor(Math.random() * 10) + 2;
                    const n2 = Math.floor(Math.random() * 10) + 2;
                    const n3 = Math.floor(Math.random() * 10) + 2;
                    qStr = `${n1} × ${n2} - ${n3}`;
                    ans = n1 * n2 - n3;
                }
            }

            this.state.currentQ = { ans };
            this.ui.qText.innerText = `${qStr} = ?`;

            // 보기 생성
            let answers = new Set([ans]);
            while(answers.size < 4) {
                let offset = Math.floor(Math.random() * 20) - 10; 
                if (offset === 0) offset = 1;
                let fake = ans + offset;
                if(fake >= 0 && fake !== ans) answers.add(fake); // 음수 보기 제외
            }
            
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
                Sound.playCorrect();
                btn.classList.add('correct');
                this.state.combo++;
                const bonus = (this.state.combo - 1) * 50;
                const totalAdd = 200 + bonus;
                this.state.score += totalAdd;
                
                if(this.state.score > this.state.level * 1500) this.state.level++;
                this.showFloatingText(btn, `+${totalAdd}`);
                this.createConfetti(btn);
                setTimeout(() => this.nextQuestion(), 200);
            } else {
                Sound.playWrong();
                btn.classList.add('wrong');
                this.state.combo = 0;
                this.state.timeLeft = Math.max(0, this.state.timeLeft - 5);
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
                p.style.background = ['#3498db', '#9b59b6', '#e74c3c', '#f1c40f'][Math.floor(Math.random()*4)];
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
                this.ui.mTitle.innerText = "암산 천재";
                this.ui.mDesc.innerText = "고학년 도전! 곱셈과 나눗셈 순서에 주의하세요.";
                this.ui.mBtn.innerText = "도전 시작";
            } else {
                this.ui.mTitle.innerText = "GAME OVER";
                this.ui.mDesc.innerHTML = `최종 점수: <strong style="color:#3498db">${this.state.score}</strong><br>도달 레벨: ${this.state.level}`;
                this.ui.mBtn.innerText = "다시 도전";
            }
        },
        reset: function() { this.showModal('start'); }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();