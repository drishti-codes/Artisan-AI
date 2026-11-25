// Provider‑agnostic LLM client (currently Gemini only)
// Using global fetch (Node 18+).
const AppError = require('../../utils/AppError');

async function generateJSON({ system, prompt, temperature = 0.3 }) {
  const provider = process.env.LLM_PROVIDER || 'gemini';
  if (provider !== 'gemini') {
    throw new AppError('Unsupported LLM provider', 400);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!apiKey) {
    throw new AppError('Missing GEMINI_API_KEY in environment', 503);
  }
  if (!model) {
    throw new AppError('Missing LLM_MODEL in environment', 503);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20 s

  const makeRequest = async () => {
    const res = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.status === 429 || res.status >= 500) {
      // retry once after 1 s
      await new Promise(r => setTimeout(r, 1000));
      return fetch(`${url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    }
    return res;
  };

  let response;
  try {
    response = await makeRequest();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AppError('LLM request timed out', 503);
    }
    throw err;
  }

  const json = await response.json();
  if (!json.candidates || !json.candidates[0]) {
    throw new AppError('LLM returned no candidates', 502);
  }
  const parts = json.candidates[0].content?.parts || [];
  let text = parts.map(p => p.text || '').join('');

  // Strip optional markdown fences
  text = text.replace(/```json\n?|```/g, '').trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    // retry with extra instruction
    const retryBody = { ...body };
    retryBody.contents[0].parts[0].text = `${prompt}\n\nReturn ONLY valid JSON.`;
    const retryRes = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(retryBody),
      signal: controller.signal,
    });
    const retryJson = await retryRes.json();
    const retryParts = retryJson.candidates?.[0]?.content?.parts || [];
    let retryText = retryParts.map(p => p.text || '').join('').replace(/```json\n?|```/g, '').trim();
    try {
      return JSON.parse(retryText);
    } catch (e2) {
      throw new AppError('AI response was not valid', 502);
    }
  }
}

module.exports = { generateJSON };