import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, User } from './auth.service';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: 'admin' | 'chef' | 'user';
  department_id?: number;
  chef_id?: number;
  profile_image?: string;
  personal_info?: any;
  professional_info?: any;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role?: string;
  chef_id?: number;
  personalInfo?: any;
  professionalInfo?: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Get all users (admin only)
  getAllUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.API_URL}/users`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching users:', error);
        return throwError(error);
      })
    );
  }

  // Get all non-admin users (admin only)
  getAllNonAdminUsers(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.API_URL}/users/non-admin`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching non-admin users:', error);
        return throwError(error);
      })
    );
  }

  // Get user by ID
  getUserById(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/users/${userId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching user:', error);
        return throwError(error);
      })
    );
  }

  // Get current user profile
  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/users/profile`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching current user profile:', error);
        return throwError(error);
      })
    );
  }

  // Create new user (admin only)
  createUser(userData: CreateUserData): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.API_URL}/users/complete`, userData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error creating user:', error);
        return throwError(error);
      })
    );
  }

  // Update user (admin only)
  updateUser(userId: number, userData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API_URL}/users/${userId}`, userData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error updating user:', error);
        return throwError(error);
      })
    );
  }

  // Update current user profile
  updateCurrentUserProfile(userData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API_URL}/users/profile`, userData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error updating current user profile:', error);
        return throwError(error);
      })
    );
  }

  // Delete user (admin only)
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/users/${userId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error deleting user:', error);
        return throwError(error);
      })
    );
  }

  // Get departments
  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/departments`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error fetching departments:', error);
        return throwError(error);
      })
    );
  }

  // Update profile with password change
  updateProfile(userData: any): Observable<any> {
    return this.http.put(`${this.API_URL}/users/profile`, userData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error updating profile:', error);
        return throwError(error);
      })
    );
  }
}
