import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user.service';
import { ProfileService, PersonalInfo, ProfessionalInfo, CompleteProfile } from '../../services/profile.service';
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

  // Profile data from backend
  personalInfo: PersonalInfo | null = null;
  professionalInfo: ProfessionalInfo | null = null;
  completeProfile: CompleteProfile | null = null;

  // Filters
  searchTerm: string = '';
  currentFilter: string = 'all';

  // Loading states
  loadingProfile: boolean = false;
  savingPersonal: boolean = false;
  savingProfessional: boolean = false;

  // Edit modes
  editPersonalMode: boolean = false;
  editProfessionalMode: boolean = false;

  // Success/Error states
  saveSuccess: boolean = false;
  saveError: boolean = false;

  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private profileService: ProfileService,
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
        if (user) {
          this.currentUser = user;
          this.loadCompleteProfile(user.id);
        }
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

  // Load complete profile from backend
  loadCompleteProfile(userId: string | number): void {
    this.loadingProfile = true;
    this.profileService.getCompleteProfile(userId).subscribe({
      next: (profile) => {
        this.completeProfile = profile;
        this.personalInfo = profile.personalInfo;
        this.professionalInfo = profile.professionalInfo;
        this.loadingProfile = false;
        console.log('Complete profile loaded:', profile);
      },
      error: (error) => {
        console.error('Error loading complete profile:', error);
        this.loadingProfile = false;
        // Initialize empty profile data if not found
        this.initializeEmptyProfile();
      }
    });
  }

  // Initialize empty profile data
  initializeEmptyProfile(): void {
    this.personalInfo = {
      cin: '',
      date_of_birth: '1990-01-01',
      place_of_birth: '',
      nationality: '',
      marital_status: 'single',
      number_of_children: 0,
      address: '',
      city: '',
      country: '',
      phone: '',
      emergency_contact_name: '',
      emergency_contact_relationship: '',
      emergency_contact_phone: ''
    };

    this.professionalInfo = {
      employee_id: '',
      department: '',
      position: '',
      grade: '',
      hire_date: '',
      contract_type: 'CDI',
      salary: 0,
      rib: '',
      bank_name: '',
      cnss: '',
      mutuelle: ''
    };
  }

  // Format date for display
  formatDateForDisplay(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // Get marital status label
  getMaritalStatusLabel(status: string): string {
    switch (status) {
      case 'single': return 'Célibataire';
      case 'married': return 'Marié(e)';
      case 'divorced': return 'Divorcé(e)';
      case 'widowed': return 'Veuf/Veuve';
      default: return status;
    }
  }

  // Get contract type label
  getContractTypeLabel(type: string): string {
    switch (type) {
      case 'CDI': return 'CDI';
      case 'CDD': return 'CDD';
      case 'Stage': return 'Stage';
      case 'Freelance': return 'Freelance';
      default: return type;
    }
  }

  // Toggle edit modes
  toggleEditPersonalMode(): void {
    this.editPersonalMode = !this.editPersonalMode;
  }

  toggleEditProfessionalMode(): void {
    this.editProfessionalMode = !this.editProfessionalMode;
  }

  // Save personal information
  savePersonalInfo(): void {
    if (!this.personalInfo || !this.currentUser) return;

    this.savingPersonal = true;
    this.profileService.updatePersonalInfo(this.currentUser.id, this.personalInfo).subscribe({
      next: (response) => {
        console.log('Personal info updated successfully:', response);
        this.personalInfo = response.personalInfo;
        this.saveSuccess = true;
        this.saveError = false;
        this.editPersonalMode = false;
        this.savingPersonal = false;

        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating personal info:', error);
        this.saveError = true;
        this.saveSuccess = false;
        this.savingPersonal = false;
      }
    });
  }

  // Save professional information
  saveProfessionalInfo(): void {
    if (!this.professionalInfo || !this.currentUser) return;

    this.savingProfessional = true;
    this.profileService.updateProfessionalInfo(this.currentUser.id, this.professionalInfo).subscribe({
      next: (response) => {
        console.log('Professional info updated successfully:', response);
        this.professionalInfo = response.professionalInfo;
        this.saveSuccess = true;
        this.saveError = false;
        this.editProfessionalMode = false;
        this.savingProfessional = false;

        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating professional info:', error);
        this.saveError = true;
        this.saveSuccess = false;
        this.savingProfessional = false;
      }
    });
  }

  // Cancel personal edit
  cancelPersonalEdit(): void {
    if (this.currentUser) {
      this.loadCompleteProfile(this.currentUser.id);
    }
    this.editPersonalMode = false;
    this.saveError = false;
    this.saveSuccess = false;
  }

  // Cancel professional edit
  cancelProfessionalEdit(): void {
    if (this.currentUser) {
      this.loadCompleteProfile(this.currentUser.id);
    }
    this.editProfessionalMode = false;
    this.saveError = false;
    this.saveSuccess = false;
  }
}
