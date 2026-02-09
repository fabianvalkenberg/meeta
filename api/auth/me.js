import { requireAuth } from '../_lib/auth.js';
import { getDb } from '../_lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const sql = getDb();
    const usageRows = await sql`SELECT count FROM usage_daily WHERE user_id = ${user.id} AND date = CURRENT_DATE`;
    const usedToday = usageRows.length > 0 ? usageRows[0].count : 0;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        is_admin: user.is_admin,
      },
      usage: {
        used: usedToday,
        limit: user.daily_limit,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Kon gebruiker niet ophalen' });
  }
}
