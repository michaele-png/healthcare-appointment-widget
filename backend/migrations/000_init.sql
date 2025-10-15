-- Minimal schema for quick start
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient','provider','admin','staff') DEFAULT 'patient',
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  nexhealth_patient_id VARCHAR(255) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  address JSON,
  insurance_info JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS providers (
  id CHAR(36) PRIMARY KEY,
  practice_id CHAR(36),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100),
  bio TEXT,
  photo_url VARCHAR(500),
  accepting_new_patients TINYINT(1) DEFAULT 1,
  active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS appointment_types (
  id CHAR(36) PRIMARY KEY,
  practice_id CHAR(36),
  name VARCHAR(255) NOT NULL,
  duration_minutes INT NOT NULL,
  active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) PRIMARY KEY,
  nexhealth_appointment_id VARCHAR(255) UNIQUE,
  provider_id CHAR(36),
  patient_id CHAR(36) NOT NULL,
  appointment_type_id CHAR(36),
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('scheduled','confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'scheduled',
  reason TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id CHAR(36),
  old_data JSON,
  new_data JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
