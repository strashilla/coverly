// Coverly Settings Script

const translations = {
    en: {
        resumeTitle: 'Your Resume',
        resumeDesc: 'Enter your resume once - it will be saved and used for all applications.',
        resumePlaceholder: 'Paste your resume here...',
        saveBtn: 'Save Resume',
        languageTitle: 'Language',
        apiTitle: 'API Endpoint',
        apiHint: 'Default: https://coverly.vercel.app/api/generate',
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
        apiHint: 'По умолчанию: https://coverly.vercel.app/api/generate',
        saved: 'Резюме успешно сохранено!',
        error: 'Не удалось сохранить настройки',
    },
};

let currentLang = 'en';

document.addEventListener('DOMContentLoaded', init);

async function init() {
    const resumeInput = document.getElementById('resume');
    const saveBtn = document.getElementById('saveBtn');
    const langEn = document.getElementById('langEn');
    const langRu = document.getElementById('langRu');
    const apiUrlInput = document.getElementById('apiUrl');
    const messageDiv = document.getElementById('message');

    // Load saved settings
    await loadSettings();

    saveBtn.addEventListener('click', handleSave);
    langEn.addEventListener('click', () => setLanguage('en'));
    langRu.addEventListener('click', () => setLanguage('ru'));

    async function loadSettings() {
        try {
            const result = await chrome.storage.local.get(['resume', 'language', 'apiUrl']);
            
            if (result.resume) {
                resumeInput.value = result.resume;
            }
            if (result.language) {
                currentLang = result.language;
            }
            if (result.apiUrl) {
                apiUrlInput.value = result.apiUrl;
            } else {
                apiUrlInput.value = 'https://coverly.vercel.app/api/generate';
            }
            
            updateLanguageUI();
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async function handleSave() {
        const resume = resumeInput.value.trim();
        const apiUrl = apiUrlInput.value.trim();

        if (!resume) {
            showMessage(translations[currentLang].error, 'error');
            return;
        }

        try {
            await chrome.storage.local.set({
                resume,
                apiUrl: apiUrl || 'https://coverly.vercel.app/api/generate',
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
        // Update language buttons
        document.getElementById('langEn').classList.toggle('active', currentLang === 'en');
        document.getElementById('langRu').classList.toggle('active', currentLang === 'ru');

        // Update texts
        const t = translations[currentLang];
        
        document.querySelector('h2').textContent = t.resumeTitle;
        document.querySelector('.description').textContent = t.resumeDesc;
        resumeInput.placeholder = t.resumePlaceholder;
        saveBtn.textContent = t.saveBtn;
        
        document.querySelectorAll('.section h2')[1].textContent = t.languageTitle;
        document.querySelectorAll('.section h2')[2].textContent = t.apiTitle;
        document.querySelector('.hint').textContent = t.apiHint;
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