import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestsService } from '../../home/requests/requests.service';
import { AuthService } from '../../auth/auth.service';
import { Request } from '../../models/request.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-administration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-administration.component.html',
  styleUrls: ['./admin-administration.component.scss']
})
export class AdminAdministrationComponent implements OnInit, OnDestroy {
  requests: Request[] = [];

  // Calendar data
  weekDays: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  months: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  currentMonth: Date = new Date();
  calendarDays: number[] = [];
  requestsByDay: Map<number, Request[]> = new Map<number, Request[]>();

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
    this.initializeCalendar();
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
        this.filterRequestsForCurrentMonth();
      })
    );
  }

  // Calendar methods
  initializeCalendar(): void {
    this.calendarDays = [];
    this.requestsByDay.clear();

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty days for alignment
    for (let i = 0; i < firstDay; i++) {
      this.calendarDays.push(0);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      this.calendarDays.push(i);
    }
  }

  filterRequestsForCurrentMonth(): void {
    const currentYear = this.currentMonth.getFullYear();
    const currentMonthIndex = this.currentMonth.getMonth();
    this.requestsByDay.clear();

    this.requests.forEach(request => {
      // Try multiple date fields and formats
      let requestDate: Date | null = null;

      if (request.createdAt) {
        requestDate = new Date(request.createdAt);
      } else if (request.start_date) {
        requestDate = new Date(request.start_date);
      } else if (request.date) {
        requestDate = new Date(request.date);
      }

      // Validate the date
      if (requestDate && !isNaN(requestDate.getTime())) {
        if (requestDate.getFullYear() === currentYear && requestDate.getMonth() === currentMonthIndex) {
          const day = requestDate.getDate();
          if (!this.requestsByDay.has(day)) {
            this.requestsByDay.set(day, []);
          }
          this.requestsByDay.get(day)?.push(request);
        }
      }
    });
  }

  getRequestsForDay(day: number): Request[] {
    return this.requestsByDay.get(day) || [];
  }

  changeMonth(increment: number): void {
    const newMonth = new Date(this.currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    this.currentMonth = newMonth;
    this.initializeCalendar();
    this.filterRequestsForCurrentMonth();
  }

  getCurrentMonthName(): string {
    const monthIndex = this.currentMonth.getMonth();
    const year = this.currentMonth.getFullYear();
    return `${this.months[monthIndex]} ${year}`;
  }

  // Request actions
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

  /**
   * Get count of requests by type
   * @param type Request type to count
   * @returns Number of requests of that type
   */
  getRequestCountByType(type: string): number {
    return this.requests.filter(request => {
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
    return this.requests.filter(request => {
      const requestStatus = (request.status || '').toLowerCase();
      const searchStatus = status.toLowerCase();
      return requestStatus.includes(searchStatus);
    }).length;
  }
}
