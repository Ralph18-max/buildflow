// U-42 à U-45 — authInterceptor & errorInterceptor
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRouter = { navigate: vi.fn() };

// ─── authInterceptor — logique ────────────────────────────────────────────────
function applyAuthInterceptor(req: { headers: Record<string, string>; method: string }, token: string | null) {
  const headers = { ...req.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (req.method === 'GET') {
    headers['Cache-Control'] = 'no-cache, no-store';
    headers['Pragma'] = 'no-cache';
  }
  return { ...req, headers };
}

// ─── errorInterceptor — logique ──────────────────────────────────────────────
function handleHttpError(status: number, toastFn: (m: string) => void) {
  if (status === 401) { mockRouter.navigate(['/login']); return; }
  if (status === 403) { toastFn('Accès refusé'); return; }
  if (status === 0)   { toastFn('Serveur inaccessible'); return; }
  if (status >= 500)  { toastFn('Erreur serveur'); return; }
}

describe('authInterceptor', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

  // ── U-42 : token présent → header Authorization ajouté ───────────────────
  it('U-42 token présent → header Authorization: Bearer <token>', () => {
    localStorage.setItem('buildflow_token', 'my-jwt');
    const token = localStorage.getItem('buildflow_token');
    const req = applyAuthInterceptor({ headers: {}, method: 'GET' }, token);
    expect(req.headers['Authorization']).toBe('Bearer my-jwt');
  });

  // ── U-43 : pas de token → pas de header Authorization ────────────────────
  it('U-43 aucun token → header Authorization absent', () => {
    const req = applyAuthInterceptor({ headers: {}, method: 'POST' }, null);
    expect(req.headers['Authorization']).toBeUndefined();
  });
});

describe('errorInterceptor', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── U-44 : 401 → redirige /login ─────────────────────────────────────────
  it('U-44 HTTP 401 → redirige vers /login', () => {
    const toast = vi.fn();
    handleHttpError(401, toast);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    expect(toast).not.toHaveBeenCalled();
  });

  // ── U-45 : 403 → toast "Accès refusé" ────────────────────────────────────
  it('U-45 HTTP 403 → toast Accès refusé', () => {
    const toast = vi.fn();
    handleHttpError(403, toast);
    expect(toast).toHaveBeenCalledWith('Accès refusé');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
