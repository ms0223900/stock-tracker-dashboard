CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  last_price NUMERIC,
  is_notified BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Single-user demo: allow public anon key to read/write
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON watchlist
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON watchlist
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON watchlist
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access" ON watchlist
  FOR DELETE USING (true);
