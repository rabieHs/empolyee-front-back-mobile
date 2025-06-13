import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestsService } from '../../home/requests/requests.service';
import { AuthService } from '../../auth/auth.service';
import { Request } from '../../models/request.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-demandes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-demandes.component.html',
  styleUrls: ['./admin-demandes.component.scss']
})
export class AdminDemandesComponent implements OnInit, OnDestroy {
  requests: Request[] = [];
  filteredRequests: Request[] = [];
  currentFilter: string = 'all';

  // Date filters
  startDate: string = '';
  endDate: string = '';
  searchTerm: string = '';

  // Modal data
  selectedRequest: Request | null = null;
  showRequestDetails: boolean = false;
  adminResponse: string = '';

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

  // Load requests
  loadRequests(): void {
    this.subscriptions.add(
      this.requestsService.getRequests().subscribe(requests => {
        this.requests = requests;
        this.filteredRequests = requests;
      })
    );
  }

  // Filter requests
  filterRequests(filter: string): void {
    this.currentFilter = filter;
    let filtered = [...this.requests];

    // Filter by status
    switch (filter) {
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
        (r.user?.lastname?.toLowerCase().includes(term) || r.lastname?.toLowerCase().includes(term)) ||
        r.type?.toLowerCase().includes(term)
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
        this.filterRequests(this.currentFilter);
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
    this.filterRequests(this.currentFilter);
  }

  // Clear all filters
  clearAllFilters(): void {
    this.currentFilter = 'all';
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
          'Approuvée',
          this.adminResponse || 'Approuvé par l\'administrateur'
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
          'Rejetée',
          this.adminResponse || 'Rejeté par l\'administrateur'
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
    this.adminResponse = '';
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
    const typeMap: { [key: string]: string } = {
      'congé': 'fa-calendar-alt',
      'formation': 'fa-graduation-cap',
      'document': 'fa-file-alt',
      'avance': 'fa-money-bill',
      'prêt': 'fa-handshake',
      'autre': 'fa-question-circle'
    };

    const normalizedType = type?.toLowerCase() || '';
    for (const key in typeMap) {
      if (normalizedType.includes(key)) {
        return typeMap[key];
      }
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
