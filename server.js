const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

// Health check
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ── AI CHAT (Groq - бесплатно) ──────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, system } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY не задан в переменных окружения' });
  }

  try {
    const groqMessages = [];
    if (system) groqMessages.push({ role: 'system', content: system });
    groqMessages.push(...messages);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    // Возвращаем в формате совместимом с фронтендом
    res.json({
      content: [{ type: 'text', text: data.choices?.[0]?.message?.content || '' }]
    });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── GENERATE WEBSITE (Groq) ──────────────────────────────────
app.post('/api/generate-site', async (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY не задан' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Ты генератор сайтов. Создай полноценный красивый HTML-сайт одним файлом. CSS и JS встроены inline. Современный дизайн, тёмная тема, плавные CSS анимации. Верни ТОЛЬКО HTML код без объяснений, без markdown, без ```html. Начинай строго с <!DOCTYPE html>.'
          },
          { role: 'user', content: `Создай красивый современный сайт: ${prompt}` }
        ],
        max_tokens: 4096,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    let html = data.choices?.[0]?.message?.content || '';
    html = html.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();

    res.json({ html });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── CREATE TOOL (Groq) ───────────────────────────────────────
app.post('/api/create-tool', async (req, res) => {
  const { description } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY не задан' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Ты создаёшь инструменты. Верни ТОЛЬКО JSON объект (без markdown, без ```json) с полями: name (название на русском), icon (один эмодзи), desc (краткое описание на русском, 1 предложение), usage (как использовать, 1 предложение).'
          },
          { role: 'user', content: `Создай описание инструмента: ${description}` }
        ],
        max_tokens: 300,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    let text = data.choices?.[0]?.message?.content || '{}';
    text = text.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim();
    const tool = JSON.parse(text);
    res.json(tool);

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => console.log(`NEXUM API running on port ${PORT}`));
