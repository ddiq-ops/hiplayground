(function() {
    'use strict';

    // ================= 1. MUSIC LIST (20 Songs) =================
    // style: base frequency scale & waveform type
    const SONGS = [
        { id: 1, title: "NEON HIGHWAY", artist: "CyberPulse", bpm: 120, duration: 125, style: 'sawtooth' },
        { id: 2, title: "DIGITAL HEART", artist: "BitWave", bpm: 128, duration: 130, style: 'square' },
        { id: 3, title: "VOID WALKER", artist: "NullPtr", bpm: 135, duration: 140, style: 'sine' },
        { id: 4, title: "SYSTEM ERROR", artist: "GlitchM", bpm: 145, duration: 130, style: 'sawtooth' },
        { id: 5, title: "LUNAR TIDES", artist: "MoonBase", bpm: 110, duration: 150, style: 'triangle' },
        { id: 6, title: "HYPER DRIVE", artist: "SpeedX", bpm: 160, duration: 135, style: 'square' },
        { id: 7, title: "MIDNIGHT RAIN", artist: "LoFi Bot", bpm: 95, duration: 145, style: 'sine' },
        { id: 8, title: "DATA STORM", artist: "CyberPulse", bpm: 150, duration: 140, style: 'sawtooth' },
        { id: 9, title: "CORE MELTDOWN", artist: "Reactor", bpm: 175, duration: 130, style: 'square' },
        { id: 10, title: "ZERO GRAVITY", artist: "SpaceX", bpm: 100, duration: 160, style: 'sine' },
        { id: 11, title: "PIXEL DUST", artist: "8-Bit Hero", bpm: 130, duration: 125, style: 'square' },
        { id: 12, title: "GALAXY EXPRESS", artist: "Starlight", bpm: 140, duration: 150, style: 'triangle' },
        { id: 13, title: "BASS KICKER", artist: "Woofer", bpm: 125, duration: 140, style: 'sawtooth' },
        { id: 14, title: "TRANSCENDENCE", artist: "Spirit", bpm: 138, duration: 180, style: 'sine' },
        { id: 15, title: "CYBER PUNK 2099", artist: "NeoSeoul", bpm: 155, duration: 145, style: 'sawtooth' },
        { id: 16, title: "INFINITY LOOP", artist: "TimeLord", bpm: 170, duration: 135, style: 'square' },
        { id: 17, title: "DREAM SCAPE", artist: "Sleepy", bpm: 90, duration: 160, style: 'triangle' },
        { id: 18, title: "HARDCORE RAVE", artist: "GabberKing", bpm: 190, duration: 130, style: 'sawtooth' },
        { id: 19, title: "THE FINAL BOSS", artist: "Admin", bpm: 200, duration: 150, style: 'square' },
        { id: 20, title: "GAME OVER", artist: "EndUser", bpm: 220, duration: 140, style: 'sawtooth' }
    ];

    // ================= 2. KEY CONFIGS =================
    const KEYS = {
        4: { labels: ['D','F','J','K'], codes: ['KeyD','KeyF','KeyJ','KeyK'], scale: [0,2,4,7], colors: ['#0ff','#0ff','#f0f','#f0f'] },
        6: { labels: ['S','D','F','J','K','L'], codes: ['KeyS','KeyD','KeyF','KeyJ','KeyK','KeyL'], scale: [0,1,2,4,5,7], colors: ['#f0f','#0ff','#0ff','#0ff','#0ff','#f0f'] },
        8: { labels: ['A','S','D','F','H','J','K','L'], codes: ['KeyA','KeyS','KeyD','KeyF','KeyH','KeyJ','KeyK','KeyL'], scale: [0,1,2,3,4,5,6,7], colors: ['#f05','#f05','#0ff','#0ff','#0ff','#0ff','#f05','#f05'] }
    };

    // ================= 3. AUDIO ENGINE (Procedural) =================
    const Audio = {
        ctx: null, master: null, delay: null,
        isPlaying: false, nextTime: 0, beat: 0, 
        currentSong: null, startTime: 0,

        // Scales (C Minor Pentatonic extended)
        scaleFreq: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25],

        init: function() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.4;
            
            this.delay = this.ctx.createDelay();
            this.delay.delayTime.value = 0.25;
            const fb = this.ctx.createGain(); fb.gain.value = 0.3;
            this.delay.connect(fb); fb.connect(this.delay);
            this.delay.connect(this.master);
            this.master.connect(this.ctx.destination);
        },

        playSong: function(song) {
            if(!this.ctx) this.init();
            if(this.ctx.state === 'suspended') this.ctx.resume();
            
            this.currentSong = song;
            this.isPlaying = true;
            this.beat = 0;
            this.nextTime = this.ctx.currentTime + 0.1;
            this.startTime = this.ctx.currentTime;
            this.schedule();
        },

        stop: function() { this.isPlaying = false; },

        schedule: function() {
            if(!this.isPlaying) return;
            const secPerBeat = 60.0 / this.currentSong.bpm;
            
            while(this.nextTime < this.ctx.currentTime + 0.1) {
                this.triggerBeat(this.nextTime, this.beat);
                this.nextTime += secPerBeat / 4; // 16bit resolution
                this.beat++;
            }
            setTimeout(() => this.schedule(), 25);
        },

        triggerBeat: function(time, beat) {
            const step = beat % 16;
            const style = this.currentSong.style;
            
            // Kick (Strong Beat)
            if(step % 4 === 0) this.playTone(time, 100, 'square', 0.2, 0.7);
            
            // Hi-hat
            if(step % 2 === 0) this.playNoise(time, 0.05, 0.1);
            
            // Snare
            if(step === 4 || step === 12) this.playNoise(time, 0.15, 0.3);
            
            // Bass/Lead (Procedural based on beat)
            if([0,3,7,10,14].includes(step)) {
                // Change pitch over time (arpeggio)
                const pitchIdx = (Math.floor(beat/16) + step) % 8;
                const freq = this.scaleFreq[pitchIdx] / (style==='square'?2:1);
                this.playTone(time, freq, style, 0.3, 0.2);
            }

            Game.spawnNotes(step);
        },

        playTone: function(time, freq, type, dur, vol) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
            
            osc.connect(gain); gain.connect(this.master);
            if(type !== 'square') gain.connect(this.delay); // Add delay to non-kick
            osc.start(time); osc.stop(time + dur);
        },

        playNoise: function(time, dur, vol) {
            const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for(let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
            
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(vol, time);
            gain.gain.linearRampToValueAtTime(0, time+dur);
            
            src.connect(gain); gain.connect(this.master);
            src.start(time);
        },

        playHit: function(lane) {
            if(!this.ctx) return;
            // Synth sound based on lane
            const freq = this.scaleFreq[lane % 8] * 2;
            this.playTone(this.ctx.currentTime, freq, 'sine', 0.1, 0.1);
        },
        
        getProgress: function() {
            if(!this.isPlaying) return 0;
            const elapsed = this.ctx.currentTime - this.startTime;
            return Math.min(1, elapsed / this.currentSong.duration);
        }
    };

    // ================= 4. GAME ENGINE =================
    const Game = {
        container: null, canvas: null, ctx: null,
        width: 0, height: 0,
        
        state: {
            scene: 'select', // select, mode, playing, result
            song: null,
            keyMode: 4,
            score: 0, combo: 0, hp: 100, maxHp: 100,
            notes: [], particles: [],
            laneWidth: 0,
            speed: 10,
            pressed: []
        },

        init: function(container) {
            this.container = container;
            this.renderLayout(); // Render basic structure
            this.renderSongSelect(); // Start at Song Select
            
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('keydown', e => this.handleInput(e, true));
            window.addEventListener('keyup', e => this.handleInput(e, false));
            
            this.loop();
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="nb-wrapper">
                    <div class="nb-bg-grid"></div>
                    
                    <div class="nb-select-screen" id="scene-select">
                        <div class="nb-select-header">SELECT MUSIC</div>
                        <div class="nb-song-list" id="song-list"></div>
                    </div>

                    <div class="nb-mode-modal" id="scene-mode">
                        <h2 style="font-size:2rem; color:#fff">SELECT KEY MODE</h2>
                        <div class="nb-mode-btn-group">
                            <button class="nb-mode-btn" onclick="Game.setMode(4)">4K<span>LITE</span></button>
                            <button class="nb-mode-btn" onclick="Game.setMode(6)">6K<span>PRO</span></button>
                            <button class="nb-mode-btn" onclick="Game.setMode(8)">8K<span>MANIA</span></button>
                        </div>
                    </div>

                    <div class="nb-header" id="hud-header" style="display:none">
                        <div class="nb-music-info">
                            <div class="nb-music-title" id="ui-title">TITLE</div>
                            <div class="nb-music-meta" id="ui-meta">BPM 120</div>
                        </div>
                        <div class="nb-score-box">
                            <div class="nb-val" id="ui-score">0</div>
                            <div class="nb-label">COMBO <span id="ui-combo" style="color:#fff; font-size:1rem">0</span></div>
                        </div>
                    </div>
                    
                    <div class="nb-progress-container" id="ui-progress-box" style="display:none">
                        <div class="nb-progress-fill" id="ui-progress"></div>
                    </div>

                    <div class="nb-game-area">
                        <canvas id="game-canvas"></canvas>
                        <div class="nb-judge" id="ui-judge">READY</div>
                        <div class="nb-hp-gauge" id="ui-hp-box" style="display:none">
                            <div class="nb-hp-fill-v" id="ui-hp"></div>
                        </div>
                    </div>

                    <div class="nb-controls" id="ui-controls" style="display:none"></div>

                    <div class="nb-result-screen" id="scene-result">
                        <div class="nb-res-grade" id="res-grade" style="color:#00ff00">S</div>
                        <div class="nb-res-score">SCORE: <span id="res-score">000000</span></div>
                        <button class="nb-back-btn" onclick="Game.toSelect()">BACK TO SELECT</button>
                    </div>
                </div>
            `;
        },

        renderSongSelect: function() {
            const list = document.getElementById('song-list');
            list.innerHTML = '';
            
            SONGS.forEach((song, idx) => {
                const item = document.createElement('div');
                item.className = 'nb-song-item';
                item.innerHTML = `
                    <div class="nb-song-info">
                        <h3>${song.title}</h3>
                        <p>${song.artist} | Time: ${Math.floor(song.duration/60)}:${(song.duration%60).toString().padStart(2,'0')}</p>
                    </div>
                    <div class="nb-song-bpm">${song.bpm}</div>
                `;
                item.onclick = () => this.onSongSelect(idx);
                list.appendChild(item);
            });
            
            this.switchScene('select');
        },

        onSongSelect: function(idx) {
            this.state.song = SONGS[idx];
            this.switchScene('mode');
        },

        setMode: function(keys) {
            this.state.keyMode = keys;
            this.startGame();
        },

        startGame: function() {
            this.state.score = 0;
            this.state.combo = 0;
            this.state.hp = 100;
            this.state.notes = [];
            this.state.particles = [];
            this.state.pressed = new Array(this.state.keyMode).fill(false);
            
            // UI Setup
            const song = this.state.song;
            document.getElementById('ui-title').innerText = song.title;
            document.getElementById('ui-meta').innerText = `BPM ${song.bpm} | ${this.state.keyMode}KEY`;
            document.getElementById('ui-score').innerText = 0;
            document.getElementById('ui-combo').innerText = 0;
            document.getElementById('ui-progress').style.width = '0%';
            
            // Build Controls
            const controls = document.getElementById('ui-controls');
            controls.innerHTML = '';
            const keyCfg = KEYS[this.state.keyMode];
            
            for(let i=0; i<this.state.keyMode; i++) {
                const k = document.createElement('div');
                k.className = 'nb-key';
                k.innerHTML = `<span class="nb-key-char">${keyCfg.labels[i]}</span>`;
                k.dataset.lane = i;
                
                // Touch
                const press = (e) => { e.preventDefault(); this.triggerInput(i); };
                const rel = (e) => { e.preventDefault(); this.state.pressed[i]=false; };
                k.addEventListener('mousedown', press);
                k.addEventListener('touchstart', press);
                k.addEventListener('mouseup', rel);
                k.addEventListener('touchend', rel);
                
                controls.appendChild(k);
            }

            this.resize();
            Audio.playSong(song);
            this.switchScene('playing');
        },

        spawnNotes: function(step) {
            if(this.state.scene !== 'playing') return;
            const density = Math.max(1, this.state.song.bpm / 60); // BPM 높으면 노트 많음
            const keys = this.state.keyMode;
            
            // Probabilistic Spawning
            const isKick = (step%4===0);
            let chance = isKick ? 0.9 : 0.3; 
            
            if(Math.random() < chance * 0.7) {
                const lane = Math.floor(Math.random() * keys);
                this.state.notes.push({
                    lane: lane, y: -50, active: true,
                    color: KEYS[keys].colors[lane]
                });
                
                // Double note?
                if(density > 2 && Math.random() < 0.3) {
                    const lane2 = (lane + Math.floor(keys/2)) % keys;
                    this.state.notes.push({
                        lane: lane2, y: -50, active: true,
                        color: KEYS[keys].colors[lane2]
                    });
                }
            }
        },

        handleInput: function(e, isDown) {
            if(this.state.scene !== 'playing') return;
            const code = e.code;
            const keyCfg = KEYS[this.state.keyMode];
            const idx = keyCfg.codes.indexOf(code);
            
            if(idx !== -1) {
                if(isDown) {
                    if(!e.repeat) this.triggerInput(idx);
                } else {
                    this.state.pressed[idx] = false;
                }
            }
        },

        triggerInput: function(lane) {
            this.state.pressed[lane] = true;
            Audio.playHit(lane); // Sound feedback
            
            // Hit Logic
            const hitY = this.height - 20;
            const hitWindow = 150; // Tolerance
            
            const noteIdx = this.state.notes.findIndex(n => n.active && n.lane === lane && n.y > hitY - hitWindow);
            
            if(noteIdx !== -1) {
                const n = this.state.notes[noteIdx];
                const diff = Math.abs(n.y - hitY);
                
                if(diff < 30) this.judge('PERFECT', 100, '#00ffff');
                else if(diff < 60) this.judge('GREAT', 80, '#00ff00');
                else if(diff < 100) this.judge('GOOD', 50, '#ffeb3b');
                else this.judge('BAD', 20, '#ff0055');
                
                n.active = false;
                this.createParticles(n.lane, n.color);
            }
        },

        judge: function(text, points, color) {
            this.state.score += points + (this.state.combo * 10);
            this.state.combo++;
            this.state.hp = Math.min(100, this.state.hp + 1);
            
            const el = document.getElementById('ui-judge');
            el.innerText = text;
            el.style.color = color;
            el.classList.remove('pop');
            void el.offsetWidth;
            el.classList.add('pop');
            
            this.updateUI();
        },

        miss: function() {
            this.state.combo = 0;
            this.state.hp -= 5;
            this.judge('MISS', 0, '#aaa');
            if(this.state.hp <= 0) this.gameOver();
        },

        createParticles: function(lane, color) {
            const x = lane * this.state.laneWidth + this.state.laneWidth/2;
            const y = this.height - 20;
            for(let i=0; i<8; i++) {
                this.state.particles.push({
                    x, y, vx: (Math.random()-0.5)*10, vy: (Math.random()-1)*15,
                    life: 1.0, color: color
                });
            }
        },

        updateUI: function() {
            document.getElementById('ui-score').innerText = this.state.score.toLocaleString();
            document.getElementById('ui-combo').innerText = this.state.combo;
            
            const hpBar = document.getElementById('ui-hp');
            hpBar.style.height = this.state.hp + '%';
            hpBar.style.background = this.state.hp > 30 ? 'linear-gradient(to top, #ff0055, #00ffff)' : 'red';
        },

        loop: function() {
            requestAnimationFrame(() => this.loop());
            
            const ctx = this.ctx;
            const w = this.width;
            const h = this.height;
            const st = this.state;
            
            if(st.scene !== 'playing') return;

            // 1. Update Game State (Progress)
            const progress = Audio.getProgress();
            document.getElementById('ui-progress').style.width = (progress * 100) + '%';
            if(progress >= 1) this.gameClear();

            // 2. Render
            ctx.clearRect(0,0,w,h);
            
            // Lanes
            const lw = this.state.laneWidth;
            ctx.lineWidth = 2;
            for(let i=0; i<st.keyMode; i++) {
                ctx.strokeStyle = st.pressed[i] ? 'rgba(0,255,255,0.5)' : 'rgba(255,255,255,0.05)';
                ctx.beginPath(); ctx.moveTo(i*lw, 0); ctx.lineTo(i*lw, h); ctx.stroke();
                
                // Key press light
                if(st.pressed[i]) {
                    const grd = ctx.createLinearGradient(0,h,0,h-100);
                    grd.addColorStop(0, 'rgba(0,255,255,0.3)');
                    grd.addColorStop(1, 'transparent');
                    ctx.fillStyle = grd;
                    ctx.fillRect(i*lw, h-100, lw, 100);
                }
            }
            
            // Hit Line
            ctx.beginPath(); ctx.moveTo(0, h-20); ctx.lineTo(w, h-20);
            ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3; ctx.stroke();

            // Notes
            // Speed based on BPM: BPM 120 -> Speed 10, BPM 200 -> Speed 18
            const speed = st.song ? (st.song.bpm / 12) : 10;
            
            for(let i=st.notes.length-1; i>=0; i--) {
                const n = st.notes[i];
                if(!n.active) { st.notes.splice(i,1); continue; }
                
                n.y += speed;
                if(n.y > h) {
                    this.miss();
                    st.notes.splice(i,1);
                    continue;
                }
                
                const x = n.lane * lw;
                
                // Note style
                ctx.shadowBlur = 10; ctx.shadowColor = n.color;
                ctx.fillStyle = n.color;
                ctx.fillRect(x+4, n.y-20, lw-8, 20);
                ctx.fillStyle = 'white';
                ctx.fillRect(x+4, n.y-10, lw-8, 5);
                ctx.shadowBlur = 0;
            }

            // Particles
            for(let i=st.particles.length-1; i>=0; i--) {
                const p = st.particles[i];
                p.x += p.vx; p.y += p.vy; p.life -= 0.05;
                if(p.life <= 0) st.particles.splice(i,1);
                else {
                    ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
                    ctx.globalAlpha = 1;
                }
            }
            
            // Key UI active state update (visual sync)
            const keys = document.querySelectorAll('.nb-key');
            keys.forEach((k,i) => {
                if(st.pressed[i]) k.classList.add('active');
                else k.classList.remove('active');
            });
        },

        gameClear: function() {
            Audio.stop();
            this.switchScene('result');
            document.getElementById('res-grade').innerText = this.state.score > 50000 ? 'S' : (this.state.score > 30000 ? 'A' : 'B');
            document.getElementById('res-grade').style.color = '#00ff00';
            document.getElementById('res-score').innerText = this.state.score.toLocaleString();
        },

        gameOver: function() {
            Audio.stop();
            this.switchScene('result');
            document.getElementById('res-grade').innerText = 'F';
            document.getElementById('res-grade').style.color = '#ff0055';
            document.getElementById('res-score').innerText = this.state.score.toLocaleString();
        },

        toSelect: function() {
            this.switchScene('select');
        },

        switchScene: function(scene) {
            this.state.scene = scene;
            
            document.getElementById('scene-select').style.display = 'none';
            document.getElementById('scene-mode').classList.remove('active');
            document.getElementById('scene-result').classList.remove('active');
            document.getElementById('hud-header').style.display = 'none';
            document.getElementById('ui-controls').style.display = 'none';
            document.getElementById('ui-progress-box').style.display = 'none';
            document.getElementById('ui-hp-box').style.display = 'none';

            if(scene === 'select') {
                document.getElementById('scene-select').style.display = 'flex';
            } else if(scene === 'mode') {
                document.getElementById('scene-mode').classList.add('active');
            } else if(scene === 'playing') {
                document.getElementById('hud-header').style.display = 'flex';
                document.getElementById('ui-controls').style.display = 'flex';
                document.getElementById('ui-progress-box').style.display = 'block';
                document.getElementById('ui-hp-box').style.display = 'block';
            } else if(scene === 'result') {
                document.getElementById('scene-result').classList.add('active');
            }
        },

        resize: function() {
            if(!this.container) return;
            const area = document.querySelector('.nb-game-area');
            if(area) {
                this.width = area.clientWidth;
                this.height = area.clientHeight;
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                if(this.state.keyMode) this.state.laneWidth = this.width / this.state.keyMode;
            }
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();