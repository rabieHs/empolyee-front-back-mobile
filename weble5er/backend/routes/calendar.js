const express = require('express');
const router = express.Router();
const Calendar = require('../models/calendar');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/calendar:
 *   get:
 *     summary: Get calendar events for the authenticated user
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of calendar events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CalendarEvent'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Récupérer les événements du calendrier pour l'utilisateur connecté (route par défaut)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const events = await Calendar.getUserEvents(userId);
        res.json(events);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements du calendrier:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des événements du calendrier' });
    }
});

// Récupérer tous les événements du calendrier (admin seulement)
router.get('/all', async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const events = await Calendar.getAllEvents();
        res.json(events);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements du calendrier:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des événements du calendrier' });
    }
});

// Récupérer les événements du calendrier pour l'utilisateur connecté
router.get('/user', async (req, res) => {
    try {
        const events = await Calendar.getUserEvents(req.user.id || req.user.userId);
        res.json(events);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements du calendrier:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des événements du calendrier' });
    }
});

// Récupérer les événements du calendrier pour l'équipe du chef connecté
router.get('/team', async (req, res) => {
    try {
        // Vérifier si l'utilisateur est chef
        if (req.user.role !== 'chef') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const events = await Calendar.getTeamEvents(req.user.id || req.user.userId);
        res.json(events);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements du calendrier de l\'équipe:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des événements du calendrier de l\'équipe' });
    }
});

// Récupérer les événements du calendrier pour une période spécifique
router.get('/period', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Les dates de début et de fin sont requises' });
        }

        let events;

        // Filtrer les événements en fonction du rôle de l'utilisateur
        if (req.user.role === 'admin') {
            events = await Calendar.getAllEvents();
        } else if (req.user.role === 'chef') {
            events = await Calendar.getTeamEvents(req.user.id || req.user.userId);
        } else {
            events = await Calendar.getUserEvents(req.user.id || req.user.userId);
        }

        // Filtrer les événements pour la période spécifiée
        const filteredEvents = events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            const periodStart = new Date(startDate);
            const periodEnd = new Date(endDate);

            return (eventStart >= periodStart && eventStart <= periodEnd) ||
                   (eventEnd >= periodStart && eventEnd <= periodEnd) ||
                   (eventStart <= periodStart && eventEnd >= periodEnd);
        });

        res.json(filteredEvents);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements du calendrier pour la période:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des événements du calendrier pour la période' });
    }
});

// Synchroniser le calendrier avec les demandes récentes
router.post('/sync', async (req, res) => {
    try {
        let events;

        // Récupérer les événements en fonction du rôle de l'utilisateur
        if (req.user.role === 'admin') {
            events = await Calendar.getAllEvents();
        } else if (req.user.role === 'chef') {
            events = await Calendar.getTeamEvents(req.user.id || req.user.userId);
        } else {
            events = await Calendar.getUserEvents(req.user.id || req.user.userId);
        }

        // Notifier les clients connectés via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('calendar-sync', { events, userId: req.user.id || req.user.userId, role: req.user.role });
        }

        res.json({ success: true, message: 'Calendrier synchronisé avec succès', events });
    } catch (error) {
        console.error('Erreur lors de la synchronisation du calendrier:', error);
        res.status(500).json({ message: 'Erreur lors de la synchronisation du calendrier' });
    }
});

module.exports = router;
