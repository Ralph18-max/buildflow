import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Utilisateur, Role } from '../models';
import { PermissionService } from './permission.service';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class UtilisateurService {

  constructor(private http: HttpClient, private perms: PermissionService) {}

  getAll(): Observable<Utilisateur[]> {
    return this.http.get<any[]>(`${API_URL}/utilisateurs`).pipe(
      map(users => users.map(u => this._map(u)))
    );
  }

  getById(id: number): Observable<Utilisateur | undefined> {
    return this.getAll().pipe(
      map(users => users.find(u => u.id === id))
    );
  }

  getMoiConnecte(): Utilisateur {
    const permsUser = this.perms.currentUser();
    return {
      id:               permsUser?.id || 0,
      tenant_id:        permsUser?.tenant_id || '',
      nom:              permsUser?.nom || '',
      prenom:           permsUser?.prenom || '',
      email:            permsUser?.email || '',
      role:             (permsUser?.role || 'admin') as Role,
      actif:            true,
      date_creation:    '',
      avatar_initiales: permsUser?.avatar || '',
    };
  }

  hasRole(role: Role): boolean { return this.getMoiConnecte().role === role; }
  isAdmin(): boolean           { return this.hasRole('admin'); }
  isConducteur(): boolean      { return this.hasRole('conducteur'); }
  isChefChantier(): boolean    { return this.hasRole('chef_chantier'); }
  isComptable(): boolean       { return this.hasRole('comptable'); }
  peutVoirFinances(): boolean  { return ['admin', 'comptable', 'conducteur'].includes(this.getMoiConnecte().role); }
  peutModifierAvancement(): boolean { return ['admin', 'conducteur'].includes(this.getMoiConnecte().role); }
  peutCreerComptes(): boolean  { return this.isAdmin(); }

  ajouter(utilisateur: Omit<Utilisateur, 'id' | 'date_creation' | 'avatar_initiales' | 'tenant_id'>): Observable<Utilisateur> {
    return this.http.post<any>(`${API_URL}/utilisateurs`, utilisateur).pipe(
      map(u => this._map(u))
    );
  }

  modifier(id: number, data: { nom: string; prenom: string; email: string; role: string }): Observable<Utilisateur> {
    return this.http.put<any>(`${API_URL}/utilisateurs/${id}`, data).pipe(
      map(u => this._map(u))
    );
  }

  toggleActif(id: number): Observable<boolean> {
    return this.http.patch<{ id: number; actif: boolean }>(`${API_URL}/utilisateurs/${id}/toggle`, {}).pipe(
      map(res => res.actif)
    );
  }

  getStats(): Observable<{ total: number; actifs: number; par_role: Record<Role, number> }> {
    return this.getAll().pipe(
      map(users => {
        const par_role = { admin: 0, conducteur: 0, chef_chantier: 0, comptable: 0 } as Record<Role, number>;
        users.forEach(u => par_role[u.role]++);
        return { total: users.length, actifs: users.filter(u => u.actif).length, par_role };
      })
    );
  }

  private _map(u: any): Utilisateur {
    return {
      id:               u.id,
      tenant_id:        u.tenant_id || '',
      nom:              u.nom,
      prenom:           u.prenom,
      email:            u.email,
      role:             u.role as Role,
      actif:            u.actif,
      date_creation:    u.date_creation?.split('T')[0] || '',
      avatar_initiales: `${(u.prenom || '')[0] || ''}${(u.nom || '')[0] || ''}`.toUpperCase(),
    };
  }
}
