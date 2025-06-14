import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { ProfileService, PersonalInfo, ProfessionalInfo, CompleteProfile } from '../../services/profile.service';
import { User } from '../../models/user.model';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  registeredUsers: User[] = [];
  filteredUsers: User[] = [];
  requests: any[] = []; // Propriété pour stocker les demandes
  editMode: boolean = false;
  editPersonalMode: boolean = false;
  editProfessionalMode: boolean = false;
  saveSuccess: boolean = false;
  saveError: boolean = false;
  isAdmin: boolean = false;
  isChef: boolean = false;
  selectedUser: User | null = null;

  // Profile data from backend
  personalInfo: PersonalInfo | null = null;
  professionalInfo: ProfessionalInfo | null = null;
  completeProfile: CompleteProfile | null = null;

  // Loading states
  loadingPersonal: boolean = false;
  loadingProfessional: boolean = false;
  savingPersonal: boolean = false;
  savingProfessional: boolean = false;

  maritalStatusOptions = [
    { value: 'single', label: 'Célibataire' },
    { value: 'married', label: 'Marié(e)' },
    { value: 'divorced', label: 'Divorcé(e)' },
    { value: 'widowed', label: 'Veuf/Veuve' }
  ];

  contractTypeOptions = [
    { value: 'cdi', label: 'CDI' },
    { value: 'cdd', label: 'CDD' },
    { value: 'internship', label: 'Stage' },
    { value: 'temporary', label: 'Intérim' }
  ];

  constructor(
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  private initializeUserInfo(user: User) {
    // Initialize personalInfo if it doesn't exist
    if (!user.personalInfo) {
      user.personalInfo = {
        cin: '',
        dateOfBirth: '',
        placeOfBirth: '',
        nationality: '',
        maritalStatus: 'single',
        numberOfChildren: 0,
        address: '',
        city: '',
        country: '',
        phoneNumber: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phoneNumber: ''
        }
      };
    }

    // Initialize professionalInfo if it doesn't exist
    if (!user.professionalInfo) {
      user.professionalInfo = {
        employeeId: '',
        department: '',
        position: '',
        grade: '',
        joinDate: '',
        contractType: 'CDI',
        salary: 0,
        rib: '',
        bankName: '',
        cnss: '',
        mutuelle: ''
      };
    }
  }

  private loadAllNonAdminUsers() {
    this.authService.getAllNonAdminUsers().subscribe({
      next: (users) => {
        this.registeredUsers = users;
        this.filteredUsers = [...this.registeredUsers];
        console.log('Loaded users:', users);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // Fallback to empty array
        this.registeredUsers = [];
        this.filteredUsers = [];
      }
    });
  }

  ngOnInit() {
    // Suppression automatique de tous les chefs sauf chef@aya.com
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    // Supprime tous les comptes chef sauf chef@aya.com
    users = users.filter((u: any) => u.role !== 'chef' || u.email === 'chef@aya.com');
    localStorage.setItem('users', JSON.stringify(users));
    // if (this.authService && Array.isArray(this.authService['users'])) {
      // this.authService['users'] = users;
    // }
      this.user = this.authService.currentUserValue;
      this.isAdmin = this.user?.role === 'admin';
      this.isChef = this.user?.role === 'chef';

      // Initialize user info objects if they don't exist
      if (this.user) {
        this.initializeUserInfo(this.user);
        this.loadCompleteProfile(this.user.id);
      }

      if (this.isAdmin) {
          this.loadAllNonAdminUsers();
      } else if (this.isChef) {
          // Le chef voit la même liste que l'admin (tous sauf les admins)
          this.loadAllNonAdminUsers();
      }
      // Les demandes ne sont affichées que pour l'admin, ou adapte si besoin pour le chef
      if (this.isAdmin) {
        // this.requests = this.authService.getAllRequests();
        console.log('Demandes récupérées:', this.requests);
      }
  }

  selectUser(user: User) {
    this.selectedUser = user;
    // Initialize user info for selected user
    this.initializeUserInfo(user);
    // Load complete profile for selected user
    this.loadCompleteProfile(user.id);
    // Le chef ne peut pas éditer, l'admin oui
    this.editMode = this.isAdmin;
  }

  clearSelectedUser() {
    this.selectedUser = null;
    this.editMode = false;
    this.editPersonalMode = false;
  }

  canEdit(): boolean {
    // Users can edit their own profile, admins can edit any profile
    if (this.selectedUser) {
      // If viewing another user's profile, only admin can edit
      return this.isAdmin;
    } else {
      // If viewing own profile, all users can edit
      return true;
    }
  }

  onImageChange(event: any) {
    if (!this.canEdit()) return;

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const targetUser = this.selectedUser || this.user;
        if (targetUser) {
          targetUser.profileImage = e.target.result;
          this.authService.updateUserProfile(targetUser.id, { profileImage: targetUser.profileImage });
        }
      };

      reader.readAsDataURL(file);
    }
  }

  deleteProfileImage() {
    if (!this.canEdit()) return;

    const targetUser = this.selectedUser || this.user;
    if (targetUser) {
      targetUser.profileImage = '';
      this.authService.updateUserProfile(targetUser.id, { profileImage: '' });
    }
  }

  toggleEditMode() {
    if (!this.canEdit()) return;
    this.editMode = !this.editMode; // Toggle edit mode
  }

  saveProfile() {
    if (!this.canEdit()) return;

    const targetUser = this.selectedUser || this.user;
    if (targetUser) {
      this.authService.updateUserProfile(targetUser.id, targetUser).subscribe({
        next: (updatedUser) => {
          console.log('Profile updated successfully:', updatedUser);
          this.saveSuccess = true;
          this.saveError = false;
          this.editMode = false; // Disable edit mode after saving

          // Update the local user data
          if (this.selectedUser) {
            this.selectedUser = updatedUser;
          } else {
            this.user = updatedUser;
          }

          setTimeout(() => {
            this.saveSuccess = false;
          }, 3000);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.saveError = true;
          this.saveSuccess = false;
        }
      });
    }
  }

  cancelEdit() {
    const targetUser = this.selectedUser || this.user;
    if (targetUser) {
      this.authService.getUserById(targetUser.id).subscribe({
        next: (user: any) => {
          if (this.selectedUser) {
            this.selectedUser = user;
          } else {
            this.user = user;
          }
        },
        error: (error) => {
          console.error('Error fetching user data:', error);
        }
      });
    }
    this.editMode = false;
    this.saveError = false;
    this.saveSuccess = false;
  }

  formatDate(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  changePassword() {
    // Cette fonctionnalité sera implémentée plus tard
    console.log('Changing password...');
  }

  onSearch(searchTerm: string) {
    if (!searchTerm) {
      this.filteredUsers = [...this.registeredUsers];
      return;
    }
    const term = searchTerm.toLowerCase();
    this.filteredUsers = this.registeredUsers.filter(user =>
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
  }

  /**
   * Supprimer le compte utilisateur sélectionné
   * Cette fonction est réservée à l'administrateur
   */
  deleteSelectedUser() {
    if (!this.selectedUser || !this.isAdmin) {
      return;
    }

    // Confirmation avant suppression
    if (confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${this.selectedUser.firstName} ${this.selectedUser.lastName} (${this.selectedUser.email}) ?`)) {
      // Appel au service pour supprimer l'utilisateur
      this.authService.deleteUserAccount(this.selectedUser.id).subscribe({
        next: (response) => {
          console.log('User deleted successfully:', response);

          // Mettre à jour la liste des utilisateurs
          // Remove the deleted user from the local arrays
          this.registeredUsers = this.registeredUsers.filter(user => user.id !== this.selectedUser?.id);
          this.filteredUsers = [...this.registeredUsers];

          // Réinitialiser l'utilisateur sélectionné
          this.selectedUser = null;

          // Afficher un message de succès
          alert('Le compte utilisateur a été supprimé avec succès.');
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          // Afficher un message d'erreur
          alert('Impossible de supprimer ce compte utilisateur.');
        }
      });
    }
  }

  // Load complete profile from backend
  loadCompleteProfile(userId: string | number): void {
    this.profileService.getCompleteProfile(userId).subscribe({
      next: (profile) => {
        this.completeProfile = profile;
        this.personalInfo = profile.personalInfo;
        this.professionalInfo = profile.professionalInfo;
        console.log('Complete profile loaded:', profile);
      },
      error: (error) => {
        console.error('Error loading complete profile:', error);
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

  // Toggle edit modes
  toggleEditPersonalMode(): void {
    if (!this.canEdit()) return;
    this.editPersonalMode = !this.editPersonalMode;
  }

  toggleEditProfessionalMode(): void {
    if (!this.canEdit()) return;
    this.editProfessionalMode = !this.editProfessionalMode;
  }

  // Save personal information
  savePersonalInfo(): void {
    if (!this.canEdit() || !this.personalInfo) return;

    const targetUserId = this.selectedUser?.id || this.user?.id;
    if (!targetUserId) return;

    this.savingPersonal = true;
    this.profileService.updatePersonalInfo(targetUserId, this.personalInfo).subscribe({
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
    if (!this.canEdit() || !this.professionalInfo) return;

    const targetUserId = this.selectedUser?.id || this.user?.id;
    if (!targetUserId) return;

    this.savingProfessional = true;
    this.profileService.updateProfessionalInfo(targetUserId, this.professionalInfo).subscribe({
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
    const targetUserId = this.selectedUser?.id || this.user?.id;
    if (targetUserId) {
      this.loadCompleteProfile(targetUserId);
    }
    this.editPersonalMode = false;
    this.saveError = false;
    this.saveSuccess = false;
  }

  // Cancel professional edit
  cancelProfessionalEdit(): void {
    const targetUserId = this.selectedUser?.id || this.user?.id;
    if (targetUserId) {
      this.loadCompleteProfile(targetUserId);
    }
    this.editProfessionalMode = false;
    this.saveError = false;
    this.saveSuccess = false;
  }

  // Get current profile data for display
  getCurrentPersonalInfo(): PersonalInfo | null {
    return this.personalInfo;
  }

  getCurrentProfessionalInfo(): ProfessionalInfo | null {
    return this.professionalInfo;
  }

  // Format date for display
  formatDateForDisplay(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // Format date for input
  formatDateForInput(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
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
}