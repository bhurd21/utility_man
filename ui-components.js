/**
 * UI component generators for the Grid Solver extension
 */

window.GridSolverUI = {
  /**
   * Creates the eye icon SVG for visibility toggle
   */
  createEyeIcon(isHidden) {
    return isHidden 
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  },

  /**
   * Creates a header line - single function to replace multiple header functions
   */
  createHeader(leftText, rightText, options = {}) {
    const { showToggle = false, isHidden = false } = options;
    const colors = GridSolverTheme.getColors();
    
    // Extract result count from leftText for new two-line format
    const resultMatch = leftText.match(/(\d+) results?|Loading\.\.\.|No valid data|Unsolvable/);
    const resultCount = resultMatch ? resultMatch[0] : '';
    
    if (!showToggle) {
      // Simple two-line format without toggle
      return `<div style="position: sticky; top: 0; background: ${colors.background}; z-index: 10; padding-top: 12px; padding-bottom: 4px;">
        <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 16px; font-weight: bold; color: ${colors.text};">Utility Man</span>
          <span style="font-size: 10px; color: ${colors.textSecondary};">v1.1.1</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: ${colors.text};">
          <span class="grid-label">"${rightText}"</span>
          <span>${resultCount}</span>
        </div>
      </div>`;
    }
    
    // Two-line format with toggle
    const eyeIcon = this.createEyeIcon(isHidden);
    const title = isHidden ? 'Show solutions' : 'Hide solutions';
    return `<div style="position: sticky; top: 0; background: ${colors.background}; z-index: 10; padding-top: 12px; padding-bottom: 4px;">
      <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px;">
        <span style="font-size: 16px; font-weight: bold; color: ${colors.text};">Utility Man</span>
        <span style="font-size: 10px; color: ${colors.textSecondary};">v1.1.1</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="grid-toggle-btn" style="background: none; border: none; color: ${colors.text}; cursor: pointer; padding: 2px; display: flex; align-items: center;" title="${title}">${eyeIcon}</button>
          <span class="grid-label" style="color: ${colors.text};">"${rightText}"</span>
        </div>
        ${!isHidden ? `<span style="color: ${colors.text};">${resultCount}</span>` : ''}
      </div>
    </div>`;
  },

  /**
   * Creates the hidden state content
   */
  createHiddenContent(label) {
    const colors = GridSolverTheme.getColors();
    return this.createHeader('Utility Man', label, { showToggle: true, isHidden: true }) + 
      `<div style="text-align: center; padding-top: 10px; padding-bottom: 0px; color: ${colors.textSecondary};">Solutions hidden - click eye to reveal</div>`;
  },

  /**
   * Creates a copy button for player names
   */
  createCopyButton(playerName) {
    const colors = GridSolverTheme.getColors();
    return `<button class="grid-copy-btn" data-player-name="${playerName}" style="width: 75%; height: 75%; background: ${colors.button}; border: 1px solid ${colors.textSecondary}; color: ${colors.text}; cursor: pointer; font-size: 10px;"></button>`;
  },

  /**
   * Creates a Baseball Reference link
   */
  createBBRefLink(bbrefId) {
    if (!bbrefId) return '';
    const colors = GridSolverTheme.getColors();
    return `<a href="https://www.baseball-reference.com/players/${bbrefId[0]}/${bbrefId}.shtml" target="_blank" style="color: ${colors.accent}; cursor: pointer; text-decoration: none;">🔗</a>`;
  },

  /**
   * Creates the table header row
   */
  createTableHeader() {
    const colors = GridSolverTheme.getColors();
    return `<div style="color: ${colors.textSecondary}; margin-bottom: 8px; display: flex;">
      <span style="width: 3%;"></span>
      <span style="width: 32%;">Player</span>
      <span style="width: 20%;">Pro Career</span>
      <span style="width: 10%;">Pos</span>
      <span style="width: 14%;">Age</span>
      <span style="width: 11%;">BRef</span>
      <span style="width: 10%;">LPS</span>
    </div>`;
  }
};
