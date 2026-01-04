(function() {
    'use strict';

    const PHASER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js';

    // ... (generateLevel 함수는 이전과 동일) ...
    const generateLevel = (levelIndex) => {
        const distance = 1000 + (levelIndex * 20); 
        const height = 3 + Math.floor(levelIndex / 5);
        const shots = Math.max(3, 6 - Math.floor(levelIndex / 20));
        const patternType = levelIndex % 4; 

        return {
            level: levelIndex + 1,
            shots: shots,
            distance: distance,
            setup: (scene) => {
                scene.createPlatform(distance - 200, 600, 600, 2000);

                if (levelIndex === 0) {
                    scene.createBox(distance, 500, 60); 
                    scene.createBox(distance, 440, 60);
                    scene.createBox(distance, 380, 60);
                    // 텍스트 제거 (UI로 대체)
                    if(scene.drawArrow) scene.drawArrow(200, 450, 100, 450);
                } else {
                    switch(patternType) {
                        case 0: scene.createPyramid(distance, 530, height); break;
                        case 1: scene.createStack(distance, 530, 2, height + 2); break;
                        case 2: scene.createWall(distance - 50, 530, 4, height); break;
                        case 3: 
                            scene.createStack(distance - 100, 530, 2, height);
                            scene.createStack(distance + 100, 530, 2, height);
                            if(height > 4) scene.createBox(distance, 530 - (height*40), 40);
                            break;
                    }
                }
            }
        };
    };

    const GameWrapper = {
        gameInstance: null,
        callbacks: {},
        currentLevelIdx: 0, 
        
        init: function(container, options = {}) {
            this.container = container;
            this.callbacks = options;
            this.currentLevelIdx = 0; 
            
            // [디자인 변경] 게임 프레임 안에 모든 UI를 포함시킴
            this.container.innerHTML = `
                <div class="pb-wrapper">
                    <div class="game-frame">
                        <div id="phaser-game-container"></div>
                        
                        <div class="pb-ui-layer">
                            <div class="pb-header">
                                <div class="pb-info">
                                    <div class="pb-stage" id="pb-stage-txt">STAGE 1</div>
                                    <div class="pb-score">SCORE: <span id="pb-score-val">0</span></div>
                                </div>
                                <div class="pb-controls-group">
                                    <div class="pb-shots-badge">BALLS: <span id="pb-shots-val">3</span></div>
                                    <button class="btn-help" id="btn-help" title="게임 방법">?</button>
                                </div>
                            </div>
                        </div>

                        <div class="pb-modal" id="modal-help">
                            <div class="pb-modal-content">
                                <h2>게임 가이드</h2>
                                <div class="manual-grid">
                                    <div class="manual-item">
                                        <span class="manual-icon">🖱️</span>
                                        <span class="manual-title">조작</span>
                                        <span class="manual-desc">공을 뒤로 당겨서 발사하세요.<br>빈 화면을 드래그하면 맵을 정찰합니다.</span>
                                    </div>
                                    <div class="manual-item">
                                        <span class="manual-icon">🏆</span>
                                        <span class="manual-title">승리</span>
                                        <span class="manual-desc">전체 상자의 <strong>70%</strong> 이상을 파괴하면 다음 스테이지가 열립니다.</span>
                                    </div>
                                </div>
                                <button class="pb-btn-action btn-close" id="btn-close-help">닫기</button>
                            </div>
                        </div>

                        <div class="pb-modal" id="modal-msg">
                            <div class="pb-modal-content">
                                <div class="pb-msg-title" id="msg-title"></div>
                                <div class="pb-msg-sub" id="msg-sub"></div>
                                <button class="pb-btn-action" id="msg-btn" tabindex="-1">NEXT</button>
                            </div>
                        </div>

                    </div>
                </div>
            `;

            // UI 요소 캐싱
            this.el = {
                score: document.getElementById('pb-score-val'),
                stage: document.getElementById('pb-stage-txt'),
                shots: document.getElementById('pb-shots-val'),
                
                modalHelp: document.getElementById('modal-help'),
                btnHelp: document.getElementById('btn-help'),
                btnCloseHelp: document.getElementById('btn-close-help'),

                modalMsg: document.getElementById('modal-msg'),
                msgTitle: document.getElementById('msg-title'),
                msgSub: document.getElementById('msg-sub'),
                msgBtn: document.getElementById('msg-btn')
            };

            // 이벤트 연결
            this.el.msgBtn.onclick = () => this.handleNextAction();
            
            // 도움말 팝업 열기/닫기
            this.el.btnHelp.onclick = () => this.el.modalHelp.classList.add('active');
            this.el.btnCloseHelp.onclick = () => this.el.modalHelp.classList.remove('active');

            this.loadPhaserScript();
        },

        loadPhaserScript: function() {
            if (typeof Phaser !== 'undefined') {
                this.startGame();
                return;
            }
            const script = document.createElement('script');
            script.src = PHASER_URL;
            script.async = true;
            script.onload = () => this.startGame();
            document.head.appendChild(script);
        },

        startGame: function() {
            class MainScene extends Phaser.Scene {
                constructor() { super('MainScene'); }
        
                preload() {
                    const ballG = this.make.graphics({x: 0, y: 0, add: false});
                    ballG.fillStyle(0xe74c3c, 1);
                    ballG.fillCircle(20, 20, 20);
                    ballG.generateTexture('tex_ball', 40, 40);

                    const boxG = this.make.graphics({x: 0, y: 0, add: false});
                    boxG.fillStyle(0xf1c40f, 1);
                    boxG.fillRect(0, 0, 40, 40);
                    boxG.lineStyle(2, 0x000000);
                    boxG.strokeRect(0, 0, 40, 40);
                    boxG.generateTexture('tex_box', 40, 40);
                }

                init(data) {
                    this.totalScore = data.score || 0;
                    this.levelStartScore = this.totalScore;
                    this.levelIdx = GameWrapper.currentLevelIdx;
                }

                create() {
                    this.initLevel();
                }

                initLevel() {
                    const worldWidth = 2000 + (this.levelIdx * 50);
                    this.matter.world.setBounds(0, -2000, worldWidth, 2600, 64, true, true, false, false);
                    this.children.removeAll(); 
                    
                    const data = generateLevel(this.levelIdx);
                    
                    this.shotsLeft = data.shots;
                    this.boxes = []; 
                    this.initialBoxCount = 0;
                    
                    this.dragState = 'none'; 
                    this.isBallFlying = false;
                    this.canShoot = true; 
                    this.dragStartScreenX = 0; 
                    this.cameraStartScrollX = 0;

                    GameWrapper.updateUI(this.totalScore, this.levelIdx, this.shotsLeft);

                    this.createBackground();
                    this.createPlatform(0, 600, 400, 2000); 
                    
                    data.setup(this);
                    this.initialBoxCount = this.boxes.length;
                    
                    this.spawnBall(); 

                    this.matter.world.on('collisionstart', (event) => {
                        event.pairs.forEach(pair => {
                            this.checkCollision(pair.bodyA, pair.bodyB);
                        });
                    });

                    this.cameras.main.setZoom(1);
                    this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
                    this.cameras.main.setBounds(0, -500, worldWidth, 1300);
                    
                    if (!data.isTutorial && this.levelIdx > 0) this.panCameraSequence(data.distance);

                    this.input.on('pointerdown', this.onPointerDown, this);
                    this.input.on('pointermove', this.onPointerMove, this);
                    this.input.on('pointerup', this.onPointerUp, this);

                    this.graphics = this.add.graphics();
                }

                onPointerDown(pointer) {
                    if (this.isBallFlying) return;
                    const dist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.ball.x, this.ball.y);
                    
                    if (this.canShoot && this.shotsLeft > 0 && dist < 80) {
                        this.dragState = 'ball';
                        this.ball.setStatic(true);
                        this.cameras.main.stopFollow();
                    } else {
                        this.dragState = 'camera';
                        this.dragStartScreenX = pointer.position.x; 
                        this.cameraStartScrollX = this.cameras.main.scrollX;
                        this.cameras.main.stopFollow(); 
                    }
                }

                onPointerMove(pointer) {
                    if (this.dragState === 'ball') {
                        const startX = 200; 
                        const startY = 450;
                        let dx = pointer.worldX - startX; 
                        let dy = pointer.worldY - startY;
                        
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        const maxDist = 150;
                        if (dist > maxDist) {
                            const ratio = maxDist / dist; dx *= ratio; dy *= ratio;
                        }
                        this.ball.setPosition(startX + dx, startY + dy);
                        this.drawTrajectory(startX, startY, startX + dx, startY + dy);
                    } 
                    else if (this.dragState === 'camera') {
                        const diff = pointer.position.x - this.dragStartScreenX;
                        this.cameras.main.scrollX = this.cameraStartScrollX - diff;
                    }
                }

                onPointerUp(pointer) {
                    if (this.dragState === 'ball') {
                        this.graphics.clear();
                        const startX = 200; const startY = 450;
                        const vectorX = startX - this.ball.x;
                        const vectorY = startY - this.ball.y;
                        const speedFactor = 0.35; 
                        
                        this.ball.setStatic(false); 
                        this.ball.setVelocity(vectorX * speedFactor, vectorY * speedFactor);
                        
                        this.shotsLeft--;
                        this.isBallFlying = true;
                        this.canShoot = false;
                        
                        this.cameras.main.startFollow(this.ball, true, 0.08, 0.08);
                        
                        GameWrapper.updateUI(this.totalScore, this.levelIdx, this.shotsLeft);
                        this.turnTimer = this.time.delayedCall(4000, () => this.checkTurnResult());
                    } 
                    else if (this.dragState === 'camera') {
                        if (!this.isBallFlying && this.canShoot) {
                            this.cameras.main.pan(200, 300, 500, 'Power2', false, (camera, progress) => {
                                if(progress === 1) this.cameras.main.startFollow(this.ball);
                            });
                        }
                    }
                    this.dragState = 'none';
                }

                checkCollision(bodyA, bodyB) {
                    let boxBody = null;
                    if (bodyA.label === 'ball' && bodyB.label === 'box') boxBody = bodyB;
                    else if (bodyB.label === 'ball' && bodyA.label === 'box') boxBody = bodyA;

                    if (boxBody && boxBody.gameObject && !boxBody.gameObject.isDestroyed) {
                        this.destroyBox(boxBody.gameObject);
                    }
                }

                spawnBall() {
                    const ball = this.matter.add.image(200, 450, 'tex_ball', null, {
                        shape: 'circle', radius: 20, restitution: 0.9, friction: 0.005, density: 0.2, label: 'ball'
                    });
                    ball.setStatic(true);
                    this.ball = ball;
                    this.isBallFlying = false;
                }

                createBox(x, y, size) {
                    const color = Phaser.Utils.Array.GetRandom([0xf1c40f, 0xe67e22, 0x9b59b6, 0x3498db, 0x2ecc71, 0xe74c3c]);
                    const box = this.matter.add.image(x, y, 'tex_box', null, {
                        restitution: 0.2, friction: 0.1, density: 0.01, label: 'box'
                    });
                    box.setDisplaySize(size, size);
                    box.setTint(color);
                    box.isDestroyed = false;
                    this.boxes.push(box);
                }

                update() {
                    if (this.ball && this.ball.active && this.ball.y > 800) { 
                        this.ball.destroy();
                        this.cameras.main.stopFollow();
                        if (this.turnTimer) this.turnTimer.remove();
                        this.time.delayedCall(500, () => this.checkTurnResult());
                    }
                    this.boxes.forEach((box) => {
                        if (box.active && !box.isDestroyed && box.y > 800) this.destroyBox(box);
                    });
                }

                destroyBox(box) {
                    if(box.isDestroyed) return;
                    box.isDestroyed = true;
                    const boom = this.add.circle(box.x, box.y, 40, 0xffffff);
                    this.tweens.add({ targets: boom, scale: 2, alpha: 0, duration: 200, onComplete: () => boom.destroy() });
                    box.destroy(); 
                    this.totalScore += 100;
                    GameWrapper.updateUI(this.totalScore, this.levelIdx, this.shotsLeft);
                    this.checkWinCondition();
                }

                checkWinCondition() {
                    const activeBoxes = this.boxes.filter(box => box.active && !box.isDestroyed).length;
                    const threshold = Math.ceil(this.initialBoxCount * 0.3); 
                    if (activeBoxes <= threshold) {
                        if (this.turnTimer) this.turnTimer.remove();
                        this.levelClear();
                    }
                }
                
                checkTurnResult() {
                    if (this.shotsLeft > 0) {
                        if(this.ball && this.ball.active) this.ball.destroy(); 
                        this.spawnBall();    
                        this.cameras.main.stopFollow();
                        this.cameras.main.pan(200, 300, 800, 'Power2');
                        
                        this.isBallFlying = false;
                        this.canShoot = true;
                    } else {
                        const activeBoxes = this.boxes.filter(box => box.active && !box.isDestroyed).length;
                        const threshold = Math.ceil(this.initialBoxCount * 0.3);
                        if (activeBoxes > threshold) {
                            GameWrapper.showResult("GAME OVER", "처음부터 다시 시작!", "RETRY", "retry");
                        }
                    }
                }
                
                levelClear() {
                    if(this.isLevelClearing) return;
                    this.isLevelClearing = true;
                    const bonus = this.shotsLeft * 500;
                    this.totalScore += bonus;
                    GameWrapper.updateUI(this.totalScore, this.levelIdx, this.shotsLeft);
                    
                    if (this.levelIdx < 99) {
                        GameWrapper.showResult(`STAGE ${this.levelIdx + 1} CLEAR!`, `Bonus: +${bonus}`, "NEXT LEVEL", "next");
                    } else {
                        GameWrapper.showResult("LEGENDARY!", `Final Score: ${this.totalScore}`, "RESTART ALL", "restart");
                    }
                }
                
                nextLevel() {
                    this.isLevelClearing = false;
                    GameWrapper.currentLevelIdx++;
                    this.scene.restart({ score: this.totalScore });
                }
                restartLevel() { 
                    this.isLevelClearing = false;
                    this.scene.restart({ score: 0 }); // 1탄부터
                }

                createStack(x, y, cols, rows) { for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) this.createBox(x + i * 40, y - 20 - j * 40, 40); }
                createPyramid(startX, startY, rows) { for (let i = 0; i < rows; i++) for (let j = 0; j <= i; j++) this.createBox(startX + (j * 40) - (i * 20), startY - 20 - ((rows - 1 - i) * 40), 40); }
                createWall(x, y, w, h) { this.createStack(x, y, w, h); }
                createBackground() { const g = this.add.graphics(); g.fillStyle(0xffffff, 0.4); g.fillCircle(200, 100, 50); g.fillCircle(1000, 150, 80); }
                createPlatform(x, y, w, h) {
                    this.matter.add.rectangle(x + w/2, y + h/2, w, h, { isStatic: true });
                    const g = this.add.graphics(); g.fillStyle(0x2ecc71); g.fillRect(x, y, w, 20); g.fillStyle(0x8e44ad); g.fillRect(x, y + 20, w, h - 20);
                }
                panCameraSequence(targetX) {
                    this.canShoot = false; this.cameras.main.stopFollow();
                    this.cameras.main.pan(targetX, 300, 1500, 'Power2');
                    this.time.delayedCall(2000, () => {
                        this.cameras.main.pan(200, 300, 1000, 'Power2', false, (camera, progress) => {
                            if (progress === 1) {
                                this.canShoot = true; if(this.ball && this.ball.active) this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
                            }
                        });
                    });
                }
                drawTrajectory(ox, oy, cx, cy) { this.graphics.clear(); this.graphics.lineStyle(4, 0xffffff, 0.8); this.graphics.beginPath(); this.graphics.moveTo(ox, oy); this.graphics.lineTo(cx, cy); this.graphics.strokePath(); }
                addText(x, y, text, size) { this.add.text(x, y, text, { fontFamily: 'Pretendard', fontSize: `${size}px`, color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5); }
                drawArrow(fx, fy, tx, ty) { const a = this.add.graphics(); a.lineStyle(5, 0xffeb3b, 1); a.beginPath(); a.moveTo(fx, fy); a.lineTo(tx, ty); a.strokePath(); a.fillStyle(0xffeb3b); a.fillTriangle(tx, ty, tx+10, ty-10, tx+10, ty+10); }
            }; // End Scene

            const config = {
                type: Phaser.AUTO, parent: 'phaser-game-container', backgroundColor: '#87CEEB',
                scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1000, height: 600 },
                physics: { default: 'matter', matter: { gravity: { y: 1.5 }, debug: false } },
                scene: MainScene
            };
            if (this.gameInstance) this.gameInstance.destroy(true);
            this.gameInstance = new Phaser.Game(config);
        },

        updateUI: function(score, stageIdx, shots) {
            if(this.el.score) this.el.score.innerText = score;
            if(this.el.stage) this.el.stage.innerText = `STAGE ${stageIdx + 1}`;
            if(this.el.shots) this.el.shots.innerText = shots;
        },
        showResult: function(title, sub, btnText, actionType) {
            if(!this.el.modalMsg) return;
            this.el.msgTitle.innerText = title; this.el.msgSub.innerText = sub; this.el.msgBtn.innerText = btnText;
            this.el.modalMsg.classList.add('active'); this.currentAction = actionType;
            this.el.msgBtn.focus();
        },
        hideResult: function() { if(this.el.modalMsg) this.el.modalMsg.classList.remove('active'); },
        handleNextAction: function() {
            if(!this.gameInstance) return;
            const scene = this.gameInstance.scene.getScene('MainScene');
            if (scene) {
                if (this.currentAction === 'next') scene.nextLevel();
                else if (this.currentAction === 'retry') { GameWrapper.currentLevelIdx = 0; scene.restartLevel(); }
                else if (this.currentAction === 'restart') { GameWrapper.currentLevelIdx = 0; scene.restartLevel(); }
            }
            this.hideResult();
        },
        reset: function() {
            if (this.gameInstance) {
                const scene = this.gameInstance.scene.getScene('MainScene');
                if (scene) scene.restartLevel();
            }
        }
    };

    if (typeof window !== 'undefined') window.Game = GameWrapper;
})();