import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { RequestsService } from '../home/requests/requests.service';
import { AuthService } from '../auth/auth.service';
import { Request } from '../models/request.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchBarComponent } from '../shared/search-bar/search-bar.component';
import { NotificationsComponent } from '../shared/notifications/notifications.component';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SearchBarComponent, NotificationsComponent]
})
export class AdminComponent implements OnInit, OnDestroy {
  // Propriétés pour la gestion des demandes
  requests: Request[] = [];
  filteredRequests: Request[] = [];
  currentFilter: string = 'all';
  private subscriptions = new Subscription();

  // Propriétés pour les modals
  selectedRequest: Request | null = null;
  showResponseModal: boolean = false;
  showRequestDetails: boolean = false;
  responseModalTitle: string = '';
  responseAction: 'approve' | 'reject' = 'approve';
  adminResponse: string = '';
  pendingRequestId: string = '';

  // Propriétés pour la vue (liste, calendrier ou utilisateurs)
  activeView: 'list' | 'calendar' | 'users' = 'list';

  // Propriétés pour la gestion des utilisateurs
  users: any[] = [];
  selectedUser: any = null;
  showUserDetails: boolean = false;

  // Propriétés pour le calendrier
  currentMonth: Date = new Date();
  calendarDays: { number: number, requests: Request[] }[] = [];
  weekdays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  months: string[] = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];



  constructor(
    private requestsService: RequestsService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('👨‍💼 Admin dashboard initializing...');
    this.loadRequests();
    this.loadUsers();
    this.generateCalendar();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Recherche de demandes
  onSearch(searchTerm: string) {
    if (!searchTerm) {
      this.applyCurrentFilter();
      return;
    }
    const term = searchTerm.toLowerCase();
    this.filteredRequests = this.getFilteredRequests().filter(request =>
      (request.user?.firstname?.toLowerCase().includes(term) ||
      request.user?.lastname?.toLowerCase().includes(term) ||
      request.user?.id?.includes(term) ||
      request.type?.toLowerCase().includes(term))
    );
  }

  // Filtrage des demandes
  filterRequests(filter: string) {
    this.currentFilter = filter;
    this.applyCurrentFilter();
  }

  applyCurrentFilter() {
    this.filteredRequests = this.getFilteredRequests();
  }

  getFilteredRequests(): Request[] {
    switch(this.currentFilter) {
      case 'chef':
        return this.requests.filter(request => {
          const status = request.status?.toLowerCase() || '';
          return status === 'chef approuvé' || status === 'chef rejeté';
        });
      case 'pending':
        return this.requests.filter(request => {
          const status = request.status?.toLowerCase() || '';
          return status === 'en attente' || status === 'pending';
        });
      case 'all':
      default:
        return [...this.requests];
    }
  }

  // Chargement des demandes
  loadRequests() {
    console.log('📊 Admin: Loading all requests from database...');

    // Force reload requests from API
    this.requestsService.loadUserRequests();

    // Subscribe to the requests observable for real-time updates
    this.subscriptions.add(
      this.requestsService.getRequests().subscribe(requests => {
        console.log('📊 Admin received', requests.length, 'requests from API');
        console.log('📝 All admin requests:', requests);

        this.requests = requests;
        this.applyCurrentFilter();
        this.generateCalendar();
      })
    );
  }

  // Affichage des détails d'une demande
  viewRequestDetails(request: Request) {
    console.log('🔍 Admin opening request details:', {
      id: request.id,
      type: request.type,
      status: request.status,
      user: request.user || { firstname: request.firstname, lastname: request.lastname }
    });

    this.selectedRequest = request;
    this.showRequestDetails = true;
  }

  closeModal() {
    this.selectedRequest = null;
    this.showRequestDetails = false;
  }

  // Approbation/rejet simple (pour les demandes en attente)
  approveRequest(request: Request) {
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
            this.closeModal();
            this.adminResponse = '';
            this.loadRequests();
          },
          error: (error) => {
            console.error('❌ Admin approval failed:', error);
          }
        })
      );
    }
  }

  rejectRequest(request: Request) {
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
            this.closeModal();
            this.adminResponse = '';
            this.loadRequests();
          },
          error: (error) => {
            console.error('❌ Admin rejection failed:', error);
          }
        })
      );
    }
  }

  // Approbation/rejet final (pour les demandes traitées par le chef)
  finalApproveRequest(request: Request) {
    this.pendingRequestId = request.id || '';
    this.responseAction = 'approve';
    this.responseModalTitle = 'Approbation finale de la demande';
    this.adminResponse = '';
    this.showResponseModal = true;
  }

  finalRejectRequest(request: Request) {
    this.pendingRequestId = request.id || '';
    this.responseAction = 'reject';
    this.responseModalTitle = 'Rejet final de la demande';
    this.adminResponse = '';
    this.showResponseModal = true;
  }

  // Gestion de la réponse finale
  submitResponse() {
    const status = this.responseAction === 'approve' ? 'Approuvée' : 'Rejetée';
    console.log('📤 Admin submitting final response:', {
      requestId: this.pendingRequestId,
      status,
      response: this.adminResponse
    });

    this.subscriptions.add(
      this.requestsService.updateRequestStatus(
        this.pendingRequestId,
        status,
        this.adminResponse
      ).subscribe({
        next: (response) => {
          console.log('✅ Final response submitted successfully:', response);
          this.showResponseModal = false;
          this.selectedRequest = null;
          this.adminResponse = '';
          this.loadRequests();
        },
        error: (error) => {
          console.error('❌ Final response submission failed:', error);
        }
      })
    );
  }

  cancelResponse() {
    this.showResponseModal = false;
    this.adminResponse = '';
    this.pendingRequestId = '';
  }

  goToProfile() {
    this.router.navigate(['/home/profile']);
  }

  // Méthodes pour le calendrier
  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // Premier jour du mois (0 = dimanche, 1 = lundi, etc.)
    const firstDay = new Date(year, month, 1).getDay();

    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Initialiser le tableau des jours
    this.calendarDays = [];

    // Ajouter les cases vides pour les jours avant le premier jour du mois
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push({ number: 0, requests: [] });
    }

    // Ajouter les jours du mois avec leurs demandes
    for (let i = 1; i <= daysInMonth; i++) {
      const dayRequests = this.getRequestsForDay(i);
      this.calendarDays.push({ number: i, requests: dayRequests });
    }

    // Compléter la dernière semaine avec des cases vides si nécessaire
    const remainingCells = 42 - this.calendarDays.length; // 6 semaines * 7 jours = 42
    for (let i = 0; i < remainingCells; i++) {
      this.calendarDays.push({ number: 0, requests: [] });
    }
  }

  getRequestsForDay(day: number): Request[] {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const dayStart = new Date(year, month, day);
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999);

    return this.requests.filter(request => {
      if (!request.createdAt) return false;

      const requestDate = new Date(request.createdAt);
      return requestDate >= dayStart && requestDate <= dayEnd;
    });
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  getStatusClass(status: string): string {
    const normalizedStatus = status?.toLowerCase() || '';

    if (normalizedStatus === 'approuvée' || normalizedStatus === 'approved') {
      return 'status-approved';
    } else if (normalizedStatus === 'rejetée' || normalizedStatus === 'rejected' || normalizedStatus === 'chef rejeté') {
      return 'status-rejected';
    } else if (normalizedStatus === 'chef approuvé' || normalizedStatus === 'chef_approved') {
      return 'status-chef-approved';
    } else if (normalizedStatus === 'en attente' || normalizedStatus === 'pending') {
      return 'status-pending';
    }
    return 'status-pending';
  }

  /**
   * Vérifie si une demande peut être traitée par l'admin
   * @param request La demande à vérifier
   * @returns true si la demande peut être traitée, false sinon
   */
  canProcessRequest(request: Request): boolean {
    const status = request.status?.toLowerCase() || '';
    return status === 'en attente' || status === 'chef approuvé' || status === 'chef rejeté';
  }

  /**
   * Vérifie si une demande est en attente (pas encore traitée par le chef)
   * @param request La demande à vérifier
   * @returns true si la demande est en attente, false sinon
   */
  isPendingRequest(request: Request): boolean {
    const status = request.status?.toLowerCase() || '';
    return status === 'en attente' || status === 'pending';
  }

  /**
   * Vérifie si une demande a été traitée par le chef
   * @param request La demande à vérifier
   * @returns true si traitée par le chef, false sinon
   */
  isChefProcessed(request: Request): boolean {
    const status = request.status?.toLowerCase() || '';
    return status === 'chef approuvé' || status === 'chef rejeté';
  }

  // ===== Méthodes de gestion des utilisateurs =====

  /**
   * Charge la liste de tous les utilisateurs
   */
  loadUsers() {
    console.log('👥 Admin: Loading all users from database...');

    // Utiliser l'AuthService pour récupérer tous les utilisateurs
    this.subscriptions.add(
      this.authService.getAllUsers().subscribe({
        next: (users) => {
          console.log('👥 Admin received', users.length, 'users from API');
          console.log('📝 All users:', users);
          this.users = users;
        },
        error: (error) => {
          console.error('❌ Error loading users:', error);
          this.users = [];
        }
      })
    );
  }

  /**
   * Filtre les utilisateurs par rôle
   * @param role Le rôle à filtrer
   * @returns Liste des utilisateurs avec le rôle spécifié
   */
  getUsersByRole(role: string): any[] {
    return this.users.filter(user => user.role === role);
  }

  /**
   * Affiche les détails d'un utilisateur
   * @param user L'utilisateur à afficher
   */
  viewUserDetails(user: any) {
    console.log('🔍 Admin viewing user details:', user);
    this.selectedUser = user;
    this.showUserDetails = true;
  }

  /**
   * Ferme le modal des détails utilisateur
   */
  closeUserModal() {
    this.selectedUser = null;
    this.showUserDetails = false;
  }
}