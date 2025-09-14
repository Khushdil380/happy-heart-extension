/**
 * LEFT SIDEBAR MANAGER
 * Manages all left sidebar widgets
 */

import { WeatherWidget } from './weather-widget.js';
import { NotesWidget } from './notes-widget.js';
import { getStoredData, setStoredData } from '../../utils/storage.js';
import { popupManager } from '../../../assets/components/Popup/popup-manager.js';

class LeftSidebar {
  constructor() {
    this.widgets = new Map();
    this.isInitialized = false;
    this.weatherWidget = new WeatherWidget();
    this.notesWidget = new NotesWidget();
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Initialize digital watch
      await this.initDigitalWatch();
      
      // Initialize weather widget
      await this.weatherWidget.init();
      
      // Initialize notes widget
      await this.notesWidget.init();
      
      // Initialize quote widget
      await this.initQuoteWidget();
      
      // Setup global click handler for quote widget
      this.setupGlobalQuoteHandler();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Left Sidebar:', error);
    }
  }

  async initDigitalWatch() {
    const timeDisplay = document.getElementById('time-display');
    const dateDisplay = document.getElementById('date-display');
    
    if (!timeDisplay || !dateDisplay) return;

    const updateTime = () => {
      const now = new Date();
      
      // Format time
      const time = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      // Format date
      const date = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      timeDisplay.textContent = time;
      dateDisplay.textContent = date;
    };

    // Update immediately and then every second
    updateTime();
    setInterval(updateTime, 1000);
  }



  async initQuoteWidget() {
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    const editQuoteBtn = document.getElementById('edit-quote-btn');
    
    if (!quoteText || !quoteAuthor || !editQuoteBtn) {
      console.error('❌ Missing quote widget elements');
      return;
    }

    // Load saved quote or use default
    const savedQuote = await getStoredData('user_quote');
    if (savedQuote) {
      quoteText.textContent = savedQuote.text;
      quoteAuthor.textContent = savedQuote.author.startsWith('-') ? savedQuote.author : `- ${savedQuote.author}`;
    }

    // Edit quote button - use event delegation for better reliability
    const quoteWidget = document.getElementById('quote-widget');
    if (quoteWidget) {
      quoteWidget.addEventListener('click', (e) => {
        if (e.target.id === 'edit-quote-btn') {
          e.preventDefault();
          e.stopPropagation();
          this.openEditQuoteModal();
        }
      });
    }
    
    // Also keep direct listener as backup
    editQuoteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openEditQuoteModal();
    });
  }


  openEditQuoteModal() {
    const currentQuoteText = document.getElementById('quote-text').textContent;
    const currentQuoteAuthor = document.getElementById('quote-author').textContent;
    
    // Create edit quote content for small popup
    const content = `
      <div class="quote-modal-content">
        <div class="form-group">
          <label for="edit-quote-text">Quote Text:</label>
          <textarea id="edit-quote-text" class="glass-input" rows="4" placeholder="Enter your inspirational quote">${this.escapeHtml(currentQuoteText)}</textarea>
        </div>
        <div class="form-group">
          <label for="edit-quote-author">Author:</label>
          <input type="text" id="edit-quote-author" class="glass-input" placeholder="Enter author name" value="${this.escapeHtml(currentQuoteAuthor)}">
        </div>
        <div class="form-actions">
          <button class="glass-button" id="save-quote-btn">Save Quote</button>
          <button class="glass-button" id="cancel-quote-btn">Cancel</button>
        </div>
      </div>
    `;

    const popup = popupManager.createPopup('Edit Quote of the Day', content, {
      id: 'edit-quote-popup',
      size: 'small'
    });

    popupManager.openPopup(popup);

    // Wire up event listeners
    const popupBody = popup.body;
    const saveBtn = popupBody.querySelector('#save-quote-btn');
    const cancelBtn = popupBody.querySelector('#cancel-quote-btn');

    saveBtn.addEventListener('click', async () => {
      const quoteText = popupBody.querySelector('#edit-quote-text').value.trim();
      const quoteAuthor = popupBody.querySelector('#edit-quote-author').value.trim();
      
      if (!quoteText || !quoteAuthor) {
        this.showAlert('Please enter both quote text and author');
        return;
      }
      
      await this.saveQuote(quoteText, quoteAuthor);
      popupManager.closePopup(popup);
    });

    cancelBtn.addEventListener('click', () => {
      popupManager.closePopup(popup);
    });
  }


  async saveQuote(quoteText, quoteAuthor) {
    try {
      // Save quote data
      const quoteData = {
        text: quoteText,
        author: quoteAuthor,
        updatedAt: new Date().toISOString()
      };
      
      await setStoredData('user_quote', quoteData);
      
      // Update display
      document.getElementById('quote-text').textContent = quoteText;
      document.getElementById('quote-author').textContent = `- ${quoteAuthor}`;
      
    } catch (error) {
      console.error('Error saving quote:', error);
      this.showAlert('Error saving quote');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setupGlobalQuoteHandler() {
    // Global click handler for quote widget
    this.globalQuoteHandler = (e) => {
      const target = e.target;
      
      // Workaround: If click is on quote-widget container, check if it's near the button
      if (target.closest('#quote-widget')) {
        if (target.id === 'quote-widget' || target.classList.contains('widget-content')) {
          const editBtn = document.getElementById('edit-quote-btn');
          if (editBtn) {
            const rect = editBtn.getBoundingClientRect();
            const clickX = e.clientX;
            const clickY = e.clientY;
            
            // Check if click is within button bounds (with some padding)
            const isNearButton = clickX >= rect.left - 10 && clickX <= rect.right + 10 && 
                                clickY >= rect.top - 10 && clickY <= rect.bottom + 10;
            
            if (isNearButton) {
              e.preventDefault();
              e.stopPropagation();
              this.openEditQuoteModal();
              return;
            }
          }
        }
      }
      
      if (target.id === 'edit-quote-btn') {
        e.preventDefault();
        e.stopPropagation();
        this.openEditQuoteModal();
      }
    };
    
    document.addEventListener('click', this.globalQuoteHandler, true);
  }

  showAlert(message) {
    alert(message);
  }

  cleanup() {
    // Cleanup if needed
    if (this.globalQuoteHandler) {
      document.removeEventListener('click', this.globalQuoteHandler, true);
    }
  }
}

// Initialize and export
export async function initLeftSidebar() {
  const sidebar = new LeftSidebar();
  await sidebar.init();
  return sidebar;
}
