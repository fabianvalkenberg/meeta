import bcrypt from 'bcryptjs';
import { getDb } from '../_lib/db.js';
import { signToken, setTokenCookie } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email en wachtwoord zijn verplicht' });
    }

    let sql;
    try {
      sql = getDb();
    } catch (dbErr) {
      console.error('DB connection error:', dbErr);
      return res.status(500).json({ error: 'Database verbinding mislukt' });
    }

    let rows;
    try {
      rows = await sql`SELECT id, email, display_name, password_hash, is_active FROM users WHERE email = ${email.toLowerCase().trim()}`;
    } catch (queryErr) {
      console.error('Query error:', queryErr);
      return res.status(500).json({ error: 'Database query mislukt: ' + queryErr.message });
    }

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Onjuist e-mailadres of wachtwoord' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is gedeactiveerd' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Onjuist e-mailadres of wachtwoord' });
    }

    const token = await signToken(user.id);
    setTokenCookie(res, token);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Inloggen mislukt: ' + error.message });
  }
}
