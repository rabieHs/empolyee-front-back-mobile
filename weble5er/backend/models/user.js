const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configuration de la connexion MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aya_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Tester la connexion à MySQL
pool.query('SELECT 1')
    .then(() => {
        console.log('Modèle User: Connexion à MySQL réussie');
    })
    .catch((err) => {
        console.error('Modèle User: Erreur de connexion à MySQL:', err.message);
    });

class User {
    // Récupérer tous les utilisateurs
    static async getAllUsers() {
        try {
            const [rows] = await pool.execute(`
                SELECT u.id, u.email, u.firstname, u.lastname, u.role, u.department_id, u.chef_id, u.created_at, u.updated_at,
                       c.firstname as chef_firstname, c.lastname as chef_lastname,
                       d.name as department_name, d.description as department_description,
                       pi.cin, pi.date_of_birth, pi.nationality, pi.address, pi.phone,
                       pri.employee_id, pri.position, pri.hire_date
                FROM users u
                LEFT JOIN users c ON u.chef_id = c.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN personal_info pi ON u.id = pi.user_id
                LEFT JOIN professional_info pri ON u.id = pri.user_id
                ORDER BY u.role, u.lastname, u.firstname
            `);

            // Filtrer pour masquer les chefs autres que chef@aya.com
            return rows.filter(user => {
                if (user.role === 'chef' && user.email !== 'chef@aya.com') {
                    return false;
                }
                return true;
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            throw error;
        }
    }

    // Récupérer tous les utilisateurs non-admin
    static async getAllNonAdminUsers() {
        try {
            const [rows] = await pool.execute(`
                SELECT u.id, u.email, u.firstname, u.lastname, u.role, u.department_id, u.chef_id, u.created_at, u.updated_at,
                       c.firstname as chef_firstname, c.lastname as chef_lastname,
                       d.name as department_name, d.description as department_description,
                       pi.cin, pi.date_of_birth, pi.nationality, pi.address, pi.phone,
                       pri.employee_id, pri.position, pri.hire_date
                FROM users u
                LEFT JOIN users c ON u.chef_id = c.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN personal_info pi ON u.id = pi.user_id
                LEFT JOIN professional_info pri ON u.id = pri.user_id
                WHERE u.role != 'admin'
                ORDER BY u.role, u.lastname, u.firstname
            `);

            // Filtrer pour masquer les chefs autres que chef@aya.com
            return rows.filter(user => {
                if (user.role === 'chef' && user.email !== 'chef@aya.com') {
                    return false;
                }
                return true;
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs non-admin:', error);
            throw error;
        }
    }

    // Récupérer un utilisateur par son ID
    static async getUserById(userId) {
        try {
            const [rows] = await pool.execute(`
                SELECT u.id, u.email, u.firstname, u.lastname, u.role, u.department_id, u.chef_id, u.created_at, u.updated_at,
                       c.firstname as chef_firstname, c.lastname as chef_lastname,
                       d.name as department_name, d.description as department_description,
                       pi.cin, pi.date_of_birth, pi.nationality, pi.address, pi.phone,
                       pri.employee_id, pri.position, pri.hire_date
                FROM users u
                LEFT JOIN users c ON u.chef_id = c.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN personal_info pi ON u.id = pi.user_id
                LEFT JOIN professional_info pri ON u.id = pri.user_id
                WHERE u.id = ?
            `, [userId]);

            return rows[0] || null;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'utilisateur ${userId}:`, error);
            throw error;
        }
    }

    // Récupérer un utilisateur par son email
    static async getUserByEmail(email) {
        try {
            const [rows] = await pool.execute(`
                SELECT u.id, u.email, u.password, u.firstname, u.lastname, u.role, u.department_id, u.chef_id, u.created_at, u.updated_at,
                       c.firstname as chef_firstname, c.lastname as chef_lastname,
                       d.name as department_name
                FROM users u
                LEFT JOIN users c ON u.chef_id = c.id
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE u.email = ?
            `, [email]);

            return rows[0] || null;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'utilisateur avec l'email ${email}:`, error);
            throw error;
        }
    }

    // Créer un nouvel utilisateur avec informations personnelles et professionnelles automatiquement
    static async createUser(userData) {
        try {
            const {
                email,
                password,
                firstname,
                lastname,
                role = 'user',
                department_id = null,
                chef_id = null,
                // Informations personnelles
                personalInfo = {
                    cin: '',
                    date_of_birth: null,
                    place_of_birth: '',
                    nationality: '',
                    marital_status: 'single',
                    number_of_children: 0,
                    address: '',
                    city: '',
                    country: '',
                    phone: '',
                    emergency_contact_name: '',
                    emergency_contact_relationship: '',
                    emergency_contact_phone: ''
                },
                // Informations professionnelles
                professionalInfo = {
                    employee_id: '',
                    department: '',
                    position: '',
                    grade: '',
                    hire_date: null,
                    contract_type: 'CDI',
                    salary: null,
                    rib: '',
                    bank_name: '',
                    cnss: '',
                    mutuelle: ''
                }
            } = userData;

            // Vérifier si l'email existe déjà
            const existingUser = await this.getUserByEmail(email);
            if (existingUser) {
                throw new Error('Cet email est déjà utilisé');
            }

            // Démarrer une transaction pour garantir l'intégrité des données
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                // Hasher le mot de passe
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insérer le nouvel utilisateur
                const [userResult] = await connection.execute(
                    'INSERT INTO users (email, password, firstname, lastname, role, department_id, chef_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [email, hashedPassword, firstname, lastname, role, department_id, chef_id]
                );

                const userId = userResult.insertId;

                // Formater la date de naissance si elle est fournie
                let formattedBirthDate = null;
                if (personalInfo.date_of_birth) {
                    formattedBirthDate = new Date(personalInfo.date_of_birth).toISOString().split('T')[0];
                } else {
                    // Date par défaut (à modifier selon les besoins)
                    formattedBirthDate = '1990-01-01';
                }

                // Insérer les informations personnelles
                await connection.execute(
                    `INSERT INTO personal_info (
                        user_id, cin, date_of_birth, place_of_birth, nationality,
                        marital_status, number_of_children, address, city, country,
                        phone, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        personalInfo.cin || '',
                        formattedBirthDate,
                        personalInfo.place_of_birth || '',
                        personalInfo.nationality || 'Non spécifiée',
                        personalInfo.marital_status || 'single',
                        personalInfo.number_of_children || 0,
                        personalInfo.address || '',
                        personalInfo.city || '',
                        personalInfo.country || '',
                        personalInfo.phone || '',
                        personalInfo.emergency_contact_name || '',
                        personalInfo.emergency_contact_relationship || '',
                        personalInfo.emergency_contact_phone || ''
                    ]
                );

                // Formater la date d'embauche si elle est fournie
                let formattedHireDate = null;
                if (professionalInfo.hire_date) {
                    formattedHireDate = new Date(professionalInfo.hire_date).toISOString().split('T')[0];
                } else {
                    // Date actuelle par défaut
                    formattedHireDate = new Date().toISOString().split('T')[0];
                }

                // Générer un ID d'employé par défaut si non fourni
                const employeeId = professionalInfo.employee_id || `EMP${userId.toString().padStart(4, '0')}`;

                // Insérer les informations professionnelles
                await connection.execute(
                    `INSERT INTO professional_info (
                        user_id, employee_id, position, grade,
                        hire_date, contract_type, salary, rib, bank_name, cnss, mutuelle
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        employeeId,
                        professionalInfo.position || 'Non assigné',
                        professionalInfo.grade || '',
                        formattedHireDate,
                        professionalInfo.contract_type || 'CDI',
                        professionalInfo.salary || null,
                        professionalInfo.rib || '',
                        professionalInfo.bank_name || '',
                        professionalInfo.cnss || '',
                        professionalInfo.mutuelle || ''
                    ]
                );

                // Valider la transaction
                await connection.commit();

                return {
                    id: userId,
                    email,
                    firstname,
                    lastname,
                    role,
                    chef_id,
                    personalInfo: {
                        ...personalInfo,
                        date_of_birth: formattedBirthDate
                    },
                    professionalInfo: {
                        ...professionalInfo,
                        employee_id: employeeId,
                        hire_date: formattedHireDate
                    }
                };
            } catch (error) {
                // Annuler la transaction en cas d'erreur
                await connection.rollback();
                throw error;
            } finally {
                // Libérer la connexion
                connection.release();
            }
        } catch (error) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            throw error;
        }
    }

    // Mettre à jour un utilisateur
    static async updateUser(userId, userData) {
        try {
            console.log('📝 UpdateUser called with:', { userId, userData });

            const { firstname, lastname, role, department_id, chef_id, email } = userData;

            // Convertir undefined en null pour MySQL
            const cleanData = {
                firstname: firstname !== undefined ? firstname : null,
                lastname: lastname !== undefined ? lastname : null,
                role: role !== undefined ? role : null,
                department_id: department_id !== undefined ? department_id : null,
                chef_id: chef_id !== undefined ? chef_id : null
            };

            console.log('🧹 Cleaned data:', cleanData);

            // Construire la requête dynamiquement pour ne mettre à jour que les champs fournis
            const updateFields = [];
            const updateValues = [];

            if (cleanData.firstname !== null) {
                updateFields.push('firstname = ?');
                updateValues.push(cleanData.firstname);
            }
            if (cleanData.lastname !== null) {
                updateFields.push('lastname = ?');
                updateValues.push(cleanData.lastname);
            }
            if (cleanData.role !== null) {
                updateFields.push('role = ?');
                updateValues.push(cleanData.role);
            }
            if (cleanData.department_id !== null) {
                updateFields.push('department_id = ?');
                updateValues.push(cleanData.department_id);
            }
            if (cleanData.chef_id !== null) {
                updateFields.push('chef_id = ?');
                updateValues.push(cleanData.chef_id);
            }
            if (email !== undefined) {
                updateFields.push('email = ?');
                updateValues.push(email);
            }

            // Ajouter updated_at et userId
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(userId);

            if (updateFields.length === 1) { // Seulement updated_at
                console.log('⚠️ No fields to update');
                return true; // Rien à mettre à jour
            }

            const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
            console.log('🔍 SQL Query:', query);
            console.log('🔍 SQL Values:', updateValues);

            // Mettre à jour l'utilisateur
            const [result] = await pool.execute(query, updateValues);

            return result.affectedRows > 0;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de l'utilisateur ${userId}:`, error);
            throw error;
        }
    }

    // Mettre à jour le mot de passe d'un utilisateur
    static async updatePassword(userId, newPassword) {
        try {
            // Hasher le nouveau mot de passe
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Mettre à jour le mot de passe
            const [result] = await pool.execute(
                'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedPassword, userId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du mot de passe de l'utilisateur ${userId}:`, error);
            throw error;
        }
    }

    // Supprimer un utilisateur
    static async deleteUser(userId) {
        try {
            // Vérifier si c'est l'administrateur principal
            const user = await this.getUserById(userId);
            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }
            if (user.email === 'admin@aya.com') {
                throw new Error('Impossible de supprimer le compte administrateur principal');
            }

            // Supprimer l'utilisateur
            const [result] = await pool.execute(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error(`Erreur lors de la suppression de l'utilisateur ${userId}:`, error);
            throw error;
        }
    }

    // Récupérer les membres de l'équipe d'un chef
    static async getTeamMembers(chefId) {
        try {
            const [rows] = await pool.execute(`
                SELECT u.id, u.email, u.firstname, u.lastname, u.role, u.department_id, u.created_at, u.updated_at,
                       d.name as department_name,
                       pi.cin, pi.date_of_birth, pi.nationality, pi.address, pi.phone,
                       pri.employee_id, pri.position, pri.hire_date
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN personal_info pi ON u.id = pi.user_id
                LEFT JOIN professional_info pri ON u.id = pri.user_id
                WHERE u.chef_id = ?
                ORDER BY u.lastname, u.firstname
            `, [chefId]);

            return rows;
        } catch (error) {
            console.error(`Erreur lors de la récupération des membres de l'équipe du chef ${chefId}:`, error);
            throw error;
        }
    }
}

module.exports = User;
