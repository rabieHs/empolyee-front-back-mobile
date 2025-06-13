import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestsService } from '../../home/requests/requests.service';
import { AuthService } from '../../auth/auth.service';
import { Request } from '../../models/request.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chef-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chef-demandes.component.html',
  styleUrls: ['./chef-demandes.component.scss']
})
export class ChefDemandesComponent implements OnInit, OnDestroy {
  requests: Request[] = [];
  filteredRequests: Request[] = [];
  currentFilter: string = 'all';
  currentTypeFilter: string = 'all';
  
  // Date filters
  startDate: string = '';
  endDate: string = '';
  searchTerm: string = '';
  
  // Modal data
  selectedRequest: Request | null = null;
  showRequestDetails: boolean = false;
  chefResponse: string = '';
  
  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private requestsService: RequestsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Load requests - only congé and formation
  loadRequests(): void {
    this.subscriptions.add(
      this.requestsService.getRequests().subscribe(allRequests => {
        // Filter only congé and formation requests
        this.requests = allRequests.filter(request => {
          const type = (request.type || '').toLowerCase();
          return type.includes('congé') || type.includes('conge') || type.includes('formation');
        });
        this.filteredRequests = this.requests;
      })
    );
  }

  // Filter by type (congé/formation)
  filterByType(type: string): void {
    this.currentTypeFilter = type;
    this.applyAllFilters();
  }

  // Filter requests by status
  filterRequests(filter: string): void {
    this.currentFilter = filter;
    this.applyAllFilters();
  }

  // Apply all filters
  applyAllFilters(): void {
    let filtered = [...this.requests];
    
    // Filter by type
    if (this.currentTypeFilter !== 'all') {
      filtered = filtered.filter(r => {
        const type = (r.type || '').toLowerCase();
        if (this.currentTypeFilter === 'conge') {
          return type.includes('congé') || type.includes('conge');
        } else if (this.currentTypeFilter === 'formation') {
          return type.includes('formation');
        }
        return true;
      });
    }
    
    // Filter by status
    switch (this.currentFilter) {
      case 'pending':
        filtered = filtered.filter(r => r.status?.toLowerCase().includes('attente') || r.status?.toLowerCase() === 'pending');
        break;
      case 'approved':
        filtered = filtered.filter(r => r.status?.toLowerCase().includes('approuv'));
        break;
      case 'rejected':
        filtered = filtered.filter(r => r.status?.toLowerCase().includes('rejet'));
        break;
      default:
        // Show all
        break;
    }
    
    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(r => 
        (r.user?.firstname?.toLowerCase().includes(term) || r.firstname?.toLowerCase().includes(term)) ||
        (r.user?.lastname?.toLowerCase().includes(term) || r.lastname?.toLowerCase().includes(term))
      );
    }
    
    // Filter by date range
    if (this.startDate || this.endDate) {
      filtered = this.filterByDateRange(filtered);
    }
    
    this.filteredRequests = filtered;
  }
  
  // Filter by date range
  filterByDateRange(requestsToFilter?: Request[]): Request[] {
    const requests = requestsToFilter || [...this.requests];
    
    if (!this.startDate && !this.endDate) {
      if (!requestsToFilter) {
        this.applyAllFilters();
      }
      return requests;
    }
    
    const filtered = requests.filter(request => {
      const requestDate = new Date(request.createdAt || new Date());
      const start = this.startDate ? new Date(this.startDate) : null;
      const end = this.endDate ? new Date(this.endDate) : null;
      
      if (start && end) {
        return requestDate >= start && requestDate <= end;
      } else if (start) {
        return requestDate >= start;
      } else if (end) {
        return requestDate <= end;
      }
      
      return true;
    });
    
    if (!requestsToFilter) {
      this.filteredRequests = filtered;
    }
    
    return filtered;
  }
  
  // Clear date filter
  clearDateFilter(): void {
    this.startDate = '';
    this.endDate = '';
    this.applyAllFilters();
  }
  
  // Clear all filters
  clearAllFilters(): void {
    this.currentFilter = 'all';
    this.currentTypeFilter = 'all';
    this.startDate = '';
    this.endDate = '';
    this.searchTerm = '';
    this.filteredRequests = [...this.requests];
  }

  // Request actions
  canApprove(request: Request): boolean {
    const status = request.status?.toLowerCase() || '';
    return status.includes('attente') || status === 'pending';
  }

  canReject(request: Request): boolean {
    const status = request.status?.toLowerCase() || '';
    return status.includes('attente') || status === 'pending';
  }

  approveRequest(request: Request): void {
    if (request.id) {
      this.subscriptions.add(
        this.requestsService.updateRequestStatus(
          String(request.id),
          'Chef approuvé',
          this.chefResponse || 'Approuvé par le chef'
        ).subscribe(() => {
          this.loadRequests();
          this.closeRequestDetails();
        })
      );
    }
  }

  rejectRequest(request: Request): void {
    if (request.id) {
      this.subscriptions.add(
        this.requestsService.updateRequestStatus(
          String(request.id),
          'Chef rejeté',
          this.chefResponse || 'Rejeté par le chef'
        ).subscribe(() => {
          this.loadRequests();
          this.closeRequestDetails();
        })
      );
    }
  }

  // Request details modal
  viewRequestDetails(request: Request): void {
    this.selectedRequest = request;
    this.showRequestDetails = true;
  }

  closeRequestDetails(): void {
    this.selectedRequest = null;
    this.showRequestDetails = false;
    this.chefResponse = '';
  }

  // Status class helper
  getStatusClass(status: string): string {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus.includes('approuv')) return 'status-approved';
    if (normalizedStatus.includes('rejet')) return 'status-rejected';
    if (normalizedStatus.includes('attente') || normalizedStatus === 'pending') return 'status-pending';
    return 'status-pending';
  }

  // Helper methods for modal
  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isRequestPending(request: Request): boolean {
    const status = request.status?.toLowerCase() || '';
    return status.includes('attente') || status === 'pending';
  }
  
  // UI Helper methods
  trackByRequestId(index: number, request: Request): any {
    return request.id;
  }
  
  getTypeIcon(type: string): string {
    const normalizedType = type?.toLowerCase() || '';
    if (normalizedType.includes('congé') || normalizedType.includes('conge')) {
      return 'fa-calendar-alt';
    } else if (normalizedType.includes('formation')) {
      return 'fa-graduation-cap';
    }
    return 'fa-file';
  }
  
  getStatusIcon(status: string): string {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus.includes('approuv')) return 'fa-check-circle';
    if (normalizedStatus.includes('rejet')) return 'fa-times-circle';
    if (normalizedStatus.includes('attente') || normalizedStatus === 'pending') return 'fa-clock';
    return 'fa-question-circle';
  }
}
