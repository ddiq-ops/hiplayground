(function() {
    'use strict';

    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t && I18n.translations && Object.keys(I18n.translations).length > 0) {
            const fullKey = `gameDetails.idle-factory.ui.${key}`;
            const value = I18n.t(fullKey, defaultValue);
            if (value === fullKey || value === defaultValue) {
                return defaultValue;
            }
            return value;
        }
        return defaultValue;
    }

    // Helper function to get production line info
    function getProductionLineInfo(lineId) {
        const nameKey = `productionLines.${lineId}.name`;
        const descKey = `productionLines.${lineId}.desc`;
        return {
            name: getUIText(nameKey, PRODUCTION_LINES.find(l => l.id === lineId)?.name || ''),
            desc: getUIText(descKey, PRODUCTION_LINES.find(l => l.id === lineId)?.desc || '')
        };
    }

    // Helper function to get investment option info
    function getInvestmentOptionInfo(optionId) {
        const nameKey = `investmentOptions.${optionId}.name`;
        const descKey = `investmentOptions.${optionId}.desc`;
        return {
            name: getUIText(nameKey, INVESTMENT_OPTIONS.find(o => o.id === optionId)?.name || ''),
            desc: getUIText(descKey, INVESTMENT_OPTIONS.find(o => o.id === optionId)?.desc || '')
        };
    }

    // Helper function to get stage name
    function getStageName(stageNum) {
        return getUIText(`stages.${stageNum}`, STAGES[stageNum - 1]?.name || '');
    }

    // ================= CONFIG =================
    const PRODUCTION_LINES = [
        { id: 'worker', name: '일꾼', icon: '👷', baseCost: 50, baseProduction: 2, desc: '초당 +2 골드' },
        { id: 'machine', name: '기계', icon: '⚙️', baseCost: 200, baseProduction: 10, desc: '초당 +10 골드' },
        { id: 'robot', name: '로봇', icon: '🤖', baseCost: 1000, baseProduction: 50, desc: '초당 +50 골드' },
        { id: 'factory', name: '공장', icon: '🏭', baseCost: 5000, baseProduction: 250, desc: '초당 +250 골드' },
        { id: 'plant', name: '플랜트', icon: '🏗️', baseCost: 25000, baseProduction: 1250, desc: '초당 +1,250 골드' },
        { id: 'complex', name: '단지', icon: '🏢', baseCost: 125000, baseProduction: 6250, desc: '초당 +6,250 골드' },
        { id: 'megacorp', name: '메가기업', icon: '🌆', baseCost: 625000, baseProduction: 31250, desc: '초당 +31,250 골드' },
        { id: 'tower', name: '타워', icon: '🗼', baseCost: 3125000, baseProduction: 156250, desc: '초당 +156,250 골드' },
        { id: 'city', name: '도시', icon: '🌃', baseCost: 15625000, baseProduction: 781250, desc: '초당 +781,250 골드' },
        { id: 'planet', name: '행성', icon: '🪐', baseCost: 78125000, baseProduction: 3906250, desc: '초당 +3,906,250 골드' },
        { id: 'galaxy', name: '은하', icon: '🌌', baseCost: 390625000, baseProduction: 19531250, desc: '초당 +19,531,250 골드' },
        { id: 'universe', name: '우주', icon: '🌠', baseCost: 1953125000, baseProduction: 97656250, desc: '초당 +97,656,250 골드' }
    ];

    const COST_MULTIPLIER = 1.15; // 업그레이드 가격 증가율
    
    // 투자 옵션 설정
    const INVESTMENT_OPTIONS = [
        { 
            id: 'safe', 
            name: '안전 투자', 
            icon: '🛡️', 
            percentage: 0.2, // 현재 골드의 20%
            successRate: 0.7, 
            rewardMultiplier: 1.5,
            desc: '안정적이지만 수익률이 낮음',
            color: '#00ff88'
        },
        { 
            id: 'normal', 
            name: '보통 투자', 
            icon: '⚖️', 
            percentage: 0.5, // 현재 골드의 50%
            successRate: 0.5, 
            rewardMultiplier: 2.0,
            desc: '균형잡힌 투자',
            color: '#ffd700'
        },
        { 
            id: 'risky', 
            name: '고위험 투자', 
            icon: '⚡', 
            percentage: 1.0, // 현재 골드의 100%
            successRate: 0.3, 
            rewardMultiplier: 3.0,
            desc: '높은 수익률이지만 실패 위험 큼',
            color: '#ff6b6b'
        }
    ];

    // 30스테이지 목표 설정 (계단식 난이도)
    const STAGES = [
        { goal: 1000, name: '시작', multiplier: 1.0 },        // 1
        { goal: 5000, name: '초보', multiplier: 1.1 },        // 2
        { goal: 20000, name: '입문', multiplier: 1.2 },       // 3
        { goal: 50000, name: '성장', multiplier: 1.3 },       // 4
        { goal: 100000, name: '발전', multiplier: 1.5 },      // 5
        { goal: 500000, name: '확장', multiplier: 1.7 },      // 6
        { goal: 1000000, name: '도약', multiplier: 2.0 },     // 7
        { goal: 5000000, name: '성공', multiplier: 2.3 },     // 8
        { goal: 20000000, name: '번영', multiplier: 2.7 },    // 9
        { goal: 100000000, name: '부흥', multiplier: 3.0 },   // 10
        { goal: 500000000, name: '제국', multiplier: 3.5 },   // 11
        { goal: 2000000000, name: '패권', multiplier: 4.0 },  // 12
        { goal: 10000000000, name: '패왕', multiplier: 4.5 }, // 13
        { goal: 50000000000, name: '초월', multiplier: 5.0 }, // 14
        { goal: 200000000000, name: '전설', multiplier: 6.0 },// 15
        { goal: 1000000000000, name: '신화', multiplier: 7.0 },// 16
        { goal: 10000000000000, name: '절대', multiplier: 8.0 },// 17
        { goal: 100000000000000, name: '불가능', multiplier: 10.0 }, // 18
        { goal: 1000000000000000, name: '극한', multiplier: 12.0 },  // 19
        { goal: 10000000000000000, name: '절대자', multiplier: 15.0 }, // 20
        { goal: 100000000000000000, name: '무한', multiplier: 18.0 }, // 21
        { goal: 1000000000000000000, name: '영원', multiplier: 20.0 }, // 22
        { goal: 10000000000000000000, name: '절대신', multiplier: 25.0 }, // 23
        { goal: 100000000000000000000, name: '창조', multiplier: 30.0 }, // 24
        { goal: 1000000000000000000000, name: '파괴', multiplier: 35.0 }, // 25
        { goal: 10000000000000000000000, name: '재생', multiplier: 40.0 }, // 26
        { goal: 100000000000000000000000, name: '통합', multiplier: 50.0 }, // 27
        { goal: 1000000000000000000000000, name: '분열', multiplier: 60.0 }, // 28
        { goal: 10000000000000000000000000, name: '혼돈', multiplier: 75.0 }, // 29
        { goal: 100000000000000000000000000, name: '완벽', multiplier: 100.0 } // 30
    ];

    // ================= GAME ENGINE =================
    const Game = {
        container: null,
        intervalId: null,
        isActive: false,
        
        state: {
            stage: 1,
            maxStage: 30,
            gold: 100, // 초기 골드 제공
            totalProduction: 0,
            clickPower: 1, // 클릭당 골드
            clickCombo: 0, // 연속 클릭 콤보
            lastClickTime: 0, // 마지막 클릭 시간
            lines: {}, // { id: { count: 0, level: 1 } }
            startTime: 0,
            elapsedTime: 0,
            criticalChance: 0.05, // 5% 크리티컬 확률
            criticalMultiplier: 3.0, // 크리티컬 시 3배 생산
            investmentCooldown: 0, // 투자 쿨다운 (초)
            lastInvestmentTime: 0, // 마지막 투자 시간
            pendingInvestment: null // 대기 중인 투자 정보 { optionId, amount, startTime, endTime }
        },

        init: function(container, options) {
            this.container = container;
            this.options = options || {};
            this.renderLayout();
            this.initState();
            this.updateUI();
            this.updateUpgrades();
            this.renderProductionLines();
            this.renderInvestmentOptions();
        },

        initState: function() {
            // 초기 생산라인 초기화
            PRODUCTION_LINES.forEach(line => {
                this.state.lines[line.id] = { count: 0, level: 1 };
            });
            this.state.stage = 1;
            this.state.gold = 100; // 초기 골드 제공
            this.state.totalProduction = 0;
            this.state.clickPower = 1;
            this.state.clickCombo = 0;
            this.state.lastClickTime = 0;
            this.state.startTime = Date.now();
            this.state.elapsedTime = 0;
            this.state.criticalChance = 0.05;
            this.state.criticalMultiplier = 3.0;
            this.state.investmentCooldown = 0;
            this.state.lastInvestmentTime = 0;
            this.state.pendingInvestment = null;
        },

        renderLayout: function() {
            if(!this.container) {
                console.error('Game container is not set');
                return;
            }
            this.container.innerHTML = '';
            this.container.innerHTML = `
                <div class="if-wrapper">
                    <div class="if-frame">
                        <div class="if-header">
                            <div class="if-title">🏭 IDLE FACTORY</div>
                            <div class="if-stats">
                                <div class="if-stat-card">
                                    <span class="stat-label">STAGE</span>
                                    <span class="stat-value" id="ui-stage">1/20</span>
                                </div>
                                <div class="if-stat-card">
                                    <span class="stat-label">GOLD</span>
                                    <span class="stat-value gold" id="ui-gold">0</span>
                                </div>
                                <div class="if-stat-card">
                                    <span class="stat-label">PRODUCTION</span>
                                    <span class="stat-value production" id="ui-production">0/sec</span>
                                </div>
                            </div>
                        </div>

                        <div class="if-body">
                            <div class="if-factory">
                                <div id="fx-layer" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:100;"></div>
                                <div class="factory-title">⚙️ ${getUIText('productionLine', '생산 라인')}</div>
                                <div class="click-area" id="click-area">
                                    <div class="click-info">
                                        <div class="click-power">${getUIText('click', '클릭')}: <span id="ui-click-power">+1</span> ${getUIText('gold', '골드')}</div>
                                        <div class="click-hint">${getUIText('clickFactory', '공장을 클릭하세요!')}</div>
                                    </div>
                                </div>
                                <div id="production-lines"></div>
                            </div>

                            <div class="if-sidebar">
                                <div class="if-panel">
                                    <div class="panel-title">📊 ${getUIText('stageInfo', '스테이지 정보')}</div>
                                    <div class="stage-info">
                                        <div>${getUIText('currentStage', '현재 스테이지')}: <strong id="ui-stage-name">시작</strong></div>
                                        <div class="stage-goal">
                                            <div class="goal-label">${getUIText('goalAmount', '목표 금액')}</div>
                                            <div class="goal-value" id="ui-goal">1,000 G</div>
                                            <div class="progress-bar">
                                                <div class="progress-fill" id="ui-progress" style="width: 0%">0%</div>
                                            </div>
                                        </div>
                                    </div>
                                    <button class="if-btn success" id="btn-next-stage" onclick="Game.nextStage()">${getUIText('nextStage', '다음 스테이지')}</button>
                                </div>

                                <div class="if-panel">
                                    <div class="panel-title">⬆️ ${getUIText('upgrade', '업그레이드')}</div>
                                    <div class="upgrade-list" id="upgrade-list"></div>
                                </div>

                                <div class="if-panel">
                                    <div class="panel-title">💼 ${getUIText('investment', '투자')}</div>
                                    <div class="investment-info">
                                        <div class="investment-cooldown" id="investment-cooldown"></div>
                                        <div class="investment-options" id="investment-options">
                                            <!-- 투자 선택지들이 여기에 동적으로 생성됨 -->
                                        </div>
                                        <div id="investment-message" class="investment-message"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="if-modal" id="modal-start">
                            <div class="modal-content">
                                <div class="modal-title">🏭 IDLE FACTORY</div>
                                <div class="modal-desc">${getUIText('modal.start.desc', '자동화 경영 게임!<br>생산라인을 구축하고 업그레이드해<br>30스테이지를 클리어하세요!')}</div>
                                <button class="if-btn primary" onclick="Game.startGame()">${getUIText('modal.start.button', 'GAME START')}</button>
                            </div>
                        </div>

                        <div class="if-modal" id="modal-complete">
                            <div class="modal-content">
                                <div class="modal-title" id="modal-title">STAGE CLEAR!</div>
                                <div class="modal-desc" id="modal-desc">${getUIText('modal.complete.desc', '스테이지를 클리어했습니다!')}</div>
                                <button class="if-btn primary" onclick="Game.closeModal()">${getUIText('modal.complete.button', '계속하기')}</button>
                            </div>
                        </div>

                        <div class="if-modal" id="modal-gameover">
                            <div class="modal-content">
                                <div class="modal-title">🎉 ALL STAGES CLEAR!</div>
                                <div class="modal-desc" id="final-desc">${getUIText('modal.gameover.desc', '모든 스테이지를 완료했습니다!')}</div>
                                <button class="if-btn primary" onclick="Game.restart()">${getUIText('modal.gameover.button', '다시 시작')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 시작 모달 표시
            document.getElementById('modal-start').classList.add('active');
            
            // 클릭 이벤트 설정
            this.setupEvents();
            
            // 언어 변경 이벤트 리스너 추가
            document.addEventListener('i18n:loaded', () => {
                this.renderLayout();
                this.updateUI();
                this.renderProductionLines();
                this.updateUpgrades();
                this.renderInvestmentOptions();
            });
        },
        
        setupEvents: function() {
            const clickArea = document.getElementById('click-area');
            if(clickArea) {
                clickArea.addEventListener('click', (e) => this.handleClick(e));
                clickArea.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.handleClick(e.touches[0]);
                });
            }
        },

        startGame: function() {
            document.getElementById('modal-start').classList.remove('active');
            this.isActive = true;
            this.state.startTime = Date.now();
            this.startLoop();
        },

        startLoop: function() {
            if(this.intervalId) clearInterval(this.intervalId);
            const fps = 10; // 10fps
            
            this.intervalId = setInterval(() => {
                if(!this.isActive) return;
                
                // 자동 생산
                const production = this.calculateProduction();
                this.state.gold += production / fps;
                this.state.totalProduction = production;
                this.state.elapsedTime = (Date.now() - this.state.startTime) / 1000;
                
                // 생산 애니메이션
                this.spawnProductionParticles();
                
                // 클릭 콤보 감소 (1초마다)
                const now = Date.now();
                if(now - this.state.lastClickTime > 1000) {
                    this.state.clickCombo = Math.max(0, this.state.clickCombo - 1);
                }
                
                // 투자 쿨다운 업데이트 및 결과 확인
                this.checkInvestmentResult();
                this.updateInvestmentUI();
                
                // UI 업데이트
                this.updateUI();
                this.updateProductionLines();
                this.updateUpgrades();
                this.checkStageComplete();
            }, 1000 / fps);
        },

        calculateProduction: function() {
            let total = 0;
            PRODUCTION_LINES.forEach(line => {
                const lineData = this.state.lines[line.id];
                if(lineData && lineData.count > 0) {
                    let production = line.baseProduction * lineData.count * lineData.level;
                    
                    // 크리티컬 확률 체크 (각 생산라인마다 독립적으로)
                    for(let i = 0; i < lineData.count; i++) {
                        if(Math.random() < this.state.criticalChance) {
                            // 크리티컬 발생 시 해당 라인의 생산량 증가
                            production += (line.baseProduction * lineData.level) * (this.state.criticalMultiplier - 1);
                        }
                    }
                    
                    total += production;
                }
            });
            return total;
        },
        
        handleClick: function(e) {
            if(!this.isActive) return;
            
            const now = Date.now();
            const timeSinceLastClick = now - this.state.lastClickTime;
            
            // 콤보 시스템 (1초 이내 클릭 시 콤보 증가)
            if(timeSinceLastClick < 1000) {
                this.state.clickCombo++;
            } else {
                this.state.clickCombo = 1;
            }
            
            // 클릭 파워 계산 (콤보 보너스)
            const comboMultiplier = 1 + (this.state.clickCombo * 0.1);
            const goldEarned = Math.floor(this.state.clickPower * comboMultiplier);
            
            this.state.gold += goldEarned;
            this.state.lastClickTime = now;
            
            // 플로팅 텍스트
            this.spawnFloatText(e.clientX || e.pageX, e.clientY || e.pageY, `+${this.formatNumber(goldEarned)}${this.state.clickCombo > 1 ? ' (' + this.state.clickCombo + 'x)' : ''}`);
            
            this.updateUI();
        },
        
        spawnFloatText: function(x, y, text) {
            const el = document.createElement('div');
            el.className = 'float-text';
            el.innerText = text;
            const factoryArea = document.querySelector('.if-factory');
            const fxLayer = document.getElementById('fx-layer');
            if(!factoryArea || !fxLayer) return;
            
            const rect = factoryArea.getBoundingClientRect();
            el.style.left = (x - rect.left) + 'px';
            el.style.top = (y - rect.top) + 'px';
            fxLayer.appendChild(el);
            setTimeout(() => el.remove(), 1200);
        },
        
        spawnProductionParticles: function() {
            // 생산 중인 라인에 애니메이션 효과 추가
            PRODUCTION_LINES.forEach(line => {
                const lineData = this.state.lines[line.id];
                const lineElement = document.querySelector(`[data-line-id="${line.id}"]`);
                
                if(lineData && lineData.count > 0 && lineElement) {
                    // 생산 중일 때 producing 클래스 추가 (주기적으로)
                    if(!lineElement.classList.contains('producing')) {
                        lineElement.classList.add('producing');
                        setTimeout(() => {
                            if(lineElement) lineElement.classList.remove('producing');
                        }, 1000);
                    }
                    
                    // 파티클 텍스트 (더 낮은 확률로)
                    if(Math.random() < 0.05) { // 5% 확률
                        const rect = lineElement.getBoundingClientRect();
                        const factoryArea = document.querySelector('.if-factory');
                        if(factoryArea) {
                            const factoryRect = factoryArea.getBoundingClientRect();
                            const x = rect.left - factoryRect.left + rect.width / 2;
                            const y = rect.top - factoryRect.top + rect.height / 2;
                            
                            const goldAmount = line.baseProduction * lineData.count * lineData.level;
                            
                            // 크리티컬 체크 (생산량이 예상보다 높으면 크리티컬 표시)
                            const expectedProduction = line.baseProduction * lineData.count * lineData.level;
                            const isCritical = Math.random() < 0.3; // 30% 확률로 크리티컬 표시
                            
                            if(isCritical) {
                                lineElement.classList.add('critical');
                                setTimeout(() => {
                                    if(lineElement) lineElement.classList.remove('critical');
                                }, 500);
                                this.spawnFloatText(x + factoryRect.left, y + factoryRect.top, `⭐ CRITICAL! 💰`);
                            } else {
                                this.spawnFloatText(x + factoryRect.left, y + factoryRect.top, `💰 +${this.formatNumber(goldAmount / 10)}`);
                            }
                        }
                    }
                } else if(lineElement) {
                    lineElement.classList.remove('producing');
                }
            });
        },

        buyLine: function(lineId) {
            if(!this.isActive) return;
            const line = PRODUCTION_LINES.find(l => l.id === lineId);
            if(!line) return;
            
            const lineData = this.state.lines[lineId];
            const cost = Math.floor(line.baseCost * Math.pow(COST_MULTIPLIER, lineData.count));
            
            if(this.state.gold >= cost) {
                this.state.gold -= cost;
                lineData.count++;
                this.updateUI();
                this.renderProductionLines();
                this.updateUpgrades();
            }
        },

        upgradeLine: function(lineId) {
            if(!this.isActive) return;
            const lineData = this.state.lines[lineId];
            if(!lineData || lineData.count === 0) return;
            
            const upgradeCost = Math.floor(100 * Math.pow(2, lineData.level - 1) * STAGES[this.state.stage - 1].multiplier);
            
            if(this.state.gold >= upgradeCost) {
                this.state.gold -= upgradeCost;
                lineData.level++;
                this.updateUI();
                this.renderProductionLines();
                this.updateUpgrades();
            }
        },

        checkStageComplete: function() {
            const currentStage = STAGES[this.state.stage - 1];
            if(!currentStage) return;
            
            if(this.state.gold >= currentStage.goal) {
                const btn = document.getElementById('btn-next-stage');
                if(btn) btn.disabled = false;
            } else {
                const btn = document.getElementById('btn-next-stage');
                if(btn) btn.disabled = true;
            }
        },

        nextStage: function() {
            const currentStage = STAGES[this.state.stage - 1];
            if(!currentStage) return;
            if(this.state.gold < currentStage.goal) return;
            
            this.state.stage++;
            
            if(this.state.stage > this.state.maxStage) {
                // 게임 완료
                this.isActive = false;
                clearInterval(this.intervalId);
                document.getElementById('modal-gameover').classList.add('active');
                return;
            }
            
            // 스테이지 클리어 모달
            document.getElementById('modal-title').innerText = `STAGE ${this.state.stage - 1} CLEAR!`;
            document.getElementById('modal-desc').innerText = `${getStageName(this.state.stage - 1)} ${getUIText('stageComplete', '스테이지를 완료했습니다!')}`;
            document.getElementById('modal-complete').classList.add('active');
            
            // 골드 초기화 (선택적: 일부만 유지)
            this.state.gold = Math.floor(this.state.gold * 0.1);
            
            this.updateUI();
            this.updateUpgrades();
        },

        closeModal: function() {
            document.getElementById('modal-complete').classList.remove('active');
        },

        restart: function() {
            document.getElementById('modal-gameover').classList.remove('active');
            this.initState();
            this.updateUI();
            this.renderProductionLines();
            this.updateUpgrades();
            this.startGame();
        },

        renderProductionLines: function() {
            const container = document.getElementById('production-lines');
            if(!container) return;
            
            container.innerHTML = '';
            
            PRODUCTION_LINES.forEach(line => {
                const lineData = this.state.lines[line.id];
                const cost = Math.floor(line.baseCost * Math.pow(COST_MULTIPLIER, lineData.count));
                const production = lineData.count > 0 ? line.baseProduction * lineData.count * lineData.level : 0;
                
                const div = document.createElement('div');
                div.className = 'production-line';
                div.setAttribute('data-line-id', line.id);
                const lineInfo = getProductionLineInfo(line.id);
                div.innerHTML = `
                    <div class="line-icon">${line.icon}</div>
                    <div class="line-info">
                        <div class="line-name">${lineInfo.name}</div>
                        <div class="line-production">${this.formatNumber(production)}/sec</div>
                        <div class="line-level">${getUIText('level', '레벨')} ${lineData.level} × ${lineData.count}${getUIText('units', '개')}</div>
                    </div>
                    <div class="line-count">${lineData.count}</div>
                    <button class="if-btn primary" id="btn-line-${line.id}" onclick="Game.buyLine('${line.id}')" ${this.state.gold >= cost ? '' : 'disabled'}>
                        ${getUIText('buy', '구매')} (${this.formatNumber(cost)}G)
                    </button>
                `;
                container.appendChild(div);
            });
        },

        updateProductionLines: function() {
            PRODUCTION_LINES.forEach(line => {
                const btn = document.getElementById(`btn-line-${line.id}`);
                if(!btn) return;
                
                const lineData = this.state.lines[line.id];
                const cost = Math.floor(line.baseCost * Math.pow(COST_MULTIPLIER, lineData.count));
                const production = lineData.count > 0 ? line.baseProduction * lineData.count * lineData.level : 0;
                
                // 생산량 업데이트
                const productionEl = btn.parentElement.querySelector('.line-production');
                if(productionEl) productionEl.innerText = this.formatNumber(production) + '/sec';
                
                // 레벨 업데이트
                const levelEl = btn.parentElement.querySelector('.line-level');
                if(levelEl) levelEl.innerText = `${getUIText('level', '레벨')} ${lineData.level} × ${lineData.count}${getUIText('units', '개')}`;
                
                // 개수 업데이트
                const countEl = btn.parentElement.querySelector('.line-count');
                if(countEl) countEl.innerText = lineData.count;
                
                // 버튼 상태 업데이트
                btn.textContent = `${getUIText('buy', '구매')} (${this.formatNumber(cost)}G)`;
                if(this.state.gold >= cost) {
                    btn.disabled = false;
                } else {
                    btn.disabled = true;
                }
            });
        },

        updateUpgrades: function() {
            const container = document.getElementById('upgrade-list');
            if(!container) return;
            
            container.innerHTML = '';
            
            PRODUCTION_LINES.forEach(line => {
                const lineData = this.state.lines[line.id];
                if(lineData.count === 0) return; // 생산라인이 없으면 업그레이드 표시 안함
                
                const upgradeCost = Math.floor(100 * Math.pow(2, lineData.level - 1) * STAGES[this.state.stage - 1].multiplier);
                const canUpgrade = this.state.gold >= upgradeCost;
                
                const div = document.createElement('div');
                div.className = `upgrade-item ${canUpgrade ? '' : 'disabled'}`;
                const lineInfo = getProductionLineInfo(line.id);
                div.innerHTML = `
                    <div class="upgrade-header">
                        <div class="upgrade-name">
                            ${line.icon} ${lineInfo.name} ${getUIText('upgradeText', '업그레이드')}
                        </div>
                        <div class="upgrade-cost">${this.formatNumber(upgradeCost)}G</div>
                    </div>
                    <div class="upgrade-desc">${getUIText('level', '레벨')} ${lineData.level} → ${lineData.level + 1}</div>
                    <div class="upgrade-level">${getUIText('current', '현재')}: ${getUIText('level', '레벨')} ${lineData.level} (${getUIText('production', '생산력')} ${line.baseProduction * lineData.count * lineData.level}/sec)</div>
                `;
                div.onclick = canUpgrade ? () => this.upgradeLine(line.id) : null;
                container.appendChild(div);
            });
        },

        updateUI: function() {
            const currentStage = STAGES[this.state.stage - 1];
            if(!currentStage) return;
            
            // 스테이지 정보
            const stageEl = document.getElementById('ui-stage');
            if(stageEl) stageEl.innerText = `${this.state.stage}/${this.state.maxStage}`;
            
            const stageNameEl = document.getElementById('ui-stage-name');
            if(stageNameEl) stageNameEl.innerText = getStageName(this.state.stage);
            
            const goalEl = document.getElementById('ui-goal');
            if(goalEl) goalEl.innerText = this.formatNumber(currentStage.goal) + ' G';
            
            // 골드
            const goldEl = document.getElementById('ui-gold');
            if(goldEl) goldEl.innerText = this.formatNumber(Math.floor(this.state.gold));
            
            // 생산량
            const prodEl = document.getElementById('ui-production');
            if(prodEl) prodEl.innerText = this.formatNumber(this.state.totalProduction) + '/sec';
            
            // 클릭 파워
            const clickPowerEl = document.getElementById('ui-click-power');
            if(clickPowerEl) {
                const comboBonus = this.state.clickCombo > 1 ? ` (${this.state.clickCombo}x)` : '';
                clickPowerEl.innerText = `+${this.formatNumber(this.state.clickPower)}${comboBonus}`;
            }
            
            // 투자 UI 업데이트 (금액이 변경되므로 다시 렌더링)
            this.renderInvestmentOptions();
            this.updateInvestmentUI();
            
            // 진행도
            const progress = Math.min(100, (this.state.gold / currentStage.goal) * 100);
            const progressEl = document.getElementById('ui-progress');
            if(progressEl) {
                progressEl.style.width = progress + '%';
                progressEl.innerText = progress.toFixed(1) + '%';
            }
        },

        formatNumber: function(num) {
            if(num < 1000) return Math.floor(num).toLocaleString();
            const units = ['K', 'M', 'B', 'T', 'Qa'];
            const order = Math.floor(Math.log10(num) / 3);
            if(order === 0) return Math.floor(num).toLocaleString();
            const unitname = units[order - 1] || '';
            const val = num / Math.pow(1000, order);
            return val.toFixed(2) + unitname;
        },
        
        renderInvestmentOptions: function() {
            const container = document.getElementById('investment-options');
            if(!container) return;
            
            container.innerHTML = '';
            
            INVESTMENT_OPTIONS.forEach(option => {
                const div = document.createElement('div');
                div.className = 'investment-option';
                div.setAttribute('data-option-id', option.id);
                
                // 현재 골드 기준으로 투자 금액 계산
                const investmentAmount = Math.floor(this.state.gold * option.percentage);
                const successReward = Math.floor(investmentAmount * option.rewardMultiplier);
                const successRatePercent = Math.floor(option.successRate * 100);
                const percentagePercent = Math.floor(option.percentage * 100);
                
                div.innerHTML = `
                    <div class="investment-option-header">
                        <div class="investment-option-icon" style="color: ${option.color}">${option.icon}</div>
                        <div class="investment-option-info">
                            <div class="investment-option-name">${getInvestmentOptionInfo(option.id).name}</div>
                            <div class="investment-option-desc">${getInvestmentOptionInfo(option.id).desc}</div>
                        </div>
                    </div>
                    <div class="investment-option-stats">
                        <div class="investment-stat">
                            <span class="stat-label">${getUIText('investmentAmount', '투자 금액')}</span>
                            <span class="stat-value">${this.formatNumber(investmentAmount)}G (${percentagePercent}%)</span>
                        </div>
                        <div class="investment-stat">
                            <span class="stat-label">${getUIText('successRate', '성공률')}</span>
                            <span class="stat-value" style="color: ${option.color}">${successRatePercent}%</span>
                        </div>
                        <div class="investment-stat">
                            <span class="stat-label">${getUIText('onSuccess', '성공 시')}</span>
                            <span class="stat-value" style="color: #00ff88">+${this.formatNumber(successReward)}G</span>
                        </div>
                    </div>
                    <button class="if-btn investment-option-btn" 
                            id="btn-investment-${option.id}" 
                            onclick="Game.startInvestment('${option.id}')" 
                            style="background: linear-gradient(135deg, ${option.color}, ${option.color}dd);"
                            disabled>
                        ${getUIText('invest', '투자하기')}
                    </button>
                `;
                container.appendChild(div);
            });
            
            this.updateInvestmentUI();
        },
        
        startInvestment: function(optionId) {
            if(!this.isActive) return;
            
            const option = INVESTMENT_OPTIONS.find(opt => opt.id === optionId);
            if(!option) return;
            
            // 쿨다운 체크
            const now = Date.now();
            const timeSinceLastInvestment = (now - this.state.lastInvestmentTime) / 1000;
            const cooldownSeconds = 60; // 60초 쿨다운
            
            if(timeSinceLastInvestment < cooldownSeconds) {
                const remaining = Math.ceil(cooldownSeconds - timeSinceLastInvestment);
                this.showInvestmentMessage(`${getUIText('investing', '투자 진행 중입니다.')} ${remaining}${getUIText('secondsLeft', '초 남음')}.`, 'error');
                return;
            }
            
            // 현재 골드 기준으로 투자 금액 계산
            const amount = Math.floor(this.state.gold * option.percentage);
            
            // 최소 금액 체크 (최소 1G 이상)
            if(amount < 1) {
                this.showInvestmentMessage(`${getUIText('investResult', '투자 결과:')} ${getUIText('notEnoughGold', '투자할 골드가 부족합니다! (최소 1G 필요)')}`, 'error');
                return;
            }
            
            // 투자 실행 (골드 차감)
            this.state.gold -= amount;
            this.state.lastInvestmentTime = now;
            
            // 쿨다운 시간 설정 (60초)
            const endTime = now + (cooldownSeconds * 1000);
            
            // 투자 정보 저장 (결과는 나중에 표시)
            this.state.pendingInvestment = {
                optionId: optionId,
                optionName: getInvestmentOptionInfo(optionId).name,
                amount: amount,
                startTime: now,
                endTime: endTime,
                successRate: option.successRate,
                rewardMultiplier: option.rewardMultiplier
            };
            
            // 투자 시작 메시지
            this.showInvestmentMessage(`${getUIText('investStart', '투자 시작!')} ${this.formatNumber(amount)}G ${getUIText('invested', '투자했습니다. 결과는')} ${cooldownSeconds}${getUIText('secondsLater', '초 후에 확인됩니다.')}`, 'success');
            
            this.updateUI();
            this.updateInvestmentUI();
        },
        
        checkInvestmentResult: function() {
            if(!this.state.pendingInvestment) return;
            
            const now = Date.now();
            const pending = this.state.pendingInvestment;
            
            // 쿨다운이 끝났는지 확인
            if(now >= pending.endTime) {
                const option = INVESTMENT_OPTIONS.find(opt => opt.id === pending.optionId);
                if(!option) {
                    this.state.pendingInvestment = null;
                    return;
                }
                
                // 성공/실패 판정
                const win = Math.random() < pending.successRate;
                
                if(win) {
                    // 성공: 배율만큼 획득
                    let reward = Math.floor(pending.amount * pending.rewardMultiplier);
                    let profit = reward - pending.amount;
                    let isCritical = false;
                    
                    // 10% 확률로 크리티컬 발생
                    if(Math.random() < 0.1) {
                        isCritical = true;
                        const criticalBonus = reward; // 추가로 2배 (원래 보상만큼 추가)
                        reward += criticalBonus;
                        profit += criticalBonus;
                    }
                    
                    this.state.gold += reward;
                    
                    // 결과 메시지
                    let resultMessage = `투자 결과: 🎉 성공!\n`;
                    resultMessage += `투자 금액: ${this.formatNumber(pending.amount)}G\n`;
                    if(isCritical) {
                        resultMessage += `⭐ 크리티컬 발생! 추가 보너스!\n`;
                    }
                    resultMessage += `수익: +${this.formatNumber(profit)}G\n`;
                    resultMessage += `총 획득: ${this.formatNumber(reward)}G`;
                    
                    this.showInvestmentMessage(resultMessage, 'success');
                    this.spawnFloatText(window.innerWidth / 2, window.innerHeight / 2, isCritical ? `⭐ CRITICAL! +${this.formatNumber(profit)}G!` : `🎉 +${this.formatNumber(profit)}G!`);
                } else {
                    // 실패: 투자 금액 손실
                    let resultMessage = `투자 결과: 😢 실패...\n`;
                    resultMessage += `투자 금액: ${this.formatNumber(pending.amount)}G\n`;
                    resultMessage += `손실: -${this.formatNumber(pending.amount)}G`;
                    
                    this.showInvestmentMessage(resultMessage, 'error');
                    this.spawnFloatText(window.innerWidth / 2, window.innerHeight / 2, `😢 -${this.formatNumber(pending.amount)}G`);
                }
                
                // 대기 중인 투자 정보 초기화
                this.state.pendingInvestment = null;
                this.updateUI();
            }
        },
        
        updateInvestmentUI: function() {
            const cooldownEl = document.getElementById('investment-cooldown');
            if(!cooldownEl) return;
            
            const now = Date.now();
            
            // 대기 중인 투자가 있는지 확인
            if(this.state.pendingInvestment) {
                const pending = this.state.pendingInvestment;
                const remaining = Math.ceil((pending.endTime - now) / 1000);
                
                if(remaining > 0) {
                    cooldownEl.innerText = `${getUIText('investing', '투자 진행 중...')} ${remaining}${getUIText('secondsLeft', '초 남음')}`;
                    cooldownEl.style.display = 'block';
                    
                    // 모든 투자 버튼 비활성화
                    INVESTMENT_OPTIONS.forEach(option => {
                        const btn = document.getElementById(`btn-investment-${option.id}`);
                        if(btn) btn.disabled = true;
                    });
                } else {
                    // 쿨다운이 끝났지만 아직 결과를 확인하지 않은 경우
                    cooldownEl.innerText = getUIText('checkingResult', '투자 결과 확인 중...');
                    cooldownEl.style.display = 'block';
                }
            } else {
                cooldownEl.innerText = '';
                cooldownEl.style.display = 'none';
                
                // 각 투자 옵션 버튼 활성화 상태 업데이트
                INVESTMENT_OPTIONS.forEach(option => {
                    const btn = document.getElementById(`btn-investment-${option.id}`);
                    if(btn) {
                        const investmentAmount = Math.floor(this.state.gold * option.percentage);
                        btn.disabled = investmentAmount < 1; // 최소 1G 이상 필요
                    }
                });
            }
        },
        
        showInvestmentMessage: function(text, type) {
            const messageEl = document.getElementById('investment-message');
            if(messageEl) {
                messageEl.innerText = text;
                messageEl.className = `investment-message ${type}`;
                messageEl.style.display = 'block';
                setTimeout(() => {
                    if(messageEl) messageEl.style.display = 'none';
                }, 3000);
            } else {
                // 메시지 요소가 없으면 생성
                const panel = document.querySelector('.investment-info');
                if(panel) {
                    const msg = document.createElement('div');
                    msg.id = 'investment-message';
                    msg.className = `investment-message ${type}`;
                    msg.innerText = text;
                    msg.style.display = 'block';
                    panel.appendChild(msg);
                    setTimeout(() => {
                        if(msg) msg.style.display = 'none';
                    }, 3000);
                }
            }
        }
    };

    if (typeof window !== 'undefined') {
        window.Game = Game;
        console.log('[Idle Factory] Game object exported:', typeof Game.init === 'function' ? 'OK' : 'FAILED');
    } else {
        console.error('[Idle Factory] window is undefined');
    }
})();

