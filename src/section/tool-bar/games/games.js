import { popupManager } from '../../../../assets/components/Popup/popup-manager.js';
import { SnakeGame } from './snake/snake.js';
import { TicTacToeGame } from './tic-tac-toe/tic-tac-toe.js';
import { MemoryGame } from './memory/memory.js';
import { FlappyBirdGame } from './flappy-bird/flappy-bird.js';
import { WhackMoleGame } from './whack-mole/whack-mole.js';

class GamesTool {
  constructor() {
    this.popup = null;
    this.currentGame = null;
    this.gameInstances = new Map();
    this.isInitialized = false;
    this.eventListenersSetup = false;
    this.isProcessingClick = false; // Flag to prevent rapid clicks
  }

  init() {
    if (this.isInitialized) return;
    
    // Only create popup structure, don't setup event listeners yet
    this.createPopup();
    this.isInitialized = true;
    console.log('✅ Games Tool initialized');
  }

  createPopup() {
    const htmlContent = this.getPopupHTML();
    this.popup = popupManager.createPopup('Games', htmlContent, { 
      id: 'games-content',
      size: 'large'
    });
  }

  getPopupHTML() {
    return `
      <div class="games-container">
        <div class="games-sidebar">
          <div class="game-tabs">
            <button class="game-tab active" data-game="snake">
              <span class="game-icon">🐍</span>
              <span class="game-name">Snake</span>
            </button>
            <button class="game-tab" data-game="tic-tac-toe">
              <span class="game-icon">⭕</span>
              <span class="game-name">Tic-Tac-Toe</span>
            </button>
            <button class="game-tab" data-game="memory">
              <span class="game-icon">🧠</span>
              <span class="game-name">Memory</span>
            </button>
            <button class="game-tab" data-game="flappy-bird">
              <span class="game-icon">🐦</span>
              <span class="game-name">Flappy Bird</span>
            </button>
            <button class="game-tab" data-game="whack-mole">
              <span class="game-icon">🔨</span>
              <span class="game-name">Whack-a-Mole</span>
            </button>
          </div>
          
        </div>
        
        <div class="games-main">
          <div class="game-area">
            <div id="game-canvas-container">
              <canvas id="game-canvas" width="600" height="500"></canvas>
              
              <!-- Game Overlay Controls -->
              <div id="game-overlay" class="game-overlay">
                <div class="game-start-screen">
                  <h3 id="game-title">Snake Game</h3>
                  <button id="start-game" class="control-btn primary">Start Game</button>
                </div>
              </div>
              
              <!-- Game Info (shown after game over) -->
              <div id="game-info" class="game-info-overlay" style="display: none;">
                <div class="game-score-info">
                  <div class="score-display">
                    <span class="score-label">Final Score:</span>
                    <span id="game-score">0</span>
                  </div>
                  <div class="high-score-display">
                    <span class="high-score-label">Best:</span>
                    <span id="game-high-score">0</span>
                  </div>
                </div>
                <div class="game-controls-overlay">
                  <button id="play-again-btn" class="control-btn primary">Play Again</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    if (!this.popup) return;
    
    if (this.eventListenersSetup) {
      console.log('Event listeners already setup, skipping...');
      return;
    }
    
    console.log('🔧 Setting up event listeners...');
    const popupBody = this.popup.body;

    // Game tab switching
    const gameTabs = popupBody.querySelectorAll('.game-tab');
    gameTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const gameType = e.currentTarget.dataset.game;
        this.switchGame(gameType);
      });
    });

    // Game controls
    const startBtn = popupBody.querySelector('#start-game');
    const playAgainBtn = popupBody.querySelector('#play-again-btn');

    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.isProcessingClick) {
        console.log('🎮 Click already being processed, ignoring...');
        return;
      }
      console.log('🎮 Start button clicked');
      this.isProcessingClick = true;
      this.startCurrentGame();
      setTimeout(() => { this.isProcessingClick = false; }, 500); // 500ms cooldown
    });
    
    playAgainBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.isProcessingClick) {
        console.log('🔄 Click already being processed, ignoring...');
        return;
      }
      console.log('🔄 Play Again button clicked');
      this.isProcessingClick = true;
      this.playAgain();
      setTimeout(() => { this.isProcessingClick = false; }, 500); // 500ms cooldown
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (this.currentGame && this.gameInstances.has(this.currentGame)) {
        this.gameInstances.get(this.currentGame).handleKeyPress(e);
      }
    });

    // Close popup cleanup
    this.popup.closeBtn.addEventListener('click', () => {
      this.stopAllGames();
    });
    
    this.eventListenersSetup = true;
    console.log('✅ Event listeners setup completed');
  }

  switchGame(gameType) {
    if (this.currentGame === gameType) return;

    // Stop current game
    this.stopCurrentGame();

    // Update UI
    const popupBody = this.popup.body;
    const gameTabs = popupBody.querySelectorAll('.game-tab');
    const gameTitle = popupBody.querySelector('#game-title');
    const gameOverlay = popupBody.querySelector('#game-overlay');
    const gameInfo = popupBody.querySelector('#game-info');

    gameTabs.forEach(tab => tab.classList.remove('active'));
    popupBody.querySelector(`[data-game="${gameType}"]`).classList.add('active');

    // Update game title
    const gameNames = {
      snake: 'Snake Game',
      'tic-tac-toe': 'Tic-Tac-Toe',
      memory: 'Memory Game',
      'flappy-bird': 'Flappy Bird',
      'whack-mole': 'Whack-a-Mole'
    };
    if (gameTitle) {
      gameTitle.textContent = gameNames[gameType] || 'Game';
    }

    // Show start screen and hide game info
    if (gameOverlay) {
      gameOverlay.style.display = 'flex';
    }
    if (gameInfo) {
      gameInfo.style.display = 'none';
    }

    // Load high score
    this.loadHighScore(gameType);

    this.currentGame = gameType;
  }


  startCurrentGame() {
    if (!this.currentGame) return;

    if (!this.gameInstances.has(this.currentGame)) {
      this.createGameInstance(this.currentGame);
    }

    const game = this.gameInstances.get(this.currentGame);
    if (game) {
      // Only reset if game is not already running
      if (!game.isRunning) {
        console.log('🎮 Starting new game - resetting');
        game.reset(); // Reset game to initial state
        game.start();
        this.hideStartScreen();
      } else {
        console.log('🎮 Game already running - not resetting');
        this.hideStartScreen(); // Still hide start screen if game is running
      }
    }
  }

  hideStartScreen() {
    const popupBody = this.popup.body;
    const gameOverlay = popupBody.querySelector('#game-overlay');
    
    // Hide start screen but don't show game info yet
    if (gameOverlay) {
      gameOverlay.style.display = 'none';
    }
  }

  playAgain() {
    console.log('🔄 Play Again clicked');
    
    // Reset current game to initial state
    if (this.currentGame && this.gameInstances.has(this.currentGame)) {
      const game = this.gameInstances.get(this.currentGame);
      if (game) {
        console.log('🔄 Resetting game for play again');
        game.reset();
        game.start(); // Start the game immediately
      }
    }
    
    // Hide game info and show start screen
    this.hideGameInfo();
  }

  showGameInfo() {
    const popupBody = this.popup.body;
    const gameOverlay = popupBody.querySelector('#game-overlay');
    const gameInfo = popupBody.querySelector('#game-info');

    // Hide start screen and show game info
    if (gameOverlay) {
      gameOverlay.style.display = 'none';
    }
    if (gameInfo) {
      gameInfo.style.display = 'block';
    }

    this.updateControlButtons(true);
  }

  hideGameInfo() {
    const popupBody = this.popup.body;
    const gameOverlay = popupBody.querySelector('#game-overlay');
    const gameInfo = popupBody.querySelector('#game-info');

    // Show start screen and hide game info
    if (gameOverlay) {
      gameOverlay.style.display = 'flex';
    }
    if (gameInfo) {
      gameInfo.style.display = 'none';
    }

    this.updateControlButtons(false);
  }


  stopCurrentGame() {
    if (!this.currentGame || !this.gameInstances.has(this.currentGame)) return;

    const game = this.gameInstances.get(this.currentGame);
    if (game && game.stop) {
      game.stop();
      this.hideGameInfo();
    }
  }

  onGameOver() {
    // Show game info overlay when game ends
    this.showGameInfo();
  }

  stopAllGames() {
    this.gameInstances.forEach(game => {
      if (game && game.stop) {
        game.stop();
      }
    });
    this.hideGameInfo();
  }

  createGameInstance(gameType) {
    const canvas = this.popup.body.querySelector('#game-canvas');
    if (!canvas) return;

    // Remove all game classes and add the current one
    canvas.className = '';
    canvas.classList.add(`${gameType.replace('-', '-')}-game`);

    let game;
    switch (gameType) {
      case 'snake':
        game = new SnakeGame(canvas, this);
        break;
      case 'tic-tac-toe':
        game = new TicTacToeGame(canvas, this);
        break;
      case 'memory':
        game = new MemoryGame(canvas, this);
        break;
      case 'flappy-bird':
        game = new FlappyBirdGame(canvas, this);
        break;
      case 'whack-mole':
        game = new WhackMoleGame(canvas, this);
        break;
      default:
        return;
    }

    this.gameInstances.set(gameType, game);
  }

  updateScore(score) {
    const scoreElement = this.popup.body.querySelector('#game-score');
    if (scoreElement) {
      scoreElement.textContent = score;
    }
  }

  updateHighScore(score) {
    const highScoreElement = this.popup.body.querySelector('#game-high-score');
    if (highScoreElement) {
      highScoreElement.textContent = score;
    }
    this.saveHighScore(this.currentGame, score);
  }

  loadHighScore(gameType) {
    const highScore = localStorage.getItem(`game-high-score-${gameType}`) || '0';
    this.updateHighScore(parseInt(highScore));
  }

  saveHighScore(gameType, score) {
    const currentHighScore = parseInt(localStorage.getItem(`game-high-score-${gameType}`) || '0');
    if (score > currentHighScore) {
      localStorage.setItem(`game-high-score-${gameType}`, score.toString());
      this.updateHighScore(score);
    }
  }

  updateControlButtons(isRunning) {
    // No longer needed since controls are only shown after game over
  }

  openPopup() {
    if (!this.popup) return;
    
    popupManager.openPopup(this.popup);
    
    // Setup event listeners when popup is first opened
    if (!this.eventListenersSetup) {
      this.setupEventListeners();
      this.eventListenersSetup = true;
    }
    
    // Initialize with first game
    if (!this.currentGame) {
      this.switchGame('snake');
    }
  }
}

// Initialize and export
export async function initGamesTool() {
  const gamesTool = new GamesTool();
  gamesTool.init();
  return gamesTool;
}

export default GamesTool;