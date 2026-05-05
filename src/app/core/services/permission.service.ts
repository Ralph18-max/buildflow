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

const PERMISSIONS: Record<string, Role[]> = {
  'clients:create':           ['admin'],
  'clients:edit':             ['admin'],
  'clients:delete':           ['admin'],
  'clients:read':             ['admin', 'conducteur', 'comptable'],

  'contrats:create':          ['admin'],
  'contrats:edit':            ['admin'],
  'contrats:read':            ['admin', 'conducteur', 'comptable'],
  'contrats:avenants:create': ['admin'],

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
  // ← conducteur ajouté : il met aussi à jour l'avancement depuis le terrain
  'corps_etat:avancement':    ['admin', 'conducteur', 'chef_chantier'],

  // ← conducteur ajouté : il peut aussi créer des rapports depuis le terrain
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

  // ── Utilisateur courant ─────────────────────────────────────────────────
  // Signal réactif — en prod : chargé depuis le JWT décodé au login
  //
  // ⚠️  POUR TESTER EN DEV : changer le role ici ou appeler setRole()
  //     depuis n'importe quel composant :
  //       this.perms.setRole('chef_chantier')
  //       this.perms.login({ id: 3, nom: 'Touré', prenom: 'Awa', role: 'chef_chantier', ... })
  //
 private _currentUser = signal<CurrentUser>({
  id: 1, nom: 'Yves', prenom: 'Konan',
  email: 'konan.yves@buildflow.ci',
  role: 'admin',
  tenant_id: 'tenant-abc-123',
  avatar: 'KY'
});

  readonly currentUser = this._currentUser.asReadonly();

  // ── API publique ────────────────────────────────────────────────────────

  /**
   * Vérifie si l'utilisateur courant possède une permission.
   * Usage : this.perms.can('terrain:rapport:create')
   */
  can(permission: string): boolean {
    const user = this._currentUser();
    if (!user) return false;
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user.role);
  }

  /**
   * Vérifie si l'utilisateur a l'un des rôles passés.
   * Usage : this.perms.hasRole('admin', 'conducteur')
   */
  hasRole(...roles: Role[]): boolean {
    return roles.includes(this._currentUser().role);
  }

  /**
   * Change le rôle simulé en dev.
   * En prod : supprimé — le rôle vient uniquement du JWT.
   */
  setRole(role: Role): void {
    this._currentUser.update(u => ({ ...u, role }));
  }

  /**
   * Connexion complète (sera remplacé par décodage JWT en Sprint 10).
   */
  login(user: CurrentUser): void {
    this._currentUser.set(user);
  }

  logout(): void {
    this._currentUser.set(null as any);
  }

  // ── Raccourcis booléens ─────────────────────────────────────────────────
  get role(): Role          { return this._currentUser().role; }
  get isAdmin(): boolean    { return this.role === 'admin'; }
  get isConducteur(): boolean { return this.role === 'conducteur'; }
  get isChef(): boolean     { return this.role === 'chef_chantier'; }
  get isComptable(): boolean { return this.role === 'comptable'; }
}