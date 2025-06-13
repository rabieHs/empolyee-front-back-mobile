import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Request } from './home/requests/requests.service';

/**
 * Service de partage de données entre l'application web et mobile
 * Utilise le localStorage pour synchroniser les données
 */
@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private static STORAGE_KEY = 'shared_requests';
  private requestsSubject = new BehaviorSubject<Request[]>(this.loadInitialData());

  constructor() {
    // Écouter les changements de localStorage même d'autres onglets ou applications
    window.addEventListener('storage', (event) => {
      if (event.key === SharedDataService.STORAGE_KEY) {
        this.requestsSubject.next(JSON.parse(event.newValue || '[]'));
      }
    });
  }

  /**
   * Charger les données initiales ou créer des données par défaut
   */
  private loadInitialData(): Request[] {
    const storedData = localStorage.getItem(SharedDataService.STORAGE_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }

    // Données par défaut si aucune donnée n'existe
    const defaultData = this.createDefaultRequests();
    localStorage.setItem(SharedDataService.STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  }

  /**
   * Créer des demandes par défaut
   */
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

  /**
   * Obtenir toutes les demandes
   */
  getRequests(): Observable<Request[]> {
    return this.requestsSubject.asObservable();
  }

  /**
   * Obtenir une demande par son ID
   */
  getRequestById(id: number): Request | undefined {
    const requests = this.getCurrentRequests();
    return requests.find(r => r.id === id);
  }

  /**
   * Ajouter une nouvelle demande
   */
  addRequest(request: Partial<Request>): Request {
    const requests = this.getCurrentRequests();
    const newRequest: Request = {
      id: requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1,
      type: request.type || '',
      status: 'En attente',
      date: new Date().toISOString().split('T')[0],
      description: request.description || '',
      details: request.details || {}
    };

    requests.unshift(newRequest);
    this.saveRequests(requests);
    return newRequest;
  }

  /**
   * Mettre à jour une demande existante
   */
  updateRequest(updatedRequest: Request): void {
    const requests = this.getCurrentRequests();
    const index = requests.findIndex(r => r.id === updatedRequest.id);
    if (index !== -1) {
      requests[index] = updatedRequest;
      this.saveRequests(requests);
    }
  }

  /**
   * Obtenir la liste actuelle des demandes
   */
  private getCurrentRequests(): Request[] {
    return this.requestsSubject.getValue();
  }

  /**
   * Sauvegarder les demandes dans le localStorage et mettre à jour le BehaviorSubject
   */
  private saveRequests(requests: Request[]): void {
    localStorage.setItem(SharedDataService.STORAGE_KEY, JSON.stringify(requests));
    this.requestsSubject.next(requests);
  }
}
