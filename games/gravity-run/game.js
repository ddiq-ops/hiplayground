(function() {
    'use strict';

    // ================= SOUND ENGINE =================
    const Sound = {
        ctx: null, isMuted: false,
        init: function() { 
            window.AudioContext = window.AudioContext || window.webkitAudioContext; 
            this.ctx = new AudioContext(); 
        },
        playTone: function(freq, type, duration, vol=0.1) {
            if (this.isMuted || !this.ctx) return;
            const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
            osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + duration);
        },
        playJump: function() { this.playTone(150, 'sawtooth', 0.1, 0.2); setTimeout(()=>this.playTone(600, 'sine', 0.15, 0.1), 50); },
        playCrash: function() { this.playTone(100, 'square', 0.4, 0.3); setTimeout(()=>this.playTone(50, 'sawtooth', 0.4, 0.3), 100); },
        playScore: function() { this.playTone(1200, 'sine', 0.05, 0.05); },
        playWin: function() { 
            [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => {
                setTimeout(() => this.playTone(f, 'square', 0.3, 0.1), i * 150);
            });
        }
    };

    // ================= GAME ENGINE =================
    const Game = {
        container: null,
        state: {
            isPlaying: false, score: 0, level: 1,
            gravity: 1, playerY: 0, obstacles: [], 
            gameSpeed: 0, distance: 0, isDead: false
        },
        config: {
            playerSize: 50,
            contentHeight: 588, 
            floorY: 588 - 50, 
            ceilY: 0,         
            gravitySpeed: 35, // 중력 속도도 더 빠르게
            baseSpeed: 10,     // 기본 속도 상향 (9 -> 10)
            maxSpeed: 55      // 최대 속도 대폭 상향
        },
        loopId: null,

        init: function(container) {
            this.container = container;
            Sound.init();
            this.container.innerHTML = '';
            this.state.playerY = this.config.floorY;
            this.renderLayout();
            this.showTitleScreen();
            this.updatePlayerPos();
            setTimeout(() => {
                const wrapper = document.querySelector('.gr-wrapper');
                if(wrapper) wrapper.focus();
            }, 100);
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="gr-wrapper" tabindex="0">
                    <div class="game-frame" id="game-frame">
                        <div class="gr-background" id="gr-bg"></div>
                        <div class="gr-ui">
                            <div class="gr-score-group">
                                <div class="gr-score-box" id="gr-score">0</div>
                                <div class="gr-level-box" id="gr-level">Lv.1</div>
                            </div>
                            <button class="btn-sound" id="btn-sound">🔊</button>
                        </div>
                        <div class="gr-game-area" id="game-area">
                            <div class="gr-player" id="player"></div>
                            <div id="obstacle-container"></div>
                            <div id="fx-container"></div>
                        </div>
                        <div class="gr-overlay active" id="gr-overlay">
                            <div class="gr-title" id="m-title">GRAVITY RUN</div>
                            <div class="gr-desc" id="m-desc">EXTREME MODE<br>더 빠르고 거대한 장애물이 옵니다!</div>
                            <button class="gr-btn" id="m-btn">RUN</button>
                        </div>
                    </div>
                </div>
            `;
            this.el = {
                frame: document.getElementById('game-frame'),
                bg: document.getElementById('gr-bg'),
                score: document.getElementById('gr-score'),
                level: document.getElementById('gr-level'),
                player: document.getElementById('player'),
                obsContainer: document.getElementById('obstacle-container'),
                fxContainer: document.getElementById('fx-container'),
                overlay: document.getElementById('gr-overlay'),
                mTitle: document.getElementById('m-title'),
                mDesc: document.getElementById('m-desc'),
                mBtn: document.getElementById('m-btn'),
                btnSound: document.getElementById('btn-sound')
            };
            const inputAction = (e) => {
                if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp' && e.code !== 'ArrowDown') return;
                if (e.target.tagName === 'BUTTON') return;
                e.preventDefault();
                if (this.state.isPlaying) this.flipGravity();
                else if (this.el.overlay.classList.contains('active') && !this.state.isDead) this.startGame();
            };
            window.addEventListener('keydown', inputAction);
            this.el.frame.addEventListener('pointerdown', inputAction);
            this.el.mBtn.onclick = (e) => { e.stopPropagation(); this.startGame(); };
            this.el.btnSound.onclick = (e) => { e.stopPropagation(); Sound.isMuted = !Sound.isMuted; this.el.btnSound.innerText = Sound.isMuted ? "🔇" : "🔊"; this.el.btnSound.blur(); };
        },

        showTitleScreen: function() {
            this.el.mTitle.innerText = "GRAVITY RUN";
            this.el.mDesc.innerHTML = "EXTREME MODE<br>더 빠르고 거대한 장애물이 옵니다!";
            this.el.mBtn.innerText = "RUN";
            this.el.overlay.classList.add('active');
            this.state.isDead = false;
        },

        startGame: function() {
            this.el.overlay.classList.remove('active');
            this.state = {
                isPlaying: true, score: 0, level: 1,
                gravity: 1, playerY: this.config.floorY, 
                obstacles: [], gameSpeed: this.config.baseSpeed,
                distance: 0, isDead: false
            };
            this.el.obsContainer.innerHTML = '';
            this.el.fxContainer.innerHTML = '';
            this.el.score.innerText = "0";
            this.el.level.innerText = "Lv.1";
            this.el.player.style.display = 'block';
            this.el.player.style.transform = 'rotate(0deg)';
            this.updatePlayerPos();
            if (this.loopId) cancelAnimationFrame(this.loopId);
            this.loopId = requestAnimationFrame(() => this.gameLoop());
        },

        flipGravity: function() {
            if (this.state.isDead || !this.state.isPlaying) return;
            this.state.gravity *= -1;
            Sound.playJump();
            this.el.player.style.transform = `rotate(${this.state.gravity === 1 ? 0 : 180}deg)`;
            this.spawnParticles(150, this.state.playerY + 25, '#00d2d3');
        },

        spawnObstacle: function() {
            const rand = Math.random();
            let type = 'bottom';
            if (rand < 0.45) type = 'top'; // 확률 조정
            else if (rand < 0.9) type = 'bottom';
            else type = 'middle'; 

            const obs = document.createElement('div');
            obs.className = `gr-obstacle ${type}`;
            
            // [수정 1] 높이: 최소 80 ~ 최대 화면의 55%까지 (약 320px)
            // 화면 절반을 넘어가면 피하기 정말 어려워짐
            const maxH = this.config.contentHeight * 0.55; 
            let h = 80 + Math.random() * (maxH - 80);
            
            // [수정 2] 너비(굵기): 30px ~ 100px 랜덤
            let w = 30 + Math.random() * 70;

            let startY = 0;
            if (type === 'middle') {
                h = 50 + Math.random() * 40; // 중간 장애물은 너무 크지 않게
                startY = (this.config.contentHeight / 2) - (h / 2);
            } else if (type === 'top') {
                startY = 0;
            } else {
                startY = this.config.contentHeight - h;
            }

            obs.style.height = `${h}px`;
            obs.style.width = `${w}px`; // 굵기 적용
            obs.style.top = `${startY}px`;
            obs.style.left = '900px'; 
            
            this.el.obsContainer.appendChild(obs);
            this.state.obstacles.push({ el: obs, x: 900, y: startY, w: w, h: h, type: type, passed: false });
        },

        spawnParticles: function(x, y, color) {
            for(let i=0; i<10; i++) {
                const p = document.createElement('div');
                p.className = 'gr-particle';
                p.style.backgroundColor = color;
                p.style.left = x + 'px';
                p.style.top = y + 'px';
                this.el.fxContainer.appendChild(p);
                const angle = Math.random() * Math.PI * 2;
                const speed = 3 + Math.random() * 6;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                let life = 1.0;
                const pLoop = () => {
                    if(life <= 0) { p.remove(); return; }
                    life -= 0.05;
                    p.style.left = (parseFloat(p.style.left) + vx) + 'px';
                    p.style.top = (parseFloat(p.style.top) + vy) + 'px';
                    p.style.opacity = life;
                    requestAnimationFrame(pLoop);
                };
                requestAnimationFrame(pLoop);
            }
        },

        gameLoop: function() {
            if (!this.state.isPlaying) return;

            // 1. 이동
            const targetY = this.state.gravity === 1 ? this.config.floorY : this.config.ceilY;
            const diff = targetY - this.state.playerY;
            if (Math.abs(diff) > this.config.gravitySpeed) this.state.playerY += Math.sign(diff) * this.config.gravitySpeed;
            else this.state.playerY = targetY;
            this.updatePlayerPos();

            // 2. [수정 3] 속도 공식 (4레벨마다 가속, 더 빠르게)
            // Lv1=10, Lv5=12.2, Lv9=14.4 ... Lv25=23 ... Lv100=50+
            const speedBoost = Math.floor(this.state.level / 4) * 2.2;
            this.state.gameSpeed = Math.min(this.config.maxSpeed, this.config.baseSpeed + speedBoost);
            this.el.bg.style.animationDuration = `${1 / (this.state.gameSpeed/5)}s`;

            // 3. 스폰 (장애물 굵기 고려하여 간격 조정)
            this.state.distance += this.state.gameSpeed;
            // 장애물이 두꺼워졌으므로 간격을 더 띄워야 불가능한 패턴이 안 나옴
            const spawnDist = Math.max(350, 300 + (this.state.gameSpeed * 11)); 
            if (this.state.distance > spawnDist) {
                this.spawnObstacle();
                this.state.distance = 0;
            }

            // 4. 충돌 체크
            const pBox = { x: 150 + 10, y: this.state.playerY + 10, w: this.config.playerSize - 20, h: this.config.playerSize - 20 };
            for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
                const obs = this.state.obstacles[i];
                obs.x -= this.state.gameSpeed;
                obs.el.style.left = `${obs.x}px`;

                if (pBox.x < obs.x + obs.w && pBox.x + pBox.w > obs.x && pBox.y < obs.y + obs.h && pBox.y + pBox.h > obs.y) {
                    this.gameOver();
                    return;
                }
                if (!obs.passed && obs.x + obs.w < pBox.x) {
                    obs.passed = true;
                    this.state.score += 100;
                    this.el.score.innerText = this.state.score;
                    Sound.playScore();
                    // 점수 1000점마다 레벨업
                    if (this.state.score % 1000 === 0) {
                        this.state.level++;
                        this.el.level.innerText = `Lv.${this.state.level}`;
                        if (this.state.level >= 100) { this.gameClear(); return; }
                    }
                }
                if (obs.x < -150) { obs.el.remove(); this.state.obstacles.splice(i, 1); }
            }

            this.loopId = requestAnimationFrame(() => this.gameLoop());
        },

        updatePlayerPos: function() { this.el.player.style.top = `${this.state.playerY}px`; },

        gameOver: function() {
            this.state.isPlaying = false;
            this.state.isDead = true;
            cancelAnimationFrame(this.loopId);
            Sound.playCrash();
            this.spawnParticles(150, this.state.playerY + 25, '#ff4757');
            this.el.player.style.display = 'none';
            setTimeout(() => {
                this.el.mTitle.innerText = "CRASHED!";
                this.el.mTitle.style.color = "#ff4757";
                this.el.mDesc.innerHTML = `SCORE: <strong style="color:#00d2d3">${this.state.score}</strong> (Lv.${this.state.level})`;
                this.el.mBtn.innerText = "RETRY";
                this.el.overlay.classList.add('active');
                this.el.player.style.display = 'block';
            }, 1000);
        },

        gameClear: function() {
            this.state.isPlaying = false;
            cancelAnimationFrame(this.loopId);
            Sound.playWin();
            let firework = setInterval(() => {
                const x = Math.random() * 900; const y = Math.random() * 600;
                this.spawnParticles(x, y, '#f1c40f'); this.spawnParticles(x, y, '#00d2d3');
            }, 200);
            setTimeout(() => {
                clearInterval(firework);
                this.el.mTitle.innerText = "MISSION COMPLETE!";
                this.el.mTitle.style.color = "#f1c40f";
                this.el.mDesc.innerHTML = `LEGENDARY SCORE: ${this.state.score}<br>MAX LEVEL 100 REACHED!`;
                this.el.mBtn.innerText = "PLAY AGAIN";
                this.el.overlay.classList.add('active');
            }, 2000);
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();