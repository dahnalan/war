export interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
  ASSETS: Fetcher;
}

type FormulaBody = {
  dayKey: string;
  label: string;
  description?: string;
  fields: Array<{ key: string; label: string; points: number; category: string }>;
};

type SubmissionBody = {
  id: string;
  playerName: string;
  guildRole?: string;
  day: string;
  spendProfile?: string;
  confidence?: string;
  guaranteed?: number;
  maximum?: number;
  notes?: string;
  slots?: string[];
  inputs?: Record<string, number>;
  createdAt?: string;
};

const json = (data: unknown, init: ResponseInit = {}) =>
  Response.json(data, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init.headers || {}),
    },
    ...init,
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/submissions' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        `SELECT * FROM submissions ORDER BY created_at DESC`
      ).all();
      return json(results);
    }

    if (url.pathname === '/api/submissions' && request.method === 'POST') {
      const body = (await request.json()) as SubmissionBody;

      if (!body?.id || !body?.playerName || !body?.day) {
        return json({ error: 'Missing required submission fields.' }, { status: 400 });
      }

      const guaranteed = Number(body.guaranteed || 0);
      const maximum = Number(body.maximum || 0);
      if (maximum < guaranteed) {
        return json({ error: 'Maximum points cannot be lower than guaranteed points.' }, { status: 400 });
      }

      await env.DB.prepare(`
        INSERT INTO submissions (
          id, player_name, guild_role, vs_day, spend_profile, confidence,
          guaranteed_points, maximum_points, notes, slots_json, inputs_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        body.id,
        body.playerName,
        body.guildRole || '',
        body.day,
        body.spendProfile || 'free-only',
        body.confidence || 'medium',
        guaranteed,
        maximum,
        body.notes || '',
        JSON.stringify(body.slots || []),
        JSON.stringify(body.inputs || {}),
        body.createdAt || new Date().toISOString()
      ).run();

      return json({ ok: true });
    }

    if (url.pathname === '/api/formulas' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        `SELECT * FROM day_formulas ORDER BY day_key`
      ).all();
      return json(results);
    }

    if (url.pathname === '/api/formulas' && request.method === 'POST') {
      const providedSecret = request.headers.get('x-admin-secret');
      if (!env.ADMIN_SECRET || providedSecret !== env.ADMIN_SECRET) {
        return json({ error: 'Unauthorized formula update.' }, { status: 401 });
      }

      const body = (await request.json()) as FormulaBody;
      if (!body?.dayKey || !body?.label || !Array.isArray(body?.fields)) {
        return json({ error: 'Missing required formula fields.' }, { status: 400 });
      }

      await env.DB.prepare(`
        INSERT INTO day_formulas (day_key, label, description, fields_json, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(day_key) DO UPDATE SET
          label = excluded.label,
          description = excluded.description,
          fields_json = excluded.fields_json,
          updated_at = excluded.updated_at
      `).bind(
        body.dayKey,
        body.label,
        body.description || '',
        JSON.stringify(body.fields),
        new Date().toISOString()
      ).run();

      return json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  },
};
