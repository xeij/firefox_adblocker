// Free Ad Blocker - Background Script
// Handles network-level request blocking

// State management
let isEnabled = true;
let stats = {
  totalBlocked: 0,
  sessionBlocked: 0,
  lastReset: Date.now()
};

// Filter lists
let blockedDomains = [];
let blockedPatterns = [];

// Initialize extension
async function initialize() {
  console.log('Free Ad Blocker: Initializing...');
  
  // Load filter lists
  await loadFilterLists();
  
  // Load saved state and stats
  const data = await browser.storage.local.get(['isEnabled', 'stats']);
  if (data.isEnabled !== undefined) {
    isEnabled = data.isEnabled;
  }
  if (data.stats) {
    stats = data.stats;
  }
  
  // Set up web request listener
  setupRequestListener();
  
  console.log('Free Ad Blocker: Initialized successfully');
  console.log(`Loaded ${blockedDomains.length} blocked domains`);
}

// Load filter lists from JSON files
async function loadFilterLists() {
  try {
    // Load blocked domains
    const domainsResponse = await fetch(browser.runtime.getURL('filters/domains.json'));
    const domainsData = await domainsResponse.json();
    blockedDomains = domainsData.domains || [];
    
    // Load blocked patterns
    const patternsResponse = await fetch(browser.runtime.getURL('filters/patterns.json'));
    const patternsData = await patternsResponse.json();
    blockedPatterns = patternsData.patterns || [];
  } catch (error) {
    console.error('Error loading filter lists:', error);
  }
}

// Set up webRequest listener for blocking
function setupRequestListener() {
  browser.webRequest.onBeforeRequest.addListener(
    blockRequest,
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
}

// Check if a URL should be blocked
function shouldBlock(url) {
  if (!isEnabled) return false;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const fullUrl = url.toLowerCase();
    
    // Check against blocked domains
    for (const domain of blockedDomains) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return true;
      }
    }
    
    // Check against blocked patterns
    for (const pattern of blockedPatterns) {
      if (fullUrl.includes(pattern)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Block request handler
function blockRequest(details) {
  if (shouldBlock(details.url)) {
    // Increment stats
    stats.totalBlocked++;
    stats.sessionBlocked++;
    
    // Save stats periodically (every 10 blocks)
    if (stats.totalBlocked % 10 === 0) {
      saveStats();
    }
    
    // Block the request
    return { cancel: true };
  }
  
  return { cancel: false };
}

// Save stats to storage
async function saveStats() {
  await browser.storage.local.set({ stats });
}

// Save enabled state
async function saveEnabledState() {
  await browser.storage.local.set({ isEnabled });
}

// Message handler for popup communication
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStats') {
    sendResponse({
      isEnabled,
      stats
    });
  } else if (message.action === 'toggleEnabled') {
    isEnabled = !isEnabled;
    saveEnabledState();
    sendResponse({ isEnabled });
  } else if (message.action === 'resetStats') {
    stats.sessionBlocked = 0;
    stats.lastReset = Date.now();
    saveStats();
    sendResponse({ stats });
  }
  
  return true; // Keep message channel open for async response
});

// Update badge with blocked count
function updateBadge() {
  const text = stats.sessionBlocked > 999 ? '999+' : stats.sessionBlocked.toString();
  browser.browserAction.setBadgeText({ text });
  browser.browserAction.setBadgeBackgroundColor({ color: '#FF6B6B' });
}

// Update badge every second
setInterval(updateBadge, 1000);

// Initialize on startup
initialize();
