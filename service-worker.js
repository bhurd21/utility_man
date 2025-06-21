// Service worker for Immaculate Grid Solver
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only trigger when the page has finished loading and matches our pattern
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('immaculategrid.com')) {
    
    // Send message to content script to start scanning
    chrome.tabs.sendMessage(tabId, { action: 'autoSolve' }).catch(() => {
      // Ignore errors if content script isn't ready yet
    });
  }
});
