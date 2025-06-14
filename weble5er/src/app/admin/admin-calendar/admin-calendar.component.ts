import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { RequestsService } from '../../home/requests/requests.service';
import { Request } from '../../models/request.model';

@Component({
  selector: 'app-admin-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-calendar.component.html',
  styleUrls: ['./admin-calendar.component.scss']
})
export class AdminCalendarComponent implements OnInit, OnDestroy {
  // Tableau des jours de la semaine
  weekDays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Tableau des mois
  months: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  // Date actuelle
  currentMonth: Date = new Date();

  // Jours du calendrier
  calendarDays: number[] = [];

  // Demandes par jour
  requestsByDay: Map<number, Request[]> = new Map<number, Request[]>();

  // Demandes filtrées pour le mois en cours
  filteredRequests: Request[] = [];

  // Abonnements
  private subscriptions: Subscription = new Subscription();

  // Demande sélectionnée pour les détails
  selectedRequest: Request | null = null;
  showRequestDetails: boolean = false;

  // Mappage des IDs d'employés vers leurs noms complets
  private employeeIdToNameMap: { [key: string]: { firstname: string, lastname: string } } = {


    // Utilisateurs avec d'autres formats d'ID
    'Employé': { firstname: 'eya', lastname: 'ghraba' },
    'employee': { firstname: 'eya', lastname: 'ghraba' },
    'admin': { firstname: 'Admin', lastname: 'Système' },
    'chef': { firstname: 'Chef', lastname: 'Service' },
    'unknown': { firstname: 'Employé', lastname: 'Inconnu' },

    // Correspondances pour les IDs qui pourraient être dans les données
    'eya': { firstname: 'eya', lastname: 'ghraba' },
    'eyaghraba': { firstname: 'eya', lastname: 'ghraba' },
    'eya.ghraba': { firstname: 'eya', lastname: 'ghraba' },
    'e.ghraba': { firstname: 'eya', lastname: 'ghraba' }
  };

  constructor(
    private authService: AuthService,
    private requestsService: RequestsService
  ) { }

