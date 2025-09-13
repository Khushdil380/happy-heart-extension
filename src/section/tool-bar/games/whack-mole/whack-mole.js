/**
 * WHACK-A-MOLE GAME
 * Time-based mole whacking game with difficulty levels
 */

export class WhackMoleGame {
  constructor(canvas, gameManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameManager = gameManager;
    this.isRunning = false;
    this.gameLoop = null;
    this.timerLoop = null;
    
    // Set fixed canvas dimensions
    this.canvas.width = 600;
    this.canvas.height = 500;
    
    this.holes = [];
    this.score = 0;
    this.timeLeft = 30;
    this.gameStarted = false;
    this.difficulty = null; // 'EASY', 'MEDIUM', 'HARD'
    this.gameOver = false;
    
    // Default settings
    this.moleSpawnRate = 0.02;
    this.moleLifeTime = 2000;
    
    // Difficulty settings
    this.difficultySettings = {
      EASY: {
        moleSpawnRate: 0.015,
        moleLifeTime: 3000,
        gameTime: 45,
        scoreMultiplier: 10
      },
      MEDIUM: {
        moleSpawnRate: 0.025,
        moleLifeTime: 2000,
        gameTime: 30,
        scoreMultiplier: 15
      },
      HARD: {
        moleSpawnRate: 0.035,
        moleLifeTime: 1500,
        gameTime: 20,
        scoreMultiplier: 20
      }
    };
    
    this.initializeHoles();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.gameStarted = false;
    this.draw();
  }

  stop() {
    this.isRunning = false;
    this.gameStarted = false;
    this.gameOver = false;
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    if (this.timerLoop) {
      clearInterval(this.timerLoop);
      this.timerLoop = null;
    }
  }

