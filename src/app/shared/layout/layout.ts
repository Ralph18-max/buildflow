import { Component, OnInit, HostListener } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastComponent } from '../toast/toast';
import { ChangePasswordComponent } from '../change-password/change-password';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [NgClass, RouterModule, ToastComponent, ChangePasswordComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class LayoutComponent implements OnInit {

  sidebarOpen = false;
  notifPanelOpen = false;
  notifExpandedId: string | null = null;
  userMenuOpen = false;
  changePasswordOpen = false;

  get user() { return this.auth.getUser(); }
  get hasUnread(): boolean { return this.notifService.unreadCount() > 0; }

  constructor(
    public auth: AuthService,
    private router: Router,
    public notifService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.notifService.charger();
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar()  { this.sidebarOpen = false; }

  toggleNotifPanel(): void {
    this.notifPanelOpen = !this.notifPanelOpen;
    if (!this.notifPanelOpen) this.notifExpandedId = null;
  }
  closeNotifPanel(): void { this.notifPanelOpen = false; this.notifExpandedId = null; }

  toggleNotifDetail(id: string): void {
    this.notifExpandedId = this.notifExpandedId === id ? null : id;
    this.notifService.marquerLu(id);
  }

  naviguerNotif(lien?: string): void {
    this.notifPanelOpen = false;
    this.notifExpandedId = null;
    if (lien) this.router.navigate([lien]);
  }

  toggleUserMenu(): void { this.userMenuOpen = !this.userMenuOpen; }
  closeUserMenu(): void  { this.userMenuOpen = false; }
  openChangePassword(): void { this.changePasswordOpen = true; this.userMenuOpen = false; }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.notifPanelOpen = false; this.userMenuOpen = false; this.changePasswordOpen = false; }

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

  getNotifClass(type: string): string {
    return { danger: 'notif-danger', warning: 'notif-warning', info: 'notif-info' }[type] ?? '';
  }
}
