import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SharedDataService } from '../../shared-data.service';

export interface RequestDetails {
  startDate?: string;
  endDate?: string;
  leaveType?: string;
  reason?: string;
  title?: string;
  organization?: string;
  trainingType?: string;
  objectives?: string;
  cost?: number;
  purpose?: string;
  language?: string;
  copies?: number;
  comments?: string;
  // Champs pour la demande d'avance
  advanceAmount?: number;
  advanceReason?: string;
  attachmentCount?: number;
  // Champs pour la demande de document administratif
  documentType?: string;
  urgency?: string;
  objective?: string;
  // Champs pour la demande de prêt
  loanType?: string;
  loanAmount?: number;
}

export interface Request {
  id: number;
  type: string;
  status: string;
  date: string;
  description: string;
  details: RequestDetails;
}

@Injectable({
  providedIn: 'root'
})
export class RequestsService {
  constructor(private sharedDataService: SharedDataService) {}

  /**
   * Récupérer toutes les demandes
   */
  getRequests(): Observable<Request[]> {
    return this.sharedDataService.getRequests();
  }

  /**
   * Récupérer une demande par son ID
   */
  getRequestById(id: number): Request | undefined {
    return this.sharedDataService.getRequestById(id);
  }

  /**
   * Mettre à jour une demande existante
   */
  updateRequest(updatedRequest: Request): void {
    this.sharedDataService.updateRequest(updatedRequest);
  }

  /**
   * Ajouter une nouvelle demande
   */
  addRequest(request: Partial<Request>): void {
    this.sharedDataService.addRequest(request);
  }

  addLeaveRequest(data: any) {
    const request: Partial<Request> = {
      type: 'Congé annuel',
      description: `Congé du ${data.startDate} au ${data.endDate}`,
      details: {
        startDate: data.startDate,
        endDate: data.endDate,
        leaveType: data.leaveType,
        reason: data.reason
      }
    };
    this.sharedDataService.addRequest(request);
  }

  addTrainingRequest(data: any) {
    const request: Partial<Request> = {
      type: 'Formation',
      description: data.title,
      details: {
        title: data.title,
        organization: data.organization,
        startDate: data.startDate,
        endDate: data.endDate,
        trainingType: data.trainingType,
        objectives: data.objectives,
        cost: data.cost
      }
    };
    this.sharedDataService.addRequest(request);
  }

  addCertificateRequest(data: any) {
    const request: Partial<Request> = {
      type: 'Attestation de travail',
      description: `Attestation de travail - ${data.purpose === 'other' ? data.otherPurpose : data.purpose}`,
      details: {
        purpose: data.purpose === 'other' ? data.otherPurpose : data.purpose,
        language: data.language,
        copies: data.copies,
        comments: data.comments
      }
    };
    this.addRequest(request);
  }
  
  addDocumentRequest(data: any) {
    const request: Partial<Request> = {
      type: 'Document administratif',
      description: `Demande de ${data.documentType}`,
      details: {
        documentType: data.documentType,
        reason: data.reason,
        urgency: data.urgency,
        objective: data.objective,
        language: data.language,
        copies: data.copies,
        comments: data.comments
      }
    };
    this.addRequest(request);
  }
  
  addLoanRequest(data: any) {
    const request: Partial<Request> = {
      type: 'Prêt',
      description: `Demande de prêt ${data.loanType} de ${data.loanAmount} DH`,
      details: {
        loanType: data.loanType,
        loanAmount: data.loanAmount,
        reason: data.reason
      }
    };
    this.addRequest(request);
  }
  
  addAdvanceRequest(data: any) {
    const request: Partial<Request> = {
      type: 'Avance sur salaire',
      description: `Demande d'avance de ${data.advanceAmount} DH`,
      details: {
        advanceAmount: data.advanceAmount,
        advanceReason: data.reason
      }
    };
    this.addRequest(request);
  }

  updateLeaveRequest(id: number, data: any) {
    const request = this.getRequestById(id);
    if (request) {
      request.description = `Congé du ${data.startDate} au ${data.endDate}`;
      request.details = {
        startDate: data.startDate,
        endDate: data.endDate,
        leaveType: data.leaveType,
        reason: data.reason
      };
      this.updateRequest(request);
    }
  }

  updateTrainingRequest(id: number, data: any) {
    const request = this.getRequestById(id);
    if (request) {
      request.description = data.title;
      request.details = {
        title: data.title,
        organization: data.organization,
        startDate: data.startDate,
        endDate: data.endDate,
        trainingType: data.trainingType,
        objectives: data.objectives,
        cost: data.cost
      };
      this.updateRequest(request);
    }
  }

  updateCertificateRequest(id: number, data: any) {
    const request = this.getRequestById(id);
    if (request) {
      request.description = `Attestation de travail - ${data.purpose === 'other' ? data.otherPurpose : data.purpose}`;
      request.details = {
        purpose: data.purpose === 'other' ? data.otherPurpose : data.purpose,
        language: data.language,
        copies: data.copies,
        comments: data.comments
      };
      this.updateRequest(request);
    }
  }
  
  updateDocumentRequest(id: number, data: any) {
    const request = this.getRequestById(id);
    if (request) {
      request.description = `Demande de ${data.documentType}`;
      request.details = {
        documentType: data.documentType,
        reason: data.reason,
        urgency: data.urgency,
        objective: data.objective,
        language: data.language,
        copies: data.copies,
        comments: data.comments
      };
      this.updateRequest(request);
    }
  }
  
  updateLoanRequest(id: number, data: any) {
    const request = this.getRequestById(id);
    if (request) {
      request.description = `Demande de prêt ${data.loanType} de ${data.loanAmount} DH`;
      request.details = {
        loanType: data.loanType,
        loanAmount: data.loanAmount,
        reason: data.reason
      };
      this.updateRequest(request);
    }
  }
  
  updateAdvanceRequest(id: number, data: any) {
    const request = this.getRequestById(id);
    if (request) {
      request.description = `Demande d'avance de ${data.advanceAmount} DH`;
      request.details = {
        advanceAmount: data.advanceAmount,
        advanceReason: data.reason
      };
      this.updateRequest(request);
    }
  }
}
