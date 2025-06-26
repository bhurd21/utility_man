/**
 * Content formatters for the Grid Solver extension
 */

window.GridSolverFormatter = {
  /**
   * Creates a single player row in the solutions table
   */
  createPlayerRow(player, index) {
    const displayName = player.name.length > 20 ? player.name.substring(0, 20) + '..' : player.name;
    const rowBg = index % 2 ? '#4B5563' : 'transparent';
    const copyButton = GridSolverUI.createCopyButton(player.name);
    const bbrefLink = GridSolverUI.createBBRefLink(player.bbref_id);
    
    return `<div style="display: flex; align-items: center; margin-bottom: 2px; background-color: ${rowBg};">
      <div style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: left; margin-right: 4px;">
        ${copyButton}
      </div>
      <span style="width: 32%; cursor: default;">${displayName}</span>
      <span style="width: 20%; cursor: default;">${player.pro_career || ''}</span>
      <span style="width: 10%; cursor: default;">${player.position || ''}</span>
      <span style="width: 14%; cursor: default;">${player.age ? player.age + 'yo' : ''}</span>
      <span style="width: 11%; cursor: default;">${bbrefLink}</span>
      <span style="width: 10%; cursor: default;">${player.lps || ''}</span>
    </div>`;
  },

  /**
   * Formats solutions into a complete table view
   */
  formatSolutionsTable(solutions, label, isHidden) {
    // Handle empty or invalid solutions
    if (!solutions?.length) {
      return GridSolverUI.createHeader('Utility Man - 0 results', label, { showToggle: true, isHidden });
    }
    
    const validSolutions = solutions.filter(s => s?.name).slice(0, 15);
    
    if (!validSolutions.length) {
      return GridSolverUI.createHeader('Utility Man - No valid data', label, { showToggle: true, isHidden });
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
      ? `<div style="font-family: ui-monospace, monospace; font-size: 12px; color: #9CA3AF; margin-top: 8px;">... and ${solutions.length - 15} more</div>`
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
  }
};
