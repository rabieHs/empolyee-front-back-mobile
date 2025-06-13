import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RequestsService } from '../services/requests.service';

import { Request } from '../models/request.model';

@Component({
  selector: 'app-chef-view',
  templateUrl: './chef-view.component.html',
  styleUrls: ['./chef-view.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})

export class ChefViewComponent implements OnInit {
  // Propriétés pour la gestion des demandes
  allRequests: Request[] = [];
  filteredRequests: Request[] = [];
  startDate: string = '';
  endDate: string = '';
  
  // Propriétés pour les modals
  selectedRequest: Request | null = null;
  showObservationModal: boolean = false;

  filterRequestsByDate(): void {
    if (!this.startDate || !this.endDate) {
      this.filteredRequests = [...this.allRequests];
      return;
    }
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    this.filteredRequests = this.allRequests.filter(request => {
      if (!request.date) return false;
      const reqDate = new Date(request.date);
      return reqDate >= start && reqDate <= end;
    });
  }

  observationModalTitle: string = '';
  observationAction: 'approve' | 'reject' = 'approve';
  chefObservation: string = '';
  pendingRequestId: string = '';

  // Méthode pour naviguer vers le calendrier du chef
  goToChefCalendar(): void {
    // Essayer d'abord la navigation normale
    try {
      this.router.navigate(['/chef']);
    } catch (error) {
      console.error('Erreur de navigation:', error);
      // En cas d'échec, ouvrir dans une nouvelle fenêtre
      const url = window.location.origin + '/chef';
      window.open(url, '_blank');
    }
  }

  constructor(
    private snackBar: MatSnackBar, private router: Router, private requestsService: RequestsService) {}

  ngOnInit(): void {
    console.log('ChefViewComponent - ngOnInit');
    this.requestsService.reloadFromLocalStorage();
    this.cleanLocalStorageRequests();
    this.requestsService.reloadFromLocalStorage();
    this.loadRequests();
    // DEBUG : log localStorage et BehaviorSubject
    console.log('localStorage.requests:', JSON.parse(localStorage.getItem('requests') || '[]'));
    console.log('BehaviorSubject:', this.requestsService.getAllRequests());
    console.log('Demandes filtrées pour le chef (après loadRequests):', this.filteredRequests);
  }

  /**
   * Nettoie le localStorage pour supprimer toutes les demandes d'attestation de travail
   */
  cleanLocalStorageRequests(): void {
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    // On ne garde QUE les demandes de congé/conge/formation (accents/casse ignorés)
    const filtered = requests.filter((req: any) => {
      const type = (req.type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      return type.includes('conge') || type.includes('formation');
    });
    if (filtered.length !== requests.length) {
      localStorage.setItem('requests', JSON.stringify(filtered));
      console.log('Nettoyage radical : seules les demandes de congé/conge/formation sont conservées dans le localStorage (dashboard chef)');
    }
  }

  goToChefAdminCalendar() {
    // Ouvrir le calendrier dans une nouvelle fenêtre pour éviter les problèmes de navigation
    const url = window.location.origin + '/chef';
    window.open(url, '_blank');
  }

  goToProfile() {
    this.router.navigate(['/home/profile']);
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
  
  // Statistiques pour les demandes de congé rejetées
  getRejectedLeaveRequests(): number {
    return this.getLeaveRequests().filter(r => 
      r.status?.toLowerCase() === 'rejetée' || r.status?.toLowerCase() === 'chef rejeté'
    ).length;
  }
  
  // Statistiques pour les demandes de formation rejetées
  getRejectedTrainingRequests(): number {
    return this.getTrainingRequests().filter(r => 
      r.status?.toLowerCase() === 'rejetée' || r.status?.toLowerCase() === 'chef rejeté'
    ).length;
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

  // Chargement des demandes chef via RequestsService
  loadRequests(): void {
    console.log('ChefViewComponent - loadRequests - Début');
    
    // Récupérer toutes les demandes disponibles
    const allAvailableRequests = this.requestsService.getChefRequests();
    console.log('Toutes les demandes disponibles:', allAvailableRequests.length, allAvailableRequests);
    
    // Filtrer pour ne garder que les demandes de congé et formation
    this.allRequests = allAvailableRequests.filter(request => {
      // Sécurité supplémentaire : on ne garde que congé/conge/formation (accents/casse ignorés)
      const type = (request.type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const isLeaveOrTraining = type.includes('conge') || type.includes('formation');
      console.log(`Demande ${request.id} - Type: ${request.type} - Est congé/formation: ${isLeaveOrTraining}`);
      return isLeaveOrTraining;
    });
    
    // Copier les demandes filtrées dans filteredRequests
    this.filteredRequests = [...this.allRequests];
    
    // Appliquer le filtre par date si dates présentes
    if (this.startDate && this.endDate) {
      this.filterRequestsByDate();
    }
    
    console.log('Demandes filtrées pour le chef (fin loadRequests):', this.filteredRequests.length, this.filteredRequests);
  }

  // Formatage de la date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  // Obtenir la classe CSS pour le statut
  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'en attente') return 'status-pending';
    if (statusLower === 'approuvée' || statusLower === 'chef approuvé') return 'status-approved';
    if (statusLower === 'rejetée' || statusLower === 'chef rejeté') return 'status-rejected';
    return '';
  }

  // Afficher les détails d'une demande
  showRequestDetails(requestId: string): void {
    this.selectedRequest = this.allRequests.find(req => req.id === requestId) || null;
  }

  closeModal(): void {
    this.selectedRequest = null;
  }

  // Approuver une demande
  approveRequest(requestId: string): void {
    this.pendingRequestId = requestId;
    this.observationAction = 'approve';
    this.observationModalTitle = 'Approuver la demande';
    this.chefObservation = '';
    this.showObservationModal = true;
  }

  // Supprimer une demande
  deleteRequest(requestId: string): void {
    const request = this.allRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'En attente') {
      this.snackBar.open('Seules les demandes en attente peuvent être supprimées.', 'Fermer', { duration: 3000 });
      return;
    }
    this.pendingRequestId = requestId;
    this.observationAction = 'reject';
    this.observationModalTitle = 'Rejeter la demande';
    this.chefObservation = '';
    this.showObservationModal = true;
  }

  // Annuler l'observation
  cancelObservation(): void {
    this.showObservationModal = false;
  }

  // Soumettre l'observation et mettre à jour le statut
  submitObservation(): void {
    if (!this.chefObservation.trim()) {
      alert('Veuillez entrer une observation pour l\'admin.');
      return;
    }

    const newStatus = this.observationAction === 'approve' ? 'Chef approuvé' : 'Chef rejeté';
    this.updateRequestStatus(this.pendingRequestId, newStatus, this.chefObservation);
    this.showObservationModal = false;
  }

  // Mettre à jour le statut d'une demande
  updateRequestStatus(requestId: string, newStatus: string, observation: string): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const updatedRequests = this.allRequests.map(request => {
      if (request.id === requestId) {
        return {
          ...request,
          status: newStatus,
          processedBy: currentUser.username || 'Chef',
          chefObservation: observation,
          processedDate: new Date().toISOString()
        };
      }
      return request;
    });
    
    localStorage.setItem('requests', JSON.stringify(updatedRequests));
    this.loadRequests();
  }
}
