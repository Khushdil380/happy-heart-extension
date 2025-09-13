/**
 * TIC-TAC-TOE GAME
 * Classic tic-tac-toe game with AI opponent and friend mode
 */

export class TicTacToeGame {
  constructor(canvas, gameManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameManager = gameManager;
    this.isRunning = false;
    
    // Set fixed canvas dimensions
    this.canvas.width = 600;
    this.canvas.height = 500;
    
    this.board = Array(9).fill('');
    this.currentPlayer = 'X';
    this.gameMode = null; // 'AI' or 'FRIEND'
    this.gameOver = false;
    this.wins = { X: 0, O: 0 };
    this.gameStarted = false;
    
    this.draw();
  }

  start() {
    this.isRunning = true;
    this.gameStarted = false;
    this.gameMode = null;
    this.reset();
  }

  stop() {
    this.isRunning = false;
    this.gameStarted = false;
  }

  togglePause() {
    // Not applicable for turn-based game
  }

  reset() {
    this.board = Array(9).fill('');
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.draw();
  }

  handleKeyPress(e) {
    // Not used for this game
  }

  selectGameMode(mode) {
    this.gameMode = mode;
    this.gameStarted = true;
    this.draw();
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000814';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameStarted) {
      this.drawStartScreen();
      return;
    }

    // Calculate grid dimensions to fit nicely in 600x500 canvas
    const margin = 50;
    const gridSize = Math.min(this.canvas.width - margin * 2, this.canvas.height - margin * 2);
    const startX = (this.canvas.width - gridSize) / 2;
    const startY = (this.canvas.height - gridSize) / 2;
    const cellSize = gridSize / 3;
    const lineWidth = 4;

    // Draw grid
    this.ctx.strokeStyle = '#05ffee';
    this.ctx.lineWidth = lineWidth;

    // Vertical lines
    this.ctx.beginPath();
    this.ctx.moveTo(startX + cellSize, startY);
    this.ctx.lineTo(startX + cellSize, startY + gridSize);
    this.ctx.moveTo(startX + cellSize * 2, startY);
    this.ctx.lineTo(startX + cellSize * 2, startY + gridSize);
    this.ctx.stroke();

