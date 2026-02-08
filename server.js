import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Je bent een Co-Designer: een real-time gespreksanalist die meeluistert met gesprekken en diepgaande inzichten genereert. Je analyseert transcripten van lopende gesprekken.

Analyseer het transcript en identificeer:
1. **Patronen** (type: "patroon"): Terugkerende thema's, herhaalde woorden/zinnen, gesprekspatronen
2. **Spanningen** (type: "spanning"): Tegenstellingen, conflicten, onuitgesproken frustraties, tegenstrijdige standpunten
3. **Aannames** (type: "aanname"): Impliciete aannames die niet uitgesproken worden, blinde vlekken, vanzelfsprekend geachte zaken
4. **Kansen** (type: "kans"): Onbenutte mogelijkheden, potentiële doorbraken, creatieve verbindingen

Voor elk inzicht, formuleer 2-3 kritische vragen die het gesprek kunnen verdiepen.

Reageer ALTIJD in de taal van het transcript (Nederlands of Engels).

Reageer UITSLUITEND met valide JSON in dit formaat:
{
  "blocks": [
    {
      "type": "patroon" | "spanning" | "aanname" | "kans",
      "title": "Korte titel",
      "summary": "Samenvatting van het inzicht (1-2 zinnen)",
      "questions": ["Vraag 1", "Vraag 2", "Vraag 3"]
    }
  ]
}

Genereer 2-6 inzichtblokken per analyse, afhankelijk van de rijkheid van het transcript. Als het transcript te kort of onsamenhangend is, geef dan minder blokken. Focus op de meest waardevolle en actiegerichte inzichten.`;

app.post('/api/analyze', async (req, res) => {
  try {
    const { transcript, previousBlocks } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    let userMessage = `TRANSCRIPT:\n${transcript}`;

    if (previousBlocks && previousBlocks.length > 0) {
      userMessage += `\n\nEERDERE INZICHTEN (vermijd herhaling, bouw hierop voort):\n${JSON.stringify(previousBlocks, null, 2)}`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = message.content[0].text;
    const parsed = JSON.parse(content);

    res.json(parsed);
  } catch (error) {
    console.error('Analysis error:', error);

    if (error instanceof SyntaxError) {
      res.status(500).json({ error: 'Failed to parse Claude response as JSON' });
    } else {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
});

const PORT = process.env.PORT || 3001;
await app.listen(PORT);
console.log(`Co-Designer server running on port ${PORT}`);
