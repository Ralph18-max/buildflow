import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Chantier, CorpsEtat, Intervenant, Planning, Budget, Jalon } from '../models';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ChantierService {

  constructor(private http: HttpClient) {}

  // ─── Chantiers ────────────────────────────────────────────

  getAll(): Observable<Chantier[]> {
    return this.http.get<any[]>(`${API_URL}/chantiers`).pipe(
      map(chantiers => chantiers.map(c => ({
        ...c,
        nom_client:     c.contrat?.client?.raison_sociale ||
                        [c.contrat?.client?.prenom, c.contrat?.client?.nom].filter(Boolean).join(' '),
        montant_marche: c.contrat?.montant_marche,
        numero_marche:  c.contrat?.numero_marche,
      })))
    );
  }

  getById(id: number): Observable<Chantier | undefined> {
    return this.http.get<Chantier>(`${API_URL}/chantiers/${id}`);
  }

  getEnCours(): Observable<Chantier[]> {
    return this.http.get<Chantier[]>(`${API_URL}/chantiers/en-cours`);
  }

  getOptions(): Observable<{ id: number; nom: string }[]> {
    return this.http.get<Chantier[]>(`${API_URL}/chantiers`).pipe(
      map(chantiers => chantiers.map(c => ({ id: c.id, nom: c.nom_chantier })))
    );
  }

  getStats(): Observable<{ total: number; en_cours: number; termines: number; suspendus: number }> {
    return this.http.get<Chantier[]>(`${API_URL}/chantiers`).pipe(
      map(chantiers => ({
        total:     chantiers.length,
        en_cours:  chantiers.filter(c => c.statut === 'en_cours').length,
        termines:  chantiers.filter(c => c.statut === 'termine').length,
        suspendus: chantiers.filter(c => c.statut === 'suspendu').length,
      }))
    );
  }

  ajouter(data: Partial<Chantier>): Observable<Chantier> {
    return this.http.post<Chantier>(`${API_URL}/chantiers`, {
      id_contrat:            data.id_contrat,
      nom_chantier:          data.nom_chantier,
      localisation:          data.localisation,
      description:           data.description,
      date_livraison_prevue: data.date_livraison_prevue,
      date_demarrage_reelle: data.date_demarrage_reelle || null,
      chef_chantier:         data.chef_chantier,
    });
  }

  modifier(id: number, data: { nom_chantier?: string; localisation?: string; description?: string; chef_chantier?: string }): Observable<unknown> {
    return this.http.patch(`${API_URL}/chantiers/${id}`, data);
  }

  updateStatut(id: number, statut: string): Observable<unknown> {
    return this.http.patch(`${API_URL}/chantiers/${id}/statut`, { statut });
  }

  // ─── Corps d'état ─────────────────────────────────────────

  getCorpsEtat(idChantier: number): Observable<CorpsEtat[]> {
    return this.http.get<CorpsEtat[]>(`${API_URL}/chantiers/${idChantier}/corps-etat`);
  }

  ajouterCorpsEtat(idChantier: number, data: {
    nom: string; part_chantier: number;
    date_debut_prevue?: string; date_fin_prevue?: string; budget_alloue?: number;
  }): Observable<CorpsEtat> {
    return this.http.post<CorpsEtat>(`${API_URL}/chantiers/${idChantier}/corps-etat`, data);
  }

  patchAvancement(idChantier: number, idCorpsEtat: number, avancement: number, cout_reel?: number): Observable<CorpsEtat> {
    return this.http.patch<CorpsEtat>(
      `${API_URL}/chantiers/${idChantier}/corps-etat/${idCorpsEtat}/avancement`,
      { avancement, ...(cout_reel !== undefined && { cout_reel }) }
    );
  }

  // Kept for backwards-compat — not wired to a component yet
  updateAvancement(_idCorpsEtat: number, _avancement: number): Observable<boolean> {
    console.warn('updateAvancement: pass idChantier; use patchAvancement() instead');
    return new Observable(obs => { obs.next(false); obs.complete(); });
  }

  // ─── Intervenants ──────────────────────────────────────────

  getIntervenants(idChantier: number): Observable<Intervenant[]> {
    return this.http.get<Intervenant[]>(`${API_URL}/chantiers/${idChantier}/intervenants`);
  }

  ajouterIntervenant(idChantier: number, data: {
    id_corps_etat: number; type_intervenant: string;
    nom?: string; raison_sociale?: string; telephone: string;
    email?: string; montant_contrat?: number; assurance?: boolean;
  }): Observable<Intervenant> {
    return this.http.post<Intervenant>(`${API_URL}/chantiers/${idChantier}/intervenants`, data);
  }

  supprimerCorpsEtat(idChantier: number, idCorpsEtat: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/chantiers/${idChantier}/corps-etat/${idCorpsEtat}`);
  }

  supprimerIntervenant(idChantier: number, idIntervenant: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/chantiers/${idChantier}/intervenants/${idIntervenant}`);
  }

  // ─── Planning ─────────────────────────────────────────────

  getPlanning(idChantier: number): Observable<Planning | undefined> {
    return this.http.get<Planning>(`${API_URL}/chantiers/${idChantier}/planning`);
  }

  ajouterJalon(idChantier: number, data: { nom_jalon: string; date_prevue: string }): Observable<Jalon> {
    return this.http.post<Jalon>(`${API_URL}/chantiers/${idChantier}/jalons`, data);
  }

  majJalon(idChantier: number, idJalon: number, statut: string, date_reelle?: string): Observable<Jalon> {
    return this.http.patch<Jalon>(`${API_URL}/chantiers/${idChantier}/jalons/${idJalon}`, { statut, date_reelle });
  }

  // ─── Budget ───────────────────────────────────────────────

  getBudget(idChantier: number): Observable<Budget | undefined> {
    return this.http.get<Chantier>(`${API_URL}/chantiers/${idChantier}`).pipe(
      map(c => c.budget)
    );
  }
}
