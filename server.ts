import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '1mb' }));

// Known spam triggers for cold outreach
const SPAM_TRIGGER_LIST = [
  '100% free', '100% satisfied', 'act now', 'apply now', 'as seen on', 'bargain',
  'best price', 'big bucks', 'billion', 'bonus', 'buy now', 'cancel at any time',
  'cash bonus', 'cash prize', 'certified', 'cheap', 'claim now', 'clearance',
  'click here', 'click now', 'congratulations', 'credit card offers', 'cures',
  'dear friend', 'direct email', 'discount', 'double your income', 'earn extra cash',
  'earn money', 'eliminate debt', 'exclusive deal', 'expect to earn', 'extra cash',
  'fast cash', 'financial freedom', 'free consultation', 'free gift', 'free info',
  'free sample', 'free trial', 'full refund', 'get out of debt', 'get paid',
  'giveaway', 'guaranteed', 'hidden charges', 'income from home', 'increase sales',
  'instant', 'investment', 'limited time', 'lowest price', 'make money',
  'miracle', 'money back', 'no catch', 'no cost', 'no credit check',
  'no experience', 'no fees', 'no hidden', 'no obligation', 'no purchase necessary',
  'no risk', 'no strings attached', 'not spam', 'once in a lifetime', 'one time',
  'online marketing', 'open immediately', 'order now', 'passwords', 'pennies a day',
  'potential earnings', 'prize', 'pure profit', 'refinance', 'risk free',
  'save big', 'save money', 'score', 'secret', 'special promotion',
  'this isn\'t spam', 'unlimited', 'unsolicited', 'urgent', 'winner', 'winning'
];

function analyzeSpamHeuristically(subject: string, body: string) {
  const text = `${subject} ${body}`.toLowerCase();
  const riskyWords: string[] = [];

  for (const phrase of SPAM_TRIGGER_LIST) {
    if (text.includes(phrase)) {
      riskyWords.push(phrase);
    }
  }

  // Count exclamation marks
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 2) {
    riskyWords.push('excessive exclamations');
  }

  // Check all caps words in subject
  const subjectWords = subject.split(/\s+/);
  const capsSubjectWords = subjectWords.filter(
    (w) => w.length > 3 && w === w.toUpperCase() && /^[A-Z]+$/.test(w)
  );
  if (capsSubjectWords.length > 0) {
    riskyWords.push('all-caps subject words');
  }

  // Check personalization presence
  const hasPersonalization = text.includes('{name}');

  // Calculate score 0-100
  let score = 0;
  score += Math.min(riskyWords.length * 15, 60);
  if (exclamations > 3) score += 15;
  if (capsSubjectWords.length > 0) score += 15;
  if (!hasPersonalization) score += 10;
  if (subject.length > 70) score += 10;
  if (body.length < 50) score += 15;

  score = Math.min(Math.max(score, 0), 100);

  return {
    score,
    riskyWords: Array.from(new Set(riskyWords)).slice(0, 5),
    suggestions: [
      score > 30 ? 'Replace sales words with conversational phrases.' : 'Good conversational tone.',
      hasPersonalization ? 'Personalization placeholder {name} is present.' : 'Add {name} for better deliverability.',
      subject.length <= 60 ? 'Subject line is concise.' : 'Shorten subject line to under 60 characters.'
    ]
  };
}

// AI / Heuristic Spam check endpoint
app.post('/api/spam-check', async (req, res) => {
  try {
    const { subject = '', body = '' } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Analyze this cold outreach email for spam trigger words and deliverability risk.
Subject: "${subject}"
Body:
"""
${body}
"""

Return ONLY a valid JSON object in this format:
{
  "score": <number between 0 and 100, where 0 is pristine inbox-ready and 100 is definite spam>,
  "riskyWords": [<string list of trigger words or red flags found, max 5>],
  "suggestions": [<string list of 2-3 quick actionable tips to improve response rate>]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        if (typeof parsed.score === 'number' && Array.isArray(parsed.riskyWords)) {
          return res.json({
            score: Math.min(Math.max(Math.round(parsed.score), 0), 100),
            riskyWords: parsed.riskyWords.slice(0, 6),
            suggestions: parsed.suggestions || []
          });
        }
      } catch (genAiErr) {
        console.warn('Gemini spam analysis failed, falling back to heuristics:', genAiErr);
      }
    }

    // Heuristic fallback
    const result = analyzeSpamHeuristically(subject, body);
    return res.json(result);
  } catch (err: any) {
    console.error('Spam check error:', err);
    return res.status(500).json({
      score: 10,
      riskyWords: [],
      error: err.message || 'Spam check error'
    });
  }
});

// AI Variation generation endpoint
app.post('/api/ai-variation', async (req, res) => {
  try {
    const { goal = 'cold outreach to store owners', currentMessages = [] } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a cold outreach email expert. Generate a new high-converting, casual cold email template.
Target: E-commerce store owners and independent shop owners.
Important: MUST use the placeholder "{name}" for the recipient/store name.
Keep it under 90 words. Natural, polite, non-pushy.

Return ONLY a valid JSON object:
{
  "label": "Message Variation",
  "subject": "<subject line with {name}>",
  "body": "<body text with {name} and signoff>"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.subject && parsed.body) {
          return res.json(parsed);
        }
      } catch (genErr) {
        console.warn('Gemini variation generation error:', genErr);
      }
    }

    // High quality offline fallback variation
    const fallbacks = [
      {
        label: 'Curious check-in',
        subject: 'Quick question about {name}',
        body: 'Hi {name},\n\nCame across your store recently and really liked your catalog setup.\n\nAre you currently looking to expand your repeat customer orders this quarter, or is that already covered?\n\nHappy to share a quick 2-minute overview if timely.\n\nBest,\nMythsuite'
      },
      {
        label: 'Conversion idea',
        subject: '{name} — mobile conversion suggestion',
        body: 'Hello {name},\n\nI was browsing your shop and noticed a couple of friction points in checkout that are super quick to optimize.\n\nWould it be okay if I sent over a short 3-point teardown?\n\nWarmly,\nMythsuite'
      }
    ];

    const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return res.json(pick);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Mythsuite server running on http://0.0.0.0:${port}`);
  });
}

startServer();
