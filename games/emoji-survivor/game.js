(function() {
    'use strict';

    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t && I18n.translations && Object.keys(I18n.translations).length > 0) {
            const fullKey = `gameDetails.emoji-survivor.ui.${key}`;
            const value = I18n.t(fullKey, defaultValue);
            if (value === fullKey || value === defaultValue) {
                return defaultValue;
            }
            return value;
        }
        return defaultValue;
    }

    // Helper function to get weapon info
    function getWeaponInfo(weaponId) {
        const nameKey = `weapons.${weaponId}.name`;
        const descKey = `weapons.${weaponId}.desc`;
        const defaultWeapon = WEAPONS[weaponId] || {};
        return {
            name: getUIText(nameKey, defaultWeapon.name || ''),
            desc: getUIText(descKey, defaultWeapon.desc || '')
        };
    }

    // ================= DATA =================
    const WEAPONS = {
        magic: { name: '매직 미사일', icon: '✨', desc: '가장 가까운 적에게 마법 발사', type: 'projectile', dmg: 10, cd: 60, speed: 8, count: 1 },
        axe:   { name: '회전 도끼',   icon: '🪓', desc: '하늘로 도끼를 던져 범위 공격', type: 'lob',        dmg: 20, cd: 90, area: 60, count: 1 },
        garlic:{ name: '마늘 오라',   icon: '🧄', desc: '주변 적에게 지속 피해',       type: 'aura',       dmg: 2,  cd: 10, area: 80 }, // cd는 틱 간격
        lightning: { name: '벼락',    icon: '⚡', desc: '랜덤한 적에게 벼락이 떨어짐', type: 'instant',    dmg: 50, cd: 120, count: 1 },
        shoes: { name: '운동화',      icon: '👟', desc: '이동 속도 증가',             type: 'passive',    stat: 'speed', val: 0.5 }
    };

    const ENEMIES = [
        { id: 'zombie', icon: '🧟', hp: 20, speed: 1.5, xp: 1, color: '#8BC34A' },
        { id: 'bat',    icon: '🦇', hp: 10, speed: 2.5, xp: 1, color: '#9E9E9E' },
        { id: 'skull',  icon: '💀', hp: 50, speed: 1.0, xp: 3, color: '#ECEFF1' },
        { id: 'ghost',  icon: '👻', hp: 30, speed: 1.8, xp: 2, color: '#E0E0E0' },
        { id: 'boss',   icon: '👹', hp: 500,speed: 2.0, xp:50, color: '#FF5252', size: 60 }
    ];

    // ================= GAME ENGINE =================
    const Game = {
        canvas: null, ctx: null,
        width: 0, height: 0,
        loopId: null,
        
        state: {
            screen: 'start', // start, playing, levelup, gameover
            time: 0,
            player: { x:0, y:0, hp:100, maxHp:100, speed:3, dir:1, weapons:{} },
            enemies: [],
            gems: [],
            bullets: [],
            numbers: [], // Damage numbers
            xp: 0, nextXp: 10, level: 1, kill: 0,
            camera: { x:0, y:0 },
            joystick: { active:false, dx:0, dy:0, originX:0, originY:0, ptrId:null },
            keys: { w:false, a:false, s:false, d:false }
        },

        init: function(container) {
            this.container = container;
            this.renderLayout();
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            
            // Input Setup
            this.setupInputs();
            
            // 언어 변경 이벤트 리스너 추가
            document.addEventListener('i18n:loaded', () => {
                if (this.state.screen === 'levelup') {
                    this.renderLevelup();
                }
            });
            
            if (this.loopId) cancelAnimationFrame(this.loopId);
            this.loop();
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="es-wrapper">
                    <canvas id="game-canvas"></canvas>
                    
                    <div class="es-hud" id="ui-hud" style="display:none">
                        <div class="es-top-row">
                            <div class="es-timer" id="ui-timer">00:00</div>
                            <div class="es-kill">💀 <span id="ui-kill">0</span></div>
                        </div>
                        <div style="position:relative; margin-top:5px;">
                            <div class="es-exp-bar"><div class="es-exp-fill" id="ui-exp"></div></div>
                            <div class="es-level-badge" id="ui-level">1</div>
                        </div>
                        <div style="margin-top:5px; height:6px; background:#333; border-radius:3px; overflow:hidden; width:200px;">
                            <div id="ui-hp" style="width:100%; height:100%; background:#f44336;"></div>
                        </div>
                    </div>

                    <div class="es-joystick-zone" id="ui-joy" style="display:none">
                        <div class="es-knob" id="ui-knob"></div>
                    </div>

                    <div class="es-modal" id="modal-levelup">
                        <div class="es-levelup-title">LEVEL UP!</div>
                        <div class="es-cards" id="ui-cards"></div>
                    </div>

                    <div class="es-modal active" id="modal-start">
                        <h1 style="font-size:4rem; margin-bottom:10px;">🧙‍♂️</h1>
                        <h1 style="font-size:3rem; color:#fff; margin-bottom:20px;">EMOJI SURVIVOR</h1>
                        <p style="color:#aaa; margin-bottom:30px;">Survive the endless horde!</p>
                        <button class="es-btn" onclick="Game.startGame()">GAME START</button>
                    </div>
                </div>
            `;
        },

        setupInputs: function() {
            // Keyboard
            window.addEventListener('keydown', e => this.handleKey(e, true));
            window.addEventListener('keyup', e => this.handleKey(e, false));

            // Virtual Joystick (Touch)
            const zone = document.getElementById('ui-joy');
            const knob = document.getElementById('ui-knob');
            
            const handleTouch = (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                if(e.type === 'touchstart') {
                    this.state.joystick.active = true;
                    this.state.joystick.ptrId = touch.identifier;
                    this.state.joystick.originX = touch.clientX;
                    this.state.joystick.originY = touch.clientY;
                } else if(e.type === 'touchmove' && this.state.joystick.active) {
                    const dx = touch.clientX - this.state.joystick.originX;
                    const dy = touch.clientY - this.state.joystick.originY;
                    const dist = Math.min(50, Math.hypot(dx, dy));
                    const angle = Math.atan2(dy, dx);
                    
                    const kx = Math.cos(angle) * dist;
                    const ky = Math.sin(angle) * dist;
                    
                    knob.style.transform = `translate(${kx}px, ${ky}px)`;
                    
                    this.state.joystick.dx = kx / 50; // Normalize -1 to 1
                    this.state.joystick.dy = ky / 50;
                } else if(e.type === 'touchend') {
                    this.state.joystick.active = false;
                    this.state.joystick.dx = 0;
                    this.state.joystick.dy = 0;
                    knob.style.transform = `translate(0px, 0px)`;
                }
            };
            
            zone.addEventListener('touchstart', handleTouch);
            zone.addEventListener('touchmove', handleTouch);
            zone.addEventListener('touchend', handleTouch);
        },

        handleKey: function(e, isDown) {
            const k = e.key.toLowerCase();
            if(k==='w'||k==='arrowup') this.state.keys.w = isDown;
            if(k==='a'||k==='arrowleft') this.state.keys.a = isDown;
            if(k==='s'||k==='arrowdown') this.state.keys.s = isDown;
            if(k==='d'||k==='arrowright') this.state.keys.d = isDown;
        },

        resize: function() {
            if(!this.container) return;
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        },

        startGame: function() {
            document.querySelectorAll('.es-modal').forEach(el => el.classList.remove('active'));
            document.getElementById('ui-hud').style.display = 'flex';
            
            // Mobile check for joystick
            if('ontouchstart' in window) document.getElementById('ui-joy').style.display = 'flex';

            this.state = {
                screen: 'playing',
                time: 0,
                player: { x:0, y:0, hp:100, maxHp:100, speed:3, dir:1, weapons:{magic:1}, cooldowns:{} },
                enemies: [],
                gems: [],
                bullets: [],
                numbers: [],
                xp: 0, nextXp: 10, level: 1, kill: 0,
                camera: { x:0, y:0 },
                joystick: { active:false, dx:0, dy:0, originX:0, originY:0 },
                keys: { w:false, a:false, s:false, d:false }
            };
            this.updateUI();
        },

        // --- CORE LOGIC ---
        update: function() {
            const st = this.state;
            st.time++;

            // 1. Player Move
            let dx = 0, dy = 0;
            if (st.keys.w) dy = -1;
            if (st.keys.s) dy = 1;
            if (st.keys.a) dx = -1;
            if (st.keys.d) dx = 1;
            
            if (st.joystick.active) {
                dx = st.joystick.dx;
                dy = st.joystick.dy;
            }

            // Normalize
            const len = Math.hypot(dx, dy);
            if (len > 0.1) {
                const speed = st.player.speed;
                st.player.x += (dx / len) * speed * (len > 1 ? 1 : len); // Analog control
                st.player.y += (dy / len) * speed * (len > 1 ? 1 : len);
                if(dx !== 0) st.player.dir = Math.sign(dx);
            }

            // Camera Follow
            st.camera.x = st.player.x - this.width/2;
            st.camera.y = st.player.y - this.height/2;

            // 2. Spawn Enemies
            // Spawn rate increases with time
            const spawnRate = Math.max(10, 60 - Math.floor(st.time / 600)); 
            if (st.time % spawnRate === 0 && st.enemies.length < 300) {
                this.spawnEnemy();
            }

            // 3. Enemy Logic
            const px = st.player.x;
            const py = st.player.y;
            
            for (let i = st.enemies.length - 1; i >= 0; i--) {
                const e = st.enemies[i];
                const dist = Math.hypot(px - e.x, py - e.y);
                
                // Move towards player
                if (dist > 20) {
                    e.x += ((px - e.x) / dist) * e.speed;
                    e.y += ((py - e.y) / dist) * e.speed;
                } else {
                    // Attack Player
                    if (st.time % 30 === 0) {
                        st.player.hp -= 5;
                        this.showDamage(px, py, 5, 'red');
                        this.updateUI();
                        if(st.player.hp <= 0) this.gameOver();
                    }
                }
                
                // Despawn if too far
                if (dist > 1500) st.enemies.splice(i, 1);
            }

            // 4. Weapons
            this.updateWeapons();

            // 5. Bullets
            for (let i = st.bullets.length - 1; i >= 0; i--) {
                const b = st.bullets[i];
                b.life--;
                if (b.life <= 0) { st.bullets.splice(i, 1); continue; }

                b.x += b.vx;
                b.y += b.vy;
                
                // Rotation
                b.rot += 0.2;

                // Collision
                let hit = false;
                for (const e of st.enemies) {
                    if (Math.hypot(e.x - b.x, e.y - b.y) < (e.size||20) + b.size) {
                        e.hp -= b.dmg;
                        this.showDamage(e.x, e.y, b.dmg);
                        
                        // Pushback
                        const push = 10;
                        const angle = Math.atan2(e.y - b.y, e.x - b.x);
                        e.x += Math.cos(angle) * push;
                        e.y += Math.sin(angle) * push;

                        if (e.hp <= 0) this.killEnemy(e);
                        
                        if (!b.pierce) { hit = true; break; }
                    }
                }
                if (hit) st.bullets.splice(i, 1);
            }

            // 6. Gems (Magnet)
            for (let i = st.gems.length - 1; i >= 0; i--) {
                const g = st.gems[i];
                const dist = Math.hypot(px - g.x, py - g.y);
                
                if (dist < 150) { // Magnet range
                    g.x += (px - g.x) * 0.1;
                    g.y += (py - g.y) * 0.1;
                }
                
                if (dist < 20) {
                    st.xp += g.val;
                    st.gems.splice(i, 1);
                    this.checkLevelUp();
                }
            }

            // 7. Damage Numbers (Float up)
            st.numbers.forEach(n => { n.y -= 1; n.life--; });
            st.numbers = st.numbers.filter(n => n.life > 0);
        },

        spawnEnemy: function() {
            const st = this.state;
            // Spawn at edge of screen
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.max(this.width, this.height) / 2 + 100;
            const cx = st.player.x + Math.cos(angle) * dist;
            const cy = st.player.y + Math.sin(angle) * dist;
            
            // Random Type based on time
            let type = ENEMIES[0]; // Zombie
            if(st.time > 1800 && Math.random()<0.3) type = ENEMIES[1]; // Bat
            if(st.time > 3600 && Math.random()<0.3) type = ENEMIES[2]; // Skull
            if(st.time % 1800 === 0) type = ENEMIES[4]; // Boss

            st.enemies.push({
                x: cx, y: cy,
                ...type,
                maxHp: type.hp * (1 + st.time/3600), // HP scaling
                hp: type.hp * (1 + st.time/3600)
            });
        },

        updateWeapons: function() {
            const st = this.state;
            const p = st.player;

            for (let key in p.weapons) {
                const level = p.weapons[key];
                const data = WEAPONS[key];
                
                if (!p.cooldowns[key]) p.cooldowns[key] = 0;
                if (p.cooldowns[key] > 0) p.cooldowns[key]--;
                else {
                    // Fire!
                    if (data.type === 'projectile') {
                        // Find nearest
                        let target = null;
                        let minDist = 600;
                        st.enemies.forEach(e => {
                            const d = Math.hypot(e.x - p.x, e.y - p.y);
                            if(d < minDist) { minDist = d; target = e; }
                        });

                        if (target) {
                            const angle = Math.atan2(target.y - p.y, target.x - p.x);
                            st.bullets.push({
                                x: p.x, y: p.y,
                                vx: Math.cos(angle)*data.speed, vy: Math.sin(angle)*data.speed,
                                dmg: data.dmg * level, life: 100, size: 10, color: '#FFEB3B', icon: data.icon, rot:0
                            });
                            p.cooldowns[key] = Math.max(10, data.cd - level * 5);
                        }
                    } else if (data.type === 'aura') {
                        // Garlic
                        if (st.time % data.cd === 0) {
                            st.enemies.forEach(e => {
                                if (Math.hypot(e.x - p.x, e.y - p.y) < data.area + (level * 10)) {
                                    e.hp -= data.dmg * level;
                                    this.showDamage(e.x, e.y, data.dmg * level, '#fff', 0.5); // quiet damage
                                    if(e.hp<=0) this.killEnemy(e);
                                }
                            });
                        }
                    } else if (data.type === 'lob') {
                        // Axe
                        for(let i=0; i<level; i++) {
                            const angle = -Math.PI/2 + (Math.random()-0.5); // Upwards
                            st.bullets.push({
                                x: p.x, y: p.y,
                                vx: Math.cos(angle)*5, vy: Math.sin(angle)*5 + (Math.random()*2), // Gravity applied in draw? No, simple physics here
                                dmg: data.dmg * level, life: 60, size: 20, color: '#f00', icon: data.icon, rot:0,
                                pierce: true
                            });
                        }
                        p.cooldowns[key] = Math.max(20, data.cd - level*2);
                    } else if (data.type === 'instant') {
                        // Lightning
                        for(let i=0; i<level; i++) {
                            if(st.enemies.length > 0) {
                                const t = st.enemies[Math.floor(Math.random()*st.enemies.length)];
                                t.hp -= data.dmg * level;
                                this.showDamage(t.x, t.y, data.dmg*level, '#ffeb3b');
                                // Visual effect
                                st.numbers.push({x:t.x, y:t.y-20, text:'⚡', color:'#ffeb3b', life:20, size:30});
                                if(t.hp<=0) this.killEnemy(t);
                            }
                        }
                        p.cooldowns[key] = Math.max(30, data.cd - level * 5);
                    }
                }
            }
        },

        killEnemy: function(e) {
            const st = this.state;
            st.kill++;
            st.gems.push({x: e.x, y: e.y, val: e.xp});
            const idx = st.enemies.indexOf(e);
            if(idx > -1) st.enemies.splice(idx, 1);
            this.updateUI();
        },

        checkLevelUp: function() {
            const st = this.state;
            if (st.xp >= st.nextXp) {
                st.xp -= st.nextXp;
                st.level++;
                st.nextXp = Math.floor(st.nextXp * 1.2);
                this.showLevelUp();
            }
            this.updateUI();
        },

        showLevelUp: function() {
            this.state.screen = 'levelup';
            
            const cards = [];
            const keys = Object.keys(WEAPONS);
            // Random 3 choices
            for(let i=0; i<3; i++) {
                const k = keys[Math.floor(Math.random()*keys.length)];
                cards.push({id:k, ...WEAPONS[k]});
            }

            const container = document.getElementById('ui-cards');
            container.innerHTML = '';
            cards.forEach(c => {
                const curLv = this.state.player.weapons[c.id] || 0;
                const el = document.createElement('div');
                el.className = 'es-card';
                el.innerHTML = `
                    <div class="es-card-icon">${c.icon}</div>
                    <div class="es-card-name">${c.name}</div>
                    <div class="es-card-desc">${c.desc}</div>
                    <div class="es-card-lv">${curLv === 0 ? 'NEW!' : 'LV ' + (curLv+1)}</div>
                `;
                el.onclick = () => this.selectUpgrade(c.id);
                container.appendChild(el);
            });

            document.getElementById('modal-levelup').classList.add('active');
        },

        selectUpgrade: function(id) {
            const st = this.state;
            if (!st.player.weapons[id]) st.player.weapons[id] = 0;
            st.player.weapons[id]++;
            
            // Passive apply
            if(WEAPONS[id].type === 'passive') {
                if(WEAPONS[id].stat === 'speed') st.player.speed += WEAPONS[id].val;
            }

            st.player.hp = Math.min(st.player.maxHp, st.player.hp + 20); // Heal on level up
            
            document.getElementById('modal-levelup').classList.remove('active');
            st.screen = 'playing';
            this.updateUI();
        },

        showDamage: function(x, y, dmg, color='#fff', size=20) {
            this.state.numbers.push({
                x: x, y: y,
                text: Math.floor(dmg),
                color: color,
                life: 30,
                size: size
            });
        },

        gameOver: function() {
            this.state.screen = 'gameover';
            alert(`GAME OVER! You survived for ${document.getElementById('ui-timer').innerText}`);
            location.reload();
        },

        // --- RENDER ---
        draw: function() {
            const ctx = this.ctx;
            const st = this.state;
            const cam = st.camera;

            // Clear (Dark Background)
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, this.width, this.height);

            // Grid Lines (Ground effect)
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            const gridSize = 100;
            const ox = -cam.x % gridSize;
            const oy = -cam.y % gridSize;
            
            ctx.beginPath();
            for(let x=ox; x<this.width; x+=gridSize) { ctx.moveTo(x,0); ctx.lineTo(x,this.height); }
            for(let y=oy; y<this.height; y+=gridSize) { ctx.moveTo(0,y); ctx.lineTo(this.width,y); }
            ctx.stroke();

            // Gems
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            st.gems.forEach(g => {
                if(g.x-cam.x > -20 && g.x-cam.x < this.width+20 && g.y-cam.y > -20 && g.y-cam.y < this.height+20) {
                    ctx.font = '20px Arial';
                    ctx.fillText('💎', g.x - cam.x, g.y - cam.y);
                }
            });

            // Enemies
            st.enemies.forEach(e => {
                const sx = e.x - cam.x;
                const sy = e.y - cam.y;
                // Culling
                if(sx < -50 || sx > this.width + 50 || sy < -50 || sy > this.height + 50) return;

                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.beginPath(); ctx.ellipse(sx, sy+15, 15, 8, 0, 0, Math.PI*2); ctx.fill();

                // Sprite
                ctx.font = (e.size || 30) + 'px Arial';
                // Flip if moving left
                ctx.save();
                ctx.translate(sx, sy);
                if (st.player.x < e.x) ctx.scale(-1, 1);
                ctx.fillText(e.icon, 0, 0);
                ctx.restore();
            });

            // Player
            const px = st.player.x - cam.x;
            const py = st.player.y - cam.y;
            
            // Aura Visual
            if(st.player.weapons['garlic']) {
                const lv = st.player.weapons['garlic'];
                const radius = WEAPONS['garlic'].area + (lv*10);
                ctx.fillStyle = `rgba(255, 255, 200, ${0.1 + Math.sin(st.time*0.1)*0.05})`;
                ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 200, 0.3)';
                ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI*2); ctx.stroke();
            }

            // Player Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath(); ctx.ellipse(px, py+15, 15, 8, 0, 0, Math.PI*2); ctx.fill();
            
            // Player Sprite
            ctx.font = '40px Arial';
            ctx.save();
            ctx.translate(px, py);
            ctx.scale(st.player.dir, 1);
            ctx.fillText('🧙‍♂️', 0, 0);
            ctx.restore();

            // Bullets
            st.bullets.forEach(b => {
                ctx.font = (b.size || 20) + 'px Arial';
                ctx.save();
                ctx.translate(b.x - cam.x, b.y - cam.y);
                ctx.rotate(b.rot);
                ctx.fillText(b.icon, 0, 0);
                ctx.restore();
            });

            // Damage Numbers
            st.numbers.forEach(n => {
                ctx.fillStyle = n.color;
                ctx.font = `bold ${n.size}px Arial`;
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.strokeText(n.text, n.x - cam.x, n.y - cam.y);
                ctx.fillText(n.text, n.x - cam.x, n.y - cam.y);
            });
        },

        updateUI: function() {
            // HP
            const p = this.state.player;
            document.getElementById('ui-hp').style.width = (p.hp / p.maxHp * 100) + '%';
            
            // XP
            const st = this.state;
            document.getElementById('ui-exp').style.width = (st.xp / st.nextXp * 100) + '%';
            document.getElementById('ui-level').innerText = st.level;
            
            // Stats
            document.getElementById('ui-kill').innerText = st.kill;
            
            // Timer
            const m = Math.floor(st.time / 3600); // 60fps * 60s
            const s = Math.floor((st.time / 60) % 60);
            document.getElementById('ui-timer').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        },

        loop: function() {
            this.loopId = requestAnimationFrame(() => this.loop());
            if (this.state.screen === 'playing') {
                this.update();
                this.draw();
            }
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();