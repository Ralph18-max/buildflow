import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map, of } from 'rxjs';
import { Contrat, Avenant, SituationTravaux } from '../models';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ContratService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<Contrat[]> {
    return this.http.get<any[]>(`${API_URL}/contrats`).pipe(
      map(list => list.map(c => this._mapContrat(c)))
    );
  }

  getById(id: number): Observable<Contrat | undefined> {
    return this.http.get<any>(`${API_URL}/contrats/${id}`).pipe(
      map(c => this._mapContrat(c))
    );
  }

  creer(data: {
    id_client: number;
    type_construction: string;
    montant_marche: number;
    date_signature: string;
    date_demarrage_prevue: string;
    date_livraison_prevue: string;
    penalites_retard: number;
  }): Observable<Contrat> {
    return this.http.post<any>(`${API_URL}/contrats`, data).pipe(
      map(c => this._mapContrat(c))
    );
  }

  getByChantier(idChantier: number): Observable<Contrat | undefined> {
    return this.http.get<Contrat[]>(`${API_URL}/contrats`).pipe(
      map(contrats => contrats.find(c => c.id_chantier === idChantier))
    );
  }

  getAvenants(idContrat: number): Observable<Avenant[]> {
    return this.http.get<Contrat>(`${API_URL}/contrats/${idContrat}`).pipe(
      map(c => (c as any).modifications || []),
      map(mods => mods.map((m: any) => ({
        id:          m.id,
        numero:      `AVN-${String(m.numero_modification).padStart(3, '0')}`,
        objet:       m.motif,
        date:        m.date_modification?.split('T')[0] || '',
        montant:     m.montant_supplementaire,
        delai_jours: m.delai_supplementaire,
        statut:      m.statut || 'signe',
      } as Avenant)))
    );
  }

  getSituations(idContrat: number): Observable<SituationTravaux[]> {
    return this.http.get<any>(`${API_URL}/contrats/${idContrat}`).pipe(
      switchMap(contrat => {
        const chantierId = contrat.chantier?.id;
        if (!chantierId) return of([]);
        return this.http.get<any[]>(`${API_URL}/facturation/situations?chantier=${chantierId}`);
      }),
      map(situations => situations.map(s => this._mapSituation(s)))
    );
  }

  getStats(): Observable<{ total_encaisse: number; total_raf: number }> {
    return this.http.get<{ total_raf: number }>(`${API_URL}/contrats/stats`).pipe(
      switchMap(({ total_raf }) =>
        this.http.get<{ total_encaisse: number; en_retard: number }>(`${API_URL}/facturation/stats`).pipe(
          map(fs => ({ total_encaisse: fs.total_encaisse, total_raf }))
        )
      )
    );
  }

  getOptions(): Observable<{ id: number; label: string; nom_client: string }[]> {
    return this.http.get<Contrat[]>(`${API_URL}/contrats`).pipe(
      map(contrats => contrats.map(c => ({
        id:        c.id,
        label:     `${c.numero_marche} — ${c.nom_client || ''}`,
        nom_client: c.nom_client || '',
      })))
    );
  }

  modifier(id: number, data: {
    type_construction?: string;
    date_signature?: string;
    date_demarrage_prevue?: string;
    date_livraison_prevue?: string;
    penalites_retard?: number;
    statut?: string;
  }): Observable<Contrat> {
    return this.http.patch<any>(`${API_URL}/contrats/${id}`, data).pipe(
      map(c => this._mapContrat(c))
    );
  }

  ajouterAvenant(idContrat: number, data: {
    motif: string;
    montant_supplementaire: number;
    delai_supplementaire: number;
  }): Observable<Avenant> {
    return this.http.post<any>(`${API_URL}/contrats/${idContrat}/avenants`, data).pipe(
      map((m: any) => ({
        id:          m.id,
        numero:      `AVN-${String(m.numero_modification).padStart(3, '0')}`,
        objet:       m.motif,
        date:        m.date_modification?.split('T')[0] || new Date().toISOString().split('T')[0],
        montant:     m.montant_supplementaire,
        delai_jours: m.delai_supplementaire,
        statut:      m.statut || 'en_attente',
      } as Avenant))
    );
  }

  signerAvenant(idContrat: number, idAvenant: number): Observable<{ avenant: Avenant; montant_marche_revise: number }> {
    return this.http.patch<any>(`${API_URL}/contrats/${idContrat}/avenants/${idAvenant}/signer`, {});
  }

  refuserAvenant(idContrat: number, idAvenant: number): Observable<Avenant> {
    return this.http.patch<any>(`${API_URL}/contrats/${idContrat}/avenants/${idAvenant}/refuser`, {});
  }

  private _mapContrat(c: any): Contrat {
    const client = c.client;
    const nom_client = client
      ? (client.type_client === 'societe'
          ? (client.raison_sociale || '')
          : `${client.nom || ''} ${client.prenom || ''}`.trim())
      : '';
    const mods: any[] = c.modifications || [];
    return {
      id:                    c.id,
      numero_marche:         c.numero_marche,
      id_client:             c.id_client,
      nom_client,
      type_construction:     c.type_construction,
      montant_marche:        c.montant_marche,
      montant_marche_revise: c.montant_marche_revise ?? c.montant_marche,
      date_signature:        c.date_signature?.split('T')[0] || '',
      date_demarrage_prevue: c.date_demarrage_prevue?.split('T')[0] || '',
      date_livraison_prevue: c.date_livraison_prevue?.split('T')[0] || '',
      penalites_retard:      c.penalites_retard,
      statut:                c.statut || 'en_cours',
      id_chantier:           c.chantier?.id,
      avenants:              mods.map((m: any) => ({
        id:          m.id,
        numero:      `AVN-${String(m.numero_modification).padStart(3, '0')}`,
        objet:       m.motif,
        date:        m.date_modification?.split('T')[0] || '',
        montant:     m.montant_supplementaire,
        delai_jours: m.delai_supplementaire,
        statut:      m.statut || 'signe',
      })),
      situations: [],
    };
  }

  private _mapSituation(s: any): SituationTravaux {
    return {
      id:                 s.id,
      numero:             `SIT-${String(s.numero_situation).padStart(3, '0')}`,
      periode:            s.date_emission ? new Date(s.date_emission).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '',
      date_emission:      s.date_emission?.split('T')[0] || '',
      date_echeance:      s.date_echeance?.split('T')[0],
      avancement_pct:     s.avancement_facture || 0,
      avancement_facture: s.avancement_facture || 0,
      montant_ht:         s.montant_ht || 0,
      montant_ttc:        s.montant_ttc || 0,
      montant_periode:    s.montant_ht || 0,
      montant_cumule:     s.montant_ttc || 0,
      retenue_garantie:   s.retenue_garantie || 0,
      montant_net:        s.montant_net || 0,
      montant_encaisse:   s.montant_encaisse || 0,
      reste_a_facturer:   s.reste_a_facturer || 0,
      statut:             s.statut || 'en_attente',
    };
  }
}
