/**
 * DOM manipulation utilities for the Grid Solver extension
 */

window.GridSolverDOM = {
  /**
   * Finds the search input in the grid dialog
   */
  findSearchInput(dialog) {
    return dialog.querySelector('input[placeholder="Search..."], input[aria-autocomplete="list"]');
  },

  /**
   * Finds the options list in the grid dialog
   */
  findOptionsList(dialog) {
    return dialog.querySelector('ul[role="listbox"], ul');
  },

  /**
   * Finds the open grid dialog
   */
  findOpenDialog() {
    return document.querySelector('[data-headlessui-state="open"]');
  },

  /**
   * Extracts and normalizes aria labels from grid elements
   */
  extractAriaLabels() {
    return [...document.querySelectorAll('[aria-label*=" + "]')]
      .map(el => el.getAttribute('aria-label'))
      .filter(label => label?.includes(' + '))
      .map(label => label.replace(/\s+/g, ' ').trim());
  },

  /**
   * Creates the main solution container div
   */
  createSolutionContainer() {
    const div = document.createElement('div');
    div.className = 'grid-solver-solutions';
    div.style.cssText = `
      background: #374151; color: white; padding-left: 12px; padding-right: 12px; padding-bottom: 12px; padding-top: 0px; margin: 0;
      font: 11px/1.2 ui-monospace, monospace;
      max-height: 175px; overflow: auto; border-top: 1px solid #1f2937;
    `;
    return div;
  },

  /**
   * Inserts the solution div into the dialog at the appropriate position
   */
  insertSolutionDiv(dialog, solutionDiv) {
    const input = this.findSearchInput(dialog);
    const list = this.findOptionsList(dialog);
    
    if (list) {
      list.parentNode.insertBefore(solutionDiv, list);
    } else if (input) {
      input.parentNode.insertBefore(solutionDiv, input.nextElementSibling) || 
      input.parentNode.appendChild(solutionDiv);
    }
  },

  /**
   * Fills the search input with a player name and triggers events
   */
  fillSearchInput(playerName) {
    const input = this.findOpenDialog()?.querySelector('input[placeholder="Search..."], input[aria-autocomplete="list"]');
    
    if (input) {
      input.value = playerName;
      input.focus();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
};