  ngOnInit(): void {
    // Attendre que les données utilisateur soient chargées
    this.subscriptions.add(
      this.authService.currentUser.subscribe(user => {
        if (user) {
          console.log('User loaded in AdminCalendar:', user);
          console.log('User role:', user.role);
          console.log('Is admin:', this.authService.isAdmin());

          // Vérifier que l'utilisateur est admin
          if (!this.authService.isAdmin()) {
            console.error('Ce composant est réservé aux administrateurs');
            console.error('Current user role:', user.role);
            // Rediriger vers la page appropriée
            if (user.role === 'chef') {
              window.location.href = '/chef';
            } else {
              window.location.href = '/home';
            }
            return;
          }

          this.initializeCalendar();
          this.loadRequests();
        } else {
          // Si pas d'utilisateur, rediriger vers login
          console.log('No user found, redirecting to login');
          window.location.href = '/login';
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Initialise le calendrier pour le mois en cours
   */
  initializeCalendar(): void {
    this.calendarDays = [];
    this.requestsByDay.clear();

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // Premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
    const firstDay = new Date(year, month, 1).getDay();

    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Ajouter les jours vides pour aligner le premier jour
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push(0); // 0 représente un jour vide
    }

    // Ajouter les jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      this.calendarDays.push(i);
    }
  }

  /**
   * Charge uniquement les demandes de congé et de formation qui sont approuvées ou en attente
   */
  loadRequests(): void {
    // Utiliser le service pour récupérer toutes les demandes
    this.subscriptions.add(
      this.requestsService.getRequests().subscribe(requests => {
        console.log('Nombre total de demandes chargées:', requests.length);

        // Filtrer pour ne garder que les demandes de congé et de formation
        this.filteredRequests = requests.filter(request => {
          const type = request.type?.toLowerCase() || '';
          return type.includes('congé') || type === 'formation';
        });

        console.log('Nombre de demandes après filtrage (congé et formation):', this.filteredRequests.length);

        // Filtrer pour ne garder que les demandes approuvées ou en attente
        this.filteredRequests = this.filteredRequests.filter(request => {
          const status = request.status?.toLowerCase() || '';
          return !status.includes('rejet') && !status.includes('rejetée');
        });

        console.log('Nombre de demandes après filtrage (approuvées ou en attente):', this.filteredRequests.length);

        // S'assurer que chaque demande a un utilisateur et un type valide
        this.filteredRequests = this.filteredRequests.map(req => {
          // S'assurer que chaque demande a un utilisateur
          if (!req.user) {
            req.user = {
              id: 'unknown',
              firstname: 'Employé',
              lastname: '(Sans nom)'
            };
          }

          // S'assurer que le type de demande est valide
          if (!req.type || req.type.trim() === '') {
            req.type = 'Demande';
          }

          return req;
        });

        // Afficher les employés dans les demandes
        const employees = new Set<string>();
        const requestTypes = new Set<string>();

        this.filteredRequests.forEach(req => {
          employees.add(`${req.user?.firstname || 'Employé'} ${req.user?.lastname || '(Sans nom)'}`);
          requestTypes.add(req.type || 'Demande');
        });

        console.log('Employés dans les demandes:', Array.from(employees));
        console.log('Types de demandes:', Array.from(requestTypes));

        // Filtrer pour le mois actuel
        this.filterRequestsForCurrentMonth();
      })
    );
  }

  /**
   * Filtre les demandes pour le mois actuel et les groupe par jour
   * Affiche les demandes sur toute leur durée (du jour de début au jour de fin)
   */
  filterRequestsForCurrentMonth(): void {
    const currentYear = this.currentMonth.getFullYear();
    const currentMonthIndex = this.currentMonth.getMonth();

    // Réinitialiser la map des demandes par jour
    this.requestsByDay.clear();

    // Parcourir toutes les demandes filtrées
    this.filteredRequests.forEach(request => {
      // Vérifier et corriger les informations de l'utilisateur si nécessaire
      this.ensureUserInfo(request);

      // Vérifier si nous avons des dates de début et de fin dans les détails
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (request.details?.startDate) {
        startDate = new Date(request.details.startDate);
      } else if (request.date) {
        // Utiliser la date principale si pas de date de début spécifique
        startDate = new Date(request.date);
      } else {
        // Pas de date disponible, ignorer cette demande
        return;
      }

      if (request.details?.endDate) {
        endDate = new Date(request.details.endDate);
      } else {
        // Si pas de date de fin, utiliser la date de début comme date de fin
        endDate = new Date(startDate);
      }

      // Calculer la plage de jours pour cette demande
      const currentDate = new Date(startDate);

      // Boucler sur tous les jours entre la date de début et la date de fin (incluses)
      while (currentDate <= endDate) {
        const currentDateYear = currentDate.getFullYear();
        const currentDateMonth = currentDate.getMonth();
        const currentDateDay = currentDate.getDate();

        // Vérifier si le jour est dans le mois actuel
        if (currentDateYear === currentYear && currentDateMonth === currentMonthIndex) {
          // Ajouter la demande à ce jour
          if (!this.requestsByDay.has(currentDateDay)) {
            this.requestsByDay.set(currentDateDay, []);
          }

          // Créer une copie de la demande pour ce jour spécifique
          const requestCopy = { ...request } as any;

          // Ajouter des informations sur la durée pour l'affichage
          requestCopy.isFirstDay = currentDate.getTime() === startDate.getTime();
          requestCopy.isLastDay = currentDate.getTime() === endDate.getTime();

          this.requestsByDay.get(currentDateDay)?.push(requestCopy);
          console.log(`Demande ajoutée pour le jour ${currentDateDay}: ${request.type} - ${request.user?.firstname} ${request.user?.lastname}`);
        }

        // Passer au jour suivant
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  }

  /**
   * S'assure que les informations de l'utilisateur sont présentes et correctes
   * @param request La demande à vérifier
   */
  private ensureUserInfo(request: Request): void {
    // Si l'utilisateur n'existe pas, créer un objet utilisateur par défaut
    if (!request.user) {
      request.user = {
        id: 'unknown',
        firstname: 'Employé',
        lastname: '(Sans nom)'
      };
    }

    // Convertir l'ID de l'utilisateur en nom réel en utilisant le mappage
    if (request.user_id && this.employeeIdToNameMap[request.user_id]) {
      const userInfo = this.employeeIdToNameMap[request.user_id];
      request.user.firstname = userInfo.firstname;
      request.user.lastname = userInfo.lastname;
      return;
    }

    // Si le nom complet est stocké dans le champ name mais pas dans firstname/lastname
    if (request.user.name && (!request.user.firstname || !request.user.lastname)) {
      const nameParts = request.user.name.split(' ');
      if (nameParts.length >= 2) {
        request.user.firstname = nameParts[0];
        request.user.lastname = nameParts.slice(1).join(' ');
      } else {
        request.user.firstname = request.user.name;
        request.user.lastname = '';
      }
    }

    // Essayer d'identifier l'utilisateur par son ID
    if (request.user_id) {
      // Extraire un numéro d'utilisateur potentiel
      const userIdMatch = request.user_id.match(/user(\d+)/);
      if (userIdMatch && userIdMatch[1]) {
        const userNumber = parseInt(userIdMatch[1]);
        const mappedUser = this.employeeIdToNameMap[`user${userNumber}`];
        if (mappedUser) {
          request.user.firstname = mappedUser.firstname;
          request.user.lastname = mappedUser.lastname;
          return;
        }
      }

      // Si l'ID ne correspond pas à un format connu, l'utiliser comme prénom
      if (!request.user.firstname || request.user.firstname === 'Employé') {
        // Vérifier si l'ID ressemble à un nom d'utilisateur
        if (request.user_id.toLowerCase().includes('eya')) {
          request.user.firstname = 'eya';
          request.user.lastname = 'ghraba';
        } else {
          request.user.firstname = request.user_id;
        }
      }
    }

    // Vérifier si le nom est vide ou contient 'Employé'
    if (!request.user.firstname || request.user.firstname.trim() === '' ||
        request.user.firstname.toLowerCase() === 'employé') {
      // Essayer d'extraire le nom de la description si possible
      if (request.description && request.description.includes('eya')) {
        request.user.firstname = 'eya';
        request.user.lastname = 'ghraba';
      }
    }
  }

  /**
   * Récupère les demandes pour un jour spécifique
   * @param day Le jour du mois
   * @returns La liste des demandes pour ce jour
   */
  getRequestsForDay(day: number): Request[] {
    return this.requestsByDay.get(day) || [];
  }

  /**
   * Change le mois affiché
   * @param increment Valeur d'incrémentation (-1 pour le mois précédent, 1 pour le mois suivant)
   */
  changeMonth(increment: number): void {
    const newMonth = new Date(this.currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    this.currentMonth = newMonth;

    this.initializeCalendar();
    this.filterRequestsForCurrentMonth();
  }

  /**
   * Retourne le nom du mois courant avec l'année
   * @returns Le nom du mois et l'année (ex: "Mai 2025")
   */
  getCurrentMonthName(): string {
    const monthIndex = this.currentMonth.getMonth();
    const year = this.currentMonth.getFullYear();
    return `${this.months[monthIndex]} ${year}`;
  }

  /**
   * Get count of requests by type
   * @param type Request type to count
   * @returns Number of requests of that type
   */
  getRequestCountByType(type: string): number {
    return this.filteredRequests.filter(request => {
      const requestType = (request.type || '').toLowerCase();
      const searchType = type.toLowerCase();
      return requestType.includes(searchType);
    }).length;
  }

  /**
   * Get count of requests by status
   * @param status Request status to count
   * @returns Number of requests with that status
   */
  getRequestCountByStatus(status: string): number {
    return this.filteredRequests.filter(request => {
      const requestStatus = (request.status || '').toLowerCase();
      const searchStatus = status.toLowerCase();
      return requestStatus.includes(searchStatus);
    }).length;
  }

  /**
   * Retourne la classe CSS en fonction du statut de la demande
   * @param status Le statut de la demande
   * @returns La classe CSS correspondante
   */
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approuvée':
        return 'approved';
      case 'chef approuvé':
        return 'chef-approved';
      case 'rejetée':
        return 'rejected';
      case 'chef rejeté':
        return 'chef-rejected';
      case 'en attente':
      default:
        return 'pending';
    }
  }

  /**
   * Retourne la classe CSS en fonction du type de demande
   * @param type Le type de demande
   * @returns La classe CSS correspondante
   */
  getRequestTypeClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'congé':
      case 'congé annuel':
      case 'congé maladie':
      case 'congé maternité':
      case 'congé paternité':
        return 'leave';
      case 'formation':
        return 'training';
      case 'document':
      case 'document administratif':
        return 'document';
      case 'certificat':
        return 'certificate';
      case 'attestation':
      case 'attestation de travail':
        return 'attestation';
      case 'prêt':
        return 'loan';
      case 'avance':
      case 'avance sur salaire':
        return 'advance';
      default:
        return 'other';
    }
  }

  /**
   * Retourne une version courte du type de demande pour l'affichage dans le calendrier
   * @param type Le type de demande complet
   * @returns Version abrégée du type de demande
   */
  getShortRequestType(type: string): string {
    switch (type?.toLowerCase()) {
      case 'congé':
      case 'congé annuel':
        return 'Congé';
      case 'congé maladie':
        return 'C.Maladie';
      case 'congé maternité':
        return 'C.Mat.';
      case 'congé paternité':
        return 'C.Pat.';
      case 'formation':
        return 'Formation';
      case 'document':
      case 'document administratif':
        return 'Document';
      case 'certificat':
        return 'Certificat';
      case 'attestation':
      case 'attestation de travail':
        return 'Attestation';
      case 'prêt':
        return 'Prêt';
      case 'avance':
      case 'avance sur salaire':
        return 'Avance';
      default:
        return type;
    }
  }

  /**
   * Affiche les détails d'une demande
   * @param request La demande à afficher
   */
  viewRequestDetails(request: Request): void {
    this.selectedRequest = request;
    this.showRequestDetails = true;
  }

  /**
   * Ferme la fenêtre de détails
   */
  closeRequestDetails(): void {
    this.selectedRequest = null;
    this.showRequestDetails = false;
  }

  /**
   * Formate une date pour l'affichage
   * @param date La date à formater
   * @returns La date formatée
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Vérifie si la demande est au premier jour de sa durée
   * @param request La demande à vérifier
   * @returns true si c'est le premier jour, false sinon
   */
  isFirstDay(request: any): boolean {
    return request && (request as any).isFirstDay === true;
  }

  /**
   * Vérifie si la demande est au dernier jour de sa durée
   * @param request La demande à vérifier
   * @returns true si c'est le dernier jour, false sinon
   */
  isLastDay(request: any): boolean {
    return request && (request as any).isLastDay === true;
  }
}




