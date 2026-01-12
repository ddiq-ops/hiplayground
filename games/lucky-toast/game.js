(function() {
    'use strict';

    // Helper function to get translated text
    function getUIText(key, defaultValue) {
        if (typeof I18n !== 'undefined' && I18n.t) {
            const fullKey = `gameDetails.lucky-toast.ui.${key}`;
            const value = I18n.t(fullKey, defaultValue);
            if (value === fullKey || value === defaultValue) {
                return defaultValue;
            }
            return value;
        }
        return defaultValue;
    }

    // Helper functions to get translated data
    function getToastType(id) {
        const types = {
            burnt:   { icon: '🌑', price: 0,   baseProb: 30, color: '#555' },
            normal:  { icon: '🍞', price: 5,   baseProb: 58, color: '#8d6e63' },
            special: { icon: '🥓', price: 25,  baseProb: 10, color: '#ff9800' },
            rainbow: { icon: '🌈', price: 150, baseProb: 2,  color: '#e91e63' }
        };
        const type = types[id] || {};
        return {
            ...type,
            name: getUIText(`toastTypes.${id}.name`, '')
        };
    }

    function getEvent(id) {
        const events = {
            rush: { duration: 5000, type: 'good' },
            blackout: { duration: 3000, type: 'bad' },
            critic: { duration: 0, type: 'good' },
            tax: { duration: 0, type: 'bad' },
            impatient: { duration: 5000, type: 'bad' }
        };
        const evt = events[id] || {};
        return {
            ...evt,
            name: getUIText(`events.${id}.name`, ''),
            desc: getUIText(`events.${id}.desc`, '')
        };
    }

    function getUpgrade(id) {
        const upgrades = {
            hire_alba: { icon: '🤖', type: 'staff' },
            spicy_sauce: { icon: '🌶️', type: 'risk' },
            safety_first: { icon: '🛡️', type: 'risk' },
            gambler: { icon: '🎲', type: 'risk' },
            marketing: { icon: '📢', type: 'buff' },
            loan: { icon: '💸', type: 'risk' },
            candy: { icon: '🍬', type: 'buff' }
        };
        const upgrade = upgrades[id] || {};
        return {
            ...upgrade,
            name: getUIText(`upgrades.${id}.name`, ''),
            desc: getUIText(`upgrades.${id}.desc`, '')
        };
    }

    // ================= DATA =================
    const TOAST_TYPES = [
        { id: 'burnt',   icon: '🌑', name: '탄 토스트',    price: 0,   baseProb: 30, color: '#555' },
        { id: 'normal',  icon: '🍞', name: '평범 토스트',  price: 5,   baseProb: 58, color: '#8d6e63' },
        { id: 'special', icon: '🥓', name: '스페셜 토스트', price: 25,  baseProb: 10, color: '#ff9800' },
        { id: 'rainbow', icon: '🌈', name: '무지개 토스트', price: 150, baseProb: 2,  color: '#e91e63' }
    ];

    const EVENTS = [
        { id: 'rush', name: '골든 타임! 💰', desc: '5초간 수입 2배', duration: 5000, type: 'good' },
        { id: 'blackout', name: '정전 발생! ⚡', desc: '3초간 굽기/서빙 불가', duration: 3000, type: 'bad' },
        { id: 'critic', name: '미식가 방문 🧐', desc: '다음 토스트 가격 5배', duration: 0, type: 'good' },
        { id: 'tax', name: '위생 점검 📋', desc: '벌금 $50 납부', duration: 0, type: 'bad' },
        { id: 'impatient', name: '성격 급한 손님 😡', desc: '손님 인내심 2배로 감소', duration: 5000, type: 'bad' }
    ];

    const UPGRADES = [
        { id: 'hire_alba', icon: '🤖', name: '알바 고용', desc: '화구 1개 자동화\n임대료 +$20/일', type: 'staff' },
        { id: 'spicy_sauce', icon: '🌶️', name: '매운 소스', desc: '가격 +50%\n탄 토스트 확률 +10%', type: 'risk' },
        { id: 'safety_first', icon: '🛡️', name: '안전 제일', desc: '절대 타지 않음\n굽는 속도 30% 감소', type: 'risk' },
        { id: 'gambler', icon: '🎲', name: '도박사의 팬', desc: '대박 확률 +10%\n평범 확률 0%', type: 'risk' },
        { id: 'marketing', icon: '📢', name: '전단지 홍보', desc: '토스트 가격 +10%', type: 'buff' },
        { id: 'loan', icon: '💸', name: '사채 쓰기', desc: '즉시 +$300\n임대료 +$30/일 영구 증가', type: 'risk' },
        { id: 'candy', icon: '🍬', name: '서비스 사탕', desc: '손님 인내심 +15%', type: 'buff' }
    ];

    const CUSTOMERS = ['👨', '👩', '👴', '👵', '🧑', '👱', '👮', '🧙'];

    // ================= ENGINE =================
    const Game = {
        state: {
            day: 1, money: 100, rent: 50,
            highScore: 0,
            lives: 5,
            slots: [
                { id: 0, locked: false, auto: false, state: 'idle', result: null, cost: 0 },
                { id: 1, locked: true,  auto: false, state: 'idle', result: null, cost: 200 },
                { id: 2, locked: true,  auto: false, state: 'idle', result: null, cost: 500 }
            ],
            customers: [],
            maxQueue: 4,
            probs: { burnt:30, normal:58, special:10, rainbow:2 },
            priceMult: 1.0,
            speedMult: 1.0,
            patienceMult: 1.0, 
            activeEvent: null,
            dayTime: 40,
            gameLoop: null,
            eventLoop: null,
            customerLoop: null,
            albaLoop: null
        },

        init: function(container) {
            this.container = container;
            // 로컬 스토리지에서 최고 기록 불러오기
            const savedScore = localStorage.getItem('lucky-toast-highscore');
            if(savedScore) this.state.highScore = parseInt(savedScore);

            this.renderLayout();
            this.startDay();

            // 언어 변경 이벤트 리스너 추가
            document.addEventListener('i18n:loaded', () => {
                this.renderLayout();
                this.renderSlots();
                this.renderQueue();
                if (this.state.dayTime > 0) {
                    this.updateUI();
                    if (this.state.activeEvent) {
                        const evt = getEvent(this.state.activeEvent.id);
                        const banner = document.getElementById('ui-event');
                        if (banner) {
                            banner.querySelector('.lt-evt-title').innerText = evt.name;
                            banner.querySelector('.lt-evt-desc').innerText = evt.desc;
                        }
                    }
                }
            });
        },

        renderLayout: function() {
            const dayLabel = getUIText('labels.day', 'DAY');
            const bestLabel = getUIText('labels.best', 'BEST: DAY');
            const rentLabel = getUIText('labels.rent', '임대료:');
            this.container.innerHTML = `
                <div class="lt-wrapper">
                    <div class="lt-header">
                        <div class="lt-header-left">
                            <div class="lt-day">${dayLabel} <span id="ui-day">1</span></div>
                            <div class="lt-hiscore">${bestLabel} <span id="ui-hiscore">${this.state.highScore}</span></div>
                        </div>
                        <div class="lt-hearts" id="ui-hearts">❤️❤️❤️❤️❤️</div>
                        <div class="lt-money">$<span id="ui-money">100</span></div>
                    </div>
                    <div style="font-size:0.8rem; text-align:center; background:#ffe0b2; color:#d32f2f; padding-bottom:5px;">
                        ${rentLabel} $<span id="ui-rent">50</span>
                    </div>
                    
                    <div style="width:100%; height:6px; background:#ddd;">
                        <div id="ui-timer" style="width:100%; height:100%; background:#2196f3; transition:width 1s linear;"></div>
                    </div>

                    <div class="lt-customer-area" id="ui-queue"></div>

                    <div class="lt-event-banner" id="ui-event">
                        <span class="lt-evt-title"></span>
                        <span class="lt-evt-desc"></span>
                    </div>

                    <div class="lt-kitchen" id="ui-kitchen"></div>

                    <div class="lt-modal" id="modal-end"></div>
                </div>
            `;
            this.renderSlots();
            this.renderQueue();
        },

        renderSlots: function() {
            const kitchen = document.getElementById('ui-kitchen');
            kitchen.innerHTML = '';

            this.state.slots.forEach(slot => {
                const div = document.createElement('div');
                div.className = `lt-slot ${slot.locked ? 'locked' : ''} ${slot.auto ? 'auto' : ''} ${slot.state === 'ready' ? 'ready' : ''}`;
                div.id = `slot-${slot.id}`;
                
                let content = '';
                if (slot.locked) {
                    const expandableText = getUIText('slot.expandable', '확장 가능');
                    content = `
                        <div class="lt-pan">🔒</div>
                        <div class="lt-slot-info"><div class="lt-status">${expandableText}</div></div>
                        <button class="lt-slot-btn btn-unlock" onclick="Game.unlockSlot(${slot.id})">$${slot.cost}</button>
                    `;
                } else {
                    let btnText = getUIText('slot.cook', '굽기');
                    let btnClass = 'btn-cook';
                    let statusText = getUIText('slot.waiting', '대기 중');
                    let icon = '🍳';
                    let disabled = '';

                    if (slot.state === 'cooking') {
                        btnText = '...'; disabled = 'disabled'; statusText = getUIText('slot.cooking', '조리 중'); icon = '🔥';
                    } else if (slot.state === 'ready') {
                        const toastType = getToastType(slot.result.id);
                        btnText = getUIText('slot.serve', '서빙'); btnClass = 'btn-serve'; statusText = toastType.name; icon = slot.result.icon;
                    }

                    if (slot.auto) {
                        btnText = slot.state === 'ready' ? getUIText('slot.serving', '서빙 중') : getUIText('slot.albaWorking', '알바 중');
                        btnClass = 'btn-auto'; disabled = 'disabled';
                    }

                    const albaBadgeText = getUIText('slot.albaBadge', '알바 🤖');
                    content = `
                        ${slot.auto ? `<div class="lt-alba-badge">${albaBadgeText}</div>` : ''}
                        <div class="lt-pan" id="pan-${slot.id}">${icon}</div>
                        <div class="lt-slot-info"><div class="lt-status" id="status-${slot.id}">${statusText}</div></div>
                        <button class="lt-slot-btn ${btnClass}" id="btn-${slot.id}" ${disabled} onclick="Game.handleSlotClick(${slot.id})">${btnText}</button>
                    `;
                }
                div.innerHTML = content;
                kitchen.appendChild(div);
            });
        },

        renderQueue: function() {
            const q = document.getElementById('ui-queue');
            let html = '';
            if (this.state.customers.length === 0) {
                const waitingText = getUIText('queue.waiting', '손님 기다리는 중...');
                html = `<div class="lt-no-customer">${waitingText}</div>`;
            } else {
                this.state.customers.forEach((c, i) => {
                    const pct = (c.patience / c.maxPatience) * 100;
                    const colorClass = pct < 30 ? 'low' : '';
                    html += `
                        <div class="lt-customer-wrapper" id="cust-${i}">
                            <div class="lt-patience-bar"><div class="lt-patience-fill ${colorClass}" id="bar-${i}" style="width:${pct}%"></div></div>
                            <div class="lt-customer ${pct < 20 ? 'angry' : ''}">${c.icon}</div>
                            <div class="lt-customer-bubble">🍞</div>
                        </div>
                    `;
                });
            }
            q.innerHTML = html;
        },

        updateQueueBars: function() {
            this.state.customers.forEach((c, i) => {
                const bar = document.getElementById(`bar-${i}`);
                if (bar) {
                    const pct = (c.patience / c.maxPatience) * 100;
                    bar.style.width = `${pct}%`;
                    if(pct < 30) bar.classList.add('low');
                    
                    if(pct < 20) {
                        const cust = document.querySelector(`#cust-${i} .lt-customer`);
                        if(cust) cust.classList.add('angry');
                    }
                }
            });
        },

        // --- GAME LOOP ---
        startDay: function() {
            this.state.dayTime = 40;
            this.state.customers = [];
            document.getElementById('ui-timer').style.width = '100%';
            
            this.gameLoop = setInterval(() => this.tick(), 100); 
            
            // [밸런스 패치] 날이 갈수록 손님이 더 빨리 옴
            // 기본 2.5초 -> 매일 0.08초씩 빨라짐 (최소 0.5초)
            let spawnRate = Math.max(500, 2500 - (this.state.day * 80));
            this.customerLoop = setInterval(() => this.spawnCustomer(), spawnRate);

            this.eventLoop = setInterval(() => {
                if(Math.random() < 0.05 && !this.state.activeEvent) this.triggerEvent();
            }, 1000);
            this.albaLoop = setInterval(() => this.processAlba(), 500);

            this.updateUI();
            this.renderSlots();
            this.renderQueue();
        },

        tick: function() {
            this.state.dayTime -= 0.1;
            const pct = (this.state.dayTime / 40) * 100;
            document.getElementById('ui-timer').style.width = pct + '%';

            // [밸런스 패치] 인내심 감소 속도 고정 (1.5)
            // 날이 지나도 참을성은 똑같지만, 오는 속도가 빨라져서 쌓임
            let patienceLoss = 1.5; 
            if (this.state.activeEvent?.id === 'impatient') patienceLoss *= 2;
            patienceLoss /= this.state.patienceMult;

            let leftCustomer = false;
            let needsRender = false;

            for (let i = this.state.customers.length - 1; i >= 0; i--) {
                const c = this.state.customers[i];
                c.patience -= patienceLoss;
                if (c.patience <= 0) {
                    this.state.customers.splice(i, 1);
                    this.state.lives--;
                    leftCustomer = true;
                    needsRender = true;
                    const customerLeftText = getUIText('messages.customerLeft', '손님 떠남! 😡');
                    this.showFloat(0, customerLeftText, "red", true);
                }
            }

            if (needsRender) this.renderQueue(); 
            else this.updateQueueBars(); 

            if (leftCustomer) {
                this.updateUI();
                if (this.state.lives <= 0) {
                    const reputationRuinedText = getUIText('messages.reputationRuined', '평판이 바닥났습니다...');
                    this.gameOver(reputationRuinedText);
                }
            }

            if (this.state.dayTime <= 0) this.endDay();
        },

        spawnCustomer: function() {
            if (this.state.customers.length < this.state.maxQueue) {
                const c = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
                this.state.customers.push({
                    icon: c,
                    maxPatience: 100,
                    patience: 100
                });
                this.renderQueue();
            }
        },

        handleSlotClick: function(id) {
            const slot = this.state.slots[id];
            if (slot.locked || slot.auto) return;
            if (this.state.activeEvent?.id === 'blackout') {
                const blackoutText = getUIText('messages.blackout', '정전! ⚡');
                this.showFloat(id, blackoutText, "#555");
                return;
            }

            if (slot.state === 'idle') {
                this.startCook(slot);
            } else if (slot.state === 'ready') {
                this.serveToast(slot);
            }
        },

        startCook: function(slot) {
            slot.state = 'cooking';
            this.renderSlots();

            let cookTime = 800 / this.state.speedMult;
            if (slot.auto) cookTime = 1500;

            setTimeout(() => {
                const p = this.state.probs;
                const total = p.burnt + p.normal + p.special + p.rainbow;
                let r = Math.random() * total;
                let typeId = 'burnt';
                
                if (r < p.burnt) typeId = 'burnt';
                else if (r < p.burnt + p.normal) typeId = 'normal';
                else if (r < p.burnt + p.normal + p.special) typeId = 'special';
                else typeId = 'rainbow';

                const toastType = TOAST_TYPES.find(t => t.id === typeId);
                slot.result = {
                    ...toastType,
                    name: getToastType(typeId).name
                };
                slot.state = 'ready';
                this.renderSlots();
            }, cookTime);
        },

        serveToast: function(slot) {
            if (this.state.customers.length === 0) {
                const noCustomerText = getUIText('messages.noCustomer', '손님 없음!');
                this.showFloat(slot.id, noCustomerText, "#555");
                return;
            }

            let income = slot.result.price * this.state.priceMult;
            
            if (this.state.activeEvent?.id === 'rush') income *= 2;
            if (this.state.activeEvent?.id === 'critic' && slot.result.id !== 'burnt') {
                income *= 5;
                this.endEvent();
                const criticPraiseText = getUIText('messages.criticPraise', '미식가 극찬!');
                this.showFloat(slot.id, criticPraiseText, "#ff9800");
            }

            this.state.money += Math.floor(income);
            this.state.customers.shift(); 
            this.renderQueue();

            if (income > 0) this.showFloat(slot.id, `+$${Math.floor(income)}`, slot.result.color);
            else {
                const refundText = getUIText('messages.refund', '환불...');
                this.showFloat(slot.id, refundText, "#555");
            }

            slot.state = 'idle';
            slot.result = null;
            this.renderSlots();
            this.updateUI();
        },

        processAlba: function() {
            if (this.state.activeEvent?.id === 'blackout') return;
            this.state.slots.forEach(slot => {
                if (!slot.locked && slot.auto) {
                    if (slot.state === 'idle') this.startCook(slot);
                    else if (slot.state === 'ready' && this.state.customers.length > 0) this.serveToast(slot);
                }
            });
        },

        unlockSlot: function(id) {
            const slot = this.state.slots[id];
            if (this.state.money >= slot.cost) {
                this.state.money -= slot.cost;
                slot.locked = false;
                this.renderSlots();
                this.updateUI();
            } else {
                const notEnoughMoneyText = getUIText('messages.notEnoughMoney', '돈 부족!');
                this.showFloat(id, notEnoughMoneyText, "red");
            }
        },

        // --- EVENTS ---
        triggerEvent: function() {
            const evtId = EVENTS[Math.floor(Math.random() * EVENTS.length)].id;
            const evt = getEvent(evtId);
            this.state.activeEvent = { ...evt, id: evtId };
            
            const banner = document.getElementById('ui-event');
            banner.querySelector('.lt-evt-title').innerText = evt.name;
            banner.querySelector('.lt-evt-desc').innerText = evt.desc;
            banner.style.display = 'block';
            banner.style.background = evt.type === 'good' ? '#ffeb3b' : '#212121';
            banner.style.color = evt.type === 'good' ? '#000' : '#fff';

            if (evtId === 'tax') {
                this.state.money -= 50;
                const taxPaidText = getUIText('messages.taxPaid', '-$50 세금!');
                this.showFloat(0, taxPaidText, "red", true);
                setTimeout(() => this.endEvent(), 2000);
            } else if (evt.duration > 0) {
                setTimeout(() => this.endEvent(), evt.duration);
            }
        },

        endEvent: function() {
            this.state.activeEvent = null;
            document.getElementById('ui-event').style.display = 'none';
        },

        // --- END DAY ---
        endDay: function() {
            this.clearLoops();
            
            const modal = document.getElementById('modal-end');
            modal.innerHTML = '';
            modal.classList.add('active');

            if (this.state.money >= this.state.rent) {
                this.state.money -= this.state.rent;
                this.state.day++;
                this.state.rent = Math.floor(this.state.rent * 1.35) + 50;

                // [최고 기록 갱신]
                if (this.state.day > this.state.highScore) {
                    this.state.highScore = this.state.day;
                    localStorage.setItem('lucky-toast-highscore', this.state.highScore);
                }

                const dayEndTitle = getUIText('modal.dayEnd.title', '영업 종료');
                const rentPaidText = getUIText('modal.dayEnd.rentPaid', '임대료 지불 완료. 잔액: $');
                const selectStrategyText = getUIText('modal.dayEnd.selectStrategy', '🎁 전략 선택');
                let html = `
                    <h2 style="color:#fff;">${dayEndTitle}</h2>
                    <p style="color:#eee;">${rentPaidText}${this.state.money}</p>
                    <h3 style="color:#ffcc80;">${selectStrategyText}</h3>
                    <div class="lt-cards">
                `;

                const pool = [...UPGRADES];
                const choices = [];
                for(let i=0; i<3; i++) choices.push(pool[Math.floor(Math.random()*pool.length)]);

                choices.forEach((card, i) => {
                    const upgradeInfo = getUpgrade(card.id);
                    html += `
                        <div class="lt-card ${card.type==='risk'?'risk':''}" id="card-${i}">
                            <div style="font-size:2rem;">${upgradeInfo.icon}</div>
                            <div>
                                <div style="font-weight:bold;">${upgradeInfo.name}</div>
                                <div style="font-size:0.8rem; color:#666;">${upgradeInfo.desc}</div>
                            </div>
                        </div>
                    `;
                });
                html += `</div>`;
                modal.innerHTML = html;

                choices.forEach((card, i) => {
                    document.getElementById(`card-${i}`).onclick = () => this.applyCard(card);
                });

            } else {
                const cannotPayRentText = getUIText('modal.gameOver.cannotPayRent', '임대료를 내지 못했습니다...');
                this.gameOver(cannotPayRentText);
            }
        },

        gameOver: function(reason) {
            this.clearLoops();
            
            // 최고 기록 갱신 (게임 오버 시에도 도달한 날짜 기록)
            if (this.state.day > this.state.highScore) {
                this.state.highScore = this.state.day;
                localStorage.setItem('lucky-toast-highscore', this.state.highScore);
            }

            const modal = document.getElementById('modal-end');
            const gameOverTitle = getUIText('modal.gameOver.title', '파산 💸');
            const bestRecordText = getUIText('modal.gameOver.bestRecord', '최고 기록: DAY');
            const currentRecordText = getUIText('modal.gameOver.currentRecord', '이번 기록: DAY');
            const retryText = getUIText('modal.gameOver.retry', '다시 시작');
            modal.innerHTML = `
                <h1 style="color:#ff5252; font-size:3rem;">${gameOverTitle}</h1>
                <p style="color:#fff; font-size:1.2rem;">${reason}</p>
                <div style="margin:20px 0; color:#fff;">
                    <div style="font-size:1.5rem; color:#ffeb3b;">${bestRecordText} ${this.state.highScore}</div>
                    <div style="color:#aaa;">${currentRecordText} ${this.state.day}</div>
                </div>
                <button class="lt-slot-btn btn-cook" onclick="location.reload()">${retryText}</button>
            `;
            modal.classList.add('active');
        },

        clearLoops: function() {
            clearInterval(this.gameLoop);
            clearInterval(this.customerLoop);
            clearInterval(this.eventLoop);
            clearInterval(this.albaLoop);
        },

        applyCard: function(card) {
            const st = this.state;
            
            if (card.id === 'hire_alba') {
                const target = st.slots.find(s => !s.locked && !s.auto);
                if (target) {
                    target.auto = true;
                    st.rent += 20;
                } else {
                    const noSlotText = getUIText('modal.noSlotForAlba', '배치할 화구가 없습니다!');
                    alert(noSlotText);
                    return;
                }
            }
            else if (card.id === 'candy') { st.patienceMult *= 1.15; }
            else if (card.id === 'spicy_sauce') { st.priceMult += 0.5; st.probs.burnt += 10; }
            else if (card.id === 'safety_first') { st.probs.burnt = 0; st.speedMult *= 0.7; }
            else if (card.id === 'gambler') { st.probs.rainbow += 10; st.probs.normal = 0; }
            else if (card.id === 'marketing') { st.priceMult += 0.1; }
            else if (card.id === 'loan') { st.money += 300; st.rent += 30; }

            document.getElementById('modal-end').classList.remove('active');
            this.startDay();
        },

        showFloat: function(slotId, text, color, isGlobal = false) {
            let parent;
            if (isGlobal) parent = document.querySelector('.lt-game-area') || document.querySelector('.lt-wrapper');
            else parent = document.getElementById(`slot-${slotId}`);
            
            if(!parent) return;
            const el = document.createElement('div');
            el.className = 'float-text';
            el.innerText = text;
            el.style.color = color;
            el.style.left = '50%';
            el.style.top = isGlobal ? '20%' : '20px'; 
            parent.appendChild(el);
            setTimeout(() => el.remove(), 1000);
        },

        updateUI: function() {
            document.getElementById('ui-day').innerText = this.state.day;
            document.getElementById('ui-rent').innerText = this.state.rent;
            document.getElementById('ui-money').innerText = this.state.money;
            document.getElementById('ui-hiscore').innerText = this.state.highScore;
            
            let h = '';
            for(let i=0; i<this.state.lives; i++) h += '❤️';
            document.getElementById('ui-hearts').innerText = h;
        }
    };

    if (typeof window !== 'undefined') window.Game = Game;
})();