import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService, Role } from '../services/permission.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissions = inject(PermissionService);
  const router = inject(Router);

  const allowedRoles: Role[] = route.data?.['roles'] ?? [];

  // Pas de rôles définis = accessible à tous les connectés
  if (allowedRoles.length === 0) return true;

  if (permissions.hasRole(...allowedRoles)) return true;

  // Rôle insuffisant → retour dashboard
  router.navigate(['/dashboard']);
  return false;
};