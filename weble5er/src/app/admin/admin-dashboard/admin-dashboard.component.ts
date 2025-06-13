import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestsService } from '../../home/requests/requests.service';
import { AuthService } from '../../auth/auth.service';
import { Request } from '../../models/request.model';
import { Subscription } from 'rxjs';
import { NotificationsComponent } from '../../shared/notifications/notifications.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NotificationsComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
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

  // Demandes filtrées pour le mois en cours (ADMIN: toutes les demandes)
  filteredRequests: Request[] = [];

  // Abonnements
  private subscriptions: Subscription = new Subscription();

  // Demande sélectionnée pour les détails
  selectedRequest: Request | null = null;
  showRequestDetails: boolean = false;

  // Commentaire de l'admin
  adminResponse: string = '';

  constructor(
    private requestsService: RequestsService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Attendre que les données utilisateur soient chargées
    this.subscriptions.add(
      this.authService.currentUser.subscribe(user => {
        if (user) {
          console.log('User loaded in AdminDashboard:', user);
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
   * Charge TOUTES les demandes (admin voit tout, pas de filtrage comme le chef)
   */
  loadRequests(): void {
    console.log('👨‍💼 Admin: Loading ALL requests from database...');

    // Utiliser le service pour récupérer toutes les demandes
    this.subscriptions.add(
      this.requestsService.getRequests().subscribe(requests => {
        console.log('📊 Total requests loaded:', requests.length);
        console.log('📝 All requests:', requests);

        // ADMIN: Pas de filtrage par type, on prend TOUTES les demandes
        this.filteredRequests = requests;

        console.log('🎆 Admin sees ALL requests:', this.filteredRequests.length);

        // S'assurer que chaque demande a un utilisateur et un type valide
        this.filteredRequests = this.filteredRequests.map(req => {
          // S'assurer que chaque demande a un utilisateur
          if (!req.user) {
            req.user = {
              id: req.user_id || 'unknown',
              firstname: req.firstname || 'Employé',
              lastname: req.lastname || '(Sans nom)'
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
      } else if (request.createdAt) {
        startDate = new Date(request.createdAt);
      // Skip created_at since it's not in the model
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
   * Retourne la classe CSS en fonction du statut de la demande
   * @param status Le statut de la demande
   * @returns La classe CSS correspondante
   */
  getStatusClass(status: string): string {
    const normalizedStatus = status?.toLowerCase().trim() || '';

    // Statuts approuvés
    if (normalizedStatus.includes('approuvé') && normalizedStatus.includes('chef')) {
      return 'chef-approved';
    } else if (normalizedStatus.includes('approuvé') || normalizedStatus === 'approved') {
      return 'approved';
    }
    // Statuts rejetés
    else if (normalizedStatus.includes('rejeté') && normalizedStatus.includes('chef')) {
      return 'chef-rejected';
    } else if (normalizedStatus.includes('rejeté') || normalizedStatus === 'rejected') {
      return 'rejected';
    }
    // Statuts en attente
    else if (normalizedStatus.includes('attente') || normalizedStatus === 'pending') {
      return 'pending';
    }
    // Par défaut
    else {
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

    // Congés (toutes variantes)
    if (lowerType.includes('congé') || lowerType.includes('conge')) {
      return 'leave';
    }
    // Formation
    else if (lowerType.includes('formation')) {
      return 'training';
    }
    // Attestation de travail
    else if (lowerType.includes('attestation')) {
      return 'document';
    }
    // Documents administratifs
    else if (lowerType.includes('document')) {
      return 'document';
    }
    // Avances
    else if (lowerType.includes('avance')) {
      return 'advance';
    }
    // Prêts
    else if (lowerType.includes('prêt') || lowerType.includes('pret')) {
      return 'loan';
    }
    // Autres types
    else {
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
   * Vérifie si c'est le premier jour d'une demande
   * @param request La demande à vérifier
   * @returns true si c'est le premier jour
   */
  isFirstDay(request: any): boolean {
    return request.isFirstDay || false;
  }

  /**
   * Vérifie si c'est le dernier jour d'une demande
   * @param request La demande à vérifier
   * @returns true si c'est le dernier jour
   */
  isLastDay(request: any): boolean {
    return request.isLastDay || false;
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
   * Ferme les détails de la demande
   */
  closeRequestDetails(): void {
    this.selectedRequest = null;
    this.showRequestDetails = false;
    this.adminResponse = '';
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
   * Vérifie si une demande est en attente et peut être traitée
   * @param request La demande à vérifier
   * @returns true si la demande est en attente
   */
  isRequestPending(request: Request): boolean {
    const status = request.status?.toLowerCase() || '';
    return status === 'en attente' || status === 'pending';
  }

  /**
   * Vérifie si une demande a été traitée par le chef
   * @param request La demande à vérifier
   * @returns true si traitée par le chef
   */
  isChefProcessed(request: Request): boolean {
    const status = request.status?.toLowerCase() || '';
    return status === 'chef approuvé' || status === 'chef rejeté';
  }

  /**
   * Approuve une demande directement (admin)
   * @param request La demande à approuver
   */
  approveRequest(request: Request): void {
    console.log('✅ Admin approving request:', request.id);

    if (request && request.id) {
      this.subscriptions.add(
        this.requestsService.updateRequestStatus(
          String(request.id),
          'Approuvée',
          this.adminResponse || 'Approuvé par l\'administrateur'
        ).subscribe({
          next: (response) => {
            console.log('✅ Admin approval successful:', response);
            this.closeRequestDetails();
            this.loadRequests();
          },
          error: (error) => {
            console.error('❌ Admin approval failed:', error);
          }
        })
      );
    }
  }

  /**
   * Rejette une demande directement (admin)
   * @param request La demande à rejeter
   */
  rejectRequest(request: Request): void {
    console.log('❌ Admin rejecting request:', request.id);

    if (request && request.id) {
      this.subscriptions.add(
        this.requestsService.updateRequestStatus(
          String(request.id),
          'Rejetée',
          this.adminResponse || 'Rejeté par l\'administrateur'
        ).subscribe({
          next: (response) => {
            console.log('❌ Admin rejection successful:', response);
            this.closeRequestDetails();
            this.loadRequests();
          },
          error: (error) => {
            console.error('❌ Admin rejection failed:', error);
          }
        })
      );
    }
  }

  /**
   * Approbation finale pour les demandes traitées par le chef
   * @param request La demande à approuver finalement
   */
  finalApproveRequest(request: Request): void {
    console.log('✅ Admin final approval for request:', request.id);

    if (request && request.id) {
      this.subscriptions.add(
        this.requestsService.updateRequestStatus(
          String(request.id),
          'Approuvée',
          this.adminResponse || 'Approbation finale par l\'administrateur'
        ).subscribe({
          next: (response) => {
            console.log('✅ Admin final approval successful:', response);
            this.closeRequestDetails();
            this.loadRequests();
          },
          error: (error) => {
            console.error('❌ Admin final approval failed:', error);
          }
        })
      );
    }
  }

  /**
   * Rejet final pour les demandes traitées par le chef
   * @param request La demande à rejeter finalement
   */
  finalRejectRequest(request: Request): void {
    console.log('❌ Admin final rejection for request:', request.id);

    if (request && request.id) {
      this.subscriptions.add(
        this.requestsService.updateRequestStatus(
          String(request.id),
          'Rejetée',
          this.adminResponse || 'Rejet final par l\'administrateur'
        ).subscribe({
          next: (response) => {
            console.log('❌ Admin final rejection successful:', response);
            this.closeRequestDetails();
            this.loadRequests();
          },
          error: (error) => {
            console.error('❌ Admin final rejection failed:', error);
          }
        })
      );
    }
  }

  // Méthodes avec commentaires (utilisées par les boutons du footer)
  approveRequestWithComment(request: Request): void {
    this.approveRequest(request);
  }

  rejectRequestWithComment(request: Request): void {
    this.rejectRequest(request);
  }

  finalApproveRequestWithComment(request: Request): void {
    this.finalApproveRequest(request);
  }

  finalRejectRequestWithComment(request: Request): void {
    this.finalRejectRequest(request);
  }

  goToProfile() {
    console.log('👤 Admin: Navigating to admin profile...');
    console.log('👤 Current route:', this.router.url);

    // Navigate to dedicated admin profile page
    this.router.navigate(['/admin/profile']).then(success => {
      if (success) {
        console.log('✅ Admin: Navigation to admin profile successful');
      } else {
        console.error('❌ Admin: Navigation to admin profile failed');
      }
    }).catch(error => {
      console.error('❌ Admin: Navigation error:', error);
    });
  }
}
