// Global state
let gridSolutions = {};
let activeObserver = null;

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
  loadSolutions();
}

async function loadSolutions() {
  try {
    const labels = [...document.querySelectorAll('[aria-label*=" + "]')]
      .map(el => el.getAttribute('aria-label'))
      .filter(label => label?.includes(' + '))
      .map(label => label.replace(/\s+/g, ' ').trim());
    
    if (!labels.length) return false;
    
    const response = await fetch(`http://localhost:3000/api/imgrid?questions=${encodeURIComponent(JSON.stringify(labels))}`);
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
    max-height: 250px; overflow: auto; border: 1px solid #4B5563;
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
  
  const valid = solutions.filter(s => Array.isArray(s) && s.length >= 3).slice(0, 15);
  if (!valid.length) return createHeaderLine(`UTILITY MAN - Invalid data`, `"${label}"`);
  
  let table = createHeaderLine(`UTILITY MAN - ${valid.length} results`, `"${label}"`) + '<pre style="margin: 0; padding-top: 12px;">\n';
  table += `${'Player'.padEnd(20)} ${'Age'.padEnd(6)} ${'GP'.padEnd(6)}\n`;
  table += `${'-'.repeat(20)} ${'-'.repeat(6)} ${'-'.repeat(6)}\n`;
  
  valid.forEach(([name, gp, age]) => {
    const displayName = (name || '').substring(0, 18) + (name?.length > 18 ? '..' : '');
    table += `${displayName.padEnd(20)} ${(age + 'yo').padEnd(6)} ${(gp + ' TGP').padEnd(6)}\n`;
  });
  
  if (solutions.length > 15) table += `\n... and ${solutions.length - 15} more`;
  table += '</pre>';
  return table;
}
