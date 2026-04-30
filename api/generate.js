export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resume, jobDescription } = req.body;

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
            content: 'You are a professional cover letter writer. Write concise, personalized cover letters.',
          },
          {
            role: 'user',
            content: `Write a cover letter for this job:\n\n${jobDescription}\n\nMy resume:\n\n${resume}\n\nWrite in the same language as the job description. Be specific, professional, 3-4 paragraphs.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const coverLetter = data.choices?.[0]?.message?.content;

    if (!coverLetter) throw new Error('No response from AI');

    return res.status(200).json({ coverLetter });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}