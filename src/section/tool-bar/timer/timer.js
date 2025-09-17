/**
 * TIMER/STOPWATCH TOOL
 * Professional timer and stopwatch with multiple features
 */

import { popupManager } from '../../../../assets/components/Popup/popup-manager.js';

class TimerTool {
  constructor() {
    this.isInitialized = false;
    this.currentMode = 'stopwatch'; // 'stopwatch' or 'timer'
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pausedTime = 0;
    this.intervalId = null;
    this.lapTimes = [];
    this.timerDuration = 0; // in milliseconds
    this.timerEndTime = 0;
    this.lastLoggedSecond = -1;
    
    // Preset timer durations (in minutes)
    this.presets = [
      { name: '5m', minutes: 5 },
      { name: '10m', minutes: 10 },
      { name: '15m', minutes: 15 },
      { name: '25m', minutes: 25 },
      { name: '30m', minutes: 30 },
      { name: '45m', minutes: 45 },
      { name: '1h', minutes: 60 },
      { name: '2h', minutes: 120 }
    ];
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      this.createPopup();
      this.setupEventListeners();
      this.loadSettings();
      this.isInitialized = true;
      console.log('✅ Timer Tool initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Timer Tool:', error);
    }
  }

  createPopup() {
    const content = this.createTimerContent();
    
    this.popup = popupManager.createPopup('Timer & Stopwatch', content, {
      id: 'timer-popup',
      size: 'large'
    });
  }

  setupEventListeners() {
    const timerTool = document.getElementById('timer-tool');
    if (timerTool) {
      timerTool.addEventListener('click', () => {
        this.openPopup();
      });
    }
  }

  openPopup() {
    if (!this.popup) return;
    
    popupManager.openPopup(this.popup);
    this.setupTimerEventListeners();
  }

  createTimerContent() {
    return `
      <div class="timer-container">
        <!-- Mode Tabs -->
        <div class="timer-mode-tabs">
          <button class="timer-mode-tab active" data-mode="stopwatch">Stopwatch</button>
          <button class="timer-mode-tab" data-mode="timer">Timer</button>
        </div>

        <!-- Timer Display -->
        <div class="timer-display">
          <div class="timer-time" id="timer-display">00:00:00</div>
          <div class="timer-mode" id="timer-mode-text">Stopwatch</div>
          <div class="timer-status">
            <div class="timer-status-indicator" id="timer-status"></div>
          </div>
        </div>

        <!-- Timer Input Section (for Timer mode) -->
        <div class="timer-input-section" id="timer-input-section" style="display: none;">
          <div class="timer-input-header">
            <h3>Set Timer Duration</h3>
          </div>
          <div class="timer-input-grid">
            <div class="timer-input-group">
              <label>Hours</label>
              <input type="number" class="timer-input" id="timer-hours" min="0" max="23" value="0" placeholder="0">
            </div>
            <div class="timer-input-group">
              <label>Minutes</label>
              <input type="number" class="timer-input" id="timer-minutes" min="0" max="59" value="5" placeholder="5">
            </div>
            <div class="timer-input-group">
              <label>Seconds</label>
              <input type="number" class="timer-input" id="timer-seconds" min="0" max="59" value="0" placeholder="0">
            </div>
          </div>
          <div class="timer-presets">
            ${this.presets.map(preset => 
              `<button class="timer-preset-btn" data-minutes="${preset.minutes}">${preset.name}</button>`
            ).join('')}
          </div>
        </div>

        <!-- Timer Controls -->
        <div class="timer-controls">
          <button class="timer-btn primary" id="start-stop-btn">Start</button>
          <button class="timer-btn" id="reset-btn" disabled>Reset</button>
          <button class="timer-btn" id="lap-btn" style="display: none;">Lap</button>
        </div>

        <!-- Lap Times Section (for Stopwatch) -->
        <div class="lap-times-section" id="lap-times-section">
          <div class="lap-times-header">
            <h3>Lap Times</h3>
            <button class="timer-btn" id="clear-laps-btn" style="display: none;">Clear</button>
          </div>
          <div class="lap-times-list" id="lap-times-list">
            <div class="no-laps">No lap times recorded</div>
          </div>
        </div>
      </div>
    `;
  }

  setupTimerEventListeners() {
    if (!this.popup) return;
    const popupBody = this.popup.body;
    
    // Mode tabs
    popupBody.querySelectorAll('.timer-mode-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
    });

    // Control buttons
    const startStopBtn = popupBody.querySelector('#start-stop-btn');
    const resetBtn = popupBody.querySelector('#reset-btn');
    const lapBtn = popupBody.querySelector('#lap-btn');
    const clearLapsBtn = popupBody.querySelector('#clear-laps-btn');

    if (startStopBtn) startStopBtn.addEventListener('click', () => this.toggleStartStop());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
    if (lapBtn) lapBtn.addEventListener('click', () => this.recordLap());
    if (clearLapsBtn) clearLapsBtn.addEventListener('click', () => this.clearLaps());

    // Timer input
    popupBody.querySelectorAll('.timer-input').forEach(input => {
      input.addEventListener('input', () => this.validateTimerInput());
    });

    // Preset buttons
    popupBody.querySelectorAll('.timer-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setPresetTimer(parseInt(e.target.dataset.minutes)));
    });

    // Initialize display and mode
    this.updateDisplay();
    this.switchMode(this.currentMode);
  }

  switchMode(mode) {
    if (this.isRunning) {
      this.reset();
    }

    this.currentMode = mode;
    
    if (!this.popup) return;
    const popupBody = this.popup.body;
    
    // Update tabs
    popupBody.querySelectorAll('.timer-mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // Update UI
    const inputSection = popupBody.querySelector('#timer-input-section');
    const lapBtn = popupBody.querySelector('#lap-btn');
    const lapSection = popupBody.querySelector('#lap-times-section');
    const modeText = popupBody.querySelector('#timer-mode-text');

    if (mode === 'timer') {
      if (inputSection) inputSection.style.display = 'block';
      if (lapBtn) lapBtn.style.display = 'none';
      if (lapSection) lapSection.style.display = 'none';
      if (modeText) modeText.textContent = 'Timer';
    } else {
      if (inputSection) inputSection.style.display = 'none';
      if (lapBtn) lapBtn.style.display = 'inline-block';
      if (lapSection) lapSection.style.display = 'block';
      if (modeText) modeText.textContent = 'Stopwatch';
    }
    

    this.updateDisplay();
  }

  toggleStartStop() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.currentMode === 'timer') {
      this.startTimer();
    } else {
      this.startStopwatch();
    }
  }

  startStopwatch() {
    this.isRunning = true;
    this.isPaused = false;
    
    if (this.pausedTime > 0) {
      // Resume from paused state
      this.startTime = Date.now() - this.pausedTime;
    } else {
      // Start fresh
      this.startTime = Date.now();
    }
    
    this.pausedTime = 0;
    this.lastLoggedSecond = -1;
    this.intervalId = setInterval(() => this.updateDisplay(), 10);
    this.updateControls();
  }

  startTimer() {
    if (!this.popup) return;
    const popupBody = this.popup.body;
    
    const hours = parseInt(popupBody.querySelector('#timer-hours')?.value) || 0;
    const minutes = parseInt(popupBody.querySelector('#timer-minutes')?.value) || 0;
    const seconds = parseInt(popupBody.querySelector('#timer-seconds')?.value) || 0;

    if (hours === 0 && minutes === 0 && seconds === 0) {
      alert('Please set a timer duration');
      return;
    }

    this.timerDuration = (hours * 3600 + minutes * 60 + seconds) * 1000;
    this.timerEndTime = Date.now() + this.timerDuration;
    this.isRunning = true;
    this.isPaused = false;
    this.pausedTime = 0;
    this.lastLoggedSecond = -1;

    this.intervalId = setInterval(() => this.updateTimerDisplay(), 10);
    this.updateControls();
  }

  pause() {
    this.isRunning = false;
    this.isPaused = true;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.currentMode === 'stopwatch') {
      this.pausedTime = Date.now() - this.startTime;
    } else {
      this.pausedTime = this.timerEndTime - Date.now();
    }

    this.updateControls();
  }

  reset() {
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pausedTime = 0;
    this.timerDuration = 0;
    this.timerEndTime = 0;
    this.lapTimes = [];

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.updateDisplay();
    this.updateControls();
    this.updateLapTimes();
  }

  recordLap() {
    if (!this.isRunning || this.currentMode !== 'stopwatch') return;

    const currentTime = Date.now() - this.startTime;
    const lapTime = this.lapTimes.length > 0 ? 
      currentTime - this.lapTimes[this.lapTimes.length - 1].totalTime : 
      currentTime;

    this.lapTimes.push({
      lapNumber: this.lapTimes.length + 1,
      lapTime: lapTime,
      totalTime: currentTime
    });

    this.updateLapTimes();
  }

  updateDisplay() {
    if (!this.popup || !this.popup.body) return;
    
    const display = this.popup.body.querySelector('#timer-display');
    if (!display) return;
    
    if (!this.isRunning && !this.isPaused) {
      display.textContent = '00:00:00';
      return;
    }

    let elapsed;
    if (this.currentMode === 'stopwatch') {
      elapsed = this.pausedTime > 0 ? this.pausedTime : Date.now() - this.startTime;
    } else {
      elapsed = this.pausedTime > 0 ? this.timerDuration - this.pausedTime : this.timerEndTime - Date.now();
    }

    const timeString = this.formatTime(Math.max(0, elapsed));
    display.textContent = timeString;

    // Check if timer finished
    if (this.currentMode === 'timer' && elapsed <= 0) {
      this.timerFinished();
    }
  }

  updateTimerDisplay() {
    this.updateDisplay();
  }

  timerFinished() {
    this.reset();
    this.showCenteredNotification('Timer Finished!', 'Your timer has completed.');
    this.playNotificationSound();
    
    // Ensure controls are updated after reset
    setTimeout(() => {
      this.updateControls();
    }, 100);
  }

  updateControls() {
    if (!this.popup) return;
    const popupBody = this.popup.body;
    
    const startStopBtn = popupBody.querySelector('#start-stop-btn');
    const resetBtn = popupBody.querySelector('#reset-btn');
    const statusIndicator = popupBody.querySelector('#timer-status');

    if (this.isRunning) {
      if (startStopBtn) startStopBtn.textContent = 'Pause';
      if (startStopBtn) startStopBtn.classList.add('primary');
      if (resetBtn) resetBtn.disabled = false;
      if (statusIndicator) statusIndicator.className = 'timer-status-indicator active';
    } else if (this.isPaused) {
      if (startStopBtn) startStopBtn.textContent = 'Resume';
      if (startStopBtn) startStopBtn.classList.add('primary');
      if (resetBtn) resetBtn.disabled = false;
      if (statusIndicator) statusIndicator.className = 'timer-status-indicator paused';
    } else {
      if (startStopBtn) startStopBtn.textContent = 'Start';
      if (startStopBtn) startStopBtn.classList.remove('primary');
      if (resetBtn) resetBtn.disabled = true;
      if (statusIndicator) statusIndicator.className = 'timer-status-indicator';
    }
  }

  updateLapTimes() {
    if (!this.popup) return;
    const popupBody = this.popup.body;
    
    const lapList = popupBody.querySelector('#lap-times-list');
    const clearBtn = popupBody.querySelector('#clear-laps-btn');

    if (!lapList) return;

    if (this.lapTimes.length === 0) {
      lapList.innerHTML = '<div class="no-laps">No lap times recorded</div>';
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    if (clearBtn) clearBtn.style.display = 'inline-block';

    // Find fastest and slowest lap times
    const lapTimes = this.lapTimes.map(lap => lap.lapTime);
    const fastest = Math.min(...lapTimes);
    const slowest = Math.max(...lapTimes);

    const lapHTML = this.lapTimes.map(lap => {
      let className = 'lap-time-item';
      if (lap.lapTime === fastest && this.lapTimes.length > 1) {
        className += ' fastest';
      } else if (lap.lapTime === slowest && this.lapTimes.length > 1) {
        className += ' slowest';
      }

      const difference = this.lapTimes.length > 1 ? 
        (lap.lapTime - this.lapTimes[0].lapTime) : 0;
      const diffText = difference !== 0 ? 
        `${difference > 0 ? '+' : ''}${this.formatTime(Math.abs(difference))}` : '';

      return `
        <div class="${className}">
          <div class="lap-time-number">Lap ${lap.lapNumber}</div>
          <div class="lap-time-value">${this.formatTime(lap.lapTime)}</div>
          <div class="lap-time-difference">${diffText}</div>
        </div>
      `;
    }).join('');

    lapList.innerHTML = lapHTML;
  }

  clearLaps() {
    this.lapTimes = [];
    this.updateLapTimes();
  }

  setPresetTimer(minutes) {
    if (!this.popup) return;
    const popupBody = this.popup.body;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    const hoursInput = popupBody.querySelector('#timer-hours');
    const minutesInput = popupBody.querySelector('#timer-minutes');
    const secondsInput = popupBody.querySelector('#timer-seconds');

    if (hoursInput) hoursInput.value = hours;
    if (minutesInput) minutesInput.value = remainingMinutes;
    if (secondsInput) secondsInput.value = 0;

    // Update preset button states
    popupBody.querySelectorAll('.timer-preset-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.minutes) === minutes);
    });
  }

  validateTimerInput() {
    if (!this.popup) return;
    const popupBody = this.popup.body;
    
    const hours = popupBody.querySelector('#timer-hours');
    const minutes = popupBody.querySelector('#timer-minutes');
    const seconds = popupBody.querySelector('#timer-seconds');

    // Ensure values are within valid ranges
    if (hours && hours.value > 23) hours.value = 23;
    if (minutes && minutes.value > 59) minutes.value = 59;
    if (seconds && seconds.value > 59) seconds.value = 59;

    // Ensure values are non-negative
    if (hours && hours.value < 0) hours.value = 0;
    if (minutes && minutes.value < 0) minutes.value = 0;
    if (seconds && seconds.value < 0) seconds.value = 0;
  }

  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
  }

  showCenteredNotification(title, message) {
    // Create a centered notification that appears above the popup
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--glass-bg);
      border: 2px solid rgba(5, 255, 238, 0.6);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      color: var(--primary-text-color);
      z-index: 10001;
      backdrop-filter: var(--glass-blur);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      animation: timerNotification 0.5s ease-out;
      text-align: center;
      min-width: 300px;
      max-width: 400px;
    `;
    
    notification.innerHTML = `
      <div style="font-size: 2rem; margin-bottom: var(--spacing-sm);">⏰</div>
      <div style="font-weight: 700; font-size: var(--font-size-xl); margin-bottom: var(--spacing-sm); color: var(--secondary-text-color);">${title}</div>
      <div style="font-size: var(--font-size-base); opacity: 0.8;">${message}</div>
    `;

    // Add CSS animation if not already present
    if (!document.getElementById('timer-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'timer-notification-styles';
      style.textContent = `
        @keyframes timerNotification {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'timerNotification 0.3s ease-out reverse';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 4000);
  }

  playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  loadSettings() {
    // Load saved settings from localStorage
    try {
      const saved = localStorage.getItem('timer-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.currentMode = settings.mode || 'stopwatch';
        // Load other settings as needed
      }
    } catch (error) {
      console.log('Could not load timer settings:', error);
    }
  }

  saveSettings() {
    // Save settings to localStorage
    try {
      const settings = {
        mode: this.currentMode,
        // Save other settings as needed
      };
      localStorage.setItem('timer-settings', JSON.stringify(settings));
    } catch (error) {
      console.log('Could not save timer settings:', error);
    }
  }

  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.saveSettings();
  }
}

// Export function for initialization
export async function initTimerTool() {
  const timerTool = new TimerTool();
  await timerTool.init();
  return timerTool;
}

export default TimerTool;
