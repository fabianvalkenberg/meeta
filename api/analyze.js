export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, previousBlocks } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const systemPrompt = `Je bent Meeta: een real-time gespreksanalist die meeluistert met gesprekken en diepgaande inzichten genereert. Je analyseert transcripten van lopende gesprekken in het Nederlands.

Analyseer het transcript en identificeer:
1. **Patronen** (type: "patroon"): Terugkerende thema's, herhaalde woorden/zinnen, gesprekspatronen
2. **Spanningen** (type: "spanning"): Tegenstellingen, conflicten, onuitgesproken frustraties, tegenstrijdige standpunten
3. **Aannames** (type: "aanname"): Impliciete aannames die niet uitgesproken worden, blinde vlekken, vanzelfsprekend geachte zaken
4. **Kansen** (type: "kans"): Onbenutte mogelijkheden, potentiële doorbraken, creatieve verbindingen

Voor elk inzicht:
- Schrijf een "summary" die het onderwerp helder samenvat in de context van het gesprek. De summary moet duidelijk maken WAT er gezegd werd en WAAROM het relevant is.
- Geef 1 relevant citaat uit het transcript dat dit inzicht onderbouwt. Gebruik een letterlijk citaat.
- Formuleer 2-3 kritische vragen die het gesprek kunnen verdiepen.
- Geef 2-3 "inspirations": relevante inzichten, citaten of ideeën van bekende denkers, auteurs, wetenschappers of experts die aansluiten bij dit onderwerp. Elk inspiration heeft een "quote" (het citaat of inzicht), een "author" (wie het zei) en een "context" (korte uitleg hoe dit van toepassing is op het gesprek, 1-2 zinnen).

Reageer in het Nederlands.

BELANGRIJK: Reageer met ALLEEN raw JSON. Geen markdown, geen code blocks, geen backticks, geen uitleg. Alleen het JSON object:
{
  "blocks": [
    {
      "type": "patroon" | "spanning" | "aanname" | "kans",
      "title": "Korte titel",
      "summary": "Samenvatting van het inzicht in context van het gesprek (2-3 zinnen)",
      "quote": "Letterlijk citaat uit transcript",
      "questions": ["Vraag 1", "Vraag 2", "Vraag 3"],
      "inspirations": [
        {
          "quote": "Citaat of inzicht van een denker",
          "author": "Naam van de denker",
          "context": "Hoe dit van toepassing is op het gesprek (1-2 zinnen)"
        }
      ]
    }
  ]
}

Genereer zoveel inzichtblokken als nodig, afhankelijk van de rijkheid van het transcript. Elk apart onderwerp of inzicht krijgt een eigen blok. Er mogen meerdere blokken van hetzelfde type zijn — bijvoorbeeld 3x kans en 0x spanning als dat past bij het gesprek. Niet elk type hoeft vertegenwoordigd te zijn. Forceer geen type als het er niet in zit. Focus op de meest waardevolle en actiegerichte inzichten.`;

    let userMessage = `TRANSCRIPT:\n${transcript}`;

    if (previousBlocks && previousBlocks.length > 0) {
      userMessage += `\n\nEERDERE INZICHTEN (vermijd herhaling, bouw hierop voort):\n${JSON.stringify(previousBlocks, null, 2)}`;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);
      return res.status(502).json({ error: `Anthropic API error: ${response.status}` });
    }

    const message = await response.json();
    let content = message.content[0].text.trim();

    // Strip markdown code blocks if Claude wraps the JSON
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    const parsed = JSON.parse(content);

    res.json(parsed);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
