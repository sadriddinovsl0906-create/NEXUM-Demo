# NEXUM — AI Agent Web App

Полноценное веб-приложение NEXUM с AI чатом, генератором сайтов, инструментами, заметками, задачами, привычками и финансами.

## Структура проекта

```
nexum-project/
├── server.js       ← API сервер (деплоишь на Railway)
├── package.json    ← зависимости сервера
├── index.html      ← фронтенд (деплоишь на Vercel/Netlify)
└── .gitignore
```

## Шаг 1 — Получи бесплатный Groq API ключ

1. Зайди на https://console.groq.com
2. Зарегистрируйся (бесплатно)
3. API Keys → Create API Key
4. Скопируй ключ: `gsk_...`

## Шаг 2 — Задеплой сервер на Railway

1. Зайди на https://railway.app
2. New Project → Deploy from GitHub repo
3. Выбери этот репо
4. В настройках Variables добавь:
   ```
   GROQ_API_KEY=gsk_твой_ключ
   ```
5. После деплоя скопируй URL: `https://nexum-api-xxx.up.railway.app`

## Шаг 3 — Задеплой фронтенд на Vercel

1. Зайди на https://vercel.com
2. New Project → Import Git Repository → выбери этот репо
3. Framework Preset: **Other**
4. Root Directory: `.`  (корень)
5. Deploy!

## Шаг 4 — Подключи API в приложении

1. Открой сайт
2. Перейди в **AI Чат**
3. Нажми кнопку **Настроить**
4. Вставь URL Railway сервера из Шага 2
5. Готово!

## Всё бесплатно

| Сервис | Лимит | Цена |
|--------|-------|------|
| Groq API | 30 req/min, 6000 req/day | Бесплатно |
| Railway | 500 часов/месяц | Бесплатно |
| Vercel | Unlimited | Бесплатно |

## Функционал

- ✦ **AI Чат** — Llama 3.3 70B через Groq
- ◫ **Website Builder** — генерация HTML сайтов
- ⚙ **Инструменты** — создание кастомных AI инструментов  
- ✎ **Заметки** — с автосохранением
- ✓ **Задачи** — чекбоксы и управление
- ◎ **Привычки** — трекер по дням
- ◈ **Финансы** — доходы и расходы
- ◉ **Голоса** — 25+ голосов edge-tts
- Кнопка перехода в **@ainexum_bot**
