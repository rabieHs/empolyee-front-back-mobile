// Script pour rÃ©initialiser l'application et crÃ©er des donnÃ©es de test
// Copiez ce code et exÃ©cutez-le dans la console du navigateur

// Supprimer toutes les donnÃ©es du localStorage
localStorage.clear();

// CrÃ©er un compte admin
const adminUser = {
  id: 'admin-1',
  email: 'admin@company.com',
  password: 'Admin123!',
  firstName: 'Admin',
  lastName: 'RH',
  role: 'admin',
  profileImage: '',
  personalInfo: {
    dateOfBirth: new Date('1990-01-01').toISOString(),
    placeOfBirth: 'Paris',
    nationality: 'FranÃ§aise',
    address: '1 Rue de l\'Administration',
    phoneNumber: '0600000000',
    maritalStatus: 'single',
    cin: 'AB123456',
    numberOfChildren: 0,
    city: 'Paris',
    country: 'France',
    emergencyContact: {
      name: 'Contact Urgence',
      relationship: 'Famille',
      phoneNumber: '0600000001'
    }
  },
  professionalInfo: {
    employeeId: 'ADM001',
    department: 'Ressources Humaines',
    position: 'Responsable RH',
    joinDate: new Date('2020-01-01').toISOString(),
    contractType: 'CDI',
    salary: 50000,
    grade: 'Cadre',
    rib: 'FR7630001007941234567890185',
    bankName: 'Banque Nationale',
    cnss: 'CNSS123456',
    mutuelle: 'MUT789012'
  }
};

// CrÃ©er un compte chef
const chefUser = {
  id: 'chef-1',
  email: 'chef@aya.com',
  password: 'Chef123!',
  firstName: 'Chef',
  lastName: 'Equipe',
  role: 'chef',
  profileImage: '',
  personalInfo: {
    dateOfBirth: new Date('1985-01-01').toISOString(),
    placeOfBirth: 'Casablanca',
    nationality: 'Marocaine',
    address: '123 Rue des Chefs',
    phoneNumber: '0600000000',
    maritalStatus: 'married',
    cin: 'CD789012',
    numberOfChildren: 2,
    city: 'Casablanca',
    country: 'Maroc',
    emergencyContact: {
      name: 'Contact Urgence',
      relationship: 'Famille',
      phoneNumber: '0600000001'
    }
  },
  professionalInfo: {
    employeeId: 'CHEF001',
    department: 'Management',
    position: 'Chef d\'Ã©quipe',
    joinDate: new Date('2020-01-01').toISOString(),
    contractType: 'CDI',
    salary: 35000,
    grade: 'Senior',
    rib: 'FR7630001007941234567890186',
    bankName: 'Banque Nationale',
    cnss: 'CNSS789012',
    mutuelle: 'MUT123456'
  }
};

// CrÃ©er un utilisateur normal
const normalUser = {
  id: 'user-1',
  email: 'user@aya.com',
  password: 'User123!',
  firstName: 'Utilisateur',
  lastName: 'Normal',
  role: 'user',
  profileImage: '',
  personalInfo: {
    dateOfBirth: new Date('1995-01-01').toISOString(),
    placeOfBirth: 'Lyon',
    nationality: 'FranÃ§aise',
    address: '456 Avenue des Utilisateurs',
    phoneNumber: '0600000000',
    maritalStatus: 'single',
    cin: 'EF345678',
    numberOfChildren: 0,
    city: 'Lyon',
    country: 'France',
    emergencyContact: {
      name: 'Contact Urgence',
      relationship: 'Famille',
      phoneNumber: '0600000001'
    }
  },
  professionalInfo: {
    employeeId: 'USR001',
    department: 'DÃ©veloppement',
    position: 'DÃ©veloppeur',
    joinDate: new Date('2021-01-01').toISOString(),
    contractType: 'CDI',
    salary: 30000,
    grade: 'Junior',
    rib: 'FR7630001007941234567890187',
    bankName: 'Banque Nationale',
    cnss: 'CNSS345678',
    mutuelle: 'MUT901234'
  }
};

