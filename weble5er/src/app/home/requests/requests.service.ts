import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Request } from '../../models/request.model';
import { environment } from '../../../environments/environment';

// Interface pour la réponse de mise à jour du statut
export interface UpdateStatusResponse {
  success: boolean;
  notifications?: {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
    read: boolean;
    link?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class RequestsService {
  private readonly API_URL = environment.apiUrl;
  private requestsSubject = new BehaviorSubject<Request[]>([]);
  private leaveTypes: { [key: string]: string } = {
    'annuel': 'Congé annuel',
    'paid': 'Congé payé',
    'unpaid': 'Congé sans solde',
    'sick': 'Congé maladie',
    'maternity': 'Congé maternité',
    'paternity': 'Congé paternité'
  };

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.loadUserRequests();
  }

  // Load user requests from API
  loadUserRequests(): void {
    const currentUser = this.authService.getCurrentUser();
    console.log('👤 Loading requests for user:', currentUser);

    if (!currentUser) {
      console.log('⚠️ No current user found, skipping request load');
      return;
    }

    let endpoint = '';
    switch (currentUser.role) {
      case 'admin':
        endpoint = '/requests';
        break;
      case 'chef':
        // Chef should see all requests to filter them client-side
        // This ensures chef sees formation and congé requests from all users
        endpoint = '/requests';
        break;
      case 'user':
      default:
        endpoint = `/requests/user/${currentUser.id}`;
        break;
    }

    console.log('🔗 Loading from endpoint:', `${this.API_URL}${endpoint}`);
    console.log('🔑 Using auth headers:', this.authService.getAuthHeaders());

    this.http.get<Request[]>(`${this.API_URL}${endpoint}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(response => {
        console.log('📡 Raw HTTP response:', response);
        console.log('📡 Response type:', typeof response);
        console.log('📡 Response length:', Array.isArray(response) ? response.length : 'Not an array');
      }),
      catchError(error => {
        console.error('❌ Error loading requests:', error);
        console.error('❌ Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        return throwError(error);
      })
    ).subscribe({
      next: (requests) => {
        console.log('✅ Requests loaded successfully:', requests);
        console.log('📊 Request count:', requests ? requests.length : 'null/undefined');
        if (requests && requests.length > 0) {
          console.log('📝 First request sample:', requests[0]);
        }
        this.requestsSubject.next(requests || []);
      },
      error: (error) => {
        console.error('❌ Failed to load requests:', error);
        // Initialize with empty array on error
        this.requestsSubject.next([]);
      }
    });
  }

  // Return Observable of all requests
  getRequests(): Observable<Request[]> {
    return this.requestsSubject.asObservable();
  }

  // Expose requests as Observable for compatibility
  get requests$(): Observable<Request[]> {
    return this.requestsSubject.asObservable();
  }

  // Alias for getRequests() - used for compatibility
  getAllRequests(): Observable<Request[]> {
    return this.getRequests();
  }

  // Get request by ID (Observable version)
  getRequestById(id: string): Observable<Request | undefined> {
    return this.getRequests().pipe(
      map(requests => requests.find(request => request.id === id))
    );
  }

  // Get request by ID (synchronous version)
  findRequestById(requestId: string): Request | null {
    const requests = this.requestsSubject.value;
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return null;

    const request = requests.find(r => r.id === requestId);
    if (!request || (request.user_id !== currentUser.id && currentUser.role !== 'admin' && currentUser.role !== 'chef')) {
      return null;
    }

    return request;
  }

  // Filtre les demandes en fonction du rôle de l'utilisateur
  getRequestsByUserRole(userId: string, role: string): Observable<Request[]> {
    if (role === 'admin') {
      // L'admin voit toutes les demandes
      return this.getRequests();
    } else if (role === 'chef') {
      // Le chef ne voit que les demandes de congés et de formation
      return this.getRequests().pipe(
        map(requests => requests.filter(request =>
          (request.type === 'Congé' || request.type === 'Formation') &&
          request.status === 'En attente'
        ))
      );
    } else {
      // L'employé ne voit que ses propres demandes
      return this.getUserRequests(userId);
    }
  }

  // Filtre les demandes par type
  filterRequestsByType(type: string): Observable<Request[]> {
    return this.getRequests().pipe(
      map(requests => requests.filter(request => request.type === type))
    );
  }

  // Filtre les demandes par statut
  filterRequestsByStatus(status: string): Observable<Request[]> {
    return this.getRequests().pipe(
      map(requests => requests.filter(request => request.status === status))
    );
  }

  // Récupère les demandes d'un utilisateur spécifique
  getUserRequests(userId: string): Observable<Request[]> {
    return this.getRequests().pipe(
      map(requests => requests.filter(request => request.user_id === userId))
    );
  }

  // Method to add a new request (used by components)
  addRequest(newRequest: any): Observable<boolean> {
    const requestData = {
      type: newRequest.type,
      start_date: newRequest.details?.startDate,
      end_date: newRequest.details?.endDate,
      description: newRequest.description,
      working_days: newRequest.details?.days || 0,
      details: newRequest.details
    };

    return this.createRequest(requestData).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Method to create a new request via API
  createRequest(requestData: any): Observable<Request> {
    console.log('🚀 Creating request via API:', requestData);
    console.log('🔗 API URL:', `${this.API_URL}/requests`);
    console.log('🔑 Auth headers:', this.authService.getAuthHeaders());

    return this.http.post<Request>(`${this.API_URL}/requests`, requestData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(newRequest => {
        console.log('✅ Request created successfully:', newRequest);
        const currentRequests = this.requestsSubject.value;
        this.requestsSubject.next([...currentRequests, newRequest]);
      }),
      catchError(error => {
        console.error('❌ Error creating request:', error);
        console.error('❌ Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        return throwError(error);
      })
    );
  }

  // Method to update request status via API
  updateRequestStatus(requestId: string, status: 'En attente' | 'Chef approuvé' | 'Chef rejeté' | 'Approuvée' | 'Rejetée', response?: string): Observable<UpdateStatusResponse> {
    const updateData: any = { status };

    const currentUser = this.authService.currentUserValue;
    console.log('👨‍🍳 Chef updating request status:', {
      requestId,
      status,
      response,
      userRole: currentUser?.role
    });

    if (currentUser?.role === 'admin') {
      updateData.admin_response = response;
    } else if (currentUser?.role === 'chef') {
      updateData.chef_observation = response;
    }

    console.log('📤 Sending update data:', updateData);
    console.log('🔗 Update URL:', `${this.API_URL}/requests/${requestId}`);

    return this.http.put<Request>(`${this.API_URL}/requests/${requestId}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedRequest => {
        console.log('✅ Request status updated successfully:', updatedRequest);
        const currentRequests = this.requestsSubject.value;
        const index = currentRequests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          currentRequests[index] = updatedRequest;
          this.requestsSubject.next([...currentRequests]);
          console.log('🔄 Local requests updated');
        }
      }),
      map(() => ({ success: true })),
      catchError(error => {
        console.error('❌ Error updating request status:', error);
        console.error('❌ Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        return of({ success: false });
      })
    );
  }

