// Provider‑agnostic LLM client (currently Gemini only)
// Using global fetch (Node 18+).
const AppError = require('../../utils/AppError');

async function generateJSON({ system, prompt, temperature = 0.3 }) {
  const provider = process.env.LLM_PROVIDER || 'gemini';
  if (provider !== 'gemini') {
    throw new AppError('Unsupported LLM provider', 400);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  // Default model if env var missing (new default)
  const model = process.env.LLM_MODEL || 'gemini-3-flash-preview';
  if (!apiKey) {
    throw new AppError('Missing GEMINI_API_KEY in environment', 503);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const baseBody = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature },
  };

  // Helper to perform a fetch with its own AbortController + 12s timeout
  async function fetchWithTimeout(bodyObj) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12 s
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(bodyObj),
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(timeout);
    }
  }

  // First request
  let response;
  try {
    response = await fetchWithTimeout(baseBody);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AppError('LLM request timed out', 503);
    }
    throw err;
  }

  // If non‑2xx, try to extract Google error message
  if (!response.ok) {
    let errMsg = 'LLM request failed';
    try {
      const errJson = await response.json();
      if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
    } catch (_) {}
    throw new AppError(errMsg, response.status);
  }

  // Retry on 429 / 5xx – one retry after 1 s
  if (response.status === 429 || response.status >= 500) {
    await new Promise(r => setTimeout(r, 1000));
    // Fresh body for retry (same as baseBody)
    response = await fetchWithTimeout(baseBody);
    if (!response.ok) {
      let errMsg = 'LLM request failed (retry)';
      try {
        const errJson = await response.json();
        if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
      } catch (_) {}
      throw new AppError(errMsg, response.status);
    }
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
    // retry with extra instruction – build a fresh body
    const retryBody = {
      ...baseBody,
      contents: [{ role: 'user', parts: [{ text: `${prompt}\n\nReturn ONLY valid JSON.` }] }],
    };
    const retryRes = await fetchWithTimeout(retryBody);
    if (!retryRes.ok) {
      let errMsg = 'LLM request failed (JSON retry)';
      try {
        const errJson = await retryRes.json();
        if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
      } catch (_) {}
      throw new AppError(errMsg, retryRes.status);
    }
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
