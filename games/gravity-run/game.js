/**
 * Gravity Run Game
 * Flip gravity to avoid obstacles
 * 그래비티 런: 중력을 바꿔서 장애물 피하기
 */

(function() {
  let canvas = null;
  let ctx = null;
  let container = null;
  let wrapper = null;
  let callbacks = {};
  let animationId = null;
  let gameActive = false;
  let assetsLoaded = false;
  
  // Assets
  const assets = {
    bgTile: null,
    playerRunSheet: null,
    playerFlipSheet: null,
    obstaclesSheet: null,
    coinSheet: null,
    uiScoreBg: null
  };
  
  // Asset dimensions (will be set after loading)
  const assetInfo = {
    playerRunFrames: 6,
    playerFlipFrames: 3,
    coinFrames: 6,
    obstacleSheetWidth: 0,
    obstacleSheetHeight: 0
  };
  
  // Game state
  const PLAYER_SIZE = 120; // 2x size (60 -> 120)
  let player = { x: 100, y: 0 };
  let gravity = 1; // 1 = down, -1 = up
  let obstacles = [];
  let coins = [];
  let scrollSpeed = 4;
  let score = 0;
  let frameCount = 0;
  let gameTime = 0;
  let OBSTACLE_GAP = 180;
  let lastCoinTime = 0;
  let coinSpawnInterval = 180;
  
  // Animation state
  let playerRunFrame = 0;
  let playerFlipFrame = 0;
  let playerFlipAnimating = false;
  let playerFlipAnimFrameCount = 0;
  let coinFrame = 0;
  let bgScrollX = 0;
  
  // Player animation timing
  const PLAYER_RUN_ANIM_SPEED = 8; // Frames per animation frame
  const PLAYER_FLIP_ANIM_SPEED = 5; // Frames per animation frame
  const COIN_ANIM_SPEED = 8; // Frames per animation frame
  
  const Game = {
    /**
     * Load all game assets
     */
    loadAssets: function(callback) {
      const assetPath = '../assets/games/gravity-run/images/webp/';
      const assetList = [
        { key: 'bgTile', path: assetPath + 'bg_tile.webp' },
        { key: 'playerRunSheet', path: assetPath + 'player_run_sheet.webp' },
        { key: 'playerFlipSheet', path: assetPath + 'player_flip_sheet.webp' },
        { key: 'obstaclesSheet', path: assetPath + 'obstacles_sheet.webp' },
        { key: 'coinSheet', path: assetPath + 'coin_sheet.webp' },
        { key: 'uiScoreBg', path: assetPath + 'ui_score_bg.webp' }
      ];
      
      let loadedCount = 0;
      let failedCount = 0;
      const totalAssets = assetList.length;
      
      assetList.forEach(asset => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          assets[asset.key] = img;
          console.log('Loaded asset:', asset.key);
          
          // Store obstacle sheet dimensions
          if (asset.key === 'obstaclesSheet') {
            assetInfo.obstacleSheetWidth = img.width;
            assetInfo.obstacleSheetHeight = img.height;
          }
          
          if (loadedCount + failedCount === totalAssets) {
            assetsLoaded = true;
            console.log(`Assets loaded: ${loadedCount}/${totalAssets} (${failedCount} failed)`);
            if (callback) callback();
          }
        };
        img.onerror = () => {
          failedCount++;
          console.error('Failed to load asset:', asset.path, asset.key);
          if (loadedCount + failedCount === totalAssets) {
            assetsLoaded = true;
            console.log(`Assets loaded: ${loadedCount}/${totalAssets} (${failedCount} failed)`);
            if (callback) callback();
          }
        };
        img.src = asset.path;
      });
    },
    
    init: function(gameContainer, options = {}) {
      container = gameContainer;
      callbacks = options;
      
      // Create wrapper div
      wrapper = document.createElement('div');
      wrapper.className = 'gravity-run-game';
      container.appendChild(wrapper);
      
      // Create canvas
      canvas = document.createElement('canvas');
      canvas.className = 'gravity-run-canvas';
      wrapper.appendChild(canvas);
      
      ctx = canvas.getContext('2d');
      
      // Setup canvas size
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      
      // Load assets first, then initialize game
      this.loadAssets(() => {
        // Initialize game after assets are loaded
        this.reset();
        
        // Setup events
        canvas.addEventListener('click', () => this.handleClick());
        canvas.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.handleClick();
        });
        
        // Start game loop
        this.gameLoop();
      });
    },
    
    resizeCanvas: function() {
      if (!canvas || !wrapper) return;
      
      const rect = wrapper.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Set initial player position
      if (gravity === 1) {
        player.y = canvas.height - PLAYER_SIZE - 10;
      } else {
        player.y = 10;
      }
      
      // Redraw if assets are loaded
      if (assetsLoaded) {
        this.render();
      }
    },
    
    reset: function() {
      obstacles = [];
      coins = [];
      score = 0;
      frameCount = 0;
      gameTime = 0;
      scrollSpeed = 4;
      OBSTACLE_GAP = 180;
      gravity = 1;
      gameActive = true;
      lastCoinTime = 0;
      coinSpawnInterval = 180;
      bgScrollX = 0;
      playerRunFrame = 0;
      playerFlipFrame = 0;
      playerFlipAnimating = false;
      coinFrame = 0;
      
      if (canvas) {
        player.x = 100;
        player.y = canvas.height - PLAYER_SIZE - 10;
      }
      
      // Create initial obstacles
      this.createObstacles();
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(score);
      }
    },
    
    calculateDifficulty: function() {
      gameTime = frameCount / 60;
      scrollSpeed = 4 + Math.pow(gameTime / 10, 1.5);
      OBSTACLE_GAP = Math.max(60, 180 - gameTime / 3);
    },
    
    generateObstacleHeight: function() {
      const minHeight = 80;
      const maxHeight = Math.min(400, 80 + gameTime);
      
      const rand = Math.random();
      const timeFactor = Math.min(1, gameTime / 120);
      
      if (rand < 0.6 - timeFactor * 0.3) {
        return minHeight + Math.random() * 60;
      } else if (rand < 0.9 - timeFactor * 0.1) {
        return 140 + Math.random() * 100;
      } else {
        return 240 + Math.random() * (maxHeight - 240);
      }
    },
    
    createObstacles: function() {
      if (!canvas) return;
      
      obstacles = [];
      const numObstacles = Math.ceil(canvas.width / OBSTACLE_GAP) + 2;
      
      for (let i = 0; i < numObstacles; i++) {
        const x = canvas.width + (i * OBSTACLE_GAP);
        const isTop = Math.random() < 0.5;
        
        obstacles.push({
          x: x,
          top: isTop,
          height: this.generateObstacleHeight()
        });
      }
    },
    
    findSafeCoinPosition: function() {
      if (!canvas) return null;
      
      const coinSize = 60; // 2x size (30 -> 60)
      const margin = 40;
      const maxAttempts = 20;
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const spawnY = Math.random() * (canvas.height - coinSize * 2) + coinSize;
        const spawnX = canvas.width;
        
        let isSafe = true;
        for (const obstacle of obstacles) {
          const obstacleX = obstacle.x;
          const obstacleY = obstacle.top ? 0 : canvas.height - obstacle.height;
          const obstacleHeight = obstacle.height;
          
          if (spawnX - obstacleX < 200 && spawnX - obstacleX > -obstacleHeight) {
            const coinTop = spawnY - coinSize / 2;
            const coinBottom = spawnY + coinSize / 2;
            const obstacleTop = obstacleY;
            const obstacleBottom = obstacleY + obstacleHeight;
            
            if (!(coinBottom + margin < obstacleTop || coinTop - margin > obstacleBottom)) {
              isSafe = false;
              break;
            }
          }
        }
        
        if (isSafe) {
          return spawnY;
        }
      }
      
      return canvas.height / 2;
    },
    
    handleClick: function() {
      if (!gameActive || !assetsLoaded) return;
      
      // Start flip animation
      if (!playerFlipAnimating) {
        gravity *= -1;
        playerFlipAnimating = true;
        playerFlipFrame = 0;
        playerFlipAnimFrameCount = 0;
      }
    },
    
    update: function() {
      if (!gameActive || !canvas || !assetsLoaded) return;
      
      frameCount++;
      
      // Update animations
      if (frameCount % PLAYER_RUN_ANIM_SPEED === 0 && !playerFlipAnimating) {
        playerRunFrame = (playerRunFrame + 1) % assetInfo.playerRunFrames;
      }
      
      if (playerFlipAnimating) {
        playerFlipAnimFrameCount++;
        if (playerFlipAnimFrameCount % PLAYER_FLIP_ANIM_SPEED === 0) {
          playerFlipFrame++;
          if (playerFlipFrame >= assetInfo.playerFlipFrames) {
            playerFlipAnimating = false;
            playerFlipFrame = 0;
            playerFlipAnimFrameCount = 0;
          }
        }
      }
      
      if (frameCount % COIN_ANIM_SPEED === 0) {
        coinFrame = (coinFrame + 1) % assetInfo.coinFrames;
      }
      
      // Calculate difficulty
      this.calculateDifficulty();
      
      // Update background scroll
      if (assets.bgTile) {
        bgScrollX -= scrollSpeed * 0.5; // Background scrolls slower
        if (bgScrollX <= -assets.bgTile.width) {
          bgScrollX += assets.bgTile.width;
        }
      }
      
      // Auto score increase
      if (frameCount % 60 === 0) {
        score += 1;
        if (callbacks.onScoreUpdate) {
          callbacks.onScoreUpdate(score);
        }
      }
      
      // Apply gravity to player
      player.y += gravity * 8;
      
      // Keep player in bounds
      if (gravity === 1) {
        if (player.y > canvas.height - PLAYER_SIZE - 10) {
          player.y = canvas.height - PLAYER_SIZE - 10;
        }
        if (player.y < 10) {
          player.y = 10;
        }
      } else {
        if (player.y < 10) {
          player.y = 10;
        }
        if (player.y > canvas.height - PLAYER_SIZE - 10) {
          player.y = canvas.height - PLAYER_SIZE - 10;
        }
      }
      
      // Move obstacles
      obstacles.forEach(obstacle => {
        obstacle.x -= scrollSpeed;
      });
      
      // Move coins
      coins.forEach(coin => {
        coin.x -= scrollSpeed;
      });
      
      // Remove off-screen objects
      obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.height > 0);
      coins = coins.filter(coin => coin.x + 60 > 0); // 2x size (30 -> 60)
      
      // Add new obstacles
      if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - OBSTACLE_GAP) {
        const isTop = Math.random() < 0.5;
        obstacles.push({
          x: canvas.width,
          top: isTop,
          height: this.generateObstacleHeight()
        });
      }
      
      // Spawn coins
      if (frameCount - lastCoinTime >= coinSpawnInterval) {
        const spawnY = this.findSafeCoinPosition();
        if (spawnY !== null) {
          coins.push({
            x: canvas.width,
            y: spawnY,
            size: 60, // 2x size (30 -> 60)
            collected: false
          });
          lastCoinTime = frameCount;
        }
        coinSpawnInterval = 180 + Math.random() * 120;
      }
      
      // Check collisions
      this.checkCollisions();
      this.checkCoinCollisions();
      
      // Update score from obstacles passed
      obstacles.forEach(obstacle => {
        if (obstacle.x + obstacle.height < player.x && !obstacle.passed) {
          obstacle.passed = true;
          score += 1;
        }
      });
      
      if (callbacks.onScoreUpdate) {
        callbacks.onScoreUpdate(score);
      }
    },
    
    checkCollisions: function() {
      if (!canvas || !assetsLoaded) return;
      
      // Collision box: 0px (collision check enabled but box size is 0)
      const COLLISION_WIDTH = 0;
      const COLLISION_HEIGHT = 0;
      const collisionOffsetX = (PLAYER_SIZE - COLLISION_WIDTH) / 2;
      const collisionOffsetY = (PLAYER_SIZE - COLLISION_HEIGHT) / 2;
      
      obstacles.forEach(obstacle => {
        const obstacleX = obstacle.x;
        const obstacleY = obstacle.top ? 0 : canvas.height - obstacle.height;
        const obstacleWidth = obstacle.height;
        const obstacleHeight = obstacle.height;
        
        // Player collision box (centered on player, but size is 0)
        const playerCollisionX = player.x + collisionOffsetX;
        const playerCollisionY = player.y + collisionOffsetY;
        
        if (playerCollisionX < obstacleX + obstacleWidth &&
            playerCollisionX + COLLISION_WIDTH > obstacleX &&
            playerCollisionY < obstacleY + obstacleHeight &&
            playerCollisionY + COLLISION_HEIGHT > obstacleY) {
          this.gameOver();
        }
      });
    },
    
    checkCoinCollisions: function() {
      if (!canvas) return;
      
      coins.forEach(coin => {
        if (coin.collected) return;
        
        const coinCenterX = coin.x + coin.size / 2;
        const coinCenterY = coin.y + coin.size / 2;
        const playerCenterX = player.x + PLAYER_SIZE / 2;
        const playerCenterY = player.y + PLAYER_SIZE / 2;
        
        const distance = Math.sqrt(
          Math.pow(coinCenterX - playerCenterX, 2) +
          Math.pow(coinCenterY - playerCenterY, 2)
        );
        
        if (distance < (coin.size / 2 + PLAYER_SIZE / 2)) {
          coin.collected = true;
          score += 50;
          if (callbacks.onScoreUpdate) {
            callbacks.onScoreUpdate(score);
          }
        }
      });
      
      coins = coins.filter(coin => !coin.collected);
    },
    
    render: function() {
      if (!ctx || !canvas || !assetsLoaded) return;
      
      // Clear canvas with background color
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw scrolling background tile
      if (assets.bgTile) {
        const tileWidth = assets.bgTile.width;
        const tileHeight = assets.bgTile.height;
        
        // Calculate offset for seamless scrolling (handle negative bgScrollX)
        const offsetX = ((bgScrollX % tileWidth) + tileWidth) % tileWidth;
        const startX = -tileWidth + offsetX;
        
        // Draw tiles to cover entire screen and one extra for seamless scrolling
        for (let x = startX; x < canvas.width; x += tileWidth) {
          ctx.drawImage(
            assets.bgTile,
            0, 0, tileWidth, tileHeight,  // Source: full tile
            Math.floor(x), 0, tileWidth, tileHeight  // Destination
          );
        }
      }
      
      // Draw obstacles
      if (assets.obstaclesSheet) {
        obstacles.forEach(obstacle => {
          const obstacleY = obstacle.top ? 0 : canvas.height - obstacle.height;
          const obstacleWidth = obstacle.height;
          
          // Use integer values for precise cropping
          const sheetWidth = assetInfo.obstacleSheetWidth;
          const sheetHeight = assetInfo.obstacleSheetHeight;
          const halfWidth = Math.floor(sheetWidth / 2);
          
          if (obstacle.top) {
            // Top obstacle - use right half of sheet
            const sourceX = halfWidth;
            const sourceY = 0;
            const sourceWidth = sheetWidth - halfWidth;
            const sourceHeight = sheetHeight;
            
            ctx.drawImage(
              assets.obstaclesSheet,
              sourceX, sourceY, sourceWidth, sourceHeight,
              Math.floor(obstacle.x), Math.floor(obstacleY), obstacleWidth, obstacle.height
            );
          } else {
            // Bottom obstacle - use left half of sheet
            const sourceX = 0;
            const sourceY = 0;
            const sourceWidth = halfWidth;
            const sourceHeight = sheetHeight;
            
            ctx.drawImage(
              assets.obstaclesSheet,
              sourceX, sourceY, sourceWidth, sourceHeight,
              Math.floor(obstacle.x), Math.floor(obstacleY), obstacleWidth, obstacle.height
            );
          }
        });
      }
      
      // Draw coins
      if (assets.coinSheet) {
        coins.forEach(coin => {
          if (coin.collected) return;
          
          // 3 cols x 2 rows = 6 frames total
          const cols = 3;
          const rows = 2;
          const frameWidth = Math.floor(assets.coinSheet.width / cols);
          const frameHeight = Math.floor(assets.coinSheet.height / rows);
          
          // Calculate column and row index from current frame
          const clampedFrame = Math.min(Math.max(0, coinFrame), assetInfo.coinFrames - 1);
          const colIndex = clampedFrame % cols;
          const rowIndex = Math.floor(clampedFrame / cols);
          
          const sourceX = Math.floor(colIndex * frameWidth);
          const sourceY = Math.floor(rowIndex * frameHeight);
          
          ctx.drawImage(
            assets.coinSheet,
            sourceX, sourceY, frameWidth, frameHeight,
            Math.floor(coin.x), Math.floor(coin.y - coin.size / 2), coin.size, coin.size
          );
        });
      }
      
      // Draw player
      if (playerFlipAnimating && assets.playerFlipSheet) {
        // Draw flip animation
        const sheetWidth = assets.playerFlipSheet.width;
        const sheetHeight = assets.playerFlipSheet.height;
        const frameWidth = Math.floor(sheetWidth / assetInfo.playerFlipFrames);
        const frameHeight = sheetHeight;
        
        // Clamp frame index to valid range
        const clampedFrame = Math.min(Math.max(0, playerFlipFrame), assetInfo.playerFlipFrames - 1);
        const sourceX = Math.floor(clampedFrame * frameWidth);
        const sourceY = 0;
        
        ctx.save();
        if (gravity === -1) {
          // Flip vertically when gravity is up
          ctx.scale(1, -1);
          ctx.drawImage(
            assets.playerFlipSheet,
            sourceX, sourceY, frameWidth, frameHeight,
            Math.floor(player.x), Math.floor(-(player.y + PLAYER_SIZE)), PLAYER_SIZE, PLAYER_SIZE
          );
        } else {
          ctx.drawImage(
            assets.playerFlipSheet,
            sourceX, sourceY, frameWidth, frameHeight,
            Math.floor(player.x), Math.floor(player.y), PLAYER_SIZE, PLAYER_SIZE
          );
        }
        ctx.restore();
      } else if (assets.playerRunSheet) {
        // Draw run animation (3 cols x 2 rows sprite sheet)
        const cols = 3;
        const rows = 2;
        const sheetWidth = assets.playerRunSheet.width;
        const sheetHeight = assets.playerRunSheet.height;
        const frameWidth = Math.floor(sheetWidth / cols);
        const frameHeight = Math.floor(sheetHeight / rows);
        
        // Calculate column and row index from current frame
        const clampedFrame = Math.min(Math.max(0, playerRunFrame), assetInfo.playerRunFrames - 1);
        const colIndex = clampedFrame % cols;
        const rowIndex = Math.floor(clampedFrame / cols);
        
        const sourceX = Math.floor(colIndex * frameWidth);
        const sourceY = Math.floor(rowIndex * frameHeight);
        
        ctx.save();
        if (gravity === -1) {
          // Flip vertically when gravity is up
          ctx.scale(1, -1);
          ctx.drawImage(
            assets.playerRunSheet,
            sourceX, sourceY, frameWidth, frameHeight,
            Math.floor(player.x), Math.floor(-(player.y + PLAYER_SIZE)), PLAYER_SIZE, PLAYER_SIZE
          );
        } else {
          ctx.drawImage(
            assets.playerRunSheet,
            sourceX, sourceY, frameWidth, frameHeight,
            Math.floor(player.x), Math.floor(player.y), PLAYER_SIZE, PLAYER_SIZE
          );
        }
        ctx.restore();
      }
      
      // Draw UI score background
      if (assets.uiScoreBg) {
        const uiBgWidth = 200;
        const uiBgHeight = (assets.uiScoreBg.height / assets.uiScoreBg.width) * uiBgWidth;
        const sourceWidth = assets.uiScoreBg.width;
        const sourceHeight = assets.uiScoreBg.height;
        const scoreX = 20;
        const scoreY = 35;
        
        ctx.drawImage(
          assets.uiScoreBg,
          0, 0, sourceWidth, sourceHeight,  // Source: full image
          Math.floor(scoreX - 10), Math.floor(scoreY - 25), uiBgWidth, uiBgHeight  // Destination
        );
      }
      
      // Draw score and time text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'left';
      const scoreX = 20;
      const scoreY = 35;
      ctx.fillText(`점수: ${Math.floor(score)}`, scoreX, scoreY);
      
      // Draw time
      const minutes = Math.floor(gameTime / 60);
      const seconds = Math.floor(gameTime % 60);
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`시간: ${minutes}:${seconds.toString().padStart(2, '0')}`, scoreX, scoreY + 30);
      
      // Draw gravity indicator
      ctx.fillStyle = gravity === 1 ? '#3498db' : '#9b59b6';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(gravity === 1 ? '⬇️ 아래' : '⬆️ 위', canvas.width - 20, 35);
      
      // Draw game over overlay
      if (!gameActive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('게임 오버', canvas.width / 2, canvas.height / 2 - 60);
        
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`최종 점수: ${Math.floor(score)}점`, canvas.width / 2, canvas.height / 2);
        
        ctx.font = 'bold 24px Arial';
        ctx.fillText('다시 시작 여부를 확인하세요...', canvas.width / 2, canvas.height / 2 + 60);
      }
    },
    
    gameLoop: function() {
      this.update();
      this.render();
      animationId = requestAnimationFrame(() => this.gameLoop());
    },
    
    gameOver: function() {
      if (!gameActive) return;
      gameActive = false;
      
      const finalScore = Math.floor(score);
      
      if (callbacks.onGameOver) {
        callbacks.onGameOver({ 
          score: finalScore,
          time: gameTime
        });
      }
      
      setTimeout(() => {
        if (confirm(`게임 오버!\n\n최종 점수: ${finalScore}점\n\n다시 시작하시겠습니까?`)) {
          this.reset();
        }
      }, 500);
    },
    
    destroy: function() {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
      
      window.removeEventListener('resize', () => this.resizeCanvas());
      
      canvas = null;
      ctx = null;
      container = null;
      wrapper = null;
      callbacks = {};
      gameActive = false;
    },
    
    setMuted: function(muted) {
      // This game doesn't use sound
    }
  };
  
  // Export game
  if (typeof window !== 'undefined') {
    window.Game = Game;
  }
})();
