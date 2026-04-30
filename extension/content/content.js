// Coverly Content Script
// Extracts job description from career sites

(function() {
    'use strict';

    // Configuration for supported sites
    const SITE_CONFIGS = {
        'hh.ru': {
            selectors: {
                title: '.vacancy-title h1, .vacancy-title__text',
                company: '.vacancy-company-name, .company-name',
                description: '.vacancy-section:has(h2:contains("Описание")), .vacancy-description',
            },
            extractJobDescription: extractHHJob,
        },
        'linkedin.com': {
            selectors: {
                title: '.job-card-container h1, .jobs-unified-top-card__job-title',
                company: '.job-card-container .emberView, .jobs-unified-top-card__company-name',
                description: '.job-details-skill-match-status-list, .jobs-description-content',
            },
            extractJobDescription: extractLinkedInJob,
        },
    };

    function init() {
        const hostname = window.location.hostname;
        const config = SITE_CONFIGS[hostname.replace('www.', '')];

        if (!config) {
            console.log('Coverly: Site not supported');
            return;
        }

        // Wait for page to fully load
        setTimeout(() => extractAndSendJob(config), 2000);
    }

    function extractHHJob() {
        const sections = document.querySelectorAll('.vacancy-section');
        let jobText = '';

        sections.forEach(section => {
            const heading = section.querySelector('h2');
            if (heading && heading.textContent.trim()) {
                const content = section.textContent;
                if (content.length > 100) {
                    jobText += content + '\n\n';
                }
            }
        });

        return jobText || document.body.innerText;
    }

    function extractLinkedInJob() {
        const description = document.querySelector('.jobs-description-content, .job-details-skill-match-status-list');
        return description ? description.innerText : document.body.innerText;
    }

    function extractAndSendJob(config) {
        try {
            const jobDescription = config.extractJobDescription();

            if (jobDescription && jobDescription.length > 50) {
                // Store for later use
                window.__coverlyJobDescription = jobDescription;
            }
        } catch (error) {
            console.error('Coverly: Failed to extract job', error);
        }
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'GET_JOB_DESCRIPTION') {
            const hostname = window.location.hostname;
            const config = SITE_CONFIGS[hostname.replace('www.', '')];
            
            if (config) {
                const jobDescription = config.extractJobDescription();
                sendResponse({ jobDescription });
            } else {
                sendResponse({ jobDescription: null });
            }
        }
        return true;
    });

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();