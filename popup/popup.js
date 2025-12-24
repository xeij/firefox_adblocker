// Free Ad Blocker - Popup Script
// Handles popup UI interactions

// DOM elements
const toggleSwitch = document.getElementById('toggleSwitch');
const statusText = document.getElementById('status');
const sessionBlockedText = document.getElementById('sessionBlocked');
const totalBlockedText = document.getElementById('totalBlocked');
const resetBtn = document.getElementById('resetBtn');

// Format large numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Update UI with current stats
async function updateStats() {
    try {
        const response = await browser.runtime.sendMessage({ action: 'getStats' });

        if (response) {
            // Update toggle state
            toggleSwitch.checked = response.isEnabled;
            statusText.textContent = response.isEnabled ? 'Enabled' : 'Disabled';
            statusText.className = response.isEnabled ? 'toggle-status' : 'toggle-status disabled';

            // Update stats
            sessionBlockedText.textContent = formatNumber(response.stats.sessionBlocked);
            totalBlockedText.textContent = formatNumber(response.stats.totalBlocked);
        }
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Toggle ad blocker on/off
async function toggleAdBlocker() {
    try {
        const response = await browser.runtime.sendMessage({ action: 'toggleEnabled' });

        if (response) {
            statusText.textContent = response.isEnabled ? 'Enabled' : 'Disabled';
            statusText.className = response.isEnabled ? 'toggle-status' : 'toggle-status disabled';

            // Add visual feedback
            toggleSwitch.parentElement.parentElement.style.transform = 'scale(0.98)';
            setTimeout(() => {
                toggleSwitch.parentElement.parentElement.style.transform = 'scale(1)';
            }, 100);
        }
    } catch (error) {
        console.error('Error toggling ad blocker:', error);
    }
}

// Reset session stats
async function resetStats() {
    try {
        const response = await browser.runtime.sendMessage({ action: 'resetStats' });

        if (response) {
            sessionBlockedText.textContent = formatNumber(response.stats.sessionBlocked);

            // Add visual feedback
            resetBtn.textContent = 'Reset!';
            setTimeout(() => {
                resetBtn.textContent = 'Reset Session Stats';
            }, 1000);
        }
    } catch (error) {
        console.error('Error resetting stats:', error);
    }
}

// Event listeners
toggleSwitch.addEventListener('change', toggleAdBlocker);
resetBtn.addEventListener('click', resetStats);

// Update stats on load
updateStats();

// Update stats every second
setInterval(updateStats, 1000);
