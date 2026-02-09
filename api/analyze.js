import { requireAuth } from './_lib/auth.js';
import { getDb } from './_lib/db.js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const user = await requireAuth(req, res);
  if (!user) return;

  const sql = getDb();

  // Usage limit check
  const usageRows = await sql`SELECT count FROM usage_daily WHERE user_id = ${user.id} AND date = CURRENT_DATE`;
  const usedToday = usageRows.length > 0 ? usageRows[0].count : 0;

  if (usedToday >= user.daily_limit) {
    return res.status(429).json({
      error: 'Dagelijks limiet bereikt',
      usage: { used: usedToday, limit: user.daily_limit },
    });
  }

  try {
    const { newTranscript, previousSummary, existingBlocks, conversationId } = req.body;

    if (!newTranscript || newTranscript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const systemPrompt = `Je bent Meeta: een real-time gespreksanalist die meeluistert met gesprekken en evoluerend inzichten genereert. Je analyseert transcripten van lopende gesprekken in het Nederlands.

Dit is een iteratief proces: elke ~60 seconden ontvang je het NIEUWE stuk transcript, samen met een samenvatting van wat er eerder is gezegd en de inzichtkaartjes die al bestaan. Jouw taak is om te beslissen welke kaartjes moeten worden TOEGEVOEGD, BIJGEWERKT of VERWIJDERD.

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
- **samenvatting**: Kernachtige samenvatting van het HELE gesprek tot nu toe (3-4 zinnen). Dit wordt gebruikt als context voor de volgende analyse-ronde, dus wees volledig.
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

    let userMessage = '';

    if (previousSummary) {
      userMessage += `SAMENVATTING VAN HET GESPREK TOT NU TOE:\n${previousSummary}\n\n`;
    }

    userMessage += `NIEUW STUK TRANSCRIPT:\n${newTranscript}`;

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
        model: 'claude-haiku-4-20250414',
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

    // Increment usage counter (atomic upsert)
    await sql`
      INSERT INTO usage_daily (user_id, date, count)
      VALUES (${user.id}, CURRENT_DATE, 1)
      ON CONFLICT (user_id, date)
      DO UPDATE SET count = usage_daily.count + 1
    `;

    const newUsed = usedToday + 1;

    // Save to conversation if conversationId provided
    if (conversationId) {
      try {
        // We save the current state of blocks after the frontend merges them
        // For now, save the raw API response blocks + meta
        await sql`
          UPDATE conversations
          SET meta = ${JSON.stringify(parsed.meta || null)}::jsonb
          WHERE id = ${conversationId} AND user_id = ${user.id}
        `;

        // Auto-generate title from first block if title is still default
        if (parsed.blocks && parsed.blocks.length > 0) {
          const firstAdd = parsed.blocks.find(b => b.action === 'add');
          if (firstAdd) {
            await sql`
              UPDATE conversations
              SET title = ${firstAdd.title}
              WHERE id = ${conversationId} AND user_id = ${user.id} AND title = 'Nieuw gesprek'
            `;
          }
        }
      } catch (saveError) {
        console.error('Save to conversation error:', saveError);
        // Don't fail the whole request if save fails
      }
    }

    // Return analysis + usage info
    res.json({
      ...parsed,
      usage: { used: newUsed, limit: user.daily_limit },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
