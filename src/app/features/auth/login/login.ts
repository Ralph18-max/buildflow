import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserRole } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  selectedRole: UserRole = 'admin';
  loading = false;

  roles: { value: UserRole; label: string; description: string; initiales: string }[] = [
    { value: 'admin', label: 'Administrateur', description: 'Accès complet — clients, contrats, budget, utilisateurs', initiales: 'KY' },
    { value: 'conducteur', label: 'Conducteur de travaux', description: 'Planning, avancement, intervenants, situations', initiales: 'MD' },
    { value: 'chef_chantier', label: 'Chef de chantier', description: 'Rapports terrain, pointage, incidents', initiales: 'AT' },
    { value: 'comptable', label: 'Comptable', description: 'Finances, encaissements, bilan, clôture', initiales: 'BK' }
  ];

  constructor(private auth: AuthService, private router: Router) {}

  selectRole(role: UserRole) { this.selectedRole = role; }

  login() {
    this.loading = true;
    this.auth.login(this.selectedRole);
    const accueil: Record<string, string> = {
      admin: '/dashboard',
      conducteur: '/chantiers',
      chef_chantier: '/terrain',
      comptable: '/facturation',
    };
    setTimeout(() => this.router.navigate([accueil[this.selectedRole]]), 800);
  }
}