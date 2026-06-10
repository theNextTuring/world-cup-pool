ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS group_rank1_points INT NOT NULL DEFAULT 3 CHECK (group_rank1_points >= 0),
  ADD COLUMN IF NOT EXISTS group_rank2_points INT NOT NULL DEFAULT 3 CHECK (group_rank2_points >= 0),
  ADD COLUMN IF NOT EXISTS group_rank3_points INT NOT NULL DEFAULT 2 CHECK (group_rank3_points >= 0),
  ADD COLUMN IF NOT EXISTS group_rank4_points INT NOT NULL DEFAULT 2 CHECK (group_rank4_points >= 0),
  ADD COLUMN IF NOT EXISTS knockout_r32_points INT NOT NULL DEFAULT 2 CHECK (knockout_r32_points >= 0),
  ADD COLUMN IF NOT EXISTS knockout_r16_points INT NOT NULL DEFAULT 3 CHECK (knockout_r16_points >= 0),
  ADD COLUMN IF NOT EXISTS knockout_qf_points INT NOT NULL DEFAULT 5 CHECK (knockout_qf_points >= 0),
  ADD COLUMN IF NOT EXISTS knockout_sf_points INT NOT NULL DEFAULT 7 CHECK (knockout_sf_points >= 0),
  ADD COLUMN IF NOT EXISTS knockout_final_points INT NOT NULL DEFAULT 10 CHECK (knockout_final_points >= 0);
