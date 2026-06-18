CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  player_pin TEXT NOT NULL,
  vs_day TEXT NOT NULL,
  confidence TEXT NOT NULL,
  guaranteed_points REAL NOT NULL,
  maximum_points REAL NOT NULL,
  notes TEXT,
  slots_json TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_day ON submissions(vs_day);
CREATE INDEX IF NOT EXISTS idx_submissions_player ON submissions(player_name);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

CREATE TABLE IF NOT EXISTS day_formulas (
  day_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  fields_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
