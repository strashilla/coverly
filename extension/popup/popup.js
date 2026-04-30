// Coverly Popup Script

const translations = {
    en: {
        settingsAriaLabel: 'Settings',
        settingsTitle: 'Settings',
        dropZoneText: 'Drop PDF here or click to upload',
        dividerOr: 'or',
        resumeTextPlaceholder: 'Paste your resume text...',
        saveResumeBtn: 'Save Resume',
        saveResumeDone: 'Saved',
        subtitle: 'AI cover letters in one click',
        statusOpenJob: 'Open a job listing page',
        statusJobFound: 'Job found',
        generateBtn: 'Generate Cover Letter',
        generating: 'Generating...',
        resultLabel: 'Generated Cover Letter',
        coverLetterPlaceholder: 'Your cover letter will appear here...',
        copyBtn: 'Copy to Clipboard',
        footerText: 'Coverly • AI cover letters',
        copied: 'Copied!',
        errorNoResume: 'Resume not found. Please configure in Settings.',
        errorNoJob: 'No job description found. Please open a job listing page and try again.',
        errorServer: 'Server error',
        errorCopy: 'Failed to copy to clipboard',
        errorGenerate: 'Failed to generate cover letter',
        openSettings: 'Open Settings',
    },
    ru: {
        settingsAriaLabel: 'Настройки',
        settingsTitle: 'Настройки',
        dropZoneText: 'Перетащи PDF сюда или нажми для загрузки',
        dividerOr: 'или',
        resumeTextPlaceholder: 'Вставь резюме текстом...',
        saveResumeBtn: 'Сохранить резюме',
        saveResumeDone: 'Сохранено',
        subtitle: 'Сопроводительные письма с AI в один клик',
        statusOpenJob: 'Откройте страницу вакансии',
        statusJobFound: 'Вакансия найдена',
        generateBtn: 'Создать письмо',
        generating: 'Создание...',
        resultLabel: 'Созданное письмо',
        coverLetterPlaceholder: 'Ваше сопроводительное письмо появится здесь...',
        copyBtn: 'Копировать',
        footerText: 'Coverly • AI cover letters',
        copied: 'Скопировано!',
        errorNoResume: 'Резюме не найдено. Пожалуйста, настройте в Параметрах.',
        errorNoJob: 'Описание вакансии не найдено. Откройте страницу вакансии и попробуйте снова.',
        errorServer: 'Ошибка сервера',
        errorCopy: 'Не удалось скопировать',
        errorGenerate: 'Не удалось создать письмо',
        openSettings: 'Открыть настройки',
    },
};

let currentLang = 'en';
let currentJobDescription = null;
let apiUrl = 'https://coverly.vercel.app/api/generate';

document.addEventListener('DOMContentLoaded', init);

