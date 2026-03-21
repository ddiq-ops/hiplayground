(function() {
    'use strict';

    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t && I18n.translations && Object.keys(I18n.translations).length > 0) {
            const fullKey = `gameDetails.aqua-feed.ui.${key}`;
            const value = I18n.t(fullKey, defaultValue);
            if (value === fullKey || value === defaultValue) {
                return defaultValue;
            }
            return value;
        }
        return defaultValue;
    }

    const Game = {
        canvas: null, ctx: null,
        
        state: {
            money: 200, fishList: [], foodList: [], coinList: [], bubbles: [],
            foodLevel: 1, maxFood: 10, maxFish: 100, lastTime: 0
        },

        FISH_TYPES: {
            baby:   { size: 30, growExp: 3,  coinVal: 5,  coinRate: 300, icon: '🐟' }, 
            medium: { size: 50, growExp: 8,  coinVal: 15, coinRate: 250, icon: '🐠' }, 
            king:   { size: 80, growExp: 99, coinVal: 50, coinRate: 200, icon: '🐳' }  
        },

        init: function(container) {
            this.container = container;
            this.renderLayout();
            this.canvas = document.getElementById('af-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            this.canvas.addEventListener('mousedown', e => this.handleInput(e));
            this.canvas.addEventListener('touchstart', e => {
                e.preventDefault(); this.handleInput(e.touches[0]);
            });

            this.spawnFish(); this.spawnFish();
            for(let i=0; i<15; i++) this.spawnBubble(true);

            if(this.loopId) cancelAnimationFrame(this.loopId);
            this.loop();
            this.updateUI();
            setTimeout(() => this.showGuide(), 100);
            
            // Listen for language changes
            document.addEventListener('i18n:loaded', () => {
                this.updateUITexts();
            });
        },

        // --- 렌더링 (테두리 효과 유지) ---
        drawObject: function(icon, x, y, size) {
            const ctx = this.ctx;
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = 'white'; 
            ctx.strokeText(icon, x, y); ctx.fillText(icon, x, y);
        },

        draw: function() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            this.state.bubbles.forEach(b => {
                ctx.globalAlpha = b.opacity; ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI*2); ctx.fill();
            });
            ctx.globalAlpha = 1;

            this.state.foodList.forEach(f => {
                const icon = this.state.foodLevel === 1 ? '🍪' : this.state.foodLevel === 2 ? '🍤' : '🍗';
                this.drawObject(icon, f.x, f.y, 28);
            });

            this.state.coinList.forEach(c => {
                const icon = c.type === 'diamond' ? '💎' : '🟡';
                this.drawObject(icon, c.x, c.y, 32);
            });

            this.state.fishList.forEach(f => {
                const info = this.FISH_TYPES[f.type];
                ctx.save(); ctx.translate(f.x, f.y);
                if (!f.facingLeft) ctx.scale(-1, 1); 
                if(f.hunger > 80) ctx.filter = 'grayscale(50%)'; 
                this.drawObject(info.icon, 0, 0, info.size);
                ctx.restore();

                // 상태 아이콘
                if (f.hunger > 80) this.drawObject('💀', f.x, f.y - info.size + 5, 20); 
                else if (f.hunger > 50) this.drawObject('🥣', f.x, f.y - info.size + 5, 20); 
            });
        },

        // --- 로직 업데이트 (AI 강화) ---
        update: function() {
            const width = this.canvas.width; const height = this.canvas.height;

            for (let i = this.state.fishList.length - 1; i >= 0; i--) {
                let fish = this.state.fishList[i];
                const info = this.FISH_TYPES[fish.type];

                fish.hunger += 0.05; 
                if (fish.hunger >= 100) {
                    this.state.fishList.splice(i, 1); this.updateUI(); continue; 
                }

                // [AI 수정] 먹이 찾기 로직 강화
                let targetFood = null;
                // 배고픔 10 이상이면 바로 밥 찾음 (기존 30)
                if (fish.hunger > 10 && this.state.foodList.length > 0) {
                    let minDist = Infinity;
                    this.state.foodList.forEach(food => {
                        const d = Math.hypot(food.x - fish.x, food.y - fish.y);
                        // 너무 먼(800px 이상) 밥은 못 본 척 (현실감)
                        if (d < minDist && d < 800) { minDist = d; targetFood = food; }
                    });
                }

                if (targetFood) {
                    // [AI 수정] 밥 추적 속도 증가
                    const angle = Math.atan2(targetFood.y - fish.y, targetFood.x - fish.x);
                    // 평소 속도보다 2배 빠르게 돌진 (speed 4)
                    const speed = 4; 
                    fish.vx = Math.cos(angle) * speed;
                    fish.vy = Math.sin(angle) * speed;
                    // 먹이를 추적할 때도 실제 위치를 갱신해야 이동합니다.
                    fish.x += fish.vx;
                    fish.y += fish.vy;
                    fish.facingLeft = fish.vx < 0;

                    // 먹이 섭취 거리 (판정 범위)
                    if (Math.hypot(targetFood.x - fish.x, targetFood.y - fish.y) < 30) {
                        fish.hunger = 0; fish.exp += 1 * this.state.foodLevel; 
                        const fIdx = this.state.foodList.indexOf(targetFood);
                        if (fIdx > -1) this.state.foodList.splice(fIdx, 1);
                        if (fish.type === 'baby' && fish.exp >= info.growExp) { fish.type = 'medium'; fish.exp = 0; }
                        else if (fish.type === 'medium' && fish.exp >= info.growExp) { fish.type = 'king'; fish.exp = 0; }
                    }
                } else {
                    // 평화로운 유영 (천천히)
                    if (Math.random() < 0.02) { 
                        fish.vx += (Math.random() - 0.5) * 0.5; 
                        fish.vy += (Math.random() - 0.5) * 0.5; 
                    }
                    fish.vx = Math.max(-1.5, Math.min(1.5, fish.vx)); 
                    fish.vy = Math.max(-1, Math.min(1, fish.vy));
                    
                    if (fish.x < 20) fish.vx = Math.abs(fish.vx); 
                    if (fish.x > width - 20) fish.vx = -Math.abs(fish.vx);
                    if (fish.y < 50) fish.vy = Math.abs(fish.vy); 
                    if (fish.y > height - 50) fish.vy = -Math.abs(fish.vy);
                    
                    fish.x += fish.vx; fish.y += fish.vy; 
                    fish.facingLeft = fish.vx < 0;
                }

                fish.coinTimer++;
                if (fish.coinTimer > info.coinRate && fish.hunger < 80) { 
                    fish.coinTimer = 0;
                    this.state.coinList.push({ 
                        x: fish.x, y: fish.y, value: info.coinVal, type: fish.type === 'king' ? 'diamond' : 'coin' 
                    });
                }
            }

            // [수정] 먹이 가라앉는 속도 감소 (1 -> 0.6)
            for (let i = this.state.foodList.length - 1; i >= 0; i--) {
                const f = this.state.foodList[i]; f.y += 0.6; if (f.y > height) this.state.foodList.splice(i, 1);
            }
            for (let i = this.state.coinList.length - 1; i >= 0; i--) {
                const c = this.state.coinList[i]; c.y += 1.5; if (c.y > height - 30) c.y = height - 30; 
            }
            if (Math.random() < 0.02) this.spawnBubble();
            for (let i = this.state.bubbles.length - 1; i >= 0; i--) {
                const b = this.state.bubbles[i]; b.y -= b.speed; if (b.y < -20) this.state.bubbles.splice(i, 1);
            }
        },

        // --- 기타 공통 함수 ---
        resizeCanvas: function() {
            if(!this.canvas) return; const parent = this.canvas.parentElement;
            this.canvas.width = parent.clientWidth; this.canvas.height = parent.clientHeight;
        },
        renderLayout: function() {
            this.container.innerHTML = `
                <div class="af-wrapper">
                    <div class="af-header">
                        <div class="af-money">🪙 <span id="ui-money">100</span></div>
                        <div class="af-count"><span id="ui-fish-label">${getUIText('labels.fish', '물고기')}</span>: <span id="ui-fish-count">2</span> / ${this.state.maxFish}</div>
                    </div>
                    <div class="af-game-area"><canvas id="af-canvas"></canvas><div class="af-toast" id="ui-toast"></div></div>
                    <div class="af-controls">
                        <div class="af-btn" onclick="Game.buyFish()"><div class="af-btn-icon">🐟</div><div class="af-btn-label" id="btn-buy-fish">${getUIText('buttons.buyFish', '구피 구매')}</div><div class="af-btn-cost">100G</div></div>
                        <div class="af-btn" onclick="Game.upgradeFood()"><div class="af-btn-icon">🍤</div><div class="af-btn-label" id="btn-upgrade-food">${getUIText('buttons.upgradeFood', '먹이 강화')}</div><div class="af-btn-cost" id="btn-food-cost">200G</div></div>
                        <div class="af-btn" onclick="Game.showGuide()"><div class="af-btn-icon">❔</div><div class="af-btn-label" id="btn-help">${getUIText('buttons.help', '도움말')}</div><div class="af-btn-cost">-</div></div>
                    </div>
                    <div class="af-modal" id="af-guide-modal">
                        <div class="af-guide">
                            <h2 id="guide-title">${getUIText('guide.title', '🐠 아쿠아 피드 가이드')}</h2>
                            <div class="af-guide-item"><div class="af-guide-icon">👆</div><div class="af-guide-text" id="guide-text1">${getUIText('guide.text1', '화면을 탭해서 <span style="color:#f57f17">먹이</span>를 주세요.')}</div></div>
                            <div class="af-guide-item"><div class="af-guide-icon">🥣</div><div class="af-guide-text" id="guide-text2">${getUIText('guide.text2', '머리 위 <span style="color:#0277bd">밥그릇</span>이 뜨면 배고프니 밥을 주세요!')}</div></div>
                            <div class="af-guide-item"><div class="af-guide-icon">🪙</div><div class="af-guide-text" id="guide-text3">${getUIText('guide.text3', '<span style="color:#fbc02d">코인</span>을 클릭해 돈을 법니다.')}</div></div>
                            <button class="af-btn-close" id="btn-start-game" onclick="document.getElementById('af-guide-modal').classList.remove('active')">${getUIText('buttons.startGame', '게임 시작')}</button>
                        </div>
                    </div>
                </div>
            `;
        },
        showGuide: function() { document.getElementById('af-guide-modal').classList.add('active'); },
        handleInput: function(e) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left; const y = e.clientY - rect.top;
            let clickedCoin = false;
            for (let i = this.state.coinList.length - 1; i >= 0; i--) {
                const c = this.state.coinList[i];
                const dx = x - c.x; const dy = y - c.y;
                if (Math.sqrt(dx*dx + dy*dy) < 50) { this.collectCoin(i); clickedCoin = true; break; }
            }
            if (!clickedCoin) {
                if (this.state.money >= 5) {
                    if (this.state.foodList.length < this.state.maxFood) {
                        this.state.money -= 5; this.spawnFood(x, y); this.updateUI();
                    } else { this.showToast(getUIText('messages.tooMuchFood', '먹이가 너무 많아요!')); }
                } else { this.showToast(getUIText('messages.notEnoughMoneyForFood', '돈이 부족합니다! (먹이 5G)')); }
            }
        },
        spawnFish: function() {
            this.state.fishList.push({
                x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 1,
                type: 'baby', exp: 0, hunger: 0, coinTimer: 0, scale: 1, facingLeft: false 
            });
            this.updateUI();
        },
        spawnFood: function(x, y) { this.state.foodList.push({ x: x, y: y, type: this.state.foodLevel }); },
        spawnBubble: function(randomY = false) {
            this.state.bubbles.push({
                x: Math.random() * this.canvas.width, y: randomY ? Math.random() * this.canvas.height : this.canvas.height + 20,
                size: Math.random() * 5 + 2, speed: Math.random() * 1 + 0.5, opacity: Math.random() * 0.5 + 0.1
            });
        },
        buyFish: function() {
            if (this.state.fishList.length >= this.state.maxFish) { this.showToast(getUIText('messages.tankFull', '수조가 가득 찼습니다!')); return; }
            if (this.state.money >= 100) { this.state.money -= 100; this.spawnFish(); this.showToast(getUIText('messages.fishBorn', '구피가 태어났어요!')); } else { this.showToast(getUIText('messages.notEnoughMoney', '돈이 부족합니다!')); }
            this.updateUI();
        },
        upgradeFood: function() {
            const cost = this.state.foodLevel * 200;
            if(this.state.foodLevel >= 3) { this.showToast(getUIText('messages.maxLevel', '최고 레벨입니다!')); return; }
            if (this.state.money >= cost) {
                this.state.money -= cost; this.state.foodLevel++;
                this.showToast(getUIText('messages.foodUpgraded', '먹이가 업그레이드 되었습니다!'));
                document.getElementById('btn-food-cost').innerText = this.state.foodLevel >= 3 ? getUIText('labels.max', 'MAX') : (this.state.foodLevel * 200) + "G";
            } else { this.showToast(getUIText('messages.notEnoughMoney', '돈이 부족합니다!')); }
            this.updateUI();
        },
        collectCoin: function(idx) {
            const coin = this.state.coinList[idx]; this.state.money += coin.value; this.state.coinList.splice(idx, 1); this.updateUI();
        },
        loop: function() { this.update(); this.draw(); this.loopId = requestAnimationFrame(() => this.loop()); },
        showToast: function(msg) {
            const el = document.getElementById('ui-toast'); el.innerText = msg; el.style.opacity = 1; setTimeout(() => el.style.opacity = 0, 1500);
        },
        updateUI: function() {
            const moneyEl = document.getElementById('ui-money');
            const fishCountEl = document.getElementById('ui-fish-count');
            const fishLabelEl = document.getElementById('ui-fish-label');
            
            if(moneyEl) moneyEl.innerText = this.state.money; 
            if(fishCountEl) fishCountEl.innerText = `${this.state.fishList.length}`;
            if(fishLabelEl) fishLabelEl.textContent = getUIText('labels.fish', '물고기');
        },

        updateUITexts: function() {
            // Update all UI texts when language changes
            const fishLabel = document.getElementById('ui-fish-label');
            const btnBuyFish = document.getElementById('btn-buy-fish');
            const btnUpgradeFood = document.getElementById('btn-upgrade-food');
            const btnHelp = document.getElementById('btn-help');
            const guideTitle = document.getElementById('guide-title');
            const guideText1 = document.getElementById('guide-text1');
            const guideText2 = document.getElementById('guide-text2');
            const guideText3 = document.getElementById('guide-text3');
            const btnStartGame = document.getElementById('btn-start-game');
            
            if(fishLabel) fishLabel.textContent = getUIText('labels.fish', '물고기');
            if(btnBuyFish) btnBuyFish.textContent = getUIText('buttons.buyFish', '구피 구매');
            if(btnUpgradeFood) btnUpgradeFood.textContent = getUIText('buttons.upgradeFood', '먹이 강화');
            if(btnHelp) btnHelp.textContent = getUIText('buttons.help', '도움말');
            if(guideTitle) guideTitle.innerHTML = getUIText('guide.title', '🐠 아쿠아 피드 가이드');
            if(guideText1) guideText1.innerHTML = getUIText('guide.text1', '화면을 탭해서 <span style="color:#f57f17">먹이</span>를 주세요.');
            if(guideText2) guideText2.innerHTML = getUIText('guide.text2', '머리 위 <span style="color:#0277bd">밥그릇</span>이 뜨면 배고프니 밥을 주세요!');
            if(guideText3) guideText3.innerHTML = getUIText('guide.text3', '<span style="color:#fbc02d">코인</span>을 클릭해 돈을 법니다.');
            if(btnStartGame) btnStartGame.textContent = getUIText('buttons.startGame', '게임 시작');
            
            // Update food cost button
            const btnFoodCost = document.getElementById('btn-food-cost');
            if(btnFoodCost) {
                btnFoodCost.innerText = this.state.foodLevel >= 3 ? getUIText('labels.max', 'MAX') : (this.state.foodLevel * 200) + "G";
            }
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();