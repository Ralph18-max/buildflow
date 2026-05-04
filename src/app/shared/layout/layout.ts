import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, AuthUser } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [NgIf, RouterModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class LayoutComponent {

  sidebarOpen = false;
  user: AuthUser;

  constructor(public auth: AuthService) {
    this.user = this.auth.getUser();
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar()  { this.sidebarOpen = false; }

  isAdmin()             { return this.auth.hasRole(['admin']); }
  isAdminOrConducteur() { return this.auth.hasRole(['admin', 'conducteur']); }
  isComptable()         { return this.auth.hasRole(['comptable']); }
  isTerrain()           { return this.auth.hasRole(['admin', 'conducteur', 'chef_chantier']); }
}