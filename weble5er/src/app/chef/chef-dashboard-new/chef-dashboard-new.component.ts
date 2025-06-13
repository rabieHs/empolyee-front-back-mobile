import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RequestsService } from '../../home/requests/requests.service';
import { AuthService } from '../../auth/auth.service';
import { Request } from '../../models/request.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chef-dashboard-new',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chef-dashboard-new.component.html',
  styleUrls: ['./chef-dashboard-new.component.scss']
})
export class ChefDashboardNewComponent implements OnInit, OnDestroy {
  requests: Request[] = [];
  recentRequests: Request[] = [];
  currentUser: any = null;
  
  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private requestsService: RequestsService,
    private authService: AuthService
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

  // Load data
  loadData(): void {
    this.subscriptions.add(
      this.requestsService.getRequests().subscribe(allRequests => {
        // Filter only congé and formation requests for chef
        this.requests = allRequests.filter(request => {
          const type = (request.type || '').toLowerCase();
          return type.includes('congé') || type.includes('conge') || type.includes('formation');
        });
        
        // Get recent requests (last 5)
        this.recentRequests = this.requests
          .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
          .slice(0, 5);
      })
    );
  }

  // Dashboard stats getters
  get totalRequests(): number {
    return this.requests.length;
  }

  get pendingRequests(): number {
    return this.requests.filter(r => {
      const status = r.status?.toLowerCase() || '';
      return status.includes('attente') || status === 'pending';
    }).length;
  }

  get approvedRequests(): number {
    return this.requests.filter(r => r.status?.toLowerCase().includes('approuv')).length;
  }

  get rejectedRequests(): number {
    return this.requests.filter(r => r.status?.toLowerCase().includes('rejet')).length;
  }

  // Status class helper
  getStatusClass(status: string): string {
    const normalizedStatus = status?.toLowerCase() || '';
    if (normalizedStatus.includes('approuv')) return 'status-approved';
    if (normalizedStatus.includes('rejet')) return 'status-rejected';
    if (normalizedStatus.includes('attente') || normalizedStatus === 'pending') return 'status-pending';
    return 'status-pending';
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
