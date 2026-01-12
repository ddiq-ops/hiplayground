(function() {
    'use strict';

    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t) {
            const fullKey = `gameDetails.word-pop.ui.${key}`;
            const value = I18n.t(fullKey, defaultValue);
            if (value === fullKey || value === defaultValue) {
                return defaultValue;
            }
            return value;
        }
        return defaultValue;
    }

    // ================= WORD DATA =================
    const WORDS = [
        { en: 'Apple', ko: '사과', icon: '🍎' }, { en: 'Banana', ko: '바나나', icon: '🍌' },
        { en: 'Cat', ko: '고양이', icon: '🐱' }, { en: 'Dog', ko: '강아지', icon: '🐶' },
        { en: 'Egg', ko: '달걀', icon: '🥚' }, { en: 'Fish', ko: '물고기', icon: '🐟' },
        { en: 'Grape', ko: '포도', icon: '🍇' }, { en: 'Hat', ko: '모자', icon: '🧢' },
        { en: 'Ice', ko: '얼음', icon: '🧊' }, { en: 'Juice', ko: '주스', icon: '🧃' },
        { en: 'Kite', ko: '연', icon: '🪁' }, { en: 'Lion', ko: '사자', icon: '🦁' },
        { en: 'Moon', ko: '달', icon: '🌙' }, { en: 'Nose', ko: '코', icon: '👃' },
        { en: 'Octopus', ko: '문어', icon: '🐙' }, { en: 'Pig', ko: '돼지', icon: '🐷' },
        { en: 'Queen', ko: '여왕', icon: '👸' }, { en: 'Robot', ko: '로봇', icon: '🤖' },
        { en: 'Sun', ko: '태양', icon: '☀️' }, { en: 'Tree', ko: '나무', icon: '🌳' },
        { en: 'Umbrella', ko: '우산', icon: '☂️' }, { en: 'Violin', ko: '바이올린', icon: '🎻' },
        { en: 'Watch', ko: '시계', icon: '⌚' }, { en: 'Xylophone', ko: '실로폰', icon: '🎹' },
        { en: 'Yacht', ko: '요트', icon: '🛥️' }, { en: 'Zebra', ko: '얼룩말', icon: '🦓' },
        { en: 'Book', ko: '책', icon: '📚' }, { en: 'Car', ko: '자동차', icon: '🚗' },
        { en: 'Desk', ko: '책상', icon: '🪑' }, { en: 'Eye', ko: '눈', icon: '👁️' }
    ];

    // ================= STAGE DATA (20 Stages) =================
    // spawnRate 수정: 기존보다 2배 더 많이 나오게 숫자 대폭 감소 (작을수록 빠름, 60프레임 기준)
    const STAGES = [];
    
    // 1-3: 쉬움 (입문) - spawnRate 35 -> 18
    for(let i=1; i<=3; i++) STAGES.push({ goalScore: 2000 + (i*500), spawnRate: 18, speedMin: 1.5, speedMax: 2.5, bombRatio: 0.05 });
    
    // 4-8: 보통 - spawnRate 25 -> 12
    for(let i=4; i<=8; i++) STAGES.push({ goalScore: 4000 + (i*800), spawnRate: 12, speedMin: 2.0, speedMax: 3.5, bombRatio: 0.1 });
    
    // 9-12: 어려움 - spawnRate 15 -> 8
    for(let i=9; i<=12; i++) STAGES.push({ goalScore: 12000 + (i*1000), spawnRate: 8, speedMin: 3.0, speedMax: 5.0, bombRatio: 0.15 });
    
    // 13-18: 매우 어려움 - spawnRate 10 -> 5
    for(let i=13; i<=18; i++) STAGES.push({ goalScore: 25000 + (i*2000), spawnRate: 5, speedMin: 4.0, speedMax: 6.0, bombRatio: 0.2 });
    
    // 19-20: 극악 - spawnRate 6 -> 3 (거의 매 프레임 생성)
    for(let i=19; i<=20; i++) STAGES.push({ goalScore: 80000, spawnRate: 3, speedMin: 5.0, speedMax: 8.0, bombRatio: 0.25 });


    // ================= SOUND ENGINE =================
    const Sound = {
        ctx: null,
        init: function() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        },
        play: function(type) {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = this.ctx.currentTime;
            
            if (type === 'pop') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400 + Math.random()*200, t);
                osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.1);
                osc.start(t); osc.stop(t + 0.1);
            } else if (type === 'wrong') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.linearRampToValueAtTime(100, t + 0.3);
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.3);
                osc.start(t); osc.stop(t + 0.3);
            } else if (type === 'bomb') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(100, t);
                osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
                gain.gain.setValueAtTime(0.5, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.4);
                osc.start(t); osc.stop(t + 0.4);
            } else if (type === 'fever') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.linearRampToValueAtTime(800, t + 0.5);
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.5);
                osc.start(t); osc.stop(t + 0.5);
            } else if (type === 'levelup') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, t); 
                osc.frequency.setValueAtTime(659, t + 0.1); 
                osc.frequency.setValueAtTime(784, t + 0.2); 
                osc.frequency.setValueAtTime(1046, t + 0.3); 
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.6);
                osc.start(t); osc.stop(t + 0.6);
            } else if (type === 'wordclear') { 
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.2);
                osc.start(t); osc.stop(t + 0.2);
            }
            osc.connect(gain); gain.connect(this.ctx.destination);
        }
    };

    // ================= GAME ENGINE =================
    const Game = {
        canvas: null, ctx: null,
        width: 0, height: 0,
        loopId: null,
        
        state: {
            screen: 'start', 
            score: 0,
            highScore: 0,
            lives: 5,
            level: 1, 
            stageScore: 0,
            target: null,
            targetHitCount: 0,
            bubbles: [],
            particles: [],
            texts: [],
            fever: 0,
            isFeverMode: false,
            feverTimer: 0,
            spawnTimer: 0,
            invincibleTimer: 0 // 무적 시간 타이머 (프레임 단위)
        },

        init: function(container) {
            this.container = container;
            Sound.init();
            this.renderLayout();
            this.resize();
            window.addEventListener('resize', () => this.resize());
            
            const savedScore = localStorage.getItem('wordpop_highscore');
            this.state.highScore = savedScore ? parseInt(savedScore) : 0;
            this.updateHighScoreDisplay();

            if (this.loopId) cancelAnimationFrame(this.loopId);
            this.loop();
            
            // Listen for language changes
            document.addEventListener('i18n:loaded', () => {
                if (this.container) {
                    const startModal = document.getElementById('ui-start');
                    const gameOverModal = document.getElementById('ui-gameover');
                    if (startModal && startModal.classList.contains('active')) {
                        const titleEl = startModal.querySelector('h1');
                        const subtitleEl = startModal.querySelector('h1 span');
                        const descEl = startModal.querySelector('p');
                        const bestScoreEl = startModal.querySelector('p:last-of-type');
                        const buttonEl = document.getElementById('btn-start');
                        if (titleEl) titleEl.innerHTML = `${getUIText('modal.start.title', 'WORD POP')}<br><span style="font-size:1rem; color:#e91e63">${getUIText('modal.start.subtitle', 'EXTREME')}</span>`;
                        if (descEl) descEl.innerHTML = getUIText('modal.start.desc', '정답을 놓치면 목숨이 깎입니다!<br>피버 모드일 때는 괜찮아요.<br>쏟아지는 단어를 막아내세요.');
                        if (bestScoreEl) bestScoreEl.innerHTML = `${getUIText('bestScore', 'BEST SCORE')}: <span id="modal-best">${this.state.highScore || 0}</span>`;
                        if (buttonEl) buttonEl.innerText = getUIText('modal.start.button', 'GAME START');
                    }
                    if (gameOverModal && gameOverModal.classList.contains('active')) {
                        const titleEl = gameOverModal.querySelector('h1');
                        const scoreEl = document.getElementById('ui-final-score');
                        const bestEl = gameOverModal.querySelector('p:last-of-type');
                        const buttonEl = document.getElementById('btn-restart');
                        if (titleEl) titleEl.innerText = getUIText('modal.gameOver.title', 'GAME OVER');
                        if (scoreEl) scoreEl.innerText = `${getUIText('score', 'SCORE')}: ${this.state.score}`;
                        if (bestEl) bestEl.innerHTML = `${getUIText('best', 'BEST')}: <span id="end-best">${this.state.highScore || 0}</span>`;
                        if (buttonEl) buttonEl.innerText = getUIText('modal.gameOver.button', 'TRY AGAIN');
                    }
                    this.updateUI();
                }
            });
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="wp-wrapper" id="wp-wrapper">
                    <div class="wp-hud-top">
                        <div class="wp-score-box">
                            <div class="wp-score-label">SCORE / BEST: <span id="ui-best">0</span></div>
                            <div class="wp-score-val" id="ui-score">0</div>
                        </div>
                        <div class="wp-lives">
                            <span style="font-size:0.8rem; display:block; text-align:right;">LV.<span id="ui-level-num">1</span></span>
                            <span id="ui-lives">❤️❤️❤️❤️❤️</span>
                        </div>
                    </div>
                    
                    <div style="position:absolute; top:70px; left:15px; right:15px; height:10px; background:rgba(0,0,0,0.2); border-radius:5px; z-index:5; border:1px solid rgba(255,255,255,0.5);">
                        <div id="ui-stage-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #4CAF50, #8BC34A); border-radius:5px; transition:width 0.2s linear;"></div>
                        <div id="ui-stage-text" style="position:absolute; top:-20px; right:0; font-size:0.8rem; color:#fff; font-weight:bold; text-shadow:0 1px 2px rgba(0,0,0,0.5);">${getUIText('goal', 'GOAL')}: 0</div>
                    </div>

                    <div class="wp-target-box">
                        <div class="wp-target-emoji" id="ui-emoji">❔</div>
                        <div class="wp-target-hint" id="ui-hint">Ready?</div>
                    </div>

                    <div class="wp-fever-container">
                        <div class="wp-fever-bar" id="ui-fever-bar"></div>
                    </div>
                    <div class="wp-fever-text" id="ui-fever-text">FEVER!!</div>

                    <div id="ui-damage-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:red; opacity:0; pointer-events:none; z-index:90; transition:opacity 0.1s;"></div>

                    <canvas id="game-canvas"></canvas>

                    <div class="wp-modal active" id="ui-start">
                        <div class="wp-modal-content">
                            <h1>${getUIText('modal.start.title', 'WORD POP')}<br><span style="font-size:1rem; color:#e91e63">${getUIText('modal.start.subtitle', 'EXTREME')}</span></h1>
                            <p style="margin:20px 0; color:#555;">
                                ${getUIText('modal.start.desc', '정답을 놓치면 목숨이 깎입니다!<br>피버 모드일 때는 괜찮아요.<br>쏟아지는 단어를 막아내세요.')}
                            </p>
                            <p style="font-size:0.9rem; color:#777;">${getUIText('bestScore', 'BEST SCORE')}: <span id="modal-best">0</span></p>
                            <button class="wp-btn" id="btn-start">${getUIText('modal.start.button', 'GAME START')}</button>
                        </div>
                    </div>

                    <div class="wp-modal" id="ui-gameover">
                        <div class="wp-modal-content">
                            <h1 style="color:#e91e63">${getUIText('modal.gameOver.title', 'GAME OVER')}</h1>
                            <p id="ui-final-score" style="font-size:1.5rem; font-weight:bold; margin:20px;">${getUIText('score', 'SCORE')}: 0</p>
                            <p style="color:#777;">${getUIText('best', 'BEST')}: <span id="end-best">0</span></p>
                            <button class="wp-btn" id="btn-restart">${getUIText('modal.gameOver.button', 'TRY AGAIN')}</button>
                        </div>
                    </div>
                </div>
            `;

            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            document.getElementById('btn-start').onclick = () => this.startGame();
            document.getElementById('btn-restart').onclick = () => this.startGame();

            const handleInput = (e) => {
                if (this.state.screen !== 'playing') return;
                e.preventDefault();
                const touches = e.changedTouches || [e];
                for (let i = 0; i < touches.length; i++) {
                    const t = touches[i];
                    const rect = this.canvas.getBoundingClientRect();
                    const x = t.clientX - rect.left;
                    const y = t.clientY - rect.top;
                    this.checkHit(x, y);
                }
            };

            this.canvas.addEventListener('mousedown', handleInput);
            this.canvas.addEventListener('touchstart', handleInput, { passive: false });
        },

        resize: function() {
            if (!this.container) return;
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        },

        updateHighScoreDisplay: function() {
            const els = ['ui-best', 'modal-best', 'end-best'];
            els.forEach(id => {
                const el = document.getElementById(id);
                if(el) el.innerText = this.state.highScore;
            });
        },

        startGame: function() {
            ['ui-start', 'ui-gameover'].forEach(id => document.getElementById(id).classList.remove('active'));
            if (Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume();

            this.state.screen = 'playing';
            this.state.score = 0;
            this.state.lives = 5;
            this.state.level = 1;
            this.state.stageScore = 0;
            this.state.bubbles = [];
            this.state.particles = [];
            this.state.texts = [];
            this.state.fever = 0;
            this.state.isFeverMode = false;
            this.state.invincibleTimer = 0;
            
            this.setNewTarget();
            this.updateUI();
        },

        setNewTarget: function() {
            const nextWord = WORDS[Math.floor(Math.random() * WORDS.length)];
            this.state.target = nextWord;
            this.state.targetHitCount = 0;

            document.getElementById('ui-emoji').innerText = nextWord.icon;
            document.getElementById('ui-hint').innerText = nextWord.ko;
            
            const emojiEl = document.getElementById('ui-emoji');
            emojiEl.style.animation = 'none';
            emojiEl.offsetHeight; 
            emojiEl.style.animation = 'bounce 0.5s';
        },

        checkWordClear: function() {
            if (this.state.targetHitCount >= 5) {
                this.state.bubbles.forEach((b, i) => {
                    this.spawnParticles(b.x, b.y, b.color, 5);
                    this.addFloatingText(b.x, b.y, "+10", "#fff", 15);
                    this.state.score += 10;
                    this.state.stageScore += 10;
                });
                this.state.bubbles = []; 
                
                Sound.play('wordclear');
                this.addFloatingText(this.width/2, this.height/2, getUIText('wordClear', 'WORD CLEAR!'), "#81d4fa", 30);
                
                this.setNewTarget();
            }
        },

        spawnBubble: function() {
            const st = this.state;
            const stageIdx = Math.min(st.level - 1, STAGES.length - 1);
            const stageData = STAGES[stageIdx];

            let rate = st.isFeverMode ? 3 : stageData.spawnRate; // 피버땐 극도로 빠름
            
            if (st.spawnTimer++ < rate) return;
            st.spawnTimer = 0;

            const radius = 35 + Math.random() * 15;
            const x = Math.random() * (this.width - radius * 2) + radius;
            const y = this.height + radius;
            
            let type = 'normal';
            let word = '';
            let color = '#fff';
            let speed = stageData.speedMin + Math.random() * (stageData.speedMax - stageData.speedMin);
            const rand = Math.random();

            if (st.isFeverMode) {
                 if (rand < 0.8) {
                    type = 'target';
                    word = st.target.en;
                    color = '#81d4fa';
                 } else {
                    type = 'bonus';
                    word = 'FEVER';
                    color = '#ffeb3b';
                 }
                 speed *= 2.5; 
            } else {
                if (rand < stageData.bombRatio) {
                    type = 'bomb';
                    word = '💣';
                    color = '#212121';
                } else if (rand < 0.45) { 
                    type = 'target';
                    word = st.target.en;
                    color = '#e1f5fe';
                } else {
                    let wrong = WORDS[Math.floor(Math.random() * WORDS.length)];
                    while (wrong.en === st.target.en) {
                        wrong = WORDS[Math.floor(Math.random() * WORDS.length)];
                    }
                    word = wrong.en;
                    color = '#ffffff';
                }
            }

            st.bubbles.push({
                x, y, r: radius,
                text: word,
                type: type,
                color: color,
                vx: (Math.random() - 0.5) * 2,
                vy: -speed,
                life: 1.0
            });
        },

        checkHit: function(x, y) {
            const st = this.state;
            for (let i = st.bubbles.length - 1; i >= 0; i--) {
                const b = st.bubbles[i];
                if (Math.hypot(b.x - x, b.y - y) < b.r + 20) { 
                    if (st.isFeverMode) {
                        this.popBubble(b, i, true);
                    } else {
                        this.popBubble(b, i, false);
                    }
                    return; 
                }
            }
        },

        popBubble: function(b, index, isFeverKill) {
            const st = this.state;
            st.bubbles.splice(index, 1);
            this.spawnParticles(b.x, b.y, b.color, 12);

            if (isFeverKill) {
                Sound.play('pop');
                const score = 200; 
                st.score += score;
                st.stageScore += score;
                this.addFloatingText(b.x, b.y, `+${score}`, '#ffeb3b', 30);
                this.updateUI();
                return;
            }

            if (b.text === st.target.en) {
                Sound.play('pop');
                st.score += 100;
                st.stageScore += 100;
                this.addFloatingText(b.x, b.y, '+100', '#4CAF50');
                
                st.targetHitCount++;
                this.checkWordClear();
                
                st.fever += 25; 
                if (st.fever >= 100) this.startFever();

            } else if (b.type === 'bomb') {
                if (st.invincibleTimer > 0) return; // 무적이면 폭탄도 무시 (터지긴 함)
                
                Sound.play('bomb');
                st.lives--;
                this.addFloatingText(b.x, b.y, '-1 ❤️', '#f44336', 30);
                this.screenShake();
                this.triggerInvincible(); // 폭탄 맞아도 무적 발동
                if (st.lives <= 0) this.gameOver();

            } else { 
                if (b.text !== '💣') { 
                    if (b.type === 'target') { 
                         Sound.play('pop');
                         st.score += 30; 
                         st.stageScore += 30;
                         this.addFloatingText(b.x, b.y, 'Lucky!', '#81d4fa');
                    } else if (b.type === 'bonus') {
                        Sound.play('pop');
                        st.score += 50;
                        st.stageScore += 50;
                        this.addFloatingText(b.x, b.y, 'BONUS', '#ffeb3b');
                    } else { 
                        if (st.invincibleTimer > 0) return; // 무적이면 오답 무시

                        Sound.play('wrong');
                        st.lives--;
                        this.addFloatingText(b.x, b.y, getUIText('miss', 'MISS'), '#9e9e9e');
                        this.triggerInvincible(); // 오답 눌러도 무적 발동 (실수 연발 방지)
                        if (st.lives <= 0) this.gameOver();
                    }
                }
            }

            this.updateUI();
        },

        // 데미지 입었을 때 무적 발동
        triggerInvincible: function() {
            this.state.invincibleTimer = 120; // 2초 (60fps)
            const overlay = document.getElementById('ui-damage-overlay');
            if(overlay) {
                overlay.style.opacity = 0.3;
                setTimeout(() => overlay.style.opacity = 0, 100);
            }
        },

        startFever: function() {
            const st = this.state;
            st.isFeverMode = true;
            st.fever = 100;
            st.feverTimer = 300; 
            document.getElementById('wp-wrapper').classList.add('fever-mode');
            Sound.play('fever');
            this.addFloatingText(this.width/2, this.height/2, getUIText('feverTime', 'FEVER TIME!!'), "#fff", 50);
            
            st.bubbles.forEach(b => {
                if(b.type === 'bomb') { b.type = 'bonus'; b.text = 'LUCKY'; b.color = '#ffeb3b'; }
            });
        },

        endFever: function() {
            this.state.isFeverMode = false;
            this.state.fever = 0;
            document.getElementById('wp-wrapper').classList.remove('fever-mode');
        },

        nextLevel: function() {
            if (this.state.level >= STAGES.length) return; 

            this.state.level++;
            this.state.lives++; 
            this.state.stageScore = 0; 
            
            Sound.play('levelup');
            this.addFloatingText(this.width/2, this.height/2 - 50, getUIText('stageClear', 'STAGE CLEAR!'), "#fff", 40);
            this.addFloatingText(this.width/2, this.height/2 + 50, getUIText('nextLevel', 'NEXT LEVEL (+1 ❤️)'), "#e91e63", 30);
            
            this.state.bubbles = [];
            this.setNewTarget();
            this.updateUI();
        },

        spawnParticles: function(x, y, color, count) {
            for(let i=0; i<count; i++) {
                this.state.particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    life: 1.0,
                    color: color,
                    size: Math.random() * 6 + 3
                });
            }
        },

        addFloatingText: function(x, y, text, color, size = 20) {
            this.state.texts.push({ x, y, text, color, size, life: 1.0, vy: -2 });
        },

        screenShake: function() {
            this.container.style.transform = `translate(${Math.random()*10-5}px, ${Math.random()*10-5}px)`;
            setTimeout(() => this.container.style.transform = 'none', 200);
        },

        updateUI: function() {
            const st = this.state;
            const stageIdx = Math.min(st.level - 1, STAGES.length - 1);
            const goal = STAGES[stageIdx].goalScore;
            
            document.getElementById('ui-score').innerText = st.score;
            document.getElementById('ui-lives').innerText = '❤️'.repeat(Math.max(0, st.lives));
            document.getElementById('ui-fever-bar').style.height = `${st.fever}%`;
            document.getElementById('ui-level-num').innerText = st.level;

            const pct = Math.min(100, (st.stageScore / goal) * 100);
            const bar = document.getElementById('ui-stage-bar');
            if(bar) bar.style.width = `${pct}%`;
            
            const goalText = document.getElementById('ui-stage-text');
            if(goalText) goalText.innerText = `${getUIText('goal', 'GOAL')}: ${st.stageScore}/${goal}`;
        },

        gameOver: function() {
            this.state.screen = 'gameover';
            
            if (this.state.score > this.state.highScore) {
                this.state.highScore = this.state.score;
                localStorage.setItem('wordpop_highscore', this.state.score);
            }
            this.updateHighScoreDisplay();

            const scoreText = getUIText('score', 'SCORE');
            document.getElementById('ui-final-score').innerText = `${scoreText}: ${this.state.score}`;
            document.getElementById('ui-gameover').classList.add('active');
            this.endFever();
        },

        loop: function() {
            this.loopId = requestAnimationFrame(() => this.loop());
            if (this.state.screen !== 'playing') return;

            const ctx = this.ctx;
            const st = this.state;
            const stageIdx = Math.min(st.level - 1, STAGES.length - 1);
            const goal = STAGES[stageIdx].goalScore;

            ctx.clearRect(0, 0, this.width, this.height);

            // 무적 상태 깜빡임
            if (st.invincibleTimer > 0) {
                st.invincibleTimer--;
                if (Math.floor(Date.now() / 100) % 2 === 0) {
                    ctx.globalAlpha = 0.5; // 깜빡임 효과
                }
            }

            if (st.stageScore >= goal) {
                this.nextLevel();
            }

            this.spawnBubble();

            if (st.isFeverMode) {
                st.feverTimer--;
                st.fever = (st.feverTimer / 300) * 100;
                if (st.feverTimer <= 0) this.endFever();
                this.updateUI();
            } else {
                if (st.fever > 0) {
                    st.fever -= 0.15;
                    this.updateUI();
                }
            }

            for (let i = st.bubbles.length - 1; i >= 0; i--) {
                const b = st.bubbles[i];
                b.y += b.vy; b.x += b.vx;

                // 화면 위로 벗어남
                if (b.y < -50) {
                    // [중요] 정답을 놓치면 목숨 차감 (피버 아닐 때, 무적 아닐 때)
                    if (b.text === st.target.en && !st.isFeverMode) {
                        if (st.invincibleTimer <= 0) {
                            Sound.play('wrong');
                            st.lives--;
                            this.addFloatingText(b.x, 80, getUIText('miss', 'MISS!'), "#f44336", 30);
                            this.screenShake();
                            this.triggerInvincible(); // 놓쳐도 무적 발동
                            this.updateUI();
                            if (st.lives <= 0) this.gameOver();
                        }
                    }

                    st.bubbles.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.translate(b.x, b.y);
                
                if (st.isFeverMode) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = b.color;
                }

                ctx.beginPath();
                ctx.arc(0, 0, b.r, 0, Math.PI * 2);
                ctx.fillStyle = b.color;
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(-b.r*0.3, -b.r*0.3, b.r*0.2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.fill();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.fillStyle = (b.type === 'bomb' || b.color === '#212121') ? '#fff' : '#333';
                ctx.font = `bold ${b.r * 0.5}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(b.text, 0, 0);

                ctx.restore();
            }
            ctx.globalAlpha = 1.0; // 알파 리셋

            for (let i = st.particles.length - 1; i >= 0; i--) {
                const p = st.particles[i];
                p.x += p.vx; p.y += p.vy; p.life -= 0.03;
                if (p.life <= 0) { st.particles.splice(i, 1); continue; }
                
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            for (let i = st.texts.length - 1; i >= 0; i--) {
                const t = st.texts[i];
                t.y += t.vy; t.life -= 0.02;
                if (t.life <= 0) { st.texts.splice(i, 1); continue; }
                
                ctx.save();
                ctx.globalAlpha = t.life;
                ctx.fillStyle = t.color;
                ctx.font = `bold ${t.size}px Arial`;
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.strokeText(t.text, t.x, t.y);
                ctx.fillText(t.text, t.x, t.y);
                ctx.restore();
            }
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();