import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Request } from '../../models/request.model';

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
  private requestsSubject = new BehaviorSubject<Request[]>([]);
  private requests: Request[] = [];
  private leaveTypes: { [key: string]: string } = {
    'annuel': 'Congé annuel',
    'paid': 'Congé payé',
    'unpaid': 'Congé sans solde',
    'sick': 'Congé maladie',
    'maternity': 'Congé maternité',
    'paternity': 'Congé paternité'
  };

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    // Charger les demandes depuis le localStorage
    const storedRequests = localStorage.getItem('requests');
    if (storedRequests) {
      this.requests = JSON.parse(storedRequests);
      this.requestsSubject.next(this.requests);
    } else {
      // Créer des demandes de test si aucune n'existe
      this.createTestRequests();
    }
  }

  // Sauvegarde les demandes dans le localStorage et met à jour le BehaviorSubject
  saveRequests(): void {
    localStorage.setItem('requests', JSON.stringify(this.requests));
    this.requestsSubject.next(this.requests);
  }

  // Retourne un Observable de toutes les demandes
  getRequests(): Observable<Request[]> {
    return this.requestsSubject.asObservable();
  }

  // Alias pour getRequests() - utilisé pour la compatibilité
  getAllRequests(): Observable<Request[]> {
    return this.getRequests();
  }

  // Récupère une demande par son ID (version Observable)
  getRequestById(id: string): Observable<Request | undefined> {
    return this.getRequests().pipe(
      map(requests => requests.find(request => request.id === id))
    );
  }

  // Récupère une demande par son ID (version synchrone)
  findRequestById(requestId: string): Request | null {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return null;

    const request = this.requests.find(r => r.id === requestId);
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

  // Méthode pour créer une nouvelle demande
  createRequest(requestData: Partial<Request>): string {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return '';

    const newRequest: Request = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: currentUser.id,
      type: requestData.type || 'Autre',
      date: new Date().toISOString(),
      status: 'En attente',
      description: requestData.description || '',
      details: requestData.details || {},
      source: 'web',
      user: {
        id: currentUser.id,
        firstname: currentUser.firstName || '',
        lastname: currentUser.lastName || '',
        role: currentUser.role
      },
      createdAt: new Date().toISOString()
    };

    this.requests.push(newRequest);
    this.saveRequests();

    // Créer une notification pour les chefs
    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      message: `Nouvelle demande de ${(newRequest.type || '').toLowerCase()} de ${currentUser.firstName || ''} ${currentUser.lastName || ''}`,
      type: 'info' as 'info',
      timestamp: new Date(),
      read: false,
      link: `/home/requests/${newRequest.id}`
    };

    this.notificationService.addNotification(notification);
    return newRequest.id || '';
  }

  // Méthode pour mettre à jour le statut d'une demande
  updateRequestStatus(requestId: string, status: 'En attente' | 'Chef approuvé' | 'Chef rejeté' | 'Approuvée' | 'Rejetée', response?: string): Observable<UpdateStatusResponse> {
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index === -1) return of({ success: false });

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return of({ success: false });

    const request = this.requests[index];
    const isChef = this.authService.isChef();
    const isAdmin = currentUser.role === 'admin';

    // Vérifier si la demande est de type congé ou formation
    const isLeaveOrTraining = request.type && (request.type.toLowerCase().includes('congé') || request.type.toLowerCase().includes('formation'));

    // Préparer les notifications
    const notifications = [];

    if (isChef && isLeaveOrTraining) {
      // Le chef ne peut approuver/rejeter que les demandes de congé et formation
      // et seulement si elles sont en attente
      if (request.status !== 'En attente') {
        return of({ success: false });
      }

      // Déterminer le nouveau statut (Chef approuvé ou Chef rejeté)
      const newStatus = status === 'Approuvée' ? 'Chef approuvé' : (status === 'Rejetée' ? 'Chef rejeté' : status);

      this.requests[index] = {
        ...request,
        status: newStatus,
        chefObservation: response,
        chefProcessedBy: currentUser.id,
        chefProcessedDate: new Date().toISOString()
      };

      // Créer notification pour l'employé
      const employeeNotification = {
        id: Date.now().toString(),
        message: `Votre demande de ${request.type || ''} a été ${newStatus === 'Chef approuvé' ? 'approuvée' : 'rejetée'} par le chef.`,
        type: newStatus === 'Chef approuvé' ? 'success' : 'warning' as 'success' | 'warning',
        timestamp: new Date(),
        read: false,
        link: `/home/requests/details/${requestId}`
      };

      // Notification pour le chef (lui-même)
      this.notificationService.addTargetedNotification(
        newStatus === 'Chef approuvé'
          ? `Vous avez approuvé la demande de ${request.type || ''}. L'admin prendra la décision finale.`
          : `Vous avez rejeté la demande de ${request.type || ''}. L'admin prendra la décision finale.`,
        newStatus === 'Chef approuvé' ? 'success' : 'warning',
        currentUser.id,
        `/home/requests/details/${requestId}`
      );

      // Notification pour l'admin
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const admins = allUsers.filter((u: any) => u.role === 'admin');
      admins.forEach((admin: any) => {
        this.notificationService.addTargetedNotification(
          `Le chef ${currentUser.firstName || ''} ${currentUser.lastName || ''} a ${newStatus === 'Chef approuvé' ? 'approuvé' : 'rejeté'} une demande de ${request.type || ''} de ${(request.user?.firstname || '')} ${(request.user?.lastname || '')}.`,
          'info',
          admin.id,
          `/admin/requests/details/${requestId}`
        );
      });

      // Notification pour l'employé
      this.notificationService.addTargetedNotification(
        employeeNotification.message,
        employeeNotification.type,
        request.user_id || '',
        employeeNotification.link
      );
      notifications.push(employeeNotification);
      
    } else if (isAdmin) {
      // L'admin peut approuver/rejeter toutes les demandes
      // Pour les demandes de congé et formation, l'admin ne peut approuver/rejeter
      // que si elles ont déjà été traitées par un chef
      if (isLeaveOrTraining && 
          request.status !== 'Chef approuvé' && 
          request.status !== 'Chef rejeté') {
        return of({ success: false });
      }

      this.requests[index] = {
        ...request,
        status: status,
        adminResponse: response,
        adminProcessedBy: currentUser.id,
        adminProcessedDate: new Date().toISOString(),
        response: response,
        processedBy: currentUser.id
      };

      // Créer une notification pour l'employé
      const employeeNotification = {
        id: Date.now().toString(),
        message: `Votre demande de ${request.type || ''} a été ${status === 'Approuvée' ? 'approuvée' : 'rejetée'} définitivement.`,
        type: status === 'Approuvée' ? 'success' : 'error' as 'success' | 'error',
        timestamp: new Date(),
        read: false,
        link: `/home/requests/details/${requestId}`
      };

      // Notifier le chef (si la demande a été traitée par un chef)
      if (request.chefProcessedBy) {
        this.notificationService.addTargetedNotification(
          `L'admin a ${status === 'Approuvée' ? 'approuvé' : 'rejeté'} définitivement la demande de ${request.type || ''} de ${(request.user?.firstname || '')} ${(request.user?.lastname || '')}.`,
          status === 'Approuvée' ? 'success' : 'error',
          request.chefProcessedBy,
          `/admin/requests/details/${requestId}`
        );
      }

      // Notification pour l'employé
      this.notificationService.addTargetedNotification(
        employeeNotification.message,
        employeeNotification.type,
        request.user_id || '',
        employeeNotification.link
      );
      notifications.push(employeeNotification);
      
    } else {
      // Les utilisateurs normaux ne peuvent pas changer le statut des demandes
      return of({ success: false });
    }

    this.saveRequests();
    return of({ success: true, notifications });
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

  // Méthode pour créer des demandes de test
  createTestRequests(): void {
    this.requests = [
      // Exemples de demandes réelles
      {
        id: 'req-' + new Date().getTime() + '-1',
        user_id: '1',
        type: 'Congé',
        date: new Date().toISOString(),
        status: 'En attente',
        description: 'Congé annuel',
        details: {
          startDate: '2023-07-15',
          endDate: '2023-07-20',
          leaveType: 'annuel',
          reason: 'Vacances d\'été',
          days: 6
        },
        user: {
          id: '1',
          firstname: 'Mohammed',
          lastname: 'Alaoui',
          role: 'employee'
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'req-' + new Date().getTime() + '-2',
        user_id: '2',
        type: 'Formation',
        date: new Date().toISOString(),
        status: 'En attente',
        description: 'Formation Angular',
        details: {
          title: 'Formation Angular avancée',
          organization: 'Google',
          startDate: '2023-08-10',
          endDate: '2023-08-15',
          trainingType: 'Technique',
          objectives: 'Améliorer les compétences en Angular',
          cost: 1500
        },
        user: {
          id: '2',
          firstname: 'Fatima',
          lastname: 'Zahra',
          role: 'employee'
        },
        createdAt: new Date().toISOString()
      }
    ];
    
    this.saveRequests();
  }

  // Méthode pour ajouter une nouvelle demande de congé
  addLeaveRequest(data: {
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    dayType?: string;
    dayPart?: 'full' | 'morning' | 'afternoon';
    includeWeekends?: boolean;
  }): string {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return '';

    // Calculer le nombre de jours de congé
    const workingDays = this.calculateWorkingDays(
      data.startDate,
      data.endDate,
      data.includeWeekends || false,
      data.dayPart || 'full'
    );

    // Créer une nouvelle demande
    return this.createRequest({
      type: 'Congé',
      description: `Demande de ${data.leaveType}`,
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
    });
  }

  // Méthode pour ajouter une nouvelle demande de formation
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
  }): string {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return '';

    return this.createRequest({
      type: 'Formation',
      description: data.title,
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
    });
  }

  // Méthode pour ajouter une nouvelle demande de certificat
  addCertificateRequest(data: {
    purpose: string;
    otherPurpose?: string;
    language: string;
    copies: number;
    comments?: string;
  }): string {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return '';

    return this.createRequest({
      type: 'Attestation de travail',
      description: `Attestation de travail - ${data.purpose === 'other' ? data.otherPurpose : data.purpose}`,
      details: {
        purpose: data.purpose === 'other' ? data.otherPurpose : data.purpose,
        language: data.language,
        copies: data.copies,
        comments: data.comments
      }
    });
  }

  // Méthode pour ajouter une nouvelle demande de document
  addDocumentRequest(data: {
    documentType: string;
    urgency: 'low' | 'medium' | 'high';
    additionalInfo?: string;
  }): string {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return '';

    return this.createRequest({
      type: 'Document',
      description: `Demande de document - ${data.documentType}`,
      details: {
        documentType: data.documentType,
        urgency: data.urgency,
        additionalInfo: data.additionalInfo
      }
    });
  }

  // Méthode pour ajouter une nouvelle demande de prêt
  addLoanRequest(data: FormData): string {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return '';

    const loanType = (data.get('loanType')?.toString() || 'personal') as 'personal' | 'car' | 'house';
    const loanAmount = Number(data.get('loanAmount'));

    const loanTypes: { [key: string]: string } = {
      'personal': 'Prêt personnel',
      'car': 'Prêt automobile',
      'house': 'Prêt immobilier'
    };

    return this.createRequest({
      type: loanTypes[loanType] || 'Prêt',
      description: `Demande de ${loanTypes[loanType] || 'prêt'} de ${loanAmount} DT`,
      details: {
        loanType: loanType,
        loanAmount: loanAmount,
        attachments: Array.from(data.getAll('attachments')).map(file => file as File)
      }
    });
  }

  // Méthode pour ajouter une nouvelle demande d'avance
  addAdvanceRequest(data: FormData): string {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return '';

    const advanceAmount = data.get('advanceAmount');
    const advanceReason = data.get('advanceReason');

    return this.createRequest({
      type: 'Avance',
      description: `Demande d'avance de ${advanceAmount} DT`,
      details: {
        advanceAmount: Number(advanceAmount),
        advanceReason: advanceReason?.toString(),
        attachments: Array.from(data.getAll('attachments')).map(file => file as File)
      }
    });
  }

  // Méthode pour mettre à jour une demande de congé
  updateLeaveRequest(requestId: string, data: {
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    dayPart?: 'full' | 'morning' | 'afternoon';
    includeWeekends?: boolean;
  }): boolean {
    const request = this.findRequestById(requestId);
    if (!request) return false;

    const includeWeekends = data.leaveType === 'annuel' || data.leaveType === 'maternity' || data.leaveType === 'paternity';
    const days = this.calculateWorkingDays(data.startDate, data.endDate, includeWeekends, data.dayPart);
    const dayType = includeWeekends ? 'jours (weekends inclus)' : 'jours ouvrables';
    const dayPart = data.dayPart === 'full' ? '' : 
                   data.dayPart === 'morning' ? ' (matin)' : ' (après-midi)';
    
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index === -1) return false;
    
    this.requests[index] = {
      ...this.requests[index],
      type: this.leaveTypes[data.leaveType],
      description: `Congé du ${data.startDate} au ${data.endDate}${dayPart} (${days} ${dayType})`,
      details: {
        ...this.requests[index].details,
        startDate: data.startDate,
        endDate: data.endDate,
        leaveType: data.leaveType,
        dayPart: data.dayPart,
        reason: data.reason,
        workingDays: days
      }
    };
    
    this.saveRequests();
    return true;
  }

  // Méthode pour mettre à jour une demande de formation
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
  }): boolean {
    const request = this.findRequestById(requestId);
    if (!request) return false;
    
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index === -1) return false;
    
    this.requests[index] = {
      ...this.requests[index],
      type: 'Formation',
      description: data.title,
      details: {
        ...this.requests[index].details,
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
    
    this.saveRequests();
    return true;
  }

  // Méthode pour mettre à jour une demande de certificat
  updateCertificateRequest(requestId: string, data: {
    purpose: string;
    otherPurpose?: string;
    language: string;
    copies: number;
    comments?: string;
  }): boolean {
    const request = this.findRequestById(requestId);
    if (!request) return false;
    
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index === -1) return false;
    
    this.requests[index] = {
      ...this.requests[index],
      type: 'Attestation de travail',
      description: `Attestation de travail - ${data.purpose === 'other' ? data.otherPurpose : data.purpose}`,
      details: {
        ...this.requests[index].details,
        purpose: data.purpose === 'other' ? data.otherPurpose : data.purpose,
        language: data.language,
        copies: data.copies,
        comments: data.comments
      }
    };
    
    this.saveRequests();
    return true;
  }

  // Méthode pour mettre à jour une demande de document
  updateDocumentRequest(requestId: string, data: {
    documentType: string;
    urgency: 'low' | 'medium' | 'high';
    additionalInfo?: string;
  }): boolean {
    const request = this.findRequestById(requestId);
    if (!request) return false;
    
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index === -1) return false;
    
    this.requests[index] = {
      ...this.requests[index],
      type: 'Document',
      description: `Demande de document - ${data.documentType}`,
      details: {
        ...this.requests[index].details,
        documentType: data.documentType,
        urgency: data.urgency,
        additionalInfo: data.additionalInfo
      }
    };
    
    this.saveRequests();
    return true;
  }

  // Méthode pour mettre à jour une demande de prêt
  updateLoanRequest(requestId: string, data: FormData): boolean {
    const request = this.findRequestById(requestId);
    if (!request) return false;
    
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index === -1) return false;
    
    const loanType = (data.get('loanType')?.toString() || 'personal') as 'personal' | 'car' | 'house';
    const loanAmount = Number(data.get('loanAmount'));
    
    const loanTypes: { [key: string]: string } = {
      'personal': 'Prêt personnel',
      'car': 'Prêt automobile',
      'house': 'Prêt immobilier'
    };
    
    this.requests[index] = {
      ...this.requests[index],
      type: loanTypes[loanType] || 'Prêt',
      description: `Demande de ${loanTypes[loanType] || 'prêt'} de ${loanAmount} DT`,
      details: {
        ...this.requests[index].details,
        loanType: loanType,
        loanAmount: loanAmount,
        attachments: Array.from(data.getAll('attachments')).map(file => file as File)
      }
    };
    
    this.saveRequests();
    return true;
  }

  // Méthode pour mettre à jour une demande d'avance
  updateAdvanceRequest(requestId: string, data: FormData): boolean {
    const request = this.findRequestById(requestId);
    if (!request) return false;
    
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index === -1) return false;
    
    const advanceAmount = Number(data.get('advanceAmount'));
    const advanceReason = data.get('advanceReason')?.toString();
    
    this.requests[index] = {
      ...this.requests[index],
      type: 'Avance',
      description: `Demande d'avance de ${advanceAmount} DT`,
      details: {
        ...this.requests[index].details,
        advanceAmount: advanceAmount,
        advanceReason: advanceReason,
        attachments: Array.from(data.getAll('attachments')).map(file => file as File)
      }
    };
    
    this.saveRequests();
    return true;
  }

  // Méthode pour supprimer une demande
  deleteRequest(requestId: string): boolean {
    const request = this.findRequestById(requestId);
    if (!request) return false;
    
    const index = this.requests.findIndex(r => r.id === requestId);
    if (index === -1) return false;
    
    this.requests.splice(index, 1);
    this.saveRequests();
    
    return true;
  }
}
