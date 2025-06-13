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

class Calendar {
    // Récupérer tous les événements du calendrier
    static async getAllEvents() {
        try {
            const [rows] = await pool.execute(`
                SELECT r.id, r.user_id, r.type, r.status, r.start_date, r.end_date, r.description,
                       u.firstname, u.lastname, u.email, u.role
                FROM requests r
                JOIN users u ON r.user_id = u.id
                WHERE (r.status LIKE '%approved%' OR r.status = 'en attente')
                ORDER BY r.start_date ASC
            `);

            // Formater les événements pour le calendrier
            return rows.map(row => ({
                id: row.id,
                title: `${row.type} - ${row.firstname} ${row.lastname}`,
                start: row.start_date,
                end: row.end_date,
                description: row.description,
                status: row.status,
                userId: row.user_id,
                userEmail: row.email,
                userRole: row.role,
                color: this.getEventColor(row.type, row.status)
            }));
        } catch (error) {
            console.error('Erreur lors de la récupération des événements du calendrier:', error);
            throw error;
        }
    }

    // Récupérer les événements du calendrier pour un utilisateur spécifique
    static async getUserEvents(userId) {
        try {
            const [rows] = await pool.execute(`
                SELECT r.id, r.user_id, r.type, r.status, r.start_date, r.end_date, r.description,
                       u.firstname, u.lastname, u.email, u.role
                FROM requests r
                JOIN users u ON r.user_id = u.id
                WHERE r.user_id = ? AND (r.status LIKE '%approved%' OR r.status = 'en attente')
                ORDER BY r.start_date ASC
            `, [userId]);

            // Formater les événements pour le calendrier
            return rows.map(row => ({
                id: row.id,
                title: `${row.type}`,
                start: row.start_date,
                end: row.end_date,
                description: row.description,
                status: row.status,
                userId: row.user_id,
                color: this.getEventColor(row.type, row.status)
            }));
        } catch (error) {
            console.error(`Erreur lors de la récupération des événements du calendrier pour l'utilisateur ${userId}:`, error);
            throw error;
        }
    }

    // Récupérer les événements du calendrier pour les membres d'une équipe
    static async getTeamEvents(chefId) {
        try {
            const [rows] = await pool.execute(`
                SELECT r.id, r.user_id, r.type, r.status, r.start_date, r.end_date, r.description,
                       u.firstname, u.lastname, u.email, u.role
                FROM requests r
                JOIN users u ON r.user_id = u.id
                WHERE u.chef_id = ? AND (r.status LIKE '%approved%' OR r.status = 'en attente')
                ORDER BY r.start_date ASC
            `, [chefId]);

            // Formater les événements pour le calendrier
            return rows.map(row => ({
                id: row.id,
                title: `${row.type} - ${row.firstname} ${row.lastname}`,
                start: row.start_date,
                end: row.end_date,
                description: row.description,
                status: row.status,
                userId: row.user_id,
                userEmail: row.email,
                color: this.getEventColor(row.type, row.status)
            }));
        } catch (error) {
            console.error(`Erreur lors de la récupération des événements du calendrier pour l'équipe du chef ${chefId}:`, error);
            throw error;
        }
    }

    // Déterminer la couleur de l'événement en fonction du type et du statut
    static getEventColor(type, status) {
        const typeLower = type.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Couleurs par défaut pour les types de demandes
        if (typeLower.includes('conge')) {
            if (status === 'en attente') return '#FFC107'; // Jaune pour congé en attente
            if (status.includes('approved')) return '#4CAF50'; // Vert pour congé approuvé
            if (status.includes('rejected')) return '#F44336'; // Rouge pour congé rejeté
            return '#2196F3'; // Bleu par défaut pour congé
        } else if (typeLower.includes('formation')) {
            if (status === 'en attente') return '#FF9800'; // Orange pour formation en attente
            if (status.includes('approved')) return '#8BC34A'; // Vert clair pour formation approuvée
            if (status.includes('rejected')) return '#E91E63'; // Rose pour formation rejetée
            return '#9C27B0'; // Violet par défaut pour formation
        }

        // Couleur par défaut pour les autres types
        return '#757575'; // Gris
    }
}

module.exports = Calendar;
