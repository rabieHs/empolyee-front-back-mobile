import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;

  currentUserId: string | null = null;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // S'abonner aux notifications
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.filterNotifications();
      console.log('Notifications filtrées:', this.filteredNotifications);
    });

    // Subscribe to unread count
    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });

    // Afficher les informations de l'utilisateur actuel pour le débogage
    console.log('Utilisateur actuel:', this.authService.currentUserValue);
    console.log('Est admin:', this.authService.isAdmin());
    console.log('Est chef:', this.authService.isChef());
  }

  // Filter notifications for current user (API already filters by user)
  private filterNotifications(): void {
    // Since API already returns user-specific notifications, we can use all notifications
    this.filteredNotifications = this.notifications;
  }



  // Afficher/masquer le panneau de notifications
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  // Mark notification as read via API
  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        console.log('Notification marked as read');
        // Navigate to link if available
        if (notification.link) {
          this.router.navigateByUrl(notification.link);
          this.showNotifications = false;
        }
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  // Mark all notifications as read via API
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        console.log('All notifications marked as read');
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  // Delete notification via API
  deleteNotification(event: Event, notificationId: number): void {
    // Prevent event propagation
    event.stopPropagation();

    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        console.log('Notification deleted');
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
      }
    });
  }

  // Format date for display
  formatDate(dateString: string): string {
    if (!dateString) return '';

    const dateObj = new Date(dateString);
    const now = new Date();

    // If today, show time or elapsed time
    if (dateObj.toDateString() === now.toDateString()) {
      // Calculate difference in minutes
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.round(diffMs / 60000);

      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Il y a ${diffHours} h`;

      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Calculate days difference
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return `Il y a ${diffDays} j`;

    // Standard date format for older dates
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
