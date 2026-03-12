const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '4mb' }));
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PROVIDERS = {
  cerebras: { url:'https://api.cerebras.ai/v1/chat/completions', keys:['CB1','CB2','CB3','CB4','CB5','CB6','CB7'].map(k=>process.env[k]).filter(Boolean), model:'llama-3.3-70b', idx:0, type:'openai' },
  groq:     { url:'https://api.groq.com/openai/v1/chat/completions', keys:['GR1','GR2','GR3','GR4','GR5','GR6','GR7'].map(k=>process.env[k]).filter(Boolean), model:'llama-3.3-70b-versatile', idx:0, type:'openai' },
  sambanova:{ url:'https://api.sambanova.ai/v1/chat/completions', keys:['SN1','SN2','SN3','SN4','SN5'].map(k=>process.env[k]).filter(Boolean), model:'Meta-Llama-3.3-70B-Instruct', idx:0, type:'openai' },
  together: { url:'https://api.together.xyz/v1/chat/completions', keys:['TO1','TO2','TO3','TO4','TO5','TO6','TO7'].map(k=>process.env[k]).filter(Boolean), model:'meta-llama/Llama-3.3-70B-Instruct-Turbo', idx:0, type:'openai' },
  openrouter:{ url:'https://openrouter.ai/api/v1/chat/completions', keys:['OR1','OR2','OR3','OR4','OR5','OR6','OR7'].map(k=>process.env[k]).filter(Boolean), model:'meta-llama/llama-3.3-70b-instruct', idx:0, type:'openai' },
  deepseek: { url:'https://api.deepseek.com/v1/chat/completions', keys:['DS1','DS2','DS3','DS4','DS5','DS6'].map(k=>process.env[k]).filter(Boolean), model:'deepseek-chat', idx:0, type:'openai' },
  gemini:   { keys:['G1','G2','G3','G4','G5','G6','G7'].map(k=>process.env[k]).filter(Boolean), model:'gemini-1.5-flash', idx:0, type:'gemini' },
  grok:     { url:'https://api.x.ai/v1/chat/completions', keys:['GK1','GK2','GK3'].map(k=>process.env[k]).filter(Boolean), model:'grok-beta', idx:0, type:'openai' },
  claude:   { url:'https://api.anthropic.com/v1/messages', keys:['CL1'].map(k=>process.env[k]).filter(Boolean), model:'claude-3-haiku-20240307', idx:0, type:'anthropic' },
};
const ORDER = ['cerebras','groq','sambanova','together','openrouter','deepseek','gemini','grok','claude'];

async function callProvider(name, messages, system, maxTokens) {
  const p = PROVIDERS[name];
  if (!p.keys.length) throw new Error('no keys');
  const key = p.keys[p.idx % p.keys.length]; p.idx++;

  if (p.type === 'gemini') {
    const contents = messages.map(m => ({ role: m.role==='assistant'?'model':'user', parts:[{text:m.content}] }));
    const body = { contents, generationConfig:{maxOutputTokens:maxTokens} };
    if (system) body.systemInstruction = { parts:[{text:system}] };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${p.model}:generateContent?key=${key}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body), signal:AbortSignal.timeout(15000) });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  if (p.type === 'anthropic') {
    const r = await fetch(p.url, { method:'POST', headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'}, body:JSON.stringify({model:p.model,max_tokens:maxTokens,system:system||undefined,messages}), signal:AbortSignal.timeout(20000) });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message||JSON.stringify(d.error));
    return d.content?.[0]?.text || '';
  }
  const msgs = system ? [{role:'system',content:system},...messages] : messages;
  const r = await fetch(p.url, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`}, body:JSON.stringify({model:p.model,messages:msgs,max_tokens:maxTokens,temperature:0.7}), signal:AbortSignal.timeout(15000) });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message||JSON.stringify(d.error));
  const text = d.choices?.[0]?.message?.content; if (!text) throw new Error('Empty');
  return text;
}

async function callAI(messages, system, maxTokens=1024) {
  for (const name of ORDER) {
    try { const text=await callProvider(name,messages,system,maxTokens); console.log(`[${name}] OK`); return {text,provider:name}; }
    catch(e) { console.error(`[${name}]`,e.message); }
  }
  throw new Error('All providers failed');
}

app.get('/api/status', (req,res) => {
  const st={}; ORDER.forEach(n=>{st[n]=PROVIDERS[n].keys.length}); res.json({ok:true,providers:st});
});
app.post('/api/chat', async(req,res) => {
  try { const {messages,system}=req.body; const r=await callAI(messages,system||'Ты NEXUM — умный AI-агент. Отвечай на языке пользователя. Коротко и по делу.',1024); res.json({content:[{type:'text',text:r.text}],provider:r.provider}); }
  catch(e){res.status(500).json({error:e.message})}
});
app.post('/api/generate-site', async(req,res) => {
  try { const {prompt}=req.body; const sys='Ты генератор сайтов. Создай красивый HTML одним файлом. CSS и JS встроены. Тёмная тема, современный дизайн. ТОЛЬКО HTML без ``` и объяснений. Начинай с <!DOCTYPE html>.'; const r=await callAI([{role:'user',content:`Создай: ${prompt}`}],sys,4096); let html=r.text.replace(/^```html\n?/,'').replace(/^```\n?/,'').replace(/\n?```$/,'').trim(); res.json({html,provider:r.provider}); }
  catch(e){res.status(500).json({error:e.message})}
});
app.post('/api/create-tool', async(req,res) => {
  try { const {description}=req.body; const r=await callAI([{role:'user',content:description}],'Верни ТОЛЬКО JSON без markdown: {name,icon,desc,usage}',300); let t=r.text.replace(/^```json\n?/,'').replace(/^```\n?/,'').replace(/\n?```$/,'').trim(); res.json({...JSON.parse(t),provider:r.provider}); }
  catch(e){res.status(500).json({error:e.message})}
});

app.listen(PORT, () => console.log(`NEXUM v2 running on port ${PORT}`));
