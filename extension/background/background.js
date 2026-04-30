// Coverly Background Script
// Service worker for Chrome extension

chrome.runtime.onInstalled.addListener(() => {
    console.log('Coverly extension installed');
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