  // Méthode pour calculer les jours ouvrables entre deux dates
  calculateWorkingDays(startDate: string, endDate: string, includeWeekends: boolean = false, dayPart: 'full' | 'morning' | 'afternoon' = 'full'): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Si c'est le même jour et que c'est une demi-journée
    if (start.getTime() === end.getTime() && dayPart !== 'full') {
      return 0.5;
    }

    // Calculer le nombre de jours entre les deux dates
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de fin

    if (includeWeekends) {
      return dayPart === 'full' ? diffDays : diffDays - 0.5;
    }

    // Calculer le nombre de jours ouvrables (sans les weekends)
    let workingDays = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = dimanche, 6 = samedi
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Ajuster pour les demi-journées
    if (dayPart !== 'full') {
      workingDays -= 0.5;
    }

    return workingDays;
  }

  // Delete request via API
  deleteRequest(requestId: string): Observable<boolean> {
    return this.http.delete(`${this.API_URL}/requests/${requestId}`, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(() => {
        const currentRequests = this.requestsSubject.value;
        const filteredRequests = currentRequests.filter(r => r.id !== requestId);
        this.requestsSubject.next(filteredRequests);
      }),
      map(() => true),
      catchError(error => {
        console.error('Error deleting request:', error);
        return of(false);
      })
    );
  }

  // Method to add a new leave request
  addLeaveRequest(data: {
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    dayType?: string;
    dayPart?: 'full' | 'morning' | 'afternoon';
    includeWeekends?: boolean;
  }): Observable<Request> {
    // Calculate working days
    const workingDays = this.calculateWorkingDays(
      data.startDate,
      data.endDate,
      data.includeWeekends || false,
      data.dayPart || 'full'
    );

    const requestData = {
      type: 'Congé',
      start_date: data.startDate,
      end_date: data.endDate,
      description: `Demande de ${data.leaveType}`,
      working_days: workingDays,
      details: {
        startDate: data.startDate,
        endDate: data.endDate,
        days: workingDays,
        leaveType: data.leaveType,
        reason: data.reason,
        dayType: data.dayType || 'full',
        dayPart: data.dayPart || 'full',
        includeWeekends: data.includeWeekends || false
      }
    };

    return this.createRequest(requestData);
  }

  // Method to add a new training request
  addTrainingRequest(data: {
    title: string;
    organization: string;
    startDate: string;
    endDate: string;
    trainingType: string;
    objectives: string;
    cost: number;
    department?: string;
    theme?: string;
    topic?: string;
  }): Observable<Request> {
    const requestData = {
      type: 'Formation',
      start_date: data.startDate,
      end_date: data.endDate,
      description: data.title,
      working_days: 0,
      details: {
        title: data.title,
        organization: data.organization,
        startDate: data.startDate,
        endDate: data.endDate,
        trainingType: data.trainingType,
        objectives: data.objectives,
        cost: data.cost,
        department: data.department,
        theme: data.theme,
        topic: data.topic
      }
    };

    return this.createRequest(requestData);
  }

  // Method to add a new certificate request
  addCertificateRequest(data: {
    purpose: string;
    otherPurpose?: string;
    language: string;
    copies: number;
    comments?: string;
  }): Observable<Request> {
    const requestData = {
      type: 'Attestation de travail',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      description: `Attestation de travail - ${data.purpose === 'other' ? data.otherPurpose : data.purpose}`,
      working_days: 0,
      details: {
        purpose: data.purpose === 'other' ? data.otherPurpose : data.purpose,
        language: data.language,
        copies: data.copies,
        comments: data.comments
      }
    };

    return this.createRequest(requestData);
  }

  // Method to add a new document request
  addDocumentRequest(data: {
    documentType: string;
    urgency: 'low' | 'medium' | 'high';
    additionalInfo?: string;
  }): Observable<Request> {
    const requestData = {
      type: 'Document',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      description: `Demande de document - ${data.documentType}`,
      working_days: 0,
      details: {
        documentType: data.documentType,
        urgency: data.urgency,
        additionalInfo: data.additionalInfo
      }
    };

    return this.createRequest(requestData);
  }

  // Method to add a new loan request
  addLoanRequest(data: FormData): Observable<Request> {
    const loanType = (data.get('loanType')?.toString() || 'personal') as 'personal' | 'car' | 'house';
    const loanAmount = Number(data.get('loanAmount'));

    const loanTypes: { [key: string]: string } = {
      'personal': 'Prêt personnel',
      'car': 'Prêt automobile',
      'house': 'Prêt immobilier'
    };

    const requestData = {
      type: loanTypes[loanType] || 'Prêt',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      description: `Demande de ${loanTypes[loanType] || 'prêt'} de ${loanAmount} DT`,
      working_days: 0,
      details: {
        loanType: loanType,
        loanAmount: loanAmount,
        attachments: Array.from(data.getAll('attachments')).map(file => (file as File).name)
      }
    };

    return this.createRequest(requestData);
  }

  // Method to add a new advance request
  addAdvanceRequest(data: FormData): Observable<Request> {
    const advanceAmount = data.get('advanceAmount');
    const advanceReason = data.get('advanceReason');

    const requestData = {
      type: 'Avance',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      description: `Demande d'avance de ${advanceAmount} DT`,
      working_days: 0,
      details: {
        advanceAmount: Number(advanceAmount),
        advanceReason: advanceReason?.toString(),
        attachments: Array.from(data.getAll('attachments')).map(file => (file as File).name)
      }
    };

    return this.createRequest(requestData);
  }

  // Method to update a leave request via API
  updateLeaveRequest(requestId: string, data: {
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    dayPart?: 'full' | 'morning' | 'afternoon';
    includeWeekends?: boolean;
  }): Observable<boolean> {
    const includeWeekends = data.leaveType === 'annuel' || data.leaveType === 'maternity' || data.leaveType === 'paternity';
    const days = this.calculateWorkingDays(data.startDate, data.endDate, includeWeekends, data.dayPart);

    const updateData = {
      type: this.leaveTypes[data.leaveType],
      start_date: data.startDate,
      end_date: data.endDate,
      description: `Congé du ${data.startDate} au ${data.endDate}`,
      working_days: days,
      details: {
        startDate: data.startDate,
        endDate: data.endDate,
        leaveType: data.leaveType,
        dayPart: data.dayPart,
        reason: data.reason,
        workingDays: days
      }
    };

    return this.http.put<Request>(`${this.API_URL}/requests/${requestId}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedRequest => {
        const currentRequests = this.requestsSubject.value;
        const index = currentRequests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          currentRequests[index] = updatedRequest;
          this.requestsSubject.next([...currentRequests]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error updating leave request:', error);
        return of(false);
      })
    );
  }

  // Method to update a training request via API
  updateTrainingRequest(requestId: string, data: {
    title: string;
    organization: string;
    startDate: string;
    endDate: string;
    trainingType: string;
    objectives: string;
    cost: number;
    department?: string;
    theme?: string;
    topic?: string;
  }): Observable<boolean> {
    const updateData = {
      type: 'Formation',
      start_date: data.startDate,
      end_date: data.endDate,
      description: data.title,
      working_days: 0,
      details: {
        title: data.title,
        organization: data.organization,
        startDate: data.startDate,
        endDate: data.endDate,
        trainingType: data.trainingType,
        objectives: data.objectives,
        cost: data.cost,
        department: data.department,
        theme: data.theme,
        topic: data.topic
      }
    };

    return this.http.put<Request>(`${this.API_URL}/requests/${requestId}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedRequest => {
        const currentRequests = this.requestsSubject.value;
        const index = currentRequests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          currentRequests[index] = updatedRequest;
          this.requestsSubject.next([...currentRequests]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error updating training request:', error);
        return of(false);
      })
    );
  }

  // Method to update a certificate request via API
  updateCertificateRequest(requestId: string, data: {
    purpose: string;
    otherPurpose?: string;
    language: string;
    copies: number;
    comments?: string;
  }): Observable<boolean> {
    const updateData = {
      type: 'Attestation de travail',
      description: `Attestation de travail - ${data.purpose === 'other' ? data.otherPurpose : data.purpose}`,
      details: {
        purpose: data.purpose === 'other' ? data.otherPurpose : data.purpose,
        language: data.language,
        copies: data.copies,
        comments: data.comments
      }
    };

    return this.http.put<Request>(`${this.API_URL}/requests/${requestId}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedRequest => {
        const currentRequests = this.requestsSubject.value;
        const index = currentRequests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          currentRequests[index] = updatedRequest;
          this.requestsSubject.next([...currentRequests]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error updating certificate request:', error);
        return of(false);
      })
    );
  }

  // Method to update a document request via API
  updateDocumentRequest(requestId: string, data: {
    documentType: string;
    urgency: 'low' | 'medium' | 'high';
    additionalInfo?: string;
  }): Observable<boolean> {
    const updateData = {
      type: 'Document',
      description: `Demande de document - ${data.documentType}`,
      details: {
        documentType: data.documentType,
        urgency: data.urgency,
        additionalInfo: data.additionalInfo
      }
    };

    return this.http.put<Request>(`${this.API_URL}/requests/${requestId}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedRequest => {
        const currentRequests = this.requestsSubject.value;
        const index = currentRequests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          currentRequests[index] = updatedRequest;
          this.requestsSubject.next([...currentRequests]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error updating document request:', error);
        return of(false);
      })
    );
  }

  // Method to update a loan request via API
  updateLoanRequest(requestId: string, data: FormData): Observable<boolean> {
    const loanType = (data.get('loanType')?.toString() || 'personal') as 'personal' | 'car' | 'house';
    const loanAmount = Number(data.get('loanAmount'));

    const loanTypes: { [key: string]: string } = {
      'personal': 'Prêt personnel',
      'car': 'Prêt automobile',
      'house': 'Prêt immobilier'
    };

    const updateData = {
      type: loanTypes[loanType] || 'Prêt',
      description: `Demande de ${loanTypes[loanType] || 'prêt'} de ${loanAmount} DT`,
      details: {
        loanType: loanType,
        loanAmount: loanAmount,
        attachments: Array.from(data.getAll('attachments')).map(file => (file as File).name)
      }
    };

    return this.http.put<Request>(`${this.API_URL}/requests/${requestId}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedRequest => {
        const currentRequests = this.requestsSubject.value;
        const index = currentRequests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          currentRequests[index] = updatedRequest;
          this.requestsSubject.next([...currentRequests]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error updating loan request:', error);
        return of(false);
      })
    );
  }

  // Method to update an advance request via API
  updateAdvanceRequest(requestId: string, data: FormData): Observable<boolean> {
    const advanceAmount = Number(data.get('advanceAmount'));
    const advanceReason = data.get('advanceReason')?.toString();

    const updateData = {
      type: 'Avance',
      description: `Demande d'avance de ${advanceAmount} DT`,
      details: {
        advanceAmount: advanceAmount,
        advanceReason: advanceReason,
        attachments: Array.from(data.getAll('attachments')).map(file => (file as File).name)
      }
    };

    return this.http.put<Request>(`${this.API_URL}/requests/${requestId}`, updateData, {
      headers: this.authService.getAuthHeaders()
    }).pipe(
      tap(updatedRequest => {
        const currentRequests = this.requestsSubject.value;
        const index = currentRequests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          currentRequests[index] = updatedRequest;
          this.requestsSubject.next([...currentRequests]);
        }
      }),
      map(() => true),
      catchError(error => {
        console.error('Error updating advance request:', error);
        return of(false);
      })
    );
  }

  // Method to delete a request via API (already implemented above)
  // deleteRequest method is already updated above
}
