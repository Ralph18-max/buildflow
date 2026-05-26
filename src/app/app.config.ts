import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, LOCALE_ID, ErrorHandler } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withRouterConfig,
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
} from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { GlobalErrorHandler } from './core/handlers/global-error.handler';

registerLocaleData(localeFr);

// Never reuse feature page components — ensures ngOnInit fires on every navigation.
// The shell layout (path: '') is preserved so the sidebar/header don't flicker.
class AlwaysFreshStrategy implements RouteReuseStrategy {
  shouldDetach(_r: ActivatedRouteSnapshot): boolean { return false; }
  store(_r: ActivatedRouteSnapshot, _h: DetachedRouteHandle | null): void {}
  shouldAttach(_r: ActivatedRouteSnapshot): boolean { return false; }
  retrieve(_r: ActivatedRouteSnapshot): DetachedRouteHandle | null { return null; }
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig && future.routeConfig?.path === '';
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    { provide: LOCALE_ID,          useValue: 'fr' },
    { provide: ErrorHandler,       useClass: GlobalErrorHandler },
    { provide: RouteReuseStrategy, useClass: AlwaysFreshStrategy },
  ]
};