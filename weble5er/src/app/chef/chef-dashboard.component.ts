import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RequestsService } from '../services/requests.service';

import { Request } from '../models/request.model';

@Component({
  selector: 'app-chef-dashboard',
  templateUrl: './chef-dashboard.component.html',
  styleUrls: ['./chef-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ChefDashboardComponent implements OnInit {
  // Propriétés pour la gestion des demandes
  allRequests: Request[] = [];
  filteredRequests: Request[] = [];
  startDate: string = '';
  endDate: string = '';
  
  // Propriétés pour les modals
  selectedRequest: Request | null = null;
  showObservationModal: boolean = false;
  observationModalTitle: string = '';
  observationAction: 'approve' | 'reject' = 'approve';
  chefObservation: string = '';
  pendingRequestId: string = '';

  constructor(
    private snackBar: MatSnackBar,
    private router: Router, 
    private requestsService: RequestsService
  ) {}

  ngOnInit(): void {
    console.log('ChefDashboardComponent - ngOnInit');
    // Forcer le rechargement des données
    this.requestsService.reloadFromLocalStorage();
    this.loadRequests();
    console.log('Demandes filtrées pour le chef:', this.filteredRequests);
  }

  // Obtenir la date actuelle formatée
  getCurrentDate(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return now.toLocaleDateString('fr-FR', options);
  }

  // Filtrer les demandes par date
  filterRequestsByDate(): void {
    if (!this.startDate || !this.endDate) {
      this.filteredRequests = [...this.allRequests];
      this.snackBar.open('Veuillez sélectionner une date de début et de fin', 'Fermer', { duration: 3000 });
      return;
    }
    
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (start > end) {
      this.snackBar.open('La date de début doit être antérieure à la date de fin', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.filteredRequests = this.allRequests.filter(request => {
      if (!request.date) return false;
      const reqDate = new Date(request.date);
      return reqDate >= start && reqDate <= end;
    });
    
    this.snackBar.open(`${this.filteredRequests.length} demandes trouvées`, 'Fermer', { duration: 3000 });
  }

  // Chargement des demandes chef via RequestsService
  loadRequests(): void {
    console.log('ChefDashboardComponent - loadRequests - Début');
    
    // Récupérer toutes les demandes disponibles
    const allAvailableRequests = this.requestsService.getChefRequests();
    console.log('Toutes les demandes disponibles:', allAvailableRequests);
    
    // Filtrer pour ne garder que les demandes de congé et formation
    this.allRequests = allAvailableRequests.filter(request => {
      // On ne garde que congé/conge/formation (accents/casse ignorés)
      const type = (request.type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const isLeaveOrTraining = type.includes('conge') || type.includes('formation');
      console.log(`Demande ${request.id} - Type: ${request.type} - Est congé/formation: ${isLeaveOrTraining}`);
      return isLeaveOrTraining;
    });
    
    // Copier les demandes filtrées dans filteredRequests
    this.filteredRequests = [...this.allRequests];
    
    console.log('Demandes filtrées pour le chef:', this.filteredRequests);
  }

  // Formatage de la date
  formatDate(dateString: string): string {
    if (!dateString) return 'Date non spécifiée';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  // Navigation vers le calendrier du chef
  navigateToCalendar(): void {
    console.log('Navigation vers le calendrier du chef');
    this.router.navigate(['/chef']);
  }

  // Ouvrir le calendrier dans une nouvelle fenêtre
  openCalendarInNewWindow(): void {
    console.log('Ouverture du calendrier dans une nouvelle fenêtre');
    const url = window.location.origin + '/chef';
    window.open(url, '_blank');
  }

  // Obtenir la classe CSS pour le statut
  getStatusClass(status: string): string {
    if (!status) return '';
    const statusLower = status.toLowerCase();
    if (statusLower === 'en attente') return 'status-pending';
    if (statusLower === 'approuvée' || statusLower === 'chef approuvé') return 'status-approved';
    if (statusLower === 'rejetée' || statusLower === 'chef rejeté') return 'status-rejected';
    return '';
  }

  // Statistiques spécifiques pour les demandes de congé
  getLeaveRequests(): Request[] {
    return this.filteredRequests.filter(request => {
      const type = (request.type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return type.includes('conge');
    });
  }

  // Statistiques spécifiques pour les demandes de formation
  getTrainingRequests(): Request[] {
    return this.filteredRequests.filter(request => {
      const type = (request.type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return type.includes('formation');
    });
  }

  // Statistiques pour les demandes de congé en attente
  getPendingLeaveRequests(): number {
    return this.getLeaveRequests().filter(r => r.status?.toLowerCase() === 'en attente').length;
  }
  
  // Statistiques pour les demandes de congé approuvées
  getApprovedLeaveRequests(): number {
    return this.getLeaveRequests().filter(r => 
      r.status?.toLowerCase() === 'approuvée' || r.status?.toLowerCase() === 'chef approuvé'
    ).length;
  }
  
  // Statistiques pour les demandes de congé rejetées
  getRejectedLeaveRequests(): number {
    return this.getLeaveRequests().filter(r => 
      r.status?.toLowerCase() === 'rejetée' || r.status?.toLowerCase() === 'chef rejeté'
    ).length;
  }
  
  // Statistiques pour les demandes de formation en attente
  getPendingTrainingRequests(): number {
    return this.getTrainingRequests().filter(r => r.status?.toLowerCase() === 'en attente').length;
  }
  
  // Statistiques pour les demandes de formation approuvées
  getApprovedTrainingRequests(): number {
    return this.getTrainingRequests().filter(r => 
      r.status?.toLowerCase() === 'approuvée' || r.status?.toLowerCase() === 'chef approuvé'
    ).length;
  }
  
  // Statistiques pour les demandes de formation rejetées
  getRejectedTrainingRequests(): number {
    return this.getTrainingRequests().filter(r => 
      r.status?.toLowerCase() === 'rejetée' || r.status?.toLowerCase() === 'chef rejeté'
    ).length;
  }
  
  // Vérifier si une demande est de type congé
  isLeaveRequest(request: Request): boolean {
    const type = (request.type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return type.includes('conge');
  }
  
  // Vérifier si une demande est de type formation
  isTrainingRequest(request: Request): boolean {
    const type = (request.type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return type.includes('formation');
  }
  
  // Rejeter une demande
  rejectRequest(requestId: string | undefined): void {
    if (!requestId) {
      this.snackBar.open('ID de demande invalide', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.pendingRequestId = requestId;
    this.observationModalTitle = 'Rejeter la demande';
    this.observationAction = 'reject';
    this.chefObservation = '';
    this.showObservationModal = true;
  }

  // Approuver une demande
  approveRequest(requestId: string | undefined): void {
    if (!requestId) {
      this.snackBar.open('ID de demande invalide', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.pendingRequestId = requestId;
    this.observationModalTitle = 'Approuver la demande';
    this.observationAction = 'approve';
    this.chefObservation = '';
    this.showObservationModal = true;
  }

  // Soumettre l'observation du chef
  submitObservation(): void {
    if (!this.pendingRequestId) {
      this.snackBar.open('ID de demande invalide', 'Fermer', { duration: 3000 });
      return;
    }
    
    const status = this.observationAction === 'approve' ? 'Chef approuvé' : 'Chef rejeté';
    this.requestsService.updateRequestStatus(this.pendingRequestId, status, this.chefObservation);
    
    // Recharger les demandes après la mise à jour
    this.loadRequests();
    
    // Fermer le modal
    this.showObservationModal = false;
    
    // Afficher un message de confirmation
    const message = this.observationAction === 'approve' ? 'Demande approuvée avec succès' : 'Demande rejetée avec succès';
    this.snackBar.open(message, 'Fermer', { duration: 3000 });
  }

  // Afficher les détails d'une demande
  showRequestDetails(requestId: string | undefined): void {
    if (!requestId) {
      this.snackBar.open('ID de demande invalide', 'Fermer', { duration: 3000 });
      return;
    }
    
    this.selectedRequest = this.allRequests.find(req => req.id === requestId) || null;
  }

  // Fermer le modal de détails
  closeModal(): void {
    this.selectedRequest = null;
  }
}
