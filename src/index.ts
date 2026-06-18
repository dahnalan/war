export interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
  ASSETS: Fetcher;
}

type FormulaField = { key: string; label: string; points: number; category: string };
type FormulaBody = { dayKey: string; label: string; description?: string; fields: FormulaField[] };
type SubmissionBody = { id: string; playerId: string; playerName: string; playerPin: string; day: string; confidence?: string; guaranteed?: number; maximum?: number; notes?: string; slots?: string[]; inputs?: Record<string, { quantity: number; points: number }>; createdAt?: string };

type PlayerBody = { id?: string; playerName: string; status?: string };
type PinBody = { playerId: string; pin: string };
type AnnouncementBody = { message?: string };

const json = (data: unknown, init: ResponseInit = {}) => Response.json(data, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(init.headers || {}) }, ...init });
const unauthorized = () => json({ error: 'Unauthorized.' }, { status: 401 });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/api/announcement' && request.method === 'GET') {
        const row = await env.DB.prepare(`SELECT message FROM app_settings WHERE key = 'announcement'`).first<any>();
        return json({ message: row?.message || '' });
      }

      if (url.pathname === '/api/announcement' && request.method === 'POST') {
        const secret = request.headers.get('x-admin-secret');
        if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) return unauthorized();
        const body = (await request.json()) as AnnouncementBody;
        await env.DB.prepare(`INSERT INTO app_settings (key, message, updated_at) VALUES ('announcement', ?, ?) ON CONFLICT(key) DO UPDATE SET message = excluded.message, updated_at = excluded.updated_at`).bind(body?.message || '', new Date().toISOString()).run();
        return json({ ok: true });
      }

      if (url.pathname === '/api/dashboard-auth' && request.method === 'POST') {
        const body = await request.json<{ password?: string }>();
        if (!env.ADMIN_SECRET || body?.password !== env.ADMIN_SECRET) return json({ error: 'Wrong password.' }, { status: 401 });
        return json({ ok: true });
      }

      if (url.pathname === '/api/players' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`SELECT id, player_name, status, last_login_at, created_at FROM players ORDER BY player_name COLLATE NOCASE`).all();
        return json(results);
      }

      if (url.pathname === '/api/players' && request.method === 'POST') {
        const secret = request.headers.get('x-admin-secret');
        if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) return unauthorized();
        const body = (await request.json()) as PlayerBody;
        if (!body?.playerName?.trim()) return json({ error: 'Player name is required.' }, { status: 400 });
        const id = body.id || crypto.randomUUID();
        await env.DB.prepare(`INSERT INTO players (id, player_name, status, pin_code, last_login_at, created_at) VALUES (?, ?, ?, '', NULL, ?) ON CONFLICT(id) DO UPDATE SET player_name = excluded.player_name, status = excluded.status`).bind(id, body.playerName.trim(), body.status || 'active', new Date().toISOString()).run();
        return json({ ok: true, id });
      }

      if (url.pathname === '/api/players/reset-pin' && request.method === 'POST') {
        const secret = request.headers.get('x-admin-secret');
        if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) return unauthorized();
        const body = (await request.json()) as { playerId?: string };
        if (!body?.playerId) return json({ error: 'Player is required.' }, { status: 400 });
        await env.DB.prepare(`UPDATE players SET pin_code = '' WHERE id = ?`).bind(body.playerId).run();
        return json({ ok: true });
      }

      if (url.pathname === '/api/player-pin' && request.method === 'POST') {
        const body = (await request.json()) as PinBody;
        if (!body?.playerId || !/^\d{6}$/.test(body?.pin || '')) return json({ error: 'Player and valid 6-digit code are required.' }, { status: 400 });
        const exists = await env.DB.prepare(`SELECT id FROM players WHERE id = ?`).bind(body.playerId).first();
        if (!exists) return json({ error: 'Player profile not found.' }, { status: 404 });
        await env.DB.prepare(`UPDATE players SET pin_code = ?, last_login_at = ? WHERE id = ?`).bind(body.pin, new Date().toISOString(), body.playerId).run();
        return json({ ok: true });
      }

      if (url.pathname === '/api/player-login' && request.method === 'POST') {
        const body = await request.json<{ playerId?: string; pin?: string }>();
        if (!body?.playerId || !/^\d{6}$/.test(body?.pin || '')) return json({ error: 'Player and valid 6-digit code are required.' }, { status: 400 });
        const player = await env.DB.prepare(`SELECT id, player_name, pin_code FROM players WHERE id = ?`).bind(body.playerId).first<any>();
        if (!player) return json({ error: 'Player profile not found.' }, { status: 404 });
        if (!player.pin_code || player.pin_code !== body.pin) return json({ error: 'Incorrect 6-digit code.' }, { status: 401 });
        await env.DB.prepare(`UPDATE players SET last_login_at = ? WHERE id = ?`).bind(new Date().toISOString(), body.playerId).run();
        const { results } = await env.DB.prepare(`SELECT * FROM submissions WHERE player_id = ? ORDER BY created_at DESC`).bind(body.playerId).all();
        return json({ ok: true, player: { id: player.id, player_name: player.player_name }, submissions: results });
      }

      if (url.pathname === '/api/submissions' && request.method === 'GET') {
        const secret = request.headers.get('x-admin-secret');
        if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) return unauthorized();
        const { results } = await env.DB.prepare(`SELECT s.*, p.player_name, p.last_login_at FROM submissions s LEFT JOIN players p ON p.id = s.player_id ORDER BY s.created_at DESC`).all();
        return json(results);
      }

      if (url.pathname === '/api/submissions' && request.method === 'POST') {
        const body = (await request.json()) as SubmissionBody;
        if (!body?.id || !body?.playerId || !body?.playerName || !body?.day || !/^\d{6}$/.test(body?.playerPin || '')) return json({ error: 'Missing required submission fields or invalid 6-digit code.' }, { status: 400 });
        const player = await env.DB.prepare(`SELECT id, player_name, pin_code FROM players WHERE id = ?`).bind(body.playerId).first<any>();
        if (!player) return json({ error: 'Player profile does not exist. Ask admin to create it first.' }, { status: 400 });
        if (!player.pin_code || player.pin_code !== body.playerPin) return json({ error: 'Incorrect 6-digit code.' }, { status: 401 });
        const guaranteed = Number(body.guaranteed || 0), maximum = Number(body.maximum || 0);
        if (maximum < guaranteed) return json({ error: 'Maximum points cannot be lower than guaranteed points.' }, { status: 400 });
        await env.DB.prepare(`INSERT INTO submissions (id, player_id, player_name, vs_day, confidence, guaranteed_points, maximum_points, notes, slots_json, inputs_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET player_id=excluded.player_id, player_name=excluded.player_name, vs_day=excluded.vs_day, confidence=excluded.confidence, guaranteed_points=excluded.guaranteed_points, maximum_points=excluded.maximum_points, notes=excluded.notes, slots_json=excluded.slots_json, inputs_json=excluded.inputs_json, created_at=excluded.created_at`).bind(body.id, body.playerId, body.playerName, body.day, body.confidence || 'medium', guaranteed, maximum, body.notes || '', JSON.stringify(body.slots || []), JSON.stringify(body.inputs || {}), body.createdAt || new Date().toISOString()).run();
        await env.DB.prepare(`UPDATE players SET last_login_at = ? WHERE id = ?`).bind(new Date().toISOString(), body.playerId).run();
        return json({ ok: true });
      }

      if (url.pathname === '/api/formulas' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`SELECT * FROM day_formulas ORDER BY day_key`).all();
        return json(results);
      }

      if (url.pathname === '/api/formulas' && request.method === 'POST') {
        const providedSecret = request.headers.get('x-admin-secret');
        if (!env.ADMIN_SECRET || providedSecret !== env.ADMIN_SECRET) return json({ error: 'Unauthorized formula update.' }, { status: 401 });
        const body = (await request.json()) as FormulaBody;
        if (!body?.dayKey || !body?.label || !Array.isArray(body?.fields)) return json({ error: 'Missing required formula fields.' }, { status: 400 });
        await env.DB.prepare(`INSERT INTO day_formulas (day_key, label, description, fields_json, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(day_key) DO UPDATE SET label = excluded.label, description = excluded.description, fields_json = excluded.fields_json, updated_at = excluded.updated_at`).bind(body.dayKey, body.label, body.description || '', JSON.stringify(body.fields), new Date().toISOString()).run();
        return json({ ok: true });
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown server error';
      return json({ error: message }, { status: 500 });
    }
  },
};
