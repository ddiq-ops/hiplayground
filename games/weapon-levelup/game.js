(function() {
  'use strict';

  // Helper function to get translated text
  function getUIText(key, defaultValue) {
      if (typeof I18n !== 'undefined' && I18n.t) {
          const fullKey = `gameDetails.weapon-levelup.ui.${key}`;
          const value = I18n.t(fullKey, defaultValue);
          if (value === fullKey || value === defaultValue) {
              return defaultValue;
          }
          return value;
      }
      return defaultValue;
  }

  // ================= STORAGE HELPER =================
  const LocalStorage = {
      save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
      get: (key) => JSON.parse(localStorage.getItem(key))
  };

  // ================= DATA & CONFIG =================
  // 1~100레벨 무기 진화 리스트 (테마별 구성)
  const WEAPON_ICONS = [
      '🪵', '🦴', '🥄', '🔪', '🪡', '📌', '🎋', '🧹', '🏏', '🪃',
      '🔨', '🔧', '🔩', '⛏️', '⛓️', '🪝', '⚙️', '🗜️', '✂️', '🦯',
      '🗡️', '🛡️', '🏹', '⚔️', '🤺', '🥊', '🥋', '🪓', '🔱', '🔫',
      '🪄', '🔮', '🧿', '🕯️', '🔥', '💧', '⚡', '❄️', '🌪️', '🧪',
      '🐲', '🦖', '🐊', '🐍', '🦂', '🕷️', '💀', '☠️', '👹', '👺',
      '📀', '⚜️', '⚱️', '🏺', '🗿', '💎', '💍', '👑', '🏆', '🥇',
      '🦾', '🦿', '🕶️', '💾', '💿', '📡', '🔭', '🔬', '🧬', '🤖',
      '🛸', '👽', '👾', '🚀', '🛰️', '☄️', '🌑', '🌕', '🌍', '🪐',
      '⭐', '🌟', '✨', '❇️', '✴️', '⚛️', '🌌', '🌫️', '🌀', '♾️',
      '☀️', '🌩️', '🌈', '🎪', '🎡', '🎢', '⛲', '🗽', '🗼', '🏯',
      '🐲👑' 
  ]; 

  const POTIONS = [
      { id: 1, name: '확률 포션 (1.2배)', icon: '🧪', price: 1000, desc: '성공 확률 1.2배 증가' },
      { id: 2, name: '고급 확률 (1.5배)', icon: '⚗️', price: 3000, desc: '성공 확률 1.5배 증가' },
      { id: 3, name: '보호막 (50%)', icon: '🛡️', price: 10000, desc: '실패 시 50% 확률로 유지' },
      { id: 4, name: '강철 보호 (80%)', icon: '🏰', price: 30000, desc: '실패 시 80% 확률로 유지' },
      { id: 5, name: '랜덤 박스', icon: '🎁', price: 3000, desc: '사용 시 포션 1개 획득' }
  ];

  // ================= GAME LOGIC =================
  const Game = {
      container: null,
      state: {
          weaponLevel: 1,
          gold: 100,
          inventory: [1, 1, 1, 1, 1], // 각 포션 개수
          activePotion: null, // 현재 적용된 포션 인덱스 (0-based)
          storedWeapon: 0, // 보관함
          stats: { total: 0, success: 0 }
      },

      init: function(container) {
          this.container = container;
          this.loadProgress();
          this.renderLayout();
          this.updateUI();
          this.setupEvents();
          
          // Listen for language changes
          document.addEventListener('i18n:loaded', () => {
              this.updateUI();
          });
      },

      loadProgress: function() {
          const saved = LocalStorage.get('wl_save_v1');
          if(saved) {
              this.state = { ...this.state, ...saved };
              this.state.weaponLevel = Math.max(1, Math.min(100, this.state.weaponLevel));
          }
      },

      saveProgress: function() {
          LocalStorage.save('wl_save_v1', this.state);
      },

      // --- CORE CALCULATIONS ---
      getUpgradeCost: function() {
          return Math.floor(this.state.weaponLevel * 20 + 15);
      },

      getSuccessRate: function() {
          let rate = Math.max(10, 100 - this.state.weaponLevel);
          if(this.state.activePotion === 0) rate *= 1.2; 
          if(this.state.activePotion === 1) rate *= 1.5; 
          return Math.min(100, rate);
      },

      getSellPrice: function() {
          const lv = this.state.weaponLevel;
          return Math.floor(lv * lv * 25 + lv * 60 + 30);
      },

      // --- ACTIONS ---
      upgrade: function() {
          const cost = this.getUpgradeCost();
          if(this.state.gold < cost) return this.showMsg(getUIText('messages.notEnoughGold', '골드가 부족합니다!'), "error");
          if(this.state.weaponLevel >= 100) return this.showMsg(getUIText('messages.maxLevel', '최대 레벨입니다!'), "warning");

          this.state.gold -= cost;
          this.state.stats.total++;
          
          const rate = this.getSuccessRate();
          const roll = Math.random() * 100;
          const isSuccess = roll < rate;

          const weaponEl = document.querySelector('.weapon-stage');
          weaponEl.className = 'weapon-stage'; 
          void weaponEl.offsetWidth; 

          if(isSuccess) {
              this.state.weaponLevel++;
              this.state.stats.success++;
              this.showMsg(getUIText('messages.upgradeSuccess', '강화 성공! 레벨 업!'), "success");
              weaponEl.classList.add('anim-success');
          } else {
              let isProtected = false;
              if(this.state.activePotion === 2 && Math.random() < 0.5) isProtected = true;
              if(this.state.activePotion === 3 && Math.random() < 0.8) isProtected = true;

              if(isProtected) {
                  this.showMsg(getUIText('messages.upgradeFailedProtected', '강화 실패! 하지만 무기는 보호되었습니다.'), "info");
              } else if(this.state.storedWeapon > 0) {
                  this.state.weaponLevel = this.state.storedWeapon;
                  this.state.storedWeapon = 0;
                  const storedWeaponText = getUIText('messages.storedWeaponEquipped', '강화 실패.. 보관된 레벨 {level} 무기를 장착합니다.').replace('{level}', this.state.weaponLevel);
                  this.showMsg(storedWeaponText, "error");
              } else {
                  this.state.weaponLevel = 1;
                  this.showMsg(getUIText('messages.upgradeFailedDestroyed', '강화 실패! 무기가 파괴되었습니다.. (Lv.1)'), "error");
              }
              weaponEl.classList.add('anim-fail');
          }

          this.state.activePotion = null;
          this.saveProgress();
          this.updateUI();
      },

      sell: function() {
          if(this.state.weaponLevel <= 1) return this.showMsg(getUIText('messages.cannotSellLevel1', '레벨 1은 판매할 수 없습니다.'), "error");
          
          const price = this.getSellPrice();
          if(confirm(`현재 무기(Lv.${this.state.weaponLevel})를 ${price.toLocaleString()} 골드에 판매하시겠습니까?`)) {
              this.state.gold += price;
              this.state.weaponLevel = 1;
              this.showMsg(`판매 완료! +${price.toLocaleString()} G`, "success");
              this.saveProgress();
              this.updateUI();
          }
      },

      store: function() {
          if(this.state.weaponLevel <= 1) return this.showMsg("레벨 1은 보관할 수 없습니다.", "error");
          if(this.state.storedWeapon > 0) return this.showMsg("이미 보관된 무기가 있습니다.", "error");

          if(confirm(`현재 무기(Lv.${this.state.weaponLevel})를 보관하시겠습니까? 현재 장비는 Lv.1이 됩니다.`)) {
              this.state.storedWeapon = this.state.weaponLevel;
              this.state.weaponLevel = 1;
              this.showMsg("무기 보관 완료! 든든하군요.", "success");
              this.saveProgress();
              this.updateUI();
          }
      },

      // --- SHOP & INVENTORY ---
      buyPotion: function(idx) {
          const item = POTIONS[idx];
          if(this.state.gold < item.price) return alert("골드가 부족합니다.");

          this.state.gold -= item.price;
          this.state.inventory[idx]++; // [수정] 랜덤박스도 일단 인벤토리에 들어감
          
          this.showMsg(`${item.name} 구매 완료!`, "success");
          this.saveProgress();
          this.updateUI();
          this.renderShop(); 
      },

      usePotion: function(idx) {
          if(this.state.inventory[idx] <= 0) return;

          // [수정] 랜덤박스(idx 4) 사용 시 로직
          if(idx === 4) {
              this.state.inventory[idx]--; // 랜덤박스 소모

              const r = Math.random();
              let rewardIdx = 0;
              // 확률: 1번(70%), 2번(20%), 3번(8%), 4번(2%)
              if(r < 0.7) rewardIdx = 0;
              else if(r < 0.9) rewardIdx = 1;
              else if(r < 0.98) rewardIdx = 2;
              else rewardIdx = 3;

              this.state.inventory[rewardIdx]++; // [핵심] 해당 아이템 개수 증가
              this.showMsg(`🎁 랜덤박스 결과: ${POTIONS[rewardIdx].name} 획득!`, "success");
              
              this.saveProgress();
              this.updateUI();
              return; // 강화 효과 적용 안 하고 종료
          }

          // 일반 포션 로직
          if(this.state.activePotion !== null) return this.showMsg("이미 사용 중인 포션이 있습니다.", "warning");

          this.state.inventory[idx]--;
          this.state.activePotion = idx;
          this.showMsg(`${POTIONS[idx].name} 사용됨! 다음 강화에 적용됩니다.`, "info");
          
          this.saveProgress();
          this.updateUI();
      },

      // --- RENDER & UI ---
      renderLayout: function() {
          this.container.innerHTML = `
              <div class="wl-wrapper">
                  <div class="game-frame">
                      <div class="wl-header">
                          <h2 class="wl-title">내 무기만 레벨업</h2>
                          <div class="wl-stats">
                              <div class="wl-stat-card"><span class="stat-label">무기 레벨</span><span class="stat-value" id="val-lv">1</span></div>
                              <div class="wl-stat-card"><span class="stat-label">보유 골드</span><span class="stat-value" id="val-gold">0</span></div>
                              <div class="wl-stat-card"><span class="stat-label">성공 확률</span><span class="stat-value" id="val-rate">99%</span></div>
                          </div>
                      </div>

                      <div class="wl-body">
                          <div class="wl-panel">
                              <div class="panel-title">🔨 대장간</div>
                              <div class="info-box">
                                  비용: <span class="highlight" id="cost-upgrade">0</span> G<br>
                                  <span id="txt-fail-risk" class="risk">실패 시 Lv.1로 초기화!</span>
                              </div>
                              <div id="potion-status" style="display:none; background:#2980b9; padding:10px; border-radius:8px; font-size:0.9rem;"></div>
                              <button class="btn btn-upgrade" id="btn-upgrade">강화하기</button>
                          </div>

                          <div class="wl-center">
                              <div class="weapon-stage">
                                  <div class="weapon-emoji" id="weapon-icon">🗡️</div>
                              </div>
                              <div class="level-badge" id="badge-lv">Lv.1</div>
                              <div class="msg-toast" id="msg-toast"></div>
                          </div>

                          <div class="wl-panel">
                              <div class="panel-title">📦 관리</div>
                              <div class="info-box">
                                  판매가: <span class="highlight" id="cost-sell">0</span> G<br>
                                  보관중: <span class="highlight" id="val-stored">없음</span>
                              </div>
                              <button class="btn btn-sell" id="btn-sell">판매하기</button>
                              <button class="btn btn-secondary" id="btn-store" style="margin-top:10px">보관하기</button>
                              <button class="btn btn-shop" id="btn-open-shop">상점 열기</button>
                          </div>
                      </div>

                      <div class="wl-inventory" id="inventory-bar"></div>

                      <div class="modal-overlay" id="shop-modal">
                          <div class="modal-box">
                              <div class="modal-header">
                                  <h3>아이템 상점</h3>
                                  <button class="modal-close" id="btn-close-shop">×</button>
                              </div>
                              <div class="modal-body">
                                  <div class="shop-grid" id="shop-list"></div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          `;
      },

      updateUI: function() {
          // Stats
          document.getElementById('val-lv').innerText = this.state.weaponLevel;
          document.getElementById('val-gold').innerText = this.state.gold.toLocaleString();
          document.getElementById('val-rate').innerText = Math.floor(this.getSuccessRate()) + '%';
          document.getElementById('badge-lv').innerText = `Lv.${this.state.weaponLevel}`;
          
          // Icon
          const iconIdx = Math.min(this.state.weaponLevel - 1, WEAPON_ICONS.length - 1);
          document.getElementById('weapon-icon').innerText = WEAPON_ICONS[iconIdx];

          // Costs
          document.getElementById('cost-upgrade').innerText = this.getUpgradeCost().toLocaleString();
          document.getElementById('cost-sell').innerText = this.getSellPrice().toLocaleString();
          
          // Stored
          const storedText = this.state.storedWeapon > 0 ? `Lv.${this.state.storedWeapon}` : "없음";
          document.getElementById('val-stored').innerText = storedText;
          document.getElementById('txt-fail-risk').innerText = this.state.storedWeapon > 0 
              ? `실패 시 보관된 Lv.${this.state.storedWeapon} 장착` 
              : "실패 시 Lv.1로 초기화!";

          // Potion Status
          const pStatus = document.getElementById('potion-status');
          if(this.state.activePotion !== null) {
              pStatus.style.display = 'block';
              pStatus.innerText = `적용 중: ${POTIONS[this.state.activePotion].name}`;
          } else {
              pStatus.style.display = 'none';
          }

          // Inventory Bar (전체 포션 표시)
          const invBar = document.getElementById('inventory-bar');
          let invHtml = '<span class="inv-title">가방:</span>';
          POTIONS.forEach((p, idx) => {
              invHtml += `
                  <div class="inv-slot" onclick="Game.usePotion(${idx})" title="${p.name} (클릭하여 사용)">
                      ${p.icon}
                      <span class="inv-count">${this.state.inventory[idx]}</span>
                  </div>
              `;
          });
          invBar.innerHTML = invHtml;
      },

      renderShop: function() {
          const grid = document.getElementById('shop-list');
          grid.innerHTML = '';
          POTIONS.forEach((p, idx) => {
              const canBuy = this.state.gold >= p.price;
              const div = document.createElement('div');
              div.className = 'shop-item';
              div.innerHTML = `
                  <div class="shop-icon">${p.icon}</div>
                  <div class="shop-name">${p.name}</div>
                  <div class="shop-desc">${p.desc}</div>
                  <div class="shop-price">${p.price.toLocaleString()} G</div>
                  <button class="btn btn-buy" ${canBuy ? '' : 'disabled'}>구매하기</button>
              `;
              div.querySelector('button').onclick = () => this.buyPotion(idx);
              grid.appendChild(div);
          });
      },

      setupEvents: function() {
          document.getElementById('btn-upgrade').onclick = () => this.upgrade();
          document.getElementById('btn-sell').onclick = () => this.sell();
          document.getElementById('btn-store').onclick = () => this.store();
          
          const modal = document.getElementById('shop-modal');
          document.getElementById('btn-open-shop').onclick = () => {
              this.renderShop();
              modal.classList.add('active');
          };
          document.getElementById('btn-close-shop').onclick = () => modal.classList.remove('active');
      },

      showMsg: function(text, type) {
          const toast = document.getElementById('msg-toast');
          toast.innerText = text;
          toast.className = `msg-toast ${type} anim-pop`;
          setTimeout(() => toast.classList.remove('anim-pop'), 300);
      }
  };

  if (typeof window !== 'undefined') window.Game = Game;
})();