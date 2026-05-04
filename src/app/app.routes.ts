import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LandingComponent } from './features/auth/landing/landing';
import { LoginComponent } from './features/auth/login/login';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password';
import { LayoutComponent } from './shared/layout/layout';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard';
import { UsersComponent } from './features/dashboard/users/users';
import { ClientsList } from './features/clients/clients-list';
import { ChantiersList } from './features/chantiers/chantiers-list';
import { ChantierDetail } from './features/chantiers/chantier-detail/chantier-detail';
import { ContratsList } from './features/contrats/contrats-list';
import { ContratDetail } from './features/contrats/contrat-detail/contrat-detail';
import { FacturationList } from './features/facturation/facturation-list';
import { FactureDetail } from './features/facturation/facture-detail/facture-detail';
import { DocumentsList } from './features/documents/documents-list';
import { TerrainRapport } from './features/terrain/terrain-rapport/terrain-rapport';
import { TerrainPointage } from './features/terrain/terrain-pointage/terrain-pointage';
import { ComptabiliteComponent } from './features/comptabilite/comptabilite/comptabilite';  // ← AJOUT


  
export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'users',
        component: UsersComponent,
        canActivate: [roleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'clients',
        component: ClientsList,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'conducteur'] }
      },
      {
        path: 'chantiers',
        component: ChantiersList,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'conducteur', 'chef_chantier'] }
      },
      {
        path: 'chantiers/:id',
        component: ChantierDetail,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'conducteur', 'chef_chantier', 'comptable'] }
      },
      {
        path: 'contrats',
        component: ContratsList,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'conducteur'] }
      },
      {
        path: 'contrats/:id',
        component: ContratDetail,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'conducteur', 'comptable'] }
      },
      {
        path: 'facturation',
        component: FacturationList,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'comptable', 'conducteur'] }
      },
      {
        path: 'facturation/:id',
        component: FactureDetail,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'comptable', 'conducteur'] }
      },
      {
        path: 'comptabilite',                               // ← AJOUT
        component: ComptabiliteComponent,
        canActivate: [roleGuard],
        data: { roles: ['comptable', 'admin'] }
      },
      {
        path: 'documents',
        component: DocumentsList
        // Accessible à tous
      },
      {
        path: 'terrain',
        component: TerrainRapport,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'conducteur', 'chef_chantier'] }
      },
      {
        path: 'terrain/pointage',
        component: TerrainPointage,
        canActivate: [roleGuard],
        data: { roles: ['admin', 'conducteur', 'chef_chantier'] }
      },
    ]
  },
  { path: '**', redirectTo: '' },
];
