const mysql = require('mysql2/promise');

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
        console.log('Modèle Request: Connexion à MySQL réussie');
        // Synchroniser les événements du calendrier avec les demandes
        synchronizeCalendarWithRequests();
    })
    .catch(err => {
        console.error('Modèle Request: Erreur de connexion à MySQL:', err);
    });



// Fonction pour synchroniser les événements du calendrier avec les demandes
async function synchronizeCalendarWithRequests() {
    try {
        console.log('Synchronisation des événements du calendrier avec les demandes...');

        // Récupérer toutes les demandes de congés et formations
        const [requests] = await pool.execute(`
            SELECT r.*, u.firstname, u.lastname
            FROM requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.type LIKE '%congé%' OR r.type LIKE '%formation%' OR r.type LIKE '%maladie%' OR r.type LIKE '%maternité%'
        `);

        if (requests.length > 0) {
            const connection = await pool.getConnection();
            await connection.beginTransaction();

            try {
                for (const request of requests) {
                    // Déterminer le type d'événement
                    let eventType = 'event';
                    if (request.type.toLowerCase().includes('congé') || request.type.toLowerCase().includes('maladie') || request.type.toLowerCase().includes('maternité')) {
                        eventType = 'leave';
                    } else if (request.type.toLowerCase().includes('formation')) {
                        eventType = 'training';
                    }

                    const userName = `${request.firstname} ${request.lastname}`;
                    const eventTitle = `${request.type} - ${userName}`;

                    // Vérifier si l'événement existe déjà dans le calendrier
                    const [existingEvents] = await connection.execute(
                        `SELECT id FROM calendar_events
                         WHERE user_id = ? AND start_date = ? AND end_date = ? AND type = ?`,
                        [request.user_id, request.start_date, request.end_date, eventType]
                    );

                    if (existingEvents.length === 0) {
                        // Insérer l'événement dans le calendrier
                        await connection.execute(
                            `INSERT INTO calendar_events
                            (user_id, title, description, start_date, end_date, all_day, type)
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                request.user_id,
                                eventTitle,
                                request.description || `Demande de ${request.type}`,
                                request.start_date,
                                request.end_date,
                                true,
                                eventType
                            ]
                        );

                        console.log(`Événement de calendrier créé pour la demande #${request.id}`);
                    }
                }

                await connection.commit();
                console.log('Synchronisation des événements du calendrier terminée avec succès');
            } catch (error) {
                await connection.rollback();
                console.error('Erreur lors de la synchronisation des événements du calendrier:', error);
            } finally {
                connection.release();
            }
        } else {
            console.log('Aucune demande de congé ou formation à synchroniser avec le calendrier');
        }
    } catch (error) {
        console.error('Erreur lors de la synchronisation des événements du calendrier:', error);
    }
}

class Request {
    // Récupérer toutes les demandes
    static async getAllRequests() {
        try {
            const [rows] = await pool.execute(`
                SELECT r.*,
                       u.firstname,
                       u.lastname,
                       u.email,
                       u.role,
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
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des demandes:', error);
            throw error;
        }
    }

    // Récupérer une demande par son ID
    static async getRequestById(requestId) {
        try {
            const [rows] = await pool.execute(`
                SELECT r.*,
                       u.firstname,
                       u.lastname,
                       u.email,
                       u.role,
                       d.name as department_name,
                       pi.cin,
                       pi.phone,
                       pri.position
                FROM requests r
                JOIN users u ON r.user_id = u.id
                LEFT JOIN departments d ON u.department_id = d.id
                LEFT JOIN personal_info pi ON u.id = pi.user_id
                LEFT JOIN professional_info pri ON u.id = pri.user_id
                WHERE r.id = ?
            `, [requestId]);

            return rows[0] || null;
        } catch (error) {
            console.error(`Erreur lors de la récupération de la demande ${requestId}:`, error);
            throw error;
        }
    }

    // Récupérer les demandes d'un utilisateur
    static async getUserRequests(userId) {
        try {
            const [rows] = await pool.execute(`
                SELECT r.*,
                       u.firstname,
                       u.lastname,
                       u.email,
                       u.role
                FROM requests r
                JOIN users u ON r.user_id = u.id
                WHERE r.user_id = ?
                ORDER BY r.created_at DESC
            `, [userId]);
            return rows;
        } catch (error) {
            console.error(`Erreur lors de la récupération des demandes de l'utilisateur ${userId}:`, error);
            throw error;
        }
    }

    // Récupérer les demandes pour un chef d'équipe
    static async getChefRequests(chefId) {
        try {
            const [rows] = await pool.execute(`
                SELECT r.*,
                       u.firstname,
                       u.lastname,
                       u.email,
                       u.role
                FROM requests r
                JOIN users u ON r.user_id = u.id
                WHERE u.chef_id = ?
                ORDER BY r.created_at DESC
            `, [chefId]);
            return rows;
        } catch (error) {
            console.error(`Erreur lors de la récupération des demandes pour le chef ${chefId}:`, error);
            throw error;
        }
    }

    // Créer une nouvelle demande avec ajout automatique dans le calendrier et notifications
    static async createRequest(userId, type, startDate, endDate, description, details = null, workingDays = 1) {
        try {
            // Générer un identifiant unique pour la demande
            const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

            // Formater les dates pour MySQL
            const formattedStartDate = new Date(startDate).toISOString().slice(0, 19).replace('T', ' ');
            const formattedEndDate = new Date(endDate).toISOString().slice(0, 19).replace('T', ' ');

            // Déterminer le statut initial en fonction du type de demande
            let initialStatus = 'en attente';

            // Convertir les détails en JSON si nécessaire
            const jsonDetails = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;

            // Insérer la demande dans la base de données avec la source 'web'
            await pool.execute(
                'INSERT INTO requests (id, user_id, type, status, start_date, end_date, description, details, working_days, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [requestId, userId, type, initialStatus, formattedStartDate, formattedEndDate, description, jsonDetails, workingDays, 'web']
            );

            // Récupérer les informations de l'utilisateur
            const [userRows] = await pool.execute(
                'SELECT firstname, lastname, email, role, chef_id FROM users WHERE id = ?',
                [userId]
            );

            if (userRows.length === 0) {
                throw new Error(`Utilisateur avec ID ${userId} non trouvé`);
            }

            const user = userRows[0];

            // Si c'est une demande de congé ou formation, ajouter également au calendrier
            if (type.toLowerCase().includes('congé') ||
                type.toLowerCase().includes('formation') ||
                type.toLowerCase().includes('maladie') ||
                type.toLowerCase().includes('maternité')) {

                // Déterminer le type d'événement
                let eventType = 'event';
                if (type.toLowerCase().includes('congé') || type.toLowerCase().includes('maladie') || type.toLowerCase().includes('maternité')) {
                    eventType = 'leave';
                } else if (type.toLowerCase().includes('formation')) {
                    eventType = 'training';
                }

                // Créer un titre pour l'événement
                const eventTitle = `${type} - ${user.firstname} ${user.lastname}`;

                // Insérer l'événement dans le calendrier
                await pool.execute(
                    `INSERT INTO calendar_events
                    (user_id, title, description, start_date, end_date, all_day, type)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        eventTitle,
                        description || `Demande de ${type}`,
                        formattedStartDate,
                        formattedEndDate,
                        true,
                        eventType
                    ]
                );
            }

            // Créer des notifications pour la nouvelle demande
            const Notification = require('./notification');

            // Si l'utilisateur a un chef, créer une notification pour le chef
            if (user.chef_id) {
                await Notification.createNotification(
                    user.chef_id,
                    'Nouvelle demande à examiner',
                    `${user.firstname} ${user.lastname} a soumis une nouvelle demande de ${type} qui nécessite votre examen.`,
                    { type: 'info', requestId: requestId }
                );
            }

            // Créer une notification pour tous les admins
            const [adminRows] = await pool.execute(
                'SELECT id FROM users WHERE role = "admin"'
            );

            for (const admin of adminRows) {
                await Notification.createNotification(
                    admin.id,
                    'Nouvelle demande soumise',
                    `${user.firstname} ${user.lastname} a soumis une nouvelle demande de ${type}.`,
                    { type: 'info', requestId: requestId }
                );
            }

            // Récupérer la demande complète avec les informations utilisateur
            return await Request.getRequestById(requestId);
        } catch (error) {
            console.error('Erreur lors de la création de la demande:', error);
            throw error;
        }
    }

    // Mettre à jour le statut d'une demande avec notification d'approbation ou de rejet
    static async updateRequestStatus(requestId, status, observation, updatingUserId) {
        try {
            // Déterminer le statut final en fonction du niveau et du statut demandé
            let finalStatus = status;
            const statusLower = status.toLowerCase();
            const isApproved = statusLower === 'approuvée' || statusLower === 'chef approuvé' || statusLower.includes('approuv');
            const isRejected = statusLower === 'rejetée' || statusLower === 'chef rejeté' || statusLower.includes('rejet');

            // Récupérer les informations de la demande et de l'utilisateur
            const [requestRows] = await pool.execute(
                `SELECT r.*, u.firstname, u.lastname, u.chef_id
                 FROM requests r
                 JOIN users u ON r.user_id = u.id
                 WHERE r.id = ?`,
                [requestId]
            );

            if (requestRows.length === 0) {
                throw new Error('Demande non trouvée');
            }

            const request = requestRows[0];
            const requestUserId = request.user_id;
            const userName = `${request.firstname} ${request.lastname}`;
            const requestType = request.type;

            // Déterminer le rôle de l'utilisateur qui fait la mise à jour
            const [updatingUserRows] = await pool.execute(
                'SELECT role FROM users WHERE id = ?',
                [updatingUserId]
            );
            const updatingUserRole = updatingUserRows.length > 0 ? updatingUserRows[0].role : 'admin';

            console.log('🔄 Updating request status:', {
                requestId,
                status: finalStatus,
                observation,
                updatingUserId,
                updatingUserRole
            });

            // Préparer les champs à mettre à jour
            let updateFields = ['status = ?'];
            let updateValues = [finalStatus];

            // Ajouter l'observation dans le bon champ selon le rôle
            if (observation) {
                if (updatingUserRole === 'chef') {
                    updateFields.push('chef_observation = ?');
                    updateValues.push(observation);
                    console.log('👨‍🍳 Saving chef observation:', observation);
                } else if (updatingUserRole === 'admin') {
                    updateFields.push('admin_response = ?');
                    updateValues.push(observation);
                    console.log('👨‍💼 Saving admin response:', observation);
                }
            }

            // Ajouter l'ID à la fin pour la clause WHERE
            updateValues.push(requestId);

            // Construire et exécuter la requête de mise à jour
            const updateQuery = `UPDATE requests SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            console.log('🔄 Executing update query:', updateQuery);
            console.log('🔄 With values:', updateValues);

            await pool.execute(updateQuery, updateValues);

            // Ajouter également un commentaire pour l'historique si une observation est fournie
            if (observation) {
                await pool.execute(
                    'INSERT INTO request_comments (request_id, user_id, comment) VALUES (?, ?, ?)',
                    [requestId, updatingUserId, observation]
                );
                console.log('📝 Comment added to request_comments table');
            }

            // Créer des notifications selon le statut et le rôle
            const Notification = require('./notification');

            console.log('📧 Notification creation debug:', {
                updatingUserRole,
                status,
                statusLower,
                isApproved,
                isRejected,
                requestUserId,
                requestType
            });

            if (updatingUserRole === 'chef') {
                console.log('👨‍🍳 Chef creating notifications...');
                // Notification pour l'utilisateur qui a fait la demande
                if (isApproved) {
                    console.log('✅ Creating chef approval notification for user:', requestUserId);
                    await Notification.createNotification(
                        requestUserId,
                        'Demande approuvée par le chef',
                        `Votre demande de ${requestType} a été approuvée par votre chef. Elle est maintenant en attente d'approbation finale par l'administrateur.`,
                        { type: 'success', requestId: requestId }
                    );
                    console.log('✅ Chef approval notification created successfully');
                } else if (isRejected) {
                    console.log('❌ Creating chef rejection notification for user:', requestUserId);
                    await Notification.createNotification(
                        requestUserId,
                        'Demande rejetée par le chef',
                        `Votre demande de ${requestType} a été rejetée par votre chef. ${observation ? 'Raison: ' + observation : ''}`,
                        { type: 'error', requestId: requestId }
                    );
                    console.log('❌ Chef rejection notification created successfully');
                }

                // Notification pour l'admin si approuvé par le chef
                if (isApproved) {
                    // Récupérer tous les admins
                    const [adminRows] = await pool.execute(
                        'SELECT id FROM users WHERE role = "admin"'
                    );

                    for (const admin of adminRows) {
                        await Notification.createNotification(
                            admin.id,
                            'Nouvelle demande à approuver',
                            `Une demande de ${requestType} de ${userName} a été approuvée par le chef et nécessite votre approbation finale.`,
                            { type: 'info', requestId: requestId }
                        );
                    }
                }
            } else if (updatingUserRole === 'admin') {
                console.log('👨‍💼 Admin creating notifications...');
                // Notification pour l'utilisateur qui a fait la demande
                if (isApproved) {
                    console.log('✅ Creating approval notification for user:', requestUserId);
                    await Notification.createNotification(
                        requestUserId,
                        'Demande approuvée par l\'administrateur',
                        `Votre demande de ${requestType} a été définitivement approuvée par l'administrateur.`,
                        { type: 'success', requestId: requestId }
                    );
                    console.log('✅ Approval notification created successfully');
                } else if (isRejected) {
                    console.log('❌ Creating rejection notification for user:', requestUserId);
                    await Notification.createNotification(
                        requestUserId,
                        'Demande rejetée par l\'administrateur',
                        `Votre demande de ${requestType} a été rejetée par l'administrateur. ${observation ? 'Raison: ' + observation : ''}`,
                        { type: 'error', requestId: requestId }
                    );
                    console.log('❌ Rejection notification created successfully');
                }
            }

            console.log('📧 Notifications created for request status update');

            return true;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du statut de la demande ${requestId}:`, error);
            throw error;
        }
    }

    // Ajouter un commentaire à une demande
    static async addRequestComment(requestId, userId, comment) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO request_comments (request_id, user_id, comment) VALUES (?, ?, ?)',
                [requestId, userId, comment]
            );
            return { id: result.insertId, requestId, userId, comment };
        } catch (error) {
            console.error(`Erreur lors de l'ajout d'un commentaire à la demande ${requestId}:`, error);
            throw error;
        }
    }

    // Récupérer les commentaires d'une demande
    static async getRequestComments(requestId) {
        try {
            const [rows] = await pool.execute(`
                SELECT rc.*, u.firstname, u.lastname, u.role
                FROM request_comments rc
                JOIN users u ON rc.user_id = u.id
                WHERE rc.request_id = ?
                ORDER BY rc.created_at ASC
            `, [requestId]);
            return rows;
        } catch (error) {
            console.error(`Erreur lors de la récupération des commentaires de la demande ${requestId}:`, error);
            throw error;
        }
    }
    /**
     * Met à jour la source d'une demande (web ou mobile)
     * @param {string} requestId - ID de la demande
     * @param {string} source - Source de la demande ('web' ou 'mobile')
     * @returns {Promise<boolean>} - True si la mise à jour a réussi
     */
    static async updateRequestSource(requestId, source) {
        try {
            if (!['web', 'mobile'].includes(source)) {
                throw new Error('Source invalide. Doit être "web" ou "mobile"');
            }

            // Vérifier si la demande existe
            const [requestRows] = await pool.execute(
                'SELECT id FROM requests WHERE id = ?',
                [requestId]
            );

            if (requestRows.length === 0) {
                throw new Error(`Demande avec ID ${requestId} non trouvée`);
            }

            // Mettre à jour la source de la demande
            await pool.execute(
                'UPDATE requests SET source = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [source, requestId]
            );

            return true;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de la source de la demande ${requestId}:`, error);
            throw error;
        }
    }
}

module.exports = Request;
