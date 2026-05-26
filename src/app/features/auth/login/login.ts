import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginResponse, UserRole } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  mode: 'register' | 'login' = 'register';

  // Connexion
  email        = '';
  password     = '';
  showPassword = false;

  // Inscription
  reg = { prenom: '', nom: '', societe: '', email: '', password: '' };
  showRegPassword = false;

  loading = false;
  error   = '';
  success = '';

  comptes: { label: string; icon: string; email: string; desc: string }[] = [
    { label: 'Administrateur',        icon: 'admin_panel_settings', email: 'admin@btp-abi.ci',      desc: 'Vision globale & gestion' },
    { label: 'Conducteur de travaux', icon: 'engineering',          email: 'conducteur@btp-abi.ci', desc: 'Pilotage terrain & planning' },
    { label: 'Chef de chantier',      icon: 'construction',         email: 'chef@btp-abi.ci',       desc: 'Rapports & pointages' },
    { label: 'Comptable',             icon: 'account_balance',      email: 'compta@btp-abi.ci',     desc: 'Bilan & facturation' },
  ];

  avantages = [
    { icon: 'bolt',        text: 'Données temps réel sur tous vos chantiers' },
    { icon: 'lock',        text: 'Sécurisé — accès cloisonné par rôle' },
    { icon: 'smartphone',  text: 'Accessible depuis mobile, tablette, PC' },
    { icon: 'trending_up', text: 'Traçabilité complète des actions' },
  ];

  readonly accueil: Record<string, string> = {
    admin:         '/dashboard',
    conducteur:    '/chantiers',
    chef_chantier: '/terrain',
    comptable:     '/facturation',
  };

  constructor(private auth: AuthService, private router: Router) {}

  setMode(m: 'register' | 'login'): void {
    this.mode    = m;
    this.error   = '';
    this.success = '';
  }

  setDemo(email: string): void {
    this.mode     = 'login';
    this.email    = email;
    this.password = 'Buildflow2026!';
    this.error    = '';
  }

  register(): void {
    const { prenom, nom, societe, email, password } = this.reg;
    if (!prenom || !nom || !societe || !email || !password) {
      this.error = 'Tous les champs sont obligatoires.';
      return;
    }
    if (password.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    this.loading = true;
    this.error   = '';

    this.auth.register({ prenom, nom, societe, email, password }).subscribe({
      next: (res: LoginResponse) => {
        const role = res.utilisateur.role as UserRole;
        this.router.navigate([this.accueil[role] || '/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error   = err?.error?.message ?? 'Une erreur est survenue. Réessayez.';
      },
    });
  }

  login(): void {
    if (!this.email || !this.password) {
      this.error = 'Veuillez saisir votre email et mot de passe.';
      return;
    }
    this.loading = true;
    this.error   = '';

    this.auth.login(this.email, this.password).subscribe({
      next: res => {
        const role = res.utilisateur.role as UserRole;
        this.router.navigate([this.accueil[role] || '/dashboard']);
      },
      error: () => {
        this.loading = false;
        this.error   = 'Email ou mot de passe incorrect.';
      },
    });
  }
}
