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
        console.log('Modèle Notification: Connexion à MySQL réussie');
    })
    .catch((err) => {
        console.error('Modèle Notification: Erreur de connexion à MySQL:', err.message);
    });

class Notification {
    // Récupérer toutes les notifications d'un utilisateur
    static async getUserNotifications(userId) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
            `, [userId]);

            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications:', error);
            throw error;
        }
    }

    // Récupérer les notifications non lues d'un utilisateur
    static async getUnreadNotifications(userId) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM notifications
                WHERE user_id = ? AND is_read = FALSE
                ORDER BY created_at DESC
            `, [userId]);

            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications non lues:', error);
            throw error;
        }
    }

    // Marquer une notification comme lue
    static async markAsRead(notificationId) {
        try {
            await pool.execute(`
                UPDATE notifications
                SET is_read = TRUE
                WHERE id = ?
            `, [notificationId]);

            return true;
        } catch (error) {
            console.error('Erreur lors du marquage de la notification comme lue:', error);
            throw error;
        }
    }

    // Marquer toutes les notifications d'un utilisateur comme lues
    static async markAllAsRead(userId) {
        try {
            await pool.execute(`
                UPDATE notifications
                SET is_read = TRUE
                WHERE user_id = ? AND is_read = FALSE
            `, [userId]);

            return true;
        } catch (error) {
            console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
            throw error;
        }
    }

    // Créer une nouvelle notification
    static async createNotification(userId, title, message, data = {}) {
        try {
            const type = data.type || 'general';
            const referenceId = data.requestId || data.reference_id || null;
            const platform = data.platform || 'both';

            const [result] = await pool.execute(`
                INSERT INTO notifications (user_id, title, message, type, reference_id, platform, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())
            `, [userId, title, message, type, referenceId, platform]);

            return {
                id: result.insertId,
                user_id: userId,
                title,
                message,
                type,
                reference_id: referenceId,
                platform,
                is_read: false,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erreur lors de la création de la notification:', error);
            throw error;
        }
    }

    // Supprimer une notification
    static async deleteNotification(notificationId) {
        try {
            const [result] = await pool.execute(`
                DELETE FROM notifications
                WHERE id = ?
            `, [notificationId]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de la notification:', error);
            throw error;
        }
    }

    // Supprimer toutes les notifications d'un utilisateur
    static async deleteAllNotifications(userId) {
        try {
            const [result] = await pool.execute(`
                DELETE FROM notifications
                WHERE user_id = ?
            `, [userId]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de toutes les notifications:', error);
            throw error;
        }
    }
}

module.exports = Notification;
