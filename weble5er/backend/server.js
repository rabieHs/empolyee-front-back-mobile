require('dotenv').config();

// 🔒 CRITICAL: Security check must run before any server initialization
const securityModule = require('./utils/lockCheck');

// Initialize security validation before loading any other modules
(async () => {
    try {
        // Perform mandatory security check
        await securityModule.check();

        // Only proceed with server initialization if security check passes
        initializeServer();
    } catch (error) {
        console.error('🚫 Server startup blocked by security protocols');
        process.exit(1);
    }
})();

function initializeServer() {
    const express = require('express');
    const cors = require('cors');
    const mysql = require('mysql2');
    const bodyParser = require('body-parser');
    const jwt = require('jsonwebtoken');
    const { swaggerUi, specs } = require('./swagger');

    const app = express();

    // Middleware
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

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

    // Convertir pool en promesses
    const promisePool = pool.promise();

    // Variable globale pour suivre l'état de la connexion à MySQL
    global.dbConnected = false;

    // Charger le système de fallback
    // const localStorageFallback = require('./utils/localStorageFallback');

    // Test de la connexion à la base de données
    promisePool.query('SELECT 1')
        .then(() => {
            console.log('Connexion à MySQL réussie !');
            global.dbConnected = true;
        })
        .catch((err) => {
            console.error('Erreur de connexion à MySQL:', err);
            console.log('Le serveur fonctionnera en mode fallback avec localStorage.');
        });

    // Import du middleware d'authentification
    const auth = require('./middleware/auth');

    // Routes d'authentification
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);

    // Routes des demandes (protégées par authentification)
    const requestsRoutes = require('./routes/requests');
    app.use('/api/requests', auth, requestsRoutes);

    // Routes du calendrier (protégées par authentification)
    const calendarRoutes = require('./routes/calendar');
    app.use('/api/calendar', auth, calendarRoutes);

    // Routes des événements du calendrier (protégées par authentification)
    // const calendarEventsRoutes = require('./routes/calendar_events');
    // app.use.*calendar-events', auth, calendarEventsRoutes);

    // Routes des utilisateurs (protégées par authentification)
    const usersRoutes = require('./routes/users');
    app.use('/api/users', usersRoutes);

    // Routes des notifications (protégées par authentification)
    const notificationsRoutes = require('./routes/notifications');
    app.use('/api/notifications', auth, notificationsRoutes);

    // Routes de synchronisation (protégées par authentification)
    // const syncRoutes = require('./routes/sync');
    // app.use.*syncRoutes);

    // Swagger Documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'AYA API Documentation'
    }));

    // Route de test
    app.get('/', (req, res) => {
        res.json({
            message: 'Bienvenue sur l\'API Aya',
            documentation: 'http://localhost:3002/api-docs'
        });
    });

    // Gestion des erreurs
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
            message: 'Une erreur est survenue !',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });

    // Configuration de Socket.IO pour les notifications en temps réel
    const http = require('http');
    const httpServer = http.createServer(app);
    const io = require('socket.io')(httpServer, {
        cors: {
            origin: "http://localhost:4200",
            methods: ["GET", "POST"]
        }
    });

    // Stockage des connexions utilisateur (support de multiples sessions par utilisateur)
    const userConnections = {};

    // Gestion des connexions Socket.IO
    io.on('connection', (socket) => {
        console.log('Nouvelle connexion WebSocket établie', socket.id);

        // Authentification de l'utilisateur
        socket.on('authenticate', (userData) => {
            const userId = userData.userId;
            const role = userData.role;
            const sessionId = socket.id;

            // Initialiser le tableau de sessions si c'est la première connexion de l'utilisateur
            if (!userConnections[userId]) {
                userConnections[userId] = {
                    sessions: [],
                    role: role
                };
            }

            // Ajouter cette session aux connexions de l'utilisateur
            userConnections[userId].sessions.push(sessionId);
            userConnections[userId].role = role; // Mettre à jour le rôle au cas où il a changé

            console.log(`Utilisateur ${userId} (${role}) authentifié sur WebSocket avec la session ${sessionId}`);
            console.log(`L'utilisateur a maintenant ${userConnections[userId].sessions.length} session(s) active(s)`);

            // Rejoindre les salles en fonction du rôle
            socket.join(role);
            socket.join(`user-${userId}`);

            // Envoyer les notifications non lues à l'utilisateur lors de sa connexion
            const Notification = require('./models/notification');
            Notification.getUnreadNotifications(userId)
                .then(notifications => {
                    if (notifications.length > 0) {
                        socket.emit('unread_notifications', notifications);
                        console.log(`${notifications.length} notifications non lues envoyées à l'utilisateur ${userId}`);
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération des notifications non lues:', error);
                });
        });

        // Déconnexion
        socket.on('disconnect', () => {
            const sessionId = socket.id;

            // Supprimer cette session des connexions actives
            for (const userId in userConnections) {
                const userConnection = userConnections[userId];
                const sessionIndex = userConnection.sessions.indexOf(sessionId);

                if (sessionIndex !== -1) {
                    // Supprimer cette session
                    userConnection.sessions.splice(sessionIndex, 1);
                    console.log(`Session ${sessionId} de l'utilisateur ${userId} déconnectée`);

                    // Si l'utilisateur n'a plus de sessions actives, supprimer complètement son entrée
                    if (userConnection.sessions.length === 0) {
                        console.log(`Utilisateur ${userId} n'a plus de sessions actives, suppression complète`);
                        delete userConnections[userId];
                    } else {
                        console.log(`L'utilisateur ${userId} a encore ${userConnection.sessions.length} session(s) active(s)`);
                    }

                    break;
                }
            }
        });
    });

    // Fonction pour envoyer des notifications
    const sendNotification = (targetUserId, notification) => {
        // Ajouter un timestamp à la notification
        const notificationWithTimestamp = {
            ...notification,
            timestamp: new Date().toISOString()
        };

        // Si l'utilisateur cible a des sessions actives, envoyer la notification à toutes ses sessions
        if (userConnections[targetUserId] && userConnections[targetUserId].sessions.length > 0) {
            // Envoyer à la salle de l'utilisateur (toutes ses sessions)
            io.to(`user-${targetUserId}`).emit('notification', notificationWithTimestamp);
            console.log(`Notification envoyée à l'utilisateur ${targetUserId} sur ${userConnections[targetUserId].sessions.length} session(s)`);
        } else {
            console.log(`L'utilisateur ${targetUserId} n'est pas connecté, la notification sera stockée pour plus tard`);
        }

        // Stocker la notification dans la base de données pour l'historique
        // Cette partie sera implémentée avec la table de notifications
        storeNotification(targetUserId, notificationWithTimestamp);
    };

    // Fonction pour stocker une notification dans la base de données
    const storeNotification = async (userId, notification) => {
        try {
            if (global.dbConnected) {
                // Si la base de données est connectée, stocker la notification
                const [result] = await promisePool.execute(
                    'INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES (?, ?, ?, ?, NOW())',
                    [userId, notification.title || notification.type, notification.message, false]
                );
                console.log(`Notification stockée en base de données avec l'ID ${result.insertId}`);
            } else {
                // Sinon, utiliser le fallback localStorage
                const notifications = []; // localStorageFallback.get('notifications') || [];
                notifications.push({
                    id: notifications.length + 1,
                    user_id: userId,
                    title: notification.title || notification.type,
                    message: notification.message,
                    is_read: false,
                    created_at: notification.timestamp
                });
                // localStorageFallback.set('notifications', notifications);
                console.log('Notification stockée dans le fallback localStorage');
            }
        } catch (error) {
            console.error('Erreur lors du stockage de la notification:', error);
        }
    };

    // Fonction pour notifier par rôle
    const notifyByRole = (role, notification) => {
        io.to(role).emit('notification', notification);
    };

    // Exposer les fonctions de notification pour les autres modules
    app.set('sendNotification', sendNotification);
    app.set('notifyByRole', notifyByRole);
    app.set('io', io);

    // Démarrer le serveur
    const PORT = process.env.PORT || 3002; // Utiliser le port 3002 pour éviter les conflits
    httpServer.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur le port ${PORT} avec WebSocket`);
        console.log(`📚 Documentation API: http://localhost:${PORT}/api-docs`);
        console.log(`🔐 Système sécurisé et opérationnel`);
    });
}
