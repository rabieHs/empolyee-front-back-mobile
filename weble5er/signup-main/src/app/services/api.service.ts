import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Request } from '../home/requests/requests.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // URL de l'API backend - même URL pour web et mobile
  private apiUrl = 'http://localhost:3002/api';
  
  // Temporairement en mode localStorage pour développement
  private useLocalStorage = true;
  
  constructor(private http: HttpClient, private authService: AuthService) { }

  // Obtenir les headers avec le token d'authentification
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Méthode pour récupérer toutes les demandes
  getRequests(): Observable<Request[]> {
    if (this.useLocalStorage) {
      // Récupérer les demandes du localStorage pour le développement
      const requests = localStorage.getItem('requests');
      // Si aucune demande n'existe, créer des demandes par défaut
      if (!requests) {
        const defaultRequests = this.createDefaultRequests();
        localStorage.setItem('requests', JSON.stringify(defaultRequests));
        return of(defaultRequests);
      }
      return of(JSON.parse(requests));
    } else {
      // Récupérer les demandes depuis l'API
      const userId = this.authService.currentUserValue?.id;
      if (!userId) {
        return throwError('Utilisateur non authentifié');
      }
      
      return this.http.get<any[]>(`${this.apiUrl}/requests/user/${userId}`, { headers: this.getAuthHeaders() })
        .pipe(
          map(apiRequests => this.mapApiRequestsToClientFormat(apiRequests)),
          tap(_ => console.log('Demandes récupérées')),
          catchError(error => {
            console.error('Erreur lors de la récupération des demandes:', error);
            // En cas d'erreur, utiliser les données du localStorage
            const requests = localStorage.getItem('requests');
            if (!requests) {
              const defaultRequests = this.createDefaultRequests();
              localStorage.setItem('requests', JSON.stringify(defaultRequests));
              return of(defaultRequests);
            }
            return of(JSON.parse(requests));
          })
        );
    }
  }
  
  // Créer des demandes par défaut pour le développement
  private createDefaultRequests(): Request[] {
    return [
      {
        id: 1,
        type: 'Congé annuel',
        status: 'En attente',
        date: '2025-05-20',
        description: 'Demande de congé pour 5 jours',
        details: {
          startDate: '2025-05-20',
          endDate: '2025-05-25',
          leaveType: 'paid',
          reason: 'Vacances'
        }
      },
      {
        id: 2,
        type: 'Formation',
        status: 'Approuvée',
        date: '2025-05-15',
        description: 'Formation Angular avancé',
        details: {
          title: 'Formation Angular',
          organization: 'Formation Pro',
          startDate: '2025-06-01',
          endDate: '2025-06-05',
          trainingType: 'technical',
          objectives: 'Maîtriser Angular'
        }
      },
      {
        id: 3,
        type: 'Document administratif',
        status: 'En attente',
        date: '2025-05-26',
        description: 'Demande d\'attestation de travail',
        details: {
          documentType: 'Attestation de travail',
          reason: 'Banque',
          urgency: 'normal',
          objective: 'Prêt immobilier',
          language: 'fr',
          copies: 2,
          comments: 'Besoin pour dossier bancaire'
        }
      }
    ];
  }
  
  // Convertir le format de l'API vers le format client
  private mapApiRequestsToClientFormat(apiRequests: any[]): Request[] {
    return apiRequests.map(apiRequest => ({
      id: apiRequest.id,
      type: apiRequest.type,
      status: apiRequest.status,
      date: apiRequest.created_at.split('T')[0],
      description: apiRequest.description,
      details: apiRequest.details ? JSON.parse(apiRequest.details) : {}
    }));
  }

  // Méthode pour récupérer une demande par son ID
  getRequestById(id: number): Observable<Request> {
    if (this.useLocalStorage) {
      // Récupérer la demande du localStorage pour le développement
      const requests = localStorage.getItem('requests');
      const requestsArray = requests ? JSON.parse(requests) : [];
      const request = requestsArray.find((r: Request) => r.id === id);
      return of(request);
    } else {
      // Récupérer la demande depuis l'API
      return this.http.get<any>(`${this.apiUrl}/requests/${id}`, { headers: this.getAuthHeaders() })
        .pipe(
          map(apiRequest => ({
            id: apiRequest.id,
            type: apiRequest.type,
            status: apiRequest.status,
            date: apiRequest.created_at.split('T')[0],
            description: apiRequest.description,
            details: apiRequest.details ? JSON.parse(apiRequest.details) : {}
          })),
          tap(_ => console.log(`Demande récupérée id=${id}`)),
          catchError(this.handleError<Request>(`getRequest id=${id}`))
        );
    }
  }

  // Méthode pour ajouter une nouvelle demande
  addRequest(request: Partial<Request>): Observable<Request> {
    // Créer la nouvelle demande
    const requests = localStorage.getItem('requests');
    const requestsArray = requests ? JSON.parse(requests) : [];
    const newRequest = {
      id: requestsArray.length > 0 ? Math.max(...requestsArray.map((r: Request) => r.id)) + 1 : 1,
      type: request.type || '',
      status: 'En attente',
      date: new Date().toISOString().split('T')[0],
      description: request.description || '',
      details: request.details || {}
    };
    
    // Toujours ajouter au localStorage pour assurer la synchronisation
    requestsArray.unshift(newRequest);
    localStorage.setItem('requests', JSON.stringify(requestsArray));
    
    if (this.useLocalStorage) {
      return of(newRequest as Request);
    } else {
      // Préparer les données pour l'API
      const userId = this.authService.currentUserValue?.id;
      if (!userId) {
        return of(newRequest as Request); // Retourner quand même la demande créée localement
      }
      
      // Convertir au format attendu par l'API
      const apiRequest = {
        type: request.type,
        description: request.description,
        details: JSON.stringify(request.details),
        user_id: userId
      };
      
      // Si c'est une demande de congé ou formation, ajouter les dates
      if (request.details && (request.details.startDate || request.details.endDate)) {
        Object.assign(apiRequest, {
          start_date: request.details.startDate,
          end_date: request.details.endDate
        });
      }
      
      // Ajouter la demande via l'API
      return this.http.post<any>(`${this.apiUrl}/requests`, apiRequest, { headers: this.getAuthHeaders() })
        .pipe(
          map(response => {
            // Mettre à jour l'ID si différent
            if (response && response.id !== newRequest.id) {
              const index = requestsArray.findIndex((r: Request) => r.id === newRequest.id);
              if (index !== -1) {
                requestsArray[index].id = response.id;
                localStorage.setItem('requests', JSON.stringify(requestsArray));
              }
              return {
                ...newRequest,
                id: response.id
              };
            }
            return newRequest;
          }),
          tap((updatedRequest: Request) => console.log(`Demande ajoutée w/ id=${updatedRequest.id}`)),
          catchError(error => {
            console.error('Erreur lors de l\'ajout de la demande:', error);
            // En cas d'erreur, retourner la demande créée localement
            return of(newRequest as Request);
          })
        );
    }
  }

  // Méthode pour mettre à jour une demande existante
  updateRequest(request: Request): Observable<any> {
    // Toujours mettre à jour dans le localStorage pour assurer la synchronisation
    const requests = localStorage.getItem('requests');
    let requestsArray = requests ? JSON.parse(requests) : [];
    const index = requestsArray.findIndex((r: Request) => r.id === request.id);
    if (index !== -1) {
      requestsArray[index] = request;
      localStorage.setItem('requests', JSON.stringify(requestsArray));
    }
    
    if (this.useLocalStorage) {
      return of(request);
    } else {
      // Préparer les données pour l'API
      const userId = this.authService.currentUserValue?.id;
      if (!userId) {
        return of(request); // Retourner quand même la demande mise à jour localement
      }
      
      // Convertir au format attendu par l'API
      const apiRequest = {
        type: request.type,
        description: request.description,
        details: JSON.stringify(request.details),
        user_id: userId
      };
      
      // Si c'est une demande de congé ou formation, ajouter les dates
      if (request.details && (request.details.startDate || request.details.endDate)) {
        Object.assign(apiRequest, {
          start_date: request.details.startDate,
          end_date: request.details.endDate
        });
      }
      
      // Mettre à jour la demande via l'API
      return this.http.put(`${this.apiUrl}/requests/${request.id}`, apiRequest, { headers: this.getAuthHeaders() })
        .pipe(
          tap(_ => console.log(`Demande mise à jour id=${request.id}`)),
          catchError(error => {
            console.error(`Erreur lors de la mise à jour de la demande ${request.id}:`, error);
            // En cas d'erreur, retourner la demande mise à jour localement
            return of(request);
          })
        );
    }
  }

  // Méthode pour récupérer les notifications
  getNotifications(): Observable<any[]> {
    if (this.useLocalStorage) {
      // Récupérer les notifications du localStorage pour le développement
      const notifications = localStorage.getItem('notifications');
      return of(notifications ? JSON.parse(notifications) : []);
    } else {
      // Récupérer les notifications depuis l'API
      const userId = this.authService.currentUserValue?.id;
      if (!userId) {
        return throwError('Utilisateur non authentifié');
      }
      
      return this.http.get<any[]>(`${this.apiUrl}/notifications/user/${userId}`, { headers: this.getAuthHeaders() })
        .pipe(
          tap(_ => console.log('Notifications récupérées')),
          catchError(this.handleError<any[]>('getNotifications', []))
        );
    }
  }

  // Méthode pour récupérer le profil utilisateur
  getUserProfile(): Observable<any> {
    if (this.useLocalStorage) {
      // Récupérer le profil du localStorage pour le développement
      const profile = localStorage.getItem('userProfile');
      return of(profile ? JSON.parse(profile) : {});
    } else {
      // Récupérer le profil depuis l'API
      const userId = this.authService.currentUserValue?.id;
      if (!userId) {
        return throwError('Utilisateur non authentifié');
      }
      
      return this.http.get<any>(`${this.apiUrl}/users/${userId}/profile`, { headers: this.getAuthHeaders() })
        .pipe(
          tap(_ => console.log('Profil récupéré')),
          catchError(this.handleError<any>('getUserProfile', {}))
        );
    }
  }

  // Gestionnaire d'erreurs
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} a échoué: ${error.message}`);
      // Enregistrer l'erreur pour analyse ultérieure
      console.error(error);
      // Retourner un résultat vide pour que l'application continue de fonctionner
      return of(result as T);
    };
  }
}
