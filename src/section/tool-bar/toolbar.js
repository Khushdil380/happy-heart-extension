/**
 * TOOL BAR MANAGER
 * Manages the bottom-right toolbar with all tools
 */

import { initBackgroundTool } from './background-image/background-image.js';
import { initCalculatorTool } from './calculator-and-unit-converter/calculator-and-unit-converter.js';
import { initFileConverterTool } from './file-converter/file-converter.js';
import GamesTool from './games/games.js';

class ToolBar {
  constructor() {
    this.tools = new Map();
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Initialize tool bar UI
      this.initToolBarUI();
      
      // Initialize individual tools
      await this.initializeTools();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ Tool Bar initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Tool Bar:', error);
    }
  }

  async initializeTools() {
    try {
      // Initialize background tool
      const backgroundTool = await initBackgroundTool();
      this.registerTool('background', backgroundTool);
      
      // Initialize calculator tool
      const calculatorTool = await initCalculatorTool();
      this.registerTool('calculator', calculatorTool);
      
      // Initialize file converter tool
      const fileConverterTool = await initFileConverterTool();
      this.registerTool('file-converter', fileConverterTool);
      
      // Initialize games tool
      const gamesTool = new GamesTool();
      gamesTool.init();
      this.registerTool('games', gamesTool);
      
    } catch (error) {
      console.error('❌ Failed to initialize tools:', error);
    }
  }

  initToolBarUI() {
    const toolBar = document.getElementById('tool-bar');
    if (!toolBar) return;

    // Add animation classes
    toolBar.classList.add('animate-fade-in');
    
    // Add hover effects
    const toolItems = toolBar.querySelectorAll('.tool-item');
    toolItems.forEach((item, index) => {
      item.style.animationDelay = `${index * 0.1}s`;
    });
  }

  setupEventListeners() {
    const toolBar = document.getElementById('tool-bar');
    if (!toolBar) return;

    // Add click handlers for each tool
    const tools = [
      { id: 'background-tool', name: 'background' },
      { id: 'file-converter-tool', name: 'file-converter' },
      { id: 'games-tool', name: 'games' },
      { id: 'calculator-tool', name: 'calculator' }
    ];

    tools.forEach(tool => {
      const element = document.getElementById(tool.id);
      if (element) {
        element.addEventListener('click', () => {
          this.handleToolClick(tool.name);
        });
      }
    });
  }

  handleToolClick(toolName) {
    console.log(`Tool clicked: ${toolName}`);
    // Get the tool instance and open it directly
    const tool = this.getTool(toolName);
    console.log('Found tool:', tool);
    if (tool && tool.openPopup) {
      console.log('Tool has openPopup method, calling it...');
      tool.openPopup();
    } else {
      console.log('Tool does not have openPopup method, emitting event...');
      // Emit event for tools that don't have direct openPopup method
      const event = new CustomEvent('tool:clicked', {
        detail: { tool: toolName }
      });
      document.dispatchEvent(event);
    }
  }

  registerTool(name, toolInstance) {
    this.tools.set(name, toolInstance);
  }

  getTool(name) {
    return this.tools.get(name);
  }

  cleanup() {
    this.tools.clear();
  }
}

// Initialize and export
export async function initToolBar() {
  const toolBar = new ToolBar();
  await toolBar.init();
  return toolBar;
}
