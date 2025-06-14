import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, PersonalInfo, ProfessionalInfo } from '../models/user.model';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize current user from localStorage if available
    let currentUser = null;
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem(this.USER_KEY);
      currentUser = storedUser ? JSON.parse(storedUser) : null;
    }

    this.currentUserSubject = new BehaviorSubject<User | null>(currentUser);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Login via API
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          if (response.token && response.user) {
            this.setSession(response.token, response.user);
            this.navigateBasedOnRole(response.user.role);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(error);
        })
      );
  }

  // Register via API
  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/register`, userData)
      .pipe(
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(error);
        })
      );
  }

  // Forgot password via API
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/forgot-password`, { email })
      .pipe(
        catchError(error => {
          console.error('Forgot password error:', error);
          return throwError(error);
        })
      );
  }

  // Reset password via API
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/reset-password`, { token, password })
      .pipe(
        catchError(error => {
          console.error('Reset password error:', error);
          return throwError(error);
        })
      );
  }

  // Set session data
  private setSession(token: string, user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  // Navigate based on user role
  private navigateBasedOnRole(role: string): void {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'chef':
        this.router.navigate(['/chef']);
        break;
      case 'user':
      default:
        this.router.navigate(['/home']);
        break;
    }
  }

  // Get authentication token
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem(this.TOKEN_KEY);
      if (token && this.isTokenExpired(token)) {
        this.logout();
        return null;
      }
      return token;
    }
    return null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true; // If we can't decode the token, consider it expired
    }
  }

  // Get authentication headers
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  logout(): void {
    // Remove tokens from localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }

    // Update BehaviorSubject
    this.currentUserSubject.next(null);

    // Navigate to login
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUserValue;
  }

  // Update user profile via API
  updateUserProfile(userId: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/users/${userId}`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(updatedUser => {
        // If updating current user, update the BehaviorSubject
        if (this.currentUserValue && this.currentUserValue.id === userId) {
          this.currentUserSubject.next(updatedUser);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
          }
        }
      }),
      catchError(error => {
        console.error('Error updating user profile:', error);
        return throwError(error);
      })
    );
  }

  // Delete user account via API (admin only)
  deleteUserAccount(userId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/users/${userId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error deleting user account:', error);
        return throwError(error);
      })
    );
  }

  // Get user by ID via API
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${userId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching user by ID:', error);
        return throwError(error);
      })
    );
  }

  isAdmin(): boolean {
    const currentUser = this.currentUserValue;
    return currentUser?.role === 'admin';
  }

  isChef(): boolean {
    const currentUser = this.currentUserValue;
    return currentUser?.role === 'chef';
  }

  hasRole(role: string): boolean {
    const currentUser = this.currentUserValue;
    return currentUser?.role === role;
  }

  getCurrentUserId(): string | null {
    const currentUser = this.currentUserValue;
    return currentUser ? currentUser.id : null;
  }

  getCurrentUser(): User | null {
    return this.currentUserValue;
  }

  updateCurrentUser(userData: Partial<User>): void {
    const currentUser = this.currentUserValue;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }

  // Get all users (admin only)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching all users:', error);
        return throwError(error);
      })
    );
  }

  // Get all non-admin users (admin and chef access)
  getAllNonAdminUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users/non-admin`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching non-admin users:', error);
        return throwError(error);
      })
    );
  }
}