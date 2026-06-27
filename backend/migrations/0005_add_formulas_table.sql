CREATE TABLE IF NOT EXISTS formulas (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    latex TEXT NULL,
    image_url VARCHAR(500) NULL,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_by CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
