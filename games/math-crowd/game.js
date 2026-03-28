(function() {
    'use strict';

    const Game = {
        canvas: null, ctx: null,
        
        state: {
            phase: 'READY',
            player: { lane: 1, x: 0, count: 10 },
            scrollSpeed: 400, 
            distance: 0,
            score: 0,
            
            nextSpawnDist: 800,
            nextBossDist: 3000, 
            
            rows: [], 
            particles: [], 
            
            shieldTimer: 0,
            screenFlashTimer: 0,
            spawnCount: 0,

            // [신규] 획득한 아이템 보유 상태
            hasShield: false,
            hasBomb: false,
            
            swipeStartX: 0,
            loopId: null,
            lastTime: 0
        },

        init: function(container) {
            this.container = container;
            this.renderLayout();
            
            this.canvas = document.getElementById('mc-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            const handleTouchStart = (e) => {
                e.preventDefault();
                if (this.state.phase === 'READY') {
                    this.state.phase = 'PLAYING';
                    document.getElementById('ui-guide').style.display = 'none';
                }
                this.state.swipeStartX = e.touches ? e.touches[0].clientX : e.clientX;
            };

            const handleTouchEnd = (e) => {
                e.preventDefault();
                if (this.state.phase === 'END') return;
                
                const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
                const diffX = endX - this.state.swipeStartX;

                if (Math.abs(diffX) > 30) {
                    if (diffX > 0 && this.state.player.lane < 2) {
                        this.state.player.lane++; 
                    } else if (diffX < 0 && this.state.player.lane > 0) {
                        this.state.player.lane--; 
                    }
                }
            };

            window.addEventListener('keydown', (e) => {
                if (this.state.phase === 'END') return;
                if (this.state.phase === 'READY' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                    this.state.phase = 'PLAYING';
                    document.getElementById('ui-guide').style.display = 'none';
                }
                if (e.key === 'ArrowLeft' && this.state.player.lane > 0) this.state.player.lane--;
                if (e.key === 'ArrowRight' && this.state.player.lane < 2) this.state.player.lane++;
            });

            this.canvas.addEventListener('mousedown', handleTouchStart);
            window.addEventListener('mouseup', handleTouchEnd);
            this.canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
            window.addEventListener('touchend', handleTouchEnd);

            this.startGame();
            
            if(this.loopId) cancelAnimationFrame(this.loopId);
            this.lastTime = performance.now();
            this.loop(this.lastTime);
        },

        resizeCanvas: function() {
            if(!this.canvas) return;
            const parent = this.canvas.parentElement;
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
            this.updatePlayerTargetX();
            if (this.state.phase === 'READY') this.state.player.x = this.getLaneX(1);
        },

        getLaneX: function(laneIndex) {
            const laneWidth = this.canvas.width / 3;
            return (laneIndex * laneWidth) + (laneWidth / 2);
        },

        updatePlayerTargetX: function() {
            this.state.player.targetX = this.getLaneX(this.state.player.lane);
        },

        renderLayout: function() {
            this.container.innerHTML = `
                <div class="mc-wrapper">
                    <div class="mc-header">
                        <div class="mc-score-box">
                            <span class="mc-score-label">SCORE (DISTANCE)</span>
                            <span class="mc-score-val" id="ui-score">0m</span>
                        </div>
                        <div class="mc-count">⚔️ <span id="ui-count">10</span></div>
                    </div>
                    
                    <div class="mc-game-area">
                        <canvas id="mc-canvas"></canvas>
                        <div class="mc-guide-toast" id="ui-guide">적을 피하거나 물리치고 아이템을 획득하세요!</div>
                    </div>

                    <div class="mc-overlay" id="ui-overlay">
                        <div class="mc-result-title" id="ui-result-title">GAME OVER</div>
                        <div class="mc-result-msg" id="ui-result-msg">군단이 전멸했습니다.</div>
                        <button class="btn-next" id="btn-next" onclick="Game.startGame()">TRY AGAIN</button>
                    </div>
                </div>
            `;
        },

        startGame: function() {
            this.state.phase = 'READY';
            this.state.player.lane = 1; 
            this.state.player.count = 10;
            this.state.distance = 0;
            this.state.score = 0;
            this.state.scrollSpeed = 400; 
            
            this.state.nextSpawnDist = 800;
            this.state.nextBossDist = 3000;
            
            this.state.rows = [];
            this.state.particles = [];
            
            this.state.shieldTimer = 0;
            this.state.screenFlashTimer = 0;
            this.state.spawnCount = 0;

            // 아이템 초기화
            this.state.hasShield = false;
            this.state.hasBomb = false;

            this.updatePlayerTargetX();
            this.state.player.x = this.getLaneX(1);

            document.getElementById('ui-overlay').classList.remove('active');
            document.getElementById('ui-guide').style.display = 'block';
            this.updateUI();
        },

        formatNumber: function(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return Math.floor(num).toString();
        },

        updateUI: function() {
            document.getElementById('ui-count').innerText = this.formatNumber(this.state.player.count);
            document.getElementById('ui-score').innerText = Math.floor(this.state.score) + 'm';
        },

        getSpriteInfo: function(count, isPlayer) {
            if (isPlayer) {
                if (count < 300) return { icon: '🏃‍♂️', size: 24 }; 
                if (count < 5000) return { icon: '🤺', size: 28 }; 
                return { icon: '🦸‍♂️', size: 34 }; 
            } else {
                if (count < 300) return { icon: '🧟', size: 24 }; 
                if (count < 5000) return { icon: '🧛', size: 28 }; 
                return { icon: '👹', size: 34 }; 
            }
        },

        spawnRow: function() {
            const difficulty = 1 + (this.state.distance / 2000); 
            const currentCount = Math.max(10, this.state.player.count); 

            if (this.state.distance > this.state.nextBossDist) {
                this.spawnBossRow(currentCount);
                this.state.nextBossDist += 4000; 
                this.state.nextSpawnDist += 800; 
                return;
            }

            this.state.spawnCount++;
            const c = this.state.spawnCount;

            let rowType = 'ENEMY';
            if (c % 5 === 0) rowType = 'ITEM';
            else if (c % 2 === 0) rowType = 'GATE';

            let newRow = {
                y: -(this.state.nextSpawnDist), 
                type: rowType,
                passed: false,
                items: [null, null, null] 
            };

            if (rowType === 'GATE') {
                const goodOps = ['+', 'x'];
                const badOps = ['-', '÷'];
                for(let i=0; i<3; i++) {
                    const isGood = Math.random() > 0.3; 
                    const op = isGood ? goodOps[Math.floor(Math.random() * goodOps.length)] : badOps[Math.floor(Math.random() * badOps.length)];
                    let val = 0;
                    
                    if (op === 'x') val = Math.floor(Math.random() * 3) + 2; 
                    else if (op === '÷') val = Math.floor(Math.random() * 2) + 2; 
                    else if (op === '+') val = Math.floor(currentCount * (0.2 + Math.random() * 0.5)) + 15; 
                    else if (op === '-') val = Math.floor(currentCount * (0.1 + Math.random() * 0.4)) + 5;

                    newRow.items[i] = { op: op, val: val };
                }
            } 
            else if (rowType === 'ENEMY') {
                let filledLanes = 0;
                while(filledLanes === 0) {
                    for(let i=0; i<3; i++) {
                        if (Math.random() > 0.4) { 
                            const enemyMultiplier = 0.1 + Math.random() * 0.4;
                            let enemyCount = Math.floor(currentCount * enemyMultiplier);
                            enemyCount = Math.max(enemyCount, Math.floor(5 * difficulty)); 
                            
                            newRow.items[i] = { count: enemyCount, dead: false };
                            filledLanes++;
                        }
                    }
                }
            }
            else if (rowType === 'ITEM') {
                const lane = Math.floor(Math.random() * 3);
                const itemTypes = [
                    { id: 'SHIELD', icon: '🛡️', color: '#ffca28', desc: '무적 방패' },
                    { id: 'BOMB', icon: '💣', color: '#424242', desc: '적 반토막' },
                    { id: 'HEAL', icon: '👼', color: '#ff4081', desc: '+100명' }
                ];
                newRow.items[lane] = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            }

            this.state.rows.push(newRow);
            this.state.nextSpawnDist += 600 + (difficulty * 20); 
        },

        spawnBossRow: function(currentCount) {
            const bossCount = Math.max(50, Math.floor(currentCount * (0.8 + Math.random() * 0.4)));
            this.state.rows.push({
                y: -(this.state.nextSpawnDist),
                type: 'BOSS',
                passed: false,
                count: bossCount,
                maxCount: bossCount,
                dead: false
            });
        },

        spawnParticles: function(cx, cy, type='COMBAT') {
            for(let i=0; i<3; i++) {
                let char = '💥';
                if (type === 'COMBAT') char = ['💥', '⚔️', '🩸'][Math.floor(Math.random() * 3)];
                if (type === 'ITEM') char = ['✨', '⭐', '💫'][Math.floor(Math.random() * 3)];
                
                this.state.particles.push({
                    x: cx + (Math.random() - 0.5) * 60,
                    y: cy + (Math.random() - 0.5) * 60,
                    vx: (Math.random() - 0.5) * 300,
                    vy: (Math.random() - 0.5) * 300 - 50,
                    life: 0.5,
                    maxLife: 0.5,
                    char: char
                });
            }
        },

        applyGateMath: function(count, op, val) {
            let result = count;
            if (op === '+') result += val;
            if (op === '-') result -= val;
            if (op === 'x') result *= val;
            if (op === '÷') result /= val;
            
            result = Math.min(result, 9999999); 
            return Math.max(1, Math.floor(result)); 
        },

        // [신규] 보유한 아이템을 전투 직전에 터뜨리는 함수
        triggerStoredItems: function() {
            if (this.state.hasBomb) {
                this.state.hasBomb = false;
                this.state.screenFlashTimer = 0.2; 
                this.state.rows.forEach(r => {
                    const rY = r.y + this.state.distance;
                    if (rY > -200 && rY < this.canvas.height) {
                        if (r.type === 'ENEMY') {
                            r.items.forEach(e => { if(e) e.count = Math.max(1, e.count / 2); });
                        } else if (r.type === 'BOSS') {
                            r.count = Math.max(1, r.count / 2);
                        }
                    }
                });
            }

            if (this.state.hasShield) {
                this.state.hasShield = false;
                this.state.shieldTimer = 3.0; // 이때부터 3초간 무적 시작
            }
        },

        loop: function(time) {
            const dt = Math.min((time - this.lastTime) / 1000, 0.05);
            this.lastTime = time;
            this.update(dt);
            this.draw();
            this.loopId = requestAnimationFrame((t) => this.loop(t));
        },

        update: function(dt) {
            if (this.state.phase === 'READY' || this.state.phase === 'END') return;

            if (this.state.shieldTimer > 0) this.state.shieldTimer -= dt;
            if (this.state.screenFlashTimer > 0) this.state.screenFlashTimer -= dt;

            this.updatePlayerTargetX();
            this.state.player.x += (this.state.player.targetX - this.state.player.x) * 15 * dt;

            if (this.state.distance + this.canvas.height + 1500 > this.state.nextSpawnDist) {
                this.spawnRow();
            }

            for (let i = this.state.particles.length - 1; i >= 0; i--) {
                let p = this.state.particles[i];
                p.life -= dt;
                if (p.life <= 0) this.state.particles.splice(i, 1);
                else { p.x += p.vx * dt; p.y += p.vy * dt; }
            }

            const playerVisualY = this.canvas.height - 150; 
            let combatOccurring = false;

            for (let i = 0; i < this.state.rows.length; i++) {
                let row = this.state.rows[i];
                const screenY = row.y + this.state.distance;

                if (row.passed || screenY < 0) continue;

                if (row.type === 'BOSS') {
                    if (screenY > playerVisualY - 80 && screenY < playerVisualY + 80) {
                        
                        // [신규] 보스와 부딪히는 순간 보유한 아이템 자동 발동
                        this.triggerStoredItems();

                        combatOccurring = true;
                        
                        let myDrain = Math.max(500, this.state.player.count * 2.5) * dt; 
                        let enemyDrain = myDrain;
                        
                        if (this.state.shieldTimer > 0) myDrain = 0;
                        
                        this.state.player.count -= myDrain;
                        row.count -= enemyDrain;
                        
                        this.spawnParticles(this.canvas.width / 2, playerVisualY - 50);

                        if (row.count <= 0) {
                            row.count = 0; row.dead = true; row.passed = true; 
                        }
                        if (this.state.player.count <= 0) {
                            this.state.player.count = 0; this.endGame(); return; 
                        }
                        this.updateUI();
                    }
                } 
                else if (screenY > playerVisualY - 40 && screenY < playerVisualY + 40) {
                    if (row.type === 'GATE' && !row.passed) {
                        row.passed = true;
                        const item = row.items[this.state.player.lane];
                        if (item) {
                            this.state.player.count = this.applyGateMath(this.state.player.count, item.op, item.val);
                            this.updateUI();
                        }
                    } 
                    else if (row.type === 'ITEM' && !row.passed) {
                        row.passed = true;
                        const item = row.items[this.state.player.lane];
                        if (item) {
                            this.spawnParticles(this.state.player.x, playerVisualY - 30, 'ITEM');
                            
                            // [수정] 아이템을 즉시 발동하지 않고 '보유(Hold)' 상태로 저장
                            if (item.id === 'SHIELD') {
                                this.state.hasShield = true; 
                            } else if (item.id === 'BOMB') {
                                this.state.hasBomb = true;
                            } else if (item.id === 'HEAL') {
                                // 힐은 획득 즉시 바로 사용
                                this.state.player.count += 100;
                            }
                            this.updateUI();
                        }
                    }
                    else if (row.type === 'ENEMY') {
                        const enemy = row.items[this.state.player.lane];
                        if (enemy && !enemy.dead) {
                            
                            // [신규] 적과 부딪히는 순간 보유한 아이템 자동 발동
                            this.triggerStoredItems();

                            combatOccurring = true; 
                            
                            let myDrain = Math.max(300, this.state.player.count * 2) * dt; 
                            let enemyDrain = myDrain;
                            
                            if (this.state.shieldTimer > 0) myDrain = 0;

                            this.state.player.count -= myDrain;
                            enemy.count -= enemyDrain;
                            
                            this.spawnParticles(this.state.player.x, playerVisualY - 30);

                            if (enemy.count <= 0) {
                                enemy.count = 0; enemy.dead = true; row.passed = true; 
                            }
                            if (this.state.player.count <= 0) {
                                this.state.player.count = 0; this.endGame(); return; 
                            }
                            this.updateUI();
                        }
                    }
                }

                if (screenY > this.canvas.height + 200) {
                    row.passed = true;
                }
            }

            if (this.state.phase === 'END') return;

            if (!combatOccurring) {
                this.state.phase = 'PLAYING';
                this.state.distance += this.state.scrollSpeed * dt;
                this.state.score = this.state.distance / 10; 
                this.state.scrollSpeed += 5 * dt; 
                this.updateUI();
            } else {
                this.state.phase = 'COMBAT';
            }

            if (this.state.rows.length > 0 && (this.state.rows[0].y + this.state.distance) > this.canvas.height + 200) {
                this.state.rows.shift();
            }
        },

        draw: function() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;
            const laneWidth = w / 3;
            const playerVisualY = h - 150;

            ctx.clearRect(0, 0, w, h);

            // 도로 배경
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 4;
            ctx.setLineDash([30, 30]);
            ctx.lineDashOffset = -this.state.distance % 60;
            ctx.beginPath();
            ctx.moveTo(laneWidth, 0); ctx.lineTo(laneWidth, h);
            ctx.moveTo(laneWidth * 2, 0); ctx.lineTo(laneWidth * 2, h);
            ctx.stroke();
            ctx.setLineDash([]);

            // 오브젝트 그리기
            this.state.rows.forEach(row => {
                const screenY = row.y + this.state.distance;
                
                if (screenY > -150 && screenY < h + 100) {
                    
                    if (row.type === 'BOSS') {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fillRect(0, screenY - 80, w, 160); 

                        ctx.font = '90px Arial';
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText('🐉', w/2, screenY - 20);

                        const hpPct = row.count / row.maxCount;
                        ctx.fillStyle = '#424242'; ctx.fillRect(w/2 - 100, screenY + 40, 200, 15);
                        ctx.fillStyle = '#f44336'; ctx.fillRect(w/2 - 100, screenY + 40, 200 * hpPct, 15);
                        
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 24px Arial';
                        ctx.fillText(this.formatNumber(row.count), w/2, screenY + 80);
                    }
                    else if (row.type === 'GATE' && !row.passed) {
                        for(let i=0; i<3; i++) {
                            const item = row.items[i];
                            if(!item) continue;

                            const isGood = item.op === '+' || item.op === 'x';
                            ctx.fillStyle = isGood ? 'rgba(76, 175, 80, 0.85)' : 'rgba(244, 67, 54, 0.85)';
                            
                            const gX = i * laneWidth + 10;
                            const gW = laneWidth - 20;
                            ctx.beginPath();
                            ctx.roundRect(gX, screenY - 30, gW, 60, 10);
                            ctx.fill();
                            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                            ctx.lineWidth = 2;
                            ctx.stroke();

                            ctx.fillStyle = '#fff';
                            ctx.font = '900 24px Arial';
                            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                            ctx.fillText(`${item.op} ${this.formatNumber(item.val)}`, gX + gW/2, screenY);
                        }
                    } 
                    else if (row.type === 'ITEM' && !row.passed) {
                        for(let i=0; i<3; i++) {
                            const item = row.items[i];
                            if(!item) continue;

                            const cX = i * laneWidth + laneWidth/2;
                            const floatY = screenY + Math.sin(this.state.distance * 0.02) * 10;
                            
                            ctx.shadowBlur = 20; ctx.shadowColor = item.color;
                            ctx.fillStyle = item.color;
                            ctx.beginPath(); ctx.arc(cX, floatY, 25, 0, Math.PI*2); ctx.fill();
                            ctx.shadowBlur = 0; 

                            ctx.font = '30px Arial';
                            ctx.fillText(item.icon, cX, floatY);

                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 16px Arial';
                            ctx.fillText(item.desc, cX, floatY + 40);
                        }
                    }
                    else if (row.type === 'ENEMY') {
                        for(let i=0; i<3; i++) {
                            const enemy = row.items[i];
                            if(!enemy || enemy.dead) continue;

                            const cX = i * laneWidth + laneWidth/2;
                            this.drawCrowdEmoji(ctx, cX, screenY, Math.floor(enemy.count), false);
                            
                            ctx.fillStyle = '#f44336';
                            ctx.font = '900 24px Arial';
                            ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
                            const displayNum = this.formatNumber(enemy.count);
                            ctx.strokeText(displayNum, cX, screenY - 50);
                            ctx.fillText(displayNum, cX, screenY - 50);
                        }
                    }
                }
            });

            // 내 군단 그리기
            if (this.state.player.count > 0) {
                let shakeX = 0;
                if (this.state.phase === 'COMBAT') shakeX = (Math.random() - 0.5) * 10;

                if (this.state.shieldTimer > 0) {
                    ctx.shadowBlur = 30; ctx.shadowColor = '#ffca28';
                    ctx.fillStyle = 'rgba(255, 202, 40, 0.3)';
                    ctx.beginPath();
                    ctx.arc(this.state.player.x + shakeX, playerVisualY, 60, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = '#ffca28'; ctx.lineWidth = 3; ctx.stroke();
                }

                this.drawCrowdEmoji(ctx, this.state.player.x + shakeX, playerVisualY, Math.floor(this.state.player.count), true);
                
                ctx.fillStyle = '#0277bd';
                ctx.font = '900 32px Arial';
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 5;
                const displayNum = this.formatNumber(this.state.player.count);
                ctx.strokeText(displayNum, this.state.player.x + shakeX, playerVisualY - 60);
                ctx.fillText(displayNum, this.state.player.x + shakeX, playerVisualY - 60);

                // [신규] 장전(보유)된 아이템을 플레이어 우측에 둥둥 떠있게 표시
                let iconOffsetX = 45;
                if (this.state.hasShield) {
                    ctx.font = '24px Arial';
                    ctx.fillText('🛡️', this.state.player.x + iconOffsetX, playerVisualY - 20);
                    iconOffsetX += 30;
                }
                if (this.state.hasBomb) {
                    ctx.font = '24px Arial';
                    ctx.fillText('💣', this.state.player.x + iconOffsetX, playerVisualY - 20);
                }
            }

            // 파티클
            this.state.particles.forEach(p => {
                ctx.globalAlpha = p.life / p.maxLife; 
                ctx.font = '28px Arial';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(p.char, p.x, p.y);
            });
            ctx.globalAlpha = 1;

            if (this.state.screenFlashTimer > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${this.state.screenFlashTimer / 0.2})`;
                ctx.fillRect(0, 0, w, h);
            }
        },

        drawCrowdEmoji: function(ctx, cx, cy, count, isPlayer) {
            const displayCount = Math.min(count, 30); 
            const spriteInfo = this.getSpriteInfo(count, isPlayer);

            ctx.font = `${spriteInfo.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (let i = 0; i < displayCount; i++) {
                const angle = i * 2.4; 
                const radius = Math.sqrt(i) * 7; 
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;
                
                ctx.fillText(spriteInfo.icon, x, y);
            }
        },

        endGame: function() {
            if (this.state.phase === 'END') return;
            this.state.phase = 'END'; 
            
            const overlay = document.getElementById('ui-overlay');
            const msg = document.getElementById('ui-result-msg');
            
            msg.innerText = `기록: ${Math.floor(this.state.score)}m`;
            overlay.classList.add('active');
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();