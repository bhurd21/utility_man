// Global state
let gridSolutions = {};
let activeObserver = null;
let currentUrl = window.location.href;
let hideByDefault = false;
let isCurrentlyHidden = false;

// Initialize
(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

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

function init() {
  setupClickListener();
  setupUrlChangeDetection();
  loadUserPreferences();
  loadSolutions();
}

async function loadSolutions() {
  try {
    const labels = [...document.querySelectorAll('[aria-label*=" + "]')]
      .map(el => el.getAttribute('aria-label'))
      .filter(label => label?.includes(' + '))
      .map(label => label.replace(/\s+/g, ' ').trim());
    
    if (!labels.length) return false;
    
    const response = await fetch(`https://brennanhurd.com/api/imgrid?questions=${encodeURIComponent(JSON.stringify(labels))}`);
    const data = await response.json();
    
    data.suggestions?.forEach(item => {
      if (item.label) gridSolutions[item.label] = item.suggestions || [];
    });
    
    return true;
  } catch (error) {
    console.error('Grid Solver Error:', error);
    return false;
  }
}

function setupClickListener() {
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('grid-toggle-btn') || 
        event.target.closest('.grid-toggle-btn')) {
      toggleVisibility(event);
      return;
    }
    
    const target = event.target.closest('[aria-label*=" + "]');
    if (target) {
      isCurrentlyHidden = hideByDefault; // Reset to user preference for new context
      injectSolutions(target.getAttribute('aria-label'));
    } else if (activeObserver && !document.querySelector('[data-headlessui-state="open"]')) {
      activeObserver.disconnect();
      activeObserver = null;
    }
  }, true);
}

function injectSolutions(ariaLabel) {
  activeObserver?.disconnect();
  activeObserver = null;

  const existingDialog = document.querySelector('[data-headlessui-state="open"]');
  if (existingDialog && !existingDialog.querySelector('.grid-solver-solutions')) {
    createSolutionDiv(existingDialog, ariaLabel);
    return;
  }

  if (!existingDialog) {
    activeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            const dialog = node.matches?.('[data-headlessui-state="open"]') ? node : 
                          node.querySelector?.('[data-headlessui-state="open"]');
            
            if (dialog && !dialog.querySelector('.grid-solver-solutions')) {
              createSolutionDiv(dialog, ariaLabel);
              activeObserver.disconnect();
              activeObserver = null;
              return;
            }
          }
        }
      }
    });
    
    activeObserver.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      activeObserver?.disconnect();
      activeObserver = null;
    }, 3000);
  }
}

function createSolutionDiv(dialog, ariaLabel) {
  const input = dialog.querySelector('input[placeholder="Search..."], input[aria-autocomplete="list"]');
  if (!input) return;

  const label = ariaLabel.replace(/\s+/g, ' ').trim();
  const solutions = gridSolutions[label];
  
  const div = document.createElement('div');
  div.className = 'grid-solver-solutions';
  div.style.cssText = `
    background: #374151; color: white; padding: 12px; margin: 0;
    font: 11px/1.2 ui-monospace, monospace;
    max-height: 175px; overflow: auto; border: 1px solid #4B5563;
  `;
  
  updateSolutionContent(div, solutions, label);
  
  const list = dialog.querySelector('ul[role="listbox"], ul');
  if (list) {
    list.parentNode.insertBefore(div, list);
  } else {
    input.parentNode.insertBefore(div, input.nextElementSibling) || input.parentNode.appendChild(div);
  }
}

function updateSolutionContent(div, solutions, label) {
  if (isCurrentlyHidden) {
    div.innerHTML = createHiddenState(label);
  } else {
    div.innerHTML = solutions ? formatTable(solutions, label) : createHeaderLine(`UTILITY MAN - Loading...`, `${label}`);
  }
}

function createHiddenState(label) {
  return createHeaderLineWithButton(`UTILITY MAN`, `${label}`, true) + 
    `<div style="text-align: center; padding: 20px; color: #9CA3AF;">Solutions hidden - click eye to reveal</div>`;
}

