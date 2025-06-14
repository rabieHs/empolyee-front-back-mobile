const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const auth = require('../middleware/auth');

// Configuration de la base de données MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aya_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Helper function to convert date to MySQL format
function formatDateForMySQL(dateValue) {
    if (!dateValue) return null;
    try {
        return new Date(dateValue).toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', error);
        return null;
    }
}

/**
 * @swagger
 * /api/profile/personal/{userId}:
 *   get:
 *     summary: Get personal information for a user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Personal information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PersonalInfo'
 *       404:
 *         description: Personal information not found
 *       403:
 *         description: Access denied
 */
router.get('/personal/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if user can access this profile (own profile, admin, or chef)
        if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin' && req.user.role !== 'chef') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const [rows] = await promisePool.execute(
            'SELECT * FROM personal_info WHERE user_id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Informations personnelles non trouvées' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations personnelles:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des informations personnelles' });
    }
});

/**
 * @swagger
 * /api/profile/professional/{userId}:
 *   get:
 *     summary: Get professional information for a user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Professional information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfessionalInfo'
 *       404:
 *         description: Professional information not found
 *       403:
 *         description: Access denied
 */
router.get('/professional/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if user can access this profile (own profile, admin, or chef)
        if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin' && req.user.role !== 'chef') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const [rows] = await promisePool.execute(
            'SELECT * FROM professional_info WHERE user_id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Informations professionnelles non trouvées' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations professionnelles:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des informations professionnelles' });
    }
});

