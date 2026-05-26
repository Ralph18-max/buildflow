// U-33 à U-37 — PermissionService
import { describe, it, expect, beforeEach } from 'vitest';

// ─── Permissions map (copiée de permission.service.ts) ───────────────────────
const PERMISSIONS: Record<string, string[]> = {
  admin:         ['budget:create', 'budget:read', 'chantiers:create', 'chantiers:update', 'chantiers:statut', 'cloture:admin', 'users:manage', 'terrain:rapport', 'facturation:read', 'contrats:avenant:signer'],
  conducteur:    ['budget:read', 'chantiers:create', 'chantiers:update', 'terrain:rapport', 'facturation:read'],
  chef_chantier: ['terrain:rapport', 'chantiers:read'],
  comptable:     ['facturation:read', 'facturation:factureST', 'cloture:valider'],
};

// ─── PermissionService minimal testable ───────────────────────────────────────
class PermissionServiceTestable {
  private _user: { role: string } | null = null;

  login(user: { role: string }) { this._user = user; }
  logout() { this._user = null; }
  get role() { return this._user?.role ?? null; }
  get isAdmin()      { return this._user?.role === 'admin'; }
  get isComptable()  { return this._user?.role === 'comptable'; }
  get isChef()       { return this._user?.role === 'chef_chantier'; }
  get isConducteur() { return this._user?.role === 'conducteur'; }

  can(permission: string): boolean {
    if (!this._user) return false;
    return PERMISSIONS[this._user.role]?.includes(permission) ?? false;
  }
}

describe('PermissionService', () => {
  let svc: PermissionServiceTestable;

  beforeEach(() => { svc = new PermissionServiceTestable(); });

  // ── U-33 : admin peut créer budget ────────────────────────────────────────
  it('U-33 can(budget:create) pour admin → true', () => {
    svc.login({ role: 'admin' });
    expect(svc.can('budget:create')).toBe(true);
  });

  // ── U-34 : chef_chantier ne peut pas créer budget ─────────────────────────
  it('U-34 can(budget:create) pour chef_chantier → false', () => {
    svc.login({ role: 'chef_chantier' });
    expect(svc.can('budget:create')).toBe(false);
  });

  // ── U-35 : chef_chantier peut créer rapport terrain ───────────────────────
  it('U-35 can(terrain:rapport) pour chef_chantier → true', () => {
    svc.login({ role: 'chef_chantier' });
    expect(svc.can('terrain:rapport')).toBe(true);
  });

  // ── U-36 : isComptable reflète le rôle ────────────────────────────────────
  it('U-36 isComptable = true si rôle comptable', () => {
    svc.login({ role: 'comptable' });
    expect(svc.isComptable).toBe(true);
    expect(svc.isAdmin).toBe(false);
    expect(svc.isChef).toBe(false);
  });

  // ── U-37 : logout → currentUser null ──────────────────────────────────────
  it('U-37 logout() → can() retourne false', () => {
    svc.login({ role: 'admin' });
    expect(svc.can('budget:create')).toBe(true);
    svc.logout();
    expect(svc.can('budget:create')).toBe(false);
    expect(svc.role).toBeNull();
  });
});
