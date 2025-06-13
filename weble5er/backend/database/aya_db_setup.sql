-- Script de configuration de la base de données aya_db
-- Base de données unifiée pour l'application web et mobile

SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS aya_db;
USE aya_db;

-- Suppression des tables existantes dans l'ordre pour respecter les contraintes de clés étrangères
DROP TABLE IF EXISTS request_attachments;
DROP TABLE IF EXISTS request_history;
DROP TABLE IF EXISTS request_comments;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS professional_info;
DROP TABLE IF EXISTS personal_info;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

-- Création de la table departments
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Création de la table users avec support mobile
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    role ENUM('user', 'chef', 'admin') DEFAULT 'user',
    department_id INT,
    chef_id INT NULL,
    profile_image VARCHAR(255),
    fcm_token VARCHAR(255),
    device_type ENUM('web', 'mobile', 'both') DEFAULT 'web',
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Ajout de la contrainte de clé étrangère chef_id après la création de la table
ALTER TABLE users ADD CONSTRAINT fk_users_chef FOREIGN KEY (chef_id) REFERENCES users(id);

-- Création de la table personal_info
CREATE TABLE personal_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    cin VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    place_of_birth VARCHAR(100),
    nationality VARCHAR(50) NOT NULL,
    marital_status ENUM('single', 'married', 'divorced', 'widowed') DEFAULT 'single',
    number_of_children INT DEFAULT 0,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(20),
    emergency_contact_name VARCHAR(100),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table professional_info
CREATE TABLE professional_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    position VARCHAR(100) NOT NULL,
    grade VARCHAR(50),
    hire_date DATE NOT NULL,
    contract_type ENUM('CDI', 'CDD', 'ANAPEC', 'Stage') DEFAULT 'CDI',
    salary DECIMAL(10, 2),
    rib VARCHAR(50),
    bank_name VARCHAR(100),
    cnss VARCHAR(50),
    mutuelle VARCHAR(50),
    annual_leave_balance INT DEFAULT 30,
    sick_leave_balance INT DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table password_reset_tokens
