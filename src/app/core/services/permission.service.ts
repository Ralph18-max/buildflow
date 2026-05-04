import { Injectable, signal } from '@angular/core';

export type Role = 'admin' | 'conducteur' | 'chef_chantier' | 'comptable';

export interface CurrentUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  tenant_id: string;
  avatar?: string;
}

// Matrice des permissions — source unique de vérité
const PERMISSIONS: Record<string, Role[]> = {
  // Clients
  'clients:create':           ['admin'],
  'clients:edit':             ['admin'],
  'clients:delete':           ['admin'],
  'clients:read':             ['admin', 'conducteur', 'comptable'],

  // Contrats
  'contrats:create':          ['admin'],
  'contrats:edit':            ['admin'],
  'contrats:read':            ['admin', 'conducteur', 'comptable'],
  'contrats:avenants:create': ['admin'],

  // Chantiers
  'chantiers:create':         ['admin', 'conducteur'],
  'chantiers:edit':           ['admin', 'conducteur'],
  'chantiers:read':           ['admin', 'conducteur', 'chef_chantier', 'comptable'],
  'chantiers:delete':         ['admin'],

  // Budget S0
  'budget:create':            ['admin'],
  'budget:edit':              ['admin'],
  'budget:read':              ['admin', 'conducteur', 'comptable'],

  // Planning & Corps d'état
  'planning:create':          ['admin', 'conducteur'],
  'planning:edit':            ['admin', 'conducteur'],
  'planning:read':            ['admin', 'conducteur', 'chef_chantier', 'comptable'],
  'corps_etat:avancement':    ['conducteur'],

  // Terrain
  'terrain:rapport:create': ['chef_chantier'],
  'terrain:pointage:create':  ['chef_chantier', 'conducteur'],
  'terrain:read':             ['admin', 'conducteur', 'chef_chantier'],

  // Facturation
  'facturation:create':       ['comptable'],
  'facturation:edit':         ['comptable'],
  'facturation:read':         ['admin', 'conducteur', 'comptable'],
  'facturation:encaissement': ['comptable'],

  // Documents
  'documents:upload':         ['admin', 'conducteur', 'chef_chantier'],
  'documents:delete':         ['admin', 'conducteur'],
  'documents:read':           ['admin', 'conducteur', 'chef_chantier', 'comptable'],

  // Clôture
  'cloture:bilan_valider':    ['comptable'],
  'cloture:cloturer':         ['admin'],

  // Utilisateurs
  'users:create':             ['admin'],
  'users:edit':               ['admin'],
  'users:read':               ['admin'],
};

@Injectable({ providedIn: 'root' })
export class PermissionService {

  // Signal réactif pour l'utilisateur courant
  // En prod : chargé depuis le JWT décodé
  private _currentUser = signal<CurrentUser>({
    id: 1,
    nom: 'Konan',
    prenom: 'Yao',
    email: 'admin@buildflow.ci',
    role: 'admin',
    tenant_id: 'tenant-abc-123',
    avatar: 'KY'
  });

  readonly currentUser = this._currentUser.asReadonly();

  /**
   * Vérifie si l'utilisateur courant a une permission donnée
   * @param permission — ex: 'chantiers:create', 'facturation:read'
   */
  can(permission: string): boolean {
    const user = this._currentUser();
    if (!user) return false;
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user.role);
  }

  /**
   * Vérifie si l'utilisateur a l'un des rôles donnés
   */
  hasRole(...roles: Role[]): boolean {
    const user = this._currentUser();
    return roles.includes(user.role);
  }

  /**
   * Simule un changement de rôle (pour tests en dev)
   * En prod : remplacé par la lecture du JWT
   */
  setRole(role: Role): void {
    this._currentUser.update(u => ({ ...u, role }));
  }

  /**
   * Simule la connexion d'un utilisateur (sera remplacé par JWT)
   */
  login(user: CurrentUser): void {
    this._currentUser.set(user);
  }

  logout(): void {
    this._currentUser.set(null as any);
  }

  get role(): Role {
    return this._currentUser().role;
  }

  get isAdmin(): boolean { return this.role === 'admin'; }
  get isConducteur(): boolean { return this.role === 'conducteur'; }
  get isChef(): boolean { return this.role === 'chef_chantier'; }
  get isComptable(): boolean { return this.role === 'comptable'; }
}