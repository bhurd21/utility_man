/**
 * Content formatters for the Grid Solver extension
 */

window.GridSolverFormatter = {
  /**
   * Creates a single player row in the solutions table
   */
  createPlayerRow(player, index) {
    const colors = GridSolverTheme.getColors();
    const displayName = player.name.length > 20 ? player.name.substring(0, 20) + '..' : player.name;
    const rowBg = index % 2 ? colors.rowAlt : 'transparent';
    const copyButton = GridSolverUI.createCopyButton(player.name);
    const bbrefLink = GridSolverUI.createBBRefLink(player.bbref_id);
    
    return `<div style="display: flex; align-items: center; margin-bottom: 2px; background-color: ${rowBg};">
      <div style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: left; margin-right: 4px;">
        ${copyButton}
      </div>
      <span style="width: 32%; cursor: default; color: ${colors.text};">${displayName}</span>
      <span style="width: 20%; cursor: default; color: ${colors.text};">${player.pro_career || ''}</span>
      <span style="width: 10%; cursor: default; color: ${colors.text};">${player.position || ''}</span>
      <span style="width: 14%; cursor: default; color: ${colors.text};">${player.age ? player.age + 'yo' : ''}</span>
      <span style="width: 11%; cursor: default;">${bbrefLink}</span>
      <span style="width: 10%; cursor: default; color: ${colors.text};">${player.lps || ''}</span>
    </div>`;
  },

  /**
   * Formats solutions into a complete table view
   */
  formatSolutionsTable(solutions, label, isHidden) {
    // Handle empty or invalid solutions
    if (!solutions?.length) {
      return this.formatUnsolvableCell(label, isHidden);
    }
    
    const validSolutions = solutions.filter(s => s?.name).slice(0, 15);
    
    if (!validSolutions.length) {
      return this.formatUnsolvableCell(label, isHidden);
    }
    
    // Create header with result count
    const header = GridSolverUI.createHeader(`Utility Man - ${validSolutions.length} results`, label, { showToggle: true, isHidden });
    
    // Create table container
    const tableStart = `<div style="font-family: ui-monospace, monospace; font-size: 14px; margin-top: 12px;">`;
    const tableHeader = GridSolverUI.createTableHeader();
    
    // Create player rows
    const playerRows = validSolutions.map((player, index) => 
      this.createPlayerRow(player, index)
    ).join('');
    
    const tableEnd = '</div>';
    
    // Add "more results" indicator if needed
    const moreResults = solutions.length > 15 
      ? `<div style="font-family: ui-monospace, monospace; font-size: 12px; color: ${GridSolverTheme.getColors().textSecondary}; margin-top: 8px;">... and ${solutions.length - 15} more</div>`
      : '';
    
    return header + tableStart + tableHeader + playerRows + tableEnd + moreResults;
  },

  /**
   * Formats loading state content
   */
  formatLoadingState(label) {
    return GridSolverUI.createHeader('Utility Man - Loading...', label);
  },

  /**
   * Formats hidden state content
   */
  formatHiddenState(label) {
    return GridSolverUI.createHiddenContent(label);
  },
  
  /**
   * Formats unsolvable cell content
   */
  formatUnsolvableCell(label, isHidden) {
    const colors = GridSolverTheme.getColors();
    const header = GridSolverUI.createHeader('Utility Man - Unsolvable', label, { showToggle: true, isHidden });
    
    if (isHidden) {
      return header;
    }
    
    const unsolvableMessage = `<div style="font-family: ui-monospace, monospace; font-size: 12px; margin-top: 12px; padding: 12px; background-color: ${colors.backgroundSecondary}; border-radius: 4px; border: 1px solid ${colors.border}; text-align: center;">
      <div style="color: ${colors.warning}; margin-bottom: 8px; font-weight: bold;">Unsolvable Cell</div>
      <div style="color: ${colors.textSecondary}; margin-bottom: 8px; line-height: 1.4;">
        This cell is in the 2% of all cells that are currently unsolvable.
      </div>
      <a href="https://brennanhurd.com/utility_man/unsolvable_cell_notice" target="_blank" style="color: ${colors.accent}; text-decoration: none; font-size: 11px;">
        Click here to learn more →
      </a>
    </div>`;
    
    return header + unsolvableMessage;
  },

  /**
   * Formats a single solution cell
   */
  formatSolutionCell(solution) {
    const playerName = solution.name.length > 15 ? solution.name.substring(0, 15) + '..' : solution.name;
    const bbrefLink = GridSolverUI.createBBRefLink(solution.bbref_id);
    
    return `<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; border-bottom: 1px solid #374151;">
      <div style="flex: 1; color: #F9FAFB; font-weight: 500;">${playerName}</div>
      <div style="width: 100px; text-align: right;">
        <span style="color: #60A5FA; font-weight: 500;">${solution.lps || ''}</span>
      </div>
    </div>`;
  }
};
