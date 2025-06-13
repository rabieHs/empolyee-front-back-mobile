import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { UserService, UserProfile } from '../../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss']
})
export class AdminProfileComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  users: UserProfile[] = [];
  isAdmin: boolean = false;
  isChef: boolean = false;

  // Edit mode states
  editingProfile: boolean = false;
  editingUser: UserProfile | null = null;

  // Form data
  profileForm = {
    firstname: '',
    lastname: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  userEditForm = {
    firstname: '',
    lastname: '',
    email: '',
    role: '',
    department: '',
    newPassword: ''
  };

  private subscriptions = new Subscription();
  loading = false;
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.currentUser.subscribe(user => {
        if (user) {
          this.currentUser = user;
          this.isAdmin = this.authService.isAdmin();
          this.isChef = this.authService.isChef();

          // Initialize profile form
          this.profileForm.firstname = user.firstName || '';
          this.profileForm.lastname = user.lastName || '';
          this.profileForm.email = user.email || '';

          // Load users list if admin or chef
          if (this.isAdmin || this.isChef) {
            this.loadUsers();
          }
        } else {
          this.router.navigate(['/login']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load all users (admin and chef)
   */
  loadUsers(): void {
    // Allow both admin and chef to load users
    if (!this.isAdmin && !this.isChef) return;

    console.log('👥 Loading users... Current user role:', this.currentUser?.role);
    this.loading = true;
    this.subscriptions.add(
      this.userService.getAllUsers().subscribe({
        next: (users) => {
          this.users = users;
          this.loading = false;
          console.log('👥 Loaded users:', users);
          console.log('👥 Users count:', users.length);
        },
        error: (error) => {
          console.error('❌ Error loading users:', error);
          console.error('❌ Error details:', error.error);
          console.error('❌ Error status:', error.status);
          this.showMessage('Erreur lors du chargement des utilisateurs', 'error');
          this.loading = false;
        }
      })
    );
  }

  /**
   * Start editing profile
   */
  startEditingProfile(): void {
    this.editingProfile = true;
    this.profileForm.firstname = this.currentUser.firstname || '';
    this.profileForm.lastname = this.currentUser.lastname || '';
    this.profileForm.email = this.currentUser.email || '';
    this.profileForm.currentPassword = '';
    this.profileForm.newPassword = '';
    this.profileForm.confirmPassword = '';
  }

  /**
   * Cancel profile editing
   */
  cancelEditingProfile(): void {
    this.editingProfile = false;
    this.profileForm.currentPassword = '';
    this.profileForm.newPassword = '';
    this.profileForm.confirmPassword = '';
  }

  /**
   * Save profile changes
   */
  saveProfile(): void {
    if (this.profileForm.newPassword && this.profileForm.newPassword !== this.profileForm.confirmPassword) {
      this.showMessage('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    this.loading = true;
    const updateData: any = {
      firstname: this.profileForm.firstname,
      lastname: this.profileForm.lastname,
      email: this.profileForm.email
    };

    if (this.profileForm.newPassword) {
      updateData.currentPassword = this.profileForm.currentPassword;
      updateData.newPassword = this.profileForm.newPassword;
    }

    this.subscriptions.add(
      this.userService.updateProfile(updateData).subscribe({
        next: (response) => {
          this.showMessage('Profil mis à jour avec succès', 'success');
          this.editingProfile = false;
          this.loading = false;

          // Update current user data locally
          this.currentUser.firstName = this.profileForm.firstname;
          this.currentUser.lastName = this.profileForm.lastname;
          this.currentUser.email = this.profileForm.email;
        },
        error: (error) => {
          console.error('❌ Error updating profile:', error);
          this.showMessage('Erreur lors de la mise à jour du profil', 'error');
          this.loading = false;
        }
      })
    );
  }

  /**
   * Start editing a user (admin only)
   */
  startEditingUser(user: UserProfile): void {
    if (!this.isAdmin) return;

    this.editingUser = user;
    this.userEditForm.firstname = user.firstname;
    this.userEditForm.lastname = user.lastname;
    this.userEditForm.email = user.email;
    this.userEditForm.role = user.role;
    this.userEditForm.department = user.department_id?.toString() || '';
    this.userEditForm.newPassword = '';
  }

  /**
   * Cancel user editing
   */
  cancelEditingUser(): void {
    this.editingUser = null;
    this.userEditForm = {
      firstname: '',
      lastname: '',
      email: '',
      role: '',
      department: '',
      newPassword: ''
    };
  }

  /**
   * Save user changes (admin only)
   */
  saveUser(): void {
    if (!this.isAdmin || !this.editingUser) return;

    this.loading = true;
    const updateData: any = {
      firstname: this.userEditForm.firstname,
      lastname: this.userEditForm.lastname,
      email: this.userEditForm.email,
      role: this.userEditForm.role,
      department_id: this.userEditForm.department ? Number(this.userEditForm.department) : null
    };

    if (this.userEditForm.newPassword) {
      updateData.newPassword = this.userEditForm.newPassword;
    }

    console.log('📤 Frontend sending update data:', updateData);
    console.log('📤 User ID:', this.editingUser.id);

    this.subscriptions.add(
      this.userService.updateUser(Number(this.editingUser.id), updateData).subscribe({
        next: (response) => {
          this.showMessage('Utilisateur mis à jour avec succès', 'success');
          this.editingUser = null;
          this.loading = false;
          this.loadUsers(); // Reload users list
        },
        error: (error) => {
          console.error('❌ Error updating user:', error);
          this.showMessage('Erreur lors de la mise à jour de l\'utilisateur', 'error');
          this.loading = false;
        }
      })
    );
  }

  /**
   * Delete a user (admin only)
   */
  deleteUser(user: UserProfile): void {
    if (!this.isAdmin) return;

    if (user.id === this.currentUser.id) {
      this.showMessage('Vous ne pouvez pas supprimer votre propre compte', 'error');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.firstname} ${user.lastname} ?`)) {
      this.loading = true;
      this.subscriptions.add(
        this.userService.deleteUser(Number(user.id)).subscribe({
          next: (response) => {
            this.showMessage('Utilisateur supprimé avec succès', 'success');
            this.loading = false;
            this.loadUsers(); // Reload users list
          },
          error: (error) => {
            console.error('❌ Error deleting user:', error);
            this.showMessage('Erreur lors de la suppression de l\'utilisateur', 'error');
            this.loading = false;
          }
        })
      );
    }
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'chef': return 'Chef';
      case 'user': return 'Employé';
      default: return role;
    }
  }

  /**
   * Get role badge class
   */
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'badge-admin';
      case 'chef': return 'badge-chef';
      case 'user': return 'badge-user';
      default: return 'badge-default';
    }
  }

  /**
   * Show message to user
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  /**
   * Go back to dashboard
   */
  goBack(): void {
    if (this.isAdmin) {
      this.router.navigate(['/admin']);
    } else if (this.isChef) {
      this.router.navigate(['/chef']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
