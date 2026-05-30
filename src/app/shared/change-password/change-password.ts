import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss'
})
export class ChangePasswordComponent {
  @Output() fermer = new EventEmitter<void>();

  ancien = '';
  nouveau = '';
  confirmation = '';
  loading = false;
  erreur = '';
  succes = '';

  showAncien = false;
  showNouveau = false;
  showConfirm = false;

  constructor(private auth: AuthService) {}

  get valide(): boolean {
    return !!this.ancien && this.nouveau.length >= 8 && this.nouveau === this.confirmation;
  }

  soumettre(): void {
    if (this.nouveau !== this.confirmation) {
      this.erreur = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.nouveau.length < 8) {
      this.erreur = 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (!/[A-Z]/.test(this.nouveau) || !/[0-9]/.test(this.nouveau)) {
      this.erreur = 'Le mot de passe doit contenir au moins une majuscule et un chiffre.';
      return;
    }
    this.loading = true;
    this.erreur = '';
    this.succes = '';

    this.auth.changerMotDePasse(this.ancien, this.nouveau).subscribe({
      next: () => {
        this.loading = false;
        this.succes = 'Mot de passe modifié avec succès !';
        setTimeout(() => this.fermer.emit(), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.erreur = err?.error?.message ?? 'Une erreur est survenue.';
      },
    });
  }
}
