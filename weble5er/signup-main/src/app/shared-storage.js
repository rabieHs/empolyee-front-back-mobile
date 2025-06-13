/**
 * Utilitaire de stockage partagé entre les applications web et mobile
 * Permet de synchroniser les données entre les deux applications
 */

// Clé utilisée pour stocker les demandes dans le localStorage
const REQUESTS_STORAGE_KEY = 'shared_requests';

// Données par défaut à utiliser si aucune donnée n'existe
const DEFAULT_REQUESTS = [
  {
    id: 1,
    type: 'Congé annuel',
    status: 'En attente',
    date: '2025-05-20',
    description: 'Demande de congé pour 5 jours',
    details: {
      startDate: '2025-05-20',
      endDate: '2025-05-25',
      leaveType: 'paid',
      reason: 'Congé annuel'
    }
  },
  {
    id: 2,
    type: 'Formation',
    status: 'Approuvée',
    date: '2025-05-15',
    description: 'Formation Angular avancé',
    details: {
      title: 'Formation Angular',
      organization: 'Formation Pro',
      startDate: '2025-06-01',
      endDate: '2025-06-05',
      trainingType: 'technical',
      objectives: 'Maîtriser Angular'
    }
  },
  {
    id: 3,
    type: 'Document administratif',
    status: 'En attente',
    date: '2025-05-26',
    description: 'Demande d\'attestation de travail',
    details: {
      documentType: 'Attestation de travail',
      reason: 'Banque',
      urgency: 'normal',
      objective: 'Prêt immobilier',
      language: 'fr',
      copies: 2,
      comments: 'Besoin pour dossier bancaire'
    }
  }
];

/**
 * Initialiser le stockage avec des données par défaut si nécessaire
 */
function initStorage() {
  if (!localStorage.getItem(REQUESTS_STORAGE_KEY)) {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(DEFAULT_REQUESTS));
  }
}

/**
 * Récupérer toutes les demandes
 * @returns {Array} Liste des demandes
 */
function getRequests() {
  initStorage();
  return JSON.parse(localStorage.getItem(REQUESTS_STORAGE_KEY));
}

/**
 * Récupérer une demande par son ID
 * @param {number} id - ID de la demande
 * @returns {Object|null} La demande trouvée ou null
 */
function getRequestById(id) {
  const requests = getRequests();
  return requests.find(r => r.id === id) || null;
}

/**
 * Ajouter une nouvelle demande
 * @param {Object} request - La demande à ajouter
 * @returns {Object} La demande ajoutée avec son ID
 */
function addRequest(request) {
  const requests = getRequests();
  const newRequest = {
    id: requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1,
    type: request.type || '',
    status: 'En attente',
    date: new Date().toISOString().split('T')[0],
    description: request.description || '',
    details: request.details || {}
  };
  
  requests.unshift(newRequest);
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
  return newRequest;
}

/**
 * Mettre à jour une demande existante
 * @param {Object} updatedRequest - La demande mise à jour
 * @returns {boolean} True si la mise à jour a réussi, false sinon
 */
function updateRequest(updatedRequest) {
  const requests = getRequests();
  const index = requests.findIndex(r => r.id === updatedRequest.id);
  
  if (index !== -1) {
    requests[index] = updatedRequest;
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    return true;
  }
  
  return false;
}

// Exporter les fonctions pour les rendre accessibles
window.SharedStorage = {
  getRequests,
  getRequestById,
  addRequest,
  updateRequest
};
