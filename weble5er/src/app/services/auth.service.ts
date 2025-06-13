import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: 'admin' | 'chef' | 'user';
  department_id?: number;
  chef_id?: number;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  private readonly API_URL = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserData());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Check if user is already logged in
    const token = this.getToken();
    if (token) {
      this.setAuthHeaders(token);
    }
  }

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

  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/register`, userData)
      .pipe(
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/forgot-password`, { email })
      .pipe(
        catchError(error => {
          console.error('Forgot password error:', error);
          return throwError(error);
        })
      );
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/reset-password`, { token, password })
      .pipe(
        catchError(error => {
          console.error('Reset password error:', error);
          return throwError(error);
        })
      );
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getUserData();
  }

  isAdmin(): boolean {
    const userData = this.getUserData();
    return userData?.role === 'admin';
  }

  isChef(): boolean {
    const userData = this.getUserData();
    return userData?.role === 'chef';
  }

  hasRole(role: string): boolean {
    const userData = this.getUserData();
    return userData?.role === role;
  }

  getCurrentUserId(): number | null {
    const userData = this.getUserData();
    return userData ? userData.id : null;
  }

  getCurrentUser(): User | null {
    return this.getUserData();
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.setAuthHeaders(token);
  }

  private setAuthHeaders(token: string): void {
    // This will be used by HTTP interceptor
  }

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

  private getUserData(): User | null {
    const userDataString = localStorage.getItem(this.USER_KEY);
    if (!userDataString) return null;
    try {
      return JSON.parse(userDataString);
    } catch {
      return null;
    }
  }
}
