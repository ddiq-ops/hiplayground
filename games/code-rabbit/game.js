(function() {
    'use strict';

    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t) {
            const fullKey = `gameDetails.code-rabbit.ui.${key}`;
            const value = I18n.t(fullKey, defaultValue);
            if (value === fullKey || value === defaultValue) {
                return defaultValue;
            }
            return value;
        }
        return defaultValue;
    }

    // ================= LEVEL DATA =================
    // grid: 0:땅, 1:벽, 2:시작, 3:당근, 4:물
    // timeLimit: 제한 시간(초)
    // maxCmd: 최대 명령어 개수
    const LEVELS = [
        {
            id: 1, 
            grid: [[0,0,0,0,0],[0,2,0,3,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
            startDir: 1, timeLimit: 20, maxCmd: 3
        },
        {
            id: 2, 
            grid: [[0,0,0,0,0],[0,0,1,3,0],[0,2,1,0,0],[0,0,0,0,0],[0,0,0,0,0]],
            startDir: 1, timeLimit: 25, maxCmd: 5
        },
        {
            id: 3, 
            grid: [[0,0,0,0,0],[0,2,4,3,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
            startDir: 1, timeLimit: 20, maxCmd: 3
        },
        {
            id: 4, 
            grid: [[0,0,0,0,0,0],[2,4,0,4,0,3],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
            startDir: 1, timeLimit: 30, maxCmd: 6 
        },
        {
            id: 5, 
            grid: [[0,0,0,0,0,3],[0,1,1,1,1,0],[0,1,0,0,0,0],[0,1,0,1,1,1],[2,0,0,1,0,0],[0,0,0,0,0,0]],
            startDir: 1, timeLimit: 40, maxCmd: 12
        },
        {
            id: 6, 
            grid: [[0,0,0,0,0,0],[0,2,1,0,1,3],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]],
            startDir: 1, timeLimit: 30, maxCmd: 4
        },
        {
            id: 7, 
            grid: [[3,0,0,0,0,0,0],[4,1,1,1,1,1,0],[0,0,0,4,0,0,0],[0,1,1,1,1,1,0],[2,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
            startDir: 1, timeLimit: 45, maxCmd: 10
        },
        {
            id: 8, 
            grid: [[1,1,1,1,1,1,1],[1,3,0,0,0,0,1],[1,1,1,1,1,0,1],[1,0,0,0,1,0,1],[1,0,2,0,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]],
            startDir: 2, timeLimit: 50, maxCmd: 15
        },
        {
            id: 9, 
            grid: [[4,4,4,4,4,4,4],[4,0,4,3,4,0,4],[4,4,4,4,4,4,4],[4,0,4,0,4,0,4],[4,4,4,4,4,4,4],[4,2,4,0,4,0,4],[4,4,4,4,4,4,4]],
            startDir: 1, timeLimit: 60, maxCmd: 14
        },
        {
            id: 10, 
            grid: [[1,1,1,1,1,1,1,1],[1,3,0,1,0,0,0,1],[1,1,0,1,0,1,0,1],[1,0,0,0,0,1,0,1],[1,0,1,1,1,1,0,1],[1,0,0,0,4,0,0,1],[1,1,1,1,1,1,2,1],[1,1,1,1,1,1,1,1]],
            startDir: 3, timeLimit: 90, maxCmd: 20
        },
        {
            id: 11, 
            grid: [[0,0,0,0,1,3,0,0],[0,1,1,4,1,1,1,0],[0,1,0,0,0,0,1,0],[0,1,0,1,1,0,1,0],[0,1,0,2,1,0,0,0],[0,1,1,1,1,1,1,0],[0,0,4,0,0,0,4,0],[0,0,0,0,0,0,0,0]],
            startDir: 0, timeLimit: 100, maxCmd: 25
        },
        {
            id: 12, 
            grid: [[1,1,1,1,1,1,1,1],[1,3,4,0,4,0,0,1],[1,1,1,1,1,1,4,1],[1,0,0,0,0,0,0,1],[1,0,1,1,1,1,1,1],[1,4,0,4,0,0,0,1],[1,1,1,1,1,1,0,1],[1,2,0,0,0,0,0,1]],
            startDir: 1, timeLimit: 120, maxCmd: 30
        }
    ];

    // ================= SOUND ENGINE =================
    const Sound = {
        ctx: null,
        init: function() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        },
        playTone: function(freq, type, duration) {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + duration);
        },
        move: () => Sound.playTone(300, 'sine', 0.1),
        jump: () => { 
            Sound.playTone(400, 'sine', 0.1);
            setTimeout(() => Sound.playTone(600, 'sine', 0.15), 50);
        },
        turn: () => Sound.playTone(200, 'triangle', 0.1),
        win: () => {
            [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Sound.playTone(f, 'square', 0.2), i*100));
        },
        fail: () => {
            [300, 200, 100].forEach((f, i) => setTimeout(() => Sound.playTone(f, 'sawtooth', 0.2), i*150));
        },
        click: () => Sound.playTone(800, 'sine', 0.05)
    };

    // ================= GAME ENGINE =================
    const Game = {
        container: null,
        state: {
            levelIdx: 0,
            gridSize: 5,
            player: { x: 0, y: 0, dir: 1 }, 
            commands: [],
            isRunning: false,
            mapData: [],
            maxTime: 0,
            timeLeft: 0,
            timerId: null
        },

        el: { board: null, queue: null, time: null, count: null, timerBar: null },

        init: function(container, options = {}) {
            this.container = container;
            Sound.init();
            this.renderLayout();
            this.loadLevel(0);
            
            // Listen for language changes
            document.addEventListener('i18n:loaded', () => {
                this.renderLayout();
                this.loadLevel(this.state.levelIdx);
                this.updateQueueUI();
            });
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="cr-wrapper">
                    <div class="cr-status-bar">
                        <div class="cr-stat-item">
                            <span class="cr-label">${getUIText('labels.level', 'LEVEL')}</span>
                            <div class="cr-value-row">
                                <span id="ui-level">1</span>
                            </div>
                        </div>
                        
                        <div class="cr-stat-group">
                            <div class="cr-stat-item">
                                <span class="cr-label">${getUIText('labels.time', 'TIME')}</span>
                                <div class="cr-value-row" style="flex-direction:column; gap:0;">
                                    <span id="ui-time">20</span>
                                    <div class="cr-timer-bar-bg"><div id="ui-timer-bar" class="cr-timer-bar-fill"></div></div>
                                </div>
                            </div>
                            <div class="cr-stat-item">
                                <span class="cr-label">${getUIText('labels.cmd', 'CMD')}</span>
                                <div class="cr-value-row">
                                    <span id="ui-count">0/0</span>
                                </div>
                            </div>
                        </div>

                        <button class="cr-btn-util" id="btn-sound">🔊</button>
                    </div>
                    
                    <div class="cr-board-area">
                        <div class="cr-grid" id="cr-grid"></div>
                    </div>

                    <div class="cr-controls">
                        <div class="cr-queue" id="cr-queue">
                            <span style="color:#aaa; font-size:0.9rem;">${getUIText('emptyQueue', '명령어를 넣어주세요')}</span>
                        </div>
                        
                        <div class="cr-palette">
                            <button class="cr-btn cr-btn-left" data-cmd="left">↺</button>
                            <button class="cr-btn cr-btn-fwd" data-cmd="fwd">⬆️</button>
                            <button class="cr-btn cr-btn-jump" data-cmd="jump">${getUIText('buttons.jump', 'JUMP')}</button>
                            <button class="cr-btn cr-btn-right" data-cmd="right">↻</button>
                        </div>

                        <div class="cr-actions">
                            <button class="cr-action-btn cr-btn-clear" id="btn-clear">${getUIText('buttons.clear', '지우기')}</button>
                            <button class="cr-action-btn cr-btn-run" id="btn-run">${getUIText('buttons.run', '실행 (RUN)')}</button>
                        </div>
                    </div>

                    <div class="cr-modal" id="cr-modal">
                        <div class="cr-modal-content">
                            <h2 id="modal-title">${getUIText('modal.success.title', '성공!')}</h2>
                            <p id="modal-msg">${getUIText('modal.success.msgAlt', '당근을 찾았어요!')}</p>
                            <button class="cr-action-btn cr-btn-run" id="modal-btn">${getUIText('buttons.nextLevel', '다음 레벨')}</button>
                        </div>
                    </div>
                </div>
            `;

            this.el.grid = document.getElementById('cr-grid');
            this.el.queue = document.getElementById('cr-queue');
            this.el.time = document.getElementById('ui-time');
            this.el.timerBar = document.getElementById('ui-timer-bar');
            this.el.count = document.getElementById('ui-count');
            
            this.container.querySelectorAll('.cr-btn').forEach(btn => {
                btn.onclick = () => this.addCommand(btn.dataset.cmd);
            });
            document.getElementById('btn-clear').onclick = () => this.clearCommands();
            document.getElementById('btn-run').onclick = () => this.runSequence();
            document.getElementById('modal-btn').onclick = () => this.nextLevel();
        },

        loadLevel: function(idx) {
            if (this.state.timerId) clearInterval(this.state.timerId);
            
            if (idx >= LEVELS.length) idx = 0;
            this.state.levelIdx = idx;
            const level = LEVELS[idx];
            
            this.state.gridSize = level.grid.length;
            this.state.mapData = JSON.parse(JSON.stringify(level.grid)); 
            this.state.maxTime = level.timeLimit;
            this.state.timeLeft = level.timeLimit;
            
            this.el.grid.style.gridTemplateColumns = `repeat(${this.state.gridSize}, 1fr)`;

            for(let y=0; y<this.state.gridSize; y++) {
                for(let x=0; x<this.state.gridSize; x++) {
                    if (this.state.mapData[y][x] === 2) {
                        this.state.player = { x, y, dir: level.startDir };
                    }
                }
            }

            this.state.commands = [];
            this.state.isRunning = false;
            
            document.getElementById('ui-level').innerText = idx + 1;
            this.updateTimeUI();
            this.updateCountUI();
            this.renderGrid();
            this.updateQueueUI();
            this.closeModal();
            this.startTimer();
        },

        startTimer: function() {
            this.updateTimeUI();
            this.state.timerId = setInterval(() => {
                if (this.state.isRunning) return; 
                
                this.state.timeLeft--;
                this.updateTimeUI();
                
                if (this.state.timeLeft <= 0) {
                    clearInterval(this.state.timerId);
                    Sound.fail();
                    const timeoutTitle = getUIText('modal.timeout.title', '시간 초과!');
                    const timeoutMsg = getUIText('modal.timeout.msg', '생각할 시간이 부족했어요.');
                    this.showModal(timeoutTitle, timeoutMsg, false);
                }
            }, 1000);
        },

        updateTimeUI: function() {
            this.el.time.innerText = this.state.timeLeft;
            const pct = Math.max(0, (this.state.timeLeft / this.state.maxTime) * 100);
            this.el.timerBar.style.width = `${pct}%`;
            
            if (pct <= 30) this.el.timerBar.style.backgroundColor = '#f44336'; // 빨강
            else if (pct <= 60) this.el.timerBar.style.backgroundColor = '#ff9800'; // 주황
            else this.el.timerBar.style.backgroundColor = '#4CAF50'; // 초록
        },

        updateCountUI: function() {
            const max = LEVELS[this.state.levelIdx].maxCmd;
            const cur = this.state.commands.length;
            this.el.count.innerText = `${cur}/${max}`;
            if (cur >= max) {
                this.el.count.style.color = '#f44336';
                this.el.queue.classList.add('full');
            } else {
                this.el.count.style.color = '#333';
                this.el.queue.classList.remove('full');
            }
        },

        renderGrid: function() {
            this.el.grid.innerHTML = '';
            const size = this.state.gridSize;
            const cellSize = Math.min((this.container.clientWidth - 40) / size, (this.container.clientHeight * 0.5) / size, 60);
            
            for(let y=0; y<size; y++) {
                for(let x=0; x<size; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'cr-cell';
                    cell.style.width = `${cellSize}px`;
                    cell.style.height = `${cellSize}px`;
                    
                    const type = this.state.mapData[y][x];
                    
                    if (type === 1) cell.innerHTML = '🪨'; 
                    else if (type === 3) cell.innerHTML = '🥕';
                    else if (type === 4) {
                        cell.classList.add('cr-cell-water'); 
                    }
                    
                    if (this.state.player.x === x && this.state.player.y === y) {
                        const player = document.createElement('div');
                        player.className = 'cr-object';
                        player.innerHTML = '🐰';
                        const deg = [0, 90, 180, 270][this.state.player.dir];
                        player.style.transform = `rotate(${deg}deg)`;
                        cell.appendChild(player);
                    }
                    
                    this.el.grid.appendChild(cell);
                }
            }
        },

        addCommand: function(cmd) {
            if (this.state.isRunning || this.state.timeLeft <= 0) return;
            if (Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume();
            
            const max = LEVELS[this.state.levelIdx].maxCmd;
            if (this.state.commands.length >= max) {
                Sound.fail();
                return;
            }

            this.state.commands.push(cmd);
            Sound.playTone(600, 'sine', 0.05);
            this.updateQueueUI();
            this.updateCountUI();
        },

        clearCommands: function() {
            if (this.state.isRunning) return;
            this.state.commands = [];
            this.updateQueueUI();
            this.updateCountUI();
            Sound.click();
        },

        updateQueueUI: function() {
            this.el.queue.innerHTML = '';
            if (this.state.commands.length === 0) {
                this.el.queue.innerHTML = `<span style="color:#aaa; font-size:0.9rem;">${getUIText('emptyQueue', '명령어를 넣어주세요')}</span>`;
                return;
            }
            
            const icons = { 'fwd': '⬆️', 'left': '↺', 'right': '↻', 'jump': 'JUMP' };
            
            this.state.commands.forEach((cmd, idx) => {
                const block = document.createElement('div');
                block.className = 'cr-cmd-block';
                block.innerHTML = icons[cmd];
                block.id = `cmd-${idx}`;
                if (cmd === 'jump') {
                    block.style.borderColor = '#9c27b0';
                    block.style.fontSize = '0.7rem';
                    block.style.fontWeight = 'bold';
                }
                
                block.onclick = () => {
                    if(!this.state.isRunning) {
                        this.state.commands.splice(idx, 1);
                        this.updateQueueUI();
                        this.updateCountUI();
                    }
                };
                this.el.queue.appendChild(block);
            });
            this.el.queue.scrollLeft = this.el.queue.scrollWidth;
        },

        runSequence: async function() {
            if (this.state.isRunning || this.state.commands.length === 0) return;
            
            const level = LEVELS[this.state.levelIdx];
             for(let y=0; y<this.state.gridSize; y++) {
                for(let x=0; x<this.state.gridSize; x++) {
                    if (this.state.mapData[y][x] === 2) {
                        this.state.player = { x, y, dir: level.startDir };
                    }
                }
            }
            this.renderGrid();

            this.state.isRunning = true;
            document.getElementById('btn-run').innerText = getUIText('buttons.running', '...');
            document.getElementById('btn-run').style.opacity = 0.7;

            for (let i = 0; i < this.state.commands.length; i++) {
                const block = document.getElementById(`cmd-${i}`);
                if(block) {
                    document.querySelectorAll('.cr-cmd-block').forEach(b => b.classList.remove('active'));
                    block.classList.add('active');
                }

                const cmd = this.state.commands[i];
                await this.executeStep(cmd);
                
                const result = this.checkStatus();
                if (result === 'win') {
                    if (this.state.timerId) clearInterval(this.state.timerId);
                    Sound.win();
                    const successTitle = getUIText('modal.success.title', '성공!');
                    const successMsg = getUIText('modal.success.msg', '당근을 맛있게 먹었어요!');
                    this.showModal(successTitle, successMsg, true);
                    this.state.isRunning = false;
                    this.resetBtn();
                    return;
                } else if (result === 'fail') {
                    Sound.fail();
                    const failTitle = getUIText('modal.fail.title', '실패 ㅠㅠ');
                    const failMsg = getUIText('modal.fail.msg', '물에 빠지거나 부딪혔어요.');
                    this.showModal(failTitle, failMsg, false);
                    this.state.isRunning = false;
                    this.resetBtn();
                    return;
                }

                const delay = this.state.gridSize > 6 ? 400 : 500;
                await new Promise(r => setTimeout(r, delay)); 
            }
            
            if (this.state.isRunning) {
                const notReachedTitle = getUIText('modal.notReached.title', '다시 해볼까요?');
                const notReachedMsg = getUIText('modal.notReached.msg', '목적지에 도착하지 못했어요.');
                this.showModal(notReachedTitle, notReachedMsg, false);
                this.state.isRunning = false;
                this.resetBtn();
            }
        },

        executeStep: async function(cmd) {
            const pl = this.state.player;
            
            if (cmd === 'left') {
                pl.dir = (pl.dir + 3) % 4;
                Sound.turn();
            } else if (cmd === 'right') {
                pl.dir = (pl.dir + 1) % 4;
                Sound.turn();
            } else if (cmd === 'fwd') {
                this.movePlayer(1);
                Sound.move();
            } else if (cmd === 'jump') {
                this.movePlayer(2); 
                Sound.jump();
            }
            this.renderGrid();
        },

        movePlayer: function(steps) {
            const pl = this.state.player;
            let dx = 0, dy = 0;
            if (pl.dir === 0) dy = -1;
            else if (pl.dir === 1) dx = 1;
            else if (pl.dir === 2) dy = 1;
            else if (pl.dir === 3) dx = -1;

            pl.x += dx * steps;
            pl.y += dy * steps;
        },

        checkStatus: function() {
            const pl = this.state.player;
            const size = this.state.gridSize;
            
            if (pl.x < 0 || pl.x >= size || pl.y < 0 || pl.y >= size) return 'fail';
            
            const cell = this.state.mapData[pl.y][pl.x];

            if (cell === 1) return 'fail'; 
            if (cell === 4) return 'fail'; 
            if (cell === 3) return 'win';
            
            return 'continue';
        },

        resetBtn: function() {
            document.getElementById('btn-run').innerText = getUIText('buttons.run', '실행 (RUN)');
            document.getElementById('btn-run').style.opacity = 1;
            document.querySelectorAll('.cr-cmd-block').forEach(b => b.classList.remove('active'));
        },

        showModal: function(title, msg, isWin) {
            const modal = document.getElementById('cr-modal');
            document.getElementById('modal-title').innerText = title;
            document.getElementById('modal-title').style.color = isWin ? '#4CAF50' : '#f44336';
            document.getElementById('modal-msg').innerText = msg;
            
            const btn = document.getElementById('modal-btn');
            btn.innerText = isWin ? getUIText('buttons.nextLevel', '다음 레벨') : getUIText('buttons.retry', '다시 하기');
            btn.onclick = () => {
                if (isWin) this.nextLevel();
                else {
                    this.closeModal();
                    this.loadLevel(this.state.levelIdx);
                }
            };
            modal.classList.add('show');
        },

        closeModal: function() {
            document.getElementById('cr-modal').classList.remove('show');
        },

        nextLevel: function() {
            const nextIdx = this.state.levelIdx + 1;
            if (nextIdx < LEVELS.length) {
                this.loadLevel(nextIdx);
            } else {
                alert(getUIText('allLevelsComplete', '대단해요! 코드 래빗 마스터! 🐰🥕🎓'));
                this.loadLevel(0);
            }
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();