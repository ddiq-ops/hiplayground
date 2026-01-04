(function() {
    'use strict';

    // ================= CONFIGURATION =================
    // 난이도별 설정
    const DIFFICULTY_CONFIG = {
        easy: { label: 'EASY', timeBonus: 5, scoreMult: 0.8, colorHint: true },
        normal: { label: 'NORMAL', timeBonus: 3, scoreMult: 1.0, colorHint: false },
        hard: { label: 'HARD', timeBonus: 0, scoreMult: 1.5, colorHint: false }
    };

    // 스테이지 설정
    const LEVEL_DATA = [
        { stage: 1, count: 10, time: 10.0, cols: 5 },
        { stage: 2, count: 15, time: 12.0, cols: 5 },
        { stage: 3, count: 20, time: 15.0, cols: 5 },
        { stage: 4, count: 25, time: 18.0, cols: 5 },
        { stage: 5, count: 25, time: 15.0, cols: 5 },
        { stage: 6, count: 30, time: 20.0, cols: 5 },
        { stage: 7, count: 35, time: 20.0, cols: 5 },
        { stage: 8, count: 40, time: 25.0, cols: 5 },
        { stage: 9, count: 50, time: 35.0, cols: 5 },
        { stage: 10, count: 50, time: 25.0, cols: 5 }
    ];

    const Game = {
        state: {
            currentStageIdx: 0,
            lives: 3,
            score: 0,
            difficulty: 'normal', // easy, normal, hard
            
            // Level State
            currentNum: 1,
            maxNum: 0,
            initialTime: 0,
            timeLeft: 0,
            isActive: false,
            timerId: null
        },

        elements: {},
        callbacks: {},

        // ================= INIT =================
        init: function(container, options = {}) {
            this.elements.container = container;
            this.callbacks = options;
            this.createUI();
            this.showDifficultySelect(); // 시작 시 난이도 선택 화면
        },

        createUI: function() {
            this.elements.container.innerHTML = `
                <div class="sn-wrapper">
                    <header class="sn-header">
                        <div class="sn-status-row">
                            <div>
                                <span id="sn-stage">STAGE 1</span>
                                <span id="sn-mode" class="sn-mode-badge">NORMAL</span>
                            </div>
                            <span id="sn-lives" class="sn-lives">❤️❤️❤️</span>
                        </div>
                        <div class="sn-game-row">
                            <div class="sn-info-box">
                                <span class="sn-label">FIND</span>
                                <span class="sn-value highlight" id="sn-target">1</span>
                            </div>
                            <div class="sn-info-box">
                                <span class="sn-label">TIME</span>
                                <span class="sn-value timer" id="sn-timer">00.00</span>
                            </div>
                        </div>
                        <div class="sn-timer-bar-bg">
                            <div class="sn-timer-bar-fill" id="sn-timer-fill"></div>
                        </div>
                    </header>
                    
                    <div class="sn-grid" id="sn-grid"></div>

                    <div class="sn-overlay active" id="sn-overlay">
                        <div class="sn-msg-title" id="msg-title"></div>
                        <div class="sn-msg-sub" id="msg-sub"></div>
                        <div class="sn-btn-group" id="btn-container"></div>
                    </div>
                </div>
            `;

            // Cache Elements
            const q = (sel) => this.elements.container.querySelector(sel);
            this.el = {
                stage: q('#sn-stage'),
                mode: q('#sn-mode'),
                lives: q('#sn-lives'),
                target: q('#sn-target'),
                timer: q('#sn-timer'),
                timerFill: q('#sn-timer-fill'),
                grid: q('#sn-grid'),
                overlay: q('#sn-overlay'),
                title: q('#msg-title'),
                sub: q('#msg-sub'),
                btnContainer: q('#btn-container')
            };
        },

        // ================= FLOW CONTROL =================
        
        // 1. 난이도 선택 화면
        showDifficultySelect: function() {
            this.hideOverlay();
            
            // HTML 직접 주입
            this.el.title.textContent = "SPEED NUMBER";
            this.el.title.style.color = "#2d3436";
            this.el.sub.textContent = "난이도를 선택하세요";
            this.el.sub.style.color = "#636e72";
            this.el.overlay.className = 'sn-overlay active'; // Light mode
            
            this.el.btnContainer.innerHTML = `
                <button class="sn-btn btn-easy" data-diff="easy">EASY (시간+5초, 색상힌트)</button>
                <button class="sn-btn btn-normal" data-diff="normal">NORMAL (시간+3초)</button>
                <button class="sn-btn btn-hard" data-diff="hard">HARD (보너스 없음, 고득점)</button>
            `;

            // 버튼 이벤트 연결
            this.el.btnContainer.querySelectorAll('button').forEach(btn => {
                btn.onclick = () => this.startGameFull(btn.dataset.diff);
            });
        },

        // 2. 게임 전체 초기화 (난이도 선택 후)
        startGameFull: function(difficulty) {
            this.state.difficulty = difficulty;
            this.state.lives = 3;
            this.state.score = 0;
            this.state.currentStageIdx = 0;
            
            this.updateHeaderUI();
            this.prepareLevel(); // 1스테이지 준비
        },

        // 리셋 버튼 대응
        reset: function() {
            if(confirm('난이도 선택 화면으로 돌아갑니다.')) {
                this.showDifficultySelect();
            }
        },

        // 3. 레벨 준비 (Start 버튼 표시)
        prepareLevel: function() {
            const config = LEVEL_DATA[this.state.currentStageIdx];
            const diffConfig = DIFFICULTY_CONFIG[this.state.difficulty];
            
            // 난이도별 시간 계산
            const totalTime = config.time + diffConfig.timeBonus;

            // 상태 초기화
            this.state.isActive = false;
            this.state.currentNum = 1;
            this.state.maxNum = config.count;
            this.state.timeLeft = totalTime;
            this.state.initialTime = totalTime;
            
            this.el.grid.innerHTML = ''; 
            this.el.target.textContent = '1';
            this.el.timer.classList.remove('danger');
            this.updateTimerBar(100);

            // Start Overlay
            this.el.title.textContent = `STAGE ${config.stage}`;
            this.el.title.style.color = "#2d3436";
            this.el.sub.innerHTML = `제한시간: ${totalTime}초<br>찾아야 할 숫자: ${config.count}개`;
            this.el.sub.style.color = "#636e72";
            this.el.overlay.className = 'sn-overlay active';
            
            this.el.btnContainer.innerHTML = `<button class="sn-btn btn-action">GAME START</button>`;
            this.el.btnContainer.querySelector('button').onclick = () => this.startGameplay();
            
            this.updateHeaderUI();
            if(this.callbacks.onLevelChange) this.callbacks.onLevelChange(config.stage);
        },

        // 4. 실제 플레이 시작
        startGameplay: function() {
            this.hideOverlay();
            
            // 그리드 생성
            const config = LEVEL_DATA[this.state.currentStageIdx];
            this.el.grid.style.setProperty('--cols', config.cols);
            this.renderGrid(config.count);
            
            this.state.isActive = true;
            this.startTimer();
        },

        // ================= LOGIC =================
        renderGrid: function(count) {
            this.el.grid.innerHTML = '';
            const nums = Array.from({length: count}, (_, i) => i + 1);
            this.shuffle(nums);

            const isEasy = this.state.difficulty === 'easy';

            nums.forEach(n => {
                const card = document.createElement('div');
                card.className = 'sn-card';
                card.textContent = n;
                
                // Easy 모드일 때 색상 힌트 클래스 추가 (10단위로 그룹화)
                if (isEasy) {
                    const group = Math.floor((n - 1) / 10);
                    card.classList.add(`hint-${group % 5}`);
                }

                card.onpointerdown = (e) => {
                    e.preventDefault();
                    this.handleTap(n, card);
                };
                this.el.grid.appendChild(card);
            });
        },

        handleTap: function(num, card) {
            if(!this.state.isActive) return;

            if (num === this.state.currentNum) {
                // Correct
                card.classList.add('correct');
                this.state.currentNum++;
                
                // 점수 계산 (기본 100점 * 난이도 배율)
                const mult = DIFFICULTY_CONFIG[this.state.difficulty].scoreMult;
                this.state.score += Math.round(100 * mult);
                this.updateScore();

                if (this.state.currentNum > this.state.maxNum) {
                    this.levelClear();
                } else {
                    this.el.target.textContent = this.state.currentNum;
                }
            } else {
                // Wrong
                card.classList.add('wrong');
                setTimeout(() => card.classList.remove('wrong'), 400);
                this.state.score = Math.max(0, this.state.score - 50);
                this.updateScore();
            }
        },

        startTimer: function() {
            if(this.state.timerId) cancelAnimationFrame(this.state.timerId);
            this.state.lastFrame = performance.now();
            
            const loop = (now) => {
                if(!this.state.isActive) return;
                
                const delta = (now - this.state.lastFrame) / 1000;
                this.state.lastFrame = now;
                this.state.timeLeft -= delta;

                const percentage = (this.state.timeLeft / this.state.initialTime) * 100;
                this.updateTimerBar(percentage);

                if (this.state.timeLeft <= 5.0) this.el.timer.classList.add('danger');
                
                if (this.state.timeLeft <= 0) {
                    this.state.timeLeft = 0;
                    this.el.timer.textContent = "0.00";
                    this.updateTimerBar(0);
                    this.levelFail("Time Over!");
                } else {
                    this.el.timer.textContent = this.state.timeLeft.toFixed(2);
                    this.state.timerId = requestAnimationFrame(loop);
                }
            };
            this.state.timerId = requestAnimationFrame(loop);
        },

        updateTimerBar: function(percent) {
            const p = Math.max(0, Math.min(100, percent));
            this.el.timerFill.style.width = `${p}%`;
            if(p > 50) this.el.timerFill.style.backgroundColor = '#4cd137';
            else if(p > 20) this.el.timerFill.style.backgroundColor = '#fbc531';
            else this.el.timerFill.style.backgroundColor = '#e84118';
        },

        // ================= ENDINGS =================
        levelClear: function() {
            this.state.isActive = false;
            cancelAnimationFrame(this.state.timerId);
            
            // 시간 보너스 계산 (남은 시간 * 100 * 난이도 배율)
            const mult = DIFFICULTY_CONFIG[this.state.difficulty].scoreMult;
            const bonus = Math.round(this.state.timeLeft * 100 * mult);
            this.state.score += bonus;
            this.updateScore();

            if (this.state.currentStageIdx >= LEVEL_DATA.length - 1) {
                this.gameClear();
            } else {
                this.state.currentStageIdx++;
                this.showResultOverlay("STAGE CLEAR!", `보너스: +${bonus}점`, "NEXT STAGE", () => this.prepareLevel());
            }
        },

        levelFail: function(reason) {
            this.state.isActive = false;
            cancelAnimationFrame(this.state.timerId);
            this.state.lives--;
            this.updateHeaderUI();

            if (this.state.lives > 0) {
                this.showResultOverlay("FAILED!", reason, "RETRY STAGE", () => this.prepareLevel());
            } else {
                this.showResultOverlay("GAME OVER", "생명이 모두 소진되었습니다.", "TITLE SCREEN", () => {
                    this.state.isGameOver = true;
                    // 결과창에서 버튼 누르면 타이틀로
                    if(this.callbacks.onGameOver) {
                         this.callbacks.onGameOver({ completed: true, score: this.state.score, win: false });
                    }
                    this.showDifficultySelect();
                });
            }
        },

        gameClear: function() {
            if (this.callbacks.onGameOver) {
                this.callbacks.onGameOver({ completed: true, score: this.state.score, win: true });
            }
            this.showResultOverlay("ALL CLEAR!", `최종 점수: ${this.state.score}`, "PLAY AGAIN", () => this.showDifficultySelect());
        },

        // ================= UTIL & UI Helpers =================
        showResultOverlay: function(title, sub, btnText, action) {
            this.el.title.textContent = title;
            this.el.sub.textContent = sub;
            this.el.btnContainer.innerHTML = `<button class="sn-btn btn-action">${btnText}</button>`;
            
            // 결과창은 어둡게
            this.el.overlay.className = 'sn-overlay active dark-mode';
            this.el.title.style.color = 'white';
            this.el.sub.style.color = '#dfe6e9';

            this.el.btnContainer.querySelector('button').onclick = action;
        },

        hideOverlay: function() {
            this.el.overlay.classList.remove('active');
        },

        updateHeaderUI: function() {
            this.el.stage.textContent = `STAGE ${this.state.currentStageIdx + 1}`;
            this.el.mode.textContent = DIFFICULTY_CONFIG[this.state.difficulty].label;
            this.el.lives.textContent = '❤️'.repeat(Math.max(0, this.state.lives));
        },

        updateScore: function() {
            if(this.callbacks.onScoreUpdate) this.callbacks.onScoreUpdate(this.state.score);
        },

        shuffle: function(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }
    };

    window.Game = Game;
})();