# Coverly — сопроводительные письма к вакансиям в один клик

![Chrome Extension](https://img.shields.io/badge/Extension-Manifest%20V3-4285F4?style=flat&logo=googlechrome&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/API-Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Groq](https://img.shields.io/badge/LLM-Groq-f55036?style=flat)

Расширение для браузера: на странице вакансии сохраняешь резюме один раз — получаешь черновик сопроводительного письма на языке вакансии (RU/EN) без ручного копипаста в чат.

---

## О проекте

**Coverly** сочетает Chrome-расширение (парсинг страницы, PDF резюме, история) и серверless-эндпоинт на Vercel, который вызывает Groq и возвращает готовый текст. Ключ API хранится только на сервере, не в расширении и не в репозитории.

---

## Превью

> Добавь сюда скриншот: открытый попап расширения на фоне страницы вакансии.

<!-- ![Превью](docs/preview.png) -->

---

## Ключевые возможности

- **Один клик** — генерация из попапа на активной вкладке с вакансией.
- **Сайты** — hh.ru, HeadHunter, Rabota.ru, Superjob, LinkedIn (см. `manifest.json`).
- **Резюме** — текст или загрузка PDF (pdf.js), хранение в `chrome.storage`.
- **Тон письма** — формальный, дружелюбный, короткий.
- **История** — последние ответы в попапе.
- **Лимиты** — базовый rate limit на API по IP (см. `api/generate.js`).
- **i18n** — переключение EN/RU в интерфейсе попапа.

---

## Структура репозитория

| Путь | Назначение |
|------|------------|
| `extension/` | Chrome Extension: попап, content/background scripts, иконки, `config.js` |
| `api/generate.js` | Vercel Serverless Function: Groq, промпт, лимиты |
| `.env.example` | Шаблон переменных для локали / документации (без секретов) |

---

## Быстрый старт

### 1. Бэкенд (Vercel)

1. Задеплой репозиторий на [Vercel](https://vercel.com).
2. В **Settings → Environment Variables** добавь `GROQ_API_KEY` (ключ из [Groq Console](https://console.groq.com/keys)).
3. Сделай redeploy, если переменную добавил после первого деплоя.

### 2. Расширение

1. Открой `extension/config.js` и задай свой URL:

   ```js
   globalThis.COVERLY_API_URL = 'https://ТВОЙ-ПРОЕКТ.vercel.app/api/generate';
   ```

2. Если API не на `*.vercel.app`, добавь нужный origin в `extension/manifest.json` → `host_permissions`.

3. В Chrome открой `chrome://extensions` → **Режим разработчика** → **Загрузить распакованное расширение** → выбери папку `extension/`.

### 3. Локальная разработка API (опционально)

Скопируй `.env.example` в `.env.local`, укажи `GROQ_API_KEY`, затем:

```bash
npx vercel dev
```

Для расширения временно укажи URL от `vercel dev` в `config.js` и разреши `http://localhost:...` в `host_permissions`.

---

## Безопасность

- Не коммить `.env` с реальным `GROQ_API_KEY`.
- В открытом репозитории достаточно пустого `GROQ_API_KEY=` в `.env.example`.
- Расширение обращается только к публичному HTTPS API; секрет остаётся на Vercel.

---

## Лицензия

Укажи лицензию при необходимости (например MIT) — файл `LICENSE` можно добавить отдельно.
