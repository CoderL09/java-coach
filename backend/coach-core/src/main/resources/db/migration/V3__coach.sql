CREATE TABLE coach_threads (
  id CHAR(36) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  mode VARCHAR(16) NOT NULL,
  topic VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coach_owner (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE coach_turns (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  thread_id CHAR(36) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context MEDIUMTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES coach_threads(id),
  INDEX idx_coach_turn (thread_id,id)
);
