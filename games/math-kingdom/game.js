(function() {
    'use strict';

    // ================= DATA & CONFIG =================
    // 난이도 설정 (문제 수준은 기존 유지)
    const STAGE_CONFIG = [
        // 1-5: 덧셈/뺄셈
        { max: 10, ops: ['+'] }, { max: 20, ops: ['+'] }, { max: 20, ops: ['-'] }, { max: 30, ops: ['+', '-'] }, { max: 50, ops: ['+', '-'], boss: true },
        // 6-10: 구구단
        { max: 5, ops: ['x'] }, { max: 9, ops: ['x'] }, { max: 9, ops: ['x'] }, { max: 50, ops: ['+', '-', 'x'] }, { max: 9, ops: ['x'], boss: true },
        // 11-15: 혼합
        { max: 100, ops: ['+'] }, { max: 100, ops: ['-'] }, { max: 12, ops: ['x'] }, { max: 100, ops: ['+', '-', 'x'] }, { max: 100, ops: ['+', '-', 'x'], boss: true },
        // 16-20: 헬
        { max: 200, ops: ['+'] }, { max: 200, ops: ['-'] }, { max: 15, ops: ['x'] }, { max: 200, ops: ['+', '-', 'x'] }, { max: 200, ops: ['+', '-', 'x'], boss: true }
    ];

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
            
            if (type === 'fire') { // 더 날카로운 발사음
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, t);
                osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
                gain.gain.setValueAtTime(0.4, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.1);
                osc.start(t); osc.stop(t + 0.1);
            } else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, t);
                osc.frequency.linearRampToValueAtTime(50, t + 0.1);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.1);
                osc.start(t); osc.stop(t + 0.1);
            } else if (type === 'magic') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.exponentialRampToValueAtTime(100, t + 1.0);
                gain.gain.setValueAtTime(0.5, t);
                gain.gain.linearRampToValueAtTime(0, t + 1.0);
                osc.start(t); osc.stop(t + 1.0);
            } else if (type === 'damage') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(100, t);
                osc.frequency.linearRampToValueAtTime(50, t + 0.3);
                gain.gain.setValueAtTime(0.5, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.3);
                osc.start(t); osc.stop(t + 0.3);
            } else if (type === 'win') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, t);
                osc.frequency.setValueAtTime(784, t+0.1);
                osc.frequency.setValueAtTime(1046, t+0.2);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0, t+0.5);
                osc.start(t); osc.stop(t+0.5);
            }
            osc.connect(gain); gain.connect(this.ctx.destination);
        }
    };

    // ================= MATH ENGINE =================
    const MathEngine = {
        generate: function(config, targetValue = null) {
            const op = config.ops[Math.floor(Math.random() * config.ops.length)];
            let a, b, q, ans;

            if (targetValue !== null) {
                ans = targetValue;
                if (op === '+') {
                    a = Math.floor(Math.random() * ans);
                    b = ans - a;
                } else if (op === '-') {
                    b = Math.floor(Math.random() * 10) + 1;
                    a = ans + b;
                } else if (op === 'x') {
                    const factors = [];
                    for(let i=1; i<=ans; i++) if(ans % i === 0) factors.push(i);
                    if (factors.length > 0) {
                        a = factors[Math.floor(Math.random() * factors.length)];
                        b = ans / a;
                    } else {
                        return this.generate({max: config.max, ops: ['+']}, ans);
                    }
                }
                q = `${a} ${op} ${b}`;
            } else {
                if (op === '+') {
                    a = Math.floor(Math.random() * config.max) + 1;
                    b = Math.floor(Math.random() * config.max) + 1;
                    ans = a + b;
                } else if (op === '-') {
                    a = Math.floor(Math.random() * config.max) + 2;
                    b = Math.floor(Math.random() * (a - 1)) + 1;
                    ans = a - b;
                } else if (op === 'x') {
                    a = Math.floor(Math.random() * config.max) + 2;
                    b = Math.floor(Math.random() * 9) + 1;
                    ans = a * b;
                }
                q = `${a} ${op} ${b}`;
            }
            return { q, a: ans };
        }
    };

    // ================= GAME ENGINE =================
    const Game = {
        canvas: null, ctx: null,
        width: 0, height: 0,
        loopId: null,
        
        state: {
            screen: 'start',
            level: 1,
            hp: 100, maxHp: 100,
            magic: 0, maxMagic: 100,
            score: 0, highScore: 0,
            monsters: [],
            bullets: [],
            particles: [],
            currentProblem: null,
            spawnTimer: 0,
            isBossActive: false,
            killCount: 0,
            targetKill: 15
        },

        init: function(container) {
            this.container = container;
            Sound.init();
            this.renderLayout();
            this.resize();
            window.addEventListener('resize', () => this.resize());
            
            const saved = localStorage.getItem('mk_highscore');
            this.state.highScore = saved ? parseInt(saved) : 0;
            this.updateUI();
            
            if (this.loopId) cancelAnimationFrame(this.loopId);
            this.loop();
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="mk-wrapper">
                    <div class="mk-game-screen">
                        <div class="mk-hud">
                            <div class="mk-stage-info">
                                <span class="mk-stage-num" id="ui-stage">STAGE 1</span>
                                <span class="mk-boss-badge" id="ui-boss-badge">BOSS</span>
                            </div>
                            <div class="mk-score-box">
                                <div class="mk-score-label">SCORE / BEST: <span id="ui-best">0</span></div>
                                <div class="mk-score-val" id="ui-score">0</div>
                            </div>
                        </div>

                        <div class="mk-castle-area">
                            <div class="mk-castle-img">🏰</div>
                            <div class="mk-cannon-container">
                                <div class="mk-question-bubble" id="ui-question">? + ?</div>
                                <div class="mk-cannon-body" id="ui-cannon">🔫</div>
                            </div>
                        </div>

                        <div class="mk-bottom-ui">
                            <div class="mk-hp-container">
                                <span class="mk-hp-label">CASTLE HP</span>
                                <div class="mk-hp-bar-bg"><div class="mk-hp-fill" id="ui-hp"></div></div>
                            </div>
                            <div class="mk-magic-container">
                                <div class="mk-magic-btn" id="btn-magic">
                                    ⚡
                                    <div class="mk-magic-fill" id="ui-magic-fill"></div>
                                </div>
                                <span style="color:white; font-size:0.8rem; font-weight:bold; margin-top:5px;">MAGIC</span>
                            </div>
                        </div>

                        <div class="mk-damage-overlay" id="ui-damage"></div>
                        <canvas id="game-canvas"></canvas>

                        <div class="mk-modal active" id="ui-start">
                            <div class="mk-modal-content">
                                <h1>MATH KINGDOM</h1>
                                <p>성벽을 지키세요!<br>대포에 적힌 문제의 정답을 가진<br>몬스터를 터치하세요.</p>
                                <button class="mk-btn" id="btn-start">GAME START</button>
                            </div>
                        </div>
                        
                        <div class="mk-modal" id="ui-gameover">
                            <div class="mk-modal-content">
                                <h1 style="color:red">GAME OVER</h1>
                                <p style="font-size:1.5rem; margin:20px;">SCORE: <span id="end-score">0</span></p>
                                <button class="mk-btn" id="btn-restart">RETRY</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            document.getElementById('btn-start').onclick = () => this.startGame();
            document.getElementById('btn-restart').onclick = () => this.startGame();
            document.getElementById('btn-magic').onclick = () => this.useMagic();

            const handleInput = (e) => {
                if (this.state.screen !== 'playing') return;
                e.preventDefault();
                const touches = e.changedTouches || [e];
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;

                for(let i=0; i<touches.length; i++) {
                    const t = touches[i];
                    const x = (t.clientX - rect.left) * scaleX;
                    const y = (t.clientY - rect.top) * scaleY;
                    this.checkHit(x, y);
                }
            };
            this.canvas.addEventListener('mousedown', handleInput);
            this.canvas.addEventListener('touchstart', handleInput, {passive: false});
        },

        resize: function() {
            if(!this.container) return;
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        },

        startGame: function() {
            document.querySelectorAll('.mk-modal').forEach(el => el.classList.remove('active'));
            if(Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume();

            this.state = {
                screen: 'playing',
                level: 1,
                hp: 100, maxHp: 100,
                magic: 0, maxMagic: 100,
                score: 0,
                highScore: this.state.highScore,
                monsters: [],
                bullets: [],
                particles: [],
                currentProblem: null,
                spawnTimer: 0,
                isBossActive: false,
                killCount: 0,
                targetKill: 15
            };
            
            this.generateProblem();
            this.updateUI();
        },

        generateProblem: function() {
            const st = this.state;
            const config = STAGE_CONFIG[Math.min(st.level-1, STAGE_CONFIG.length-1)];
            
            const availableValues = st.monsters.map(m => m.val);
            
            if (availableValues.length > 0 && Math.random() < 0.8) {
                const targetVal = availableValues[Math.floor(Math.random() * availableValues.length)];
                st.currentProblem = MathEngine.generate(config, targetVal);
            } else {
                st.currentProblem = MathEngine.generate(config);
                this.forceSpawnValue = st.currentProblem.a;
            }

            document.getElementById('ui-question').innerText = st.currentProblem.q + " = ?";
        },

        spawnMonster: function() {
            const st = this.state;
            const config = STAGE_CONFIG[Math.min(st.level-1, STAGE_CONFIG.length-1)];
            
            if (config.boss && st.killCount >= st.targetKill && !st.isBossActive) {
                this.spawnBoss();
                return;
            }
            if (st.isBossActive) return;

            // [수정] 스폰 속도 2배 증가 (답답함 해소)
            let spawnRate = Math.max(20, 60 - (st.level * 2)); 
            if (st.spawnTimer++ < spawnRate) return;
            st.spawnTimer = 0;

            let val;
            let isTarget = false;
            
            const hasAnswer = st.monsters.some(m => m.val === st.currentProblem.a);
            
            if (this.forceSpawnValue !== undefined) {
                val = this.forceSpawnValue;
                this.forceSpawnValue = undefined;
                isTarget = true;
            } else if (!hasAnswer) {
                val = st.currentProblem.a;
                isTarget = true;
            } else {
                const dummy = MathEngine.generate(config);
                val = dummy.a;
                if (val === st.currentProblem.a) val += 1;
            }

            const y = this.height - 50 - Math.random() * 150; 
            // [수정] 이동 속도 2배 증가 (답답함 해소)
            const speed = 1.5 + (st.level * 0.2) + Math.random(); 
            
            st.monsters.push({
                x: this.width + 50,
                y: y,
                val: val,
                hp: 1, maxHp: 1,
                speed: speed,
                r: 30,
                type: 'normal',
                color: isTarget ? '#FF9800' : '#8BC34A'
            });
        },

        spawnBoss: function() {
            const st = this.state;
            st.isBossActive = true;
            st.monsters = [];
            
            const val = st.currentProblem.a;
            
            st.monsters.push({
                x: this.width + 100,
                y: this.height - 150,
                val: val,
                hp: 5, maxHp: 5,
                speed: 0.8, // 보스도 약간 더 빠르게
                r: 80,
                type: 'boss',
                color: '#f44336'
            });
            
            document.getElementById('ui-boss-badge').style.display = 'inline-block';
        },

        checkHit: function(x, y) {
            const st = this.state;
            for(let i=st.monsters.length-1; i>=0; i--) {
                const m = st.monsters[i];
                const dist = Math.hypot(m.x - x, m.y - y);
                if (dist < m.r + 20) {
                    if (m.val === st.currentProblem.a) {
                        this.fireCannon(m);
                    } else {
                        this.spawnParticles(x, y, '#ccc', 3);
                    }
                    return;
                }
            }
        },

        fireCannon: function(target) {
            const st = this.state;
            Sound.play('fire');
            
            const cannon = document.getElementById('ui-cannon');
            const rect = cannon.getBoundingClientRect();
            // 캔버스 좌표계 기준 각도 계산
            // rect는 화면 좌표이므로, 현재 canvas의 scale을 고려해야 함 (복잡하므로 단순화)
            // 여기서는 시각적 효과이므로 대략적으로 계산
            const angle = Math.atan2(target.y - (this.height - 60), target.x - 140);
            cannon.style.transform = `rotate(${angle}rad)`;

            st.bullets.push({
                x: 140, y: this.height - 60,
                tx: target.x, ty: target.y,
                target: target,
                speed: 30 // [수정] 총알 속도 2배 증가 (즉발 타격감)
            });
        },

        hitMonster: function(b, index) {
            const st = this.state;
            const m = b.target;
            
            st.bullets.splice(index, 1);
            if (!st.monsters.includes(m)) return; 

            Sound.play('hit');
            this.spawnParticles(m.x, m.y, m.type==='boss'?'#f44336':'#8BC34A', 10);
            
            m.hp--;
            if (m.hp <= 0) {
                st.monsters = st.monsters.filter(mons => mons !== m);
                st.score += m.type === 'boss' ? 500 : 100;
                st.killCount++;
                
                st.magic = Math.min(st.maxMagic, st.magic + 15);
                
                if (m.type === 'boss') {
                    st.isBossActive = false;
                    this.nextStage();
                } else {
                    this.generateProblem();
                }
            } else {
                // 보스 피격 시 숫자 변경 (새 문제)
                const config = STAGE_CONFIG[Math.min(st.level-1, STAGE_CONFIG.length-1)];
                const nextProb = MathEngine.generate(config);
                m.val = nextProb.a;
                st.currentProblem = nextProb;
                document.getElementById('ui-question').innerText = nextProb.q + " = ?";
                m.x += 30; // 넉백
            }
            this.updateUI();
        },

        useMagic: function() {
            const st = this.state;
            if (st.magic < st.maxMagic) return;
            
            st.magic = 0;
            Sound.play('magic');
            
            document.getElementById('ui-damage').style.background = '#fff';
            document.getElementById('ui-damage').style.opacity = 0.8;
            setTimeout(() => {
                document.getElementById('ui-damage').style.opacity = 0;
                document.getElementById('ui-damage').style.background = 'red';
            }, 100);

            for(let i=st.monsters.length-1; i>=0; i--) {
                const m = st.monsters[i];
                if (m.type === 'boss') {
                    m.hp--;
                    m.x += 100;
                } else {
                    st.monsters.splice(i, 1);
                    st.score += 50;
                    st.killCount++;
                    this.spawnParticles(m.x, m.y, '#FFD700', 15);
                }
            }
            this.generateProblem();
            this.updateUI();
        },

        nextStage: function() {
            const st = this.state;
            if (st.level >= 20) {
                alert("KINGDOM SAVED! YOU ARE THE MATH KING!");
                this.startGame();
                return;
            }
            
            st.level++;
            st.killCount = 0;
            st.hp = Math.min(st.maxHp, st.hp + 20);
            
            Sound.play('win');
            document.getElementById('ui-boss-badge').style.display = 'none';
            this.generateProblem();
            this.updateUI();
        },

        damageCastle: function(damage) {
            const st = this.state;
            st.hp -= damage;
            Sound.play('damage');
            
            const overlay = document.getElementById('ui-damage');
            overlay.style.opacity = 0.5;
            setTimeout(() => overlay.style.opacity = 0, 100);

            if (st.hp <= 0) this.gameOver();
            this.updateUI();
        },

        gameOver: function() {
            this.state.screen = 'gameover';
            if (this.state.score > this.state.highScore) {
                localStorage.setItem('mk_highscore', this.state.score);
            }
            document.getElementById('end-score').innerText = this.state.score;
            document.getElementById('ui-gameover').classList.add('active');
        },

        spawnParticles: function(x, y, color, count) {
            for(let i=0; i<count; i++) {
                this.state.particles.push({
                    x, y,
                    vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                    life: 1.0, color: color, size: Math.random()*5+2
                });
            }
        },

        updateUI: function() {
            const st = this.state;
            document.getElementById('ui-score').innerText = st.score;
            document.getElementById('ui-best').innerText = st.highScore;
            document.getElementById('ui-stage').innerText = `STAGE ${st.level}`;
            document.getElementById('ui-hp').style.width = `${(st.hp/st.maxHp)*100}%`;
            
            const magicPct = (st.magic/st.maxMagic)*100;
            document.getElementById('ui-magic-fill').style.height = `${magicPct}%`;
            
            const magicBtn = document.getElementById('btn-magic');
            if (st.magic >= st.maxMagic) magicBtn.classList.add('ready');
            else magicBtn.classList.remove('ready');
        },

        loop: function() {
            this.loopId = requestAnimationFrame(() => this.loop());
            if (this.state.screen !== 'playing') return;

            const ctx = this.ctx;
            const st = this.state;
            
            ctx.clearRect(0, 0, this.width, this.height);

            // Spawn
            this.spawnMonster();

            // Monsters Update
            st.monsters.sort((a,b) => b.y - a.y);
            for(let i=st.monsters.length-1; i>=0; i--) {
                const m = st.monsters[i];
                // Move
                m.x -= m.speed;
                
                if (m.x < 100) { 
                    this.damageCastle(10);
                    st.monsters.splice(i, 1);
                    if (m.val === st.currentProblem.a) this.generateProblem();
                    continue;
                }

                // Draw
                ctx.save();
                ctx.translate(m.x, m.y);
                
                ctx.beginPath(); ctx.ellipse(0, m.r, m.r*0.8, m.r*0.3, 0, 0, Math.PI*2);
                ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();

                ctx.beginPath();
                if (m.type === 'boss') {
                    ctx.fillStyle = m.color;
                    ctx.fillRect(-m.r, -m.r, m.r*2, m.r*2);
                    ctx.strokeStyle = '#333'; ctx.lineWidth = 5;
                    ctx.strokeRect(-m.r, -m.r, m.r*2, m.r*2);
                } else {
                    ctx.arc(0, 0, m.r, 0, Math.PI*2);
                    ctx.fillStyle = m.color; ctx.fill();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
                }

                ctx.fillStyle = '#fff';
                ctx.font = `bold ${m.r}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(m.val, 0, 0);
                
                if (m.type === 'boss') {
                    ctx.fillStyle = 'red'; ctx.fillRect(-m.r, -m.r-20, m.r*2, 10);
                    ctx.fillStyle = '#0f0'; ctx.fillRect(-m.r, -m.r-20, (m.r*2)*(m.hp/m.maxHp), 10);
                }

                ctx.restore();
            }

            // Bullets Update
            for(let i=st.bullets.length-1; i>=0; i--) {
                const b = st.bullets[i];
                const dx = b.target.x - b.x;
                const dy = b.target.y - b.y;
                const dist = Math.hypot(dx, dy);
                
                // [수정] 타격 판정 범위 약간 증가 (30px) - 빠른 속도 대응
                if (dist < 30) {
                    this.hitMonster(b, i);
                    continue;
                }
                
                b.x += (dx/dist) * b.speed;
                b.y += (dy/dist) * b.speed;
                
                ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI*2);
                ctx.fillStyle = '#333'; ctx.fill();
            }

            // Particles
            for(let i=st.particles.length-1; i>=0; i--) {
                const p = st.particles[i];
                p.x += p.vx; p.y += p.vy; p.life -= 0.05;
                if(p.life <= 0) { st.particles.splice(i,1); continue; }
                
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();