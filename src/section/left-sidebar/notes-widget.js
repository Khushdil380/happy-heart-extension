/**
 * NOTES WIDGET
 * Comprehensive notes management with categories
 * Optimized for edge cases and improved reliability
 */

import { popupManager } from '../../../../components/Popup/popup-manager.js';

class NotesWidget {
  constructor() {
    this.notes = [];
    this.categories = [];
    this.currentCategory = null;
    this.isInitialized = false;
    this.defaultCategories = ['Study', 'Coding', 'Personal', 'Work'];
    
    // State management flags
    this.isSavingCategory = false;
    this.isSavingNote = false;
    this.isUpdating = false;
    
    // Event listener management
    this.globalClickListener = null;
    this.notesListCheckInterval = null;
    
    // Debounce timers
    this.searchDebounceTimer = null;
    this.updateDebounceTimer = null;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      await this.loadStoredData();
      this.setupEventListeners();
      this.updatePreview();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize Notes Widget:', error);
    }
  }

  // ==================== DATA MANAGEMENT ====================

  async loadStoredData() {
    try {
      const [savedCategories, savedNotes] = await Promise.all([
        this.getStoredData('notes_categories'),
        this.getStoredData('user_notes')
      ]);

      this.categories = savedCategories?.length > 0 ? savedCategories : [...this.defaultCategories];
      this.notes = savedNotes || [];
    } catch (error) {
      console.error('Error loading stored notes data:', error);
      this.categories = [...this.defaultCategories];
      this.notes = [];
    }
  }

  async saveStoredData() {
    try {
      await Promise.all([
        this.setStoredData('notes_categories', this.categories),
        this.setStoredData('user_notes', this.notes)
      ]);
    } catch (error) {
      console.error('Error saving notes data:', error);
    }
  }

  // ==================== CATEGORY OPERATIONS ====================

  async saveCategory() {
    if (this.isSavingCategory) return;
    this.isSavingCategory = true;

    try {
      const nameInput = document.getElementById('category-name');
      if (!nameInput) {
        console.error('Category name input not found');
        return;
      }

      const categoryName = nameInput.value.trim();
      if (!categoryName) {
        this.showAlert('Please enter a category name');
        return;
      }

      if (this.categories.includes(categoryName)) {
        this.showAlert('Category already exists');
        return;
      }

      this.categories.push(categoryName);
      await this.saveStoredData();
      this.refreshMainNotesManager();
    } catch (error) {
      console.error('Error saving category:', error);
      this.showAlert('Error saving category');
    } finally {
      this.isSavingCategory = false;
    }
  }

  async updateCategory() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      const nameInput = document.getElementById('edit-category-name');
      if (!nameInput) return;

      const newName = nameInput.value.trim();
      const oldName = nameInput.dataset.oldName;
      
      if (!newName) {
        this.showAlert('Please enter a category name');
        return;
      }

      if (newName !== oldName && this.categories.includes(newName)) {
        this.showAlert('Category already exists');
        return;
      }

      // Update category name
      const index = this.categories.indexOf(oldName);
      if (index !== -1) {
        this.categories[index] = newName;
      }

      // Update notes with new category name
      this.notes.forEach(note => {
        if (note.category === oldName) {
          note.category = newName;
          note.updatedAt = new Date().toISOString();
        }
      });

      // Update current category if it was selected
      if (this.currentCategory === oldName) {
        this.currentCategory = newName;
      }

      await this.saveStoredData();
      this.refreshMainNotesManager();
    } catch (error) {
      console.error('Error updating category:', error);
      this.showAlert('Error updating category');
    } finally {
      this.isUpdating = false;
    }
  }

  async deleteCategory() {
    try {
      const categoryName = document.getElementById('confirm-delete-category-btn')?.dataset.category;
      if (!categoryName) return;

      // Remove category and its notes
      this.categories = this.categories.filter(cat => cat !== categoryName);
      this.notes = this.notes.filter(note => note.category !== categoryName);
      
      // Clear current category if it was deleted
      if (this.currentCategory === categoryName) {
        this.currentCategory = null;
      }

      await this.saveStoredData();
      this.refreshMainNotesManager();
    } catch (error) {
      console.error('Error deleting category:', error);
      this.showAlert('Error deleting category');
    }
  }

  // ==================== NOTE OPERATIONS ====================

  async saveNote() {
    if (this.isSavingNote) return;
    this.isSavingNote = true;

    try {
      const formData = this.getNoteFormData('note-');
      if (!formData) return;

      if (!this.validateNoteData(formData)) {
        this.showAlert('Please fill in all fields');
        return;
      }

      const newNote = {
        id: this.generateNoteId(),
        title: formData.title,
        category: formData.category,
        content: formData.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.notes.push(newNote);
      await this.saveStoredData();
      this.refreshMainNotesManager();
    } catch (error) {
      console.error('Error saving note:', error);
      this.showAlert('Error saving note');
    } finally {
      this.isSavingNote = false;
    }
  }

  async updateNote() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      const formData = this.getNoteFormData('edit-note-');
      if (!formData) return;

      if (!this.validateNoteData(formData)) {
        this.showAlert('Please fill in all fields');
        return;
      }

      const note = this.notes.find(n => n.id === formData.noteId);
      if (note) {
        note.title = formData.title;
        note.category = formData.category;
        note.content = formData.content;
        note.updatedAt = new Date().toISOString();
      }

      await this.saveStoredData();
      this.refreshMainNotesManager();
    } catch (error) {
      console.error('Error updating note:', error);
      this.showAlert('Error updating note');
    } finally {
      this.isUpdating = false;
    }
  }

  async deleteNote() {
    try {
      const noteId = document.getElementById('confirm-delete-note-btn')?.dataset.noteId;
      if (!noteId) return;

      this.notes = this.notes.filter(note => note.id !== noteId);
      await this.saveStoredData();
      this.refreshMainNotesManager();
    } catch (error) {
      console.error('Error deleting note:', error);
      this.showAlert('Error deleting note');
    }
  }

  // ==================== HELPER METHODS ====================

  getNoteFormData(prefix) {
    const titleInput = document.getElementById(`${prefix}title`);
    const categorySelect = document.getElementById(`${prefix}category`);
    const contentTextarea = document.getElementById(`${prefix}content`);

    if (!titleInput || !categorySelect || !contentTextarea) {
      console.error('Note form elements not found');
      return null;
    }

    return {
      title: titleInput.value.trim(),
      category: categorySelect.value,
      content: contentTextarea.value.trim(),
      noteId: titleInput.dataset.noteId
    };
  }

  validateNoteData(data) {
    return data.title && data.content && data.category;
  }

  generateNoteId() {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  showAlert(message) {
    alert(message);
  }

  scheduleRefresh() {
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }
    this.updateDebounceTimer = setTimeout(() => {
      this.forceRefreshAllLists();
    }, 100);
  }

  // ==================== UI MANAGEMENT ====================

  setupEventListeners() {
    setTimeout(() => {
      const addNoteBtn = document.getElementById('add-note-btn');
      const viewNotesBtn = document.getElementById('view-notes-btn');

      if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => this.showNotesManager());
      }

      if (viewNotesBtn) {
        viewNotesBtn.addEventListener('click', () => this.showNotesManager());
      }
    }, 100);
  }

  updatePreview() {
    const notesPreview = document.getElementById('notes-preview');
    const viewNotesBtn = document.getElementById('view-notes-btn');

    if (notesPreview && this.notes.length > 0) {
      const recentNotes = this.notes
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 3);

      notesPreview.innerHTML = recentNotes
        .map(note => `
          <div class="note-preview-item">
            <span class="note-preview-title">${this.escapeHtml(note.title)}</span>
            <span class="note-preview-category">${this.escapeHtml(note.category)}</span>
          </div>
        `).join('');
      
      if (viewNotesBtn) viewNotesBtn.style.display = 'flex';
    }
  }

  // ==================== NOTES MANAGER ====================

  showNotesManager() {
    const content = this.getNotesManagerHTML();
    
    try {
      const popup = popupManager.createPopup('Notes Manager', content, {
        id: 'notes-manager',
        size: 'large'
      });
      
      popupManager.openPopup(popup);

      setTimeout(() => {
        this.setupNotesManagerListeners();
        this.initializeNotesManager();
      }, 100);
    } catch (error) {
      console.error('Error opening notes manager:', error);
      this.showAlert('Error opening notes manager');
    }
  }

  getNotesManagerHTML() {
    return `
      <div class="notes-manager">
        <div class="notes-manager-header">
          <div class="notes-stats">
            <span>📝 ${this.notes.length} Notes</span>
            <span>📁 ${this.categories.length} Categories</span>
          </div>
          <div class="notes-actions">
            <button id="add-category-btn" class="glass-button">+ Add Category</button>
            <button id="add-note-manager-btn" class="glass-button">+ Add Note</button>
          </div>
        </div>
        
        <div class="notes-manager-content">
          <div class="categories-sidebar">
            <h3>Categories</h3>
            <div class="categories-list" id="categories-list">
              ${this.renderCategoriesListHTML()}
            </div>
          </div>
          
          <div class="notes-content">
            <div class="notes-header">
              <h3 id="current-category-title">${this.escapeHtml(this.currentCategory || 'Select a category')}</h3>
              <div class="notes-search">
                <input type="text" id="notes-search" placeholder="Search notes..." class="glass-input">
              </div>
            </div>
            <div class="notes-list" id="notes-list">
              ${this.renderNotesListHTML()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderCategoriesListHTML() {
    return this.categories.map(category => `
      <div class="category-item ${category === this.currentCategory ? 'active' : ''}" data-category="${this.escapeHtml(category)}">
        <span class="category-name">${this.escapeHtml(category)}</span>
        <div class="category-actions">
          <button class="category-edit-btn" data-category="${this.escapeHtml(category)}" title="Edit">✏️</button>
          <button class="category-delete-btn" data-category="${this.escapeHtml(category)}" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  renderNotesListHTML() {
    if (!this.currentCategory) {
      return '<p class="no-notes">Select a category to view notes</p>';
    }

    const categoryNotes = this.notes.filter(note => note.category === this.currentCategory);
    
    if (categoryNotes.length === 0) {
      return `<p class="no-notes">No notes in "${this.escapeHtml(this.currentCategory)}" category</p>`;
    }

    const sortedNotes = categoryNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return sortedNotes.map(note => `
      <div class="note-item" data-note-id="${note.id}">
        <div class="note-content">
          <h4 class="note-title">${this.escapeHtml(note.title)}</h4>
          <p class="note-preview">${this.escapeHtml(this.truncateText(note.content, 100))}</p>
          <small class="note-date">${new Date(note.updatedAt).toLocaleDateString()}</small>
        </div>
        <div class="note-actions">
          <button class="note-edit-btn" data-note-id="${note.id}" title="Edit">✏️</button>
          <button class="note-delete-btn" data-note-id="${note.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  // ==================== EVENT HANDLING ====================

  setupNotesManagerListeners() {
    // Clean up existing listeners
    this.cleanupEventListeners();

    // Global click handler
    this.globalClickListener = this.handleGlobalClick.bind(this);
    document.addEventListener('click', this.globalClickListener, true);

    // Search input with debouncing
    const searchInput = document.getElementById('notes-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch.bind(this));
    }

    // Setup periodic monitoring
    this.setupPeriodicMonitoring();
  }

  handleGlobalClick(e) {
    const target = e.target;
    
    // Main action buttons
    if (target.id === 'add-category-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.showAddCategorySubPopup();
    } else if (target.id === 'add-note-manager-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.showAddNoteSubPopup();
    }
    
    // Modal buttons
    else if (target.id === 'save-category-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.saveCategory();
    } else if (target.id === 'cancel-category-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.closeSubPopup();
    } else if (target.id === 'save-note-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.saveNote();
    } else if (target.id === 'cancel-note-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.closeSubPopup();
    } else if (target.id === 'update-category-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.updateCategory();
    } else if (target.id === 'cancel-edit-category-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.closeSubPopup();
    } else if (target.id === 'confirm-delete-category-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.deleteCategory();
    } else if (target.id === 'cancel-delete-category-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.closeSubPopup();
    } else if (target.id === 'update-note-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.updateNote();
    } else if (target.id === 'cancel-edit-note-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.closeSubPopup();
    } else if (target.id === 'confirm-delete-note-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.deleteNote();
    } else if (target.id === 'cancel-delete-note-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.closeSubPopup();
    } else if (target.id === 'edit-note-detail-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.editNoteFromDetail();
    } else if (target.id === 'close-note-detail-btn') {
      e.preventDefault();
      e.stopPropagation();
      this.closeSubPopup();
    }
    
    // Category actions
    else if (target.classList.contains('category-edit-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const category = target.dataset.category;
        this.showEditCategorySubPopup(category);
    } else if (target.classList.contains('category-delete-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const category = target.dataset.category;
      this.showDeleteCategorySubPopup(category);
    } else if (target.closest('.category-item') && !target.closest('.category-actions')) {
      e.preventDefault();
      e.stopPropagation();
      const categoryItem = target.closest('.category-item');
      const category = categoryItem.dataset.category;
      this.selectCategory(category);
    }
    
    // Note actions
    else if (target.classList.contains('note-edit-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const noteId = target.dataset.noteId;
        this.showEditNoteSubPopup(noteId);
    } else if (target.classList.contains('note-delete-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const noteId = target.dataset.noteId;
      this.showDeleteNoteSubPopup(noteId);
    } else if (target.closest('.note-item') && !target.closest('.note-actions')) {
      e.preventDefault();
      e.stopPropagation();
      const noteItem = target.closest('.note-item');
      const noteId = noteItem.dataset.noteId;
        this.showNoteDetailSubPopup(noteId);
    }
  }

  handleSearch(e) {
    const query = e.target.value.trim();
    
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    
    this.searchDebounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }

  // ==================== CATEGORY SELECTION ====================

  selectCategory(category) {
    this.currentCategory = category;
    
    // Update UI
    this.updateCategorySelection(category);
    this.updateNotesList();
  }

  updateCategorySelection(category) {
    // Update category items
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      item.classList.toggle('active', item.dataset.category === category);
    });

    // Update category title
    const categoryTitle = document.getElementById('current-category-title');
    if (categoryTitle) {
      categoryTitle.textContent = category || 'Select a category';
    }
  }

  updateNotesList() {
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;

    notesList.innerHTML = this.renderNotesListHTML();
  }

  // ==================== SUB-POPUP MANAGEMENT ====================

  closeSubPopup() {
    // Close the current sub-operation popup
    const subPopup = document.querySelector('.sub-popup-overlay');
    if (subPopup) {
      subPopup.remove();
    }
  }

  refreshMainNotesManager() {
    // Close sub-popup and refresh the main notes manager
    this.closeSubPopup();
    
    // Reload data and refresh the main notes manager
    setTimeout(async () => {
      await this.loadStoredData();
      this.forceRefreshAllLists();
    }, 100);
  }

  // ==================== SUB-POPUP CREATION ====================

  createSubPopup(title, content, id) {
    try {
      // Create custom sub-popup overlay
      const overlay = document.createElement('div');
      overlay.className = 'sub-popup-overlay';
      overlay.id = id;
      
      // Create sub-popup container
      const container = document.createElement('div');
      container.className = 'sub-popup-container';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'sub-popup-header';
      
      const titleElement = document.createElement('h3');
      titleElement.className = 'sub-popup-title';
      titleElement.textContent = title;
      
      const closeButton = document.createElement('button');
      closeButton.className = 'sub-popup-close';
      closeButton.innerHTML = '×';
      closeButton.addEventListener('click', () => overlay.remove());
      
      header.appendChild(titleElement);
      header.appendChild(closeButton);
      
      // Create body
      const body = document.createElement('div');
      body.className = 'sub-popup-body';
      body.innerHTML = content;
      
      // Assemble popup
      container.appendChild(header);
      container.appendChild(body);
      overlay.appendChild(container);
      
      // Add to DOM
      document.body.appendChild(overlay);
      
      // Add click outside to close
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });
    } catch (error) {
      console.error(`Error creating ${title} sub-popup:`, error);
      this.showAlert(`Error opening ${title}`);
    }
  }

  showAddCategorySubPopup() {
    const content = `
      <div class="sub-popup-content">
        <h3>Add New Category</h3>
        <div class="form-group">
          <label for="category-name">Category Name:</label>
          <input type="text" id="category-name" class="glass-input" placeholder="Enter category name">
        </div>
        <div class="form-actions">
          <button id="save-category-btn" class="glass-button">Save</button>
          <button id="cancel-category-btn" class="glass-button secondary">Cancel</button>
        </div>
      </div>
    `;

    this.createSubPopup('Add Category', content, 'add-category-sub-popup');
  }

  showAddNoteSubPopup() {
    if (!this.currentCategory) {
      this.showAlert('Please select a category first');
      return;
    }

    const content = `
      <div class="sub-popup-content">
        <h3>Add New Note</h3>
        <div class="form-group">
          <label for="note-title">Title:</label>
          <input type="text" id="note-title" class="glass-input" placeholder="Enter note title">
        </div>
        <div class="form-group">
          <label for="note-category">Category:</label>
          <select id="note-category" class="glass-input">
            ${this.categories.map(cat => 
              `<option value="${this.escapeHtml(cat)}" ${cat === this.currentCategory ? 'selected' : ''}>${this.escapeHtml(cat)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="note-content">Content:</label>
          <textarea id="note-content" class="glass-input" rows="8" placeholder="Enter note content"></textarea>
        </div>
        <div class="form-actions">
          <button id="save-note-btn" class="glass-button">Save</button>
          <button id="cancel-note-btn" class="glass-button secondary">Cancel</button>
        </div>
      </div>
    `;

    this.createSubPopup('Add Note', content, 'add-note-sub-popup');
  }

  showEditCategorySubPopup(category) {
    const content = `
      <div class="sub-popup-content">
        <h3>Edit Category</h3>
        <div class="form-group">
          <label for="edit-category-name">Category Name:</label>
          <input type="text" id="edit-category-name" class="glass-input" value="${this.escapeHtml(category)}" data-old-name="${this.escapeHtml(category)}">
        </div>
        <div class="form-actions">
          <button id="update-category-btn" class="glass-button">Update</button>
          <button id="cancel-edit-category-btn" class="glass-button secondary">Cancel</button>
        </div>
      </div>
    `;

    this.createSubPopup('Edit Category', content, 'edit-category-sub-popup');
  }

  showDeleteCategorySubPopup(category) {
    const noteCount = this.notes.filter(note => note.category === category).length;
    
    const content = `
      <div class="sub-popup-content">
        <h3>Delete Category</h3>
        <p>Are you sure you want to delete the category "${this.escapeHtml(category)}"?</p>
        ${noteCount > 0 ? `<p class="warning">⚠️ This will also delete ${noteCount} note(s) in this category.</p>` : ''}
        <div class="form-actions">
          <button id="confirm-delete-category-btn" class="glass-button danger" data-category="${this.escapeHtml(category)}">Delete</button>
          <button id="cancel-delete-category-btn" class="glass-button secondary">Cancel</button>
        </div>
      </div>
    `;

    this.createSubPopup('Delete Category', content, 'delete-category-sub-popup');
  }

  showEditNoteSubPopup(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    const content = `
      <div class="sub-popup-content">
        <h3>Edit Note</h3>
        <div class="form-group">
          <label for="edit-note-title">Title:</label>
          <input type="text" id="edit-note-title" class="glass-input" value="${this.escapeHtml(note.title)}" data-note-id="${noteId}">
        </div>
        <div class="form-group">
          <label for="edit-note-category">Category:</label>
          <select id="edit-note-category" class="glass-input">
            ${this.categories.map(cat => 
              `<option value="${this.escapeHtml(cat)}" ${cat === note.category ? 'selected' : ''}>${this.escapeHtml(cat)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="edit-note-content">Content:</label>
          <textarea id="edit-note-content" class="glass-input" rows="8">${this.escapeHtml(note.content)}</textarea>
        </div>
        <div class="form-actions">
          <button id="update-note-btn" class="glass-button">Update</button>
          <button id="cancel-edit-note-btn" class="glass-button secondary">Cancel</button>
        </div>
      </div>
    `;

    this.createSubPopup('Edit Note', content, 'edit-note-sub-popup');
  }

  showDeleteNoteSubPopup(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    const content = `
      <div class="sub-popup-content">
        <h3>Delete Note</h3>
        <p>Are you sure you want to delete the note "${this.escapeHtml(note.title)}"?</p>
        <div class="form-actions">
          <button id="confirm-delete-note-btn" class="glass-button danger" data-note-id="${noteId}">Delete</button>
          <button id="cancel-delete-note-btn" class="glass-button secondary">Cancel</button>
        </div>
      </div>
    `;

    this.createSubPopup('Delete Note', content, 'delete-note-sub-popup');
  }

  showNoteDetailSubPopup(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    const content = `
      <div class="sub-popup-content">
        <h3>${this.escapeHtml(note.title)}</h3>
        <div class="note-detail-meta">
          <span class="note-category">📁 ${this.escapeHtml(note.category)}</span>
          <span class="note-date">📅 ${new Date(note.updatedAt).toLocaleDateString()}</span>
        </div>
        <div class="note-detail-content">
          ${this.escapeHtml(note.content).replace(/\n/g, '<br>')}
        </div>
        <div class="form-actions">
          <button id="edit-note-detail-btn" class="glass-button" data-note-id="${noteId}">Edit</button>
          <button id="close-note-detail-btn" class="glass-button secondary">Close</button>
        </div>
      </div>
    `;

    this.createSubPopup('Note Detail', content, 'note-detail-sub-popup');
  }


  // ==================== SEARCH FUNCTIONALITY ====================

  performSearch(query) {
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;

    if (!query.trim()) {
      this.updateNotesList();
      return;
    }

    const filteredNotes = this.notes.filter(note => 
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase())
    );

    if (filteredNotes.length === 0) {
      notesList.innerHTML = '<p class="no-notes">No notes found matching your search</p>';
    } else {
      const sortedNotes = filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      notesList.innerHTML = sortedNotes.map(note => `
        <div class="note-item" data-note-id="${note.id}">
          <div class="note-content">
            <h4 class="note-title">${this.escapeHtml(note.title)}</h4>
            <p class="note-preview">${this.escapeHtml(this.truncateText(note.content, 100))}</p>
            <small class="note-date">${new Date(note.updatedAt).toLocaleDateString()}</small>
          </div>
          <div class="note-actions">
            <button class="note-edit-btn" data-note-id="${note.id}" title="Edit">✏️</button>
            <button class="note-delete-btn" data-note-id="${note.id}" title="Delete">🗑️</button>
          </div>
        </div>
      `).join('');
    }
  }

  // ==================== REFRESH MANAGEMENT ====================

  initializeNotesManager() {
    if (this.currentCategory) {
      this.updateNotesList();
    } else {
      const notesList = document.getElementById('notes-list');
      if (notesList) {
        notesList.innerHTML = '<p class="no-notes">Select a category to view notes</p>';
      }
    }
  }

  forceRefreshAllLists() {
    // Update categories list
    const categoriesList = document.getElementById('categories-list');
    if (categoriesList) {
      categoriesList.innerHTML = this.renderCategoriesListHTML();
    }

    // Update notes list
    this.updateNotesList();
  }

  setupPeriodicMonitoring() {
    // Clear existing interval to prevent memory leaks
    if (this.notesListCheckInterval) {
      clearInterval(this.notesListCheckInterval);
    }

    this.notesListCheckInterval = setInterval(() => {
      const notesList = document.getElementById('notes-list');
      if (notesList && this.currentCategory) {
        const categoryNotes = this.notes.filter(note => note.category === this.currentCategory);
        const currentContent = notesList.innerHTML;
        
        if (currentContent.includes('Select a category') || 
            (categoryNotes.length > 0 && !currentContent.includes('note-item'))) {
          this.forceRefreshAllLists();
        }
      }
    }, 3000);
  }

  cleanupEventListeners() {
    if (this.globalClickListener) {
      document.removeEventListener('click', this.globalClickListener, true);
      this.globalClickListener = null;
    }

    if (this.notesListCheckInterval) {
      clearInterval(this.notesListCheckInterval);
      this.notesListCheckInterval = null;
    }

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
      this.updateDebounceTimer = null;
    }
  }

  // ==================== UTILITY METHODS ====================

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  editNoteFromDetail() {
    const noteId = document.getElementById('edit-note-detail-btn')?.dataset.noteId;
    if (noteId) {
      this.closeSubPopup();
      setTimeout(() => {
        this.showEditNoteSubPopup(noteId);
      }, 100);
    }
  }

  // ==================== STORAGE METHODS ====================

  async getStoredData(key) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] || null);
        });
      } else {
        resolve(JSON.parse(localStorage.getItem(key) || 'null'));
      }
    });
  }

  async setStoredData(key, value) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, resolve);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      }
    });
  }

  // ==================== CLEANUP ====================

  destroy() {
    this.cleanupEventListeners();
    this.isInitialized = false;
  }

  // Enhanced cleanup method to prevent memory leaks
  cleanup() {
    // Clear all timers
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
      this.updateDebounceTimer = null;
    }
    
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
    
    if (this.notesListCheckInterval) {
      clearInterval(this.notesListCheckInterval);
      this.notesListCheckInterval = null;
    }

    // Cleanup event listeners
    this.cleanupEventListeners();

    this.isInitialized = false;
    console.log('🧹 Notes Widget cleaned up');
  }
}

export { NotesWidget };