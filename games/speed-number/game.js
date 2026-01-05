(function() {
    'use strict';

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
        playTap: function(pitch) { // 피치가 올라가는 효과
            this.playTone(400 + (pitch * 50), 'sine', 0.1); 
        },
        playWrong: function() { this.playTone(150, 'sawtooth', 0.3); },
        playClear: function() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.1), i * 80)); }
    };

    // ================= CONFIGURATION =================
    const DIFFICULTY_CONFIG = {
        easy: { label: 'EASY', timeBonus: 10, hint: true },
        normal: { label: 'NORMAL', timeBonus: 5, hint: false },
        hard: { label: 'HARD', timeBonus: 0, hint: false }
    };

    // 난이도 상승 곡선 (총 12단계)
    const LEVEL_DATA = [
        { stage: 1, count: 9, time: 5.0, cols: 3 },    // 3x3
        { stage: 2, count: 16, time: 8.0, cols: 4 },   // 4x4
        { stage: 3, count: 20, time: 10.0, cols: 4 },  // 4x5
        { stage: 4, count: 25, time: 15.0, cols: 5 },  // 5x5
        { stage: 5, count: 25, time: 12.0, cols: 5 },  // Speed Up
        { stage: 6, count: 30, time: 18.0, cols: 5 },  // 5x6
        { stage: 7, count: 35, time: 20.0, cols: 5 },  // 5x7
        { stage: 8, count: 36, time: 20.0, cols: 6 },  // 6x6
        { stage: 9, count: 40, time: 25.0, cols: 5 },  // 5x8 (Dense)
        { stage: 10, count: 42, time: 30.0, cols: 6 }, // 6x7
        { stage: 11, count: 48, time: 35.0, cols: 6 }, // 6x8
        { stage: 12, count: 50, time: 35.0, cols: 5 }  // 5x10 (Extreme)
    ];

    const Game = {
        state: {
            currentStageIdx: 0,
            lives: 3,
            score: 0,
            combo: 0,
            difficulty: 'normal',
            currentNum: 1,
            maxNum: 0,
            timeLeft: 0,
            isActive: false,
            timerId: null
        },
        elements: {}, callbacks: {},

        init: function(container, options = {}) {
            this.elements.container = container;
            this.callbacks = options;
            Sound.init();
            this.createUI();
            this.showDifficultySelect();
        },

        createUI: function() {
            this.elements.container.innerHTML = `
                <div class="sn-wrapper">
                    <header class="sn-header">
                        <div class="sn-status-row">
                            <div><span id="sn-stage">STAGE 1</span> <span style="font-size:0.8rem; color:#f1c40f" id="sn-diff"></span></div>
                            <span id="sn-lives" class="sn-lives">❤️❤️❤️</span>
                        </div>
                        <div class="sn-game-row">
                            <div class="sn-info-box"><span class="sn-label">FIND</span><span class="sn-value highlight" id="sn-target">1</span></div>
                            <div class="sn-info-box"><span class="sn-label">TIME</span><span class="sn-value timer" id="sn-timer">00.00</span></div>
                        </div>
                        <div class="sn-combo-bar"><div class="sn-combo-fill" id="sn-combo-fill"></div></div>
                    </header>
                    <div class="sn-grid" id="sn-grid"></div>
                    <div id="fx-layer"></div>
                    
                    <div class="sn-overlay active" id="sn-overlay">
                        <div class="sn-msg-title" id="msg-title"></div>
                        <div class="sn-msg-sub" id="msg-sub"></div>
                        <div class="sn-btn-group" id="btn-container"></div>
                    </div>
                </div>
            `;
            const q = (sel) => this.elements.container.querySelector(sel);
            this.el = {
                stage: q('#sn-stage'), diff: q('#sn-diff'), lives: q('#sn-lives'),
                target: q('#sn-target'), timer: q('#sn-timer'), comboFill: q('#sn-combo-fill'),
                grid: q('#sn-grid'), overlay: q('#sn-overlay'), title: q('#msg-title'),
                sub: q('#msg-sub'), btnContainer: q('#btn-container'), fx: q('#fx-layer')
            };
        },

        showDifficultySelect: function() {
            this.el.title.innerText = "SPEED NUMBER";
            this.el.sub.innerText = "OVERCLOCK EDITION";
            this.el.overlay.className = 'sn-overlay active';
            this.el.btnContainer.innerHTML = `
                <button class="sn-btn btn-easy" data-diff="easy">EASY (힌트/여유)</button>
                <button class="sn-btn btn-normal" data-diff="normal">NORMAL (표준)</button>
                <button class="sn-btn btn-hard" data-diff="hard">HARD (극한 도전)</button>
            `;
            this.el.btnContainer.querySelectorAll('button').forEach(btn => {
                btn.onclick = () => this.startGameFull(btn.dataset.diff);
            });
        },

        startGameFull: function(difficulty) {
            this.state.difficulty = difficulty;
            this.state.lives = 3;
            this.state.score = 0;
            this.state.combo = 0;
            this.state.currentStageIdx = 0;
            this.el.diff.innerText = difficulty.toUpperCase();
            this.prepareLevel();
        },

        prepareLevel: function() {
            const config = LEVEL_DATA[this.state.currentStageIdx];
            const diffConfig = DIFFICULTY_CONFIG[this.state.difficulty];
            const totalTime = config.time + diffConfig.timeBonus;

            this.state.isActive = false;
            this.state.currentNum = 1;
            this.state.maxNum = config.count;
            this.state.timeLeft = totalTime;
            this.state.combo = 0;
            
            this.el.grid.innerHTML = ''; 
            this.el.target.innerText = '1';
            this.el.timer.classList.remove('danger');
            this.updateComboBar(0);
            this.updateHeaderUI();

            this.el.title.innerText = `STAGE ${config.stage}`;
            this.el.sub.innerHTML = `목표: 1 ~ ${config.count}<br>제한시간: <span style="color:#f1c40f">${totalTime}초</span>`;
            this.el.overlay.className = 'sn-overlay active';
            this.el.btnContainer.innerHTML = `<button class="sn-btn btn-action">START</button>`;
            this.el.btnContainer.querySelector('button').onclick = () => this.startGameplay();
        },

        startGameplay: function() {
            this.el.overlay.classList.remove('active');
            const config = LEVEL_DATA[this.state.currentStageIdx];
            this.el.grid.style.setProperty('--cols', config.cols);
            this.renderGrid(config.count);
            this.state.isActive = true;
            this.startTimer();
        },

        renderGrid: function(count) {
            this.el.grid.innerHTML = '';
            const nums = Array.from({length: count}, (_, i) => i + 1);
            this.shuffle(nums);
            
            nums.forEach(n => {
                const card = document.createElement('div');
                card.className = 'sn-card';
                card.innerText = n;
                
                // EASY 모드 힌트 (다음 숫자 강조)
                if (this.state.difficulty === 'easy' && n === 1) {
                    card.classList.add('hint-active');
                }

                // Pointer events for faster reaction than click
                card.onpointerdown = (e) => { 
                    e.preventDefault(); 
                    this.handleTap(n, card, e.clientX, e.clientY); 
                };
                this.el.grid.appendChild(card);
            });
        },

        handleTap: function(num, card, x, y) {
            if(!this.state.isActive) return;

            if (num === this.state.currentNum) {
                // Correct
                card.classList.add('correct');
                this.state.currentNum++;
                this.state.combo++;
                
                // Sound & Pitch
                Sound.playTap(this.state.combo % 10);

                // Score
                const baseScore = 100;
                const comboBonus = this.state.combo * 20;
                const addScore = baseScore + comboBonus;
                this.state.score += addScore;
                
                // Visuals
                this.showFloatingText(x, y, `+${addScore}`);
                if(this.state.combo > 5) this.showFloatingText(x, y - 30, `${this.state.combo} COMBO!`);

                // Update Hint for Easy Mode
                if (this.state.difficulty === 'easy' && this.state.currentNum <= this.state.maxNum) {
                    const nextCards = Array.from(this.el.grid.children);
                    nextCards.forEach(c => {
                        if(parseInt(c.innerText) === this.state.currentNum) c.classList.add('hint-active');
                    });
                }

                if (this.state.currentNum > this.state.maxNum) this.levelClear();
                else this.el.target.innerText = this.state.currentNum;

                this.updateComboBar(100); // 콤보 게이지 리셋 느낌 (추후 감퇴 구현 가능)

            } else {
                // Wrong
                card.classList.add('wrong');
                setTimeout(() => card.classList.remove('wrong'), 300);
                Sound.playWrong();
                
                this.state.combo = 0; // 콤보 초기화
                this.state.score = Math.max(0, this.state.score - 500);
                this.state.timeLeft = Math.max(0, this.state.timeLeft - 2.0); // 시간 페널티
                this.showFloatingText(x, y, "-2 SEC", "#ff4757");
                
                this.updateComboBar(0);
            }
            this.updateScore();
        },

        startTimer: function() {
            if(this.state.timerId) cancelAnimationFrame(this.state.timerId);
            let lastTime = performance.now();
            
            const loop = (now) => {
                if(!this.state.isActive) return;
                const delta = (now - lastTime) / 1000;
                lastTime = now;
                
                this.state.timeLeft -= delta;
                
                // 5초 이하 경고
                if (this.state.timeLeft <= 5.0) this.el.timer.classList.add('danger');
                
                if (this.state.timeLeft <= 0) {
                    this.state.timeLeft = 0;
                    this.el.timer.innerText = "0.00";
                    this.levelFail("TIME OVER");
                } else {
                    this.el.timer.innerText = this.state.timeLeft.toFixed(2);
                    this.state.timerId = requestAnimationFrame(loop);
                }
            };
            this.state.timerId = requestAnimationFrame(loop);
        },

        levelClear: function() {
            this.state.isActive = false;
            cancelAnimationFrame(this.state.timerId);
            Sound.playClear();
            
            const timeBonus = Math.floor(this.state.timeLeft * 500);
            this.state.score += timeBonus;
            this.updateScore();

            if (this.state.currentStageIdx >= LEVEL_DATA.length - 1) {
                this.gameClear();
            } else {
                this.state.currentStageIdx++;
                this.showResultOverlay("STAGE CLEAR", `Time Bonus: +${timeBonus}`, "NEXT STAGE", () => this.prepareLevel());
            }
        },

        levelFail: function(reason) {
            this.state.isActive = false;
            cancelAnimationFrame(this.state.timerId);
            Sound.playWrong();
            this.state.lives--;
            this.updateHeaderUI();

            if (this.state.lives > 0) {
                this.showResultOverlay("FAILED", reason, "RETRY", () => this.prepareLevel());
            } else {
                this.showResultOverlay("GAME OVER", `Final Score: ${this.state.score}`, "MAIN MENU", () => this.showDifficultySelect());
            }
        },

        gameClear: function() {
            this.showResultOverlay("ALL CLEAR!", `LEGENDARY SCORE: ${this.state.score}`, "MAIN MENU", () => this.showDifficultySelect());
        },

        showResultOverlay: function(title, sub, btnText, action) {
            this.el.title.innerText = title;
            this.el.sub.innerText = sub;
            this.el.btnContainer.innerHTML = `<button class="sn-btn btn-action">${btnText}</button>`;
            this.el.overlay.className = 'sn-overlay active';
            this.el.btnContainer.querySelector('button').onclick = action;
        },

        showFloatingText: function(x, y, text, color = null) {
            const el = document.createElement('div');
            el.className = 'float-score';
            el.innerText = text;
            if(color) el.style.color = color;
            
            // 좌표 보정 (컨테이너 기준)
            const rect = this.elements.container.getBoundingClientRect();
            el.style.left = (x - rect.left) + 'px';
            el.style.top = (y - rect.top) + 'px';
            
            this.el.fx.appendChild(el);
            setTimeout(() => el.remove(), 600);
        },

        updateComboBar: function(percent) {
            this.el.comboFill.style.width = `${percent}%`;
        },
        updateHeaderUI: function() {
            this.el.lives.innerText = '❤️'.repeat(Math.max(0, this.state.lives));
        },
        updateScore: function() {
            if(this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.state.score);
        },
        shuffle: function(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();