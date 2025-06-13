import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user.service';
import { RequestsService } from '../../home/requests/requests.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chef-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chef-profile.component.html',
  styleUrls: ['./chef-profile.component.scss']
})
export class ChefProfileComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  users: any[] = [];
  filteredUsers: any[] = [];
  requests: any[] = [];

  // Filters
  searchTerm: string = '';
  currentFilter: string = 'all';

  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private requestsService: RequestsService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
    this.loadRequests();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Load current user
  loadCurrentUser(): void {
    this.subscriptions.add(
      this.authService.currentUser.subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  // Load all users (read-only)
  loadUsers(): void {
    this.subscriptions.add(
      this.userService.getAllUsers().subscribe(users => {
        this.users = users;
        this.filteredUsers = users;
      })
    );
  }

  // Load requests for statistics
  loadRequests(): void {
    this.subscriptions.add(
      this.requestsService.getRequests().subscribe(requests => {
        // Filter only congé and formation requests for chef
        this.requests = requests.filter(request => {
          const type = (request.type || '').toLowerCase();
          return type.includes('congé') || type.includes('conge') || type.includes('formation');
        });
      })
    );
  }

  // Filter users by search term
  filterUsers(): void {
    this.applyFilters();
  }

  // Filter users by role
  filterByRole(role: string): void {
    this.currentFilter = role;
    this.applyFilters();
  }

  // Apply all filters
  applyFilters(): void {
    let filtered = [...this.users];

    // Filter by role
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(user => user.role === this.currentFilter);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.firstname?.toLowerCase().includes(term) ||
        user.lastname?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    }

    this.filteredUsers = filtered;
  }

  // Clear all filters
  clearFilters(): void {
    this.searchTerm = '';
    this.currentFilter = 'all';
    this.filteredUsers = [...this.users];
  }

  // Role helper methods
  getRoleClass(role: string): string {
    switch (role) {
      case 'admin': return 'admin-role';
      case 'chef': return 'chef-role';
      case 'user': return 'user-role';
      default: return 'user-role';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin': return 'fa-user-shield';
      case 'chef': return 'fa-user-tie';
      case 'user': return 'fa-user';
      default: return 'fa-user';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'chef': return 'Chef d\'équipe';
      case 'user': return 'Utilisateur';
      default: return 'Utilisateur';
    }
  }

  // Statistics methods
  getTotalUsers(): number {
    return this.users.length;
  }

  getTotalRequests(): number {
    return this.requests.length;
  }

  getPendingRequests(): number {
    return this.requests.filter(r => {
      const status = r.status?.toLowerCase() || '';
      return status.includes('attente') || status === 'pending';
    }).length;
  }
}
