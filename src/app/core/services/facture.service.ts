import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Facture } from '../models';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class FactureService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<Facture[]> {
    return this.http.get<any[]>(`${API_URL}/facturation/situations`).pipe(
      map(situations => situations.map(s => this._map(s)))
    );
  }

  getById(id: number): Observable<Facture | undefined> {
    return this.http.get<any>(`${API_URL}/facturation/situations/${id}`).pipe(
      map(s => this._map(s))
    );
  }

  getByChantier(idChantier: number): Observable<Facture[]> {
    return this.http.get<any[]>(`${API_URL}/facturation/situations?chantier=${idChantier}`).pipe(
      map(situations => situations.map(s => this._map(s)))
    );
  }

  creerSituation(data: { id_chantier: number; montant_ht: number; taux_tva: number; avancement_facture: number }): Observable<Facture> {
    return this.http.post<any>(`${API_URL}/facturation/situations`, data).pipe(
      map(s => this._map(s))
    );
  }

  getStats(): Observable<{ total_encaisse: number; en_attente: number; emises: number; en_retard: number }> {
    return this.http.get<{ total_encaisse: number; en_retard: number }>(`${API_URL}/facturation/stats`).pipe(
      map(s => ({
        total_encaisse: s.total_encaisse,
        en_attente:     0,
        emises:         0,
        en_retard:      s.en_retard,
      }))
    );
  }

  private _map(s: any): Facture {
    const client  = s.chantier?.contrat?.client;
    const nomClient = client?.raison_sociale
      || `${client?.prenom || ''} ${client?.nom || ''}`.trim()
      || '';

    const dateEmission = s.date_emission ? new Date(s.date_emission) : new Date();
    const dateEcheance = new Date(dateEmission.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      id:               s.id,
      numero:           `SIT-${s.id_chantier}-${String(s.numero_situation).padStart(3, '0')}`,
      id_chantier:      s.id_chantier,
      id_contrat:       s.chantier?.contrat?.id || 0,
      nom_chantier:     s.chantier?.nom_chantier || `Chantier #${s.id_chantier} (supprimé)`,
      nom_client:       nomClient,
      date_emission:    dateEmission.toISOString().split('T')[0],
      date_echeance:    dateEcheance.toISOString().split('T')[0],
      montant_ht:       s.montant_ht,
      tva:              s.taux_tva,
      montant_ttc:      s.montant_ttc,
      montant_encaisse: s.montant_encaisse,
      reste_a_payer:    s.reste_a_facturer,
      statut:           s.statut,
      situations_liees: [s.id],
      historique_paiements: (s.paiements || []).map((p: any) => ({
        date:      p.date_paiement ? new Date(p.date_paiement).toISOString().split('T')[0] : '',
        montant:   p.montant,
        mode:      p.mode_paiement || 'Virement',
        reference: p.reference || '',
      })),
    };
  }
}
