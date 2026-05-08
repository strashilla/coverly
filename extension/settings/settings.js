const translations = {
    en: {
        resumeTitle: 'Your Resume',
        resumeDesc: 'Enter your resume once - it will be saved and used for all applications.',
        resumePlaceholder: 'Paste your resume here...',
        saveBtn: 'Save Resume',
        languageTitle: 'Language',
        apiTitle: 'API Endpoint',
        apiHint: 'Set your URL in extension/config.js (COVERLY_API_URL).',
        saved: 'Resume saved successfully!',
        error: 'Failed to save settings',
    },
    ru: {
        resumeTitle: 'Ваше резюме',
        resumeDesc: 'Введите резюме один раз - оно будет сохранено и использоваться для всех заявок.',
        resumePlaceholder: 'Вставьте ваше резюме здесь...',
        saveBtn: 'Сохранить резюме',
        languageTitle: 'Язык',
        apiTitle: 'API Endpoint',
        apiHint: 'Укажи URL в extension/config.js (COVERLY_API_URL).',
        saved: 'Резюме успешно сохранено!',
        error: 'Не удалось сохранить настройки',
    },
};

let currentLang = 'en';

chrome.storage.local.get('resume', (result) => {
    if (!result.resume) {
        document.getElementById('welcomeBanner').style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', init);

async function init() {
    const resumeInput = document.getElementById('resume');
    const saveBtn = document.getElementById('saveBtn');
    const messageDiv = document.getElementById('message');

    await loadSettings();

    saveBtn.addEventListener('click', handleSave);

    async function loadSettings() {
        try {
            const result = await chrome.storage.local.get(['resume', 'language']);
            
            if (result.resume) {
                resumeInput.value = result.resume;
            }
            if (result.language) {
                currentLang = result.language;
            }
            
            updateLanguageUI();
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async function handleSave() {
        const resume = resumeInput.value.trim();

        if (!resume) {
            showMessage(translations[currentLang].error, 'error');
            return;
        }

        try {
            await chrome.storage.local.set({
                resume,
            });
            showMessage(translations[currentLang].saved, 'success');
        } catch (error) {
            showMessage(translations[currentLang].error, 'error');
        }
    }

    async function setLanguage(lang) {
        currentLang = lang;
        try {
            await chrome.storage.local.set({ language: lang });
        } catch (error) {
            console.error('Failed to save language:', error);
        }
        updateLanguageUI();
    }

    function updateLanguageUI() {
        const t = translations[currentLang];
        
        document.querySelector('h2').textContent = t.resumeTitle;
        document.querySelector('.description').textContent = t.resumeDesc;
        resumeInput.placeholder = t.resumePlaceholder;
        saveBtn.textContent = t.saveBtn;
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.hidden = false;
        
        setTimeout(() => {
            messageDiv.hidden = true;
        }, 3000);
    }
}