import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Utilisateur, Role } from '../models';

@Injectable({ providedIn: 'root' })
export class UtilisateurService {

  private readonly UTILISATEURS: Utilisateur[] = [
    { id: 1, tenant_id: 'tenant-001', nom: 'Koné', prenom: 'Youssouf', email: 'admin@buildflow.ci', role: 'admin', actif: true, date_creation: '2024-01-01', avatar_initiales: 'YK' },
    { id: 2, tenant_id: 'tenant-001', nom: 'Bah', prenom: 'Mamadou', email: 'bah.mamadou@buildflow.ci', role: 'conducteur', actif: true, date_creation: '2024-01-05', avatar_initiales: 'MB' },
    { id: 3, tenant_id: 'tenant-001', nom: 'Koné', prenom: 'Drissa', email: 'kone.drissa@buildflow.ci', role: 'chef_chantier', actif: true, date_creation: '2024-01-05', avatar_initiales: 'DK' },
    { id: 4, tenant_id: 'tenant-001', nom: 'Diallo', prenom: 'Fatoumata', email: 'diallo.fatoumata@buildflow.ci', role: 'comptable', actif: true, date_creation: '2024-02-01', avatar_initiales: 'FD' },
    { id: 5, tenant_id: 'tenant-001', nom: 'Yapi', prenom: 'Serge', email: 'yapi.serge@buildflow.ci', role: 'chef_chantier', actif: true, date_creation: '2025-09-01', avatar_initiales: 'SY' },
    { id: 6, tenant_id: 'tenant-001', nom: 'Traoré', prenom: 'Aminata', email: 'traore.aminata@buildflow.ci', role: 'conducteur', actif: false, date_creation: '2024-03-15', avatar_initiales: 'AT' },
  ];

  private utilisateursSubject = new BehaviorSubject<Utilisateur[]>(this.UTILISATEURS);
  private utilisateurConnecte: Utilisateur = this.UTILISATEURS[0];

  getAll(): Observable<Utilisateur[]> { return this.utilisateursSubject.asObservable(); }
  getById(id: number): Observable<Utilisateur | undefined> { return of(this.UTILISATEURS.find(u => u.id === id)); }
  getMoiConnecte(): Utilisateur { return this.utilisateurConnecte; }

  hasRole(role: Role): boolean { return this.utilisateurConnecte.role === role; }
  isAdmin(): boolean { return this.hasRole('admin'); }
  isConducteur(): boolean { return this.hasRole('conducteur'); }
  isChefChantier(): boolean { return this.hasRole('chef_chantier'); }
  isComptable(): boolean { return this.hasRole('comptable'); }
  peutVoirFinances(): boolean { return ['admin', 'comptable', 'conducteur'].includes(this.utilisateurConnecte.role); }
  peutModifierAvancement(): boolean { return ['admin', 'conducteur'].includes(this.utilisateurConnecte.role); }
  peutCreerComptes(): boolean { return this.isAdmin(); }

  ajouter(utilisateur: Omit<Utilisateur, 'id' | 'date_creation' | 'avatar_initiales' | 'tenant_id'>): Observable<Utilisateur> {
    const nouveau: Utilisateur = { ...utilisateur, id: Math.max(...this.UTILISATEURS.map(u => u.id)) + 1, tenant_id: 'tenant-001', date_creation: new Date().toISOString().split('T')[0], avatar_initiales: `${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase() };
    this.UTILISATEURS.push(nouveau);
    this.utilisateursSubject.next([...this.UTILISATEURS]);
    return of(nouveau);
  }

  toggleActif(id: number): Observable<boolean> {
    const u = this.UTILISATEURS.find(u => u.id === id);
    if (!u) return of(false);
    u.actif = !u.actif;
    this.utilisateursSubject.next([...this.UTILISATEURS]);
    return of(true);
  }

  getStats(): Observable<{ total: number; actifs: number; par_role: Record<Role, number> }> {
    const par_role = { admin: 0, conducteur: 0, chef_chantier: 0, comptable: 0 } as Record<Role, number>;
    this.UTILISATEURS.forEach(u => par_role[u.role]++);
    return of({ total: this.UTILISATEURS.length, actifs: this.UTILISATEURS.filter(u => u.actif).length, par_role });
  }
}