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

Analyseer het transcript en genereer een complete analyse met de volgende onderdelen:

## 1. INZICHTBLOKKEN
Identificeer:
1. **Patronen** (type: "patroon"): Terugkerende thema's, herhaalde woorden/zinnen, gesprekspatronen
2. **Spanningen** (type: "spanning"): Tegenstellingen, conflicten, onuitgesproken frustraties, tegenstrijdige standpunten
3. **Aannames** (type: "aanname"): Impliciete aannames die niet uitgesproken worden, blinde vlekken, vanzelfsprekend geachte zaken
4. **Kansen** (type: "kans"): Onbenutte mogelijkheden, potentiële doorbraken, creatieve verbindingen

Voor elk inzicht:
- Schrijf een "summary" die het onderwerp helder samenvat (WAT en WAAROM, 2-3 zinnen)
- Geef 1 relevant letterlijk citaat uit het transcript
- Formuleer 2-3 kritische vragen die het gesprek kunnen verdiepen
- Geef 2-3 "inspirations" van bekende denkers/experts met quote, author, context
- Geef een "sentiment" score: "positief", "neutraal", "gespannen" of "negatief"

## 2. META-ANALYSE
Genereer ook een overkoepelende analyse van het gesprek:

- **sentiment_overall**: De algemene toon van het gesprek ("positief", "neutraal", "gespannen", "negatief")
- **energie**: Energieniveau ("hoog", "gemiddeld", "laag") — gebaseerd op de levendigheid, snelheid en betrokkenheid in het gesprek
- **taalpatronen**: Array van 1-3 opvallende taalpatronen die je opvalt. Elk patroon heeft een "label" (kort, bv "Veel verkleinwoorden") en een "betekenis" (wat dit zegt over de groepsdynamiek, 1 zin)
- **nudge**: Eén zachte suggestie/interventie voor de gespreksleider. Dit is een korte, vriendelijke hint over iets dat het gesprek zou kunnen verdiepen of verbeteren. Bijvoorbeeld: "Er wordt veel gesproken over het probleem, maar weinig over mogelijke oplossingen" of "Deelnemer A heeft al een tijdje niet meer gesproken". Max 1-2 zinnen.
- **samenvatting**: Een kernachtige samenvatting van het hele gesprek tot nu toe (3-4 zinnen). Wat is het hoofdonderwerp? Waar staat het gesprek nu? Wat zijn de belangrijkste punten?
- **acties**: Array van 0-5 actie-items of beslissingen die in het gesprek naar voren kwamen. Elk item heeft een "tekst" (de actie/beslissing) en een "type" ("actie" of "beslissing")

Reageer in het Nederlands.

BELANGRIJK: Reageer met ALLEEN raw JSON. Geen markdown, geen code blocks, geen backticks, geen uitleg. Alleen het JSON object:
{
  "blocks": [
    {
      "type": "patroon" | "spanning" | "aanname" | "kans",
      "title": "Korte titel",
      "summary": "Samenvatting (2-3 zinnen)",
      "quote": "Letterlijk citaat uit transcript",
      "questions": ["Vraag 1", "Vraag 2"],
      "sentiment": "positief" | "neutraal" | "gespannen" | "negatief",
      "inspirations": [
        { "quote": "Citaat", "author": "Naam", "context": "Toepassing (1-2 zinnen)" }
      ]
    }
  ],
  "meta": {
    "sentiment_overall": "positief" | "neutraal" | "gespannen" | "negatief",
    "energie": "hoog" | "gemiddeld" | "laag",
    "taalpatronen": [
      { "label": "Kort label", "betekenis": "Wat dit zegt (1 zin)" }
    ],
    "nudge": "Zachte suggestie voor de gespreksleider",
    "samenvatting": "Kernachtige samenvatting van het gesprek (3-4 zinnen)",
    "acties": [
      { "tekst": "De actie of beslissing", "type": "actie" | "beslissing" }
    ]
  }
}

Genereer zoveel inzichtblokken als nodig. Er mogen meerdere blokken van hetzelfde type zijn. Niet elk type hoeft vertegenwoordigd te zijn. Focus op de meest waardevolle inzichten.`;

    let userMessage = `TRANSCRIPT:\n${transcript}`;

    if (previousBlocks && previousBlocks.length > 0) {
      const summary = previousBlocks.map(b => `- [${b.type}] ${b.title}`).join('\n');
      userMessage += `\n\nEERDERE INZICHTEN (vermijd herhaling, bouw hierop voort):\n${summary}`;
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
        max_tokens: 3500,
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
