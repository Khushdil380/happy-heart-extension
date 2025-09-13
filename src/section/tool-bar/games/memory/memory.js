/**
 * MEMORY GAME
 * Card matching memory game
 */

export class MemoryGame {
  constructor(canvas, gameManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gameManager = gameManager;
    this.isRunning = false;
    
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.score = 0;
    this.moves = 0;
    this.cols = 4;
    this.rows = 4;
    
    this.initializeCards();
    this.draw();
  }

  start() {
    this.isRunning = true;
    this.reset();
  }

  stop() {
    this.isRunning = false;
  }

  togglePause() {
    // Not applicable for this game
  }

  reset() {
    this.initializeCards();
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.score = 0;
    this.moves = 0;
    this.gameManager.updateScore(0);
    this.draw();
  }

  handleKeyPress(e) {
    // Not used for this game
  }

  initializeCards() {
    const symbols = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺'];
    this.cards = [];
    
    // Create pairs
    symbols.forEach(symbol => {
      this.cards.push({ symbol, matched: false, flipped: false });
      this.cards.push({ symbol, matched: false, flipped: false });
    });
    
    // Shuffle cards
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000814';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const cardWidth = this.canvas.width / this.cols;
    const cardHeight = this.canvas.height / this.rows;

    this.cards.forEach((card, index) => {
      const col = index % this.cols;
      const row = Math.floor(index / this.cols);
      const x = col * cardWidth;
      const y = row * cardHeight;

      this.drawCard(card, x, y, cardWidth, cardHeight);
    });

    // Add click handlers
    this.setupClickHandlers(cardWidth, cardHeight);
  }

  drawCard(card, x, y, cardWidth, cardHeight) {
    // Card background
    if (card.matched) {
      this.ctx.fillStyle = '#1c1d1d';
    } else if (card.flipped) {
      this.ctx.fillStyle = '#dc143c';
    } else {
      this.ctx.fillStyle = '#05ffee';
    }

    // Draw card with rounded corners effect
    this.ctx.fillRect(x + 2, y + 2, cardWidth - 4, cardHeight - 4);

    // Card border
    this.ctx.strokeStyle = card.matched ? '#05ffee' : '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x + 2, y + 2, cardWidth - 4, cardHeight - 4);

    // Card content
    if (card.flipped || card.matched) {
      // Draw symbol
      this.ctx.font = `${Math.min(cardWidth, cardHeight) * 0.4}px Arial`;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(card.symbol, x + cardWidth / 2, y + cardHeight / 2);
      
      // Add glow effect for matched cards
      if (card.matched) {
        this.ctx.shadowColor = '#05ffee';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(card.symbol, x + cardWidth / 2, y + cardHeight / 2);
        this.ctx.shadowBlur = 0;
      }
    } else {
      // Draw question mark
      this.ctx.font = `${Math.min(cardWidth, cardHeight) * 0.3}px Arial`;
      this.ctx.fillStyle = '#000814';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('?', x + cardWidth / 2, y + cardHeight / 2);
    }

    // Add hover effect
    if (!card.flipped && !card.matched) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.fillRect(x + 2, y + 2, cardWidth - 4, cardHeight - 4);
    }
  }

  setupClickHandlers(cardWidth, cardHeight) {
    this.canvas.onclick = (e) => {
      if (this.flippedCards.length >= 2 || !this.isRunning) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const col = Math.floor(x / cardWidth);
      const row = Math.floor(y / cardHeight);
      const index = row * this.cols + col;
      
      if (index >= 0 && index < this.cards.length && !this.cards[index].flipped && !this.cards[index].matched) {
        this.flipCard(index);
      }
    };
  }

  flipCard(index) {
    const card = this.cards[index];
    card.flipped = true;
    this.flippedCards.push(index);
    this.moves++;
    this.gameManager.updateScore(this.moves);

    if (this.flippedCards.length === 2) {
      setTimeout(() => {
        this.checkMatch();
      }, 1000);
    }

    this.draw();
  }

  checkMatch() {
    const [index1, index2] = this.flippedCards;
    const card1 = this.cards[index1];
    const card2 = this.cards[index2];

    if (card1.symbol === card2.symbol) {
      // Match found
      card1.matched = true;
      card2.matched = true;
      this.matchedPairs++;
      
      // Add visual feedback
      this.drawMatchEffect(index1, index2);
      
      if (this.matchedPairs === 8) {
        setTimeout(() => {
          this.gameManager.updateHighScore(this.moves);
          this.gameManager.onGameOver();
        }, 500);
      }
    } else {
      // No match
      card1.flipped = false;
      card2.flipped = false;
    }

    this.flippedCards = [];
    this.draw();
  }

  drawMatchEffect(index1, index2) {
    // Flash effect for matched cards
    this.ctx.fillStyle = 'rgba(5, 255, 238, 0.5)';
    const cardWidth = this.canvas.width / this.cols;
    const cardHeight = this.canvas.height / this.rows;
    
    const col1 = index1 % this.cols;
    const row1 = Math.floor(index1 / this.cols);
    const x1 = col1 * cardWidth;
    const y1 = row1 * cardHeight;
    
    const col2 = index2 % this.cols;
    const row2 = Math.floor(index2 / this.cols);
    const x2 = col2 * cardWidth;
    const y2 = row2 * cardHeight;
    
    this.ctx.fillRect(x1 + 2, y1 + 2, cardWidth - 4, cardHeight - 4);
    this.ctx.fillRect(x2 + 2, y2 + 2, cardWidth - 4, cardHeight - 4);
    
    setTimeout(() => {
      this.draw();
    }, 200);
  }
}
