const ipRequests = new Map();
const RATE_LIMIT = 10; // запросов
const RATE_WINDOW = 60 * 60 * 1000; // 1 час в миллисекундах

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const now = Date.now();

  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
  } else {
    const data = ipRequests.get(ip);
    if (now > data.resetAt) {
      ipRequests.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    } else if (data.count >= RATE_LIMIT) {
      return res.status(429).json({
        error: 'Too many requests. Try again in an hour.',
        errorCode: 'RATE_LIMIT',
      });
    } else {
      data.count++;
    }
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resume, jobDescription, tone } = req.body;
  const toneInstructions = {
    formal: 'Use formal, professional tone. Full paragraphs.',
    friendly: 'Use warm, friendly but professional tone.',
    short: 'Write a SHORT cover letter, maximum 150 words. Be concise.',
  };

  if (!resume || !jobDescription) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: 'You are a professional cover letter writer. You write ONLY in the language of the job description. You NEVER mix languages. If the job is in Russian - write entirely in Russian. If in English - write entirely in English.',
          },
          {
            role: 'user',
            content: `Write a cover letter for this job:\n\n${jobDescription}\n\nMy resume:\n\n${resume}\n\nIMPORTANT RULES:\n- Detect the language of the JOB DESCRIPTION\n- Write the cover letter in the SAME language as the job description\n- If job is in English - write in English\n- If job is in Russian - write in Russian\n- NEVER mix languages\n- 3-4 paragraphs, professional tone\n\nTone: ${toneInstructions[tone] || toneInstructions.formal}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        return res.status(429).json({
          error: 'AI service is overloaded. Please try again in a minute.',
          errorCode: 'GROQ_RATE_LIMIT',
        });
      }
      if (response.status === 401) {
        return res.status(500).json({
          error: 'AI service configuration error.',
          errorCode: 'AUTH_ERROR',
        });
      }
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const coverLetter = data.choices?.[0]?.message?.content;

    if (!coverLetter) throw new Error('No response from AI');

    return res.status(200).json({ coverLetter });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}