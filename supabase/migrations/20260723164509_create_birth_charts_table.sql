/*
# Create birth_charts table (single-tenant, no auth)

1. New Tables
- `birth_charts`
- `id` (uuid, primary key)
- `name` (text, name/label for the chart, e.g. the person's name)
- `birth_date` (text, ISO date string of birth)
- `birth_time` (text, birth time in HH:mm format)
- `latitude` (numeric, birth latitude)
- `longitude` (numeric, birth longitude)
- `location_name` (text, human-readable birth location)
- `chart_data` (jsonb, full computed chart: planets, houses, aspects)
- `created_at` (timestamp, record creation time)
2. Security
- Enable RLS on `birth_charts`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (no sign-in screen).
*/

CREATE TABLE IF NOT EXISTS birth_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  birth_date text NOT NULL,
  birth_time text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  location_name text NOT NULL,
  chart_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE birth_charts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_birth_charts" ON birth_charts;
CREATE POLICY "anon_select_birth_charts" ON birth_charts FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_birth_charts" ON birth_charts;
CREATE POLICY "anon_insert_birth_charts" ON birth_charts FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_birth_charts" ON birth_charts;
CREATE POLICY "anon_update_birth_charts" ON birth_charts FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_birth_charts" ON birth_charts;
CREATE POLICY "anon_delete_birth_charts" ON birth_charts FOR DELETE
TO anon, authenticated USING (true);