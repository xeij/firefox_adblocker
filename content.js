// Free Ad Blocker - Content Script
// Handles DOM-level element hiding

// CSS selectors for common ad elements
let hidingSelectors = [];

// Load hiding selectors from filter list
async function loadSelectors() {
    try {
        const response = await fetch(browser.runtime.getURL('filters/selectors.json'));
        const data = await response.json();
        hidingSelectors = data.selectors || [];
    } catch (error) {
        console.error('Error loading selectors:', error);
    }
}

// Apply hiding rules to the page
function hideAdElements() {
    if (hidingSelectors.length === 0) return;

    // Create a combined selector
    const combinedSelector = hidingSelectors.join(', ');

    try {
        // Find and hide matching elements
        const elements = document.querySelectorAll(combinedSelector);
        elements.forEach(element => {
            element.style.setProperty('display', 'none', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty('height', '0', 'important');
            element.style.setProperty('width', '0', 'important');
        });
    } catch (error) {
        // Ignore selector errors
    }
}

// Inject CSS to hide elements (more efficient than inline styles)
function injectHidingCSS() {
    if (hidingSelectors.length === 0) return;

    const combinedSelector = hidingSelectors.join(', ');
    const css = `${combinedSelector} { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; }`;

    const style = document.createElement('style');
    style.textContent = css;
    style.id = 'free-adblocker-styles';

    // Insert at the beginning of head for high priority
    if (document.head) {
        document.head.insertBefore(style, document.head.firstChild);
    } else {
        // If head doesn't exist yet, wait for it
        const observer = new MutationObserver(() => {
            if (document.head) {
                document.head.insertBefore(style, document.head.firstChild);
                observer.disconnect();
            }
        });
        observer.observe(document.documentElement, { childList: true });
    }
}

// Watch for dynamically added ad elements
function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
        hideAdElements();
    });

    // Observe the entire document for changes
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

// Initialize content script
async function initialize() {
    // Load selectors
    await loadSelectors();

    // Inject CSS immediately
    injectHidingCSS();

    // Hide existing elements
    hideAdElements();

    // Watch for new elements
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            hideAdElements();
            setupMutationObserver();
        });
    } else {
        hideAdElements();
        setupMutationObserver();
    }
}

// Start initialization
initialize();