function toggleVisibility(event) {
  event.stopPropagation();
  event.preventDefault();
  
  isCurrentlyHidden = !isCurrentlyHidden;
  const div = event.target.closest('.grid-solver-solutions');
  if (div) {
    const label = div.querySelector('.grid-label')?.textContent?.replace(/"/g, '') || '';
    const solutions = gridSolutions[label];
    updateSolutionContent(div, solutions, `${label}`);
  }
}

function createHeaderLine(left, right) {
  return `<div style="display: flex; justify-content: space-between;"><span>${left}</span><span class="grid-label">${right}</span></div>`;
}

function createHeaderLineWithButton(left, right, isHidden) {
  const eyeIcon = isHidden 
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  
  return `<div style="display: flex; justify-content: space-between; align-items: center;">
    <span>${left}</span>
    <div style="display: flex; align-items: center; gap: 8px;">
      <button class="grid-toggle-btn" style="background: none; border: none; color: white; cursor: pointer; padding: 2px; display: flex; align-items: center;" title="${isHidden ? 'Show solutions' : 'Hide solutions'}">${eyeIcon}</button>
      <span class="grid-label">${right}</span>
    </div>
  </div>`;
}

function formatTable(solutions, label) {
  if (!solutions?.length) return createHeaderLineWithButton(`UTILITY MAN - 0 results`, `${label}`, isCurrentlyHidden);
  const valid = solutions.filter(s => s && typeof s === 'object' && s.name).slice(0, 15);
  if (!valid.length) return createHeaderLineWithButton(`UTILITY MAN - No valid data`, `${label}`, isCurrentlyHidden);
  let table = createHeaderLineWithButton(`UTILITY MAN - ${valid.length} results`, `${label}`, isCurrentlyHidden) +
    `<pre style="margin:0; padding-top:12px; font-family:ui-monospace,monospace; font-size:14px; white-space:pre; width:100%; box-sizing:border-box; line-height:1.3;">\n`;

  const spacer = 4; // Space between columns
  // Header row
  table += [
    'Player'.padEnd(20 + spacer),
    'Pos'.padEnd(4 + spacer),
    'Pro Career'.padEnd(11 + spacer),
    'Age'.padEnd(7 + spacer),
    'LPS'.padEnd(4 + spacer)
  ].join('') + '\n';

  // Separator row
  table += [
    '-'.repeat(20 + spacer),
    '-'.repeat(4 + spacer),
    '-'.repeat(11 + spacer),
    '-'.repeat(7 + spacer),
    '-'.repeat(4 + spacer)
  ].join('') + '\n';

  // Data rows
  valid.forEach((player) => {
    const displayName = (player.name || '').length > 23 ? (player.name || '').substring(0, 23) + '..' : (player.name || '');
    table += [
      displayName.padEnd(20 + spacer),
      (player.position || '').padEnd(4 + spacer),
      (player.pro_career || '').padEnd(11 + spacer),
      ((player.age ? player.age + 'yo' : '')).padEnd(7 + spacer),
      String(player.lps || '').padEnd(4 + spacer)
    ].join('') + '\n';
  });

  if (solutions.length > 15) table += `\n... and ${solutions.length - 15} more`;
  table += '</pre>';
  return table;
}

function setupUrlChangeDetection() {
  // Override pushState and replaceState to catch programmatic navigation
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
  
  // Check for URL changes periodically
  setInterval(handleUrlChange, 5000);
}

function handleUrlChange() {
  console.log('handleUrlChange');
  const newUrl = window.location.href;
  if (newUrl !== currentUrl && 
      (newUrl.includes('/grid-') || newUrl.endsWith('immaculategrid.com/') || newUrl.endsWith('immaculategrid.com'))) {
    currentUrl = newUrl;
    gridSolutions = {};
    loadSolutions();
  }
}

async function loadUserPreferences() {
  try {
    const result = await chrome.storage.local.get(['hideByDefault']);
    hideByDefault = result.hideByDefault || false;
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    hideByDefault = false;
  }
}
