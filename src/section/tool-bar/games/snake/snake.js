/**
 * SNAKE GAME
 * Classic snake game with arrow key controls
 */

export class SnakeGame {
  constructor(canvas, gameManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameManager = gameManager;
    this.isRunning = false;
    this.isPaused = false;
    this.gameLoop = null;
    
    // Set fixed canvas dimensions for consistent gameplay
    this.gridSize = 20;
    this.canvas.width = 600;  // Fixed width
    this.canvas.height = 500; // Fixed height
    
    // Calculate tile count based on both dimensions
    this.tileCountX = Math.floor(this.canvas.width / this.gridSize);
    this.tileCountY = Math.floor(this.canvas.height / this.gridSize);
    
    
    this.snake = [{ x: Math.floor(this.tileCountX / 2), y: Math.floor(this.tileCountY / 2) }];
    this.food = {};
    this.dx = 0;
    this.dy = 0;
    this.score = 0;
    this.generatingFood = false; // Flag to prevent concurrent food generation
    
    this.generateFood();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.gameStarted = false; // Flag to track if player has made first move
    this.gameLoop = setInterval(() => {
      if (this.gameStarted) {
        this.update();
      }
    }, 150);
    this.draw();
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
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
      this.gameLoop = setInterval(() => this.update(), 150);
    }
  }

  reset() {
    this.stop();
    this.snake = [{ x: Math.floor(this.tileCountX / 2), y: Math.floor(this.tileCountY / 2) }];
    this.dx = 0;
    this.dy = 0;
    this.score = 0;
    this.gameStarted = false;
    this.generatingFood = false; // Reset the flag
    this.generateFood();
    this.draw();
    this.gameManager.updateScore(0);
  }

  handleKeyPress(e) {
    if (!this.isRunning || this.isPaused) return;

    switch(e.key) {
      case 'ArrowUp':
        if (this.dy !== 1) {
          this.dx = 0;
          this.dy = -1;
          this.gameStarted = true; // Start moving on first key press
        }
        break;
      case 'ArrowDown':
        if (this.dy !== -1) {
          this.dx = 0;
          this.dy = 1;
          this.gameStarted = true; // Start moving on first key press
        }
        break;
      case 'ArrowLeft':
        if (this.dx !== 1) {
          this.dx = -1;
          this.dy = 0;
          this.gameStarted = true; // Start moving on first key press
        }
        break;
      case 'ArrowRight':
        if (this.dx !== -1) {
          this.dx = 1;
          this.dy = 0;
          this.gameStarted = true; // Start moving on first key press
        }
        break;
    }
    e.preventDefault();
  }

  update() {
    if (this.isPaused) return;

    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

    // Check wall collision
    if (head.x < 0 || head.x >= this.tileCountX || head.y < 0 || head.y >= this.tileCountY) {
      this.gameOver();
      return;
    }

    // Check self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver();
      return;
    }

    // Add new head
    this.snake.unshift(head);

    // Check food collision
    if (this.food && head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.gameManager.updateScore(this.score);
      this.generateFood();
      // Don't pop - snake grows when eating food
    } else {
      // Remove tail - snake doesn't grow when not eating
      this.snake.pop();
    }

    // Debug: Log snake state after update

    this.draw();
  }

  generateFood(recursionCount = 0) {
    // Prevent concurrent food generation
    if (this.generatingFood) {
      return;
    }
    
    this.generatingFood = true;
    
    
    // Validate snake array integrity
    if (this.snake.length === 0) {
      this.snake = [{ x: Math.floor(this.tileCountX / 2), y: Math.floor(this.tileCountY / 2) }];
    }
    
    // Prevent infinite recursion
    if (recursionCount > 10) {
      this.generatingFood = false;
      this.gameOver();
      return;
    }
    
    // Get all available positions (not occupied by snake)
    const availablePositions = [];
    
    for (let x = 0; x < this.tileCountX; x++) {
      for (let y = 0; y < this.tileCountY; y++) {
        const isOccupied = this.snake.some(segment => segment.x === x && segment.y === y);
        if (!isOccupied) {
          availablePositions.push({ x, y });
        }
      }
    }
    
    
    // If no positions available, game over (snake filled the board)
    if (availablePositions.length === 0) {
      this.generatingFood = false;
      this.gameOver();
      return;
    }
    
    // Pick a random available position
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const selectedPosition = availablePositions[randomIndex];
    
    // Create a new food object to avoid reference issues
    this.food = {
      x: selectedPosition.x,
      y: selectedPosition.y
    };
    
    
    // Verify the food is not on snake
    const foodOnSnake = this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
    if (foodOnSnake) {
      this.generateFood(recursionCount + 1); // Recursive call to regenerate
      return;
    }
    this.generatingFood = false; // Reset the flag
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000814';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid lines (subtle)
    this.ctx.strokeStyle = '#1c1d1d';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= this.tileCountX; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.gridSize, 0);
      this.ctx.lineTo(i * this.gridSize, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i <= this.tileCountY; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.gridSize);
      this.ctx.lineTo(this.canvas.width, i * this.gridSize);
      this.ctx.stroke();
    }

    // Draw snake
    this.snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        this.ctx.fillStyle = '#dc143c';
        this.ctx.fillRect(segment.x * this.gridSize + 2, segment.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4);
        
        // Eyes
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(segment.x * this.gridSize + 6, segment.y * this.gridSize + 6, 3, 3);
        this.ctx.fillRect(segment.x * this.gridSize + 11, segment.y * this.gridSize + 6, 3, 3);
      } else {
        // Body
        this.ctx.fillStyle = '#05ffee';
        this.ctx.fillRect(segment.x * this.gridSize + 1, segment.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
      }
    });

    // Draw food first (before any overlays)
    if (this.food && typeof this.food.x === 'number' && typeof this.food.y === 'number') {
      this.ctx.fillStyle = '#ff6b6b';
      this.ctx.fillRect(this.food.x * this.gridSize + 3, this.food.y * this.gridSize + 3, this.gridSize - 6, this.gridSize - 6);
      
      // Food highlight
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(this.food.x * this.gridSize + 6, this.food.y * this.gridSize + 6, 4, 4);
    } else {
      // If food is invalid, regenerate it
      this.generateFood();
    }

    // Show start instruction if game hasn't started yet
    if (this.isRunning && !this.gameStarted) {
      // Draw semi-transparent overlay but leave food visible
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Redraw food on top of overlay to ensure it's visible
      if (this.food && typeof this.food.x === 'number' && typeof this.food.y === 'number') {
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(this.food.x * this.gridSize + 3, this.food.y * this.gridSize + 3, this.gridSize - 6, this.gridSize - 6);
        
        // Food highlight
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.food.x * this.gridSize + 6, this.food.y * this.gridSize + 6, 4, 4);
      }
      
      // Draw instruction text
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Press Arrow Keys to Start', this.canvas.width / 2, this.canvas.height / 2);
    }
  }

  gameOver() {
    this.stop();
    this.gameManager.updateHighScore(this.score);
    this.gameManager.onGameOver();
    // Remove alert - let the UI handle game over state
  }
}
