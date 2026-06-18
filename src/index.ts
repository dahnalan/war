export interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
  ASSETS: Fetcher;
}

type FormulaField = { key: string; label: string; points: number; category: string };
type FormulaBody = { dayKey: string; label: string; description?: string; fields: FormulaField[] };
type SubmissionBody = { id: string; playerName: string; playerPin: string; day: string; confidence?: string; guaranteed?: number; maximum?: number; notes?: string; slots?: string[]; inputs?: Record<string, { quantity: number; points: number }>; createdAt?: string };

const json = (data: unknown, init: ResponseInit = {}) => Response.json(data, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(init.headers || {}) }, ...init });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/dashboard-auth' && request.method === 'POST') {
      const body = await request.json<{ password?: string }>();
      if (!env.ADMIN_SECRET || body?.password !== env.ADMIN_SECRET) return json({ error: 'Wrong password.' }, { status: 401 });
      return json({ ok: true });
    }

    if (url.pathname === '/api/submissions' && request.method === 'GET') {
      const { results } = await env.DB.prepare(`SELECT * FROM submissions ORDER BY created_at DESC`).all();
      return json(results);
    }

    if (url.pathname === '/api/submissions' && request.method === 'POST') {
      const body = (await request.json()) as SubmissionBody;
      if (!body?.id || !body?.playerName || !body?.day || !/^\d{6}$/.test(body?.playerPin || '')) return json({ error: 'Missing required submission fields or invalid 6-digit code.' }, { status: 400 });
      const guaranteed = Number(body.guaranteed || 0), maximum = Number(body.maximum || 0);
      if (maximum < guaranteed) return json({ error: 'Maximum points cannot be lower than guaranteed points.' }, { status: 400 });
      await env.DB.prepare(`INSERT INTO submissions (id, player_name, player_pin, vs_day, confidence, guaranteed_points, maximum_points, notes, slots_json, inputs_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET player_name=excluded.player_name, player_pin=excluded.player_pin, vs_day=excluded.vs_day, confidence=excluded.confidence, guaranteed_points=excluded.guaranteed_points, maximum_points=excluded.maximum_points, notes=excluded.notes, slots_json=excluded.slots_json, inputs_json=excluded.inputs_json, created_at=excluded.created_at`)
        .bind(body.id, body.playerName, body.playerPin, body.day, body.confidence || 'medium', guaranteed, maximum, body.notes || '', JSON.stringify(body.slots || []), JSON.stringify(body.inputs || {}), body.createdAt || new Date().toISOString()).run();
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
      await env.DB.prepare(`INSERT INTO day_formulas (day_key, label, description, fields_json, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(day_key) DO UPDATE SET label = excluded.label, description = excluded.description, fields_json = excluded.fields_json, updated_at = excluded.updated_at`)
        .bind(body.dayKey, body.label, body.description || '', JSON.stringify(body.fields), new Date().toISOString()).run();
      return json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  },
};