  togglePause() {
    if (!this.isRunning || !this.gameStarted) return;
    
    if (this.isPaused) {
      this.gameLoop = setInterval(() => this.update(), 1000 / 60);
      this.timerLoop = setInterval(() => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.gameOver = true;
          this.gameOverSequence();
        }
      }, 1000);
      this.isPaused = false;
    } else {
      clearInterval(this.gameLoop);
      clearInterval(this.timerLoop);
      this.isPaused = true;
    }
  }

  reset() {
    this.stop();
    this.score = 0;
    this.timeLeft = 30;
    this.difficulty = null;
    this.gameOver = false;
    this.holes.forEach(hole => hole.hasMole = false);
    this.gameManager.updateScore(0);
    this.draw();
  }

  selectDifficulty(level) {
    this.difficulty = level;
    const settings = this.difficultySettings[level];
    this.moleSpawnRate = settings.moleSpawnRate;
    this.moleLifeTime = settings.moleLifeTime;
    this.timeLeft = settings.gameTime;
    this.score = 0;
    this.gameStarted = true;
    this.gameOver = false;
    
    this.gameManager.updateScore(0);
    
    // Start game loops
    this.gameLoop = setInterval(() => this.update(), 1000 / 60);
    this.timerLoop = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.gameOver = true;
        this.gameOverSequence();
      }
    }, 1000);
    
    this.draw();
  }

  gameOverSequence() {
    this.stop();
    
    // Show game over for 3 seconds then reset
    setTimeout(() => {
      this.gameManager.updateHighScore(this.score);
      this.gameManager.onGameOver();
      this.reset();
    }, 3000);
  }

  handleKeyPress(e) {
    // Not used for this game
  }

  initializeHoles() {
    const cols = 3;
    const rows = 3;
    const holeSize = Math.min(100, this.canvas.width / 4);
    const spacing = 25;
    const startX = (this.canvas.width - (cols * holeSize + (cols - 1) * spacing)) / 2;
    const startY = (this.canvas.height - (rows * holeSize + (rows - 1) * spacing)) / 2;
    
    this.holes = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.holes.push({
          x: startX + col * (holeSize + spacing),
          y: startY + row * (holeSize + spacing),
          width: holeSize,
          height: holeSize,
          hasMole: false,
          moleStartTime: 0
        });
      }
    }
  }

  update() {
    if (this.isPaused || !this.gameStarted || this.gameOver) return;

    // Randomly spawn moles based on difficulty
    if (Math.random() < this.moleSpawnRate) {
      const emptyHoles = this.holes.filter(hole => !hole.hasMole);
      if (emptyHoles.length > 0) {
        const randomHole = emptyHoles[Math.floor(Math.random() * emptyHoles.length)];
        randomHole.hasMole = true;
        randomHole.moleStartTime = Date.now();
        
        // Mole disappears after random time
        setTimeout(() => {
          if (randomHole.hasMole) {
            randomHole.hasMole = false;
          }
        }, this.moleLifeTime + Math.random() * 1000);
      }
    }

    // Remove moles that have been out too long
    this.holes.forEach(hole => {
      if (hole.hasMole && Date.now() - hole.moleStartTime > this.moleLifeTime + 1000) {
        hole.hasMole = false;
      }
    });

    this.draw();
  }

  draw() {
    // Clear canvas with grass background
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grass texture
    this.drawGrassTexture();

    // Draw holes
    this.holes.forEach(hole => {
      this.drawHole(hole);
      
      // Draw mole if present
      if (hole.hasMole) {
        this.drawMole(hole);
      }
    });

    // Draw UI
    this.drawUI();

    // Draw game state overlays
    if (!this.gameStarted) {
      this.drawDifficultySelection();
    } else if (this.gameOver) {
      this.drawGameOverScreen();
    } else {
      // Add click handlers only during gameplay
      this.setupClickHandlers();
    }
  }

  drawDifficultySelection() {
    // Draw overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Whack-a-Mole', this.canvas.width / 2, 120);
    
    // Subtitle
    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillText('Choose Difficulty Level', this.canvas.width / 2, 160);

    // Difficulty buttons
    const buttonWidth = 150;
    const buttonHeight = 60;
    const buttonY = 220;
    const spacing = 30;

    // Easy button
    const easyX = this.canvas.width / 2 - buttonWidth - spacing;
    this.drawDifficultyButton(easyX, buttonY, buttonWidth, buttonHeight, 'EASY', '#4CAF50', '45s • Slow');

    // Medium button
    const mediumX = this.canvas.width / 2 - buttonWidth / 2;
    this.drawDifficultyButton(mediumX, buttonY, buttonWidth, buttonHeight, 'MEDIUM', '#FF9800', '30s • Normal');

    // Hard button
    const hardX = this.canvas.width / 2 + spacing;
    this.drawDifficultyButton(hardX, buttonY, buttonWidth, buttonHeight, 'HARD', '#F44336', '20s • Fast');

    // Instructions
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Click on moles to whack them!', this.canvas.width / 2, 350);

    // Setup click handlers for difficulty selection
    this.canvas.onclick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check Easy button
      if (x >= easyX && x <= easyX + buttonWidth && 
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.selectDifficulty('EASY');
        return;
      }

      // Check Medium button
      if (x >= mediumX && x <= mediumX + buttonWidth && 
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.selectDifficulty('MEDIUM');
        return;
      }

      // Check Hard button
      if (x >= hardX && x <= hardX + buttonWidth && 
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.selectDifficulty('HARD');
        return;
      }
    };
  }

  drawDifficultyButton(x, y, width, height, text, color, subtitle) {
    // Button background
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);

    // Button border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Button text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + width / 2, y + height / 2 - 8);

    // Subtitle
    this.ctx.font = '12px Arial';
    this.ctx.fillText(subtitle, x + width / 2, y + height / 2 + 12);
  }

  drawGrassTexture() {
    this.ctx.fillStyle = '#228B22';
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      this.ctx.fillRect(x, y, 2, 8);
    }
  }

  drawHole(hole) {
    // Hole shadow
    this.ctx.fillStyle = '#654321';
    this.ctx.fillRect(hole.x + 3, hole.y + 3, hole.width, hole.height);
    
    // Hole
    this.ctx.fillStyle = '#2F1B14';
    this.ctx.fillRect(hole.x, hole.y, hole.width, hole.height);
    
    // Hole border
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(hole.x, hole.y, hole.width, hole.height);
    
    // Hole rim
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(hole.x - 2, hole.y - 2, hole.width + 4, hole.height + 4);
  }

  drawMole(hole) {
    const moleSize = hole.width * 0.8;
    const moleX = hole.x + (hole.width - moleSize) / 2;
    const moleY = hole.y + (hole.height - moleSize) / 2;
    
    // Mole body
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(moleX, moleY, moleSize, moleSize);
    
    // Mole head
    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(moleX + moleSize * 0.1, moleY + moleSize * 0.1, moleSize * 0.8, moleSize * 0.6);
    
    // Mole eyes
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(moleX + moleSize * 0.2, moleY + moleSize * 0.2, moleSize * 0.1, moleSize * 0.1);
    this.ctx.fillRect(moleX + moleSize * 0.7, moleY + moleSize * 0.2, moleSize * 0.1, moleSize * 0.1);
    
    // Mole nose
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(moleX + moleSize * 0.4, moleY + moleSize * 0.35, moleSize * 0.2, moleSize * 0.1);
    
    // Mole smile
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(moleX + moleSize * 0.5, moleY + moleSize * 0.5, moleSize * 0.15, 0, Math.PI);
    this.ctx.stroke();
  }

  drawUI() {
    if (!this.gameStarted) return;
    
    // Score and time background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, 70);
    
    // Difficulty indicator
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Difficulty: ${this.difficulty}`, 20, 25);
    
    // Score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 20, 50);
    
    // Time
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Time: ${this.timeLeft}`, this.canvas.width - 20, 50);
    
    // Progress bar for time
    const maxTime = this.difficultySettings[this.difficulty].gameTime;
    const progressWidth = (this.timeLeft / maxTime) * (this.canvas.width - 40);
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.fillRect(20, 55, this.canvas.width - 40, 8);
    this.ctx.fillStyle = '#05ffee';
    this.ctx.fillRect(20, 55, progressWidth, 8);
  }

  drawGameOverScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`Difficulty: ${this.difficulty}`, this.canvas.width / 2, this.canvas.height / 2 + 30);
    
    this.ctx.font = '14px Arial';
    this.ctx.fillText('Starting new game...', this.canvas.width / 2, this.canvas.height / 2 + 60);
  }

  setupClickHandlers() {
    this.canvas.onclick = (e) => {
      if (!this.gameStarted || this.gameOver) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.holes.forEach(hole => {
        if (x >= hole.x && x <= hole.x + hole.width && 
            y >= hole.y && y <= hole.y + hole.height && hole.hasMole) {
          hole.hasMole = false;
          const settings = this.difficultySettings[this.difficulty];
          this.score += settings.scoreMultiplier;
          this.gameManager.updateScore(this.score);
          
          // Visual feedback
          this.drawHitEffect(hole);
        }
      });
    };
  }

  drawHitEffect(hole) {
    // Flash effect
    this.ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
    this.ctx.fillRect(hole.x, hole.y, hole.width, hole.height);
    
    setTimeout(() => {
      this.draw();
    }, 100);
  }
}