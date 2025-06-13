export interface ProfessionalInfoCompat {
  department?: string;
  position?: string;
  // ajoute d'autres champs si besoin
}

export interface Request {
  user?: any;
  user_id?: string;
  professional_info?: { department?: string; position?: string };
  status?: string;
  type?: string;
  id?: string;
  date?: string;
  requestType?: string;
  description?: string;
  createdAt?: string;
  start_date?: string;
  end_date?: string;
  source?: string; // Indique si la demande provient de l'application web ou mobile

  // Database fields for user information (from JOIN with users table)
  firstname?: string;
  lastname?: string;
  email?: string;
  role?: string;
  department_name?: string;
  cin?: string;
  phone?: string;
  position?: string;
  working_days?: number;
  // Détails de la demande (pour les congés, formations, etc.)
  details?: {
    startDate?: string;
    endDate?: string;
    days?: number;
    leaveType?: string;
    reason?: string;
    trainingName?: string;
    trainingProvider?: string;
    trainingDuration?: string;
    trainingCost?: number;
    [key: string]: any; // Pour permettre d'autres propriétés dynamiques
  };

  // Champs pour le workflow d'approbation à deux niveaux (camelCase)
  chefObservation?: string;
  chefProcessedBy?: string;
  chefProcessedDate?: string;

  // Champs pour la réponse de l'admin (camelCase)
  adminResponse?: string;
  adminProcessedBy?: string;
  adminProcessedDate?: string;

  // Champs de la base de données (snake_case)
  chef_observation?: string;
  admin_response?: string;
  created_at?: string;
  updated_at?: string;

  // Pour la compatibilité avec le code existant
  chefResponse?: string;
  response?: string;
  processedBy?: string;
}
