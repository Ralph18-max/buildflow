import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgIf],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPasswordComponent {

  forgotForm: FormGroup;
  isLoading = false;
  emailSent = false;

  constructor(private fb: FormBuilder) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;
    this.isLoading = true;

    // Simulation — sera remplacé par l'appel API réel
    setTimeout(() => {
      this.isLoading = false;
      this.emailSent = true;
    }, 1500);
  }

  get email() { return this.forgotForm.get('email'); }
}