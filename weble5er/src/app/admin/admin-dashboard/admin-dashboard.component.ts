import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestsService } from '../../home/requests/requests.service';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user.service';
import { Request } from '../../models/request.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Current view state
  currentView: 'dashboard' | 'demandes' | 'calendar' = 'dashboard';

  // User data
  currentUser: any = null;
  totalUsers: number = 0;

  // Request data
  requests: Request[] = [];
  filteredRequests: Request[] = [];
  recentRequests: Request[] = [];
  currentFilter: string = 'all';

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
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Load current user
    this.subscriptions.add(
      this.authService.currentUser.subscribe(user => {
        if (user) {
          this.currentUser = user;
          this.loadData();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Load all data
  loadData(): void {
    this.loadRequests();
    this.loadUsers();
    if (this.currentView === 'calendar') {
      this.initializeCalendar();
    }
  }

  // Load requests
  loadRequests(): void {
    this.subscriptions.add(
      this.requestsService.getRequests().subscribe(requests => {
        this.requests = requests;
        this.filteredRequests = requests;
        this.recentRequests = requests.slice(0, 5); // Get 5 most recent
        this.filterRequestsForCurrentMonth();
      })
    );
  }

  // Load users count
  loadUsers(): void {
    this.subscriptions.add(
      this.authService.getAllUsers().subscribe(users => {
        this.totalUsers = users.length;
      })
    );
  }

  // Dashboard computed properties
  get totalRequests(): number {
    return this.requests.length;
  }

  get pendingRequests(): number {
    return this.requests.filter(r => r.status?.toLowerCase().includes('attente') || r.status?.toLowerCase() === 'pending').length;
  }

  get approvedRequests(): number {
    return this.requests.filter(r => r.status?.toLowerCase().includes('approuv')).length;
  }

  get rejectedRequests(): number {
    return this.requests.filter(r => r.status?.toLowerCase().includes('rejet')).length;
  }

  get processedRequests(): number {
    return this.requests.filter(r => r.status?.toLowerCase().includes('approuv') || r.status?.toLowerCase().includes('rejet')).length;
  }

  // Filter requests
  filterRequests(filter: string): void {
    this.currentFilter = filter;
    switch (filter) {
      case 'pending':
        this.filteredRequests = this.requests.filter(r => r.status?.toLowerCase().includes('attente') || r.status?.toLowerCase() === 'pending');
        break;
      case 'approved':
        this.filteredRequests = this.requests.filter(r => r.status?.toLowerCase().includes('approuv'));
        break;
      case 'rejected':
        this.filteredRequests = this.requests.filter(r => r.status?.toLowerCase().includes('rejet'));
        break;
      default:
        this.filteredRequests = this.requests;
    }
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
      const requestDate = new Date(request.createdAt || request.start_date || new Date());
      if (requestDate.getFullYear() === currentYear && requestDate.getMonth() === currentMonthIndex) {
        const day = requestDate.getDate();
        if (!this.requestsByDay.has(day)) {
          this.requestsByDay.set(day, []);
        }
        this.requestsByDay.get(day)?.push(request);
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

  isChefProcessed(request: Request): boolean {
    const status = request.status?.toLowerCase() || '';
    return status.includes('chef');
  }

  // Additional methods for template
  finalApproveRequest(request: Request): void {
    this.approveRequest(request);
  }

  finalRejectRequest(request: Request): void {
    this.rejectRequest(request);
  }

  approveRequestWithComment(request: Request): void {
    this.approveRequest(request);
  }

  rejectRequestWithComment(request: Request): void {
    this.rejectRequest(request);
  }

  finalApproveRequestWithComment(request: Request): void {
    this.approveRequest(request);
  }

  finalRejectRequestWithComment(request: Request): void {
    this.rejectRequest(request);
  }

  // Get current date for welcome message
  getCurrentDate(): string {
    const today = new Date();
    return today.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
