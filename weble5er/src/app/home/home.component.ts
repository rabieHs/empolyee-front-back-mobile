import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { User } from '../models/user.model';
import { NotificationsComponent } from '../shared/notifications/notifications.component';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Subscribe to user changes and redirect based on role
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;

      if (user) {
        console.log('HomeComponent - User loaded:', user);
        console.log('HomeComponent - User role:', user.role);

        // Redirect based on user role
        switch (user.role) {
          case 'admin':
            console.log('Redirecting admin to /admin');
            this.router.navigate(['/admin']);
            break;
          case 'chef':
            console.log('Redirecting chef to /chef');
            this.router.navigate(['/chef']);
            break;
          case 'user':
          default:
            console.log('User stays on /home');
            // Regular users stay on the home dashboard
            break;
        }
      } else {
        // No user, redirect to login
        console.log('No user found, redirecting to login');
        this.router.navigate(['/login']);
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }



  // Redirection vers la page de profil
  goToProfile() {
    this.router.navigate(['/home/profile']);
  }

  // Redirection vers la page du calendrier du chef
  goToCalendar() {
    // Naviguer vers la route du calendrier du chef
    this.router.navigate(['/chef']);
  }

  // Vérifier si l'utilisateur courant est un chef
  isChef(): boolean {
    return this.authService.isChef();
  }

  // Vérifier si l'utilisateur courant est un administrateur
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
