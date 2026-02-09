export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, existingBlocks } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const systemPrompt = `Je bent Meeta: een real-time gespreksanalist die meeluistert met gesprekken en **evoluerend** inzichten genereert. Je analyseert het VOLLEDIGE transcript van een lopend gesprek in het Nederlands.

Dit is een iteratief proces: elke ~40 seconden ontvang je het volledige transcript opnieuw, samen met de inzichtkaartjes die al bestaan. Jouw taak is om te beslissen welke kaartjes moeten worden TOEGEVOEGD, BIJGEWERKT of VERWIJDERD.

## KERNPRINCIPES
- **Kwaliteit boven kwantiteit**: Voeg ALLEEN een nieuw kaartje toe als er echt een waardevol inzicht is. Het is volkomen OK om 0 nieuwe kaartjes te genereren.
- **Evolutie**: Als een patroon sterker wordt in het gesprek, UPDATE het bestaande kaartje met een sterkere strength score en eventueel bijgewerkte content.
- **Relevantie**: Verwijder kaartjes die niet meer relevant zijn of die door een sterker inzicht worden vervangen.
- **Volledigheid**: Aan het eind van het gesprek wil je een set kaartjes die samen een mooie samenvatting vormen van de belangrijkste patronen, spanningen, aannames en kansen.

## INZICHTTYPEN
1. **Patronen** (type: "patroon"): Terugkerende thema's, herhaalde woorden/zinnen, gesprekspatronen
2. **Spanningen** (type: "spanning"): Tegenstellingen, conflicten, onuitgesproken frustraties
3. **Aannames** (type: "aanname"): Impliciete aannames, blinde vlekken, vanzelfsprekend geachte zaken
4. **Kansen** (type: "kans"): Onbenutte mogelijkheden, potentiële doorbraken, creatieve verbindingen

## ACTIES PER KAARTJE
- **"add"**: Nieuw inzicht dat nog niet bestaat. Genereer een uniek id (kort, bv "p1", "s2", "k3").
- **"update"**: Een bestaand kaartje bijwerken. Gebruik het BESTAANDE id. Update strength, summary, quote, etc. als het patroon sterker/zwakker is geworden.
- **"remove"**: Een bestaand kaartje verwijderen omdat het niet meer relevant is. Stuur alleen het id.

## STRENGTH SCORE (1-5)
- 1: Zwak signaal, eerste hint
- 2: Begint op te vallen
- 3: Duidelijk aanwezig
- 4: Sterk patroon, meerdere keren bevestigd
- 5: Dominant thema in het gesprek

## PER INZICHT (voor add en update)
- "summary": Helder samenvatten WAT en WAAROM (2-3 zinnen)
- "quote": 1 relevant letterlijk citaat uit het transcript
- "questions": 2-3 kritische vragen die het gesprek kunnen verdiepen
- "inspirations": 2-3 citaten van bekende denkers/experts met quote, author, context
- "sentiment": "positief" | "neutraal" | "gespannen" | "negatief"

## META-ANALYSE
Genereer altijd een overkoepelende analyse:
- **sentiment_overall**: Algemene toon ("positief", "neutraal", "gespannen", "negatief")
- **energie**: Energieniveau ("hoog", "gemiddeld", "laag")
- **taalpatronen**: 1-3 opvallende taalpatronen met "label" en "betekenis"
- **nudge**: Eén zachte suggestie voor de gespreksleider (max 1-2 zinnen)
- **samenvatting**: Kernachtige samenvatting van het hele gesprek tot nu toe (3-4 zinnen)
- **acties**: 0-5 actie-items/beslissingen met "tekst" en "type" ("actie" | "beslissing")

Reageer in het Nederlands.

BELANGRIJK: Reageer met ALLEEN raw JSON. Geen markdown, geen code blocks, geen backticks, geen uitleg:
{
  "blocks": [
    {
      "id": "p1",
      "action": "add" | "update" | "remove",
      "type": "patroon" | "spanning" | "aanname" | "kans",
      "title": "Korte titel",
      "summary": "Samenvatting",
      "quote": "Citaat uit transcript",
      "questions": ["Vraag 1", "Vraag 2"],
      "sentiment": "positief" | "neutraal" | "gespannen" | "negatief",
      "strength": 3,
      "inspirations": [
        { "quote": "Citaat", "author": "Naam", "context": "Toepassing" }
      ]
    }
  ],
  "meta": {
    "sentiment_overall": "...",
    "energie": "...",
    "taalpatronen": [{ "label": "...", "betekenis": "..." }],
    "nudge": "...",
    "samenvatting": "...",
    "acties": [{ "tekst": "...", "type": "actie" | "beslissing" }]
  }
}

Bij "remove" hoef je alleen "id" en "action": "remove" mee te geven.
Het is OK om een lege blocks array terug te geven als er niets nieuws te melden is.`;

    let userMessage = `VOLLEDIG TRANSCRIPT:\n${transcript}`;

    if (existingBlocks && existingBlocks.length > 0) {
      const blocksJson = existingBlocks.map(b => ({
        id: b.id,
        type: b.type,
        title: b.title,
        summary: b.summary,
        strength: b.strength,
      }));
      userMessage += `\n\nBESTAANDE KAARTJES (update of verwijder als nodig, voeg alleen toe als er echt iets nieuws is):\n${JSON.stringify(blocksJson, null, 2)}`;
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
        max_tokens: 4000,
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
