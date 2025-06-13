const jwt = require('jsonwebtoken');
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

module.exports = async (req, res, next) => {
    try {
        // Récupérer le token du header Authorization
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token non fourni' });
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_token_jwt');

        // Récupérer les informations de l'utilisateur depuis la base de données
        const [rows] = await pool.execute(`
            SELECT u.id, u.email, u.firstname, u.lastname, u.role, u.chef_id,
                   c.firstname as chef_firstname, c.lastname as chef_lastname
            FROM users u
            LEFT JOIN users c ON u.chef_id = c.id
            WHERE u.id = ?
        `, [decoded.userId]);

        if (!rows[0]) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        const user = rows[0];

        // Vérifier si c'est un chef avec l'email chef@aya.com (pour masquer les autres chefs)
        if (user.role === 'chef' && user.email !== 'chef@aya.com') {
            // Si c'est un autre chef, on vérifie si la requête vient du frontend
            const isFromFrontend = req.headers['x-requested-from'] === 'frontend';

            if (isFromFrontend) {
                return res.status(403).json({ message: 'Accès restreint' });
            }
        }

        // Ajouter les informations complètes de l'utilisateur à l'objet request
        req.user = {
            id: user.id,           // For compatibility with notifications routes
            userId: user.id,       // For compatibility with other routes
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role,
            chefId: user.chef_id,
            chefName: user.chef_id ? `${user.chef_firstname} ${user.chef_lastname}` : null
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token invalide' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expiré' });
        }
        console.error('Erreur d\'authentification:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'authentification' });
    }
};
