import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class UsersComponent {

  showModal = false;
  isLoading = false;
  successMessage = '';

  userForm: FormGroup;

  roles = [
    { value: 'conducteur', label: 'Conducteur de travaux', icon: 'engineering' },
    { value: 'chef_chantier', label: 'Chef de chantier', icon: 'construction' },
    { value: 'comptable', label: 'Comptable', icon: 'account_balance' },
  ];

  users = [
    { id: 1, nom: 'Konan Yves', email: 'yves@buildflow.ci', role: 'admin', actif: true, initiales: 'KY' },
    { id: 2, nom: 'Diabaté Moussa', email: 'moussa@buildflow.ci', role: 'conducteur', actif: true, initiales: 'DM' },
    { id: 3, nom: 'Traoré Awa', email: 'awa@buildflow.ci', role: 'chef_chantier', actif: true, initiales: 'TA' },
    { id: 4, nom: 'Coulibaly Jean', email: 'jean@buildflow.ci', role: 'comptable', actif: true, initiales: 'CJ' },
    { id: 5, nom: 'Ouattara Fatou', email: 'fatou@buildflow.ci', role: 'conducteur', actif: false, initiales: 'OF' },
  ];

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
    });
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      admin: 'Administrateur',
      conducteur: 'Conducteur de travaux',
      chef_chantier: 'Chef de chantier',
      comptable: 'Comptable'
    };
    return labels[role] || role;
  }

  toggleActif(user: any) {
    user.actif = !user.actif;
  }

  openModal() {
    this.showModal = true;
    this.userForm.reset();
    this.successMessage = '';
  }

  closeModal() {
    this.showModal = false;
    this.userForm.reset();
  }

  onSubmit() {
    if (this.userForm.invalid) return;
    this.isLoading = true;

    // Simulation — sera remplacé par l'appel API réel
    setTimeout(() => {
      const v = this.userForm.value;
      this.users.push({
        id: this.users.length + 1,
        nom: `${v.nom} ${v.prenom}`,
        email: v.email,
        role: v.role,
        actif: true,
        initiales: `${v.nom[0]}${v.prenom[0]}`.toUpperCase()
      });
      this.isLoading = false;
      this.successMessage = `Compte créé — un email avec le mot de passe temporaire a été envoyé à ${v.email}`;
      this.userForm.reset();
    }, 1500);
  }
  getActifCount(): number {
  return this.users.filter(u => u.actif).length;
}

getRoleCount(role: string): number {
  return this.users.filter(u => u.role === role).length;
}

  get nom() { return this.userForm.get('nom'); }
  get prenom() { return this.userForm.get('prenom'); }
  get email() { return this.userForm.get('email'); }
  get role() { return this.userForm.get('role'); }
}