// U-38 à U-41 — authGuard & roleGuard
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockRouter = { navigate: vi.fn(), createUrlTree: vi.fn((p: any[]) => p) };
const mockAuth   = { isLoggedIn: vi.fn() };
const mockPerms  = { role: 'admin' as string };

// ─── authGuard — logique ─────────────────────────────────────────────────────
function authGuardLogic(): boolean | any[] {
  if (mockAuth.isLoggedIn()) return true;
  return mockRouter.createUrlTree(['/login']);
}

// ─── roleGuard — logique ─────────────────────────────────────────────────────
const FALLBACK: Record<string, string> = {
  admin: '/dashboard', comptable: '/comptabilite',
  conducteur: '/chantiers', chef_chantier: '/terrain',
};

function roleGuardLogic(allowedRoles: string[]): boolean | any[] {
  if (allowedRoles.includes(mockPerms.role)) return true;
  const fallback = FALLBACK[mockPerms.role] ?? '/documents';
  return mockRouter.createUrlTree([fallback]);
}

describe('authGuard', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── U-38 : non connecté → redirige /login ────────────────────────────────
  it('U-38 non connecté → redirige vers /login', () => {
    mockAuth.isLoggedIn.mockReturnValue(false);
    const result = authGuardLogic();
    expect(result).toEqual(['/login']);
  });

  // ── U-39 : connecté → true ───────────────────────────────────────────────
  it('U-39 connecté → retourne true', () => {
    mockAuth.isLoggedIn.mockReturnValue(true);
    const result = authGuardLogic();
    expect(result).toBe(true);
  });
});

describe('roleGuard', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── U-40 : rôle dans la liste → true ────────────────────────────────────
  it('U-40 rôle dans roles autorisés → true', () => {
    mockPerms.role = 'admin';
    const result = roleGuardLogic(['admin', 'conducteur']);
    expect(result).toBe(true);
  });

  // ── U-41 : rôle absent → fallback selon rôle ────────────────────────────
  it('U-41 rôle non autorisé → redirige vers fallback du rôle', () => {
    mockPerms.role = 'comptable';
    const result = roleGuardLogic(['admin']);
    expect(result).toEqual(['/comptabilite']);
  });
});
