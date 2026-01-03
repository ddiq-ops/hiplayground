/**
 * 2-Button Mini Olympics Game
 * 3 events: Hurdles, Javelin, Swimming
 * 2버튼 미니 올림픽: 장애물, 창던지기, 수영
 */

(function() {
  let canvas = null;
  let ctx = null;
  let container = null;
  let wrapper = null;
  let callbacks = {};
  let animationId = null;
  let buttonA = null;
  let buttonB = null;
  let header = null;
  
  // Game states
  const STATE = {
    INTRO: 'intro',
    HURDLES: 'hurdles',
    JAVELIN: 'javelin',
    SWIMMING: 'swimming',
    FINAL_RESULT: 'finalResult'
  };
  
  let gameState = STATE.INTRO;
  let totalScore = 0;
  let eventScores = {
    hurdles: 0,
    javelin: 0,
    swimming: 0
  };
  
  // Input handling
  let keyPressed = { a: false, b: false };
  let buttonAPressed = false;
  let buttonBPressed = false;
  let lastButtonPress = null;
  
  // Hurdles state
  let hurdles = {
    playerX: 50,
    playerY: 0,
    playerSpeed: 2,
    playerVelocity: 0,
    isJumping: false,
    jumpVelocity: 0,
    obstacles: [],
    finishLine: 0,
    time: 0,
    completed: false
  };
  
  // Javelin state
  let javelin = {
    phase: 'running', // 'running' or 'aiming'
    runnerX: 50,
    runnerY: 0,
    runSpeed: 0,
    power: 0,
    maxPower: 100,
    angle: 45,
    angleDirection: 1,
    javelinX: 0,
    javelinY: 0,
    javelinVx: 0,
    javelinVy: 0,
    thrown: false,
    distance: 0,
    foulLine: 0,
    completed: false
  };
  
  // Swimming state
  let swimming = {
    swimmerX: 50,
    swimmerY: 0,
    speed: 2,
    lastButton: null,
    correctSequence: true,
    time: 0,
    distance: 0,
    targetDistance: 50,
    completed: false
  };
  
  // Transition
  let transitionText = '';
  let transitionTimer = 0;
  
  // Fireworks
  let fireworks = [];
  
  const Game = {
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      // Create wrapper
      wrapper = document.createElement('div');
      wrapper.className = 'olympic-game';
      container.appendChild(wrapper);
      
      // Create header
      header = document.createElement('div');
      header.className = 'olympic-header';
      wrapper.appendChild(header);
      
      // Create canvas wrapper
      const canvasWrapper = document.createElement('div');
      canvasWrapper.className = 'olympic-canvas-wrapper';
      wrapper.appendChild(canvasWrapper);
      
      // Create canvas
      canvas = document.createElement('canvas');
      canvas.className = 'olympic-canvas';
      canvasWrapper.appendChild(canvas);
      
      ctx = canvas.getContext('2d');
      
      // Create buttons
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'olympic-buttons';
      wrapper.appendChild(buttonsContainer);
      
      buttonA = document.createElement('button');
      buttonA.className = 'olympic-button olympic-button-a';
      buttonA.innerHTML = '<span class="olympic-button-label">A / Z</span>버튼';
      buttonsContainer.appendChild(buttonA);
      
      buttonB = document.createElement('button');
      buttonB.className = 'olympic-button olympic-button-b';
      buttonB.innerHTML = '<span class="olympic-button-label">B / X</span>버튼';
      buttonsContainer.appendChild(buttonB);
      
      // Setup canvas size
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      
      // Setup events
      this.setupEvents();
      
      // Initialize
      this.reset();
      
      // Start game loop
      this.gameLoop();
    },
    
    resizeCanvas: function() {
      if (!canvas || !wrapper) return;
      
      const rect = wrapper.getBoundingClientRect();
      const headerHeight = header ? header.offsetHeight : 0;
      const buttonsHeight = 160; // Approximate button area height
      
      canvas.width = rect.width;
      canvas.height = rect.height - headerHeight - buttonsHeight;
      
      // Update game positions
      if (gameState === STATE.HURDLES) {
        hurdles.playerY = canvas.height - 60;
        hurdles.finishLine = canvas.width - 50;
      } else if (gameState === STATE.JAVELIN) {
        javelin.runnerY = canvas.height - 80;
        javelin.foulLine = canvas.width * 0.3;
      } else if (gameState === STATE.SWIMMING) {
        swimming.swimmerY = canvas.height / 2;
      }
      
      this.render();
    },
    
    setupEvents: function() {
      // Keyboard
      document.addEventListener('keydown', (e) => {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          keyPressed.a = true;
          buttonAPressed = true;
        } else if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          keyPressed.b = true;
          buttonBPressed = true;
        }
      });
      
      document.addEventListener('keyup', (e) => {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          keyPressed.a = false;
          buttonAPressed = false;
        } else if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          keyPressed.b = false;
          buttonBPressed = false;
        }
      });
      
      // Touch buttons
      buttonA.addEventListener('touchstart', (e) => {
        e.preventDefault();
        buttonAPressed = true;
        keyPressed.a = true;
      });
      
      buttonA.addEventListener('touchend', (e) => {
        e.preventDefault();
        buttonAPressed = false;
        keyPressed.a = false;
      });
      
      buttonA.addEventListener('mousedown', () => {
        buttonAPressed = true;
        keyPressed.a = true;
      });
      
      buttonA.addEventListener('mouseup', () => {
        buttonAPressed = false;
        keyPressed.a = false;
      });
      
      buttonB.addEventListener('touchstart', (e) => {
        e.preventDefault();
        buttonBPressed = true;
        keyPressed.b = true;
      });
      
      buttonB.addEventListener('touchend', (e) => {
        e.preventDefault();
        buttonBPressed = false;
        keyPressed.b = false;
      });
      
      buttonB.addEventListener('mousedown', () => {
        buttonBPressed = true;
        keyPressed.b = true;
      });
      
      buttonB.addEventListener('mouseup', () => {
        buttonBPressed = false;
        keyPressed.b = false;
      });
    },
    
    reset: function() {
      gameState = STATE.INTRO;
      totalScore = 0;
      eventScores = { hurdles: 0, javelin: 0, swimming: 0 };
      transitionText = '';
      transitionTimer = 0;
      fireworks = [];
      
      // Reset hurdles
      hurdles.playerX = 50;
      hurdles.playerY = canvas ? canvas.height - 60 : 300;
      hurdles.playerSpeed = 2;
      hurdles.playerVelocity = 0;
      hurdles.isJumping = false;
      hurdles.jumpVelocity = 0;
      hurdles.obstacles = [];
      hurdles.finishLine = canvas ? canvas.width - 50 : 700;
      hurdles.time = 0;
      hurdles.completed = false;
      
      // Reset javelin
      javelin.phase = 'running';
      javelin.runnerX = 50;
      javelin.runnerY = canvas ? canvas.height - 80 : 300;
      javelin.runSpeed = 0;
      javelin.power = 0;
      javelin.angle = 45;
      javelin.angleDirection = 1;
      javelin.javelinX = 0;
      javelin.javelinY = 0;
      javelin.javelinVx = 0;
      javelin.javelinVy = 0;
      javelin.thrown = false;
      javelin.distance = 0;
      javelin.foulLine = canvas ? canvas.width * 0.3 : 300;
      javelin.completed = false;
      
      // Reset swimming
      swimming.swimmerX = 50;
      swimming.swimmerY = canvas ? canvas.height / 2 : 200;
      swimming.speed = 2;
      swimming.lastButton = null;
      swimming.correctSequence = true;
      swimming.time = 0;
      swimming.distance = 0;
      swimming.targetDistance = 50;
      swimming.completed = false;
      
      this.updateHeader();
    },
    
    updateHeader: function() {
      if (!header) return;
      
      let eventName = '';
      let scoreText = '';
      
      switch(gameState) {
        case STATE.INTRO:
          eventName = '준비하세요!';
          scoreText = '시작하려면 A 버튼을 누르세요';
          break;
        case STATE.HURDLES:
          eventName = '장애물 달리기';
          scoreText = `시간: ${hurdles.time.toFixed(1)}초`;
          break;
        case STATE.JAVELIN:
          eventName = '창 던지기';
          if (javelin.phase === 'running') {
            scoreText = `파워: ${Math.round(javelin.power)}%`;
          } else {
            scoreText = `각도: ${Math.round(javelin.angle)}°`;
          }
          break;
        case STATE.SWIMMING:
          eventName = '수영';
          scoreText = `거리: ${swimming.distance.toFixed(1)}m / ${swimming.targetDistance}m`;
          break;
        case STATE.FINAL_RESULT:
          eventName = '최종 결과';
          scoreText = `총점: ${totalScore.toFixed(0)}점`;
          break;
      }
      
      header.innerHTML = `
        <div class="olympic-event-name">${eventName}</div>
        <div class="olympic-score">${scoreText}</div>
      `;
    },
    
    update: function() {
      if (!canvas) return;
      
      const deltaTime = 1/60; // Assume 60fps
      
      switch(gameState) {
        case STATE.INTRO:
          if (keyPressed.a || buttonAPressed) {
            this.startHurdles();
          }
          break;
          
        case STATE.HURDLES:
          this.updateHurdles(deltaTime);
          break;
          
        case STATE.JAVELIN:
          this.updateJavelin(deltaTime);
          break;
          
        case STATE.SWIMMING:
          this.updateSwimming(deltaTime);
          break;
          
        case STATE.FINAL_RESULT:
          this.updateFireworks();
          break;
      }
      
      // Handle transitions
      if (transitionTimer > 0) {
        transitionTimer -= deltaTime;
        if (transitionTimer <= 0) {
          transitionText = '';
        }
      }
    },
    
    startHurdles: function() {
      gameState = STATE.HURDLES;
      hurdles.playerX = 50;
      hurdles.playerY = canvas.height - 60;
      hurdles.finishLine = canvas.width - 50;
      hurdles.obstacles = [];
      hurdles.time = 0;
      hurdles.completed = false;
      
      // Create initial obstacles
      for (let i = 0; i < 5; i++) {
        hurdles.obstacles.push({
          x: 200 + i * 150,
          height: 40,
          passed: false
        });
      }
      
      this.updateHeader();
    },
    
    updateHurdles: function(deltaTime) {
      if (hurdles.completed) return;
      
      hurdles.time += deltaTime;
      
      // A button: increase speed
      if (keyPressed.a || buttonAPressed) {
        hurdles.playerSpeed = Math.min(hurdles.playerSpeed + 0.3, 8);
      } else {
        hurdles.playerSpeed = Math.max(hurdles.playerSpeed - 0.1, 2);
      }
      
      // B button: jump
      if ((keyPressed.b || buttonBPressed) && !hurdles.isJumping) {
        hurdles.isJumping = true;
        hurdles.jumpVelocity = -15;
      }
      
      // Apply jump
      if (hurdles.isJumping) {
        hurdles.playerY += hurdles.jumpVelocity;
        hurdles.jumpVelocity += 0.8; // gravity
        
        if (hurdles.playerY >= canvas.height - 60) {
          hurdles.playerY = canvas.height - 60;
          hurdles.isJumping = false;
          hurdles.jumpVelocity = 0;
        }
      }
      
      // Move player
      hurdles.playerX += hurdles.playerSpeed;
      
      // Check obstacle collisions
      for (let obstacle of hurdles.obstacles) {
        if (!obstacle.passed && 
            hurdles.playerX + 30 > obstacle.x && 
            hurdles.playerX < obstacle.x + 20 &&
            hurdles.playerY + 50 > canvas.height - obstacle.height) {
          // Collision!
          hurdles.playerX = obstacle.x - 30;
          hurdles.playerSpeed = 0;
          hurdles.playerVelocity = 0;
          // Fall down animation
          setTimeout(() => {
            hurdles.playerSpeed = 2;
          }, 500);
        }
        
        if (hurdles.playerX > obstacle.x + 20) {
          obstacle.passed = true;
        }
      }
      
      // Check finish line
      if (hurdles.playerX >= hurdles.finishLine) {
        hurdles.completed = true;
        // Score: faster = higher (max 1000 points for ~5 seconds)
        eventScores.hurdles = Math.max(0, 1000 - hurdles.time * 100);
        totalScore += eventScores.hurdles;
        
        setTimeout(() => {
          this.startJavelin();
        }, 2000);
      }
    },
    
    startJavelin: function() {
      transitionText = '다음 종목: 창 던지기!';
      transitionTimer = 2;
      
      setTimeout(() => {
        gameState = STATE.JAVELIN;
        javelin.phase = 'running';
        javelin.runnerX = 50;
        javelin.runnerY = canvas.height - 80;
        javelin.runSpeed = 0;
        javelin.power = 0;
        javelin.angle = 45;
        javelin.angleDirection = 1;
        javelin.thrown = false;
        javelin.distance = 0;
        javelin.foulLine = canvas.width * 0.3;
        javelin.completed = false;
        this.updateHeader();
      }, 2000);
    },
    
    updateJavelin: function(deltaTime) {
      if (javelin.completed) return;
      
      if (javelin.phase === 'running') {
        // Phase 1: Running
        if (keyPressed.a || buttonAPressed) {
          javelin.runSpeed = Math.min(javelin.runSpeed + 2, 8);
          javelin.power = Math.min(javelin.power + 3, javelin.maxPower);
        } else {
          javelin.runSpeed = Math.max(javelin.runSpeed - 0.5, 0);
        }
        
        javelin.runnerX += javelin.runSpeed;
        
        // Check if near foul line
        if (javelin.runnerX >= javelin.foulLine - 20) {
          // Switch to aiming phase
          if (keyPressed.b || buttonBPressed) {
            javelin.phase = 'aiming';
            javelin.javelinX = javelin.runnerX;
            javelin.javelinY = javelin.runnerY - 20;
          }
        }
        
        // Foul if past line
        if (javelin.runnerX >= javelin.foulLine && !javelin.thrown) {
          javelin.completed = true;
          eventScores.javelin = 0;
          setTimeout(() => {
            this.startSwimming();
          }, 2000);
        }
      } else if (javelin.phase === 'aiming') {
        // Phase 2: Aiming
        if (keyPressed.b || buttonBPressed) {
          // Adjust angle
          javelin.angle += javelin.angleDirection * 60 * deltaTime;
          if (javelin.angle >= 90) {
            javelin.angle = 90;
            javelin.angleDirection = -1;
          } else if (javelin.angle <= 0) {
            javelin.angle = 0;
            javelin.angleDirection = 1;
          }
        } else {
          // Release: throw!
          if (!javelin.thrown) {
            javelin.thrown = true;
            const angleRad = (javelin.angle * Math.PI) / 180;
            const powerMultiplier = javelin.power / javelin.maxPower;
            javelin.javelinVx = Math.cos(angleRad) * 15 * powerMultiplier;
            javelin.javelinVy = -Math.sin(angleRad) * 15 * powerMultiplier;
          }
        }
        
        // Update javelin flight
        if (javelin.thrown) {
          javelin.javelinX += javelin.javelinVx;
          javelin.javelinY += javelin.javelinVy;
          javelin.javelinVy += 0.5; // gravity
          
          // Check if hit ground
          if (javelin.javelinY >= canvas.height - 40) {
            javelin.javelinY = canvas.height - 40;
            javelin.completed = true;
            
            // Calculate distance (in meters, scaled)
            javelin.distance = ((javelin.javelinX - javelin.foulLine) / canvas.width) * 100;
            if (javelin.distance < 0) javelin.distance = 0;
            
            // Score: distance based (max 1000 points for 100m)
            eventScores.javelin = Math.min(1000, javelin.distance * 10);
            totalScore += eventScores.javelin;
            
            setTimeout(() => {
              this.startSwimming();
            }, 2000);
          }
        }
      }
    },
    
    startSwimming: function() {
      transitionText = '다음 종목: 수영!';
      transitionTimer = 2;
      
      setTimeout(() => {
        gameState = STATE.SWIMMING;
        swimming.swimmerX = 50;
        swimming.swimmerY = canvas.height / 2;
        swimming.speed = 2;
        swimming.lastButton = null;
        swimming.correctSequence = true;
        swimming.time = 0;
        swimming.distance = 0;
        swimming.targetDistance = 50;
        swimming.completed = false;
        this.updateHeader();
      }, 2000);
    },
    
    updateSwimming: function(deltaTime) {
      if (swimming.completed) return;
      
      swimming.time += deltaTime;
      
      // Check button sequence
      let currentButton = null;
      if (keyPressed.a || buttonAPressed) {
        currentButton = 'a';
      } else if (keyPressed.b || buttonBPressed) {
        currentButton = 'b';
      }
      
      if (currentButton) {
        if (swimming.lastButton === currentButton) {
          // Same button pressed - slip!
          swimming.correctSequence = false;
          swimming.speed = Math.max(swimming.speed - 1, 0.5);
        } else {
          // Correct sequence
          swimming.correctSequence = true;
          swimming.speed = Math.min(swimming.speed + 0.5, 6);
          swimming.lastButton = currentButton;
        }
      } else {
        // No button - slow down
        swimming.speed = Math.max(swimming.speed - 0.1, 1);
      }
      
      // Move swimmer
      swimming.swimmerX += swimming.speed;
      swimming.distance = ((swimming.swimmerX - 50) / canvas.width) * 100;
      
      // Check finish
      if (swimming.distance >= swimming.targetDistance) {
        swimming.completed = true;
        // Score: faster = higher (max 1000 points for ~8 seconds)
        eventScores.swimming = Math.max(0, 1000 - swimming.time * 80);
        totalScore += eventScores.swimming;
        
        setTimeout(() => {
          this.showFinalResult();
        }, 2000);
      }
    },
    
    showFinalResult: function() {
      gameState = STATE.FINAL_RESULT;
      fireworks = [];
      
      // Create fireworks
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          this.createFirework();
        }, i * 100);
      }
      
      this.updateHeader();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(totalScore);
      }
    },
    
    createFirework: function() {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.5;
      
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 2 + Math.random() * 3;
        fireworks.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60,
          color: `hsl(${Math.random() * 360}, 100%, 60%)`
        });
      }
    },
    
    updateFireworks: function() {
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        fw.x += fw.vx;
        fw.y += fw.vy;
        fw.vy += 0.1; // gravity
        fw.life--;
        
        if (fw.life <= 0) {
          fireworks.splice(i, 1);
        }
      }
    },
    
    render: function() {
      if (!canvas || !ctx) return;
      
      // Clear canvas
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      switch(gameState) {
        case STATE.INTRO:
          this.renderIntro();
          break;
        case STATE.HURDLES:
          this.renderHurdles();
          break;
        case STATE.JAVELIN:
          this.renderJavelin();
          break;
        case STATE.SWIMMING:
          this.renderSwimming();
          break;
        case STATE.FINAL_RESULT:
          this.renderFinalResult();
          break;
      }
      
      // Render transition
      if (transitionText && transitionTimer > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(transitionText, canvas.width / 2, canvas.height / 2);
      }
    },
    
    renderIntro: function() {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2버튼 미니 올림픽', canvas.width / 2, canvas.height / 2 - 60);
      
      ctx.fillStyle = '#666';
      ctx.font = '24px Arial';
      ctx.fillText('A 버튼을 눌러 시작하세요', canvas.width / 2, canvas.height / 2);
      
      ctx.fillStyle = '#888';
      ctx.font = '18px Arial';
      ctx.fillText('장애물 달리기 → 창 던지기 → 수영', canvas.width / 2, canvas.height / 2 + 40);
    },
    
    renderHurdles: function() {
      // Draw track
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
      
      // Draw finish line
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hurdles.finishLine, canvas.height - 40);
      ctx.lineTo(hurdles.finishLine, canvas.height);
      ctx.stroke();
      
      // Draw obstacles
      ctx.fillStyle = '#654321';
      for (let obstacle of hurdles.obstacles) {
        ctx.fillRect(obstacle.x, canvas.height - obstacle.height, 20, obstacle.height);
      }
      
      // Draw player
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(hurdles.playerX, hurdles.playerY, 30, 50);
      
      // Draw face
      ctx.fillStyle = '#000';
      ctx.fillRect(hurdles.playerX + 8, hurdles.playerY + 10, 5, 5);
      ctx.fillRect(hurdles.playerX + 17, hurdles.playerY + 10, 5, 5);
    },
    
    renderJavelin: function() {
      // Draw ground
      ctx.fillStyle = '#90EE90';
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
      
      // Draw foul line
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(javelin.foulLine, 0);
      ctx.lineTo(javelin.foulLine, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
      
      if (javelin.phase === 'running') {
        // Draw runner
        ctx.fillStyle = '#4444FF';
        ctx.fillRect(javelin.runnerX, javelin.runnerY, 30, 50);
        
        // Draw power bar
        const barWidth = 200;
        const barHeight = 20;
        ctx.fillStyle = '#333';
        ctx.fillRect(canvas.width / 2 - barWidth / 2, 20, barWidth, barHeight);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(canvas.width / 2 - barWidth / 2, 20, (barWidth * javelin.power) / javelin.maxPower, barHeight);
      } else {
        // Draw javelin
        if (javelin.thrown) {
          ctx.save();
          ctx.translate(javelin.javelinX, javelin.javelinY);
          const angle = Math.atan2(javelin.javelinVy, javelin.javelinVx);
          ctx.rotate(angle);
          ctx.fillStyle = '#C0C0C0';
          ctx.fillRect(-30, -2, 60, 4);
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(-30, -2, 10, 4);
          ctx.restore();
        } else {
          // Draw aiming indicator
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(javelin.javelinX, javelin.javelinY);
          const angleRad = (javelin.angle * Math.PI) / 180;
          ctx.lineTo(
            javelin.javelinX + Math.cos(angleRad) * 100,
            javelin.javelinY - Math.sin(angleRad) * 100
          );
          ctx.stroke();
        }
      }
    },
    
    renderSwimming: function() {
      // Draw water
      ctx.fillStyle = '#4682B4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw water waves
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const waveY = canvas.height / 2 + Math.sin(Date.now() / 500 + i) * 10;
        ctx.moveTo(0, waveY + i * 30);
        ctx.lineTo(canvas.width, waveY + i * 30);
        ctx.stroke();
      }
      
      // Draw swimmer
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(swimming.swimmerX, swimming.swimmerY, 30, 40);
      
      // Draw finish line
      const finishX = 50 + (swimming.targetDistance / 100) * canvas.width;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(finishX, 0);
      ctx.lineTo(finishX, canvas.height);
      ctx.stroke();
    },
    
    renderFinalResult: function() {
      // Draw fireworks
      for (let fw of fireworks) {
        ctx.fillStyle = fw.color;
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw result overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Determine medal
      let medal = '참가상';
      let medalEmoji = '🏅';
      if (totalScore >= 2500) {
        medal = '금메달';
        medalEmoji = '🥇';
      } else if (totalScore >= 2000) {
        medal = '은메달';
        medalEmoji = '🥈';
      } else if (totalScore >= 1500) {
        medal = '동메달';
        medalEmoji = '🥉';
      }
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(medal, canvas.width / 2, canvas.height / 2 - 100);
      
      ctx.font = '72px Arial';
      ctx.fillText(medalEmoji, canvas.width / 2, canvas.height / 2 - 20);
      
      ctx.font = '36px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`총점: ${totalScore.toFixed(0)}점`, canvas.width / 2, canvas.height / 2 + 60);
      
      ctx.font = '20px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(`장애물: ${eventScores.hurdles.toFixed(0)}점`, canvas.width / 2, canvas.height / 2 + 100);
      ctx.fillText(`창던지기: ${eventScores.javelin.toFixed(0)}점`, canvas.width / 2, canvas.height / 2 + 125);
      ctx.fillText(`수영: ${eventScores.swimming.toFixed(0)}점`, canvas.width / 2, canvas.height / 2 + 150);
    },
    
    gameLoop: function() {
      this.update();
      this.render();
      animationId = requestAnimationFrame(() => this.gameLoop());
    },
    
    destroy: function() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    }
  };
  
  // Export
  if (typeof window !== 'undefined') {
    window.Game = Game;
  }
})();

