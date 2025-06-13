import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestsService } from '../requests.service';

import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-advance-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './advance-request.component.html',
  styleUrls: ['./advance-request.component.scss']
})
export class AdvanceRequestComponent implements OnInit {
  requestId: string | null = null;
  editMode = false;
  advanceForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestsService: RequestsService,
    private authService: AuthService
  ) {
    this.advanceForm = new FormGroup({
      advanceAmount: new FormControl(0, [
        Validators.required,
        Validators.min(0),
        Validators.max(2000)
      ]),
      advanceReason: new FormControl('', [Validators.required]),
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
          this.advanceForm.patchValue({
            advanceAmount: request.details['advanceAmount'] || 0,
            advanceReason: request.details['advanceReason'] || '',
            attachments: request.details['attachments'] || null
          });
        }
      });
    }
  }

  onSubmit() {
    if (!this.advanceForm.valid) {
      return;
    }

    const formData = new FormData();
    const formValues = this.advanceForm.value;

    formData.append('advanceAmount', formValues.advanceAmount);
    formData.append('advanceReason', formValues.advanceReason);

    const files = formValues.attachments;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('attachments', files[i]);
      }
    }

    if (this.requestId) {
      // Update existing advance request
      this.requestsService.updateAdvanceRequest(this.requestId, formData).subscribe({
        next: () => {
          console.log('Advance request updated successfully');
          this.router.navigate(['/home/requests']);
        },
        error: (err: any) => {
          console.error('Error updating advance request:', err);
        }
      });
    } else {
      // Create new advance request using the API service
      this.requestsService.addAdvanceRequest(formData).subscribe({
        next: () => {
          console.log('Advance request created successfully');
          this.router.navigate(['/home/requests']);
        },
        error: (err: any) => {
          console.error('Error creating advance request:', err);
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/home/requests']);
  }
}


