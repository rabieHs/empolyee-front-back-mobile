const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const auth = require('../middleware/auth');

// Configuration de la connexion MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Route principale pour récupérer les demandes selon le rôle de l'utilisateur
router.get('/', async (req, res) => {
    try {
        const currentUser = req.user;
        console.log('🔍 GET /api/requests - User:', currentUser.id, 'Role:', currentUser.role);
        let requests = [];

        switch (currentUser.role) {
            case 'admin':
                // L'admin voit toutes les demandes
                console.log('👨‍💼 Admin: Loading all requests');
                const [adminRequests] = await promisePool.execute(`
                    SELECT r.*,
                           u.firstname,
                           u.lastname,
                           u.email,
                           d.name as department_name,
                           pi.cin,
                           pi.phone,
                           pri.position
                    FROM requests r
                    JOIN users u ON r.user_id = u.id
                    LEFT JOIN departments d ON u.department_id = d.id
                    LEFT JOIN personal_info pi ON u.id = pi.user_id
                    LEFT JOIN professional_info pri ON u.id = pri.user_id
                    ORDER BY r.created_at DESC
                `);
                requests = adminRequests;
                console.log('📊 Admin found', requests.length, 'requests');
                break;

            case 'chef':
                // Le chef voit toutes les demandes (filtrage côté client pour congé et formation)
                console.log('👨‍🍳 Chef: Loading all requests for filtering');
                const [chefRequests] = await promisePool.execute(`
                    SELECT r.*,
                           u.firstname,
                           u.lastname,
                           u.email,
                           d.name as department_name,
                           pi.cin,
                           pi.phone,
                           pri.position
                    FROM requests r
                    JOIN users u ON r.user_id = u.id
                    LEFT JOIN departments d ON u.department_id = d.id
                    LEFT JOIN personal_info pi ON u.id = pi.user_id
                    LEFT JOIN professional_info pri ON u.id = pri.user_id
                    ORDER BY r.created_at DESC
                `);
                requests = chefRequests;
                console.log('📊 Chef found', requests.length, 'total requests');
                break;

            case 'user':
            default:
                // L'utilisateur voit seulement ses propres demandes
                console.log('👤 User: Loading personal requests for user', currentUser.id);
                const [userRequests] = await promisePool.execute(
                    'SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC',
                    [currentUser.id]
                );
                requests = userRequests;
                console.log('📊 User found', requests.length, 'personal requests');
                break;
        }

        // Ajouter les informations utilisateur pour chaque demande si pas déjà présentes
        const requestsWithUserInfo = requests.map(request => {
            return {
                ...request,
                user: {
                    id: request.user_id,
                    firstname: request.firstname || 'Inconnu',
                    lastname: request.lastname || '',
                    email: request.email || ''
                }
            };
        });

        console.log('✅ Sending', requestsWithUserInfo.length, 'requests to client');
        res.json(requestsWithUserInfo);
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des demandes' });
    }
});

