CREATE INDEX IF NOT EXISTS idx_player_ratings_match_id
  ON player_ratings(match_id);

CREATE INDEX IF NOT EXISTS idx_player_ratings_match_user
  ON player_ratings(match_id, user_id);

CREATE INDEX IF NOT EXISTS idx_predicted_xi_match_team
  ON predicted_xi(match_id, team_id);

CREATE INDEX IF NOT EXISTS idx_match_sentiment_fixture_id
  ON match_sentiment(fixture_id);