// CrÃ©er des demandes de test
const testRequests = [
  {
    id: 'req-1',
    user_id: 'user-1',
    type: 'congÃ©',
    status: 'En attente',
    date: new Date('2023-06-01').toISOString(),
    description: 'Demande de congÃ© pour vacances d\'Ã©tÃ©',
    details: {
      startDate: new Date('2023-07-15').toISOString(),
      endDate: new Date('2023-07-30').toISOString(),
      leaveType: 'congÃ©s payÃ©s',
      reason: 'Vacances d\'Ã©tÃ©',
      dayType: 'full',
      includeWeekends: true
    },
    adminResponse: '',
    source: 'web'
  },
  {
    id: 'req-2',
    user_id: 'user-1',
    type: 'formation',
    status: 'ApprouvÃ©e',
    date: new Date('2023-05-15').toISOString(),
    description: 'Demande de formation en dÃ©veloppement web',
    details: {
      startDate: new Date('2023-06-10').toISOString(),
      endDate: new Date('2023-06-15').toISOString(),
      trainingType: 'technique',
      provider: 'FormationWeb',
      cost: 1200,
      reason: 'AmÃ©lioration des compÃ©tences'
    },
    adminResponse: 'Formation approuvÃ©e',
    source: 'web'
  },
  {
    id: 'req-3',
    user_id: 'user-1',
    type: 'certificat',
    status: 'RejetÃ©e',
    date: new Date('2023-04-20').toISOString(),
    description: 'Demande de certificat de travail',
    details: {
      reason: 'Demande de prÃªt bancaire',
      urgent: true
    },
    adminResponse: 'Veuillez fournir plus d\'informations',
    source: 'web'
  },
  {
    id: 'req-4',
    user_id: 'chef-1',
    type: 'congÃ©',
    status: 'En attente',
    date: new Date('2023-05-25').toISOString(),
    description: 'Demande de congÃ© pour raisons familiales',
    details: {
      startDate: new Date('2023-06-05').toISOString(),
      endDate: new Date('2023-06-10').toISOString(),
      leaveType: 'familial',
      reason: 'Ã‰vÃ©nement familial important',
      dayType: 'full',
      includeWeekends: true
    },
    adminResponse: '',
    source: 'web'
  },
  {
    id: 'req-5',
    user_id: 'chef-1',
    type: 'prÃªt',
    status: 'ApprouvÃ©e',
    date: new Date('2023-04-10').toISOString(),
    description: 'Demande de prÃªt pour achat immobilier',
    details: {
      loanType: 'immobilier',
      loanAmount: 50000,
      attachments: null
    },
    adminResponse: 'PrÃªt accordÃ©',
    source: 'web'
  }
];

// Ajouter 20 demandes supplÃ©mentaires pour avoir un total de 25 demandes
const requestTypes = ['congÃ©', 'formation', 'certificat', 'prÃªt', 'avance'];
const statuses = ['En attente', 'ApprouvÃ©e', 'RejetÃ©e', 'Chef approuvÃ©', 'Chef rejetÃ©'];
const users = [adminUser, chefUser, normalUser];

for (let i = 6; i <= 25; i++) {
  const randomType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const randomUser = users[Math.floor(Math.random() * users.length)];
  
  const request = {
    id: eq-,
    user_id: randomUser.id,
    type: randomType,
    status: randomStatus,
    date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    description: Demande de  - ,
    details: {},
    adminResponse: randomStatus === 'ApprouvÃ©e' ? 'Demande approuvÃ©e' : 
                  randomStatus === 'RejetÃ©e' ? 'Demande rejetÃ©e' : '',
    source: 'web'
  };
  
  // Ajouter des dÃ©tails spÃ©cifiques selon le type
  if (randomType === 'congÃ©') {
    const startDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 14) + 1);
    
    request.details = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      leaveType: Math.random() > 0.5 ? 'congÃ©s payÃ©s' : 'maladie',
      reason: Raison de congÃ© ,
      dayType: 'full',
      includeWeekends: true
    };
  } else if (randomType === 'formation') {
    const startDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 5) + 1);
    
    request.details = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      trainingType: Math.random() > 0.5 ? 'technique' : 'soft skills',
      provider: Formateur ,
      cost: Math.floor(Math.random() * 2000) + 500,
      reason: Raison de formation 
    };
  } else if (randomType === 'certificat') {
    request.details = {
      reason: Raison de certificat ,
      urgent: Math.random() > 0.5
    };
  } else if (randomType === 'prÃªt') {
    request.details = {
      loanType: Math.random() > 0.5 ? 'personnel' : 'immobilier',
      loanAmount: Math.floor(Math.random() * 50000) + 5000,
      attachments: null
    };
  } else if (randomType === 'avance') {
    request.details = {
      advanceAmount: Math.floor(Math.random() * 5000) + 1000,
      advanceReason: Raison d'avance ,
      attachments: null
    };
  }
  
  testRequests.push(request);
}

// Stocker les utilisateurs dans localStorage
localStorage.setItem('users', JSON.stringify([adminUser, chefUser, normalUser]));

// Stocker les demandes dans localStorage
localStorage.setItem('requests', JSON.stringify(testRequests));

// Connecter l'utilisateur en tant qu'admin
localStorage.setItem('currentUser', JSON.stringify(adminUser));

// Afficher un message de confirmation
console.log('Utilisateurs crÃ©Ã©s :', [adminUser, chefUser, normalUser].length);
console.log('Demandes crÃ©Ã©es :', testRequests.length);
console.log('Vous Ãªtes maintenant connectÃ© en tant qu\'admin.');
console.log('RafraÃ®chissez la page pour voir les changements.');
