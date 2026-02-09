import { getDb } from './_lib/db.js';
import bcrypt from 'bcryptjs';

// Run this once to set up the database tables and create the admin user.
// Deploy to Vercel and call POST /api/setup-db with { adminEmail, adminPassword, adminName }
// Then delete this file.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = getDb();
    const { adminEmail, adminPassword, adminName } = req.body;

    if (!adminEmail || !adminPassword || !adminName) {
      return res.status(400).json({ error: 'adminEmail, adminPassword, and adminName are required' });
    }

    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name  VARCHAR(100) NOT NULL,
        daily_limit   INTEGER DEFAULT 50,
        is_admin      BOOLEAN DEFAULT false,
        is_active     BOOLEAN DEFAULT true,
        created_at    TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title         VARCHAR(255),
        transcript    TEXT,
        blocks        JSONB,
        meta          JSONB,
        started_at    TIMESTAMP DEFAULT NOW(),
        ended_at      TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS usage_daily (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date        DATE NOT NULL DEFAULT CURRENT_DATE,
        count       INTEGER DEFAULT 0,
        UNIQUE(user_id, date)
      )
    `;

    // Create admin user
    const hash = await bcrypt.hash(adminPassword, 12);
    await sql`
      INSERT INTO users (email, password_hash, display_name, is_admin, daily_limit)
      VALUES (${adminEmail.toLowerCase().trim()}, ${hash}, ${adminName}, true, 999)
      ON CONFLICT (email) DO NOTHING
    `;

    res.json({ ok: true, message: 'Database setup complete. Delete this endpoint after use.' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
}
