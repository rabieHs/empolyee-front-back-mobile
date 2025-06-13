const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Récupérer toutes les notifications de l'utilisateur connecté
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const notifications = await Notification.getUserNotifications(userId);
        res.json(notifications);
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Récupérer les notifications non lues de l'utilisateur connecté
router.get('/unread', async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const notifications = await Notification.getUnreadNotifications(userId);
        res.json(notifications);
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications non lues:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Marquer une notification comme lue
router.put('/:id/read', async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);

        // Vérifier que la notification appartient bien à l'utilisateur connecté
        const userId = req.user.id || req.user.userId;
        const notifications = await Notification.getUserNotifications(userId);
        const notification = notifications.find(n => n.id === notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée ou non autorisée' });
        }

        const success = await Notification.markAsRead(notificationId);

        if (success) {
            res.json({ message: 'Notification marquée comme lue' });
        } else {
            res.status(500).json({ message: 'Erreur lors du marquage de la notification' });
        }
    } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const success = await Notification.markAllAsRead(userId);

        if (success) {
            res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
        } else {
            res.json({ message: 'Aucune notification non lue à mettre à jour' });
        }
    } catch (error) {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Supprimer une notification
router.delete('/:id', async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);

        // Vérifier que la notification appartient bien à l'utilisateur connecté
        const userId = req.user.id || req.user.userId;
        const notifications = await Notification.getUserNotifications(userId);
        const notification = notifications.find(n => n.id === notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée ou non autorisée' });
        }

        const success = await Notification.deleteNotification(notificationId);

        if (success) {
            res.json({ message: 'Notification supprimée avec succès' });
        } else {
            res.status(500).json({ message: 'Erreur lors de la suppression de la notification' });
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la notification:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Supprimer toutes les notifications
router.delete('/', async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const success = await Notification.deleteAllNotifications(userId);

        if (success) {
            res.json({ message: 'Toutes les notifications ont été supprimées' });
        } else {
            res.json({ message: 'Aucune notification à supprimer' });
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de toutes les notifications:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
