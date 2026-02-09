import { requireAuth } from '../_lib/auth.js';
import { getDb } from '../_lib/db.js';

export default async function handler(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const sql = getDb();

  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT id, title, started_at, ended_at,
          COALESCE(jsonb_array_length(blocks), 0) as block_count
        FROM conversations
        WHERE user_id = ${user.id}
        ORDER BY started_at DESC
        LIMIT 50
      `;
      res.json({ conversations: rows });
    } catch (error) {
      console.error('List conversations error:', error);
      res.status(500).json({ error: 'Kon gesprekken niet ophalen' });
    }
  } else if (req.method === 'POST') {
    try {
      const rows = await sql`
        INSERT INTO conversations (user_id, title)
        VALUES (${user.id}, 'Nieuw gesprek')
        RETURNING id, title, started_at
      `;
      res.json({ conversation: rows[0] });
    } catch (error) {
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Kon gesprek niet aanmaken' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
