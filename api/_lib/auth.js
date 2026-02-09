import { SignJWT, jwtVerify } from 'jose';
import { getDb } from './db.js';

const COOKIE_NAME = 'meeta_token';
const TOKEN_EXPIRY = '7d';

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function signToken(userId) {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecret());
}

export function setTokenCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`);
}

export function clearTokenCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

function parseCookies(req) {
  const cookie = req.headers.cookie || '';
  const cookies = {};
  cookie.split(';').forEach((pair) => {
    const [key, ...vals] = pair.trim().split('=');
    if (key) cookies[key] = vals.join('=');
  });
  return cookies;
}

export async function verifyToken(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return parseInt(payload.sub, 10);
  } catch {
    return null;
  }
}

export async function requireAuth(req, res) {
  const userId = await verifyToken(req);
  if (!userId) {
    res.status(401).json({ error: 'Niet ingelogd' });
    return null;
  }

  const sql = getDb();
  const rows = await sql`SELECT id, email, display_name, daily_limit, is_admin, is_active FROM users WHERE id = ${userId}`;

  if (rows.length === 0 || !rows[0].is_active) {
    clearTokenCookie(res);
    res.status(401).json({ error: 'Account niet gevonden of gedeactiveerd' });
    return null;
  }

  return rows[0];
}
