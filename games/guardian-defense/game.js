(function() {
    'use strict';

    // ================= CONFIG =================
    const GAME_W = 800;
    const GAME_H = 450;
    const TILE_SIZE = 40; 
    const COLS = 20; 
    const ROWS = 11.25;

    // 타워 데이터
    const TOWERS = {
        archer:   { name: '아처', icon: '🏹', range: 140, damage: 15, rate: 40,  target: 'both',   color: '#4CAF50', desc: '기본 타워\n지상+공중' },
        cannon:   { name: '캐논', icon: '💣', range: 130, damage: 40, rate: 100, target: 'ground', color: '#212121', desc: '범위 공격\n지상 전용' },
        ballista: { name: '발리스타', icon: '🦂', range: 250, damage: 80, rate: 90,  target: 'air',    color: '#795548', desc: '강력한 한방\n공중 전용' },
        ice:      { name: '아이스', icon: '❄️', range: 110, damage: 5,  rate: 50,  target: 'both',   color: '#03A9F4', desc: '이동속도 감소\n지상+공중' },
        thunder:  { name: '썬더', icon: '⚡', range: 150, damage: 25, rate: 70,  target: 'both',   color: '#FFEB3B', desc: '3마리 연쇄\n지상+공중' },
        sniper:   { name: '스나이퍼', icon: '🎯', range: 350, damage: 150,rate: 150, target: 'both',   color: '#607D8B', desc: '초장거리 저격\n지상+공중' }
    };

    // 적 데이터
    const ENEMIES = {
        goblin:  { hp: 30,  speed: 1.5, fly: false, reward: 3,  color: '#8BC34A', r: 10 },
        orc:     { hp: 100, speed: 0.8, fly: false, reward: 8,  color: '#5D4037', r: 14 },
        gargoyle:{ hp: 50,  speed: 1.0, fly: true,  reward: 10, color: '#5C6BC0', r: 12 },
        boss_orc:{ hp: 800, speed: 0.5, fly: false, reward: 100,color: '#E91E63', r: 20 },
        dragon:  { hp: 1500,speed: 0.6, fly: true,  reward: 200,color: '#D32F2F', r: 30 }
    };

    // 카드 데이터
    const CARDS = [
        { id: 't_archer', type:'tower', val:'archer', count:2, title:'아처 타워 x2', icon:'🏹', desc:'아처 타워 2개를 획득합니다.' },
        { id: 't_cannon', type:'tower', val:'cannon', count:1, title:'캐논 타워 x1', icon:'💣', desc:'캐논 타워 1개를 획득합니다.' },
        { id: 't_ballista',type:'tower',val:'ballista',count:1,title:'발리스타 x1',icon:'🦂', desc:'발리스타 타워 1개를 획득합니다.' },
        { id: 't_ice',    type:'tower', val:'ice',    count:1, title:'아이스 x1',  icon:'❄️', desc:'아이스 타워 1개를 획득합니다.' },
        { id: 't_thunder',type:'tower', val:'thunder',count:1, title:'썬더 x1',    icon:'⚡', desc:'썬더 타워 1개를 획득합니다.' },
        { id: 't_sniper', type:'tower', val:'sniper', count:1, title:'스나이퍼 x1',icon:'🎯', desc:'스나이퍼 타워 1개를 획득합니다.' },
        { id: 'b_dmg',    type:'buff',  val:'damage', rate:1.2,title:'공격력 강화', icon:'⚔️', desc:'모든 타워 공격력 +20%' },
        { id: 'b_spd',    type:'buff',  val:'rate',   rate:0.85,title:'공속 강화',   icon:'⏩', desc:'모든 타워 공격속도 +15%' },
        { id: 'b_rng',    type:'buff',  val:'range',  rate:1.2,title:'사거리 증가', icon:'🔭', desc:'모든 타워 사거리 +20%' },
        { id: 'r_gold',   type:'res',   val:'gold',   amount:150,title:'보급품: 골드',icon:'💰', desc:'150 골드를 획득합니다.' },
        { id: 'r_life',   type:'res',   val:'life',   amount:5,  title:'성벽 수리',   icon:'❤️', desc:'라이프를 5 회복합니다.' }
    ];

    // ================= GAME ENGINE =================
    const Game = {
        canvas: null, ctx: null,
        
        state: {
            screen: 'start',
            wave: 0, maxWave: 20,
            gold: 100, lives: 20,
            map: [], path: [], 
            towers: [], enemies: [], projectiles: [], particles: [],
            inventory: { archer:2, cannon:0, ballista:0, ice:0, thunder:0, sniper:0 },
            buffs: { damage:1, rate:1, range:1 },
            
            selectedSlot: null,
            selectedTower: null,
            
            waveActive: false,
            spawnQueue: [],
            spawnTimer: 0,
            gameSpeed: 1,
            
            mouseX: 0, mouseY: 0
        },

        init: function(container) {
            this.container = container;
            this.renderLayout();
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            this.canvas.width = GAME_W;
            this.canvas.height = GAME_H;
            
            // Mouse Events
            const trackMouse = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const cx = e.touches ? e.touches[0].clientX : e.clientX;
                const cy = e.touches ? e.touches[0].clientY : e.clientY;
                
                // 가로/세로 비율 각각 계산 (터치 좌표 보정)
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                
                this.state.mouseX = (cx - rect.left) * scaleX;
                this.state.mouseY = (cy - rect.top) * scaleY;
            };

            this.canvas.addEventListener('mousemove', trackMouse);
            this.canvas.addEventListener('touchmove', trackMouse);

            this.canvas.addEventListener('mousedown', e => { 
                trackMouse(e); 
                this.handleClick(); 
            });
            this.canvas.addEventListener('touchstart', e => { 
                e.preventDefault(); 
                trackMouse(e); 
                this.handleClick(); 
            });
            
            if(this.loopId) cancelAnimationFrame(this.loopId);
            this.loop();
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="gd-wrapper">
                    <div class="gd-screen">
                        <div class="gd-header">
                            <div class="gd-stat"><span class="gd-icon">❤️</span> <span id="ui-lives">20</span></div>
                            <div class="gd-stat"><span class="gd-wave-badge" id="ui-wave">WAVE 1/20</span></div>
                            <div class="gd-stat"><span class="gd-icon">💰</span> <span id="ui-gold">100</span></div>
                        </div>
                        
                        <div class="gd-game-area" id="game-area">
                            <canvas id="game-canvas"></canvas>
                            <div class="gd-upgrade-menu" id="ui-upgrade">
                                <div id="up-info" style="font-weight:bold; font-size:0.9rem; margin-bottom:5px;">LV.1 Archer</div>
                                <button class="gd-up-btn" id="btn-up" onclick="Game.upgradeTower()">UPGRADE (50G)</button>
                                <button class="gd-up-btn sell" onclick="Game.sellTower()">SELL (30G)</button>
                            </div>
                        </div>

                        <div class="gd-controls" id="ui-controls">
                            <button class="gd-btn speed" id="btn-speed" onclick="Game.toggleSpeed()">x1</button>
                            ${this.renderSlots()}
                            <button class="gd-btn" id="btn-next" onclick="Game.startWave()">START</button>
                        </div>

                        <div class="gd-modal" id="modal-draft">
                            <h2 style="color:#fff; font-size:2rem; margin-bottom:10px;">REINFORCEMENTS</h2>
                            <p style="color:#aaa;">Choose one reward</p>
                            <div class="gd-card-container" id="ui-cards"></div>
                        </div>

                        <div class="gd-modal active" id="modal-start">
                            <h1 style="font-size:3rem; color:#4CAF50; margin-bottom:20px;">GUARDIAN DEFENSE</h1>
                            <p style="color:#ddd; margin-bottom:30px;">Build Towers, Draft Cards, Survive!</p>
                            <button class="gd-btn" style="padding:15px 40px;" onclick="Game.startGame()">GAME START</button>
                        </div>
                    </div>
                </div>
            `;
        },

        renderSlots: function() {
            let html = '';
            for(let key in TOWERS) {
                html += `
                    <div class="gd-tower-slot" id="slot-${key}" onclick="Game.selectSlot('${key}')">
                        <span class="gd-tower-icon">${TOWERS[key].icon}</span>
                        <span class="gd-tower-count" id="cnt-${key}">0</span>
                    </div>
                `;
            }
            return html;
        },

        startGame: function() {
            document.getElementById('modal-start').classList.remove('active');
            this.initMap();
            
            this.state.screen = 'playing';
            this.state.wave = 0;
            this.state.gold = 100;
            this.state.lives = 20;
            this.state.towers = [];
            this.state.enemies = [];
            this.state.projectiles = [];
            this.state.particles = [];
            this.state.inventory = { archer:2, cannon:0, ballista:0, ice:0, thunder:0, sniper:0 };
            this.state.buffs = { damage:1, rate:1, range:1 };
            
            this.updateUI();
            this.showDraft(); 
        },

        initMap: function() {
            const cols = COLS;
            const rows = Math.ceil(ROWS);
            const map = new Array(rows).fill(0).map(() => new Array(cols).fill(1)); // 1: Grass
            const path = [];

            // S-Shape Path
            const points = [
                {x:0, y:2}, {x:4, y:2}, {x:4, y:8}, {x:10, y:8}, 
                {x:10, y:3}, {x:16, y:3}, {x:16, y:9}, {x:20, y:9}
            ];

            const addP = (x, y) => { 
                if(y<rows && x<cols) map[y][x] = 0; // 0: Path
                path.push({x: x*TILE_SIZE + TILE_SIZE/2, y: y*TILE_SIZE + TILE_SIZE/2}); 
            };

            for(let i=0; i<points.length-1; i++) {
                let p1 = points[i];
                let p2 = points[i+1];
                let dx = Math.sign(p2.x - p1.x);
                let dy = Math.sign(p2.y - p1.y);
                let x = p1.x, y = p1.y;
                while(x !== p2.x || y !== p2.y) {
                    addP(x, y); x += dx; y += dy;
                }
            }
            addP(points[points.length-1].x, points[points.length-1].y);

            this.state.map = map;
            this.state.path = path;
        },

        startWave: function() {
            if (this.state.waveActive) return;
            this.state.wave++;
            this.state.waveActive = true;
            this.state.spawnTimer = 0;
            
            const q = [];
            const w = this.state.wave;
            let count = 5 + Math.floor(w * 1.5);
            let types = [];

            if (w <= 3) types = ['goblin'];
            else if (w === 5) types = ['gargoyle', 'goblin'];
            else if (w === 10) { types = ['boss_orc']; count = 1; }
            else if (w === 20) { types = ['dragon']; count = 1; }
            else {
                types = ['goblin', 'orc'];
                if(w > 6) types.push('gargoyle');
                if(w > 12) types.push('orc', 'gargoyle');
            }

            for(let i=0; i<count; i++) q.push(types[Math.floor(Math.random() * types.length)]);
            this.state.spawnQueue = q;
            
            document.getElementById('btn-next').disabled = true;
            document.getElementById('btn-next').innerText = "COMBAT...";
            this.updateUI();
        },

        endWave: function() {
            this.state.waveActive = false;
            document.getElementById('btn-next').disabled = false;
            document.getElementById('btn-next').innerText = "NEXT WAVE";
            
            if (this.state.wave >= this.state.maxWave) {
                alert("VICTORY!");
                location.reload();
            } else {
                this.showDraft();
            }
        },

        showDraft: function() {
            this.state.screen = 'draft';
            const container = document.getElementById('ui-cards');
            container.innerHTML = '';
            
            const pool = [...CARDS];
            const choices = [];
            for(let i=0; i<3; i++) choices.push(pool[Math.floor(Math.random() * pool.length)]);

            choices.forEach(card => {
                const div = document.createElement('div');
                div.className = 'gd-card';
                div.innerHTML = `
                    <div class="gd-card-icon">${card.icon}</div>
                    <div class="gd-card-title">${card.title}</div>
                    <div class="gd-card-desc">${card.desc}</div>
                `;
                div.onclick = () => this.pickCard(card);
                container.appendChild(div);
            });
            document.getElementById('modal-draft').classList.add('active');
        },

        pickCard: function(card) {
            const st = this.state;
            if(card.type === 'tower') st.inventory[card.val] += card.count;
            else if(card.type === 'buff') st.buffs[card.val] *= card.rate;
            else if(card.type === 'res') {
                if(card.val === 'gold') st.gold += card.amount;
                if(card.val === 'life') st.lives += card.amount;
            }
            document.getElementById('modal-draft').classList.remove('active');
            this.state.screen = 'playing';
            this.updateUI();
        },

        selectSlot: function(type) {
            if(this.state.inventory[type] <= 0) return;
            this.state.selectedSlot = type;
            this.state.selectedTower = null;
            document.getElementById('ui-upgrade').style.display = 'none';
            document.querySelectorAll('.gd-tower-slot').forEach(e => e.classList.remove('selected'));
            document.getElementById(`slot-${type}`).classList.add('selected');
        },

        handleClick: function() {
            const gx = Math.floor(this.state.mouseX / TILE_SIZE);
            const gy = Math.floor(this.state.mouseY / TILE_SIZE);
            
            if(gx<0 || gy<0 || gx>=COLS || gy>=ROWS) return;

            if (this.state.selectedSlot) {
                if (this.state.map[gy][gx] === 1) {
                    const occupied = this.state.towers.find(t => t.gx === gx && t.gy === gy);
                    if (!occupied) this.buildTower(gx, gy, this.state.selectedSlot);
                }
            } else {
                const tower = this.state.towers.find(t => t.gx === gx && t.gy === gy);
                if (tower) {
                    this.state.selectedTower = tower;
                    const menu = document.getElementById('ui-upgrade');
                    
                    const rect = this.canvas.getBoundingClientRect();
                    const scaleX = rect.width / this.canvas.width; 
                    const scaleY = rect.height / this.canvas.height;
                    
                    const screenX = (gx * TILE_SIZE) * scaleX;
                    const screenY = (gy * TILE_SIZE) * scaleY;

                    menu.style.display = 'flex';
                    menu.style.left = screenX + 'px';
                    menu.style.top = (screenY - 70) + 'px';

                    const upCost = Math.floor(50 * Math.pow(1.5, tower.level-1));
                    document.getElementById('up-info').innerText = `LV.${tower.level} ${TOWERS[tower.type].name}`;
                    document.getElementById('btn-up').innerText = `UPGRADE (${upCost}G)`;
                } else {
                    document.getElementById('ui-upgrade').style.display = 'none';
                    this.state.selectedTower = null;
                }
            }
            this.updateUI();
        },

        buildTower: function(gx, gy, type) {
            const st = this.state;
            if(st.inventory[type] > 0) {
                st.inventory[type]--;
                st.towers.push({
                    gx, gy, x: gx*TILE_SIZE + TILE_SIZE/2, y: gy*TILE_SIZE + TILE_SIZE/2,
                    type: type, level: 1, cd: 0, data: TOWERS[type]
                });
                if(st.inventory[type] === 0) {
                    st.selectedSlot = null;
                    document.querySelectorAll('.gd-tower-slot').forEach(e => e.classList.remove('selected'));
                }
                this.updateUI();
            }
        },

        upgradeTower: function() {
            const t = this.state.selectedTower;
            if(!t) return;
            const cost = Math.floor(50 * Math.pow(1.5, t.level-1));
            if(this.state.gold >= cost) {
                this.state.gold -= cost;
                t.level++;
                document.getElementById('ui-upgrade').style.display = 'none';
                this.state.selectedTower = null;
                this.updateUI();
            }
        },

        sellTower: function() {
            const t = this.state.selectedTower;
            if(!t) return;
            this.state.gold += 30; 
            this.state.inventory[t.type]++;
            this.state.towers = this.state.towers.filter(tw => tw !== t);
            document.getElementById('ui-upgrade').style.display = 'none';
            this.state.selectedTower = null;
            this.updateUI();
        },

        toggleSpeed: function() {
            this.state.gameSpeed = this.state.gameSpeed === 1 ? 2 : 1;
            document.getElementById('btn-speed').innerText = 'x' + this.state.gameSpeed;
        },

        // --- UPDATE LOOP ---
        update: function() {
            const st = this.state;
            const speed = st.gameSpeed;

            // Spawner
            if(st.waveActive) {
                if(st.spawnQueue.length > 0) {
                    st.spawnTimer++;
                    if(st.spawnTimer > 40/speed) {
                        const type = st.spawnQueue.shift();
                        const data = ENEMIES[type];
                        const hpMult = 1 + (st.wave * 0.3);
                        st.enemies.push({
                            type: type, x: -20, y: st.path[0].y, pathIdx: 0,
                            hp: data.hp*hpMult, maxHp: data.hp*hpMult, speed: data.speed,
                            fly: data.fly, data: data, slow: 0,
                            r: data.r // [수정] 여기가 누락되었던 부분입니다!
                        });
                        st.spawnTimer = 0;
                    }
                } else if(st.enemies.length === 0) {
                    this.endWave();
                }
            }

            // Towers
            st.towers.forEach(t => {
                if(t.cd > 0) t.cd--;
                if(t.cd <= 0) {
                    const range = t.data.range * st.buffs.range;
                    let target = null;
                    const candidates = st.enemies.filter(e => {
                        if(Math.hypot(e.x-t.x, e.y-t.y) > range) return false;
                        if(t.data.target === 'ground' && e.fly) return false;
                        if(t.data.target === 'air' && !e.fly) return false;
                        return true;
                    });
                    if(candidates.length > 0) {
                        target = candidates[0]; // Simple first targeting
                        st.projectiles.push({
                            x: t.x, y: t.y, target: target, type: t.type,
                            damage: t.data.damage * st.buffs.damage * (1 + (t.level-1)*0.5),
                            speed: 10 * speed, active: true
                        });
                        t.cd = (t.data.rate / st.buffs.rate) / speed;
                    }
                }
            });

            // Projectiles
            for(let i=st.projectiles.length-1; i>=0; i--) {
                const p = st.projectiles[i];
                if(!st.enemies.includes(p.target)) { p.active=false; continue; }
                const dx = p.target.x - p.x;
                const dy = p.target.y - p.y;
                const dist = Math.hypot(dx, dy);
                if(dist < p.speed) {
                    p.target.hp -= p.damage;
                    if(p.type === 'ice') p.target.slow = 60;
                    if(p.type === 'cannon') {
                        st.enemies.forEach(e => {
                            if(!e.fly && Math.hypot(e.x - p.target.x, e.y - p.target.y) < 60) e.hp -= p.damage * 0.5;
                        });
                        this.spawnParticle(p.target.x, p.target.y, 'orange', 10);
                    }
                    p.active = false;
                } else {
                    p.x += (dx/dist) * p.speed;
                    p.y += (dy/dist) * p.speed;
                }
            }
            st.projectiles = st.projectiles.filter(p => p.active);

            // Enemies
            for(let i=st.enemies.length-1; i>=0; i--) {
                const e = st.enemies[i];
                let move = e.speed * speed;
                if(e.slow > 0) { move *= 0.6; e.slow--; }
                
                if(e.fly) {
                    e.x += move; 
                    if(e.x > GAME_W) { st.lives--; st.enemies.splice(i,1); this.updateUI(); if(st.lives<=0) this.gameOver(); continue; }
                } else {
                    const targetP = st.path[e.pathIdx+1];
                    if(!targetP) { st.lives--; st.enemies.splice(i,1); this.updateUI(); if(st.lives<=0) this.gameOver(); continue; }
                    const dx = targetP.x - e.x;
                    const dy = targetP.y - e.y;
                    if(Math.hypot(dx,dy) < move) {
                        e.x = targetP.x; e.y = targetP.y; e.pathIdx++;
                    } else {
                        e.x += (dx/Math.hypot(dx,dy)) * move;
                        e.y += (dy/Math.hypot(dx,dy)) * move;
                    }
                }
                if(e.hp <= 0) {
                    st.gold += e.data.reward;
                    st.enemies.splice(i, 1);
                    this.updateUI();
                }
            }
            // Particles
            st.particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.life-=0.1; });
            st.particles = st.particles.filter(p => p.life > 0);
        },

        gameOver: function() {
            this.state.screen = 'gameover';
            alert("GAME OVER");
            location.reload();
        },

        spawnParticle: function(x, y, color, count) {
            for(let i=0; i<count; i++) this.state.particles.push({x, y, vx:(Math.random()-0.5)*5, vy:(Math.random()-0.5)*5, life:1, color});
        },

        draw: function() {
            const ctx = this.ctx;
            // Background
            ctx.fillStyle = '#388E3C';
            ctx.fillRect(0, 0, GAME_W, GAME_H);

            // Grid
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            for (let x=0; x<=GAME_W; x+=TILE_SIZE) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,GAME_H); ctx.stroke(); }
            for (let y=0; y<=GAME_H; y+=TILE_SIZE) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(GAME_W,y); ctx.stroke(); }

            // Path
            ctx.strokeStyle = '#795548';
            ctx.lineWidth = 30;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            const p = this.state.path;
            if(p.length > 0) {
                ctx.moveTo(p[0].x, p[0].y);
                for(let i=1; i<p.length; i++) ctx.lineTo(p[i].x, p[i].y);
                ctx.stroke();
            }

            // Range Preview (Ghost)
            if (this.state.selectedSlot) {
                const gx = Math.floor(this.state.mouseX / TILE_SIZE);
                const gy = Math.floor(this.state.mouseY / TILE_SIZE);
                if (gx >= 0 && gy >= 0 && gx < COLS && gy < ROWS) {
                    const x = gx * TILE_SIZE + TILE_SIZE / 2;
                    const y = gy * TILE_SIZE + TILE_SIZE / 2;
                    const data = TOWERS[this.state.selectedSlot];
                    
                    ctx.beginPath();
                    ctx.arc(x, y, data.range * this.state.buffs.range, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.stroke();

                    ctx.globalAlpha = 0.7;
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center'; 
                    ctx.textBaseline = 'middle';
                    ctx.fillText(data.icon, x, y);
                    ctx.globalAlpha = 1.0;
                }
            }

            // Towers
            this.state.towers.forEach(t => {
                ctx.fillStyle = t.data.color;
                ctx.fillRect(t.x-15, t.y-15, 30, 30);
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center'; ctx.textBaseline='middle';
                ctx.fillText(t.data.icon, t.x, t.y);
                if(t.level > 1) {
                    ctx.fillStyle = 'gold'; ctx.font='12px Arial';
                    ctx.fillText('★'+t.level, t.x, t.y-15);
                }
            });

            // Enemies
            this.state.enemies.forEach(e => {
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath(); ctx.ellipse(e.x, e.y+(e.fly?20:5), e.r, e.r*0.5, 0,0,Math.PI*2); ctx.fill();

                // Body
                ctx.fillStyle = e.data.color;
                ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth=1; ctx.stroke();

                // HP Bar
                const pct = e.hp / e.maxHp;
                ctx.fillStyle = 'red'; ctx.fillRect(e.x-12, e.y-e.r-8, 24, 4);
                ctx.fillStyle = '#0f0'; ctx.fillRect(e.x-12, e.y-e.r-8, 24*pct, 4);
            });

            // Projectiles
            this.state.projectiles.forEach(p => {
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
            });

            // Particles
            this.state.particles.forEach(p => {
                ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
            });
            ctx.globalAlpha = 1;
        },

        updateUI: function() {
            document.getElementById('ui-lives').innerText = this.state.lives;
            document.getElementById('ui-wave').innerText = `WAVE ${this.state.wave}/20`;
            document.getElementById('ui-gold').innerText = this.state.gold;
            for(let key in TOWERS) {
                const el = document.getElementById(`cnt-${key}`);
                const slot = document.getElementById(`slot-${key}`);
                if(el) {
                    const c = this.state.inventory[key];
                    el.innerText = c;
                    if(c===0) slot.classList.add('disabled'); else slot.classList.remove('disabled');
                }
            }
        },

        loop: function() {
            this.loopId = requestAnimationFrame(() => this.loop());
            if(this.state.screen === 'playing') {
                this.update();
                this.draw();
            }
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();