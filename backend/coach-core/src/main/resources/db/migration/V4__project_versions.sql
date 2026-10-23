CREATE TABLE project_versions (
 id CHAR(36) PRIMARY KEY,
 user_id BIGINT NOT NULL,
 project_id VARCHAR(80) NOT NULL,
 stage_no INT NOT NULL,
 source MEDIUMTEXT NOT NULL,
 state MEDIUMTEXT NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_project_owner (user_id, project_id, created_at),
 CONSTRAINT fk_project_owner FOREIGN KEY (user_id) REFERENCES users(id)
);
