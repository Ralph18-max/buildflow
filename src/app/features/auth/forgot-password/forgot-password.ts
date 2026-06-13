import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

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

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;
    this.isLoading = true;

    this.authService.motDePasseOublie(this.forgotForm.value.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.emailSent = true;
      },
      error: () => {
        this.isLoading = false;
        this.emailSent = true; // réponse générique, ne pas révéler si l'email existe
      },
    });
  }

  get email() { return this.forgotForm.get('email'); }
}
