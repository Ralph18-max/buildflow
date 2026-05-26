import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { PermissionService } from './permission.service';
import { Role } from '../models';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

export type UserRole = 'admin' | 'conducteur' | 'chef_chantier' | 'comptable';

export interface AuthUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  avatar_initiales: string;
  entreprise?: string;
}

export interface LoginResponse {
  token: string;
  utilisateur: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private currentUser: AuthUser | null = null;
  private _loggedIn = false;

  constructor(private http: HttpClient, private perms: PermissionService) {
    this._restoreSession();
  }

  // ── Authentification ────────────────────────────────────────────────────

  register(data: { prenom: string; nom: string; societe: string; email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/register`, {
      prenom:       data.prenom,
      nom:          data.nom,
      nom_societe:  data.societe,
      email:        data.email,
      mot_de_passe: data.password,
    }).pipe(
      tap(res => {
        if (this.browser) {
          localStorage.setItem('buildflow_token', res.token);
          localStorage.setItem('buildflow_user', JSON.stringify(res.utilisateur));
        }
        this.currentUser = res.utilisateur;
        this._loggedIn = true;
        this._syncPerms(res.utilisateur);
      })
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, {
      email,
      mot_de_passe: password,
    }).pipe(
      tap(res => {
        if (this.browser) {
          localStorage.setItem('buildflow_token', res.token);
          localStorage.setItem('buildflow_user', JSON.stringify(res.utilisateur));
        }
        this.currentUser = res.utilisateur;
        this._loggedIn = true;
        this._syncPerms(res.utilisateur);
      })
    );
  }

  logout(): void {
    this._loggedIn = false;
    this.currentUser = null;
    if (this.browser) {
      localStorage.removeItem('buildflow_token');
      localStorage.removeItem('buildflow_user');
    }
    this.perms.logout();
  }

  isLoggedIn(): boolean {
    return this._loggedIn;
  }

  // ── Accesseurs ──────────────────────────────────────────────────────────

  getUser(): AuthUser | null { return this.currentUser; }
  getRole(): UserRole | null { return this.currentUser?.role ?? null; }

  hasRole(roles: UserRole[]): boolean {
    if (!this.currentUser) return false;
    return roles.includes(this.currentUser.role);
  }

  // ── Privé ───────────────────────────────────────────────────────────────

  private _restoreSession(): void {
    if (!this.browser) return;
    const token = localStorage.getItem('buildflow_token');
    const storedUser = localStorage.getItem('buildflow_user');
    if (!token || !storedUser) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        this.logout();
        return;
      }
      this.currentUser = JSON.parse(storedUser);
      this._loggedIn = true;
      this._syncPerms(this.currentUser!);
    } catch {
      this.logout();
    }
  }

  private _syncPerms(user: AuthUser): void {
    let tenantId = '';
    if (this.browser) {
      try {
        const token = localStorage.getItem('buildflow_token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          tenantId = payload.tenant_id || '';
        }
      } catch { /* ignore */ }
    }

    this.perms.login({
      id:        user.id,
      nom:       user.nom,
      prenom:    user.prenom,
      email:     user.email,
      role:      user.role as Role,
      tenant_id: tenantId,
      avatar:    user.avatar_initiales,
    });
  }
}
