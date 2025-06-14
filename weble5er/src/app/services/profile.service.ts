import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface PersonalInfo {
  id?: number;
  user_id?: number;
  cin: string;
  date_of_birth: string;
  place_of_birth?: string;
  nationality: string;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  number_of_children: number;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfessionalInfo {
  id?: number;
  user_id?: number;
  employee_id: string;
  department?: string;
  position: string;
  grade?: string;
  hire_date?: string;
  contract_type: 'CDI' | 'CDD' | 'Stage' | 'Freelance';
  salary?: number;
  rib?: string;
  bank_name?: string;
  cnss?: string;
  mutuelle?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompleteProfile {
  user: {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
    department_id?: number;
    chef_id?: number;
    created_at: string;
    updated_at: string;
  };
  personalInfo: PersonalInfo | null;
  professionalInfo: ProfessionalInfo | null;
  department?: {
    id: number;
    name: string;
    description?: string;
  } | null;
  chef?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/profile`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  // Get personal information
  getPersonalInfo(userId: string | number): Observable<PersonalInfo> {
    return this.http.get<PersonalInfo>(`${this.apiUrl}/personal/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Get professional information
  getProfessionalInfo(userId: string | number): Observable<ProfessionalInfo> {
    return this.http.get<ProfessionalInfo>(`${this.apiUrl}/professional/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Get complete profile (user + personal + professional)
  getCompleteProfile(userId: string | number): Observable<CompleteProfile> {
    return this.http.get<CompleteProfile>(`${this.apiUrl}/complete/${userId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Update personal information
  updatePersonalInfo(userId: string | number, personalInfo: Partial<PersonalInfo>): Observable<{message: string, personalInfo: PersonalInfo}> {
    return this.http.put<{message: string, personalInfo: PersonalInfo}>(`${this.apiUrl}/personal/${userId}`, personalInfo, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Update professional information
  updateProfessionalInfo(userId: string | number, professionalInfo: Partial<ProfessionalInfo>): Observable<{message: string, professionalInfo: ProfessionalInfo}> {
    return this.http.put<{message: string, professionalInfo: ProfessionalInfo}>(`${this.apiUrl}/professional/${userId}`, professionalInfo, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Profile service error:', error);
    let errorMessage = 'Une erreur est survenue';

    // Handle specific HTTP status codes
    if (error.status === 401) {
      errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      // Trigger logout through auth service
      this.authService.logout();
    } else if (error.status === 403) {
      errorMessage = 'Accès non autorisé';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
