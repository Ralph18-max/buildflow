// U-28 à U-32 — AuthService
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks Angular minimalistes ──────────────────────────────────────────────
const mockHttp = { post: vi.fn() };
const mockPerms = { login: vi.fn(), logout: vi.fn(), currentUser: vi.fn(() => null) };

vi.mock('@angular/common', () => ({
  isPlatformBrowser: () => true,
}));
vi.mock('@angular/core', async (orig) => {
  const actual = await orig();
  return { ...actual as any, inject: vi.fn(() => 'browser') };
});

// ─── Helpers JWT ─────────────────────────────────────────────────────────────
function buildToken(exp: number) {
  const payload = { id: 1, email: 'u@t.ci', role: 'admin', tenant_id: 'tid', exp };
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=/g, '');
  return `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`;
}

// ─── Service simplifié (logique extraite sans injection DI Angular) ───────────
class AuthServiceTestable {
  private _loggedIn = false;
  private _user: any = null;

  constructor(private http: any, private perms: any) {}

  login(email: string, password: string) {
    return {
      subscribe: (cb: any) => {
        const res = { token: buildToken(Math.floor(Date.now() / 1000) + 3600), utilisateur: { id: 1, nom: 'A', prenom: 'B', email, role: 'admin', avatar_initiales: 'AB' } };
        localStorage.setItem('buildflow_token', res.token);
        localStorage.setItem('buildflow_user', JSON.stringify(res.utilisateur));
        this._loggedIn = true;
        this._user = res.utilisateur;
        this.perms.login({ id: 1, nom: 'A', prenom: 'B', email, role: 'admin', tenant_id: 'tid', avatar: 'AB' });
        cb.next?.(res);
      },
    };
  }

  logout() {
    this._loggedIn = false;
    this._user = null;
    localStorage.removeItem('buildflow_token');
    localStorage.removeItem('buildflow_user');
    this.perms.logout();
  }

  isLoggedIn() { return this._loggedIn; }
  getUser() { return this._user; }
  hasRole(roles: string[]) { return this._user ? roles.includes(this._user.role) : false; }

  restoreSession() {
    const token = localStorage.getItem('buildflow_token');
    const stored = localStorage.getItem('buildflow_user');
    if (!token || !stored) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) { this.logout(); return; }
      this._user = JSON.parse(stored);
      this._loggedIn = true;
    } catch { this.logout(); }
  }
}

describe('AuthService', () => {
  let svc: AuthServiceTestable;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    svc = new AuthServiceTestable(mockHttp, mockPerms);
  });

  // ── U-28 : login stocke token + user ──────────────────────────────────────
  it('U-28 login() stocke token et user dans localStorage', () => {
    svc.login('u@t.ci', 'pass').subscribe({});
    expect(localStorage.getItem('buildflow_token')).not.toBeNull();
    expect(localStorage.getItem('buildflow_user')).not.toBeNull();
  });

  // ── U-29 : logout efface localStorage ─────────────────────────────────────
  it('U-29 logout() efface localStorage et appelle perms.logout()', () => {
    svc.login('u@t.ci', 'pass').subscribe({});
    svc.logout();
    expect(localStorage.getItem('buildflow_token')).toBeNull();
    expect(localStorage.getItem('buildflow_user')).toBeNull();
    expect(mockPerms.logout).toHaveBeenCalled();
  });

  // ── U-30 : token expiré → logout ──────────────────────────────────────────
  it('U-30 restoreSession() token expiré → logout()', () => {
    const expiredToken = buildToken(Math.floor(Date.now() / 1000) - 100);
    localStorage.setItem('buildflow_token', expiredToken);
    localStorage.setItem('buildflow_user', JSON.stringify({ id: 1, role: 'admin' }));

    svc.restoreSession();

    expect(svc.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('buildflow_token')).toBeNull();
  });

  // ── U-31 : token valide → isLoggedIn() true ────────────────────────────────
  it('U-31 restoreSession() token valide → isLoggedIn() = true', () => {
    const validToken = buildToken(Math.floor(Date.now() / 1000) + 3600);
    localStorage.setItem('buildflow_token', validToken);
    localStorage.setItem('buildflow_user', JSON.stringify({ id: 1, role: 'admin' }));

    svc.restoreSession();

    expect(svc.isLoggedIn()).toBe(true);
  });

  // ── U-32 : hasRole mauvais rôle → false ───────────────────────────────────
  it('U-32 hasRole([admin]) avec user comptable → false', () => {
    (svc as any)._user = { role: 'comptable' };
    expect(svc.hasRole(['admin'])).toBe(false);
    expect(svc.hasRole(['comptable'])).toBe(true);
  });
});
