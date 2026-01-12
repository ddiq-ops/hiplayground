(function() {
    'use strict';

    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t && I18n.translations && Object.keys(I18n.translations).length > 0) {
            const fullKey = `gameDetails.infinite-space.ui.${key}`;
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
        const nameKey = `skills.${skillId}.name`;
        const descKey = `skills.${skillId}.desc`;
        const defaultSkill = SKILLS.find(s => s.id === skillId) || {};
        return {
            name: getUIText(nameKey, defaultSkill.name || ''),
            desc: getUIText(descKey, defaultSkill.desc || '')
        };
    }

    const ASSET_PATH = '../games/infinite-space/';

    // ================= ASSET LOADER =================
    const Assets = {
        images: {},
        keys: [
            'player', 'enemy', 'boss', 'bullet_p', 'bullet_e', 
            'bg', 'explosion', 'exp_gem', 'shield', 'drone',
            'icon_atk', 'icon_multi', 'icon_speed', 'icon_magnet', 'icon_heal'
        ],
        load: function(callback) {
            let loadedCount = 0;
            const total = this.keys.length;
            const checkLoad = () => {
                loadedCount++;
                if (loadedCount >= total) callback();
            };

            this.keys.forEach(key => {
                const img = new Image();
                img.src = `${ASSET_PATH}${key}.webp`;
                img.onload = () => { this.images[key] = img; checkLoad(); };
                img.onerror = () => {
                    const imgPng = new Image();
                    imgPng.src = `${ASSET_PATH}${key}.png`;
                    imgPng.onload = () => { this.images[key] = imgPng; checkLoad(); };
                    imgPng.onerror = () => { this.images[key] = null; checkLoad(); };
                };
            });
        }
    };

    // ================= SKILL DATA =================
    const SKILLS = [
        { id: 'atk', name: '파워 업', desc: '공격력 +20%', icon: 'icon_atk', type: 'stat', stat: 'damage', val: 1.2 },
        { id: 'speed', name: '엔진 가속', desc: '이동 속도 +20%', icon: 'icon_speed', type: 'stat', stat: 'moveSpeed', val: 1.2 },
        { id: 'multi', name: '멀티 샷', desc: '발사체 개수 +1', icon: 'icon_multi', type: 'special' },
        { id: 'magnet', name: '자석 강화', desc: '아이템 획득 범위 증가', icon: 'icon_magnet', type: 'stat', stat: 'magnetRange', val: 1.5 },
        { id: 'heal', name: '긴급 수리', desc: '체력 50% 회복', icon: 'icon_heal', type: 'heal', val: 50 },
        { id: 'drone', name: '지원 드론', desc: '공격 드론 소환', icon: 'drone', type: 'drone' }
    ];

    // ================= GAME ENGINE =================
    const Game = {
        canvas: null, ctx: null,
        width: 900, height: 600, // 가로형 해상도
        
        state: {
            screen: 'start', score: 0, level: 1, exp: 0, maxExp: 100,
            player: {
                x: 100, y: 300, 
                hp: 100, maxHp: 100, damage: 10, moveSpeed: 5, magnetRange: 150,
                shotDelay: 12, shotTimer: 0, bulletCount: 1, drones: 0
            },
            enemies: [], bullets: [], particles: [], gems: [], 
            cameraShake: 0, frame: 0, invincibleTimer: 0
        },
        
        input: { x: 0, y: 0, isDown: false, lastX: 0, lastY: 0 },
        loopId: null,

        init: function(container) {
            this.container = container;
            this.setupUI();
            Assets.load(() => {
                this.resizeGame();
                window.addEventListener('resize', () => this.resizeGame());
                this.showScreen('ui-start');
                if (this.loopId) cancelAnimationFrame(this.loopId);
                this.loop(); 
            });
            
            // 언어 변경 이벤트 리스너 추가
            document.addEventListener('i18n:loaded', () => {
                if (this.state.screen === 'levelup') {
                    this.renderLevelup();
                }
                // levelup-desc도 업데이트
                const levelupDescEl = document.querySelector('.levelup-desc');
                if (levelupDescEl) {
                    levelupDescEl.textContent = getUIText('levelupDesc', '능력을 선택하세요');
                }
            });
        },

        setupUI: function() {
            this.container.innerHTML = `
                <div class="is-wrapper">
                    <div class="game-frame" id="game-frame">
                        <canvas id="game-canvas" width="900" height="600"></canvas>
                        <div class="exp-container"><div class="exp-bar" id="ui-exp"></div></div>
                        <div class="is-hud">
                            <div class="hud-left"><div class="lv-badge" id="ui-lv">LV.1</div></div>
                            <div class="hud-right">
                                <div class="score-val" id="ui-score">0</div>
                                <div class="hp-bar-bg"><div class="hp-bar-fill" id="ui-hp"></div></div>
                            </div>
                        </div>
                        <div class="overlay-screen active" id="ui-start">
                            <div class="game-title">INFINITE SPACE<br><span style="font-size:2rem">ROGUE</span></div>
                            <button class="start-btn" id="btn-start">START</button>
                        </div>
                        <div class="overlay-screen" id="ui-levelup">
                            <div class="levelup-title">LEVEL UP!</div>
                            <div class="levelup-desc">능력을 선택하세요</div>
                            <div class="card-container" id="ui-cards"></div>
                        </div>
                        <div class="overlay-screen" id="ui-gameover">
                            <div class="game-title" style="color:#ff4757">GAME OVER</div>
                            <div class="levelup-desc" id="ui-final-score">SCORE: 0</div>
                            <button class="start-btn" id="btn-restart">RETRY</button>
                        </div>
                    </div>
                </div>
            `;
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            document.getElementById('btn-start').onclick = () => this.startGame();
            document.getElementById('btn-restart').onclick = () => this.startGame();

            const handleStart = (e) => {
                this.input.isDown = true;
                const pos = this.getPos(e);
                this.input.lastX = pos.x; this.input.lastY = pos.y;
            };
            const handleMove = (e) => {
                if(!this.input.isDown) return;
                const pos = this.getPos(e);
                if (this.state.screen === 'playing') {
                    const dx = pos.x - this.input.lastX;
                    const dy = pos.y - this.input.lastY;
                    this.state.player.x += dx;
                    this.state.player.y += dy;
                    this.state.player.x = Math.max(30, Math.min(this.width-30, this.state.player.x));
                    this.state.player.y = Math.max(30, Math.min(this.height-30, this.state.player.y));
                }
                this.input.lastX = pos.x; this.input.lastY = pos.y;
            };
            const handleEnd = () => { this.input.isDown = false; };

            this.canvas.addEventListener('mousedown', handleStart);
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            this.canvas.addEventListener('touchstart', handleStart, {passive: false});
            window.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, {passive: false});
            window.addEventListener('touchend', handleEnd);
        },

        getPos: function(e) {
            const rect = this.canvas.getBoundingClientRect();
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
        },

        resizeGame: function() {
            const frame = document.getElementById('game-frame');
            if (!frame) return;
            let scale = Math.min(window.innerWidth / 900, window.innerHeight / 600) * 0.95;
            if (scale > 1) scale = 1;
            frame.style.transform = `scale(${scale})`;
        },

        showScreen: function(id) {
            ['ui-start', 'ui-levelup', 'ui-gameover'].forEach(sid => document.getElementById(sid).classList.remove('active'));
            if(id) document.getElementById(id).classList.add('active');
            if(id === 'ui-start' || id === 'ui-gameover') this.state.screen = 'menu';
            else if(id === 'ui-levelup') this.state.screen = 'levelup';
            else this.state.screen = 'playing';
        },

        startGame: function() {
            this.showScreen(null);
            this.state = {
                screen: 'playing', score: 0, level: 1, exp: 0, maxExp: 100,
                player: {
                    x: 100, y: 300, 
                    hp: 100, maxHp: 100, damage: 15, moveSpeed: 5, magnetRange: 150,
                    shotDelay: 10, shotTimer: 0, bulletCount: 1, drones: 0
                },
                enemies: [], bullets: [], particles: [], gems: [], 
                cameraShake: 0, frame: 0, invincibleTimer: 60
            };
            this.updateHUD();
        },

        loop: function() {
            this.loopId = requestAnimationFrame(() => this.loop());
            if (this.state.screen !== 'playing') return;
            this.update();
            this.draw();
            this.state.frame++;
        },

        update: function() {
            const st = this.state;
            const pl = st.player;
            if (st.invincibleTimer > 0) st.invincibleTimer--;

            // Player Fire
            pl.shotTimer++;
            if (pl.shotTimer >= pl.shotDelay) {
                pl.shotTimer = 0;
                this.fireBullet();
            }

            // Drone Fire
            if (pl.drones > 0 && st.frame % (pl.shotDelay * 2) === 0) {
                this.fireDroneBullet();
            }

            // Enemy Spawn
            if (st.frame % 50 === 0 && st.enemies.length < 8 + st.level) {
                this.spawnEnemy();
            }

            // --- Enemies Action ---
            for (let i = st.enemies.length - 1; i >= 0; i--) {
                const e = st.enemies[i];
                e.x -= e.speed; // Move Left
                e.y += (pl.y - e.y) * 0.02; // Homing

                // Enemy Shoot
                e.shotTimer++;
                if (e.shotTimer >= e.shotDelay) {
                    e.shotTimer = 0;
                    this.fireEnemyBullet(e);
                }

                // Hit by Player Bullet
                for (let j = st.bullets.length - 1; j >= 0; j--) {
                    const b = st.bullets[j];
                    if (b.isPlayer && Math.hypot(b.x - e.x, b.y - e.y) < e.r + 15) {
                        e.hp -= pl.damage;
                        this.spawnParticles(b.x, b.y, '#00d2d3', 2);
                        st.bullets.splice(j, 1);
                        if (e.hp <= 0) {
                            this.enemyDie(e);
                            st.enemies.splice(i, 1);
                            break;
                        }
                    }
                }
                
                // Crash into Player
                if (st.enemies[i] && Math.hypot(pl.x - e.x, pl.y - e.y) < e.r + 20) {
                    if (st.invincibleTimer <= 0) {
                        this.hitPlayer(20);
                        this.enemyDie(e);
                        st.enemies.splice(i, 1);
                    }
                }

                if (st.enemies[i] && e.x < -100) st.enemies.splice(i, 1);
            }

            // --- Bullets Update ---
            for (let i = st.bullets.length - 1; i >= 0; i--) {
                const b = st.bullets[i];
                b.x += b.vx; b.y += b.vy;
                
                // Enemy Bullet hits Player
                if (!b.isPlayer) {
                    if (Math.hypot(b.x - pl.x, b.y - pl.y) < 20) {
                        if (st.invincibleTimer <= 0) {
                            this.hitPlayer(10);
                            st.bullets.splice(i, 1);
                            continue;
                        }
                    }
                }

                // Bounds
                if (b.x > this.width + 50 || b.x < -50 || b.y < -50 || b.y > this.height+50) {
                    st.bullets.splice(i, 1);
                }
            }

            // Gems
            for (let i = st.gems.length - 1; i >= 0; i--) {
                const g = st.gems[i];
                const dist = Math.hypot(pl.x - g.x, pl.y - g.y);
                if (dist < pl.magnetRange) {
                    g.x += (pl.x - g.x) * 0.15;
                    g.y += (pl.y - g.y) * 0.15;
                }
                if (dist < 30) {
                    this.addExp(g.val);
                    st.gems.splice(i, 1);
                }
                g.x -= 2; // Scroll
                if (g.x < -50) st.gems.splice(i, 1);
            }

            // Particles
            for (let i = st.particles.length - 1; i >= 0; i--) {
                const p = st.particles[i];
                p.x += p.vx; p.y += p.vy; p.life -= 0.05;
                if(p.life <= 0) st.particles.splice(i, 1);
            }
            if(st.cameraShake > 0) st.cameraShake *= 0.9;
        },

        draw: function() {
            const ctx = this.ctx;
            const st = this.state;
            
            ctx.fillStyle = '#050505'; ctx.fillRect(0,0,this.width, this.height);
            ctx.save();

            if(st.cameraShake > 1) {
                ctx.translate((Math.random()-0.5)*st.cameraShake, (Math.random()-0.5)*st.cameraShake);
            }

            // BG
            if(Assets.images.bg) {
                const bgX = (st.frame * 2) % this.width;
                ctx.drawImage(Assets.images.bg, -bgX, 0, this.width, this.height);
                ctx.drawImage(Assets.images.bg, this.width - bgX, 0, this.width, this.height);
            }
            ctx.globalCompositeOperation = 'screen';

            st.gems.forEach(g => {
                if(Assets.images.exp_gem) ctx.drawImage(Assets.images.exp_gem, g.x-15, g.y-15, 30, 30);
                else { ctx.fillStyle='#f1c40f'; ctx.beginPath(); ctx.arc(g.x, g.y, 10, 0, Math.PI*2); ctx.fill(); }
            });

            // Enemies (Rotated 0 deg - face Left)
            st.enemies.forEach(e => {
                ctx.save(); ctx.translate(e.x, e.y);
                // [수정] 적 이미지 회전: 기존 -90도 -> 0도 (왼쪽을 보도록)
                // 만약 원본이 왼쪽을 보고 있다면 0도, 아래를 보고 있다면 -90도가 아니라 90도(오른쪽)??
                // 아까 "앞쪽이 아래를 바라보고 있다"고 했으므로, 왼쪽을 보게 하려면 시계방향 90도 회전 필요
                ctx.rotate(0); // [요청 반영: 시계방향 90도 회전] -> 기존 -PI/2에서 PI/2를 더함 -> 0
                const img = e.type === 'boss' ? Assets.images.boss : Assets.images.enemy;
                if(img) ctx.drawImage(img, -e.r, -e.r, e.r*2, e.r*2);
                else { ctx.fillStyle='#ff4757'; ctx.fillRect(-e.r, -e.r, e.r*2, e.r*2); }
                ctx.restore();
            });

            // Player (Rotated 0 deg - face Right)
            ctx.save(); ctx.translate(st.player.x, st.player.y);
            // [수정] 플레이어 이미지 회전: 기존 90도 -> 0도 (오른쪽을 보도록)
            // 아까 "앞쪽이 아래를 바라보고 있다"고 했으므로, 오른쪽을 보게 하려면 반시계 90도 회전 필요
            ctx.rotate(0); // [요청 반영: 반시계방향 90도 회전] -> 기존 PI/2에서 PI/2를 뺌 -> 0
            if(Assets.images.player) ctx.drawImage(Assets.images.player, -35, -35, 70, 70);
            else { ctx.fillStyle='#00d2d3'; ctx.beginPath(); ctx.moveTo(0,-30); ctx.lineTo(20,20); ctx.lineTo(-20,20); ctx.fill(); }
            
            if(st.player.drones > 0) {
                const t = Date.now()/400;
                for(let i=0; i<st.player.drones; i++) {
                    const a = t + (Math.PI*2/st.player.drones)*i;
                    const dx = Math.cos(a)*60; const dy = Math.sin(a)*60;
                    if(Assets.images.drone) ctx.drawImage(Assets.images.drone, dx-15, dy-15, 30, 30);
                    else { ctx.fillStyle='#fff'; ctx.fillRect(dx-5,dy-5,10,10); }
                }
            }
            ctx.restore();

            // Bullets
            st.bullets.forEach(b => {
                ctx.save(); ctx.translate(b.x, b.y);
                ctx.rotate(Math.atan2(b.vy, b.vx) + Math.PI/2);
                // 적 총알 / 아군 총알 구분
                const img = b.isPlayer ? Assets.images.bullet_p : Assets.images.bullet_e;
                if(img) ctx.drawImage(img, -8, -20, 16, 40);
                else { ctx.fillStyle = b.isPlayer ? '#fff' : '#ff4757'; ctx.fillRect(-2, -10, 4, 20); }
                ctx.restore();
            });

            st.particles.forEach(p => {
                ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
                ctx.globalAlpha = 1.0;
            });

            ctx.restore();
            ctx.globalCompositeOperation = 'source-over';
        },

        fireBullet: function() {
            const pl = this.state.player;
            const count = pl.bulletCount;
            for(let i=0; i<count; i++) {
                const angle = (i - (count-1)/2) * 0.15; 
                this.state.bullets.push({
                    x: pl.x + 30, y: pl.y,
                    vx: Math.cos(angle) * 15, vy: Math.sin(angle) * 15, isPlayer: true
                });
            }
        },

        fireDroneBullet: function() {
            const pl = this.state.player;
            const time = Date.now()/400;
            const enemies = this.state.enemies;
            for(let i=0; i<pl.drones; i++) {
                const a = time + (Math.PI*2/pl.drones)*i;
                const dx = pl.x + Math.cos(a)*60;
                const dy = pl.y + Math.sin(a)*60;
                let target = null, minDist = 9999;
                enemies.forEach(e => {
                    const dist = Math.hypot(e.x - dx, e.y - dy);
                    if (dist < minDist && dist < 400) { minDist = dist; target = e; }
                });
                let vx = 10, vy = 0;
                if (target) {
                    const angle = Math.atan2(target.y - dy, target.x - dx);
                    vx = Math.cos(angle) * 10; vy = Math.sin(angle) * 10;
                }
                this.state.bullets.push({ x: dx, y: dy, vx: vx, vy: vy, isPlayer: true });
            }
        },

        // [NEW] 적 총알 발사
        fireEnemyBullet: function(enemy) {
            // 플레이어 방향으로 발사
            const pl = this.state.player;
            const angle = Math.atan2(pl.y - enemy.y, pl.x - enemy.x);
            const speed = 7;
            this.state.bullets.push({
                x: enemy.x - 20, y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                isPlayer: false
            });
        },

        hitPlayer: function(damage) {
            const pl = this.state.player;
            pl.hp -= damage;
            this.state.cameraShake = 15;
            this.spawnParticles(pl.x, pl.y, '#ff4757', 10);
            this.updateHUD();
            if(pl.hp <= 0) this.gameOver();
        },

        spawnEnemy: function() {
            const isBoss = (this.state.level % 5 === 0) && (this.state.enemies.length === 0);
            const x = this.width + 60;
            const y = Math.random() * (this.height - 60) + 30;

            this.state.enemies.push({
                x: x, y: y,
                hp: isBoss ? 500 * this.state.level : 20 + this.state.level * 5,
                maxHp: isBoss ? 500 : 20,
                speed: isBoss ? 1 : 3 + Math.random() * 2,
                r: isBoss ? 70 : 30,
                type: isBoss ? 'boss' : 'normal',
                exp: isBoss ? 100 : 10,
                shotDelay: isBoss ? 60 : 120 + Math.random() * 60, // 적 발사 딜레이
                shotTimer: Math.random() * 100
            });
        },

        enemyDie: function(e) {
            this.spawnParticles(e.x, e.y, '#f39c12', 15);
            this.state.gems.push({ x: e.x, y: e.y, val: e.exp });
            this.state.score += e.exp * 10;
            this.updateHUD();
        },

        addExp: function(amount) {
            this.state.exp += amount;
            if (this.state.exp >= this.state.maxExp) {
                this.state.exp -= this.state.maxExp;
                this.state.maxExp = Math.floor(this.state.maxExp * 1.2);
                this.levelUp();
            }
            this.updateHUD();
        },

        levelUp: function() {
            this.state.level++;
            this.showScreen('ui-levelup');
            const choices = [];
            while(choices.length < 3) {
                const s = SKILLS[Math.floor(Math.random() * SKILLS.length)];
                if(!choices.includes(s)) choices.push(s);
            }
            const container = document.getElementById('ui-cards');
            container.innerHTML = '';
            choices.forEach(skill => {
                const skillInfo = getSkillInfo(skill.id);
                const card = document.createElement('div');
                card.className = 'skill-card';
                let bgStyle = 'background: #555';
                if (Assets.images[skill.icon]) {
                    const src = Assets.images[skill.icon].src;
                    bgStyle = `background-image: url('${src}'); mix-blend-mode: screen;`;
                }
                card.innerHTML = `<div class="skill-icon" style="${bgStyle}"></div><div class="skill-info"><div class="skill-name">${skillInfo.name}</div><div class="skill-desc">${skillInfo.desc}</div></div>`;
                card.onclick = () => this.applySkill(skill);
                container.appendChild(card);
            });
        },

        applySkill: function(skill) {
            const pl = this.state.player;
            if (skill.type === 'stat') pl[skill.stat] *= skill.val;
            else if (skill.id === 'multi') pl.bulletCount++;
            else if (skill.id === 'heal') pl.hp = Math.min(pl.maxHp, pl.hp + pl.maxHp * 0.5);
            else if (skill.id === 'drone') pl.drones++;
            this.showScreen(null); this.updateHUD();
        },

        spawnParticles: function(x, y, color, count) {
            for(let i=0; i<count; i++) {
                this.state.particles.push({
                    x: x, y: y,
                    vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8,
                    color: color, life: 1.0, size: Math.random()*4+2
                });
            }
        },

        updateHUD: function() {
            document.getElementById('ui-score').innerText = this.state.score;
            document.getElementById('ui-lv').innerText = 'LV.' + this.state.level;
            const expPct = (this.state.exp / this.state.maxExp) * 100;
            document.getElementById('ui-exp').style.width = `${expPct}%`;
            const hpPct = (this.state.player.hp / this.state.player.maxHp) * 100;
            document.getElementById('ui-hp').style.width = `${Math.max(0, hpPct)}%`;
        },

        gameOver: function() {
            document.getElementById('ui-final-score').innerText = `SCORE: ${this.state.score}`;
            this.showScreen('ui-gameover');
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();