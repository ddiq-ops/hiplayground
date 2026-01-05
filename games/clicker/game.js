(function() {
  'use strict';

  // ================= SOUND ENGINE (Web Audio API) =================
  const Sound = {
      ctx: null,
      isMuted: false,
      init: function() {
          window.AudioContext = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioContext();
      },
      playClick: function() {
          if (this.isMuted || !this.ctx) return;
          if (this.ctx.state === 'suspended') this.ctx.resume();
          
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          // 짧고 높은 톤 (레이저 느낌)
          osc.frequency.setValueAtTime(400 + Math.random()*200, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.1);
      },
      playBuy: function() {
          if (this.isMuted || !this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          // 띠링~ (성공음)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
          
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.3);
      }
  };

  // ================= GAME DATA =================
  const UPGRADES = [
      { id: 'clicker', name: '파워 글러브', type: 'manual', baseCost: 15, basePower: 1, icon: '🥊', desc: '클릭 당 에너지 +1' },
      { id: 'battery', name: 'AA 건전지', type: 'auto', baseCost: 50, basePower: 2, icon: '🔋', desc: '초당 에너지 +2' },
      { id: 'server', name: '홈 서버', type: 'auto', baseCost: 250, basePower: 10, icon: '🖥️', desc: '초당 에너지 +10' },
      { id: 'ai', name: '인공지능 봇', type: 'auto', baseCost: 1000, basePower: 50, icon: '🤖', desc: '초당 에너지 +50' },
      { id: 'farm', name: '비트코인 채굴기', type: 'auto', baseCost: 5000, basePower: 200, icon: '⛏️', desc: '초당 에너지 +200' },
      { id: 'nuclear', name: '핵융합 발전소', type: 'auto', baseCost: 25000, basePower: 1000, icon: '⚛️', desc: '초당 에너지 +1,000' },
      { id: 'alien', name: '외계 기술', type: 'auto', baseCost: 150000, basePower: 5000, icon: '👽', desc: '초당 에너지 +5,000' }
  ];

  const Game = {
      container: null,
      // 게임 상태 (저장 대상)
      state: {
          score: 0,
          clickPower: 1,
          autoPower: 0,
          items: {} // { id: count }
      },
      lastTime: 0,
      saveInterval: null,

      init: function(container) {
          this.container = container;
          Sound.init();
          
          // 데이터 로드
          this.loadGame();
          
          // 초기 items 데이터 보정
          UPGRADES.forEach(u => {
              if (!this.state.items[u.id]) this.state.items[u.id] = 0;
          });

          this.renderLayout();
          this.updateUI();
          this.startGameLoop();
          
          // 자동 저장 (10초마다)
          this.saveInterval = setInterval(() => this.saveGame(), 10000);
      },

      renderLayout: function() {
          this.container.innerHTML = `
              <div class="clk-wrapper">
                  <div class="game-frame">
                      <div class="clk-main">
                          <div class="clk-header">
                              <div class="clk-score" id="score-display">0</div>
                              <div class="clk-gps" id="gps-display">0 energy / sec</div>
                          </div>
                          
                          <div class="core-btn" id="core-btn"></div>
                          
                          <div class="fx-layer" id="fx-layer"></div>
                      </div>

                      <div class="clk-shop">
                          <div class="shop-header">
                              <h3 class="shop-title">SYSTEM UPGRADE</h3>
                              <button class="btn-sound" id="btn-sound">🔊</button>
                          </div>
                          <div class="shop-list" id="shop-list">
                              </div>
                      </div>
                  </div>
              </div>
          `;

          // 요소 캐싱
          this.el = {
              score: document.getElementById('score-display'),
              gps: document.getElementById('gps-display'),
              btn: document.getElementById('core-btn'),
              shop: document.getElementById('shop-list'),
              fx: document.getElementById('fx-layer'),
              soundBtn: document.getElementById('btn-sound')
          };

          // 이벤트 바인딩
          this.el.btn.addEventListener('mousedown', (e) => this.handleClick(e));
          this.el.soundBtn.addEventListener('click', () => {
              Sound.isMuted = !Sound.isMuted;
              this.el.soundBtn.innerText = Sound.isMuted ? "🔇" : "🔊";
          });

          // 상점 렌더링
          this.renderShop();
      },

      renderShop: function() {
          this.el.shop.innerHTML = '';
          UPGRADES.forEach(item => {
              const count = this.state.items[item.id];
              const cost = Math.floor(item.baseCost * Math.pow(1.15, count)); // 가격 15%씩 증가
              
              const div = document.createElement('div');
              div.className = 'upgrade-item';
              div.id = `item-${item.id}`;
              div.innerHTML = `
                  <div class="item-icon">${item.icon}</div>
                  <div class="item-info">
                      <span class="item-name">${item.name}</span>
                      <span class="item-effect">${item.desc}</span>
                      <span class="item-cost">⚡ ${this.formatNumber(cost)}</span>
                  </div>
                  <div class="item-count">${count}</div>
              `;
              div.onclick = () => this.buyItem(item);
              this.el.shop.appendChild(div);
          });
      },

      handleClick: function(e) {
          // 점수 증가
          this.addScore(this.state.clickPower);
          Sound.playClick();

          // 이펙트 1: 플로팅 텍스트
          this.spawnFloatText(e.clientX, e.clientY, `+${this.formatNumber(this.state.clickPower)}`);
          
          // 이펙트 2: 파티클
          this.spawnParticles(e.clientX, e.clientY);
      },

      buyItem: function(item) {
          const count = this.state.items[item.id];
          const cost = Math.floor(item.baseCost * Math.pow(1.15, count));

          if (this.state.score >= cost) {
              // 구매 성공
              this.state.score -= cost;
              this.state.items[item.id]++;
              
              // 능력치 적용
              if (item.type === 'manual') {
                  this.state.clickPower += item.basePower;
              } else {
                  this.state.autoPower += item.basePower;
              }

              Sound.playBuy();
              this.updateUI();
              this.renderShop(); // 가격 갱신을 위해 다시 그림
              this.saveGame();
          }
      },

      addScore: function(amount) {
          this.state.score += amount;
          this.updateUI();
      },

      startGameLoop: function() {
          // 1초마다 자동 생산 (부드러운 업데이트를 위해 100ms마다 1/10씩 추가)
          if (this.loopId) clearInterval(this.loopId);
          this.loopId = setInterval(() => {
              if (this.state.autoPower > 0) {
                  this.addScore(this.state.autoPower / 10);
              }
              // 상점 버튼 활성화/비활성화 상태 업데이트
              this.updateShopButtons();
          }, 100);
      },

      updateUI: function() {
          // 소수점 버리고 정수로 표시
          this.el.score.innerText = this.formatNumber(Math.floor(this.state.score));
          this.el.gps.innerText = `${this.formatNumber(this.state.autoPower)} energy / sec`;
      },

      updateShopButtons: function() {
          UPGRADES.forEach(item => {
              const count = this.state.items[item.id];
              const cost = Math.floor(item.baseCost * Math.pow(1.15, count));
              const el = document.getElementById(`item-${item.id}`);
              if (el) {
                  if (this.state.score >= cost) {
                      el.classList.remove('disabled');
                  } else {
                      el.classList.add('disabled');
                  }
              }
          });
      },

      // --- 이펙트 관련 ---
      spawnFloatText: function(x, y, text) {
          const el = document.createElement('div');
          el.className = 'float-text';
          el.innerText = text;
          // 게임 프레임 내부 좌표로 변환 필요 (간단히 마우스 위치 사용하되 offset)
          const rect = this.el.btn.getBoundingClientRect();
          // 버튼 중앙에서 조금 랜덤하게
          const rX = (Math.random() - 0.5) * 50;
          const rY = (Math.random() - 0.5) * 50;
          
          el.style.left = (x - rect.left + 150 + rX) + 'px'; // 대략적 보정
          el.style.top = (y - rect.top + 100 + rY) + 'px';
          
          // 좌표계를 container 기준으로 맞추기 위해 fx-layer에 넣고 위치 재조정은 복잡하므로
          // 여기서는 마우스 클릭 위치 근처에 띄우는 것으로 단순화
          // (실제로는 game-frame이 relative라 absolute position은 frame 기준임)
          // 좀 더 정확한 위치:
          const frameRect = document.querySelector('.clk-main').getBoundingClientRect();
          el.style.left = (x - frameRect.left) + 'px';
          el.style.top = (y - frameRect.top) + 'px';

          this.el.fx.appendChild(el);
          setTimeout(() => el.remove(), 800);
      },

      spawnParticles: function(x, y) {
          const frameRect = document.querySelector('.clk-main').getBoundingClientRect();
          const baseX = x - frameRect.left;
          const baseY = y - frameRect.top;

          for(let i=0; i<8; i++) {
              const p = document.createElement('div');
              p.className = 'particle';
              p.style.left = baseX + 'px';
              p.style.top = baseY + 'px';
              
              // 랜덤 방향으로 퍼지기
              const angle = Math.random() * Math.PI * 2;
              const dist = 50 + Math.random() * 50;
              const tx = Math.cos(angle) * dist + 'px';
              const ty = Math.sin(angle) * dist + 'px';
              
              p.style.setProperty('--tx', tx);
              p.style.setProperty('--ty', ty);
              
              this.el.fx.appendChild(p);
              setTimeout(() => p.remove(), 600);
          }
      },

      // --- 유틸리티 ---
      formatNumber: function(num) {
          if (num < 1000) return Math.floor(num);
          if (num < 1000000) return (num / 1000).toFixed(1) + 'k';
          if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
          return (num / 1000000000).toFixed(2) + 'B';
      },

      saveGame: function() {
          localStorage.setItem('clicker_save_v1', JSON.stringify(this.state));
      },

      loadGame: function() {
          const saved = localStorage.getItem('clicker_save_v1');
          if (saved) {
              try {
                  const parsed = JSON.parse(saved);
                  // 데이터 병합 (새로운 필드 추가 대비)
                  this.state = { ...this.state, ...parsed };
              } catch (e) {
                  console.error("Save file corrupted");
              }
          }
      },
      
      reset: function() {
          localStorage.removeItem('clicker_save_v1');
          this.state = { score: 0, clickPower: 1, autoPower: 0, items: {} };
          this.init(this.container);
      }
  };

  if (typeof window !== 'undefined') window.Game = Game;
})();