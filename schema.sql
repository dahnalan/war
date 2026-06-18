CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  pin_code TEXT NOT NULL DEFAULT '',
  last_login_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  vs_day TEXT NOT NULL,
  confidence TEXT NOT NULL,
  guaranteed_points REAL NOT NULL,
  maximum_points REAL NOT NULL,
  notes TEXT,
  slots_json TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_day ON submissions(vs_day);
CREATE INDEX IF NOT EXISTS idx_submissions_player ON submissions(player_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

CREATE TABLE IF NOT EXISTS day_formulas (
  day_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  fields_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  message TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
