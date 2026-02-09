import { requireAuth } from '../_lib/auth.js';
import { getDb } from '../_lib/db.js';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  const sql = getDb();

  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT id, title, transcript, blocks, meta, started_at, ended_at
        FROM conversations
        WHERE id = ${id} AND user_id = ${user.id}
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Gesprek niet gevonden' });
      }

      res.json({ conversation: rows[0] });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Kon gesprek niet ophalen' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { transcript, blocks, meta, title, ended_at } = req.body;

      // Build dynamic update
      let query;
      if (ended_at) {
        query = await sql`
          UPDATE conversations
          SET transcript = COALESCE(${transcript || null}, transcript),
              blocks = COALESCE(${blocks ? JSON.stringify(blocks) : null}::jsonb, blocks),
              meta = COALESCE(${meta ? JSON.stringify(meta) : null}::jsonb, meta),
              title = COALESCE(${title || null}, title),
              ended_at = ${ended_at}
          WHERE id = ${id} AND user_id = ${user.id}
          RETURNING id
        `;
      } else {
        query = await sql`
          UPDATE conversations
          SET transcript = COALESCE(${transcript || null}, transcript),
              blocks = COALESCE(${blocks ? JSON.stringify(blocks) : null}::jsonb, blocks),
              meta = COALESCE(${meta ? JSON.stringify(meta) : null}::jsonb, meta),
              title = COALESCE(${title || null}, title)
          WHERE id = ${id} AND user_id = ${user.id}
          RETURNING id
        `;
      }

      if (query.length === 0) {
        return res.status(404).json({ error: 'Gesprek niet gevonden' });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error('Update conversation error:', error);
      res.status(500).json({ error: 'Kon gesprek niet updaten' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
