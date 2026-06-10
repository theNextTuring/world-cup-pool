-- World Cup Pool schema

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  entry_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_code CHAR(1) NOT NULL CHECK (group_code BETWEEN 'A' AND 'L'),
  rank1_team TEXT NOT NULL,
  rank2_team TEXT NOT NULL,
  rank3_team TEXT NOT NULL,
  rank4_team TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, group_code)
);

CREATE TABLE app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  group_deadline TIMESTAMPTZ NOT NULL DEFAULT '2026-06-11T19:00:00Z',
  knockout_deadline TIMESTAMPTZ,
  group_stage_locked BOOLEAN NOT NULL DEFAULT false,
  knockout_stage_locked BOOLEAN NOT NULL DEFAULT false,
  knockout_bracket_published BOOLEAN NOT NULL DEFAULT false,
  actual_total_knockout_goals INT,
  group_rank1_points INT NOT NULL DEFAULT 1 CHECK (group_rank1_points >= 0),
  group_rank2_points INT NOT NULL DEFAULT 1 CHECK (group_rank2_points >= 0),
  group_rank3_points INT NOT NULL DEFAULT 1 CHECK (group_rank3_points >= 0),
  group_rank4_points INT NOT NULL DEFAULT 1 CHECK (group_rank4_points >= 0),
  knockout_r32_points INT NOT NULL DEFAULT 1 CHECK (knockout_r32_points >= 0),
  knockout_r16_points INT NOT NULL DEFAULT 2 CHECK (knockout_r16_points >= 0),
  knockout_qf_points INT NOT NULL DEFAULT 3 CHECK (knockout_qf_points >= 0),
  knockout_sf_points INT NOT NULL DEFAULT 5 CHECK (knockout_sf_points >= 0),
  knockout_final_points INT NOT NULL DEFAULT 8 CHECK (knockout_final_points >= 0)
);

INSERT INTO app_settings (id) VALUES (1);

CREATE TABLE group_standings (
  group_code CHAR(1) PRIMARY KEY CHECK (group_code BETWEEN 'A' AND 'L'),
  rank1_team TEXT NOT NULL,
  rank2_team TEXT NOT NULL,
  rank3_team TEXT NOT NULL,
  rank4_team TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE knockout_round AS ENUM ('r32', 'r16', 'qf', 'sf', 'final');

CREATE TABLE knockout_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round knockout_round NOT NULL,
  match_number INT NOT NULL,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  winner TEXT,
  UNIQUE (round, match_number)
);

CREATE TABLE knockout_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES knockout_matches(id) ON DELETE CASCADE,
  picked_winner TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);

CREATE TABLE tiebreaker_predictions (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_goals INT NOT NULL CHECK (total_goals >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_group_picks_user ON group_picks(user_id);
CREATE INDEX idx_knockout_picks_user ON knockout_picks(user_id);
CREATE INDEX idx_knockout_matches_round ON knockout_matches(round, match_number);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knockout_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiebreaker_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knockout_matches ENABLE ROW LEVEL SECURITY;
