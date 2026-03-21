(function() {
    'use strict';

    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t && I18n.translations && Object.keys(I18n.translations).length > 0) {
            const fullKey = `gameDetails.pizza-snake.ui.${key}`;
            const value = I18n.t(fullKey, defaultValue);
            if (value === fullKey || value === defaultValue) {
                return defaultValue;
            }
            return value;
        }
        return defaultValue;
    }

    const COLS = 20;
    const ROWS = 20;
    const INITIAL_SPEED = 150;
    
    const Game = {
        canvas: null, ctx: null,
        
        state: {
            snake: [],      // 뱀 몸통 좌표 [{x,y}, ...]
            dir: {x:0, y:0}, // 현재 이동 방향
            nextDir: {x:0, y:0}, // 입력 버퍼 (빠른 입력 오류 방지)
            food: null,     // 피자 좌표
            score: 0,
            highScore: 0,
            speed: INITIAL_SPEED,
            isPlaying: false,
            loopId: null
        },

        init: function(container) {
            this.container = container;
            this.renderLayout();
            
            this.canvas = document.getElementById('ps-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            // 캔버스 내부 해상도 고정 (도트 그래픽 선명도 유지)
            this.canvas.width = COLS * 20;
            this.canvas.height = ROWS * 20;
            
            this.bindInput();
            
            // 저장된 최고 점수 로드
            const saved = localStorage.getItem('pizza-snake-hiscore');
            if(saved) this.state.highScore = parseInt(saved);
            this.updateScoreUI();
            
            // Listen for language changes
            document.addEventListener('i18n:loaded', () => {
                this.updateUI();
            });
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="ps-wrapper">
                    <div class="ps-header">
                        <div class="ps-score-box">
                            <span class="ps-label" id="ps-label-score">${getUIText('labels.score', 'SCORE')}</span>
                            <span class="ps-val" id="ps-score">0</span>
                        </div>
                        <div class="ps-score-box" style="text-align:right;">
                            <span class="ps-label" id="ps-label-high">${getUIText('labels.high', 'HIGH')}</span>
                            <span class="ps-val" id="ps-hiscore">0</span>
                        </div>
                    </div>
                    <div class="ps-board">
                        <canvas id="ps-canvas"></canvas>
                        <div class="ps-overlay" id="ps-overlay">
                            <div class="ps-title" id="ps-title">${getUIText('title', 'PIZZA<br>SNAKE')}</div>
                            <div class="ps-msg" id="ps-msg">${getUIText('pressStart', 'PRESS START')}</div>
                            <button class="ps-btn" id="ps-btn-start" onclick="Game.reset()">${getUIText('buttons.start', 'START')}</button>
                        </div>
                    </div>
                    <div class="ps-hint" id="ps-hint">${getUIText('hint', 'PC: Arrow Keys / Mobile: Swipe')}</div>
                </div>
            `;
        },

        bindInput: function() {
            // 키보드 이벤트
            window.addEventListener('keydown', e => {
                if(!this.state.isPlaying) return;
                
                // 방향키 기본 스크롤 방지
                if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();

                switch(e.key) {
                    case 'ArrowUp':    if(this.state.dir.y === 0) this.state.nextDir = {x:0, y:-1}; break;
                    case 'ArrowDown':  if(this.state.dir.y === 0) this.state.nextDir = {x:0, y:1}; break;
                    case 'ArrowLeft':  if(this.state.dir.x === 0) this.state.nextDir = {x:-1, y:0}; break;
                    case 'ArrowRight': if(this.state.dir.x === 0) this.state.nextDir = {x:1, y:0}; break;
                }
            });

            // 터치 스와이프 이벤트
            let touchStartX = 0;
            let touchStartY = 0;
            const board = document.querySelector('.ps-board');

            board.addEventListener('touchstart', e => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            }, {passive: false});

            board.addEventListener('touchmove', e => e.preventDefault(), {passive: false}); // 스크롤 방지

            board.addEventListener('touchend', e => {
                if(!this.state.isPlaying) return;
                const touchEndX = e.changedTouches[0].screenX;
                const touchEndY = e.changedTouches[0].screenY;
                
                const dx = touchEndX - touchStartX;
                const dy = touchEndY - touchStartY;

                if(Math.abs(dx) > Math.abs(dy)) {
                    // 가로 이동
                    if(Math.abs(dx) > 30) { 
                        if(dx > 0 && this.state.dir.x === 0) this.state.nextDir = {x:1, y:0};
                        else if(dx < 0 && this.state.dir.x === 0) this.state.nextDir = {x:-1, y:0};
                    }
                } else {
                    // 세로 이동
                    if(Math.abs(dy) > 30) {
                        if(dy > 0 && this.state.dir.y === 0) this.state.nextDir = {x:0, y:1};
                        else if(dy < 0 && this.state.dir.y === 0) this.state.nextDir = {x:0, y:-1};
                    }
                }
            });
        },

        reset: function() {
            const overlay = document.getElementById('ps-overlay');
            const msg = document.getElementById('ps-msg');
            if(overlay) overlay.classList.add('hidden');
            if(msg) msg.textContent = getUIText('pressStart', 'PRESS START');
            
            const startX = Math.floor(COLS/2);
            const startY = Math.floor(ROWS/2);

            this.state.snake = [
                {x: startX, y: startY},
                {x: startX, y: startY+1},
                {x: startX, y: startY+2}
            ];
            this.state.dir = {x:0, y:-1}; // 시작 방향 (위)
            this.state.nextDir = {x:0, y:-1};
            this.state.score = 0;
            this.state.speed = INITIAL_SPEED;
            this.state.isPlaying = true;
            
            this.spawnFood();
            this.updateScoreUI();
            
            if(this.state.loopId) clearTimeout(this.state.loopId);
            this.loop();
        },

        spawnFood: function() {
            let valid = false;
            let pos = {x:0, y:0};
            
            // 뱀 몸통 위에 사과가 생기지 않도록 체크
            while(!valid) {
                pos.x = Math.floor(Math.random() * COLS);
                pos.y = Math.floor(Math.random() * ROWS);
                valid = !this.state.snake.some(s => s.x === pos.x && s.y === pos.y);
            }
            this.state.food = pos;
        },

        update: function() {
            if(!this.state.isPlaying) return;

            // 방향 적용
            this.state.dir = this.state.nextDir;

            const head = this.state.snake[0];
            const newHead = {
                x: head.x + this.state.dir.x,
                y: head.y + this.state.dir.y
            };

            // 1. 벽 충돌 (게임 오버)
            if(newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
                this.gameOver();
                return;
            }

            // 2. 자기 자신 충돌 (게임 오버)
            if(this.state.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
                this.gameOver();
                return;
            }

            this.state.snake.unshift(newHead); // 머리 늘리기

            // 3. 먹이 먹음
            if(newHead.x === this.state.food.x && newHead.y === this.state.food.y) {
                this.state.score += 10;
                this.state.speed = Math.max(50, this.state.speed - 2); // 점점 빨라짐 (최대 속도 제한)
                this.updateScoreUI();
                this.spawnFood();
                // 꼬리 자르지 않음 (길어짐)
            } else {
                this.state.snake.pop(); // 먹이 안 먹었으면 꼬리 이동
            }
        },

        draw: function() {
            // 배경
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 격자 그리기 (레트로 느낌)
            this.ctx.strokeStyle = '#1a1a1a';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            for(let x=0; x<=this.canvas.width; x+=20) { this.ctx.moveTo(x,0); this.ctx.lineTo(x, this.canvas.height); }
            for(let y=0; y<=this.canvas.height; y+=20) { this.ctx.moveTo(0,y); this.ctx.lineTo(this.canvas.width, y); }
            this.ctx.stroke();

            // 먹이 (피자 이모지)
            if(this.state.food) {
                const fx = this.state.food.x * 20;
                const fy = this.state.food.y * 20;
                this.ctx.font = '18px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🍕', fx + 10, fy + 11);
            }

            // 뱀 그리기
            this.ctx.fillStyle = '#0f0';
            this.state.snake.forEach((s, i) => {
                const sx = s.x * 20;
                const sy = s.y * 20;
                
                if(i === 0) {
                    // 머리
                    this.ctx.fillStyle = '#4caf50'; // 약간 밝은 초록
                    this.ctx.fillRect(sx, sy, 20, 20);
                    // 눈
                    this.ctx.fillStyle = 'black';
                    this.ctx.fillRect(sx+4, sy+4, 4, 4);
                    this.ctx.fillRect(sx+12, sy+4, 4, 4);
                    this.ctx.fillStyle = '#0f0'; // 다시 몸통색
                } else {
                    // 몸통 (약간 작게 그려서 마디 느낌)
                    this.ctx.fillRect(sx+1, sy+1, 18, 18);
                }
            });
        },

        loop: function() {
            this.update();
            this.draw();
            
            if(this.state.isPlaying) {
                this.state.loopId = setTimeout(() => {
                    requestAnimationFrame(() => this.loop());
                }, this.state.speed);
            }
        },

        gameOver: function() {
            this.state.isPlaying = false;
            
            if(this.state.score > this.state.highScore) {
                this.state.highScore = this.state.score;
                localStorage.setItem('pizza-snake-hiscore', this.state.highScore);
            }

            const gameOverText = getUIText('gameOver', 'GAME OVER');
            const scoreText = getUIText('labels.score', 'SCORE');
            document.getElementById('ps-msg').innerHTML = `${gameOverText}<br>${scoreText}: ${this.state.score}`;
            document.getElementById('ps-overlay').classList.remove('hidden');
            this.updateScoreUI();
        },

        updateUI: function() {
            // Update UI text when language changes
            const scoreLabel = document.getElementById('ps-label-score');
            const highLabel = document.getElementById('ps-label-high');
            const title = document.getElementById('ps-title');
            const hint = document.getElementById('ps-hint');
            const btnStart = document.getElementById('ps-btn-start');
            
            if(scoreLabel) scoreLabel.textContent = getUIText('labels.score', 'SCORE');
            if(highLabel) highLabel.textContent = getUIText('labels.high', 'HIGH');
            if(title) title.innerHTML = getUIText('title', 'PIZZA<br>SNAKE');
            if(hint) hint.textContent = getUIText('hint', 'PC: Arrow Keys / Mobile: Swipe');
            if(btnStart) btnStart.textContent = getUIText('buttons.start', 'START');
            
            // Update message if game is not playing
            const msg = document.getElementById('ps-msg');
            if(msg && !this.state.isPlaying) {
                msg.textContent = getUIText('pressStart', 'PRESS START');
            }
        },

        updateScoreUI: function() {
            document.getElementById('ps-score').innerText = this.state.score;
            document.getElementById('ps-hiscore').innerText = this.state.highScore;
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();