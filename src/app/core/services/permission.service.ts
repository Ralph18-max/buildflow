import { Injectable, signal } from '@angular/core';
import { Role } from '../models'; // ✅ FIX — importé depuis models, plus de doublon

export interface CurrentUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  tenant_id: string;
  avatar?: string;
}

const PERMISSIONS: Record<string, Role[]> = {
  'clients:create':           ['admin'],
  'clients:edit':             ['admin'],
  'clients:delete':           ['admin'],
  'clients:read':             ['admin', 'conducteur', 'comptable'],

  'contrats:create':          ['admin'],
  'contrats:edit':            ['admin'],
  'contrats:read':            ['admin', 'conducteur', 'comptable'],
  'contrats:avenants:create': ['admin'],
  'avenants:signer':          ['admin'],
  'avenants:refuser':         ['admin'],

  'chantiers:create':         ['admin', 'conducteur'],
  'chantiers:edit':           ['admin', 'conducteur'],
  'chantiers:read':           ['admin', 'conducteur', 'chef_chantier', 'comptable'],
  'chantiers:delete':         ['admin'],

  'budget:create':            ['admin'],
  'budget:edit':              ['admin'],
  'budget:read':              ['admin', 'conducteur', 'comptable'],

  'planning:create':          ['admin', 'conducteur'],
  'planning:edit':            ['admin', 'conducteur'],
  'planning:read':            ['admin', 'conducteur', 'chef_chantier', 'comptable'],

  'corps_etat:create':        ['admin', 'conducteur'],
  'corps_etat:edit':          ['admin', 'conducteur'],
  'corps_etat:delete':        ['admin', 'conducteur'],
  'corps_etat:avancement':    ['admin', 'conducteur', 'chef_chantier'],

  'intervenants:delete':      ['admin'],

  'terrain:rapport:create':   ['chef_chantier', 'conducteur'],
  'terrain:pointage:create':  ['chef_chantier', 'conducteur'],
  'terrain:read':             ['admin', 'conducteur', 'chef_chantier'],

  'facturation:create':       ['comptable'],
  'facturation:edit':         ['comptable'],
  'facturation:read':         ['admin', 'conducteur', 'comptable'],
  'facturation:encaissement': ['comptable'],

  'cloture:bilan_valider':    ['comptable'],
  'cloture:cloturer':         ['admin'],

  'documents:upload':         ['admin', 'conducteur', 'chef_chantier'],
  'documents:delete':         ['admin', 'conducteur'],
  'documents:read':           ['admin', 'conducteur', 'chef_chantier', 'comptable'],

  'users:create':             ['admin'],
  'users:edit':               ['admin'],
  'users:read':               ['admin'],
};

@Injectable({ providedIn: 'root' })
export class PermissionService {

  private _currentUser = signal<CurrentUser | null>(null);

  readonly currentUser = this._currentUser.asReadonly();

  // ── API publique ────────────────────────────────────────────────────────

  /**
   * Vérifie si l'utilisateur courant possède une permission.
   * Usage : this.perms.can('terrain:rapport:create')
   * Usage template : 'terrain:rapport:create' | can
   */
  can(permission: string): boolean {
    const user = this._currentUser();
    if (!user) return false; // ✅ null safe
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user.role);
  }

  /**
   * Vérifie si l'utilisateur a l'un des rôles passés.
   * Usage : this.perms.hasRole('admin', 'conducteur')
   */
  hasRole(...roles: Role[]): boolean {
    const user = this._currentUser();
    if (!user) return false; // ✅ null safe
    return roles.includes(user.role);
  }

  /**
   * Connexion — appelé par AuthService après login.
   * En Sprint 10 : remplacé par décodage JWT.
   */
  login(user: CurrentUser): void {
    this._currentUser.set(user);
  }

  // ✅ FIX — logout propre, plus de "null as any"
  logout(): void {
    this._currentUser.set(null);
  }

  /**
   * Change le rôle simulé en dev.
   * En prod : supprimé — le rôle vient uniquement du JWT.
   */
  setRole(role: Role): void {
    this._currentUser.update(u => u ? { ...u, role } : null);
  }

  // ── Raccourcis booléens ─────────────────────────────────────────────────

  // ✅ null safe sur tous les getters
  get role(): Role | null      { return this._currentUser()?.role ?? null; }
  get isAdmin(): boolean       { return this.role === 'admin'; }
  get isConducteur(): boolean  { return this.role === 'conducteur'; }
  get isChef(): boolean        { return this.role === 'chef_chantier'; }
  get isComptable(): boolean   { return this.role === 'comptable'; }
}