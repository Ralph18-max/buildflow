import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, NgIf],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordComponent {

  resetForm: FormGroup;
  isLoading = false;
  done = false;
  errorMessage = '';
  token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
  ) {
    this.resetForm = this.fb.group({
      password:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this._passwordsMatch });

    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.errorMessage = 'Lien de réinitialisation invalide.';
    }
  }

  private _passwordsMatch(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm   = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.invalid || !this.token) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.reinitialiserMotDePasse(this.token, this.resetForm.value.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.done = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Lien de réinitialisation invalide ou expiré.';
      },
    });
  }

  get password() { return this.resetForm.get('password'); }
  get confirmPassword() { return this.resetForm.get('confirmPassword'); }
}
