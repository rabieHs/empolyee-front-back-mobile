import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../auth/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  user_id: number;
  is_read: boolean;
  created_at: string;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = environment.apiUrl;
  private socket: Socket = {} as Socket;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeService();
  }

  private initializeService(): void {
    // Load notifications when user is authenticated
    this.authService.currentUser.subscribe((user: any) => {
      if (user) {
        this.loadNotifications();
        this.initializeWebSocket();
      } else {
        this.clearNotifications();
        this.disconnectWebSocket();
      }
    });
  }

  // Add notification via API
  addNotification(notification: any): Observable<any> {
    return this.http.post(`${this.API_URL}/notifications`, notification);
  }

  // Load notifications from API
  loadNotifications(): void {
    this.http.get<Notification[]>(`${this.API_URL}/notifications`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error loading notifications:', error);
        return throwError(error);
      })
    ).subscribe(notifications => {
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount();
    });
  }

  // Load unread notifications from API
  loadUnreadNotifications(): void {
    this.http.get<Notification[]>(`${this.API_URL}/notifications/unread`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error loading unread notifications:', error);
        return throwError(error);
      })
    ).subscribe(notifications => {
      // Merge with existing notifications, avoiding duplicates
      const currentNotifications = this.notificationsSubject.value;
      const currentIds = currentNotifications.map(n => n.id);
      const newNotifications = notifications.filter(n => !currentIds.includes(n.id));

      if (newNotifications.length > 0) {
        const updated = [...newNotifications, ...currentNotifications];
        this.notificationsSubject.next(updated);
        this.updateUnreadCount();
      }
    });
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:3002', {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      this.socket.on('notification', (notification: Notification) => {
        console.log('New notification received:', notification);
        this.addNotificationToLocal(notification);
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected successfully');
        const user = this.authService.currentUserValue;
        if (user) {
          this.socket.emit('authenticate', {
            userId: user.id,
            role: user.role
          });
        }
      });
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }

  private disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  private clearNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  // Add notification to local state (for real-time updates)
  private addNotificationToLocal(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const newNotifications = [notification, ...currentNotifications];

    this.notificationsSubject.next(newNotifications);
    this.updateUnreadCount();
  }

  // Get all notifications
  public getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  // Delete all notifications (local only - for UI purposes)
  deleteAllNotifications(): void {
    this.notificationsSubject.next([]);
    this.updateUnreadCount();
  }

  // Mark notification as read via API
  markAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.API_URL}/notifications/${notificationId}/read`, {}, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Update local state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(notification => {
          if (notification.id === notificationId) {
            return { ...notification, is_read: true };
          }
          return notification;
        });

        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
      }),
      catchError(error => {
        console.error('Error marking notification as read:', error);
        return throwError(error);
      })
    );
  }

  // Mark all notifications as read via API
  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.API_URL}/notifications/read-all`, {}, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Update local state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(notification => {
          return { ...notification, is_read: true };
        });

        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
      }),
      catchError(error => {
        console.error('Error marking all notifications as read:', error);
        return throwError(error);
      })
    );
  }

  // Delete notification via API
  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/notifications/${notificationId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Update local state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.filter(
          notification => notification.id !== notificationId
        );

        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
      }),
      catchError(error => {
        console.error('Error deleting notification:', error);
        return throwError(error);
      })
    );
  }

  // Update unread count
  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(
      notification => !notification.is_read
    ).length;

    this.unreadCountSubject.next(unreadCount);
  }

  // Cleanup resources
  public cleanup(): void {
    this.disconnectWebSocket();
  }

  // Disconnect WebSocket
  disconnect(): void {
    this.disconnectWebSocket();
  }
}
