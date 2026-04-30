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
        toneFormal: 'Formal',
        toneFriendly: 'Friendly',
        toneShort: 'Short',
        historyTitle: 'History',
        historyEmpty: 'No letters yet',
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
        toneFormal: 'Формальный',
        toneFriendly: 'Дружелюбный',
        toneShort: 'Краткий',
        historyTitle: 'История',
        historyEmpty: 'Писем пока нет',
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
let currentTone = 'formal';
let apiUrl = 'https://coverly-henna.vercel.app/api/generate';

async function saveToHistory(jobTitle, coverLetter) {
  const result = await chrome.storage.local.get('history');
  const history = result.history || [];
  history.unshift({
    jobTitle: jobTitle || 'Без названия',
    coverLetter,
    date: new Date().toLocaleDateString('ru-RU'),
  });
  if (history.length > 5) history.pop();
  await chrome.storage.local.set({ history });
}

async function loadHistory() {
  const result = await chrome.storage.local.get('history');
  return result.history || [];
}

document.addEventListener('DOMContentLoaded', init);

async function init() {
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const regenBtn = document.getElementById('regenBtn');
    const resultDiv = document.getElementById('result');
    const coverLetterTextarea = document.getElementById('coverLetter');
    const errorDiv = document.getElementById('error');
    const langToggle = document.getElementById('langToggle');
    const settingsLink = document.getElementById('settingsLink');
    const historyBtn = document.getElementById('historyBtn');
    const screenMain = document.getElementById('screenMain');
    const screenSettings = document.getElementById('screenSettings');
    const screenHistory = document.getElementById('screenHistory');
    const backBtn = document.getElementById('backBtn');
    const backFromHistory = document.getElementById('backFromHistory');
    const dropZone = document.getElementById('dropZone');
    const resumeFile = document.getElementById('resumeFile');
    const resumeText = document.getElementById('resumeText');
    const saveResumeBtn = document.getElementById('saveResumeBtn');
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');

    // Load saved settings
    await loadSettings();

    // Request job description from current tab
    try {
        currentJobDescription = await getJobFromPage();
    } catch (error) {
        console.error('Could not get job from page:', error);
        currentJobDescription = null;
    }
    updateStatusLine();

    generateBtn.addEventListener('click', handleGenerate);
    copyBtn.addEventListener('click', handleCopy);
    regenBtn.addEventListener('click', async () => {
      regenBtn.classList.add('spinning');
      await handleGenerate();
      regenBtn.classList.remove('spinning');
    });
    historyBtn.addEventListener('click', async () => {
        screenMain.hidden = true;
        screenSettings.hidden = true;
        screenHistory.hidden = false;
        await renderHistory();
    });
    backFromHistory.addEventListener('click', () => {
        screenHistory.hidden = true;
        screenSettings.hidden = true;
        screenMain.hidden = false;
    });
    langToggle.addEventListener('click', toggleLanguage);
    document.querySelectorAll('.tone-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTone = btn.dataset.tone;
      });
    });

    async function loadSettings() {
        try {
            await chrome.storage.local.remove('apiUrl');
            const result = await chrome.storage.local.get(['language']);
            if (result.language) {
                currentLang = result.language;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        updateUI();
    }

    async function getJobFromPage() {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const supportedSites = ['hh.ru', 'headhunter.ru', 'rabota.ru', 'superjob.ru', 'linkedin.com'];
      if (!supportedSites.some(site => tab.url.includes(site))) return null;

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // rabota.ru
            const rabotaTitle = document.querySelector('.vacancy-title, [class*="vacancy-title"]');
            const rabotaDesc = document.querySelector('.vacancy-description, [class*="vacancy-description"]');
            const rabotaCompany = document.querySelector('.company-name, [class*="company-name"]');

            // superjob.ru  
            const sjTitle = document.querySelector('[class*="VacancyTitle"], h1');
            const sjDesc = document.querySelector('[class*="VacancyDescription"], [class*="vacancy-description"]');
            const sjCompany = document.querySelector('[class*="CompanyName"], [class*="company-name"]');

            // hh.ru
            const titleEl = document.querySelector('[data-qa="vacancy-title"]') || rabotaTitle || sjTitle || document.querySelector('h1');
            const descEl = document.querySelector('[data-qa="vacancy-description"]') || document.querySelector('.vacancy-description') || rabotaDesc || sjDesc || document.querySelector('[class*="vacancy-description"]');
            const companyEl = document.querySelector('[data-qa="vacancy-company-name"]') || rabotaCompany || sjCompany || document.querySelector('[class*="company-name"]');

            const title = titleEl ? titleEl.innerText.trim() : '';
            const desc = descEl ? descEl.innerText.trim() : '';
            const company = companyEl ? companyEl.innerText.trim() : '';

            if (!desc && !title) return null;
            return {
              text: `Position: ${title}\nCompany: ${company}\n\n${desc}`,
              title: title,
              company: company,
            };
          },
        });
        console.log('executeScript results:', JSON.stringify(results));

        const job = results?.[0]?.result;
        return job || null;
      } catch (err) {
        console.error('executeScript error:', err);
        return null;
      }
    }

    function updateStatusLine() {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const jobPreview = document.getElementById('jobPreview');
        const jobTitle = document.getElementById('jobTitle');
        const jobCompany = document.getElementById('jobCompany');
        if (currentJobDescription) {
            statusDot.classList.add('active');
            statusText.dataset.i18n = 'statusJobFound';
            statusText.textContent = t('statusJobFound');
            jobPreview.hidden = false;
            jobTitle.textContent = currentJobDescription.title || '';
            jobCompany.textContent = currentJobDescription.company || '';
        } else {
            statusDot.classList.remove('active');
            statusText.dataset.i18n = 'statusOpenJob';
            statusText.textContent = t('statusOpenJob');
            jobPreview.hidden = true;
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
        screenHistory.hidden = true;
        screenMain.hidden = false;
    });

    async function renderHistory() {
        const history = await loadHistory();
        historyList.innerHTML = '';
        historyEmpty.hidden = history.length > 0;

        history.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'history-item';
            card.innerHTML = `
                <div class="history-item-job">${item.jobTitle || 'Без названия'}</div>
                <div class="history-item-date">${item.date || ''}</div>
            `;
            card.addEventListener('click', () => {
                coverLetterTextarea.value = item.coverLetter || '';
                resultDiv.hidden = false;
                screenHistory.hidden = true;
                screenSettings.hidden = true;
                screenMain.hidden = false;
            });
            historyList.appendChild(card);
        });
    }

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
        try {
            currentJobDescription = await getJobFromPage();
        } catch (error) {
            console.error('Could not get job from page:', error);
            currentJobDescription = null;
        }
        updateStatusLine();

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

        let response;
        try {
            response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resume,
                    jobDescription: currentJobDescription.text,
                    tone: currentTone,
                }),
            });

            if (!response.ok) {
                throw new Error(`${t('errorServer')}: ${response.status}`);
            }

            const data = await response.json();

            if (data.coverLetter) {
                const coverLetter = data.coverLetter;
                coverLetterTextarea.value = coverLetter;
                resultDiv.hidden = false;
                await saveToHistory(currentJobDescription?.title, coverLetter);
            } else {
                throw new Error(data.error || t('errorGenerate'));
            }
        } catch (error) {
            if (response) {
                const data = await response.json().catch(() => ({}));

                if (response.status === 429) {
                    if (data.errorCode === 'RATE_LIMIT') {
                        showError('Лимит запросов исчерпан. Попробуйте через час.');
                    } else {
                        showError('AI сервис перегружен. Попробуйте через минуту.');
                    }
                } else {
                    showError(data.error || t('errorGenerate'));
                }
            } else {
                showError(t('errorGenerate'));
            }
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

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (translations[currentLang][key]) {
                el.setAttribute('title', translations[currentLang][key]);
            }
        });

        updateStatusLine();
    }
}