CREATE TABLE password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table requests avec support amélioré pour les demandes
CREATE TABLE requests (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('Congé annuel', 'Congé maladie', 'Congé maternité', 'Formation', 'Congé', 'Document', 'Attestation de travail', 'Document administratif', 'Prêt automobile', 'Prêt bancaire', 'Avance sur salaire', 'Autre') NOT NULL,
    status ENUM('en attente', 'Chef approuvé', 'Chef rejeté', 'Approuvée', 'Rejetée') DEFAULT 'en attente',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    details JSON,
    chef_observation TEXT,
    admin_response TEXT,
    working_days INT NOT NULL,
    source ENUM('web', 'mobile') DEFAULT 'web',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table request_history pour le suivi des modifications
CREATE TABLE request_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table request_attachments pour les pièces jointes
CREATE TABLE request_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table request_comments
CREATE TABLE request_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table notifications avec support mobile
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    reference_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    platform ENUM('web', 'mobile', 'both') DEFAULT 'both',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table calendar_events
CREATE TABLE calendar_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'event',
    color VARCHAR(20),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insertion des départements
INSERT INTO departments (name, description) VALUES
('Ressources Humaines', 'Gestion du personnel et des ressources humaines'),
('Développement', 'Développement logiciel et applications'),
('Management', 'Direction et gestion des équipes'),
('Marketing', 'Marketing et communication'),
('Finance', 'Gestion financière et comptabilité');

-- Insertion du compte administrateur
INSERT INTO users (email, password, firstname, lastname, role, department_id) VALUES
('admin@aya.com', '$2a$10$XFE/UQjM8HLrWYz0Z4q1IeN1r3MQRhlBFNBp8YJ/qYuEBOBvERB46', 'Admin', 'RH', 'admin', 1);

-- Insertion du compte chef
INSERT INTO users (email, password, firstname, lastname, role, department_id) VALUES
('chef@aya.com', '$2a$10$XFE/UQjM8HLrWYz0Z4q1IeN1r3MQRhlBFNBp8YJ/qYuEBOBvERB46', 'Chef', 'Service', 'chef', 3);

-- Insertion du compte utilisateur test
INSERT INTO users (email, password, firstname, lastname, role, department_id, chef_id) VALUES
('user@aya.com', '$2a$10$XFE/UQjM8HLrWYz0Z4q1IeN1r3MQRhlBFNBp8YJ/qYuEBOBvERB46', 'User', 'Test', 'user', 2, 2);

-- Ajout d'informations personnelles pour admin
INSERT INTO personal_info (user_id, cin, date_of_birth, place_of_birth, nationality, marital_status, number_of_children, address, city, country, phone, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone) VALUES
(1, 'AB123456', '1990-01-01', 'Tunis', 'Tunisienne', 'single', 0, '1 Rue de l\'Administration', 'Tunis', 'Tunisie', '0600000000', 'Contact Urgence', 'Famille', '0600000001');

-- Ajout d'informations personnelles pour chef
INSERT INTO personal_info (user_id, cin, date_of_birth, place_of_birth, nationality, marital_status, number_of_children, address, city, country, phone, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone) VALUES
(2, 'CD789012', '1985-01-01', 'Tunis', 'Tunisienne', 'married', 2, '123 Rue des Chefs', 'Tunis', 'Tunisie', '0600000000', 'Contact Urgence', 'Famille', '0600000001');

-- Ajout d'informations personnelles pour user
INSERT INTO personal_info (user_id, cin, date_of_birth, place_of_birth, nationality, marital_status, number_of_children, address, city, country, phone, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone) VALUES
(3, '12345678', '1995-05-15', 'Tunis', 'Tunisienne', 'single', 0, '123 Rue Principale', 'Tunis', 'Tunisie', '+216 55 123 456', 'Contact Urgence', 'Famille', '+216 55 789 012');

-- Ajout d'informations professionnelles pour admin
INSERT INTO professional_info (user_id, employee_id, position, grade, hire_date, contract_type, salary, rib, bank_name, cnss, mutuelle) VALUES
(1, 'ADM001', 'Responsable RH', 'Cadre', '2024-01-01', 'CDI', 50000.00, 'TN5930001007941234567890185', 'Banque Nationale', 'CNSS123456', 'MUT789012');

-- Ajout d'informations professionnelles pour chef
INSERT INTO professional_info (user_id, employee_id, position, grade, hire_date, contract_type, salary, rib, bank_name, cnss, mutuelle) VALUES
(2, 'CHEF001', 'Chef d\'équipe', 'Senior', '2020-01-01', 'CDI', 35000.00, 'TN5930001007941234567890186', 'Banque Nationale', 'CNSS789012', 'MUT123456');

-- Ajout d'informations professionnelles pour user
INSERT INTO professional_info (user_id, employee_id, position, grade, hire_date, contract_type, salary, rib, bank_name, cnss, mutuelle) VALUES
(3, 'EMP001', 'Développeur Web', 'Junior', '2023-01-15', 'CDI', 30000.00, 'TN5930001007941234567890185', 'Banque Nationale de Tunisie', 'CNSS123456', 'MUT789012');

-- Insertion de quelques demandes de test
INSERT INTO requests (id, user_id, type, status, start_date, end_date, description, details, working_days) VALUES
('req-1685626001-abcde', 3, 'Congé annuel', 'Approuvée', '2025-06-01', '2025-06-07', 'Congé du 2025-06-01 au 2025-06-07 (7 jours)', '{"startDate": "2025-06-01", "endDate": "2025-06-07", "leaveType": "annuel", "reason": "Vacances d\'été", "dayPart": "full", "workingDays": 7}', 7),
('req-1684065600-fghij', 3, 'Congé maladie', 'Approuvée', '2025-05-10', '2025-05-12', 'Congé du 2025-05-10 au 2025-05-12 (3 jours ouvrables)', '{"startDate": "2025-05-10", "endDate": "2025-05-12", "leaveType": "sick", "reason": "Grippe", "dayPart": "full", "workingDays": 3}', 3),
('req-1689379200-klmno', 3, 'Formation', 'en attente', '2025-07-15', '2025-07-20', 'Formation Angular avancé', '{"title": "Formation Angular avancé", "organization": "Formation Tech", "startDate": "2025-07-15", "endDate": "2025-07-20", "trainingType": "Technique", "objectives": "Maîtriser Angular", "cost": 1200}', 5),
('req-1690848000-pqrst', 3, 'Congé maternité', 'Chef approuvé', '2025-08-01', '2025-11-01', 'Congé du 2025-08-01 au 2025-11-01 (90 jours)', '{"startDate": "2025-08-01", "endDate": "2025-11-01", "leaveType": "maternity", "reason": "Maternité", "dayPart": "full", "workingDays": 90}', 90),
('req-1684540800-uvwxy', 3, 'Prêt automobile', 'en attente', '2025-05-20', '2025-05-20', 'Demande de prêt automobile de 5000 DT', '{"loanType": "car", "loanAmount": 5000, "loanReason": "Achat voiture"}', 1),
('req-1685059200-56789', 3, 'Attestation de travail', 'en attente', '2025-05-25', '2025-05-25', 'Attestation de travail - Banque', '{"purpose": "Banque", "language": "Français", "copies": 2}', 1);

-- Insertion de notifications de test
INSERT INTO notifications (user_id, title, message, type, reference_id, is_read) VALUES
(3, 'Demande approuvée', 'Votre demande de Congé annuel a été approuvée définitivement.', 'request_approved', 'req-1685626001-abcde', FALSE),
(3, 'Demande en attente', 'Votre demande d\'Attestation de travail est en attente de validation', 'request_pending', 'req-1685059200-56789', FALSE),
(1, 'Nouvelle demande', 'Une nouvelle demande d\'Attestation de travail a été soumise', 'new_request', 'req-1685059200-56789', FALSE),
(2, 'Nouvelle demande', 'Une nouvelle demande de Formation a été soumise', 'new_request', 'req-1689379200-klmno', FALSE);

-- Insertion d'événements de calendrier de test
INSERT INTO calendar_events (user_id, title, description, start_date, end_date, all_day, type) VALUES
(3, 'Formation Angular avancé', 'Formation technique en développement web', '2025-07-15 09:00:00', '2025-07-20 17:00:00', TRUE, 'training'),
(3, 'Congé annuel', 'Vacances d\'été', '2025-06-01 00:00:00', '2025-06-07 23:59:59', TRUE, 'leave'),
(3, 'Congé maladie', 'Arrêt maladie pour grippe', '2025-05-10 00:00:00', '2025-05-12 23:59:59', TRUE, 'leave');

SET FOREIGN_KEY_CHECKS = 1;
