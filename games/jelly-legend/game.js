(function() {
    'use strict';

    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t && I18n.translations && Object.keys(I18n.translations).length > 0) {
            const fullKey = `gameDetails.jelly-legend.ui.${key}`;
            const value = I18n.t(fullKey, defaultValue);
            if (value === fullKey || value === defaultValue) {
                return defaultValue;
            }
            return value;
        }
        return defaultValue;
    }

    // Helper function to get skill info
    function getSkillInfo(skillId) {
        const titleKey = `skills.${skillId}.title`;
        const descKey = `skills.${skillId}.desc`;
        const defaultSkill = SKILLS.find(s => s.id === skillId) || {};
        return {
            title: getUIText(titleKey, defaultSkill.title || ''),
            desc: getUIText(descKey, defaultSkill.desc || '')
        };
    }

    // ================= CONFIG & DATA =================
    // 젤리 단계별 설정 (반지름, 색상, 점수)
    const TIERS = [
        { r: 20, color: '#FF5252', score: 2, label: '2' },      // 0: Cherry
        { r: 30, color: '#FF9800', score: 4, label: '4' },      // 1: Orange
        { r: 40, color: '#FFEB3B', score: 8, label: '8' },      // 2: Lemon
        { r: 50, color: '#4CAF50', score: 16, label: '16' },    // 3: Kiwi
        { r: 60, color: '#2196F3', score: 32, label: '32' },    // 4: Berry
        { r: 70, color: '#3F51B5', score: 64, label: '64' },    // 5: Grape
        { r: 80, color: '#9C27B0', score: 128, label: '128' },  // 6: Plum
        { r: 90, color: '#E91E63', score: 256, label: '256' },  // 7: Peach
        { r: 100, color: '#009688', score: 512, label: '512' }, // 8: Melon
        { r: 110, color: '#795548', score: 1000, label: '1k' },   // 9: Coconut
        { r: 120, color: '#607D8B', score: 2000, label: '2k' }    // 10: Moon
    ];

    // 로그라이크 스킬 목록
    const SKILLS = [
        { id: 'pop_small', icon: '🧹', title: '청소', desc: '가장 작은 젤리(2)들을 모두 터뜨립니다.' },
        { id: 'gravity', icon: '🌑', title: '무중력', desc: '10초간 중력이 약해져 젤리가 붕 뜹니다.' },
        { id: 'bomb', icon: '💣', title: '폭탄', desc: '다음 젤리가 닿으면 주변을 폭파하는 폭탄이 됩니다.' },
        { id: 'shake', icon: '🫨', title: '지진', desc: '화면을 강하게 흔들어 젤리들을 섞습니다.' },
        { id: 'shrink', icon: '🤏', title: '다이어트', desc: '모든 젤리의 크기가 10% 줄어듭니다.' },
        { id: 'next_big', icon: '🎁', title: '큰 선물', desc: '다음 젤리가 한 단계 더 큰 젤리로 나옵니다.' }
    ];

    // ================= PHYSICS ENGINE (Simple Verlet/Impulse) =================
    const Physics = {
        gravity: 0.5,
        friction: 0.98, // 공기 저항 (구름 저항)
        bounce: 0.3,    // 탄성
        
        solveCollision: function(b1, b2) {
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = b1.r + b2.r;

            if (dist < minDist) {
                // 충돌 발생!
                
                // 1. 같은 티어면 합체 (Game Logic에서 처리하도록 flag 설정)
                if (b1.tier === b2.tier && !b1.merged && !b2.merged && b1.tier < TIERS.length - 1) {
                    return 'merge';
                }

                // 2. 물리적 반발 (밀어내기)
                const angle = Math.atan2(dy, dx);
                const tx = b1.x + Math.cos(angle) * minDist;
                const ty = b1.y + Math.sin(angle) * minDist;
                
                const ax = (tx - b2.x) * 0.5; // 스프링 강도
                const ay = (ty - b2.y) * 0.5;

                // 무게(반지름)에 따른 반발력 분배
                // 무거운 건 덜 밀림
                const mass1 = b1.r;
                const mass2 = b2.r;
                const totalMass = mass1 + mass2;
                const r1 = mass2 / totalMass;
                const r2 = mass1 / totalMass;

                b1.vx -= ax * r1;
                b1.vy -= ay * r1;
                b2.vx += ax * r2;
                b2.vy += ay * r2;
                
                // 위치 보정 (겹침 방지) - 매우 중요
                const overlap = minDist - dist;
                const moveX = (dx / dist) * overlap * 0.5;
                const moveY = (dy / dist) * overlap * 0.5;
                
                b1.x -= moveX;
                b1.y -= moveY;
                b2.x += moveX;
                b2.y += moveY;

                return 'collide';
            }
            return false;
        }
    };

    // ================= GAME ENGINE =================
    const Game = {
        canvas: null, ctx: null,
        width: 0, height: 0,
        loopId: null,
        
        state: {
            screen: 'start', // start, playing, levelup, gameover
            score: 0,
            bestScore: 0,
            xp: 0,
            maxXp: 100,
            level: 1,
            balls: [],
            particles: [],
            nextTier: 0, // 다음에 나올 젤리 티어
            dropX: 0,    // 드롭 위치
            isDropping: false, // 드롭 쿨타임
            lowGravityTimer: 0,
            nextIsBomb: false,
            deadLineY: 150, // 이 선 넘으면 게임오버
            deadTimer: 0 // 데드라인 넘은 시간 체크
        },

        init: function(container, callbacks) {
            this.container = container;
            this.callbacks = callbacks || {};
            this.renderLayout();
            this.resize();
            window.addEventListener('resize', () => this.resize());

            // Load High Score
            const saved = localStorage.getItem('jl_highscore');
            this.state.bestScore = saved ? parseInt(saved) : 0;
            document.getElementById('ui-best').innerText = this.state.bestScore;

            // Input Handling
            const trackMouse = (e) => {
                if (this.state.screen !== 'playing') return;
                const rect = this.canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                this.state.dropX = Math.max(20, Math.min(this.width - 20, clientX - rect.left));
            };
            const handleClick = (e) => {
                if (this.state.screen !== 'playing') return;
                this.dropBall();
            };

            this.canvas.addEventListener('mousemove', trackMouse);
            this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); trackMouse(e); }, {passive:false});
            this.canvas.addEventListener('mouseup', handleClick);
            this.canvas.addEventListener('touchend', handleClick);

            if (this.loopId) cancelAnimationFrame(this.loopId);
            this.loop();
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="jl-wrapper">
                    <div class="jl-header">
                        <div class="jl-score-box">
                            <span class="jl-label">BEST: <span id="ui-best">0</span></span>
                            <span class="jl-val" id="ui-score">0</span>
                        </div>
                        <div class="jl-next-box">
                            <span class="jl-label">NEXT</span>
                            <div class="jl-next-ball" id="ui-next"></div>
                        </div>
                    </div>
                    <div class="jl-exp-container">
                        <div class="jl-exp-fill" id="ui-exp"></div>
                        <span class="jl-level-badge" id="ui-level">LV.1</span>
                    </div>

                    <div class="jl-game-area" id="game-area">
                        <div class="jl-deadline" id="ui-deadline"><span>DEAD LINE</span></div>
                        <canvas id="game-canvas"></canvas>
                    </div>

                    <div class="jl-modal active" id="modal-start">
                        <div class="jl-levelup-title">JELLY LEGEND</div>
                        <p style="color:#ddd; margin-bottom:20px; text-align:center;">
                            화면을 터치해 젤리를 떨어뜨리세요.<br>
                            같은 젤리끼리 합치면 더 커집니다!<br>
                            레벨업하면 강력한 스킬을 얻을 수 있어요.
                        </p>
                        <button class="jl-btn" onclick="Game.startGame()">PLAY</button>
                    </div>

                    <div class="jl-modal" id="modal-levelup">
                        <div class="jl-levelup-title">LEVEL UP!</div>
                        <div class="jl-cards-container" id="ui-cards"></div>
                    </div>

                    <div class="jl-modal" id="modal-gameover">
                        <h1 style="color:#ff5252; font-size:3rem; margin-bottom:10px;">GAME OVER</h1>
                        <p style="font-size:1.5rem; color:white;">SCORE: <span id="end-score">0</span></p>
                        <button class="jl-btn" onclick="Game.startGame()">RETRY</button>
                    </div>
                </div>
            `;
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.state.deadLineY = 150;
            document.getElementById('ui-deadline').style.top = this.state.deadLineY + 'px';
        },

        resize: function() {
            const area = document.getElementById('game-area');
            if (area) {
                this.width = area.clientWidth;
                this.height = area.clientHeight;
                this.canvas.width = this.width;
                this.canvas.height = this.height;
            }
        },

        startGame: function() {
            document.querySelectorAll('.jl-modal').forEach(el => el.classList.remove('active'));
            
            this.state.screen = 'playing';
            this.state.score = 0;
            this.state.xp = 0;
            this.state.maxXp = 100;
            this.state.level = 1;
            this.state.balls = [];
            this.state.particles = [];
            this.state.nextTier = 0;
            this.state.isDropping = false;
            this.state.lowGravityTimer = 0;
            this.state.nextIsBomb = false;
            this.state.deadTimer = 0;
            this.state.dropX = this.width / 2;

            this.updateUI();
            this.setNextBall();
        },

        setNextBall: function() {
            // 레벨이 오르면 더 큰 공도 바로 나올 수 있음 (최대 3단계까지)
            const max = Math.min(3, Math.floor(this.state.level / 3));
            this.state.nextTier = Math.floor(Math.random() * (max + 1));
            
            // UI 업데이트
            const el = document.getElementById('ui-next');
            const tier = TIERS[this.state.nextTier];
            el.style.background = tier.color;
            el.innerText = tier.label;
            el.style.color = '#fff';
            el.style.display = 'flex';
            el.style.justifyContent = 'center';
            el.style.alignItems = 'center';
            el.style.fontSize = '10px';
            
            // 만약 다음이 폭탄이면
            if (this.state.nextIsBomb) {
                el.innerText = '💣';
                el.style.background = '#333';
            }
        },

        dropBall: function() {
            if (this.state.isDropping) return;
            
            this.state.isDropping = true;
            setTimeout(() => { this.state.isDropping = false; }, 600); // 쿨타임

            const x = this.state.dropX;
            const y = 40; // 천장 근처
            
            if (this.state.nextIsBomb) {
                this.state.balls.push({
                    x, y, vx:0, vy:0, r: 25,
                    tier: -1, // 폭탄
                    label: '💣', color: '#333',
                    merged: false
                });
                this.state.nextIsBomb = false;
            } else {
                const tierIdx = this.state.nextTier;
                const tier = TIERS[tierIdx];
                this.state.balls.push({
                    x, y, vx:0, vy:0, 
                    r: tier.r * 0.8, // 드롭될땐 약간 작게 시작해서 커지면 좋을듯 (생략)
                    tier: tierIdx,
                    label: tier.label, color: tier.color,
                    merged: false
                });
            }
            
            this.setNextBall();
        },

        // --- MERGE & LOGIC ---
        mergeBalls: function(b1, b2) {
            b1.merged = true;
            b2.merged = true;

            const midX = (b1.x + b2.x) / 2;
            const midY = (b1.y + b2.y) / 2;
            const newTierIdx = b1.tier + 1;
            const newTier = TIERS[newTierIdx];

            // 점수 & XP
            const score = newTier.score;
            this.state.score += score;
            this.addXp(score * 0.5); // 점수의 절반만큼 XP
            
            // 파티클
            this.spawnParticles(midX, midY, newTier.color, 10);

            // 새 공 생성
            // 약간 위로 튀어오르게
            this.state.balls.push({
                x: midX, y: midY,
                vx: (Math.random()-0.5)*2, vy: -3,
                r: newTier.r, // 실제 크기 적용 (여기서 조정 가능)
                tier: newTierIdx,
                label: newTier.label, color: newTier.color,
                merged: false
            });

            this.updateUI();
        },

        explodeBomb: function(bomb) {
            bomb.merged = true; // 제거
            this.spawnParticles(bomb.x, bomb.y, '#fff', 20);
            
            // 주변 공 제거
            const explosionRadius = 150;
            this.state.balls.forEach(b => {
                if (b === bomb) return;
                const dist = Math.hypot(b.x - bomb.x, b.y - bomb.y);
                if (dist < explosionRadius) {
                    b.merged = true; // 제거
                    this.spawnParticles(b.x, b.y, b.color, 5);
                    this.state.score += 50;
                } else if (dist < explosionRadius * 2) {
                    // 멀리 있는 건 밀쳐내기
                    const angle = Math.atan2(b.y - bomb.y, b.x - bomb.x);
                    b.vx += Math.cos(angle) * 20;
                    b.vy += Math.sin(angle) * 20;
                }
            });
            this.updateUI();
        },

        addXp: function(amount) {
            this.state.xp += amount;
            if (this.state.xp >= this.state.maxXp) {
                this.levelUp();
            }
            this.updateUI();
        },

        levelUp: function() {
            this.state.level++;
            this.state.xp = 0;
            this.state.maxXp = Math.floor(this.state.maxXp * 1.5);
            this.state.screen = 'levelup'; // 게임 일시정지
            
            // 랜덤 스킬 3개 뽑기
            const choices = [];
            while(choices.length < 3) {
                const s = SKILLS[Math.floor(Math.random() * SKILLS.length)];
                if(!choices.includes(s)) choices.push(s);
            }
            
            // 카드 렌더링
            const container = document.getElementById('ui-cards');
            container.innerHTML = '';
            choices.forEach(skill => {
                const skillInfo = getSkillInfo(skill.id);
                const card = document.createElement('div');
                card.className = 'jl-card';
                card.innerHTML = `
                    <div class="jl-card-icon">${skill.icon}</div>
                    <div class="jl-card-title">${skillInfo.title}</div>
                    <div class="jl-card-desc">${skillInfo.desc}</div>
                `;
                card.onclick = () => this.applySkill(skill);
                container.appendChild(card);
            });

            document.getElementById('modal-levelup').classList.add('active');
        },

        applySkill: function(skill) {
            document.getElementById('modal-levelup').classList.remove('active');
            this.state.screen = 'playing';
            
            if (skill.id === 'pop_small') {
                // 가장 작은 젤리(티어 0) 모두 제거
                this.state.balls.forEach(b => {
                    if (b.tier === 0) {
                        b.merged = true;
                        this.spawnParticles(b.x, b.y, b.color, 5);
                        this.state.score += 10;
                    }
                });
            } else if (skill.id === 'gravity') {
                this.state.lowGravityTimer = 600; // 10초 (60fps)
            } else if (skill.id === 'bomb') {
                this.state.nextIsBomb = true;
                this.setNextBall();
            } else if (skill.id === 'shake') {
                this.state.balls.forEach(b => {
                    b.vx += (Math.random()-0.5) * 30;
                    b.vy -= Math.random() * 20;
                });
            } else if (skill.id === 'shrink') {
                // 반지름 영구 감소 (구현상 TIERS 데이터는 못바꾸니 현재 공들만 축소)
                this.state.balls.forEach(b => b.r *= 0.9);
            } else if (skill.id === 'next_big') {
                this.state.nextTier = Math.min(TIERS.length-1, this.state.nextTier + 2);
                this.setNextBall();
            }

            this.updateUI();
        },

        spawnParticles: function(x, y, color, count) {
            for(let i=0; i<count; i++) {
                this.state.particles.push({
                    x, y,
                    vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10,
                    life: 1.0, color: color, size: Math.random()*4+2
                });
            }
        },

        updateUI: function() {
            document.getElementById('ui-score').innerText = this.state.score;
            document.getElementById('ui-level').innerText = `LV.${this.state.level}`;
            const pct = (this.state.xp / this.state.maxXp) * 100;
            document.getElementById('ui-exp').style.width = `${pct}%`;
            
            // Notify game shell callbacks
            if (this.callbacks && this.callbacks.onScoreUpdate) {
                this.callbacks.onScoreUpdate(this.state.score);
            }
            if (this.callbacks && this.callbacks.onLevelChange) {
                this.callbacks.onLevelChange(this.state.level);
            }
        },

        gameOver: function() {
            this.state.screen = 'gameover';
            if (this.state.score > this.state.bestScore) {
                this.state.bestScore = this.state.score;
                localStorage.setItem('jl_highscore', this.state.score);
            }
            document.getElementById('end-score').innerText = this.state.score;
            document.getElementById('modal-gameover').classList.add('active');
            
            // Notify game shell callbacks
            if (this.callbacks && this.callbacks.onGameOver) {
                this.callbacks.onGameOver({
                    score: this.state.score,
                    completed: false
                });
            }
        },

        // --- GAME LOOP ---
        loop: function() {
            this.loopId = requestAnimationFrame(() => this.loop());
            if (this.state.screen !== 'playing') return;

            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;
            const st = this.state;
            
            // Physics Params
            let gravity = Physics.gravity;
            if (st.lowGravityTimer > 0) {
                st.lowGravityTimer--;
                gravity = 0.05; // 저중력
            }

            // Clear
            ctx.fillStyle = '#16213e';
            ctx.fillRect(0, 0, w, h);

            // Guide Line (Aim)
            ctx.beginPath();
            ctx.moveTo(st.dropX, 0);
            ctx.lineTo(st.dropX, h);
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw Deadline
            // CSS로 그렸지만 위치 확인용 로직
            const deadLineY = st.deadLineY;

            // --- UPDATE BALLS ---
            let highestBallY = h;

            for (let i = 0; i < st.balls.length; i++) {
                const b = st.balls[i];
                if (b.merged) continue;

                // 1. Gravity & Move
                b.vy += gravity;
                b.vx *= Physics.friction;
                b.vy *= Physics.friction;
                
                b.x += b.vx;
                b.y += b.vy;

                // 2. Wall Bounce
                if (b.x < b.r) { b.x = b.r; b.vx *= -Physics.bounce; }
                if (b.x > w - b.r) { b.x = w - b.r; b.vx *= -Physics.bounce; }
                if (b.y > h - b.r) { b.y = h - b.r; b.vy *= -Physics.bounce; } // 바닥

                // 3. Resolve Collisions (Ball vs Ball)
                for (let j = i + 1; j < st.balls.length; j++) {
                    const b2 = st.balls[j];
                    if (b2.merged) continue;
                    
                    const res = Physics.solveCollision(b, b2);
                    if (res === 'merge') {
                        this.mergeBalls(b, b2);
                    } else if (res === 'collide') {
                        // 폭탄 체크
                        if (b.tier === -1) this.explodeBomb(b);
                        if (b2.tier === -1) this.explodeBomb(b2);
                    }
                }
            }

            // Remove merged balls
            st.balls = st.balls.filter(b => !b.merged);

            // --- DRAW BALLS & CHECK GAMEOVER ---
            st.balls.forEach(b => {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
                ctx.fillStyle = b.color;
                ctx.fill();
                
                // 광택
                ctx.beginPath();
                ctx.arc(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.2, 0, Math.PI*2);
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fill();

                // 테두리
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 텍스트
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${b.r*0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(b.label, b.x, b.y + b.r*0.1);

                // 최고 높이 체크 (방금 떨어진 공 제외)
                if (b.vy > -0.5 && b.vy < 0.5 && !st.isDropping) {
                     if (b.y - b.r < highestBallY) highestBallY = b.y - b.r;
                }
            });

            // --- DRAW PARTICLES ---
            st.particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy; p.life -= 0.05;
                if(p.life <= 0) st.particles.splice(i, 1);
                else {
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            });

            // --- CHECK GAMEOVER ---
            if (highestBallY < deadLineY) {
                st.deadTimer++;
                // 경고 표시
                ctx.fillStyle = `rgba(255,0,0,${Math.min(0.5, st.deadTimer/100)})`;
                ctx.fillRect(0, 0, w, h);
                
                if (st.deadTimer > 180) { // 3초간 지속되면 게임오버
                    this.gameOver();
                }
            } else {
                st.deadTimer = 0;
            }
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();