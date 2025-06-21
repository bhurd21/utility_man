// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'solve') {
    console.log('Grid Solver: Running solve...');
    scanAndProcess(sendResponse);
    return true; // Keep the message channel open for async response
  }
});

function scanAndProcess(sendResponse) {
  // Find all elements with aria-label containing " + "
  const elements = document.querySelectorAll('[aria-label*=" + "]');
  const validLabels = [];
  
  console.log('Grid Solver: Found elements with " + ":', elements.length);
  
  elements.forEach(element => {
    const label = element.getAttribute('aria-label');
    console.log('Grid Solver: Checking label:', label);
    if (label && label.includes(' + ')) {
      // Clean up extra spaces: replace multiple spaces with single spaces
      const cleanedLabel = label.replace(/\s+/g, ' ').trim();
      validLabels.push(cleanedLabel);
      console.log('Grid Solver: Added valid label:', cleanedLabel);
    }
  });
  
  if (validLabels.length > 0) {
    console.log('Grid Solver: Found labels:', validLabels);
    fetchExternalData(validLabels, sendResponse);
  } else {
    // No valid labels found
    sendResponse({ success: false, error: 'No grid elements found' });
  }
}

async function fetchExternalData(labels, sendResponse) {
  try {
    const apiUrl = `http://localhost:3000/api/imgrid?questions=${encodeURIComponent(JSON.stringify(labels))}`;
    console.log('Grid Solver: Fetching from API:', apiUrl);
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('Grid Solver: API Response:', data);
    
    injectDataIntoPage(data);
    
    // Send success response back to popup
    sendResponse({ success: true });
    
  } catch (error) {
    console.error('Grid Solver: Error:', error);
    injectDataIntoPage({ 
      error: 'Failed to fetch data'
    });
    
    // Send error response back to popup
    sendResponse({ success: false, error: error.message });
  }
}

function injectDataIntoPage(data) {
  // Remove any existing solver content
  removeInjectedContent();
  
  // Create a container for the solver results
  const container = document.createElement('div');
  container.id = 'grid-solver-results';
  container.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: white;
    border: 2px solid #4CAF50;
    border-radius: 8px;
    padding: 15px;
    max-width: 300px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 10000;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    font-weight: bold;
    margin-bottom: 10px;
    color: #4CAF50;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
  `;
  header.textContent = 'Grid Solver Results';
  container.appendChild(header);
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 5px;
    right: 10px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #999;
  `;
  closeBtn.onclick = removeInjectedContent;
  container.appendChild(closeBtn);
  
  // Add data content
  const content = document.createElement('div');
  content.style.marginTop = '10px';
  
  // Handle error cases
  if (data.error) {
    content.innerHTML = `<div style="color: #ff4444;">Error: ${data.error}</div>`;
  } else if (data.suggestions && Array.isArray(data.suggestions)) {
    console.log('Grid Solver: Processing suggestions:', data.suggestions.length);
    data.suggestions.forEach(item => {
      console.log('Grid Solver: Processing item:', item);
      const itemDiv = document.createElement('pre');
      itemDiv.style.cssText = 'margin-bottom: 10px; padding: 8px; background: #f9f9f9; border-radius: 4px;';
      
      const labelDiv = document.createElement('div');
      labelDiv.style.cssText = 'font-weight: bold; color: #333; margin-bottom: 5px;';
      labelDiv.textContent = item.label || 'Unknown Team Combination';
      itemDiv.appendChild(labelDiv);

      if (item.suggestions && Array.isArray(item.suggestions)) {
        console.log('Grid Solver: Processing suggestions for', item.label, ':', item.suggestions.length);
        const pre = document.createElement('pre');
        pre.style.cssText = 'margin-left: 10px; color: #666;';
        const lines = [];

        item.suggestions.forEach(suggestionArray => {
          if (Array.isArray(suggestionArray) && suggestionArray.length >= 3) {
            const [name, number1, number2] = suggestionArray;
            lines.push(`• ${name} (${number2}yo) ${number1} TGP`);
          }
        });

        pre.textContent = lines.join('\n');
        itemDiv.appendChild(pre);
      }

      content.appendChild(itemDiv);

    });
  } else {
    content.innerHTML = '<div style="color: #666;">No suggestions available</div>';
    console.log('Grid Solver: No valid suggestions found in data:', data);
  }
  
  container.appendChild(content);
  
  document.body.appendChild(container);
}

function removeInjectedContent() {
  const existing = document.getElementById('grid-solver-results');
  if (existing) {
    existing.remove();
  }
}
