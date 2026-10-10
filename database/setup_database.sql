-- =======================================================
-- Online Quiz System Database Initialization
-- =======================================================

CREATE DATABASE IF NOT EXISTS online_quiz
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE online_quiz;

-- Optional: Dedicated application user (uncomment if preferred over root)
-- CREATE USER IF NOT EXISTS 'quizuser'@'localhost' IDENTIFIED BY 'quizpassword123';
-- GRANT ALL PRIVILEGES ON online_quiz.* TO 'quizuser'@'localhost';
-- FLUSH PRIVILEGES;

SELECT 'online_quiz database created successfully' AS status;
