-- =============================
-- CREATE DATABASE
-- =============================
CREATE DATABASE IF NOT EXISTS adhiyamaan_project_collab_portal
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE adhiyamaan_project_collab_portal;

-- =============================
-- USERS TABLE
-- =============================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'mentor', 'admin') DEFAULT 'student',
    refresh_token VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================
-- USER PROFILES
-- =============================
CREATE TABLE user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE,
    name VARCHAR(100),
    register_no VARCHAR(20),
    email VARCHAR(100),
    mobile VARCHAR(20),
    dob VARCHAR(20),
    gender VARCHAR(10),
    bio TEXT,
    degree VARCHAR(50),
    department VARCHAR(100),
    year VARCHAR(10),
    batch VARCHAR(20),
    github VARCHAR(200),
    linkedin VARCHAR(200),
    whatsapp VARCHAR(20),
    image_url VARCHAR(200),
    resume_url VARCHAR(200),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================
-- PROJECTS
-- =============================
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- 🔥 JSON STORAGE
    departments JSON,

    -- 🔥 OPTIMIZATION COLUMN (IMPORTANT)
    dept_text VARCHAR(255)
    GENERATED ALWAYS AS (
        JSON_UNQUOTE(JSON_EXTRACT(departments, '$'))
    ) STORED,

    required_members INT DEFAULT 1,
    expected_completion VARCHAR(20),
    status ENUM('pending', 'active', 'closed', 'completed', 'archived') DEFAULT 'pending',
    created_by VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================
-- PROJECT MEMBERS
-- =============================
CREATE TABLE project_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    user_id VARCHAR(50),
    role ENUM('owner', 'member') DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================
-- JOIN REQUESTS
-- =============================
CREATE TABLE join_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    user_id VARCHAR(50),
    status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
    reason VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================
-- INDEXES (PERFORMANCE)
-- =============================
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_dept_text ON projects(dept_text); -- 🔥 IMPORTANT
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_join_requests_project_id ON join_requests(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_join_requests_project ON join_requests(project_id);

ALTER TABLE user_profiles
ADD COLUMN skills TEXT;


ALTER TABLE join_requests 
ADD COLUMN requester_id VARCHAR(50)

CREATE TABLE mentor_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,

    project_id INT,
    owner_id VARCHAR(50),
    mentor_id VARCHAR(50),

    message TEXT,

    status ENUM('pending','accepted','rejected') DEFAULT 'pending',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(user_id) ON DELETE CASCADE
);;
CREATE TABLE project_mentors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    mentor_id VARCHAR(50),
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(user_id) ON DELETE CASCADE
);


INSERT INTO users (user_id, email, password, role)
VALUES (
"Aceadmin",
"admin@portal.com",
"$2b$12$5Fz9j3R6fYz1gqk9i5jX3uM6Eo7Qx8p5vKx2P6s9l3H7nV2Qb8c6G",
"admin"
);

CREATE TABLE project_completion_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    owner_id VARCHAR(50),
    status ENUM('pending','accepted','rejected') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE task_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    sender_role VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);