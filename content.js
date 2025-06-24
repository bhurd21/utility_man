// Global state
let gridSolutions = {};
let activeObserver = null;
let currentUrl = window.location.href;

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
  }
});

function init() {
  setupClickListener();
  setupUrlChangeDetection();
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
    const target = event.target.closest('[aria-label*=" + "]');
    if (target) {
      injectSolutions(target.getAttribute('aria-label'));
    } else if (activeObserver && !document.querySelector('[data-headlessui-state="open"]')) {
      activeObserver.disconnect();
      activeObserver = null;
    }
  });
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
  
  div.innerHTML = solutions ? formatTable(solutions, label) : createHeaderLine(`UTILITY MAN - Loading...`, `"${label}"`);
  
  const list = dialog.querySelector('ul[role="listbox"], ul');
  if (list) {
    list.parentNode.insertBefore(div, list);
  } else {
    input.parentNode.insertBefore(div, input.nextElementSibling) || input.parentNode.appendChild(div);
  }
}

function createHeaderLine(left, right) {
  return `<div style="display: flex; justify-content: space-between;"><span>${left}</span><span>${right}</span></div>`;
}

function formatTable(solutions, label) {
  if (!solutions?.length) return createHeaderLine(`UTILITY MAN - 0 results`, `"${label}"`);
  const valid = solutions.filter(s => s && typeof s === 'object' && s.name).slice(0, 15);
  if (!valid.length) return createHeaderLine(`UTILITY MAN - No valid data`, `"${label}"`);
  let table = createHeaderLine(`UTILITY MAN - ${valid.length} results`, `"${label}"`) +
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
