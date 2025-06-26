// Global state
let gridSolutions = {};
let activeObserver = null;
let currentUrl = window.location.href;
let hideByDefault = false;
let isCurrentlyHidden = false;

// Initialize on page load
(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Handle messages from popup and service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'solve' || request.action === 'autoSolve') {
    if (request.action === 'solve') gridSolutions = {};
    loadSolutions().then(success => sendResponse({ success }));
    return true;
  } else if (request.action === 'updatePreference') {
    hideByDefault = request.hideByDefault;
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Initialize the extension
 */
function init() {
  setupEventListeners();
  setupUrlChangeDetection();
  loadUserPreferences();
  loadSolutions();
}

/**
 * Load solutions from API
 */
async function loadSolutions() {
  try {
    const labels = GridSolverDOM.extractAriaLabels();
    if (!labels.length) {
      // No grid elements found yet - this is normal, not an error
      console.log('Grid Solver: No grid elements found yet');
      return true; // Return true since this isn't an error condition
    }
    
    const response = await fetch(`https://brennanhurd.com/api/imgrid?questions=${encodeURIComponent(JSON.stringify(labels))}`);
    const data = await response.json();
    
    // Store solutions
    data.suggestions?.forEach(item => {
      if (item.label) gridSolutions[item.label] = item.suggestions || [];
    });
    
    return true;
  } catch (error) {
    console.error('Grid Solver Error:', error);
    return false;
  }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  document.addEventListener('click', handleAllClicks, true);
}

/**
 * Handle all click events in one place
 */
function handleAllClicks(event) {
  // Handle visibility toggle
  if (event.target.classList.contains('grid-toggle-btn') || event.target.closest('.grid-toggle-btn')) {
    handleToggleVisibility(event);
    return;
  }
  
  // Handle copy player name
  if (event.target.classList.contains('grid-copy-btn') || event.target.closest('.grid-copy-btn')) {
    handleCopyPlayer(event);
    return;
  }
  
  // Handle grid cell click
  const gridCell = event.target.closest('[aria-label*=" + "]');
  if (gridCell) {
    isCurrentlyHidden = hideByDefault;
    injectSolutions(gridCell.getAttribute('aria-label'));
    return;
  }
  
  // Handle dialog cleanup
  if (activeObserver && !GridSolverDOM.findOpenDialog()) {
    cleanupObserver();
  }
}

/**
 * Handle visibility toggle clicks
 */
function handleToggleVisibility(event) {
  event.stopPropagation();
  event.preventDefault();
  isCurrentlyHidden = !isCurrentlyHidden;
  
  const div = event.target.closest('.grid-solver-solutions');
  if (div) {
    const label = div.querySelector('.grid-label')?.textContent?.replace(/"/g, '') || '';
    updateSolutionContent(div, gridSolutions[label], label);
  }
}

/**
 * Handle copy player name clicks
 */
function handleCopyPlayer(event) {
  event.stopPropagation();
  event.preventDefault();
  
  const playerName = event.target.getAttribute('data-player-name');
  if (!playerName) return;

  GridSolverDOM.fillSearchInput(playerName);
  
  // Visual feedback
  const button = event.target;
  const originalContent = button.textContent;
  button.textContent = '✓';
  button.style.backgroundColor = '#4CAF50';
  
  setTimeout(() => {
    button.textContent = originalContent;
    button.style.backgroundColor = '#6B7280';
  }, 1000);
}

/**
 * Inject solutions into dialog
 */
function injectSolutions(ariaLabel) {
  cleanupObserver();

  const existingDialog = GridSolverDOM.findOpenDialog();
  if (existingDialog && !existingDialog.querySelector('.grid-solver-solutions')) {
    createAndInsertSolution(existingDialog, ariaLabel);
    return;
  }

  if (!existingDialog) {
    // Wait for dialog to appear
    activeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            const dialog = node.matches?.('[data-headlessui-state="open"]') ? node : 
                          node.querySelector?.('[data-headlessui-state="open"]');
            
            if (dialog && !dialog.querySelector('.grid-solver-solutions')) {
              createAndInsertSolution(dialog, ariaLabel);
              cleanupObserver();
              return;
            }
          }
        }
      }
    });
    
    activeObserver.observe(document.body, { childList: true, subtree: true });
    setTimeout(cleanupObserver, 3000);
  }
}

/**
 * Create and insert solution div
 */
function createAndInsertSolution(dialog, ariaLabel) {
  if (!GridSolverDOM.findSearchInput(dialog)) return;

  const label = ariaLabel.replace(/\s+/g, ' ').trim();
  const solutions = gridSolutions[label];
  
  const div = GridSolverDOM.createSolutionContainer();
  updateSolutionContent(div, solutions, label);
  GridSolverDOM.insertSolutionDiv(dialog, div);
}

/**
 * Update solution content based on visibility state
 */
function updateSolutionContent(div, solutions, label) {
  if (isCurrentlyHidden) {
    div.innerHTML = GridSolverFormatter.formatHiddenState(label);
  } else if (solutions) {
    div.innerHTML = GridSolverFormatter.formatSolutionsTable(solutions, label, isCurrentlyHidden);
  } else {
    div.innerHTML = GridSolverFormatter.formatLoadingState(label);
  }
}

/**
 * Cleanup mutation observer
 */
function cleanupObserver() {
  activeObserver?.disconnect();
  activeObserver = null;
}

/**
 * Setup URL change detection for navigation
 */
function setupUrlChangeDetection() {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    handleUrlChange();
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    handleUrlChange();
  };
  
  setInterval(handleUrlChange, 5000);
}

/**
 * Handle URL changes
 */
function handleUrlChange() {
  const newUrl = window.location.href;
  if (newUrl !== currentUrl && 
      (newUrl.includes('/grid-') || newUrl.endsWith('immaculategrid.com/') || newUrl.endsWith('immaculategrid.com'))) {
    currentUrl = newUrl;
    gridSolutions = {};
    loadSolutions();
  }
}

/**
 * Load user preferences
 */
async function loadUserPreferences() {
  try {
    const result = await chrome.storage.local.get(['hideByDefault']);
    hideByDefault = result.hideByDefault || false;
  } catch (error) {
    hideByDefault = false;
  }
}
