const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstname
 *               - lastname
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, chef, admin]
 *                 default: user
 *               department_id:
 *                 type: integer
 *               chef_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route d'inscription
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstname, lastname, role = 'user', chef_id = null } = req.body;

        // Créer le nouvel utilisateur avec le modèle User
        const newUser = await User.createUser({
            email,
            password,
            firstname,
            lastname,
            role,
            chef_id
        });

        // Créer le token JWT
        const token = jwt.sign(
            { userId: newUser.id, email, role },
            process.env.JWT_SECRET || 'votre_secret_jwt',
            { expiresIn: '24h' } // Durée de validité du token fixée à 24 heures
        );

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            token,
            user: {
                id: newUser.id,
                email,
                firstname,
                lastname,
                role
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access restricted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Route de connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Tentative de connexion:', { email });

        // Récupérer l'utilisateur avec le modèle User
        const user = await User.getUserByEmail(email);
        console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');
        if (user) {
            console.log('Rôle de l\'utilisateur:', user.role);
        }

        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Allow all chef users to login
        // Note: Chef access restrictions are handled in the frontend and user listing

        // Vérifier le mot de passe
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Mot de passe valide:', validPassword ? 'Oui' : 'Non');
        if (!validPassword) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Créer le token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'votre_secret_jwt',
            { expiresIn: '24h' } // Durée de validité du token fixée à 24 heures
        );

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
});

// Route de réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Vérifier si l'utilisateur existe
        const [users] = await promisePool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Générer un token de réinitialisation
        const resetToken = jwt.sign(
            { userId: users[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Sauvegarder le token dans la base de données
        await promisePool.execute(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
            [users[0].id, resetToken]
        );

        // Dans un environnement de production, envoyez un email avec le lien de réinitialisation
        res.json({
            message: 'Instructions de réinitialisation envoyées par email',
            resetToken // À retirer en production
        });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
    }
});

module.exports = router;
