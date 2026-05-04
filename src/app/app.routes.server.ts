import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'forgot-password', renderMode: RenderMode.Prerender },
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'users', renderMode: RenderMode.Client },
  { path: 'clients', renderMode: RenderMode.Client },
  { path: 'chantiers', renderMode: RenderMode.Client },
  { path: 'chantiers/:id', renderMode: RenderMode.Client },
  { path: 'contrats', renderMode: RenderMode.Client },
  { path: 'contrats/:id', renderMode: RenderMode.Client },
  { path: 'facturation', renderMode: RenderMode.Client },
  { path: 'facturation/:id', renderMode: RenderMode.Client },
  { path: 'documents', renderMode: RenderMode.Client },
  { path: 'terrain', renderMode: RenderMode.Client },
  { path: 'terrain/pointage', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];