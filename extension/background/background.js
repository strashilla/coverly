// Coverly Background Script
// Service worker for Chrome extension

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.storage.local.get('resume', (result) => {
            if (!result.resume) {
                chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
            }
        });
    }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'JOB_DESCRIPTION') {
        // Store job description for popup to access
        chrome.storage.local.set({
            currentJob: message.data,
        });
    }
    return true;
});

// Clear stored data on extension startup
chrome.runtime.onStartup.addListener(async () => {
    await chrome.storage.local.remove('currentJob');
});