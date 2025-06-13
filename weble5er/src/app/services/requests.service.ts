import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

import { Request } from '../models/request.model';

export interface CreateRequestData {
  type: string;
  start_date: string;
  end_date: string;
  description: string;
  working_days: number;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class RequestsService {
  private readonly API_URL = environment.apiUrl;
  private requestsSubject = new BehaviorSubject<Request[]>([]);
  public requests$ = this.requestsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadUserRequests();
  }

  // Load user requests from API
  loadUserRequests(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    let endpoint = '';
    switch (currentUser.role) {
      case 'admin':
        endpoint = '/requests/all';
        break;
      case 'chef':
        endpoint = '/requests/subordinates';
        break;
      case 'user':
      default:
        endpoint = `/requests/user/${currentUser.id}`;
        break;
    }

    this.http.get<Request[]>(`${this.API_URL}${endpoint}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error loading requests:', error);
        return throwError(error);
      })
    ).subscribe(requests => {
      this.requestsSubject.next(requests);
    });
  }

  getAllRequests(): Request[] {
    return this.requestsSubject.value;
  }

  // Create new request via API
  createRequest(requestData: CreateRequestData): Observable<Request> {
    return this.http.post<Request>(`${this.API_URL}/requests`, requestData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(newRequest => {
        const updated = [...this.requestsSubject.value, newRequest];
        this.requestsSubject.next(updated);
      }),
      catchError(error => {
        console.error('Error creating request:', error);
        return throwError(error);
      })
    );
  }

  // Add request to local state (for real-time updates)
  public addRequest(newRequest: Request): void {
    const updated = [...this.requestsSubject.value, newRequest];
    this.requestsSubject.next(updated);
  }

  // Get request by ID
  getRequestById(id: string): Request | undefined {
    return this.requestsSubject.value.find(request => request.id === id);
  }

  // Update request via API
  updateRequest(id: string, updateData: Partial<Request>): Observable<Request> {
    return this.http.put<Request>(`${this.API_URL}/requests/${id}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedRequest => {
        const requests = this.requestsSubject.value.slice();
        const index = requests.findIndex(r => r.id === id);
        if (index !== -1) {
          requests[index] = { ...updatedRequest };
          this.requestsSubject.next(requests);
        }
      }),
      catchError(error => {
        console.error('Error updating request:', error);
        return throwError(error);
      })
    );
  }

  // Delete request via API
  deleteRequest(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/requests/${id}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        const requests = this.requestsSubject.value.filter(r => r.id !== id);
        this.requestsSubject.next(requests);
      }),
      catchError(error => {
        console.error('Error deleting request:', error);
        return throwError(error);
      })
    );
  }

  // Update request status via API
  updateRequestStatus(id: string, status: string, response?: string): Observable<Request> {
    const updateData: any = { status };

    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.role === 'admin') {
      updateData.admin_response = response;
    } else if (currentUser?.role === 'chef') {
      updateData.chef_observation = response;
    }

    return this.updateRequest(id, updateData);
  }

  // Get requests visible to chef (leave/training requests)
  getChefRequests(): Request[] {
    const chefStatuses = [
      'en attente',
      'chef approuvé',
      'chef rejeté',
      'approuvée',
      'rejetée'
    ];

    return this.requestsSubject.value.filter((request: Request) => {
      const type = (request.type || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const status = (request.status || '').toLowerCase();
      const isLeaveOrTraining = type.includes('conge') || type.includes('formation');
      const isChefStatus = chefStatuses.includes(status);

      return isLeaveOrTraining && isChefStatus;
    });
  }

  // Reload requests from API
  reloadFromAPI(): void {
    this.loadUserRequests();
  }

  // Compatibility method - now reloads from API instead of localStorage
  reloadFromLocalStorage(): void {
    this.reloadFromAPI();
  }

  // Get requests processed by chef waiting for admin decision
  getChefProcessedRequests(): Request[] {
    return this.getAllRequests().filter(request =>
      request.status === 'Chef approuvé' || request.status === 'Chef rejeté'
    );
  }

  // Get user's own requests
  getUserRequests(): Request[] {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return [];

    return this.getAllRequests().filter(request =>
      String(request.user_id) === String(currentUser.id)
    );
  }

  // Get all requests for admin
  getAdminRequests(): Request[] {
    return this.getAllRequests();
  }
}