    // Horizontal lines
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY + cellSize);
    this.ctx.lineTo(startX + gridSize, startY + cellSize);
    this.ctx.moveTo(startX, startY + cellSize * 2);
    this.ctx.lineTo(startX + gridSize, startY + cellSize * 2);
    this.ctx.stroke();

    // Draw X's and O's
    this.ctx.font = `bold ${cellSize * 0.6}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.board.forEach((cell, index) => {
      if (cell) {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = startX + col * cellSize + cellSize / 2;
        const y = startY + row * cellSize + cellSize / 2;

        if (cell === 'X') {
          this.ctx.fillStyle = '#dc143c';
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 4;
          
          // Draw X
          this.ctx.beginPath();
          this.ctx.moveTo(x - cellSize * 0.25, y - cellSize * 0.25);
          this.ctx.lineTo(x + cellSize * 0.25, y + cellSize * 0.25);
          this.ctx.moveTo(x + cellSize * 0.25, y - cellSize * 0.25);
          this.ctx.lineTo(x - cellSize * 0.25, y + cellSize * 0.25);
          this.ctx.stroke();
        } else {
          this.ctx.fillStyle = 'transparent';
          this.ctx.strokeStyle = '#05ffee';
          this.ctx.lineWidth = 4;
          
          // Draw O
          this.ctx.beginPath();
          this.ctx.arc(x, y, cellSize * 0.25, 0, 2 * Math.PI);
          this.ctx.stroke();
        }
      }
    });

    // Highlight winning line
    const winningLine = this.getWinningLine();
    if (winningLine) {
      this.highlightWinningLine(winningLine, startX, startY, cellSize);
    }

    // Draw current player info
    this.drawGameInfo(startX, startY, gridSize);

    // Add click handlers
    this.setupClickHandlers(startX, startY, cellSize);
  }

  drawStartScreen() {
    // Draw title
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Tic-Tac-Toe', this.canvas.width / 2, 120);

    // Draw subtitle
    this.ctx.fillStyle = '#05ffee';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Choose Game Mode', this.canvas.width / 2, 170);

    // Draw mode buttons
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonY = 250;
    const spacing = 50;

    // VS AI button
    const aiButtonX = this.canvas.width / 2 - buttonWidth - spacing / 2;
    this.drawButton(aiButtonX, buttonY, buttonWidth, buttonHeight, 'VS AI', '#dc143c');

    // VS Friend button
    const friendButtonX = this.canvas.width / 2 + spacing / 2;
    this.drawButton(friendButtonX, buttonY, buttonWidth, buttonHeight, 'VS Friend', '#05ffee');

    // Setup click handlers for mode selection
    this.canvas.onclick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check VS AI button
      if (x >= aiButtonX && x <= aiButtonX + buttonWidth && 
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.selectGameMode('AI');
        return;
      }

      // Check VS Friend button
      if (x >= friendButtonX && x <= friendButtonX + buttonWidth && 
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.selectGameMode('FRIEND');
        return;
      }
    };
  }

  drawButton(x, y, width, height, text, color) {
    // Button background
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);

    // Button border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Button text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + width / 2, y + height / 2);
  }

  drawGameInfo(startX, startY, gridSize) {
    // Only show win count, no game mode or current player during play
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    
    const infoY = startY + gridSize + 30;
    
    // Win count only
    this.ctx.fillText(`X Wins: ${this.wins.X} | O Wins: ${this.wins.O}`, this.canvas.width / 2, infoY);
  }

  setupClickHandlers(startX, startY, cellSize) {
    this.canvas.onclick = (e) => {
      if (this.gameOver || !this.isRunning || !this.gameStarted) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if click is within grid
      if (x < startX || x > startX + cellSize * 3 || 
          y < startY || y > startY + cellSize * 3) {
        return;
      }
      
      const col = Math.floor((x - startX) / cellSize);
      const row = Math.floor((y - startY) / cellSize);
      const index = row * 3 + col;
      
      if (this.board[index] === '') {
        this.makeMove(index);
      }
    };
  }

  makeMove(index) {
    this.board[index] = this.currentPlayer;
    
    // Redraw to show the move before checking win/draw
    this.draw();
    
    // Check win after a short delay to show the move
    setTimeout(() => {
      if (this.checkWin()) {
        this.gameOver = true;
        this.wins[this.currentPlayer]++;
        this.gameManager.onGameOver();
        return;
      }
      
      if (this.checkDraw()) {
        this.gameOver = true;
        this.gameManager.onGameOver();
        return;
      }
      
      // Continue to next player if no win/draw
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      
      // AI move for AI mode
      if (this.gameMode === 'AI' && this.currentPlayer === 'O' && !this.gameOver) {
        setTimeout(() => {
          this.makeAIMove();
        }, 300);
      }
    }, 100);
  }

  makeAIMove() {
    // Simple AI: try to win, then block, then random
    let move = this.findWinningMove('O');
    if (move === -1) {
      move = this.findWinningMove('X'); // Block player
    }
    if (move === -1) {
      move = this.findRandomMove();
    }
    
    if (move !== -1) {
      this.board[move] = this.currentPlayer;
      
      // Redraw to show the AI move before checking win/draw
      this.draw();
      
      // Check win after a short delay to show the move
      setTimeout(() => {
        if (this.checkWin()) {
          this.gameOver = true;
          this.wins[this.currentPlayer]++;
          this.gameManager.onGameOver();
          return;
        }
        
        if (this.checkDraw()) {
          this.gameOver = true;
          this.gameManager.onGameOver();
          return;
        }
        
        // Switch to player turn
        this.currentPlayer = 'X';
      }, 100);
    }
  }

  findWinningMove(player) {
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === '') {
        this.board[i] = player;
        if (this.checkWin()) {
          this.board[i] = ''; // Reset
          return i;
        }
        this.board[i] = ''; // Reset
      }
    }
    return -1;
  }

  findRandomMove() {
    const emptyCells = [];
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === '') {
        emptyCells.push(i);
      }
    }
    return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
  }

  checkWin() {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    return winPatterns.some(pattern => {
      const [a, b, c] = pattern;
      return this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c];
    });
  }

  getWinningLine() {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return pattern;
      }
    }
    return null;
  }

  highlightWinningLine(winningLine, startX, startY, cellSize) {
    this.ctx.strokeStyle = '#ff6b6b';
    this.ctx.lineWidth = 6;
    
    // Determine if it's a row, column, or diagonal
    if (winningLine[0] < 3 && winningLine[1] < 3 && winningLine[2] < 3) {
      // Row
      const row = Math.floor(winningLine[0] / 3);
      const y = startY + row * cellSize + cellSize / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(startX + 10, y);
      this.ctx.lineTo(startX + cellSize * 3 - 10, y);
      this.ctx.stroke();
    } else if (winningLine[0] % 3 === winningLine[1] % 3 && winningLine[1] % 3 === winningLine[2] % 3) {
      // Column
      const col = winningLine[0] % 3;
      const x = startX + col * cellSize + cellSize / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, startY + 10);
      this.ctx.lineTo(x, startY + cellSize * 3 - 10);
      this.ctx.stroke();
    } else {
      // Diagonal
      if (winningLine[0] === 0 && winningLine[2] === 8) {
        // Main diagonal
        this.ctx.beginPath();
        this.ctx.moveTo(startX + 10, startY + 10);
        this.ctx.lineTo(startX + cellSize * 3 - 10, startY + cellSize * 3 - 10);
        this.ctx.stroke();
      } else {
        // Anti-diagonal
        this.ctx.beginPath();
        this.ctx.moveTo(startX + cellSize * 3 - 10, startY + 10);
        this.ctx.lineTo(startX + 10, startY + cellSize * 3 - 10);
        this.ctx.stroke();
      }
    }
  }

  checkDraw() {
    return this.board.every(cell => cell !== '');
  }
}