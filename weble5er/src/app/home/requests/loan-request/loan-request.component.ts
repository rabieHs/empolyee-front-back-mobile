import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestsService } from '../requests.service';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../../services/employee.service';
import { AuthService } from '../../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-loan-request',
  templateUrl: './loan-request.component.html',
  styleUrls: ['./loan-request.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe],
})
export class LoanRequestComponent implements OnInit {
  requestId: string | null = null;
  editMode = false;
  loanForm: FormGroup;

  loanInfo: { monthlySalary: number; loanCap: number };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestsService: RequestsService,
    private authService: AuthService,
    private employeeService: EmployeeService
  ) {
    this.loanInfo = this.employeeService.getMaximumLoanInfo();

    this.loanForm = new FormGroup({
      loanType: new FormControl('personal', [Validators.required]),
      loanAmount: new FormControl(0, [
        Validators.required,
        Validators.min(0)
      ]),
      attachments: new FormControl(null, [Validators.required])
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.requestId = id;
      this.editMode = true;
      this.requestsService.getRequestById(id).subscribe(request => {
        if (request && request.details) {
          this.loanForm.patchValue({
            loanType: request.details['loanType'] || 'personal',
            loanAmount: request.details['loanAmount'] || 0,
            attachments: request.details['attachments'] || null
          });
        }
      });
    }
  }

  onSubmit() {
    if (!this.loanForm.valid) {
      return;
    }

    const formData = new FormData();
    const formValues = this.loanForm.value;

    formData.append('loanType', formValues.loanType);
    formData.append('loanAmount', formValues.loanAmount);

    const files = formValues.attachments;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('attachments', files[i]);
      }
    }

    if (this.requestId) {
      // Update existing loan request
      this.requestsService.updateLoanRequest(this.requestId, formData).subscribe({
        next: () => {
          console.log('Loan request updated successfully');
          this.router.navigate(['/home/requests']);
        },
        error: (err: any) => {
          console.error('Error updating loan request:', err);
        }
      });
    } else {
      // Create new loan request using the API service
      this.requestsService.addLoanRequest(formData).subscribe({
        next: () => {
          console.log('Loan request created successfully');
          this.router.navigate(['/home/requests']);
        },
        error: (err: any) => {
          console.error('Error creating loan request:', err);
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/home/requests']);
  }
}


