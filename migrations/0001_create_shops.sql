-- Cloudflare D1 (SQLite)
CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY NOT NULL,
  hotpepper_id TEXT UNIQUE,
  data_source TEXT NOT NULL DEFAULT 'hotpepper',
  name TEXT NOT NULL,
  genre TEXT,
  address TEXT,
  large_area_code TEXT,
  middle_area_code TEXT,
  small_area_code TEXT,
  lat REAL,
  lng REAL,
  budget TEXT,
  image_url TEXT,
  shop_url TEXT,
  phone TEXT,
  open_hours TEXT,
  close_days TEXT,
  access TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS shops_large_area_code_idx ON shops (large_area_code);
CREATE INDEX IF NOT EXISTS shops_genre_idx ON shops (genre);
CREATE INDEX IF NOT EXISTS shops_name_idx ON shops (name);
CREATE INDEX IF NOT EXISTS shops_updated_at_idx ON shops (updated_at);
