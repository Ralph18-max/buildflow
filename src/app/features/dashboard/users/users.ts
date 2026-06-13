import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UtilisateurService } from '../../../core/services/utilisateur.service';
import { Utilisateur } from '../../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class UsersComponent implements OnInit, OnDestroy {

  showModal = false;
  isLoading = false;
  successMessage = '';

  userForm: FormGroup;

  roles = [
    { value: 'admin',         label: 'Administrateur',        icon: 'admin_panel_settings' },
    { value: 'conducteur',    label: 'Conducteur de travaux', icon: 'engineering' },
    { value: 'chef_chantier', label: 'Chef de chantier',      icon: 'construction' },
    { value: 'comptable',     label: 'Comptable',             icon: 'account_balance' },
  ];

  users: Utilisateur[] = [];

  private subs = new Subscription();

  constructor(private fb: FormBuilder, private utilisateurService: UtilisateurService) {
    this.userForm = this.fb.group({
      nom:    ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email:  ['', [Validators.required, Validators.email]],
      role:   ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.subs.add(
      this.utilisateurService.getAll().subscribe(u => { this.users = u; })
    );
  }

  ngOnDestroy(): void { this.subs.unsubscribe(); }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin:         'Administrateur',
      conducteur:    'Conducteur de travaux',
      chef_chantier: 'Chef de chantier',
      comptable:     'Comptable',
    };
    return labels[role] || role;
  }

  toggleActif(user: Utilisateur): void {
    this.utilisateurService.toggleActif(user.id).subscribe({
      next: (actif) => {
        const found = this.users.find(u => u.id === user.id);
        if (found) found.actif = actif;
      },
    });
  }

  showModalSupprimer = false;
  userASupprimer: Utilisateur | null = null;

  supprimerUser(user: Utilisateur): void {
    this.userASupprimer = user;
    this.showModalSupprimer = true;
  }

  annulerSupprimer(): void {
    this.showModalSupprimer = false;
    this.userASupprimer = null;
  }

  confirmerSupprimer(): void {
    if (!this.userASupprimer) return;
    this.utilisateurService.supprimer(this.userASupprimer.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.userASupprimer!.id);
        this.annulerSupprimer();
      },
    });
  }

  openModal(): void {
    this.showModal = true;
    this.userForm.reset();
    this.successMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.userForm.reset();
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;
    this.isLoading = true;
    const v = this.userForm.value;

    this.utilisateurService.ajouter({
      nom:    v.nom,
      prenom: v.prenom,
      email:  v.email,
      role:   v.role,
      actif:  true,
    }).subscribe({
      next: (u) => {
        this.users = [...this.users, u];
        this.isLoading = false;
        this.successMessage = `Compte créé — un email avec le mot de passe temporaire a été envoyé à ${v.email}`;
        this.userForm.reset();
      },
      error: (err: any) => {
        this.isLoading = false;
        this.successMessage = err?.error?.message || 'Erreur lors de la création du compte.';
      },
    });
  }

  getActifCount(): number { return this.users.filter(u => u.actif).length; }
  getRoleCount(role: string): number { return this.users.filter(u => u.role === role).length; }

  get nom()    { return this.userForm.get('nom'); }
  get prenom() { return this.userForm.get('prenom'); }
  get email()  { return this.userForm.get('email'); }
  get role()   { return this.userForm.get('role'); }

  // ── Modal modifier ────────────────────────────────────────────────────────

  showModalEditer = false;
  successEditer   = false;
  userEdite: Utilisateur | null = null;
  formEditer = { nom: '', prenom: '', email: '', role: '' };

  ouvrirEditer(user: Utilisateur): void {
    this.userEdite  = user;
    this.formEditer = { nom: user.nom, prenom: user.prenom, email: user.email, role: user.role };
    this.showModalEditer = true;
    this.successEditer   = false;
  }

  fermerEditer(): void { this.showModalEditer = false; }

  validerEditer(): void {
    if (!this.userEdite || !this.formEditer.nom || !this.formEditer.email) return;
    this.utilisateurService.modifier(this.userEdite.id, this.formEditer).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.id === updated.id);
        if (idx !== -1) this.users[idx] = updated;
        this.successEditer = true;
        setTimeout(() => { this.showModalEditer = false; this.successEditer = false; }, 1500);
      },
      error: () => { this.successEditer = false; },
    });
  }
}