import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private injector: Injector) {}

  handleError(error: unknown): void {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('ExpressionChangedAfterItHasBeenCheckedError')) return;
    if (msg.includes('Http failure')) return; // géré par errorInterceptor
    console.error('[BuildFlow] Erreur non capturée :', error);
    try {
      this.injector.get(ToastService).error('Une erreur inattendue est survenue.');
    } catch {
      // toast pas encore disponible au démarrage
    }
  }
}
