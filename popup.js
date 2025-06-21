document.addEventListener('DOMContentLoaded', function() {
  const refreshBtn = document.getElementById('refreshBtn');
  const status = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  const indicator = document.getElementById('indicator');

  // Check initial status
  checkExtensionStatus();

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
          
          if (response && response.success) {
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
      } else {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh';
        statusText.textContent = 'Error';
        indicator.className = 'status-indicator error';
        status.textContent = 'Please navigate to immaculategrid.com first';
      }
    });
  });

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
        status.textContent = 'Navigate to immaculategrid.com to use the solver';
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Navigate to Grid Site';
      }
    });
  }
});
