import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastComponent } from '../toast/toast';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [NgIf, RouterModule, ToastComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class LayoutComponent {

  sidebarOpen = false;

  // Sprint 8 : brancher un vrai NotificationService
  readonly notifCount = 0;

  get user() { return this.auth.getUser(); }

  constructor(public auth: AuthService, private router: Router) {}

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar()  { this.sidebarOpen = false; }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  isAdmin()             { return this.auth.hasRole(['admin']); }
  isAdminOrConducteur() { return this.auth.hasRole(['admin', 'conducteur']); }
  isComptable()         { return this.auth.hasRole(['comptable']); }
  isTerrain()           { return this.auth.hasRole(['admin', 'conducteur', 'chef_chantier']); }

  getRoleLabel(role: string | undefined): string {
    const labels: Record<string, string> = {
      admin:         'Administrateur',
      conducteur:    'Conducteur de travaux',
      chef_chantier: 'Chef de chantier',
      comptable:     'Comptable',
    };
    return labels[role ?? ''] || (role ?? '');
  }
}