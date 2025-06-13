import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
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
  saveSuccess: boolean = false;
  saveError: boolean = false;
  isAdmin: boolean = false;
  isChef: boolean = false;
  selectedUser: User | null = null;

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

  constructor(private authService: AuthService) {}

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
    // Le chef ne peut pas éditer, l'admin oui
    this.editMode = this.isAdmin;
  }

  clearSelectedUser() {
    this.selectedUser = null;
    this.editMode = false;
    this.editPersonalMode = false;
  }

  canEdit(): boolean {
    // Seul l'admin peut éditer, le chef est en lecture seule
    return this.isAdmin;
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

  toggleEditPersonalMode() {
    if (!this.canEdit()) return;
    this.editPersonalMode = !this.editPersonalMode;
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

  savePersonalInfo() {
    if (!this.canEdit()) return;

    const targetUser = this.selectedUser || this.user;
    if (targetUser) {
      this.authService.updateUserProfile(targetUser.id, {
        personalInfo: targetUser.personalInfo
      }).subscribe({
        next: (updatedUser) => {
          console.log('Personal info updated successfully:', updatedUser);
          this.saveSuccess = true;
          this.saveError = false;
          this.editPersonalMode = false;

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
          console.error('Error updating personal info:', error);
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

  cancelPersonalEdit() {
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
    this.editPersonalMode = false;
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
}