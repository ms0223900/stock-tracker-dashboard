-- US-02: watchlist 資料表（MVP 最小集合）
-- 套用方式：Supabase Dashboard → SQL Editor → 貼上並執行

CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL CHECK (symbol ~ '^\d+\.TW$'),
  target_price numeric(12, 4) NOT NULL CHECK (target_price > 0),
  last_price numeric(12, 4),
  is_notified boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist (symbol);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_watchlist"
  ON watchlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon_select_watchlist"
  ON watchlist
  FOR SELECT
  TO anon
  USING (true);
