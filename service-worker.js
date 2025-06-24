// Service worker for Immaculate Grid Solver
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Trigger on both complete page loads and URL changes
  if ((changeInfo.status === 'complete' || changeInfo.url) && 
      tab.url && 
      tab.url.includes('immaculategrid.com')) {
    
    // Send message to content script to start scanning
    chrome.tabs.sendMessage(tabId, { action: 'autoSolve' }).catch(() => {
      // Ignore errors if content script isn't ready yet
    });
  }
});
