import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../auth/auth.service';
import { RequestsService } from './requests.service';
import { Request } from '../../models/request.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class RequestsComponent implements OnInit {
  requests: Request[] = [];
  filteredRequests: Request[] = [];
  selectedStatus: string = 'all';
  isAdmin: boolean = false;
  isChef: boolean = false;
  searchId: string = '';
  startDate: string = '';
  endDate: string = '';

  statusOptions = [
    { value: 'all', label: 'Toutes les demandes' },
    { value: 'En attente', label: 'En attente' },
    { value: 'Chef approuvé', label: 'Approuvées par le chef' },
    { value: 'Chef rejeté', label: 'Rejetées par le chef' },
    { value: 'Approuvée', label: 'Approuvées définitivement' },
    { value: 'Rejetée', label: 'Rejetées définitivement' }
  ];

  constructor(
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private router: Router,
    private requestsService: RequestsService
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.reloadRequests();
    });
    this.reloadRequests();
  }

  reloadRequests() {
    this.isAdmin = this.authService.isAdmin();
    this.isChef = this.authService.isChef();

    if (this.isAdmin && !this.isChef) {
      // L'admin voit toutes les demandes
      this.requestsService.getAllRequests().subscribe(requests => {
        this.requests = requests;
        this.filterRequests();
      });
    } else if (this.isChef) {
      // Le chef ne voit que les demandes de congés et de formation
      this.requestsService.getAllRequests().subscribe(requests => {
        const filteredRequests = [];
        for (const request of requests) {
          const type = request['type']?.toLowerCase();
          if (type?.includes('congé') || type === 'formation') {
            filteredRequests.push(request);
          }
        }
        this.requests = filteredRequests;
        this.filterRequests();
      });
    } else {
      // Pour les utilisateurs normaux, ne montrer que leurs propres demandes
      this.requestsService.getRequests().subscribe(requests => {
        this.requests = requests;
        this.filterRequests();
      });
    }
  }

  filterRequests() {
    // Si c'est un chef, vérifier une dernière fois que seules les demandes de congés et formation sont présentes
    if (this.isChef && !this.isAdmin) {
      this.requests = this.requests.filter(request => {
        const type = request['type']?.toLowerCase();
        return type?.includes('congé') || type === 'formation';
      });
    }

    // Appliquer les filtres de statut et de recherche
    this.filteredRequests = this.requests.filter(request => {
      const matchesStatus = this.selectedStatus === 'all' || request.status === this.selectedStatus;
      const matchesId = !this.searchId || request.id?.toLowerCase() || ''.includes(this.searchId.toLowerCase());
      return matchesStatus && matchesId;
    });

    // Appliquer le filtre par dates si les deux dates sont renseignées
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      this.filteredRequests = this.filteredRequests.filter(request => {
        const reqDate = new Date(request.date || new Date().toISOString());
        return reqDate >= start && reqDate <= end;
      });
    }
    console.log('Nombre final de demandes affichées:', this.filteredRequests.length);
  }

  filterRequestsByDate() {
    this.filterRequests();
  }

  resetDateFilters() {
    this.startDate = '';
    this.endDate = '';
    this.filterRequests();
  }

  onStatusChange() {
    this.filterRequests();
  }

  onSearchChange() {
    this.filterRequests();
  }

  createNewRequest() {
    this.router.navigate(['/home/requests/new']);
  }

  viewDetails(id: string) {
    this.router.navigate(['/home/requests', id]);
  }

  deleteRequest(requestId: string): void {
    const request = this.requests.find(r => r.id === requestId);
    if (!request || request.status !== 'En attente') {
      this.snackBar.open('Seules les demandes en attente peuvent être supprimées.', 'Fermer', { duration: 3000 });
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) {
      this.requestsService.deleteRequest(requestId).subscribe({
        next: (success) => {
          if (success) {
            this.snackBar.open('Demande supprimée avec succès.', 'Fermer', { duration: 3000 });
            this.ngOnInit(); // Recharger les demandes
          } else {
            this.snackBar.open('Erreur lors de la suppression de la demande.', 'Fermer', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error deleting request:', error);
          this.snackBar.open('Erreur lors de la suppression de la demande.', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  editRequest(id: string, type: string) {
    // Normaliser le type pour les congés spéciaux et les prêts
    const normalizedType = type.toLowerCase();

    if (normalizedType.includes('congé')) {
      this.router.navigate(['/home/requests/leave/edit', id]);
    } else if (normalizedType.includes('formation')) {
      this.router.navigate(['/home/requests/training/edit', id]);
    } else if (normalizedType.includes('attestation')) {
      this.router.navigate(['/home/requests/certificate/edit', id]);
    } else if (normalizedType.includes('prêt')) {
      this.router.navigate(['/home/requests/loan/edit', id]);
    } else if (normalizedType.includes('avance')) {
      this.router.navigate(['/home/requests/advance/edit', id]);
    } else if (normalizedType.includes('document')) {
      this.router.navigate(['/home/requests/document/edit', id]);
    }
  }

  // Méthodes pour le chef
  approveAsChef(id: string) {
    const observation = prompt('Veuillez entrer une observation pour l\'admin:');
    if (observation !== null) {
      this.requestsService.updateRequestStatus(id, 'Chef approuvé', observation).subscribe(() => {
        this.ngOnInit(); // Recharger les demandes
      });
    }
  }

  rejectAsChef(id: string) {
    const observation = prompt('Veuillez entrer une observation pour l\'admin concernant ce rejet:');
    if (observation !== null) {
      this.requestsService.updateRequestStatus(id, 'Chef rejeté', observation).subscribe(() => {
        this.ngOnInit(); // Recharger les demandes
      });
    }
  }

  // Méthodes pour l'admin
  approveAsAdmin(id: string) {
    const response = prompt('Veuillez entrer une réponse finale:');
    if (response !== null) {
      this.requestsService.updateRequestStatus(id, 'Approuvée', response).subscribe(() => {
        this.ngOnInit(); // Recharger les demandes
      });
    }
  }

  rejectAsAdmin(id: string) {
    const response = prompt('Veuillez entrer une réponse finale concernant ce rejet:');
    if (response !== null) {
      this.requestsService.updateRequestStatus(id, 'Rejetée', response).subscribe(() => {
        this.ngOnInit(); // Recharger les demandes
      });
    }
  }
}