/**
 * @swagger
 * /api/profile/complete/{userId}:
 *   get:
 *     summary: Get complete profile information (personal + professional)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Complete profile information retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/complete/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if user can access this profile (own profile, admin, or chef)
        if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin' && req.user.role !== 'chef') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Get user basic info
        const [userRows] = await promisePool.execute(
            'SELECT id, email, firstname, lastname, role, department_id, chef_id, created_at, updated_at FROM users WHERE id = ?',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const user = userRows[0];

        // Get personal info
        const [personalRows] = await promisePool.execute(
            'SELECT * FROM personal_info WHERE user_id = ?',
            [userId]
        );

        // Get professional info
        const [professionalRows] = await promisePool.execute(
            'SELECT * FROM professional_info WHERE user_id = ?',
            [userId]
        );

        // Get department info if exists
        let department = null;
        if (user.department_id) {
            const [deptRows] = await promisePool.execute(
                'SELECT id, name, description FROM departments WHERE id = ?',
                [user.department_id]
            );
            department = deptRows.length > 0 ? deptRows[0] : null;
        }

        // Get chef info if exists
        let chef = null;
        if (user.chef_id) {
            const [chefRows] = await promisePool.execute(
                'SELECT id, firstname, lastname, email FROM users WHERE id = ?',
                [user.chef_id]
            );
            chef = chefRows.length > 0 ? chefRows[0] : null;
        }

        const completeProfile = {
            user: user,
            personalInfo: personalRows.length > 0 ? personalRows[0] : null,
            professionalInfo: professionalRows.length > 0 ? professionalRows[0] : null,
            department: department,
            chef: chef
        };

        res.json(completeProfile);
    } catch (error) {
        console.error('Erreur lors de la récupération du profil complet:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du profil complet' });
    }
});

/**
 * @swagger
 * /api/profile/personal/{userId}:
 *   put:
 *     summary: Update personal information for a user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonalInfoUpdate'
 *     responses:
 *       200:
 *         description: Personal information updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.put('/personal/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const personalData = req.body;

        // Check if user can update this profile (own profile or admin)
        if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé. Vous ne pouvez modifier que votre propre profil.' });
        }

        // Check if user exists
        const [userRows] = await promisePool.execute(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Check if personal info exists
        const [existingRows] = await promisePool.execute(
            'SELECT id FROM personal_info WHERE user_id = ?',
            [userId]
        );

        if (existingRows.length === 0) {
            // Create new personal info record
            await promisePool.execute(
                `INSERT INTO personal_info (
                    user_id, cin, date_of_birth, place_of_birth, nationality,
                    marital_status, number_of_children, address, city, country,
                    phone, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    personalData.cin || '',
                    formatDateForMySQL(personalData.date_of_birth) || '1990-01-01',
                    personalData.place_of_birth || '',
                    personalData.nationality || '',
                    personalData.marital_status || 'single',
                    personalData.number_of_children || 0,
                    personalData.address || '',
                    personalData.city || '',
                    personalData.country || '',
                    personalData.phone || '',
                    personalData.emergency_contact_name || '',
                    personalData.emergency_contact_relationship || '',
                    personalData.emergency_contact_phone || ''
                ]
            );
        } else {
            // Update existing personal info
            const updateFields = [];
            const updateValues = [];

            if (personalData.cin !== undefined) {
                updateFields.push('cin = ?');
                updateValues.push(personalData.cin);
            }
            if (personalData.date_of_birth !== undefined) {
                updateFields.push('date_of_birth = ?');
                // Convert ISO datetime to MySQL date format (YYYY-MM-DD)
                updateValues.push(formatDateForMySQL(personalData.date_of_birth));
            }
            if (personalData.place_of_birth !== undefined) {
                updateFields.push('place_of_birth = ?');
                updateValues.push(personalData.place_of_birth);
            }
            if (personalData.nationality !== undefined) {
                updateFields.push('nationality = ?');
                updateValues.push(personalData.nationality);
            }
            if (personalData.marital_status !== undefined) {
                updateFields.push('marital_status = ?');
                updateValues.push(personalData.marital_status);
            }
            if (personalData.number_of_children !== undefined) {
                updateFields.push('number_of_children = ?');
                updateValues.push(personalData.number_of_children);
            }
            if (personalData.address !== undefined) {
                updateFields.push('address = ?');
                updateValues.push(personalData.address);
            }
            if (personalData.city !== undefined) {
                updateFields.push('city = ?');
                updateValues.push(personalData.city);
            }
            if (personalData.country !== undefined) {
                updateFields.push('country = ?');
                updateValues.push(personalData.country);
            }
            if (personalData.phone !== undefined) {
                updateFields.push('phone = ?');
                updateValues.push(personalData.phone);
            }
            if (personalData.emergency_contact_name !== undefined) {
                updateFields.push('emergency_contact_name = ?');
                updateValues.push(personalData.emergency_contact_name);
            }
            if (personalData.emergency_contact_relationship !== undefined) {
                updateFields.push('emergency_contact_relationship = ?');
                updateValues.push(personalData.emergency_contact_relationship);
            }
            if (personalData.emergency_contact_phone !== undefined) {
                updateFields.push('emergency_contact_phone = ?');
                updateValues.push(personalData.emergency_contact_phone);
            }

            if (updateFields.length > 0) {
                updateFields.push('updated_at = CURRENT_TIMESTAMP');
                updateValues.push(userId);

                await promisePool.execute(
                    `UPDATE personal_info SET ${updateFields.join(', ')} WHERE user_id = ?`,
                    updateValues
                );
            }
        }

        // Get updated personal info
        const [updatedRows] = await promisePool.execute(
            'SELECT * FROM personal_info WHERE user_id = ?',
            [userId]
        );

        res.json({
            message: 'Informations personnelles mises à jour avec succès',
            personalInfo: updatedRows[0]
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des informations personnelles:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour des informations personnelles' });
    }
});

/**
 * @swagger
 * /api/profile/professional/{userId}:
 *   put:
 *     summary: Update professional information for a user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfessionalInfoUpdate'
 *     responses:
 *       200:
 *         description: Professional information updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.put('/professional/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const professionalData = req.body;

        // Check if user can update this profile (own profile or admin)
        if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé. Vous ne pouvez modifier que votre propre profil.' });
        }

        // Check if user exists
        const [userRows] = await promisePool.execute(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Check if professional info exists
        const [existingRows] = await promisePool.execute(
            'SELECT id FROM professional_info WHERE user_id = ?',
            [userId]
        );

        if (existingRows.length === 0) {
            // Create new professional info record
            await promisePool.execute(
                `INSERT INTO professional_info (
                    user_id, employee_id, department, position, grade,
                    hire_date, contract_type, salary, rib, bank_name, cnss, mutuelle
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    professionalData.employee_id || '',
                    professionalData.department || '',
                    professionalData.position || '',
                    professionalData.grade || '',
                    formatDateForMySQL(professionalData.hire_date),
                    professionalData.contract_type || 'CDI',
                    professionalData.salary || null,
                    professionalData.rib || '',
                    professionalData.bank_name || '',
                    professionalData.cnss || '',
                    professionalData.mutuelle || ''
                ]
            );
        } else {
            // Update existing professional info
            const updateFields = [];
            const updateValues = [];

            if (professionalData.employee_id !== undefined) {
                updateFields.push('employee_id = ?');
                updateValues.push(professionalData.employee_id);
            }
            if (professionalData.department !== undefined) {
                updateFields.push('department = ?');
                updateValues.push(professionalData.department);
            }
            if (professionalData.position !== undefined) {
                updateFields.push('position = ?');
                updateValues.push(professionalData.position);
            }
            if (professionalData.grade !== undefined) {
                updateFields.push('grade = ?');
                updateValues.push(professionalData.grade);
            }
            if (professionalData.hire_date !== undefined) {
                updateFields.push('hire_date = ?');
                // Convert ISO datetime to MySQL date format (YYYY-MM-DD)
                updateValues.push(formatDateForMySQL(professionalData.hire_date));
            }
            if (professionalData.contract_type !== undefined) {
                updateFields.push('contract_type = ?');
                updateValues.push(professionalData.contract_type);
            }
            if (professionalData.salary !== undefined) {
                updateFields.push('salary = ?');
                updateValues.push(professionalData.salary);
            }
            if (professionalData.rib !== undefined) {
                updateFields.push('rib = ?');
                updateValues.push(professionalData.rib);
            }
            if (professionalData.bank_name !== undefined) {
                updateFields.push('bank_name = ?');
                updateValues.push(professionalData.bank_name);
            }
            if (professionalData.cnss !== undefined) {
                updateFields.push('cnss = ?');
                updateValues.push(professionalData.cnss);
            }
            if (professionalData.mutuelle !== undefined) {
                updateFields.push('mutuelle = ?');
                updateValues.push(professionalData.mutuelle);
            }

            if (updateFields.length > 0) {
                updateFields.push('updated_at = CURRENT_TIMESTAMP');
                updateValues.push(userId);

                await promisePool.execute(
                    `UPDATE professional_info SET ${updateFields.join(', ')} WHERE user_id = ?`,
                    updateValues
                );
            }
        }

        // Get updated professional info
        const [updatedRows] = await promisePool.execute(
            'SELECT * FROM professional_info WHERE user_id = ?',
            [userId]
        );

        res.json({
            message: 'Informations professionnelles mises à jour avec succès',
            professionalInfo: updatedRows[0]
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des informations professionnelles:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour des informations professionnelles' });
    }
});

module.exports = router;
