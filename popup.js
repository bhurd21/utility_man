document.addEventListener('DOMContentLoaded', function() {
  const solveBtn = document.getElementById('solveBtn');
  const status = document.getElementById('status');

  solveBtn.addEventListener('click', function() {
    status.textContent = 'Analyzing grid...';
    solveBtn.disabled = true;
    solveBtn.textContent = 'Solving...';
    
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'solve'
      }, function(response) {
        // Re-enable button when fetch is complete
        solveBtn.disabled = false;
        solveBtn.textContent = 'Solve Grid';
        
        if (response && response.success) {
          status.textContent = 'Analysis complete! Check the page for results.';
          solveBtn.disabled = true;
        } else if (response && response.error) {
          status.textContent = `Error: ${response.error}`;
        } else {
          status.textContent = 'Analysis failed. Try again.';
        }
      });
    });
  });
});
