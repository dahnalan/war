CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  guild_role TEXT,
  vs_day TEXT NOT NULL,
  spend_profile TEXT NOT NULL,
  confidence TEXT NOT NULL,
  guaranteed_points INTEGER NOT NULL,
  maximum_points INTEGER NOT NULL,
  notes TEXT,
  slots_json TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_day ON submissions(vs_day);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

CREATE TABLE IF NOT EXISTS day_formulas (
  day_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  fields_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