/**
 * @swagger
 * /api/requests/all:
 *   get:
 *     summary: Get all requests (admin only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Request'
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
// Récupérer toutes les demandes (admin seulement)
router.get('/all', async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Récupérer toutes les demandes avec les informations des utilisateurs
        const [requests] = await promisePool.execute(`
            SELECT r.*,
                   u.firstname,
                   u.lastname,
                   u.email,
                   d.name as department_name,
                   pi.cin,
                   pi.phone,
                   pri.position
            FROM requests r
            JOIN users u ON r.user_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN personal_info pi ON u.id = pi.user_id
            LEFT JOIN professional_info pri ON u.id = pri.user_id
            ORDER BY r.created_at DESC
        `);

        res.json(requests);
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des demandes' });
    }
});

// Récupérer les demandes des subordonnés du chef
router.get('/subordinates', async (req, res) => {
    try {
        if (req.user.role !== 'chef') {
            return res.status(403).json({ message: 'Accès réservé au chef' });
        }
        // Récupérer les demandes des utilisateurs dont le chef_id = req.user.id
        const [requests] = await promisePool.execute(`
            SELECT r.*, u.firstname, u.lastname, u.email
            FROM requests r
            JOIN users u ON r.user_id = u.id
            WHERE u.chef_id = ?
            ORDER BY r.created_at DESC
        `, [req.user.id]);
        res.json(requests);
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes des subordonnés:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des demandes des subordonnés' });
    }
});

// Récupérer les demandes d'un utilisateur
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // Vérifier si l'utilisateur accède à ses propres demandes ou est admin
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const [requests] = await promisePool.execute(
            'SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json(requests);
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des demandes' });
    }
});

// Endpoint pour la compatibilité avec l'ancienne version mobile
// Récupérer les demandes de l'utilisateur connecté (sans paramètre userId)
router.get('/user', async (req, res) => {
    try {
        console.log('📱 [MOBILE COMPAT] Récupération des demandes pour l\'utilisateur connecté:', req.user.id);

        // Utiliser l'ID de l'utilisateur connecté depuis le token JWT
        const userId = req.user.id;

        const [requests] = await promisePool.execute(
            'SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        console.log('📱 [MOBILE COMPAT] Demandes trouvées:', requests.length);

        // Ajouter les informations utilisateur pour chaque demande
        const requestsWithUserInfo = requests.map(request => {
            return {
                ...request,
                user: {
                    id: request.user_id,
                    firstname: request.firstname || 'Inconnu',
                    lastname: request.lastname || '',
                    email: request.email || ''
                }
            };
        });

        res.json(requestsWithUserInfo);
    } catch (error) {
        console.error('Erreur lors de la récupération des demandes utilisateur:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des demandes' });
    }
});

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a new request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRequestBody'
 *     responses:
 *       201:
 *         description: Request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 message:
 *                   type: string
 *                 request:
 *                   $ref: '#/components/schemas/Request'
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
// Créer une nouvelle demande
router.post('/', async (req, res) => {
    try {
        const { type, details, start_date, end_date, description, working_days } = req.body;

        // Importer le modèle Request pour utiliser sa méthode createRequest
        const Request = require('../models/request');

        // Créer la demande en utilisant le modèle Request
        // Cette méthode s'occupe d'ajouter la demande dans la base de données et de créer les notifications
        const newRequest = await Request.createRequest(
            req.user.id,
            type,
            start_date || new Date().toISOString().split('T')[0], // Date de début (aujourd'hui par défaut)
            end_date || new Date().toISOString().split('T')[0],   // Date de fin (aujourd'hui par défaut)
            description || `Demande de ${type}`,                  // Description par défaut
            details,                                             // Détails spécifiques au type de demande
            working_days || 1                                    // Nombre de jours ouvrables
        );

        // Informer le client que la demande a été créée avec succès
        res.status(201).json({
            id: newRequest.id,
            message: 'Demande créée avec succès et enregistrée dans la base de données',
            request: newRequest
        });
    } catch (error) {
        console.error('Erreur lors de la création de la demande:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la demande', error: error.message });
    }
});

/**
 * @swagger
 * /api/requests/{id}/status:
 *   patch:
 *     summary: Update request status (admin or chef only)
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRequestStatusBody'
 *     responses:
 *       200:
 *         description: Request status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 request:
 *                   $ref: '#/components/schemas/Request'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Request not found
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
// Mettre à jour le statut d'une demande (admin ou chef)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, observation, niveau } = req.body; // niveau = 'chef' ou 'admin'
        const requestId = req.params.id;

        // Importer le modèle Request
        const Request = require('../models/request');

        // Vérifier si la demande existe
        const request = await Request.getRequestById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        // Si c'est le chef, vérifier les restrictions de type
        if (req.user.role === 'chef' && niveau === 'chef') {
            // Le chef ne peut approuver/rejeter que les demandes de congés et de formation
            const requestType = request.type.toLowerCase();
            const isCongeOrFormation = requestType.includes('congé') ||
                                     requestType.includes('conge') ||
                                     requestType.includes('formation');

            if (!isCongeOrFormation) {
                return res.status(403).json({
                    message: 'Le chef ne peut traiter que les demandes de congés et de formation'
                });
            }
        }

        // L'admin peut traiter TOUS les types de demandes (pas de restriction)

        // Vérifier que l'utilisateur a les droits pour mettre à jour cette demande
        if (req.user.role !== 'admin' && req.user.role !== 'chef') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Mettre à jour le statut de la demande en utilisant le modèle Request
        // Cette méthode s'occupe de mettre à jour la base de données et de créer les notifications
        const success = await Request.updateRequestStatus(requestId, status, observation, req.user.id);

        if (success) {
            // Récupérer la demande mise à jour
            const updatedRequest = await Request.getRequestById(requestId);

            res.json({
                message: `Statut de la demande mis à jour avec succès: ${status}`,
                request: updatedRequest
            });
        } else {
            res.status(500).json({ message: 'Erreur lors de la mise à jour du statut de la demande' });
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du statut', error: error.message });
    }
});

/**
 * @swagger
 * /api/requests/{id}:
 *   put:
 *     summary: Update a request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRequestBody'
 *     responses:
 *       200:
 *         description: Request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Request'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Request not found
 *       500:
 *         description: Internal server error
 */
// Mettre à jour une demande complète
router.put('/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const { status, chef_observation, admin_response } = req.body;

        console.log('🔄 PUT /api/requests/' + requestId + ' - Status update request:', {
            requestId,
            status,
            chef_observation,
            admin_response,
            userRole: req.user.role,
            userId: req.user.id
        });

        // Importer le modèle Request
        const Request = require('../models/request');

        // Vérifier si la demande existe
        const existingRequest = await Request.getRequestById(requestId);
        if (!existingRequest) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        // Vérifier les permissions
        const currentUser = req.user;
        if (currentUser.role !== 'admin' && currentUser.role !== 'chef') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        // Préparer les données de mise à jour
        let updateData = {};
        let observation = null;

        if (status) {
            updateData.status = status;
        }

        if (currentUser.role === 'chef' && chef_observation) {
            observation = chef_observation;
        } else if (currentUser.role === 'admin' && admin_response) {
            observation = admin_response;
        }

        // Mettre à jour le statut de la demande
        const success = await Request.updateRequestStatus(requestId, status, observation, currentUser.id);

        if (success) {
            // Récupérer la demande mise à jour
            const updatedRequest = await Request.getRequestById(requestId);

            // Ajouter les informations utilisateur
            const [userInfo] = await promisePool.execute(
                'SELECT firstname, lastname, email FROM users WHERE id = ?',
                [updatedRequest.user_id]
            );

            if (userInfo.length > 0) {
                updatedRequest.user = {
                    id: updatedRequest.user_id,
                    firstname: userInfo[0].firstname,
                    lastname: userInfo[0].lastname,
                    email: userInfo[0].email
                };
            }

            res.json(updatedRequest);
        } else {
            res.status(500).json({ message: 'Erreur lors de la mise à jour de la demande' });
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la demande:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la demande', error: error.message });
    }
});

module.exports = router;
