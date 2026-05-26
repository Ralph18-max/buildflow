import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast  = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(err => {
      if (err.status === 0) {
        toast.error('Serveur inaccessible — vérifiez que le backend est démarré (port 3000).');
      } else if (err.status === 401) {
        toast.warning('Session expirée — veuillez vous reconnecter.');
        router.navigate(['/login']);
      } else if (err.status === 403) {
        toast.warning('Accès refusé — vous n\'avez pas la permission d\'effectuer cette action.');
      } else if (err.status === 404) {
        // 404 silencieux — géré localement par chaque composant
      } else if (err.status === 409) {
        const msg = err.error?.message || 'Conflit : cette ressource existe déjà.';
        toast.warning(msg);
      } else if (err.status >= 500) {
        toast.error('Erreur serveur — réessayez dans quelques instants.');
      } else if (err.status >= 400) {
        const msg = err.error?.message || 'Une erreur est survenue.';
        toast.error(msg);
      }
      return throwError(() => err);
    })
  );
};
