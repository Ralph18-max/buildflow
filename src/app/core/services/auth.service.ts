import { Injectable } from '@angular/core';

export type UserRole = 'admin' | 'conducteur' | 'chef_chantier' | 'comptable';

export interface AuthUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  initiales: string;
}

const USERS_SIMULÉS: Record<UserRole, AuthUser> = {
  admin: {
    id: 1, nom: 'Yves', prenom: 'Konan',
    email: 'konan.yves@buildflow.ci',
    role: 'admin', initiales: 'KY'
  },
  conducteur: {
    id: 2, nom: 'Diallo', prenom: 'Moussa',
    email: 'moussa.diallo@buildflow.ci',
    role: 'conducteur', initiales: 'MD'
  },
  chef_chantier: {
    id: 3, nom: 'Awa', prenom: 'Traoré',
    email: 'awa.traore@buildflow.ci',
    role: 'chef_chantier', initiales: 'AT'
  },
  comptable: {
    id: 4, nom: 'Kouassi', prenom: 'Bénédicte',
    email: 'benedicte.kouassi@buildflow.ci',
    role: 'comptable', initiales: 'BK'
  }
};

@Injectable({ providedIn: 'root' })
export class AuthService {

  private currentUser: AuthUser = USERS_SIMULÉS['admin'];

  login(role: UserRole): void {
    this.currentUser = USERS_SIMULÉS[role];
  }

  logout(): void {
    this.currentUser = USERS_SIMULÉS['admin'];
  }

  isLoggedIn(): boolean {
    return true;
  }

  getUser(): AuthUser {
    return this.currentUser;
  }

  getRole(): UserRole {
    return this.currentUser.role;
  }

  hasRole(roles: UserRole[]): boolean {
    return roles.includes(this.currentUser.role);
  }
}