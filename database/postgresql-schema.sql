-- TRACKIFY PostgreSQL Database Schema
-- Migration from MySQL to PostgreSQL for Render deployment

-- Drop tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS principal_credentials CASCADE;
DROP TABLE IF EXISTS security_credentials CASCADE;
DROP TABLE IF EXISTS receptionist_credentials CASCADE;
DROP TABLE IF EXISTS staff_exit_logs CASCADE;
DROP TABLE IF EXISTS staff_entry_logs CASCADE;
DROP TABLE IF EXISTS visitors CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- Create staff table
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    department VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create visitors table
CREATE TABLE visitors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    place VARCHAR(255),
    purpose TEXT NOT NULL,
    whom_to_meet VARCHAR(255) NOT NULL,
    whom_to_meet_phone VARCHAR(20),
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    is_returning BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff_entry_logs table
CREATE TABLE staff_entry_logs (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP,
    purpose TEXT,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Create staff_exit_logs table
CREATE TABLE staff_exit_logs (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL,
    exit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    purpose TEXT,
    return_time TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Create receptionist_credentials table
CREATE TABLE receptionist_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_logged_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create security_credentials table
CREATE TABLE security_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_logged_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create principal_credentials table
CREATE TABLE principal_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255),
    phone_number VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_logged_in BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default staff members
INSERT INTO staff (name, email, phone_number, department) VALUES
('Krishna Gudi', 'krishnagudi@ksit.edu.in', '9964504954', 'Faculty'),
('Shruthi TS', 'shruthits@ksit.edu.in', '9742194553', 'Faculty');

-- Insert default credentials (password: admin123 for all)
-- Note: These are bcrypt hashed passwords for 'admin123'
-- Insert default credential rows with phone numbers and proper password hash (admin123)
INSERT INTO receptionist_credentials (username, phone_number, password, name) VALUES
('receptionist', '9876543210', '$2a$10$hOYxHtrf2TRT0eG1oUYV4ehPOr69q/xT0MbLn8tKokLAMGvv6doxK', 'Receptionist Admin');

INSERT INTO security_credentials (username, phone_number, password, name) VALUES
('security', '9876543211', '$2a$10$hOYxHtrf2TRT0eG1oUYV4ehPOr69q/xT0MbLn8tKokLAMGvv6doxK', 'Security Admin');

INSERT INTO principal_credentials (username, phone_number, password, name) VALUES
('principal', '9876543212', '$2a$10$hOYxHtrf2TRT0eG1oUYV4ehPOr69q/xT0MbLn8tKokLAMGvv6doxK', 'Principal Admin');

-- Create indexes for better performance
CREATE INDEX idx_visitors_status ON visitors(status);
CREATE INDEX idx_visitors_check_in ON visitors(check_in_time);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_entry_logs_staff_id ON staff_entry_logs(staff_id);
CREATE INDEX idx_staff_exit_logs_staff_id ON staff_exit_logs(staff_id);
