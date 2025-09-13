/**
 * CALCULATOR AND UNIT CONVERTER TOOL - Rewritten from Scratch
 * Clean, professional calculator with comprehensive unit conversion
 */

import { popupManager } from '../../../../components/Popup/popup-manager.js';

class CalculatorTool {
  constructor() {
    this.popup = null;
    this.currentMode = 'calculator';
    
    // Calculator state
    this.display = '0';
    this.previousValue = null;
    this.operator = null;
    this.waitingForOperand = false;
    this.expression = '';
    
    // Unit converter state
    this.currentCategory = 'length';
    this.conversionData = this.initializeConversionData();
    
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      this.createPopup();
      this.wireEventListeners();
      this.isInitialized = true;
      console.log('✅ Calculator Tool initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Calculator Tool:', error);
    }
  }

  createPopup() {
    const content = `
      <div class="calculator-popup-content">
        <div class="calculator-tabs">
          <button class="tab-btn active" data-tab="calculator">Calculator</button>
          <button class="tab-btn" data-tab="converter">Unit Converter</button>
        </div>
        
        <div class="calculator-content" id="calculator-content">
          <div class="calculator-display">
            <div class="display-expression" id="display-expression"></div>
            <div class="display-result" id="display-result">0</div>
          </div>
          
          <div class="calculator-buttons">
            <button class="calc-btn function" data-action="clear">C</button>
            <button class="calc-btn function" data-action="clear-entry">CE</button>
            <button class="calc-btn function" data-action="backspace">⌫</button>
            <button class="calc-btn operator" data-action="divide">÷</button>
            
            <button class="calc-btn number" data-action="7">7</button>
            <button class="calc-btn number" data-action="8">8</button>
            <button class="calc-btn number" data-action="9">9</button>
            <button class="calc-btn operator" data-action="multiply">×</button>
            
            <button class="calc-btn number" data-action="4">4</button>
            <button class="calc-btn number" data-action="5">5</button>
            <button class="calc-btn number" data-action="6">6</button>
            <button class="calc-btn operator" data-action="subtract">−</button>
            
            <button class="calc-btn number" data-action="1">1</button>
            <button class="calc-btn number" data-action="2">2</button>
            <button class="calc-btn number" data-action="3">3</button>
            <button class="calc-btn operator" data-action="add">+</button>
            
            <button class="calc-btn number" data-action="0">0</button>
            <button class="calc-btn number" data-action="decimal">.</button>
            <button class="calc-btn function" data-action="percentage">%</button>
            <button class="calc-btn operator equals" data-action="equals">=</button>
          </div>
          
          <div class="calculator-advanced">
            <button class="calc-btn advanced" data-action="sqrt">√</button>
            <button class="calc-btn advanced" data-action="square">x²</button>
            <button class="calc-btn advanced" data-action="power">x^y</button>
            <button class="calc-btn advanced" data-action="sin">sin</button>
            <button class="calc-btn advanced" data-action="cos">cos</button>
            <button class="calc-btn advanced" data-action="tan">tan</button>
            <button class="calc-btn advanced" data-action="log">log</button>
            <button class="calc-btn advanced" data-action="ln">ln</button>
            <button class="calc-btn advanced" data-action="pi">π</button>
            <button class="calc-btn advanced" data-action="e">e</button>
            <button class="calc-btn advanced" data-action="factorial">n!</button>
            <button class="calc-btn advanced" data-action="inverse">1/x</button>
          </div>
        </div>
        
        <div class="converter-content" id="converter-content" style="display: none;">
          <div class="converter-categories">
            <button class="category-btn active" data-category="length">Length</button>
            <button class="category-btn" data-category="weight">Weight</button>
            <button class="category-btn" data-category="temperature">Temperature</button>
            <button class="category-btn" data-category="area">Area</button>
            <button class="category-btn" data-category="volume">Volume</button>
            <button class="category-btn" data-category="time">Time</button>
          </div>
          
          <div class="converter-form">
            <div class="converter-input">
              <input type="number" id="converter-value" placeholder="Enter value" class="glass-input">
              <select id="converter-from" class="glass-select"></select>
            </div>
            
            <div class="converter-arrow">
              <button class="swap-btn" id="swap-units">⇄</button>
            </div>
            
            <div class="converter-output">
              <input type="number" id="converter-result" placeholder="Result" class="glass-input" readonly>
              <select id="converter-to" class="glass-select"></select>
            </div>
          </div>
        </div>
      </div>
    `;

    this.popup = popupManager.createPopup('Calculator & Unit Converter', content, {
      id: 'calculator-popup',
      size: 'large'
    });
  }

  wireEventListeners() {
    const toolButton = document.getElementById('calculator-tool');
    if (!toolButton) return;

    // Tool button click
    toolButton.addEventListener('click', () => {
      this.openPopup();
    });

    // Popup event listeners
    if (this.popup) {
      const popupBody = this.popup.body;
      
      // Tab switching
      const tabBtns = popupBody.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.switchTab(btn.dataset.tab);
        });
      });

      // Calculator buttons
      const calcBtns = popupBody.querySelectorAll('.calc-btn');
      calcBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.handleCalculatorInput(btn.dataset.action);
          this.addButtonPressEffect(btn);
        });
      });

      // Converter category buttons
      const categoryBtns = popupBody.querySelectorAll('.category-btn');
      categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.switchCategory(btn.dataset.category);
        });
      });

      // Converter inputs - Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const converterValue = popupBody.querySelector('#converter-value');
        const converterFrom = popupBody.querySelector('#converter-from');
        const converterTo = popupBody.querySelector('#converter-to');
        const swapBtn = popupBody.querySelector('#swap-units');

        if (converterValue) {
          // Remove readonly attribute if it exists
          converterValue.removeAttribute('readonly');
          converterValue.disabled = false;
          
          converterValue.addEventListener('input', (e) => {
            this.convertUnits();
          });
          
          converterValue.addEventListener('click', (e) => {
            e.target.focus();
          });
        }

        if (converterFrom && converterTo) {
          converterFrom.addEventListener('change', () => {
            this.convertUnits();
          });
          converterTo.addEventListener('change', () => {
            this.convertUnits();
          });
        }

        if (swapBtn) {
          swapBtn.addEventListener('click', () => {
            this.swapUnits();
          });
        }
      }, 100);

      // Keyboard support
      document.addEventListener('keydown', (e) => {
        this.handleKeyboardInput(e);
      });
    }
  }

  addButtonPressEffect(button) {
    button.classList.add('pressed');
    setTimeout(() => {
      button.classList.remove('pressed');
    }, 100);
  }

  handleKeyboardInput(e) {
    // Don't interfere with input elements
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    const key = e.key;
    
    // Prevent default for calculator keys
    if ('0123456789+-*/.=Enter'.includes(key) || key === 'Backspace' || key === 'Escape') {
      e.preventDefault();
    }

    if ('0123456789'.includes(key)) {
      this.handleCalculatorInput(key);
    } else if (key === '.') {
      this.handleCalculatorInput('decimal');
    } else if (key === '+') {
      this.handleCalculatorInput('add');
    } else if (key === '-') {
      this.handleCalculatorInput('subtract');
    } else if (key === '*') {
      this.handleCalculatorInput('multiply');
    } else if (key === '/') {
      this.handleCalculatorInput('divide');
    } else if (key === 'Enter' || key === '=') {
      this.handleCalculatorInput('equals');
    } else if (key === 'Backspace') {
      this.handleCalculatorInput('backspace');
    } else if (key === 'Escape') {
      this.handleCalculatorInput('clear');
    }
  }

  openPopup() {
    if (!this.popup) return;
    
    popupManager.openPopup(this.popup);
    
    // Initialize converter after popup is opened
    setTimeout(() => {
      this.switchCategory('length');
    }, 200);
  }

  switchTab(tab) {
    const popupBody = this.popup.body;
    const tabBtns = popupBody.querySelectorAll('.tab-btn');
    const calculatorContent = popupBody.querySelector('#calculator-content');
    const converterContent = popupBody.querySelector('#converter-content');

    // Update active tab
    tabBtns.forEach(btn => btn.classList.remove('active'));
    popupBody.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Show/hide content
    if (tab === 'calculator') {
      calculatorContent.style.display = 'block';
      converterContent.style.display = 'none';
    } else {
      calculatorContent.style.display = 'none';
      converterContent.style.display = 'block';
      
      // Re-initialize converter when switching to converter tab
      setTimeout(() => {
        this.switchCategory(this.currentCategory || 'length');
        // Unit converter tab activated
        
        // Ensure input is ready
        const input = popupBody.querySelector('#converter-value');
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }

  // ===== CALCULATOR METHODS =====
  handleCalculatorInput(action) {
    switch (action) {
      case 'clear':
        this.clear();
        break;
      case 'clear-entry':
        this.clearEntry();
        break;
      case 'backspace':
        this.backspace();
        break;
      case 'decimal':
        this.inputDecimal();
        break;
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide':
        this.inputOperator(action);
        break;
      case 'equals':
        this.calculate();
        break;
      case 'percentage':
        this.percentage();
        break;
      case 'sqrt':
        this.squareRoot();
        break;
      case 'square':
        this.square();
        break;
      case 'power':
        this.power();
        break;
      case 'sin':
        this.sin();
        break;
      case 'cos':
        this.cos();
        break;
      case 'tan':
        this.tan();
        break;
      case 'log':
        this.log();
        break;
      case 'ln':
        this.ln();
        break;
      case 'pi':
        this.pi();
        break;
      case 'e':
        this.e();
        break;
      case 'factorial':
        this.factorial();
        break;
      case 'inverse':
        this.inverse();
        break;
      default:
        if (action >= '0' && action <= '9') {
          this.inputNumber(action);
        }
    }

    this.updateDisplay();
  }

  inputNumber(num) {
    if (this.waitingForOperand) {
      this.display = num;
      this.waitingForOperand = false;
    } else {
      this.display = this.display === '0' ? num : this.display + num;
    }
  }

  inputDecimal() {
    if (this.waitingForOperand) {
      this.display = '0.';
      this.waitingForOperand = false;
    } else if (this.display.indexOf('.') === -1) {
      this.display += '.';
    }
  }

  inputOperator(nextOperator) {
    const inputValue = parseFloat(this.display);

    if (this.previousValue === null) {
      this.previousValue = inputValue;
    } else if (this.operator) {
      const currentValue = this.previousValue || 0;
      const newValue = this.performCalculation(currentValue, inputValue, this.operator);

      this.display = String(newValue);
      this.previousValue = newValue;
    }

    this.waitingForOperand = true;
    this.operator = nextOperator;
  }

  calculate() {
    const inputValue = parseFloat(this.display);

    if (this.previousValue !== null && this.operator) {
      const newValue = this.performCalculation(this.previousValue, inputValue, this.operator);
      this.display = String(newValue);
      this.previousValue = null;
      this.operator = null;
      this.waitingForOperand = true;
    }
  }

  performCalculation(firstValue, secondValue, operator) {
    switch (operator) {
      case 'add':
        return firstValue + secondValue;
      case 'subtract':
        return firstValue - secondValue;
      case 'multiply':
        return firstValue * secondValue;
      case 'divide':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      default:
        return secondValue;
    }
  }

  clear() {
    this.display = '0';
    this.previousValue = null;
    this.operator = null;
    this.waitingForOperand = false;
    this.expression = '';
  }

  clearEntry() {
    this.display = '0';
  }

  backspace() {
    if (this.display.length > 1) {
      this.display = this.display.slice(0, -1);
    } else {
      this.display = '0';
    }
  }

  percentage() {
    this.display = String(parseFloat(this.display) / 100);
  }

  // Advanced functions
  squareRoot() {
    const value = parseFloat(this.display);
    if (value < 0) {
      this.display = 'Error';
    } else {
      this.display = String(Math.sqrt(value));
    }
  }

  square() {
    const value = parseFloat(this.display);
    this.display = String(value * value);
  }

  power() {
    // For now, square the number. Could be enhanced for x^y
    this.square();
  }

  sin() {
    const value = parseFloat(this.display);
    this.display = String(Math.sin(value * Math.PI / 180));
  }

  cos() {
    const value = parseFloat(this.display);
    this.display = String(Math.cos(value * Math.PI / 180));
  }

  tan() {
    const value = parseFloat(this.display);
    this.display = String(Math.tan(value * Math.PI / 180));
  }

  log() {
    const value = parseFloat(this.display);
    if (value <= 0) {
      this.display = 'Error';
    } else {
      this.display = String(Math.log10(value));
    }
  }

  ln() {
    const value = parseFloat(this.display);
    if (value <= 0) {
      this.display = 'Error';
    } else {
      this.display = String(Math.log(value));
    }
  }

  pi() {
    this.display = String(Math.PI);
  }

  e() {
    this.display = String(Math.E);
  }

  factorial() {
    const value = parseInt(this.display);
    if (value < 0 || value > 170) {
      this.display = 'Error';
    } else {
      let result = 1;
      for (let i = 2; i <= value; i++) {
        result *= i;
      }
      this.display = String(result);
    }
  }

  inverse() {
    const value = parseFloat(this.display);
    if (value === 0) {
      this.display = 'Error';
    } else {
      this.display = String(1 / value);
    }
  }

  updateDisplay() {
    const popupBody = this.popup.body;
    const displayResult = popupBody.querySelector('#display-result');
    const displayExpression = popupBody.querySelector('#display-expression');

    if (displayResult) {
      displayResult.textContent = this.display;
    }

    if (displayExpression) {
      let expression = '';
      if (this.previousValue !== null && this.operator) {
        const operatorSymbols = {
          'add': '+',
          'subtract': '−',
          'multiply': '×',
          'divide': '÷'
        };
        expression = `${this.previousValue} ${operatorSymbols[this.operator]}`;
      }
      displayExpression.textContent = expression;
    }
  }

  // ===== UNIT CONVERTER METHODS =====
  initializeConversionData() {
    return {
      length: [
        { value: 'mm', label: 'Millimeter (mm)', factor: 0.001 },
        { value: 'cm', label: 'Centimeter (cm)', factor: 0.01 },
        { value: 'm', label: 'Meter (m)', factor: 1 },
        { value: 'km', label: 'Kilometer (km)', factor: 1000 },
        { value: 'in', label: 'Inch (in)', factor: 0.0254 },
        { value: 'ft', label: 'Foot (ft)', factor: 0.3048 },
        { value: 'yd', label: 'Yard (yd)', factor: 0.9144 },
        { value: 'mi', label: 'Mile (mi)', factor: 1609.34 }
      ],
      weight: [
        { value: 'mg', label: 'Milligram (mg)', factor: 0.001 },
        { value: 'g', label: 'Gram (g)', factor: 1 },
        { value: 'kg', label: 'Kilogram (kg)', factor: 1000 },
        { value: 'oz', label: 'Ounce (oz)', factor: 28.3495 },
        { value: 'lb', label: 'Pound (lb)', factor: 453.592 },
        { value: 'ton', label: 'Ton (t)', factor: 1000000 }
      ],
      temperature: [
        { value: 'c', label: 'Celsius (°C)', factor: 'celsius' },
        { value: 'f', label: 'Fahrenheit (°F)', factor: 'fahrenheit' },
        { value: 'k', label: 'Kelvin (K)', factor: 'kelvin' }
      ],
      area: [
        { value: 'mm2', label: 'Square Millimeter (mm²)', factor: 0.000001 },
        { value: 'cm2', label: 'Square Centimeter (cm²)', factor: 0.0001 },
        { value: 'm2', label: 'Square Meter (m²)', factor: 1 },
        { value: 'km2', label: 'Square Kilometer (km²)', factor: 1000000 },
        { value: 'in2', label: 'Square Inch (in²)', factor: 0.00064516 },
        { value: 'ft2', label: 'Square Foot (ft²)', factor: 0.092903 },
        { value: 'yd2', label: 'Square Yard (yd²)', factor: 0.836127 },
        { value: 'acre', label: 'Acre', factor: 4046.86 }
      ],
      volume: [
        { value: 'ml', label: 'Milliliter (ml)', factor: 0.001 },
        { value: 'l', label: 'Liter (l)', factor: 1 },
        { value: 'm3', label: 'Cubic Meter (m³)', factor: 1000 },
        { value: 'in3', label: 'Cubic Inch (in³)', factor: 0.0163871 },
        { value: 'ft3', label: 'Cubic Foot (ft³)', factor: 28.3168 },
        { value: 'gal', label: 'Gallon (gal)', factor: 3.78541 }
      ],
      time: [
        { value: 'ms', label: 'Millisecond (ms)', factor: 0.001 },
        { value: 's', label: 'Second (s)', factor: 1 },
        { value: 'min', label: 'Minute (min)', factor: 60 },
        { value: 'h', label: 'Hour (h)', factor: 3600 },
        { value: 'day', label: 'Day', factor: 86400 },
        { value: 'week', label: 'Week', factor: 604800 },
        { value: 'month', label: 'Month', factor: 2629746 },
        { value: 'year', label: 'Year', factor: 31556952 }
      ]
    };
  }

  switchCategory(category) {
    const popupBody = this.popup.body;
    const categoryBtns = popupBody.querySelectorAll('.category-btn');
    const converterFrom = popupBody.querySelector('#converter-from');
    const converterTo = popupBody.querySelector('#converter-to');

    // Update active category
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    popupBody.querySelector(`[data-category="${category}"]`).classList.add('active');

    // Update unit options
    const units = this.conversionData[category];
    this.updateUnitSelects(converterFrom, converterTo, units);
    
    this.currentCategory = category;
  }

  updateUnitSelects(fromSelect, toSelect, units) {
    if (!fromSelect || !toSelect) return;

    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';

    units.forEach(unit => {
      const fromOption = document.createElement('option');
      fromOption.value = unit.value;
      fromOption.textContent = unit.label;
      fromSelect.appendChild(fromOption);

      const toOption = document.createElement('option');
      toOption.value = unit.value;
      toOption.textContent = unit.label;
      toSelect.appendChild(toOption);
    });

    // Set default selections
    if (units.length > 1) {
      fromSelect.selectedIndex = 0;
      toSelect.selectedIndex = 1;
    }
  }

  convertUnits() {
    const popupBody = this.popup.body;
    const valueInput = popupBody.querySelector('#converter-value');
    const fromSelect = popupBody.querySelector('#converter-from');
    const toSelect = popupBody.querySelector('#converter-to');
    const resultInput = popupBody.querySelector('#converter-result');

    if (!valueInput || !fromSelect || !toSelect || !resultInput) {
      return;
    }

    const value = parseFloat(valueInput.value);
    const fromUnit = fromSelect.value;
    const toUnit = toSelect.value;

    if (isNaN(value) || fromUnit === toUnit) {
      resultInput.value = value || '';
      return;
    }

    const result = this.performUnitConversion(value, fromUnit, toUnit);
    const formattedResult = result.toFixed(6).replace(/\.?0+$/, '');
    resultInput.value = formattedResult;
  }

  performUnitConversion(value, fromUnit, toUnit) {
    // Handle temperature conversions specially
    if (this.currentCategory === 'temperature') {
      return this.convertTemperature(value, fromUnit, toUnit);
    }

    // Get conversion factors
    const fromUnitData = this.conversionData[this.currentCategory].find(u => u.value === fromUnit);
    const toUnitData = this.conversionData[this.currentCategory].find(u => u.value === toUnit);

    if (!fromUnitData || !toUnitData) return value;

    // Convert to base unit, then to target unit
    const baseValue = value * fromUnitData.factor;
    return baseValue / toUnitData.factor;
  }

  convertTemperature(value, fromUnit, toUnit) {
    let celsius;
    
    // Convert to Celsius first
    switch (fromUnit) {
      case 'c':
        celsius = value;
        break;
      case 'f':
        celsius = (value - 32) * 5/9;
        break;
      case 'k':
        celsius = value - 273.15;
        break;
    }
    
    // Convert from Celsius to target unit
    switch (toUnit) {
      case 'c':
        return celsius;
      case 'f':
        return celsius * 9/5 + 32;
      case 'k':
        return celsius + 273.15;
    }
  }

  swapUnits() {
    const popupBody = this.popup.body;
    const fromSelect = popupBody.querySelector('#converter-from');
    const toSelect = popupBody.querySelector('#converter-to');
    const valueInput = popupBody.querySelector('#converter-value');
    const resultInput = popupBody.querySelector('#converter-result');

    if (!fromSelect || !toSelect || !valueInput || !resultInput) return;

    // Swap the selected units
    const tempValue = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = tempValue;

    // Swap the values
    const tempInput = valueInput.value;
    valueInput.value = resultInput.value;
    resultInput.value = tempInput;

    // Recalculate
    this.convertUnits();
  }

  cleanup() {
    // Cleanup if needed
  }
}

// Initialize and export
export async function initCalculatorTool() {
  const tool = new CalculatorTool();
  await tool.init();
  return tool;
}