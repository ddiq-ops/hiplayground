(function() {
    'use strict';

    // ================= SOUND ENGINE =================
    const Sound = {
        ctx: null,
        isMuted: false,
        init: function() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        },
        playTone: function(freq, type, duration) {
            if (this.isMuted || !this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + duration);
        },
        playClick: function() { this.playTone(400 + Math.random()*200, 'triangle', 0.1); },
        playBuy: function() { this.playTone(800, 'sine', 0.2); },
        playWin: function() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.2), i*100)); }
    };

    // ================= DATA & CONFIG =================
    // 난이도 상향: 초기 가격 상승 & 가격 증가 배율 1.25
    const UPGRADES = [
        { id: 'glove', type: 'manual', baseCost: 50, basePower: 1, icon: '🥊' },
        { id: 'battery', type: 'auto', baseCost: 150, basePower: 2, icon: '🔋' },
        { id: 'server', type: 'auto', baseCost: 1000, basePower: 10, icon: '🖥️' },
        { id: 'ai', type: 'auto', baseCost: 5000, basePower: 50, icon: '🤖' },
        { id: 'farm', type: 'auto', baseCost: 20000, basePower: 250, icon: '⛏️' },
        { id: 'nuclear', type: 'auto', baseCost: 100000, basePower: 1000, icon: '⚛️' },
        { id: 'alien', type: 'auto', baseCost: 1000000, basePower: 10000, icon: '👽' },
        { id: 'dyson', type: 'auto', baseCost: 50000000, basePower: 500000, icon: '☀️' }
    ];

    const COST_MULTIPLIER = 1.25; // 1.15 -> 1.25 (난이도 대폭 상승)

    const MODES = {
        infinite: { target: null, limit: null },
        timeAttack: { target: 100000000, limit: null },
        timeLimit: { target: null, limit: 180 }
    };
    
    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t) {
            const fullKey = `gameDetails.clicker.ui.${key}`;
            const value = I18n.t(fullKey, defaultValue);
            // If value is the key itself (not found), return defaultValue
            if (value === fullKey || value === defaultValue) {
                return defaultValue;
            }
            return value;
        }
        return defaultValue;
    }
    
    // Helper function to get mode info
    function getModeInfo(modeKey) {
        if (typeof I18n !== 'undefined' && I18n.t && I18n.translations && Object.keys(I18n.translations).length > 0) {
            const modeData = I18n.t(`gameDetails.clicker.ui.modes.${modeKey}`, null);
            if (modeData && typeof modeData === 'object' && modeData !== null && !Array.isArray(modeData) && modeData.name) {
                return {
                    name: modeData.name || '',
                    desc: modeData.desc || '',
                    goal: modeData.goal || '',
                    ...MODES[modeKey]
                };
            }
        }
        // Fallback to default Korean text if translation not found
        const defaults = {
            infinite: { name: "무한 모드", desc: "저장 가능.<br>느긋하게 성장하세요.", goal: "무제한" },
            timeAttack: { name: "타임 어택", desc: "1억 점 달성하기.<br>최단 기록 도전!", goal: "목표: 100M" },
            timeLimit: { name: "제한 시간", desc: "3분 스코어링.<br>폭발적인 성장!", goal: "제한: 3분" }
        };
        const defaultMode = defaults[modeKey] || { name: '', desc: '', goal: '' };
        return {
            ...defaultMode,
            ...MODES[modeKey]
        };
    }
    
    // Helper function to get upgrade info
    function getUpgradeInfo(upgradeId) {
        if (typeof I18n !== 'undefined' && I18n.t && I18n.translations && Object.keys(I18n.translations).length > 0) {
            const upgradeData = I18n.t(`gameDetails.clicker.ui.upgrades.${upgradeId}`, null);
            if (upgradeData && typeof upgradeData === 'object' && upgradeData !== null && !Array.isArray(upgradeData) && upgradeData.name) {
                return {
                    name: upgradeData.name || '',
                    desc: upgradeData.desc || ''
                };
            }
        }
        // Fallback to default Korean text if translation not found
        const defaults = {
            glove: { name: '파워 글러브', desc: '클릭 당 +1' },
            battery: { name: 'AA 건전지', desc: '초당 +2' },
            server: { name: '홈 서버', desc: '초당 +10' },
            ai: { name: 'AI 봇', desc: '초당 +50' },
            farm: { name: '채굴 공장', desc: '초당 +250' },
            nuclear: { name: '핵융합로', desc: '초당 +1,000' },
            alien: { name: '외계 기술', desc: '초당 +10,000' },
            dyson: { name: '다이슨 스피어', desc: '초당 +500,000' }
        };
        return defaults[upgradeId] || { name: '', desc: '' };
    }

    const Game = {
        container: null,
        mode: null,
        
        // 게임 상태
        state: {
            score: 0,
            clickPower: 1,
            autoPower: 0,
            items: {}, // { id: count }
            startTime: 0,
            elapsedTime: 0 // sec
        },
        
        intervalId: null,
        saveInterval: null,
        isActive: false,

        init: function(container) {
            this.container = container;
            Sound.init();
            this.renderModeSelect();
            
            // Listen for language changes
            if (typeof window !== 'undefined') {
                document.addEventListener('i18n:loaded', () => {
                    console.log('i18n:loaded event received in clicker game');
                    if (this.mode) {
                        this.renderGameLayout();
                        this.updateUI();
                        this.updateShop();
                    } else {
                        this.renderModeSelect();
                    }
                });
            }
        },

        // --- MODE SELECTION ---
        renderModeSelect: function() {
            const title = getUIText('title', 'NEON CORE: OVERLOAD');
            const infiniteMode = getModeInfo('infinite');
            const timeAttackMode = getModeInfo('timeAttack');
            const timeLimitMode = getModeInfo('timeLimit');
            
            this.container.innerHTML = `
                <div class="clk-wrapper">
                    <div class="game-frame">
                        <div class="mode-select-screen">
                            <h1 class="mode-title">${title}</h1>
                            <div class="mode-grid">
                                <div class="mode-card" onclick="Game.startGame('infinite')">
                                    <span class="mode-icon">♾️</span>
                                    <div class="mode-name">${infiniteMode.name}</div>
                                    <div class="mode-desc">${infiniteMode.desc}</div>
                                </div>
                                <div class="mode-card" onclick="Game.startGame('timeAttack')">
                                    <span class="mode-icon">⏱️</span>
                                    <div class="mode-name">${timeAttackMode.name}</div>
                                    <div class="mode-desc">${timeAttackMode.desc}</div>
                                </div>
                                <div class="mode-card" onclick="Game.startGame('timeLimit')">
                                    <span class="mode-icon">⏳</span>
                                    <div class="mode-name">${timeLimitMode.name}</div>
                                    <div class="mode-desc">${timeLimitMode.desc}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // --- GAME START ---
        startGame: function(modeKey) {
            this.mode = modeKey;
            this.state = { score: 0, clickPower: 1, autoPower: 0, items: {}, startTime: Date.now(), elapsedTime: 0 };
            
            // 데이터 초기화
            UPGRADES.forEach(u => this.state.items[u.id] = 0);

            // 무한 모드는 저장된 데이터 로드
            if (this.mode === 'infinite') {
                this.loadGame();
            }

            this.renderGameLayout();
            this.updateUI();
            this.updateShop();
            
            this.isActive = true;
            this.startLoop();

            // 무한 모드만 자동 저장
            if (this.mode === 'infinite') {
                this.saveInterval = setInterval(() => this.saveGame(), 5000);
            }
        },

        renderGameLayout: function() {
            const modeInfo = getModeInfo(this.mode);
            const upgradeText = getUIText('upgrade', 'UPGRADE');
            const gameOverText = getUIText('gameOver', 'GAME OVER');
            const mainMenuText = getUIText('mainMenu', 'MAIN MENU');
            
            this.container.innerHTML = `
                <div class="clk-wrapper">
                    <div class="game-frame">
                        <div class="clk-main">
                            <div class="clk-header">
                                <div class="mode-target" id="mode-target">${modeInfo.goal}</div>
                                <div class="clk-score" id="score-display">0</div>
                                <div class="clk-gps" id="gps-display">0 ${getUIText('perSec', '/ sec')}</div>
                            </div>
                            
                            <div class="core-btn" id="core-btn"></div>
                            <div id="fx-layer" style="position:absolute; width:100%; height:100%; pointer-events:none;"></div>
                        </div>

                        <div class="clk-shop">
                            <div class="shop-header">
                                <h3 class="shop-title">${upgradeText}</h3>
                                <div>
                                    <button class="btn-util" id="btn-sound">🔊</button>
                                    <button class="btn-util" onclick="Game.init(Game.container)">🏠</button>
                                </div>
                            </div>
                            <div class="shop-list" id="shop-list"></div>
                        </div>

                        <div class="game-modal" id="result-modal">
                            <h2 class="end-title" id="end-title">${gameOverText}</h2>
                            <p class="end-desc" id="end-desc">Result here</p>
                            <button class="btn-restart" onclick="Game.init(Game.container)">${mainMenuText}</button>
                        </div>
                    </div>
                </div>
            `;

            // Elements
            this.el = {
                score: document.getElementById('score-display'),
                gps: document.getElementById('gps-display'),
                target: document.getElementById('mode-target'),
                shop: document.getElementById('shop-list'),
                btn: document.getElementById('core-btn'),
                fx: document.getElementById('fx-layer')
            };

            // Events
            this.el.btn.addEventListener('mousedown', (e) => this.handleClick(e));
            document.getElementById('btn-sound').onclick = () => {
                Sound.isMuted = !Sound.isMuted;
                document.getElementById('btn-sound').innerText = Sound.isMuted ? "🔇" : "🔊";
            };

            this.renderShop();
            this.updateModeUI(); // Update mode-specific UI
        },

        renderShop: function() {
            this.el.shop.innerHTML = '';
            UPGRADES.forEach(item => {
                const upgradeInfo = getUpgradeInfo(item.id);
                const div = document.createElement('div');
                div.className = 'upgrade-item';
                div.id = `item-${item.id}`;
                div.innerHTML = `
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-info">
                        <span class="item-name">${upgradeInfo.name}</span>
                        <span class="item-effect">${upgradeInfo.desc}</span>
                        <span class="item-cost">⚡ 0</span>
                    </div>
                    <div class="item-count" id="count-${item.id}">0</div>
                `;
                div.onclick = () => this.buyItem(item);
                this.el.shop.appendChild(div);
            });
            this.updateShop();
        },

        // --- CORE ACTIONS ---
        handleClick: function(e) {
            if (!this.isActive) return;
            this.addScore(this.state.clickPower);
            Sound.playClick();
            this.spawnFloatText(e.clientX, e.clientY, `+${this.formatNumber(this.state.clickPower)}`);
        },

        buyItem: function(item) {
            if (!this.isActive) return;
            const count = this.state.items[item.id];
            const cost = Math.floor(item.baseCost * Math.pow(COST_MULTIPLIER, count));

            if (this.state.score >= cost) {
                this.state.score -= cost;
                this.state.items[item.id]++;

                if (item.type === 'manual') this.state.clickPower += item.basePower;
                else this.state.autoPower += item.basePower;

                Sound.playBuy();
                this.updateUI();
                this.updateShop();
            }
        },

        addScore: function(amount) {
            this.state.score += amount;
            this.updateUI();
            this.checkWinCondition();
        },

        // --- LOOP & TIMING ---
        startLoop: function() {
            if (this.intervalId) clearInterval(this.intervalId);
            const fps = 10;
            
            this.intervalId = setInterval(() => {
                if (!this.isActive) return;

                // 1. Auto Production (1/10초마다)
                if (this.state.autoPower > 0) {
                    this.state.score += this.state.autoPower / fps;
                }

                // 2. Timer Update
                this.state.elapsedTime = (Date.now() - this.state.startTime) / 1000;
                
                // 3. UI Update (Timer & Score)
                this.updateModeUI();
                
                // 4. Shop State check
                this.updateShop();
                this.checkWinCondition(); // Check conditions

            }, 1000 / fps);
        },

        updateModeUI: function() {
            // 점수 업데이트
            this.el.score.innerText = this.formatNumber(Math.floor(this.state.score));
            const perSec = getUIText('perSec', '/ sec');
            this.el.gps.innerText = `⚡ ${this.formatNumber(this.state.autoPower)} ${perSec.toUpperCase()}`;

            // 모드별 상단 텍스트 업데이트
            const modeInfo = getModeInfo(this.mode);
            if (this.mode === 'timeLimit') {
                const left = Math.max(0, MODES.timeLimit.limit - this.state.elapsedTime);
                const timeLeft = getUIText('timeLeft', '남은 시간');
                this.el.target.innerText = `${timeLeft}: ${left.toFixed(1)}초`;
            } else if (this.mode === 'timeAttack') {
                const timeElapsed = getUIText('timeElapsed', '경과 시간');
                this.el.target.innerText = `${timeElapsed}: ${this.state.elapsedTime.toFixed(1)}초`;
            } else {
                this.el.target.innerText = modeInfo.goal;
            }
        },

        checkWinCondition: function() {
            if (this.mode === 'timeLimit') {
                if (this.state.elapsedTime >= MODES.timeLimit.limit) {
                    const timeOver = getUIText('timeOver', 'TIME OVER');
                    const finalScore = getUIText('finalScore', '최종 점수');
                    this.gameOver(timeOver, `${finalScore}: ${this.formatNumber(Math.floor(this.state.score))}`);
                }
            } else if (this.mode === 'timeAttack') {
                if (this.state.score >= MODES.timeAttack.target) {
                    const missionClear = getUIText('missionClear', 'MISSION CLEAR');
                    const record = getUIText('record', '기록');
                    this.gameOver(missionClear, `${record}: ${this.state.elapsedTime.toFixed(2)}초`);
                }
            }
        },

        gameOver: function(title, desc) {
            this.isActive = false;
            clearInterval(this.intervalId);
            if (this.saveInterval) clearInterval(this.saveInterval);
            
            Sound.playWin();
            
            document.getElementById('end-title').innerText = title;
            document.getElementById('end-desc').innerText = desc;
            document.getElementById('result-modal').classList.add('active');
        },

        updateShop: function() {
            UPGRADES.forEach(item => {
                const count = this.state.items[item.id];
                const cost = Math.floor(item.baseCost * Math.pow(COST_MULTIPLIER, count));
                
                const elItem = document.getElementById(`item-${item.id}`);
                const elCost = elItem.querySelector('.item-cost');
                const elCount = document.getElementById(`count-${item.id}`);

                elCost.innerText = `⚡ ${this.formatNumber(cost)}`;
                elCount.innerText = count;

                if (this.state.score >= cost) elItem.classList.remove('disabled');
                else elItem.classList.add('disabled');
            });
        },

        updateUI: function() {
             // updateModeUI에서 처리됨
        },

        // --- UTILS ---
        formatNumber: function(num) {
            if (num < 1000) return Math.floor(num);
            const units = ['k', 'M', 'B', 'T', 'Qa'];
            const order = Math.floor(Math.log10(num) / 3);
            const unitname = units[order - 1] || '';
            const val = num / Math.pow(1000, order);
            return val.toFixed(2) + unitname;
        },

        spawnFloatText: function(x, y, text) {
            const el = document.createElement('div');
            el.className = 'float-text';
            el.innerText = text;
            const rect = document.querySelector('.clk-main').getBoundingClientRect();
            el.style.left = (x - rect.left) + 'px';
            el.style.top = (y - rect.top) + 'px';
            this.el.fx.appendChild(el);
            setTimeout(() => el.remove(), 800);
        },

        // --- SAVE SYSTEM (Only for Infinite Mode) ---
        saveGame: function() {
            if (this.mode !== 'infinite') return;
            const saveObj = {
                score: this.state.score,
                clickPower: this.state.clickPower,
                autoPower: this.state.autoPower,
                items: this.state.items
            };
            localStorage.setItem('clicker_save_v2', JSON.stringify(saveObj));
        },

        loadGame: function() {
            const saved = localStorage.getItem('clicker_save_v2');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    this.state = { ...this.state, ...parsed };
                } catch (e) { console.error("Save Load Error"); }
            }
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();