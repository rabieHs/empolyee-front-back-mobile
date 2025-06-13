const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès non autorisé. Seuls les administrateurs peuvent accéder à cette ressource.' });
    }
    next();
};

// Middleware pour vérifier si l'utilisateur est chef
const isChef = (req, res, next) => {
    if (req.user.role !== 'chef' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès non autorisé. Seuls les chefs et administrateurs peuvent accéder à cette ressource.' });
    }
    next();
};

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Access denied
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
// Récupérer tous les utilisateurs (admin et chef)
router.get('/', auth, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin ou chef
        if (req.user.role !== 'admin' && req.user.role !== 'chef') {
            return res.status(403).json({ message: 'Accès non autorisé. Seuls les administrateurs et chefs peuvent voir la liste des utilisateurs.' });
        }

        const users = await User.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
    }
});

// Récupérer tous les utilisateurs non-admin (admin et chef)
router.get('/non-admin', auth, isChef, async (req, res) => {
    try {
        const users = await User.getAllNonAdminUsers();
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs non-admin:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs non-admin' });
    }
});

// Récupérer le profil de l'utilisateur actuel
router.get('/profile', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json(user);
    } catch (error) {
        console.error(`Erreur lors de la récupération du profil de l'utilisateur ${req.user.userId}:`, error);
        res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
});

// Mettre à jour le profil de l'utilisateur actuel
router.put('/profile', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userData = req.body;

        // Vérifier si l'utilisateur existe
        const existingUser = await User.getUserById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Si un nouveau mot de passe est fourni, le mettre à jour séparément
        if (userData.newPassword) {
            if (userData.newPassword.length < 6) {
                return res.status(400).json({ message: 'Le nouveau mot de passe doit comporter au moins 6 caractères' });
            }
            await User.updatePassword(userId, userData.newPassword);
            delete userData.newPassword; // Supprimer le mot de passe des données à mettre à jour
        }

        const success = await User.updateUser(userId, userData);
        if (success) {
            res.json({ message: 'Profil mis à jour avec succès' });
        } else {
            res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
        }
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du profil de l'utilisateur ${req.user.userId}:`, error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
    }
});

// Récupérer un utilisateur par son ID
router.get('/:id', auth, async (req, res) => {
    try {
        const userId = req.params.id;

        // Vérifier si l'utilisateur demande ses propres informations ou s'il est admin
        if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé. Vous ne pouvez accéder qu\'à vos propres informations.' });
        }

        const user = await User.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json(user);
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'utilisateur ${req.params.id}:`, error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
    }
});

// Récupérer les membres de l'équipe d'un chef
router.get('/team/:chefId', auth, isChef, async (req, res) => {
    try {
        const chefId = req.params.chefId;

        // Vérifier si le chef demande les informations de sa propre équipe ou si c'est l'admin
        if (req.user.role === 'chef' && req.user.userId !== parseInt(chefId)) {
            return res.status(403).json({ message: 'Accès non autorisé. Vous ne pouvez accéder qu\'aux informations de votre propre équipe.' });
        }

        const teamMembers = await User.getTeamMembers(chefId);
        res.json(teamMembers);
    } catch (error) {
        console.error(`Erreur lors de la récupération des membres de l'équipe du chef ${req.params.chefId}:`, error);
        res.status(500).json({ message: 'Erreur lors de la récupération des membres de l\'équipe' });
    }
});

// Mettre à jour un utilisateur (admin seulement)
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const userData = req.body;

        console.log('📝 Admin updating user:', { userId, userData });

        // Vérifier si l'utilisateur existe
        const existingUser = await User.getUserById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Empêcher la modification de l'administrateur principal
        if (existingUser.email === 'admin@aya.com' && (userData.role !== 'admin' || userData.email !== 'admin@aya.com')) {
            return res.status(403).json({ message: 'Impossible de modifier le rôle ou l\'email de l\'administrateur principal' });
        }

        // Empêcher la modification du chef principal
        if (existingUser.email === 'chef@aya.com' && (userData.role !== 'chef' || userData.email !== 'chef@aya.com')) {
            return res.status(403).json({ message: 'Impossible de modifier le rôle ou l\'email du chef principal' });
        }

        const success = await User.updateUser(userId, userData);
        if (success) {
            res.json({ message: 'Utilisateur mis à jour avec succès' });
        } else {
            res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
        }
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'utilisateur ${req.params.id}:`, error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
});

// Mettre à jour le mot de passe d'un utilisateur
router.put('/:id/password', auth, async (req, res) => {
    try {
        const userId = req.params.id;
        const { newPassword } = req.body;

        // Vérifier si l'utilisateur demande la modification de son propre mot de passe ou s'il est admin
        if (req.user.userId !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé. Vous ne pouvez modifier que votre propre mot de passe.' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Le nouveau mot de passe doit comporter au moins 6 caractères' });
        }

        const success = await User.updatePassword(userId, newPassword);
        if (success) {
            res.json({ message: 'Mot de passe mis à jour avec succès' });
        } else {
            res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe' });
        }
    } catch (error) {
        console.error(`Erreur lors de la mise à jour du mot de passe de l'utilisateur ${req.params.id}:`, error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe' });
    }
});

// Supprimer un utilisateur (admin seulement)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const userId = req.params.id;

        // Vérifier si l'utilisateur existe
        const existingUser = await User.getUserById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // Empêcher la suppression de l'administrateur principal
        if (existingUser.email === 'admin@aya.com') {
            return res.status(403).json({ message: 'Impossible de supprimer le compte administrateur principal' });
        }

        // Empêcher la suppression du chef principal
        if (existingUser.email === 'chef@aya.com') {
            return res.status(403).json({ message: 'Impossible de supprimer le compte chef principal' });
        }

        const success = await User.deleteUser(userId);
        if (success) {
            res.json({ message: 'Utilisateur supprimé avec succès' });
        } else {
            res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
        }
    } catch (error) {
        console.error(`Erreur lors de la suppression de l'utilisateur ${req.params.id}:`, error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
    }
});

// Créer un nouvel utilisateur complet avec informations personnelles et professionnelles (admin seulement)
router.post('/complete', auth, isAdmin, async (req, res) => {
    try {
        const {
            email,
            password,
            firstname,
            lastname,
            role,
            chef_id,
            personalInfo,
            professionalInfo
        } = req.body;

        // Validation de base
        if (!email || !password || !firstname || !lastname) {
            return res.status(400).json({ message: 'Veuillez fournir email, mot de passe, prénom et nom' });
        }

        // Créer l'utilisateur avec toutes ses informations
        const newUser = await User.createUser({
            email,
            password,
            firstname,
            lastname,
            role,
            chef_id,
            personalInfo,
            professionalInfo
        });

        // Supprimer le mot de passe de la réponse
        delete newUser.password;

        // Créer une notification pour l'utilisateur
        // Cette partie sera implémentée si un modèle de notification existe

        res.status(201).json({
            message: 'Utilisateur créé avec succès avec toutes ses informations',
            user: newUser
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur complet:', error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur', error: error.message });
    }
});

module.exports = router;
