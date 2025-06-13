import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestsService } from '../requests.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-loan-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loan-request.component.html',
  styleUrls: ['./loan-request.component.scss']
})
export class LoanRequestComponent implements OnInit {
  loanForm!: FormGroup;
  editMode = false;
  requestId: number | null = null;
  attachments: File[] = [];
  
  // Feedback utilisateur
  isSubmitting: boolean = false;
  submitError: string | null = null;
  submitSuccess: string | null = null;
  
  // Informations sur le salaire et le plafond de prêt
  loanInfo = {
    monthlySalary: 3000, // Salaire mensuel par défaut
    loanCap: 1200 // 40% du salaire mensuel
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private requestsService: RequestsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.calculateLoanCap();

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
    this.loanForm = this.fb.group({
      loanType: ['personal', Validators.required],
      loanAmount: [null, [
        Validators.required, 
        Validators.min(100),
        Validators.max(this.loanInfo.loanCap)
      ]],
      reason: ['', Validators.required],
      attachments: [null]
    });
  }

  calculateLoanCap(): void {
    // Dans une application réelle, vous récupéreriez le salaire de l'utilisateur depuis le backend
    this.loanInfo.loanCap = this.loanInfo.monthlySalary * 0.4;
  }

  loadRequestData(id: number): void {
    const request = this.requestsService.getRequestById(id);
    if (request) {
      try {
        const details = typeof request.details === 'string' 
          ? JSON.parse(request.details) 
          : request.details;
          
        this.loanForm.patchValue({
          loanType: details.loanType,
          loanAmount: details.loanAmount
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
    if (this.loanForm.valid) {
      const formData = this.loanForm.value;
      
      // Créer un objet pour la demande de prêt
      const loanData = {
        loanType: formData.loanType,
        loanAmount: formData.loanAmount,
        reason: 'Demande de prêt ' + this.getLoanTypeLabel(formData.loanType)
      };
      
      if (this.editMode && this.requestId) {
        // Mettre à jour la demande existante
        this.requestsService.updateLoanRequest(this.requestId, loanData);
        
        // Feedback et redirection
        setTimeout(() => {
          this.router.navigate(['/home/requests']);
        }, 1000);
      } else {
        // Ajouter une nouvelle demande
        this.requestsService.addLoanRequest(loanData);
        
        // Feedback et redirection
        setTimeout(() => {
          this.router.navigate(['/home/requests']);
        }, 1000);
      }
    }
  }

  getLoanTypeLabel(type: string): string {
    switch (type) {
      case 'personal':
        return 'personnel';
      case 'car':
        return 'automobile';
      case 'house':
        return 'immobilier';
      default:
        return '';
    }
  }

  onCancel(): void {
    this.router.navigate(['/home/requests']);
  }
}
