(function() {
    'use strict';

    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t && I18n.translations && Object.keys(I18n.translations).length > 0) {
            const fullKey = `gameDetails.jelly-maze.ui.${key}`;
            const value = I18n.t(fullKey, defaultValue);
            if (value === fullKey || value === defaultValue) {
                return defaultValue;
            }
            return value;
        }
        return defaultValue;
    }

    // Helper function to get tower info
    function getTowerInfo(id) {
        const defaultTower = TOWERS_BASE[id] || {};
        return {
            ...defaultTower,
            name: getUIText(`towers.${id}.name`, defaultTower.name || ''),
            desc: getUIText(`towers.${id}.desc`, defaultTower.desc || '')
        };
    }

    // Helper function to get relic info
    function getRelicInfo(id) {
        const defaultRelic = RELICS_BASE[id] || {};
        return {
            ...defaultRelic,
            name: getUIText(`relics.${id}.name`, defaultRelic.name || ''),
            desc: getUIText(`relics.${id}.desc`, defaultRelic.desc || '')
        };
    }

    // Helper function to get enemy info
    function getEnemyInfo(index) {
        const enemyKeys = ['red', 'yellow', 'green', 'king'];
        const key = enemyKeys[index] || '';
        const defaultEnemy = ENEMIES_BASE[index] || {};
        return {
            ...defaultEnemy,
            name: getUIText(`enemies.${key}.name`, defaultEnemy.name || ''),
            desc: getUIText(`enemies.${key}.desc`, defaultEnemy.desc || '')
        };
    }

    // ================= DATA =================
    const TILE_SIZE = 40;
    const GRID_W = 15;
    const GRID_H = 15;

    const TOWERS_BASE = {
        pudding: { icon: '🍮', cost: 10, range: 2.5, damage: 10, rate: 30, crit: 0.1, color: '#FFD54F', name: '푸딩', desc: '사거리: 2.5칸' },
        cake:    { icon: '🍰', cost: 25, range: 4.0, damage: 20, rate: 50, crit: 0.15, color: '#F48FB1', name: '케이크', desc: '사거리: 4칸 (장거리)' },
        donut:   { icon: '🍩', cost: 40, range: 2.0, damage: 45, rate: 60, crit: 0.1, color: '#8D6E63', name: '도넛', desc: '사거리: 2칸 (강력)' },
        icecream:{ icon: '🍦', cost: 30, range: 2.5, damage: 5,  rate: 40, crit: 0, color: '#4FC3F7', name: '아이스', desc: '사거리: 2.5칸 (슬로우)', slow: 0.5 },
        cookie:  { icon: '🍪', cost: 60, range: 3.0, damage: 12, rate: 15, crit: 0.2, color: '#A1887F', name: '쿠키', desc: '사거리: 3칸 (속사)' },
        macaron: { icon: '🥯', cost: 80, range: 6.0, damage: 100, rate: 120, crit: 0.5, color: '#CE93D8', name: '마카롱', desc: '사거리: 6칸 (저격)' },
        choco:   { icon: '🍫', cost: 50, range: 2.5, damage: 15, rate: 30, crit: 0.6, color: '#3E2723', name: '초코', desc: '사거리: 2.5칸 (크리 60%)' }
    };

    const RELICS_BASE = {
        spoon:   { icon: '🥄', cost: 50, type: 'relic', effect: 'dmg', val: 1.2, name: '황금 스푼', desc: '공격력 +20% (패시브)' },
        shoes:   { icon: '👟', cost: 30, type: 'relic', effect: 'rate', val: 0.9, name: '신발 끈', desc: '공격속도 +10% (패시브)' },
        lens:    { icon: '🔍', cost: 40, type: 'relic', effect: 'range', val: 1.2, name: '확대경', desc: '사거리 +20% (패시브)' },
        clover:  { icon: '🍀', cost: 60, type: 'relic', effect: 'crit', val: 0.1, name: '네잎클로버', desc: '크리율 +10% (패시브)' },
        wallet:  { icon: '👛', cost: 0,  type: 'relic', effect: 'gold', val: 30, name: '지갑', desc: '즉시 30골드 획득' }
    };

    const ENEMIES_BASE = [
        { icon: '🔴', hp: 30, speed: 2, reward: 2, name: '레드 젤리', desc: '빠르고 약함' },
        { icon: '🟡', hp: 60, speed: 3, reward: 3, name: '옐로 젤리', desc: '매우 빠름!' },
        { icon: '🟢', hp: 150, speed: 1.5, reward: 5, name: '그린 젤리', desc: '튼튼함' },
        { icon: '👑', hp: 800, speed: 1, reward: 20, name: '왕 젤리', desc: '보스' }
    ];

    // Get translated versions
    const TOWERS = {};
    const RELICS = {};
    const ENEMIES = [];

    function updateTranslations() {
        for(let k in TOWERS_BASE) {
            TOWERS[k] = getTowerInfo(k);
        }
        for(let k in RELICS_BASE) {
            RELICS[k] = getRelicInfo(k);
        }
        for(let i = 0; i < ENEMIES_BASE.length; i++) {
            ENEMIES[i] = getEnemyInfo(i);
        }
    }
    updateTranslations();

    // ================= ENGINE =================
    const Game = {
        canvas: null, ctx: null,
        
        state: {
            gold: 60, lives: 20, wave: 0,
            map: [],
            towers: [],
            enemies: [],
            projectiles: [],
            path: [], 
            start: {x:0, y:0},
            end: {x:GRID_W-1, y:GRID_H-1},
            
            shopCards: [],
            selectedCardIdx: -1,
            
            buffs: { dmg: 1, rate: 1, range: 1, crit: 0 },
            
            waveActive: false,
            spawnQueue: [],
            spawnTimer: 0,
            
            gameSpeed: 1, // [New] 1x or 2x
            lastTime: 0
        },

        init: function(container) {
            this.container = container;
            this.renderLayout();
            
            this.canvas = document.getElementById('jm-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = GRID_W * TILE_SIZE;
            this.canvas.height = GRID_H * TILE_SIZE;

            this.state.map = new Array(GRID_H).fill(0).map(() => new Array(GRID_W).fill(0));
            this.state.start = {x: 0, y: 0};
            this.state.end = {x: GRID_W-1, y: GRID_H-1};
            
            this.recalcPath();
            this.rerollShop(true);

            this.canvas.addEventListener('mousedown', e => this.handleCanvasClick(e));
            this.canvas.addEventListener('touchstart', e => { e.preventDefault(); this.handleCanvasClick(e); });

            if(this.loopId) cancelAnimationFrame(this.loopId);
            this.loop();
            this.updateUI();

            setTimeout(() => this.showGuide(), 100);

            // Listen for language changes
            document.addEventListener('i18n:loaded', () => {
                updateTranslations();
                this.renderLayout();
                this.rerollShop(true);
                this.updateUI();
            });
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="jm-wrapper">
                    <div class="jm-header">
                        <div class="header-left">
                            <div class="jm-stat"><span class="jm-icon">❤️</span> <span id="ui-lives">20</span></div>
                            <button class="btn-help" onclick="Game.showGuide()">?</button>
                            <button class="btn-speed" id="btn-speed" onclick="Game.toggleSpeed()">x1</button>
                        </div>
                        <div class="jm-stat">WAVE <span id="ui-wave">1</span></div>
                        <div class="jm-stat"><span class="jm-icon">💰</span> <span id="ui-gold">60</span></div>
                    </div>
                    
                    <div class="jm-game-area">
                        <canvas id="jm-canvas"></canvas>
                        <div class="jm-toast" id="ui-toast"></div>
                        <button class="btn-next" id="btn-next" onclick="Game.startWave()">${getUIText('nextWave', 'NEXT WAVE')}</button>
                    </div>

                    <div class="jm-shop">
                        <div class="jm-shop-header">
                            <span>${getUIText('shopTitle', '상점 (타워 건설 & 유물 구입)')}</span>
                            <button class="btn-reroll" onclick="Game.rerollShop()">${getUIText('rerollButton', '새로고침 (5G)')}</button>
                        </div>
                        <div class="jm-cards" id="ui-cards"></div>
                    </div>

                    <div class="jm-modal" id="modal-guide">
                        <div class="jm-guide" id="guide-content"></div>
                    </div>
                </div>
            `;
        },

        toggleSpeed: function() {
            this.state.gameSpeed = this.state.gameSpeed === 1 ? 2 : 1;
            document.getElementById('btn-speed').innerText = 'x' + this.state.gameSpeed;
        },

        showGuide: function() {
            const guide = document.getElementById('guide-content');
            let html = `<h2>${getUIText('guideTitle', '게임 가이드')}</h2>`;

            html += `<h3>🚩 ${getUIText('guideHowToPlay', '게임 방법')}</h3>
                <div class="jm-guide-desc">
                    1. <strong>${getUIText('guideSteps.step1', '타워를 설치해 젤리의 길을 막으세요.')}</strong><br>
                    2. ${getUIText('guideSteps.step2', '젤리는 최단 경로로 이동합니다.')}<br>
                    3. <span style="color:#f57f17; font-weight:bold;">${getUIText('guideSteps.step3', '노란색 카드(유물)는 구매 즉시 효과가 적용됩니다. (설치 X)')}</span>
                </div>`;

            html += `<h3>🏰 ${getUIText('guideTowers', '타워 & 유물')}</h3><div class="jm-guide-grid">`;
            for(let k in TOWERS) {
                const t = TOWERS[k];
                html += `<div class="jm-guide-item"><div class="jm-guide-icon">${t.icon}</div><div>${t.name}</div><div class="jm-guide-text" style="font-size:0.7rem">${t.desc}</div></div>`;
            }
            html += `<div class="jm-guide-item" style="border-color:#ffd700; background:#fffde7;"><div class="jm-guide-icon">🥄</div><div>${getUIText('relicLabel', '유물')}</div><div class="jm-guide-text" style="font-size:0.7rem; color:#f57f17;">${getUIText('relicDesc', '즉시 강화')}</div></div>`;
            html += `</div>`;

            html += `<button class="btn-close" onclick="document.getElementById('modal-guide').classList.remove('active')">${getUIText('startButton', '게임 시작!')}</button>`;
            
            guide.innerHTML = html;
            document.getElementById('modal-guide').classList.add('active');
        },

        // --- PATHFINDING & SHOP Logic (동일) ---
        recalcPath: function() {
            const path = this.findPath(this.state.start, this.state.end);
            if(path) this.state.path = path;
            return path;
        },

        findPath: function(start, end, tempMap = null) {
            const map = tempMap || this.state.map;
            const openSet = [start];
            const closedSet = new Set();
            const cameFrom = {};
            const gScore = {};
            const fScore = {};

            const key = p => `${p.x},${p.y}`;
            gScore[key(start)] = 0;
            fScore[key(start)] = Math.abs(start.x-end.x) + Math.abs(start.y-end.y);

            while(openSet.length > 0) {
                openSet.sort((a,b) => fScore[key(a)] - fScore[key(b)]);
                let current = openSet.shift();

                if (current.x === end.x && current.y === end.y) {
                    const path = [current];
                    while(key(current) in cameFrom) {
                        current = cameFrom[key(current)];
                        path.unshift(current);
                    }
                    return path;
                }

                closedSet.add(key(current));

                const neighbors = [
                    {x: current.x+1, y: current.y}, {x: current.x-1, y: current.y},
                    {x: current.x, y: current.y+1}, {x: current.x, y: current.y-1}
                ];

                for(let n of neighbors) {
                    if(n.x < 0 || n.x >= GRID_W || n.y < 0 || n.y >= GRID_H) continue;
                    if(map[n.y][n.x] === 1 || closedSet.has(key(n))) continue;

                    const tentativeG = gScore[key(current)] + 1;
                    if(!openSet.some(o => o.x===n.x && o.y===n.y)) openSet.push(n);
                    else if (tentativeG >= gScore[key(n)]) continue;

                    cameFrom[key(n)] = current;
                    gScore[key(n)] = tentativeG;
                    fScore[key(n)] = tentativeG + Math.abs(n.x-end.x) + Math.abs(n.y-end.y);
                }
            }
            return null; 
        },

        rerollShop: function(free = false) {
            if(!free) {
                if(this.state.gold < 5) { this.showToast(getUIText('toastNoGold', '골드가 부족합니다!')); return; }
                this.state.gold -= 5;
            }
            
            const towerKeys = Object.keys(TOWERS);
            const relicKeys = Object.keys(RELICS);
            this.state.shopCards = [];
            
            for(let i=0; i<3; i++) {
                if (Math.random() < 0.25) { 
                    const key = relicKeys[Math.floor(Math.random() * relicKeys.length)];
                    this.state.shopCards.push({ id: key, category: 'relic', ...RELICS[key] });
                } else {
                    const key = towerKeys[Math.floor(Math.random() * towerKeys.length)];
                    this.state.shopCards.push({ id: key, category: 'tower', ...TOWERS[key] });
                }
            }
            this.state.selectedCardIdx = -1;
            this.renderShop();
            this.updateUI();
        },

        renderShop: function() {
            const container = document.getElementById('ui-cards');
            container.innerHTML = '';
            
            this.state.shopCards.forEach((card, idx) => {
                const el = document.createElement('div');
                const isRelic = card.category === 'relic';
                el.className = `jm-card ${isRelic ? 'relic' : ''} ${this.state.selectedCardIdx === idx ? 'selected' : ''}`;
                
                el.onclick = () => {
                    if (isRelic) this.buyRelic(idx);
                    else this.selectCard(idx);
                };

                el.innerHTML = `
                    <div class="jm-card-icon">${card.icon}</div>
                    <div class="jm-card-name">${card.name}</div>
                    <div class="jm-card-desc">${card.desc}</div>
                    <div class="jm-card-cost">${card.cost}G</div>
                `;
                container.appendChild(el);
            });
        },

        selectCard: function(idx) {
            if(this.state.selectedCardIdx === idx) this.state.selectedCardIdx = -1; 
            else this.state.selectedCardIdx = idx;
            this.renderShop();
        },

        buyRelic: function(idx) {
            const card = this.state.shopCards[idx];
            if(this.state.gold < card.cost) { this.showToast(getUIText('toastNoGoldShort', '골드가 부족합니다.')); return; }
            
            this.state.gold -= card.cost;
            this.showToast(`✨ ${card.name} ${getUIText('toastRelicApplied', '적용됨! (설치 X)')}`);
            
            if(card.effect === 'gold') this.state.gold += card.val;
            else if(this.state.buffs[card.effect] !== undefined) {
                if(card.effect === 'crit') this.state.buffs.crit += card.val;
                else if(card.effect === 'rate') this.state.buffs.rate *= card.val; // rate(cooldown) multiplier
                else this.state.buffs[card.effect] *= card.val; 
            }

            this.state.shopCards.splice(idx, 1);
            this.state.selectedCardIdx = -1;
            this.renderShop();
            this.updateUI();
        },

        handleCanvasClick: function(e) {
            if(this.state.selectedCardIdx === -1) return;
            const card = this.state.shopCards[this.state.selectedCardIdx];
            if(card.category !== 'tower') return;

            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = Math.floor(((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX / TILE_SIZE);
            const y = Math.floor(((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY / TILE_SIZE);

            this.buildTower(x, y);
        },

        buildTower: function(x, y) {
            if(x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return;
            if(this.state.map[y][x] !== 0) { this.showToast(getUIText('toastBuildingExists', '이미 건물이 있습니다.')); return; }
            if((x===this.state.start.x && y===this.state.start.y) || (x===this.state.end.x && y===this.state.end.y)) return;

            const card = this.state.shopCards[this.state.selectedCardIdx];
            if(this.state.gold < card.cost) { this.showToast(getUIText('toastNoGoldShort', '골드가 부족합니다.')); return; }

            this.state.map[y][x] = 1; 
            const newPath = this.findPath(this.state.start, this.state.end);
            
            let enemiesTrapped = false;
            for(let e of this.state.enemies) {
                if(Math.floor(e.x/TILE_SIZE) === x && Math.floor(e.y/TILE_SIZE) === y) { enemiesTrapped = true; break; }
                const ePath = this.findPath({x: Math.floor(e.x/TILE_SIZE), y: Math.floor(e.y/TILE_SIZE)}, this.state.end);
                if(!ePath) { enemiesTrapped = true; break; }
            }

            if(!newPath || enemiesTrapped) {
                this.state.map[y][x] = 0; 
                this.showToast(getUIText('toastPathBlocked', '길을 완전히 막을 수 없습니다!'));
                return;
            }

            this.state.path = newPath;
            this.state.gold -= card.cost;
            this.state.towers.push({
                x, y, type: card.id, data: TOWERS[card.id], 
                cd: 0,
                range: card.range * TILE_SIZE
            });
            
            this.state.shopCards.splice(this.state.selectedCardIdx, 1); 
            this.state.selectedCardIdx = -1;
            
            this.state.enemies.forEach(e => {
                e.path = this.findPath({x: Math.floor(e.x/TILE_SIZE), y: Math.floor(e.y/TILE_SIZE)}, this.state.end);
                e.pathIdx = 0;
            });

            this.renderShop(); 
            this.updateUI();
        },

        startWave: function() {
            if(this.state.waveActive) return;
            this.state.wave++;
            this.state.waveActive = true;
            this.state.spawnTimer = 0;
            
            const count = 5 + Math.floor(this.state.wave * 1.5);
            const typeIdx = Math.min(Math.floor(this.state.wave / 3), ENEMIES.length - 1);
            const type = ENEMIES[typeIdx];
            
            this.state.spawnQueue = [];
            for(let i=0; i<count; i++) this.state.spawnQueue.push({...type, hp: type.hp * (1 + this.state.wave*0.3)});
            
            document.getElementById('btn-next').disabled = true;
            document.getElementById('btn-next').innerText = getUIText('waveActive', 'WAVE...');
            this.updateUI();
        },

        loop: function() {
            this.loopId = requestAnimationFrame(() => this.loop());
            this.update();
            this.draw();
        },

        update: function() {
            const st = this.state;
            const spd = st.gameSpeed; // [New] 배속 변수 적용

            if(st.waveActive && st.spawnQueue.length > 0) {
                st.spawnTimer += spd; // [Modified] 배속 적용
                if(st.spawnTimer > 60) { 
                    const data = st.spawnQueue.shift();
                    st.enemies.push({
                        x: st.start.x * TILE_SIZE + TILE_SIZE/2, y: st.start.y * TILE_SIZE + TILE_SIZE/2,
                        hp: data.hp, maxHp: data.hp, speed: data.speed, reward: data.reward, icon: data.icon,
                        path: [...st.path], pathIdx: 0, slow: 0
                    });
                    st.spawnTimer = 0;
                }
            }

            for(let i=st.enemies.length-1; i>=0; i--) {
                const e = st.enemies[i];
                let speed = e.speed * spd; // [Modified] 배속 적용
                if(e.slow > 0) { speed *= 0.5; e.slow -= spd; } // [Modified] 슬로우 시간 감소에도 배속 적용

                if(e.path && e.path[e.pathIdx]) {
                    const target = e.path[e.pathIdx];
                    const tx = target.x * TILE_SIZE + TILE_SIZE/2;
                    const ty = target.y * TILE_SIZE + TILE_SIZE/2;
                    const dx = tx - e.x, dy = ty - e.y;
                    const dist = Math.hypot(dx, dy);

                    if(dist < speed) {
                        e.x = tx; e.y = ty; e.pathIdx++;
                        if(e.pathIdx >= e.path.length) {
                            st.lives--; st.enemies.splice(i, 1); this.updateUI();
                            if(st.lives <= 0) { alert(getUIText('gameOver', 'GAME OVER')); location.reload(); }
                            continue;
                        }
                    } else {
                        e.x += (dx/dist) * speed; e.y += (dy/dist) * speed;
                    }
                }
            }

            st.towers.forEach(t => {
                if(t.cd > 0) t.cd -= spd; // [Modified] 쿨타임 감소에 배속 적용
                else {
                    const range = t.range * st.buffs.range;
                    const target = st.enemies.find(e => Math.hypot(e.x - (t.x*TILE_SIZE+20), e.y - (t.y*TILE_SIZE+20)) <= range);
                    if(target) {
                        const isCrit = Math.random() < (t.data.crit + st.buffs.crit);
                        let dmg = t.data.damage * st.buffs.dmg;
                        if(isCrit) dmg *= 2;

                        st.projectiles.push({
                            x: t.x*TILE_SIZE+20, y: t.y*TILE_SIZE+20, target: target,
                            damage: dmg, isCrit: isCrit,
                            color: t.data.color, slow: t.data.slow || 0, speed: 12
                        });
                        t.cd = t.data.rate * st.buffs.rate;
                    }
                }
            });

            for(let i=st.projectiles.length-1; i>=0; i--) {
                const p = st.projectiles[i];
                if(!st.enemies.includes(p.target)) { st.projectiles.splice(i, 1); continue; }
                
                const dx = p.target.x - p.x, dy = p.target.y - p.y;
                const dist = Math.hypot(dx, dy);
                const moveDist = p.speed * spd; // [Modified] 투사체 속도 배속 적용

                if(dist < moveDist) {
                    p.target.hp -= p.damage;
                    if(p.slow) p.target.slow = 60; 
                    if(p.target.hp <= 0) {
                        st.gold += p.target.reward;
                        const idx = st.enemies.indexOf(p.target);
                        if(idx > -1) st.enemies.splice(idx, 1);
                        this.updateUI();
                    }
                    st.projectiles.splice(i, 1);
                } else {
                    p.x += (dx/dist) * moveDist; p.y += (dy/dist) * moveDist;
                }
            }

            if(st.waveActive && st.spawnQueue.length === 0 && st.enemies.length === 0) {
                st.waveActive = false;
                document.getElementById('btn-next').disabled = false;
                document.getElementById('btn-next').innerText = getUIText('nextWave', 'NEXT WAVE');
                st.gold += 10 + st.wave * 2;
                this.updateUI();
            }
        },

        draw: function() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 1;
            for(let x=0; x<=GRID_W; x++) { ctx.beginPath(); ctx.moveTo(x*TILE_SIZE, 0); ctx.lineTo(x*TILE_SIZE, this.canvas.height); ctx.stroke(); }
            for(let y=0; y<=GRID_H; y++) { ctx.beginPath(); ctx.moveTo(0, y*TILE_SIZE); ctx.lineTo(this.canvas.width, y*TILE_SIZE); ctx.stroke(); }

            if(this.state.path.length > 0) {
                ctx.strokeStyle = 'rgba(76, 175, 80, 0.2)'; ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.moveTo(this.state.start.x*TILE_SIZE+20, this.state.start.y*TILE_SIZE+20);
                for(let p of this.state.path) ctx.lineTo(p.x*TILE_SIZE+20, p.y*TILE_SIZE+20);
                ctx.stroke();
            }

            ctx.fillStyle = '#4CAF50'; ctx.font = '24px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText('🚩', this.state.start.x*TILE_SIZE+20, this.state.start.y*TILE_SIZE+20);
            ctx.fillText('🏁', this.state.end.x*TILE_SIZE+20, this.state.end.y*TILE_SIZE+20);

            this.state.towers.forEach(t => {
                if (t.data) {
                    ctx.font = '30px Arial';
                    ctx.fillText(t.data.icon, t.x*TILE_SIZE+20, t.y*TILE_SIZE+22);
                }
            });

            this.state.enemies.forEach(e => {
                ctx.font = '24px Arial';
                ctx.fillText(e.icon, e.x, e.y);
                const pct = Math.max(0, e.hp / e.maxHp);
                ctx.fillStyle = 'red'; ctx.fillRect(e.x-10, e.y-20, 20, 4);
                ctx.fillStyle = '#0f0'; ctx.fillRect(e.x-10, e.y-20, 20*pct, 4);
            });

            this.state.projectiles.forEach(p => {
                ctx.fillStyle = p.isCrit ? 'red' : p.color; 
                const size = p.isCrit ? 6 : 4;
                ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI*2); ctx.fill();
            });
        },

        showToast: function(msg) {
            const el = document.getElementById('ui-toast');
            el.innerText = msg; el.style.opacity = 1;
            setTimeout(() => el.style.opacity = 0, 1500);
        },

        updateUI: function() {
            document.getElementById('ui-lives').innerText = this.state.lives;
            document.getElementById('ui-wave').innerText = this.state.wave;
            document.getElementById('ui-gold').innerText = this.state.gold;
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();