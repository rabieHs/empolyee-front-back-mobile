import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { RequestsService } from '../../home/requests/requests.service';
import { Request } from '../../models/request.model';
import { NotificationsComponent } from '../../shared/notifications/notifications.component';

@Component({
  selector: 'app-chef-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NotificationsComponent],
  templateUrl: './chef-calendar.component.html',
  styleUrls: ['./chef-calendar.component.scss']
})
export class ChefCalendarComponent implements OnInit, OnDestroy {
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

  // Commentaire du chef
  chefComment: string = '';

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
    private requestsService: RequestsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Attendre que les données utilisateur soient chargées
    this.subscriptions.add(
      this.authService.currentUser.subscribe(user => {
        if (user) {
          console.log('User loaded in ChefCalendar:', user);
          console.log('User role:', user.role);
          console.log('Is chef:', this.authService.isChef());

          // Vérifier que l'utilisateur est chef
          if (!this.authService.isChef()) {
            console.error('Ce composant est réservé aux chefs de service');
            console.error('Current user role:', user.role);
            // Rediriger vers la page appropriée
            if (user.role === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/home';
            }
            return;
          }

          this.initializeCalendar();
          // Force reload requests from API
          this.requestsService.loadUserRequests();
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
   * Charge les demandes de congé et de formation qui sont approuvées ou en attente uniquement
   */
  loadRequests(): void {
    console.log('👨‍🍳 Chef: Loading requests from database...');

    // Utiliser le service pour récupérer toutes les demandes
    this.subscriptions.add(
      this.requestsService.getRequests().subscribe(requests => {
        console.log('📊 Total requests loaded:', requests.length);
        console.log('📝 All requests:', requests);

        // Filtrer pour ne garder que les demandes de congé et de formation
        this.filteredRequests = requests.filter(request => {
          const type = request.type?.toLowerCase() || '';

          // Vérifier tous les types de congés et formations possibles
          const isLeaveRequest = type.includes('congé') ||
                                type.includes('leave') ||
                                type.includes('annuel') ||
                                type.includes('maladie') ||
                                type.includes('maternité') ||
                                type.includes('paternité');

          const isTrainingRequest = type.includes('formation') ||
                                   type.includes('training') ||
                                   type === 'formation';

          const isLeaveOrTraining = isLeaveRequest || isTrainingRequest;

          console.log('🔍 Checking request', request.id, ':', {
            originalType: request.type,
            normalizedType: type,
            isLeaveRequest,
            isTrainingRequest,
            isLeaveOrTraining,
            status: request.status
          });

          if (isLeaveOrTraining) {
            console.log('✅ Request matches chef filter:', {
              id: request.id,
              type: request.type,
              status: request.status,
              user: request.firstname + ' ' + request.lastname || request.user?.firstname + ' ' + request.user?.lastname
            });
          } else {
            console.log('❌ Request filtered out:', {
              id: request.id,
              type: request.type,
              reason: 'Not congé or formation'
            });
          }

          return isLeaveOrTraining;
        });

        console.log('🎯 Requests after type filtering (congé and formation):', this.filteredRequests.length);

        // Filtrer pour ne garder que les demandes approuvées ou en attente
        this.filteredRequests = this.filteredRequests.filter(request => {
          const status = request.status?.toLowerCase() || '';
          const isValidStatus = !status.includes('rejet') && !status.includes('rejetée');

          console.log('📊 Status check for request', request.id, ':', {
            status: request.status,
            isValidStatus
          });

          return isValidStatus;
        });

        console.log('🎆 Final filtered requests count:', this.filteredRequests.length);

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

      // Vérifier si nous avons des dates de début et de fin dans les détails ou directement dans la demande
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      // Essayer plusieurs sources pour la date de début
      if (request.details?.startDate) {
        startDate = new Date(request.details.startDate);
      } else if (request.start_date) {
        // Utiliser start_date de la base de données
        startDate = new Date(request.start_date);
      } else if (request.date) {
        // Utiliser la date principale si pas de date de début spécifique
        startDate = new Date(request.date);
      } else {
        console.log('⚠️ No start date found for request:', request.id);
        return;
      }

      // Essayer plusieurs sources pour la date de fin
      if (request.details?.endDate) {
        endDate = new Date(request.details.endDate);
      } else if (request.end_date) {
        // Utiliser end_date de la base de données
        endDate = new Date(request.end_date);
      } else {
        // Si pas de date de fin, utiliser la date de début comme date de fin
        endDate = new Date(startDate);
      }

      console.log('📅 Date range for request', request.id, ':', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

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
    // Si l'utilisateur n'existe pas, créer un objet utilisateur avec les données de la base
    if (!request.user) {
      // Utiliser les données directement de la requête (venant de la base de données)
      request.user = {
        id: request.user_id || 'unknown',
        firstname: request.firstname || 'Employé',
        lastname: request.lastname || '(Sans nom)'
      };

      console.log('👤 Created user info for request', request.id, ':', request.user);
      return;
    }

    // Convertir l'ID de l'utilisateur en nom réel en utilisant le mappage
    if (request.user_id && this.employeeIdToNameMap[request.user_id]) {
      const userInfo = this.employeeIdToNameMap[request.user_id];
      request.user.firstname = userInfo.firstname;
      request.user.lastname = userInfo.lastname;
      return;
    }

    // Si les données utilisateur sont directement dans la requête (base de données)
    if (request.firstname && request.lastname) {
      request.user.firstname = request.firstname;
      request.user.lastname = request.lastname;
      request.user.id = request.user_id || request.user.id;
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
   * Get count of requests by type (only congé and formation for chef)
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
      case 'approved':
        return 'approved';
      case 'chef approuvé':
      case 'chef_approved':
        return 'chef-approved';
      case 'rejetée':
      case 'rejected':
        return 'rejected';
      case 'chef rejeté':
      case 'chef_rejected':
        return 'chef-rejected';
      case 'en attente':
      case 'pending':
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
    const lowerType = type?.toLowerCase() || '';

    if (lowerType.includes('congé') || lowerType.includes('conge')) {
      return 'leave';
    } else if (lowerType.includes('formation')) {
      return 'training';
    } else if (lowerType.includes('attestation') || lowerType.includes('document')) {
      return 'document';
    } else if (lowerType.includes('avance')) {
      return 'advance';
    } else if (lowerType.includes('prêt') || lowerType.includes('pret')) {
      return 'loan';
    } else {
      return 'other';
    }
  }

  /**
   * Retourne une version courte du type de demande pour l'affichage dans le calendrier
   * @param type Le type de demande complet
   * @returns Version abrégée du type de demande
   */
  getShortRequestType(type: string): string {
    const lowerType = type?.toLowerCase() || '';

    if (lowerType.includes('congé') || lowerType.includes('conge')) {
      if (lowerType.includes('maladie')) return 'C.Maladie';
      if (lowerType.includes('maternité') || lowerType.includes('maternite')) return 'C.Mat.';
      if (lowerType.includes('paternité') || lowerType.includes('paternite')) return 'C.Pat.';
      return 'Congé';
    } else if (lowerType.includes('formation')) {
      return 'Formation';
    } else if (lowerType.includes('attestation')) {
      return 'Attestation';
    } else if (lowerType.includes('document')) {
      return 'Document';
    } else if (lowerType.includes('avance')) {
      return 'Avance';
    } else if (lowerType.includes('prêt') || lowerType.includes('pret')) {
      return 'Prêt';
    } else {
      // Truncate long request types for calendar display
      return type.length > 10 ? type.substring(0, 10) + '...' : type;
    }
  }

  /**
   * Affiche les détails d'une demande
   * @param request La demande à afficher
   */
  viewRequestDetails(request: Request): void {
    console.log('🔍 Opening request details:', {
      id: request.id,
      type: request.type,
      status: request.status,
      statusType: typeof request.status,
      user: request.user || { firstname: request.firstname, lastname: request.lastname }
    });

    this.selectedRequest = request;
    this.showRequestDetails = true;

    // Vérifier si les boutons d'action devraient être affichés
    const isPending = this.isRequestPending(request);
    console.log('🔄 Should show action buttons:', isPending);
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

  /**
   * Vérifie si une demande est en attente et peut être traitée par le chef
   * @param request La demande à vérifier
   * @returns true si la demande est en attente, false sinon
   */
  isRequestPending(request: Request): boolean {
    if (!request || !request.status) return false;

    const status = request.status.toLowerCase().trim();
    const isPending = status === 'en attente' ||
                     status === 'pending' ||
                     status === 'en_attente' ||
                     status.includes('attente');

    console.log('🔍 Checking if request is pending:', {
      originalStatus: request.status,
      normalizedStatus: status,
      isPending
    });

    return isPending;
  }

  /**
   * Approuve une demande (action rapide sans commentaire)
   * @param request La demande à approuver
   */
  approveRequest(request: Request): void {
    console.log('✅ Chef approving request:', request.id);

    if (!request || !request.id) {
      console.error('Demande invalide');
      return;
    }

    console.log('📤 Sending approval request...');
    this.requestsService.updateRequestStatus(
      String(request.id),
      'Chef approuvé',
      this.chefComment || 'Approuvé par le chef'
    ).subscribe({
      next: (response) => {
        console.log('✅ Approval response:', response);
        if (response.success) {
          console.log('Demande approuvée avec succès');
          this.closeRequestDetails();
          this.chefComment = '';
          // Recharger les demandes pour mettre à jour l'affichage
          this.loadRequests();
        } else {
          console.error('Erreur lors de l\'approbation');
        }
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation:', error);
      }
    });
  }

  /**
   * Rejette une demande (action rapide sans commentaire)
   * @param request La demande à rejeter
   */
  rejectRequest(request: Request): void {
    console.log('❌ Chef rejecting request:', request.id);

    if (!request || !request.id) {
      console.error('Demande invalide');
      return;
    }

    console.log('📤 Sending rejection request...');
    this.requestsService.updateRequestStatus(
      String(request.id),
      'Chef rejeté',
      this.chefComment || 'Rejeté par le chef'
    ).subscribe({
      next: (response) => {
        console.log('❌ Rejection response:', response);
        if (response.success) {
          console.log('Demande rejetée avec succès');
          this.closeRequestDetails();
          this.chefComment = '';
          // Recharger les demandes pour mettre à jour l'affichage
          this.loadRequests();
        } else {
          console.error('Erreur lors du rejet');
        }
      },
      error: (error) => {
        console.error('Erreur lors du rejet:', error);
      }
    });
  }

  /**
   * Approuve une demande avec le commentaire saisi
   * @param request La demande à approuver
   */
  approveRequestWithComment(request: Request): void {
    if (!request || !request.id) {
      console.error('Demande invalide');
      return;
    }

    const comment = this.chefComment.trim() || 'Approuvé par le chef';

    this.requestsService.updateRequestStatus(
      String(request.id),
      'Chef approuvé',
      comment
    ).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Demande approuvée avec commentaire');
          this.closeRequestDetails();
          this.chefComment = '';
          // Recharger les demandes pour mettre à jour l'affichage
          this.loadRequests();
        } else {
          console.error('Erreur lors de l\'approbation avec commentaire');
        }
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation avec commentaire:', error);
      }
    });
  }

  /**
   * Rejette une demande avec le commentaire saisi
   * @param request La demande à rejeter
   */
  rejectRequestWithComment(request: Request): void {
    if (!request || !request.id) {
      console.error('Demande invalide');
      return;
    }

    const comment = this.chefComment.trim() || 'Rejeté par le chef';

    this.requestsService.updateRequestStatus(
      String(request.id),
      'Chef rejeté',
      comment
    ).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Demande rejetée avec commentaire');
          this.closeRequestDetails();
          this.chefComment = '';
          // Recharger les demandes pour mettre à jour l'affichage
          this.loadRequests();
        } else {
          console.error('Erreur lors du rejet avec commentaire');
        }
      },
      error: (error) => {
        console.error('Erreur lors du rejet avec commentaire:', error);
      }
    });
  }

  /**
   * Ferme la fenêtre de détails et réinitialise le commentaire
   */
  closeRequestDetails(): void {
    this.selectedRequest = null;
    this.showRequestDetails = false;
    this.chefComment = '';
  }

  /**
   * Navigation vers le profil
   */
  goToProfile(): void {
    console.log('👤 Chef: Navigating to admin profile...');
    console.log('👤 Current route:', this.router.url);

    // Navigate to dedicated admin profile page (chef can also use admin profile)
    this.router.navigate(['/admin/profile']).then(success => {
      if (success) {
        console.log('✅ Chef: Navigation to admin profile successful');
      } else {
        console.error('❌ Chef: Navigation to admin profile failed');
      }
    }).catch(error => {
      console.error('❌ Chef: Navigation error:', error);
    });
  }
}






