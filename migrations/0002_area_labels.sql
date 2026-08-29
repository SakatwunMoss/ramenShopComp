-- エリア表示名・サイトマップ用ラベル（HotPepper コード ↔ 日本語名）
CREATE TABLE IF NOT EXISTS area_labels (
  code TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  parent_code TEXT,
  level TEXT NOT NULL CHECK (level IN ('large', 'middle')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS area_labels_parent_idx ON area_labels (parent_code);
CREATE INDEX IF NOT EXISTS area_labels_level_idx ON area_labels (level);
CREATE INDEX IF NOT EXISTS shops_middle_area_code_idx ON shops (middle_area_code);
