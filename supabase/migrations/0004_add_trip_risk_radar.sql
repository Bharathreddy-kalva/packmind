ALTER TABLE trips ADD COLUMN IF NOT EXISTS risk_radar jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS risk_radar_refreshed_at timestamptz;

CREATE INDEX IF NOT EXISTS trips_risk_radar_refreshed_at_idx
  ON trips(risk_radar_refreshed_at);
