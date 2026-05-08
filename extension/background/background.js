chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.storage.local.get('resume', (result) => {
            if (!result.resume) {
                chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
            }
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'JOB_DESCRIPTION') {
        chrome.storage.local.set({
            currentJob: message.data,
        });
    }
    return true;
});

chrome.runtime.onStartup.addListener(async () => {
    await chrome.storage.local.remove('currentJob');
});