/**
 * FLAPPY BIRD GAME
 * Flappy bird game with smooth movement and difficulty levels
 */

export class FlappyBirdGame {
  constructor(canvas, gameManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameManager = gameManager;
    this.isRunning = false;
    this.isPaused = false;
    this.gameLoop = null;
    
    // Set fixed canvas dimensions
    this.canvas.width = 600;
    this.canvas.height = 500;
    
    this.bird = {
      x: 80,
      y: canvas.height / 2,
      width: 25,
      height: 25,
      velocity: 0,
      gravity: 0.15,
      jump: -3.5,
      maxVelocity: 4,
      rotation: 0
    };
    
    this.pipes = [];
    this.pipeWidth = 60;
    this.pipeGap = 150;
    this.pipeSpeed = 2;
    this.score = 0;
    
    this.gameStarted = false;
    this.difficulty = null; // 'EASY', 'MEDIUM', 'HARD'
    this.backgroundOffset = 0;
    this.gameOver = false;
    
    // Difficulty settings
    this.difficultySettings = {
      EASY: {
        gravity: 0.12,
        jump: -2.8,
        pipeSpeed: 1.5,
        pipeGap: 180,
        pipeWidth: 50
      },
      MEDIUM: {
        gravity: 0.15,
        jump: -3.5,
        pipeSpeed: 2,
        pipeGap: 150,
        pipeWidth: 60
      },
      HARD: {
        gravity: 0.18,
        jump: -4.2,
        pipeSpeed: 2.5,
        pipeGap: 120,
        pipeWidth: 70
      }
    };
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.gameLoop = setInterval(() => this.update(), 1000 / 60);
    this.draw();
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.gameStarted = false;
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  togglePause() {
    if (!this.isRunning) return;
    
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      clearInterval(this.gameLoop);
    } else {
      this.gameLoop = setInterval(() => this.update(), 1000 / 60);
    }
  }

  reset() {
    this.stop();
    this.bird.y = this.canvas.height / 2;
    this.bird.velocity = 0;
    this.bird.rotation = 0;
    this.pipes = [];
    this.score = 0;
    this.gameStarted = false;
    this.difficulty = null;
    this.backgroundOffset = 0;
    this.gameOver = false;
    this.gameManager.updateScore(0);
    this.draw();
  }

  selectDifficulty(level) {
    this.difficulty = level;
    const settings = this.difficultySettings[level];
    this.bird.gravity = settings.gravity;
    this.bird.jump = settings.jump;
    this.pipeSpeed = settings.pipeSpeed;
    this.pipeGap = settings.pipeGap;
    this.pipeWidth = settings.pipeWidth;
    this.gameStarted = true;
    this.draw();
  }

