import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { Role } from '../models';

const FALLBACK_ROUTES: Record<string, string> = {
  admin:         '/dashboard',
  comptable:     '/comptabilite',
  conducteur:    '/chantiers',
  chef_chantier: '/terrain',
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissions = inject(PermissionService);
  const router = inject(Router);

  const allowedRoles: Role[] = route.data?.['roles'] ?? [];

  // Pas de rôles définis = accessible à tous les connectés
  if (allowedRoles.length === 0) return true;

  if (permissions.hasRole(...allowedRoles)) return true;

  // Rôle insuffisant → redirection vers la page d'accueil du rôle courant
  const fallback = FALLBACK_ROUTES[permissions.role ?? ''] ?? '/documents';
  router.navigate([fallback]);
  return false;
};