async function init() {
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const resultDiv = document.getElementById('result');
    const coverLetterTextarea = document.getElementById('coverLetter');
    const errorDiv = document.getElementById('error');
    const langToggle = document.getElementById('langToggle');
    const settingsLink = document.getElementById('settingsLink');
    const screenMain = document.getElementById('screenMain');
    const screenSettings = document.getElementById('screenSettings');
    const backBtn = document.getElementById('backBtn');
    const dropZone = document.getElementById('dropZone');
    const resumeFile = document.getElementById('resumeFile');
    const resumeText = document.getElementById('resumeText');
    const saveResumeBtn = document.getElementById('saveResumeBtn');

    // Load saved settings
    await loadSettings();

    // Request job description from current tab
    await requestJobDescription();
    updateStatusLine();

    generateBtn.addEventListener('click', handleGenerate);
    copyBtn.addEventListener('click', handleCopy);
    langToggle.addEventListener('click', toggleLanguage);

    async function loadSettings() {
        try {
            const result = await chrome.storage.local.get(['language', 'apiUrl']);
            if (result.language) {
                currentLang = result.language;
            }
            if (result.apiUrl) {
                apiUrl = result.apiUrl;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        updateUI();
    }

    async function requestJobDescription() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                // Send message to content script to get job description
                const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_DESCRIPTION' });
                if (response && response.jobDescription) {
                    currentJobDescription = response.jobDescription;
                    updateStatusLine();
                }
            }
        } catch (error) {
            console.log('Could not get job description:', error.message);
        }
    }

    function updateStatusLine() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        if (currentJobDescription) {
            statusDot.classList.add('active');
            statusText.dataset.i18n = 'statusJobFound';
            statusText.textContent = t('statusJobFound');
        } else {
            statusDot.classList.remove('active');
            statusText.dataset.i18n = 'statusOpenJob';
            statusText.textContent = t('statusOpenJob');
        }
    }

    // Settings link handler - switch to settings screen
    settingsLink.addEventListener('click', async (e) => {
        e.preventDefault();
        // Load saved resume
        try {
            const result = await chrome.storage.local.get('resume');
            if (result.resume) {
                resumeText.value = result.resume;
            } else {
                resumeText.value = '';
            }
        } catch (error) {
            console.error('Failed to load resume:', error);
            resumeText.value = '';
        }
        screenMain.hidden = true;
        screenSettings.hidden = false;
    });

    // Back button handler
    backBtn.addEventListener('click', () => {
        screenSettings.hidden = true;
        screenMain.hidden = false;
    });

    // Drop zone click handler
    dropZone.addEventListener('click', () => {
        resumeFile.click();
    });

    // Drag & drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // Resume file input handler
    resumeFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    // Handle PDF file
    async function handleFile(file) {
        if (file.type !== 'application/pdf') {
            showError('Please select a PDF file');
            return;
        }

        try {
            if (!window.pdfjsLib) {
                throw new Error('PDF library not loaded');
            }

            pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            resumeText.value = fullText.trim();
        } catch (error) {
            console.error('Failed to parse PDF:', error.message, error);
            showError('Failed to parse PDF file');
        }
    }

    // Save resume button handler
    saveResumeBtn.addEventListener('click', async () => {
        const text = resumeText.value.trim();
        if (text) {
            try {
                await chrome.storage.local.set({ resume: text });
                // Show confirmation message
                saveResumeBtn.textContent = `✓ ${t('saveResumeDone')}`;
                saveResumeBtn.style.background = 'var(--aqua)';
                saveResumeBtn.style.color = 'var(--dark)';
                setTimeout(() => {
                    saveResumeBtn.textContent = t('saveResumeBtn');
                    saveResumeBtn.style.background = '';
                    saveResumeBtn.style.color = '';
                    // Switch back to main screen
                    screenSettings.hidden = true;
                    screenMain.hidden = false;
                    resumeText.value = '';
                }, 2000);
            } catch (error) {
                console.error('Failed to save resume:', error);
            }
        }
    });

    async function handleGenerate() {
        // Get resume from storage
        let resume = null;
        try {
            const result = await chrome.storage.local.get('resume');
            resume = result.resume;
        } catch (error) {
            console.error('Failed to get resume:', error);
        }

        if (!resume) {
            showError(t('errorNoResume'));
            return;
        }

        if (!currentJobDescription) {
            showError(t('errorNoJob'));
            return;
        }

        setLoading(true);
        hideError();

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resume,
                    jobDescription: currentJobDescription,
                }),
            });

            if (!response.ok) {
                throw new Error(`${t('errorServer')}: ${response.status}`);
            }

            const data = await response.json();

            if (data.coverLetter) {
                coverLetterTextarea.value = data.coverLetter;
                resultDiv.hidden = false;
            } else {
                throw new Error(data.error || t('errorGenerate'));
            }
        } catch (error) {
            showError(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCopy() {
        const text = coverLetterTextarea.value;
        try {
            await navigator.clipboard.writeText(text);
            copyBtn.textContent = t('copied');
            setTimeout(() => {
                copyBtn.textContent = t('copyBtn');
            }, 2000);
        } catch (error) {
            showError(t('errorCopy'));
        }
    }

    function setLoading(loading) {
        const btnText = generateBtn.querySelector('.btn-text');
        const btnLoading = generateBtn.querySelector('.btn-loading');

        generateBtn.disabled = loading;
        btnText.hidden = loading;
        btnLoading.hidden = !loading;
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.hidden = false;
    }

    function hideError() {
        errorDiv.hidden = true;
    }

    // Language functions
    function t(key) {
        return translations[currentLang][key] || translations.en[key] || key;
    }

    async function toggleLanguage() {
        currentLang = currentLang === 'en' ? 'ru' : 'en';
        try {
            await chrome.storage.local.set({ language: currentLang });
        } catch (error) {
            console.error('Failed to save language:', error);
        }
        updateUI();
    }

    function updateUI() {
        // Update button text
        langToggle.textContent = currentLang.toUpperCase();

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[currentLang][key]) {
                el.textContent = translations[currentLang][key];
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[currentLang][key]) {
                el.placeholder = translations[currentLang][key];
            }
        });

        document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria-label');
            if (translations[currentLang][key]) {
                el.setAttribute('aria-label', translations[currentLang][key]);
            }
        });

        updateStatusLine();
    }
}