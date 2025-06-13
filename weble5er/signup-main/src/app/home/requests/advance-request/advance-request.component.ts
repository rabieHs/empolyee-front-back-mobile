import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestsService } from '../requests.service';

@Component({
  selector: 'app-advance-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './advance-request.component.html',
  styleUrls: ['./advance-request.component.scss']
})
export class AdvanceRequestComponent implements OnInit {
  advanceForm!: FormGroup;
  editMode = false;
  requestId: number | null = null;
  attachments: File[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private requestsService: RequestsService
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Vérifier si on est en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.editMode = true;
        this.requestId = +params['id'];
        this.loadRequestData(this.requestId);
      }
    });
  }

  initForm(): void {
    this.advanceForm = this.fb.group({
      advanceAmount: [null, [Validators.required, Validators.min(1), Validators.max(2000000)]],
      advanceReason: ['', Validators.required],
      attachments: [null]
    });
  }

  loadRequestData(id: number): void {
    const request = this.requestsService.getRequestById(id);
    if (request) {
      try {
        const details = typeof request.details === 'string' 
          ? JSON.parse(request.details) 
          : request.details;
          
        this.advanceForm.patchValue({
          advanceAmount: details.advanceAmount,
          advanceReason: details.advanceReason
        });
      } catch (error) {
        console.error('Erreur lors du parsing des détails de la demande', error);
      }
    }
  }

  onFileChange(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.attachments = Array.from(event.target.files);
    }
  }

  onSubmit(): void {
    if (this.advanceForm.valid) {
      const formData = this.advanceForm.value;
      
      // Créer un objet RequestDetails pour la demande d'avance
      const details = {
        advanceAmount: formData.advanceAmount,
        advanceReason: formData.advanceReason,
        attachmentCount: this.attachments.length
      };
      
      const requestData = {
        type: 'Avance',
        status: 'En attente',
        date: new Date().toISOString().split('T')[0],
        description: `Demande d'avance de ${formData.advanceAmount} DT`,
        details: details
      };

      if (this.editMode && this.requestId) {
        // Récupérer la demande existante
        const existingRequest = this.requestsService.getRequestById(this.requestId);
        if (existingRequest) {
          // Mettre à jour la demande existante
          const updatedRequest = {
            ...existingRequest,
            type: requestData.type,
            status: requestData.status,
            description: requestData.description,
            details: requestData.details
          };
          this.requestsService.updateRequest(updatedRequest);
          this.router.navigate(['/home/requests']);
        }
      } else {
        // Ajouter une nouvelle demande
        this.requestsService.addRequest(requestData);
        this.router.navigate(['/home/requests']);
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/home/requests']);
  }
}