  handleKeyPress(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.jump();
    }
  }

  jump() {
    if (!this.gameStarted || this.gameOver) return;
    
    this.bird.velocity = this.bird.jump;
    this.bird.rotation = -10; // Gentle tilt up when jumping
  }

  update() {
    if (this.isPaused || !this.gameStarted || this.gameOver) return;

    // Smooth bird physics with better interpolation
    this.bird.velocity += this.bird.gravity;
    this.bird.velocity = Math.min(this.bird.velocity, this.bird.maxVelocity);
    this.bird.y += this.bird.velocity;
    
    // Smoother rotation based on velocity (less extreme)
    this.bird.rotation = Math.max(-10, Math.min(45, this.bird.velocity * 6));

    // Update background
    this.backgroundOffset += 0.5;

    // Generate pipes
    if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - 200) {
      const minHeight = 50;
      const maxHeight = this.canvas.height - this.pipeGap - minHeight;
      const pipeHeight = Math.random() * (maxHeight - minHeight) + minHeight;
      this.pipes.push({
        x: this.canvas.width,
        topHeight: pipeHeight,
        bottomY: pipeHeight + this.pipeGap,
        scored: false
      });
    }

    // Update pipes
    this.pipes = this.pipes.filter(pipe => {
      pipe.x -= this.pipeSpeed;
      
      // Check collision
      if (this.checkCollision(pipe)) {
        this.gameOver = true;
        this.gameOverSequence();
        return false;
      }
      
      // Check score
      if (pipe.x + this.pipeWidth < this.bird.x && !pipe.scored) {
        this.score++;
        this.gameManager.updateScore(this.score);
        pipe.scored = true;
      }
      
      return pipe.x > -this.pipeWidth;
    });

    // Check ground/ceiling collision
    if (this.bird.y + this.bird.height > this.canvas.height - 20 || this.bird.y < 0) {
      this.gameOver = true;
      this.gameOverSequence();
    }

    this.draw();
  }

  gameOverSequence() {
    // Stop the game loop
    this.stop();
    
    // Show game over for 2 seconds then reset
    setTimeout(() => {
      this.gameManager.updateHighScore(this.score);
      this.gameManager.onGameOver();
      this.reset();
    }, 2000);
  }

  checkCollision(pipe) {
    const birdLeft = this.bird.x + 5; // Add some padding
    const birdRight = this.bird.x + this.bird.width - 5;
    const birdTop = this.bird.y + 5;
    const birdBottom = this.bird.y + this.bird.height - 5;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + this.pipeWidth;

    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
        return true;
      }
    }

    return false;
  }

  draw() {
    // Clear canvas with sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98D8E8');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw scrolling background
    this.drawBackground();

    // Draw pipes
    this.ctx.fillStyle = '#228B22';
    this.pipes.forEach(pipe => {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
      // Bottom pipe
      this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY);
      
      // Pipe borders
      this.ctx.strokeStyle = '#1a6b1a';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
      this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY);
      
      // Pipe caps
      this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, this.pipeWidth + 10, 20);
      this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 20);
    });

    // Draw ground
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.canvas.height - 20, this.canvas.width, 20);

    // Draw bird
    this.drawBird();

    // Draw score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3;
    this.ctx.strokeText(this.score.toString(), this.canvas.width / 2, 60);
    this.ctx.fillText(this.score.toString(), this.canvas.width / 2, 60);

    // Draw game state overlays
    if (!this.gameStarted) {
      this.drawDifficultySelection();
    } else if (this.gameOver) {
      this.drawGameOverScreen();
    } else if (this.isPaused) {
      this.drawPauseScreen();
    }
  }

  drawDifficultySelection() {
    // Draw overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Flappy Bird', this.canvas.width / 2, 120);
    
    // Subtitle
    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText('Choose Difficulty Level', this.canvas.width / 2, 160);

    // Difficulty buttons
    const buttonWidth = 150;
    const buttonHeight = 50;
    const buttonY = 220;
    const spacing = 30;

    // Easy button
    const easyX = this.canvas.width / 2 - buttonWidth - spacing;
    this.drawDifficultyButton(easyX, buttonY, buttonWidth, buttonHeight, 'EASY', '#4CAF50');

    // Medium button
    const mediumX = this.canvas.width / 2 - buttonWidth / 2;
    this.drawDifficultyButton(mediumX, buttonY, buttonWidth, buttonHeight, 'MEDIUM', '#FF9800');

    // Hard button
    const hardX = this.canvas.width / 2 + spacing;
    this.drawDifficultyButton(hardX, buttonY, buttonWidth, buttonHeight, 'HARD', '#F44336');

    // Instructions
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Press SPACE to flap after selecting difficulty', this.canvas.width / 2, 320);

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

  drawDifficultyButton(x, y, width, height, text, color) {
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
    this.ctx.fillText(text, x + width / 2, y + height / 2);
  }

  drawBackground() {
    // Simple cloud background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const cloudSize = 25;
    for (let i = 0; i < 6; i++) {
      const x = (i * 120 - this.backgroundOffset) % (this.canvas.width + 100);
      const y = 60 + Math.sin(i * 0.5) * 15;
      
      // Draw simple cloud
      this.ctx.beginPath();
      this.ctx.arc(x, y, cloudSize, 0, Math.PI * 2);
      this.ctx.arc(x + 20, y, cloudSize + 3, 0, Math.PI * 2);
      this.ctx.arc(x + 40, y, cloudSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawBird() {
    const { x, y, width, height, rotation } = this.bird;
    
    // Save context for rotation
    this.ctx.save();
    this.ctx.translate(x + width / 2, y + height / 2);
    this.ctx.rotate(rotation * Math.PI / 180);
    
    // Bird body
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillRect(-width / 2, -height / 2, width, height);
    
    // Bird wing (animated)
    this.ctx.fillStyle = '#FFA500';
    const wingOffset = Math.sin(Date.now() * 0.015) * 3;
    this.ctx.fillRect(-width / 2 + 3, -height / 2 + 3 + wingOffset, width - 6, height / 2);
    
    // Bird eye
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(width / 2 - 8, -height / 2 + 6, 4, 4);
    
    // Bird beak
    this.ctx.fillStyle = '#FF4500';
    this.ctx.fillRect(width / 2 - 2, -2, 6, 4);
    
    // Restore context
    this.ctx.restore();
  }

  drawGameOverScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Starting new game...', this.canvas.width / 2, this.canvas.height / 2 + 60);
  }

  drawPauseScreen() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Press SPACE to resume', this.canvas.width / 2, this.canvas.height / 2 + 40);
  }
}