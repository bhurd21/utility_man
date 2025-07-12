document.addEventListener('DOMContentLoaded', function() {
  const refreshBtn = document.getElementById('refreshBtn');
  const status = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  const indicator = document.getElementById('indicator');
  const hideByDefaultToggle = document.getElementById('hideByDefault');
  const themeRadios = document.querySelectorAll('input[name="theme"]');

  // Check initial status and load preferences
  checkExtensionStatus();
  loadPreferences();
  initializeTheme();

  refreshBtn.addEventListener('click', function() {
    statusText.textContent = 'Refreshing...';
    indicator.className = 'status-indicator loading';
    status.textContent = 'Fetching new solutions...';
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refresh';
    
    // Send message to content script to refresh solutions
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('immaculategrid.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'solve'
        }, function(response) {
          // Re-enable button when fetch is complete
          refreshBtn.disabled = false;
          refreshBtn.textContent = 'Refresh';
          
          if (chrome.runtime.lastError) {
            // Handle Chrome extension errors
            statusText.textContent = 'Error';
            indicator.className = 'status-indicator error';
            status.textContent = 'Extension not loaded on this page. Refresh the page and try again.';
          } else if (response && response.success) {
            statusText.textContent = 'Ready';
            indicator.className = 'status-indicator ready';
            status.textContent = 'Solutions updated! Click grid cells to see answers.';
          } else if (response && response.error) {
            statusText.textContent = 'Error';
            indicator.className = 'status-indicator error';
            status.textContent = `Error: ${response.error}`;
          } else {
            statusText.textContent = 'Error';
            indicator.className = 'status-indicator error';
            status.textContent = 'Failed to refresh. Try again.';
          }
        });
      }
    });
  });

  // Handle preference toggle
  hideByDefaultToggle.addEventListener('change', function() {
    const hideByDefault = hideByDefaultToggle.checked;
    chrome.storage.local.set({ hideByDefault }, function() {
      // Notify content script of preference change
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('immaculategrid.com')) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'updatePreference',
            hideByDefault: hideByDefault
          });
        }
      });
    });
  });

  // Initialize theme system for popup
  function initializeTheme() {
    // Detect system preference
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    // Load user preference and apply theme
    chrome.storage.local.get(['themeMode'], function(result) {
      const themeMode = result.themeMode || 'system';
      applyPopupTheme(themeMode, systemPreference);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      chrome.storage.local.get(['themeMode'], function(result) {
        const themeMode = result.themeMode || 'system';
        if (themeMode === 'system') {
          applyPopupTheme('system', e.matches ? 'dark' : 'light');
        }
      });
    });
  }

  // Apply theme to popup
  function applyPopupTheme(mode, systemPreference) {
    let actualTheme;
    
    switch (mode) {
      case 'dark':
        actualTheme = 'dark';
        break;
      case 'light':
        actualTheme = 'light';
        break;
      case 'system':
      default:
        actualTheme = systemPreference;
        break;
    }

    // Apply theme to document
    if (actualTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  // Handle theme changes
  themeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        const themeMode = this.value;
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        
        // Apply theme immediately to popup
        applyPopupTheme(themeMode, systemPreference);
        
        chrome.storage.local.set({ themeMode }, function() {
          // Notify content script of theme change
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes('immaculategrid.com')) {
              chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'updateTheme',
                themeMode: themeMode
              });
            }
          });
        });
      }
    });
  });

  function loadPreferences() {
    chrome.storage.local.get(['hideByDefault', 'themeMode'], function(result) {
      hideByDefaultToggle.checked = result.hideByDefault || false;
      
      const themeMode = result.themeMode || 'system';
      const selectedTheme = document.getElementById('theme' + themeMode.charAt(0).toUpperCase() + themeMode.slice(1));
      if (selectedTheme) {
        selectedTheme.checked = true;
      }
      
      // Apply theme to popup
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyPopupTheme(themeMode, systemPreference);
    });
  }

  function checkExtensionStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('immaculategrid.com')) {
        // On the correct site
        statusText.textContent = 'Ready';
        indicator.className = 'status-indicator ready';
        status.textContent = 'Extension is active. Click grid cells to see solutions.';
      } else {
        // Not on the target site
        statusText.textContent = 'Inactive';
        indicator.className = 'status-indicator error';
        status.textContent = 'Navigate to immaculate grid to use the solver';
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'immaculategrid.com';
        refreshBtn.onclick = function() {
          chrome.tabs.create({ url: 'https://immaculategrid.com' });
        };
      }
    });
  }
});
