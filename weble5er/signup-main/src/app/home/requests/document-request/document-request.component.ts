import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestsService } from '../requests.service';

@Component({
  selector: 'app-document-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './document-request.component.html',
  styleUrls: ['./document-request.component.scss']
})
export class DocumentRequestComponent implements OnInit {
  documentForm!: FormGroup;
  editMode = false;
  requestId: number | null = null;
  
  // Variables pour le feedback utilisateur
  isSubmitting = false;
  submitSuccess: string | null = null;
  submitError: string | null = null;
  
  documentTypes: string[] = [
    'Attestation de travail',
    'Attestation de salaire',
    'Attestation de présence',
    'Autre'
  ];
  
  urgencyLevels = [
    { value: 'normal', label: 'Normale' },
    { value: 'high', label: 'Haute' },
    { value: 'urgent', label: 'Urgente' }
  ];

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
    this.documentForm = this.fb.group({
      documentType: ['', Validators.required],
      reason: ['', Validators.required],
      urgency: ['normal'],
      objective: [''],
      language: ['fr'],
      copies: [1, [Validators.required, Validators.min(1)]],
      comments: ['']
    });
  }

  loadRequestData(id: number): void {
    const request = this.requestsService.getRequestById(id);
    if (request) {
      try {
        const details = typeof request.details === 'string' 
          ? JSON.parse(request.details) 
          : request.details;
          
        this.documentForm.patchValue({
          documentType: details.documentType,
          reason: details.reason,
          urgency: details.urgency,
          objective: details.objective || '',
          language: details.language,
          copies: details.copies,
          comments: details.comments || ''
        });
      } catch (error) {
        console.error('Erreur lors du parsing des détails de la demande', error);
      }
    }
  }

  onSubmit(): void {
    if (this.documentForm.valid) {
      this.isSubmitting = true;
      this.submitError = null;
      this.submitSuccess = null;
      
      const formData = this.documentForm.value;
      
      try {
        if (this.editMode && this.requestId) {
          // Mettre à jour la demande existante en utilisant la méthode spécifique
          this.requestsService.updateDocumentRequest(this.requestId, formData);
          this.submitSuccess = "Demande de document mise à jour avec succès.";
        } else {
          // Ajouter une nouvelle demande en utilisant la méthode spécifique
          this.requestsService.addDocumentRequest(formData);
          this.submitSuccess = "Demande de document envoyée avec succès.";
        }
        
        // Redirection vers la liste des demandes après un court délai
        setTimeout(() => {
          this.router.navigate(['/home/requests']);
        }, 1500);
      } catch (error) {
        this.submitError = "Une erreur s'est produite lors de l'enregistrement de la demande.";
        console.error('Erreur lors de la soumission de la demande de document:', error);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/home/requests']);
  }
}
