import { Component, OnInit } from '@angular/core';
import { RequestsService } from '../services/requests.service';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Request } from '../models/request.model';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

// Type guard pour vérifier la présence de department
function hasDepartment(obj: any): obj is { department: string } {
  return obj && typeof obj === 'object' && typeof obj.department === 'string';
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Getters pour stats filtrées selon la vue du chef
  get totalRequests(): number {
    return this.requests.length;
  }
  get pendingRequests(): number {
    return this.requests.filter(r => r.status === 'en attente').length;
  }
  get approvedRequests(): number {
    return this.requests.filter(r => r.status === 'approuvée').length;
  }
  get rejectedRequests(): number {
    return this.requests.filter(r => r.status === 'rejetée').length;
  }
  startDate: string = '';
  endDate: string = '';

  
  // ...
  goToChefAdminCalendar() {
    this.router.navigate(['/chef/admin-calendar']);
  }
  requests: Request[] = [];
  filteredRequests: Request[] = [];
  selectedRequest: Request | null = null;
  isAdmin: boolean = false;
  
  loading: boolean = true;

  constructor(
    private requestsService: RequestsService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.isAdmin = this.authService.isAdmin();
    
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    let filteredRequests: Request[] = [];

    if (this.isAdmin) {
      // Admin voit toutes les demandes
      filteredRequests = this.requestsService.getAllRequests();
    } else if (this.authService.getCurrentUser && this.authService.getCurrentUser()?.role === 'CHEF') {
      // CHEF : ne voit que les demandes de congé/formation ET statuts pertinents
      // (optionnel : filtrer par équipe si possible)
      filteredRequests = this.requestsService.getChefRequests();
      // Filtrage supplémentaire par département si possible
      const chef = this.authService.getCurrentUser();
      let chefDepartment: string | undefined = undefined;
      if (chef) {
        if ('professionalInfo' in chef && chef.professionalInfo && chef.professionalInfo.department) {
          chefDepartment = chef.professionalInfo.department;
        } else if ('professional_info' in chef && chef.professional_info && chef.professional_info.department) {
          chefDepartment = chef.professional_info.department;
        }
      }
      if (chefDepartment) {
        filteredRequests = filteredRequests.filter((r: Request) => {
          // Cas 1 : user.professionalInfo
          if (r.user && 'professionalInfo' in r.user && r.user.professionalInfo && r.user.professionalInfo.department === chefDepartment) {
            return true;
          }
          // Cas 2 : professional_info (compatibilité, via type guard)
          if (hasDepartment(r.professional_info) && r.professional_info.department === chefDepartment) {
            return true;
          }
          return false;
        });
      }
    } else {
      // Utilisateur normal voit ses propres demandes
      const userId = String(this.authService.getCurrentUserId());
      if (userId) {
        filteredRequests = this.requestsService.getAllRequests().filter(r => String(r.user?.id) === userId);
      }
    }

    // Appliquer le filtre par date automatiquement
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      filteredRequests = filteredRequests.filter(request => {
        if (!request.date) return false;
        const requestDate = new Date(request.date);
        return requestDate >= start && requestDate <= end;
      });
    }
    this.requests = filteredRequests;
    this.loading = false;
  }

  filterRequestsByDate(): void {
    // Cette méthode n'est plus nécessaire car le filtre par date est appliqué automatiquement dans loadRequests
    // Elle peut être laissée vide ou supprimée, mais on la laisse vide pour éviter toute erreur de template
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  getUserFullName(request: Request): string {
    return `${request.user?.firstname} ${request.user?.lastname}`;
  }

  viewRequestDetails(request: Request): void {
    this.selectedRequest = request;
  }

  closeDetails(): void {
    this.selectedRequest = null;
  }

  approveRequest(request: Request): void {
    if (!this.isAdmin) return;

    const newStatus = this.isAdmin ? 'admin_approved' : 'chef_approved';

    try {
  this.requestsService.updateRequestStatus(String(request.id), newStatus);
  this.snackBar.open('Demande approuvée avec succès', 'Fermer', {
    duration: 3000
  });
  const baseId = 'notification-' + new Date().getTime();
  if (this.isAdmin) {
    this.notificationService.addNotification({
      id: baseId + '-admin',
      message: `Vous avez approuvé définitivement la demande de ${request.type}`,
      type: 'success',
      timestamp: new Date(),
      read: false,
      targetUserId: 'admin-approval',
      link: `/requests/details/${request.id}`
    });
    this.notificationService.addNotification({
      id: baseId + '-others',
      message: `L'admin a approuvé définitivement la demande de ${request.type}`,
      type: 'info',
      timestamp: new Date(),
      read: false,
      targetUserId: 'others-admin-approval',
      link: `/requests/details/${request.id}`
    });
  } else {
    this.notificationService.addNotification({
      id: baseId + '-chef',
      message: `Vous avez approuvé la demande de ${request.type}.`,
      type: 'success',
      timestamp: new Date(),
      read: false,
      targetUserId: 'chef-approval',
      link: `/requests/details/${request.id}`
    });
    this.notificationService.addNotification({
      id: baseId + '-others',
      message: `Le chef a approuvé la demande de ${request.type}.`,
      type: 'info',
      timestamp: new Date(),
      read: false,
      targetUserId: 'others-chef-approval',
      link: `/requests/details/${request.id}`
    });
  }
  this.loadRequests();
} catch (error: any) {
  console.error('Erreur lors de l\'approbation de la demande:', error);
  this.snackBar.open('Erreur lors de l\'approbation de la demande', 'Fermer', {
    duration: 3000
  });
}

  }

  rejectRequest(request: Request): void {
    if (!this.isAdmin) return;

    const newStatus = this.isAdmin ? 'admin_rejected' : 'chef_rejected';

    try {
  this.requestsService.updateRequestStatus(String(request.id), newStatus);
  this.snackBar.open('Demande rejetée', 'Fermer', {
    duration: 3000
  });
  const baseId = 'notification-' + new Date().getTime();
  if (this.isAdmin) {
    this.notificationService.addNotification({
      id: baseId + '-admin',
      message: `Vous avez rejeté définitivement la demande de ${request.type}`,
      type: 'warning',
      timestamp: new Date(),
      read: false,
      targetUserId: 'admin-rejection',
      link: `/requests/details/${request.id}`
    });
    this.notificationService.addNotification({
      id: baseId + '-others',
      message: `L'admin a rejeté définitivement la demande de ${request.type}`,
      type: 'error',
      timestamp: new Date(),
      read: false,
      targetUserId: 'others-admin-rejection',
      link: `/requests/details/${request.id}`
    });
  } else {
    this.notificationService.addNotification({
      id: baseId + '-chef',
      message: `Vous avez rejeté la demande de ${request.type}.`,
      type: 'warning',
      timestamp: new Date(),
      read: false,
      targetUserId: 'chef-rejection',
      link: `/requests/details/${request.id}`
    });
    this.notificationService.addNotification({
      id: baseId + '-others',
      message: `Le chef a rejeté la demande de ${request.type}.`,
      type: 'error',
      timestamp: new Date(),
      read: false,
      targetUserId: 'others-chef-rejection',
      link: `/requests/details/${request.id}`
    });
  }
  this.loadRequests();
} catch (error: any) {
  console.error('Erreur lors du rejet de la demande:', error);
  this.snackBar.open('Erreur lors du rejet de la demande', 'Fermer', {
    duration: 3000
  });
}

  }

  canEdit(request: Request): boolean {
    console.log('Vérification canEdit pour la demande:', request);
    if (this.isAdmin) {
      console.log('Utilisateur admin, édition autorisée');
      return true;
    }

    const userId = String(this.authService.getCurrentUserId());
    const canEdit = String(request.user?.id) === userId && request.status === 'en attente';
    console.log('Résultat canEdit:', canEdit, '(userId:', userId, ', request.user?.id:', request.user?.id, ', status:', request.status, ')');
    return canEdit;
  }

  isEditableRequest(request: Request): boolean {
    console.log('Vérification isEditableRequest pour la demande:', request);
    const isEditable = request.type === 'congé paternité' || request.type === 'congé maternité';
    console.log('Type de congé:', request.type, 'isEditable:', isEditable);
    return this.canEdit(request) && isEditable;
  }

  navigateToEdit(request: Request): void {
    console.log('Tentative de navigation vers l\'édition pour la demande:', request);
    try {
      const requestId = String(request.id);
      console.log('ID de la demande:', requestId);
      
      // Vérification explicite du type de congé
      if (request.type !== 'congé paternité' && request.type !== 'congé maternité') {
        console.log('Type de congé non éditable:', request.type);
        this.snackBar.open('Ce type de congé ne peut pas être édité', 'Fermer', { duration: 3000 });
        return;
      }

      // Navigation vers la page d'édition
      console.log('Navigation vers /requests/edit/' + requestId);
      this.router.navigate(['/requests/edit', requestId]).then(
        (success) => {
          console.log('Résultat de la navigation:', success);
          if (!success) {
            console.error('La navigation a échoué');
            this.snackBar.open('Erreur lors de la navigation', 'Fermer', { duration: 3000 });
          }
        },
        (error) => {
          console.error('Erreur lors de la navigation:', error);
          this.snackBar.open('Erreur lors de la navigation', 'Fermer', { duration: 3000 });
        }
      );
    } catch (error) {
      console.error('Erreur dans navigateToEdit:', error);
      this.snackBar.open('Une erreur est survenue', 'Fermer', { duration: 3000 });
    }
  }
}
