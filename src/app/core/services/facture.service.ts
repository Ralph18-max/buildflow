import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Facture, StatutFacture } from '../models';

@Injectable({ providedIn: 'root' })
export class FactureService {

  private readonly FACTURES: Facture[] = [
    { id: 1, numero: 'FAC-2024-001', id_chantier: 1, id_contrat: 1, nom_chantier: 'Résidence Les Palmiers', nom_client: 'SCI Les Palmiers', date_emission: '2024-03-31', date_echeance: '2024-04-30', montant_ht: 120000000, tva: 18, montant_ttc: 141600000, montant_encaisse: 141600000, reste_a_payer: 0, statut: 'payee', situations_liees: [1], historique_paiements: [{ date: '2024-04-25', montant: 141600000, mode: 'Virement bancaire', reference: 'VIR-20240425-001' }] },
    { id: 2, numero: 'FAC-2024-002', id_chantier: 1, id_contrat: 1, nom_chantier: 'Résidence Les Palmiers', nom_client: 'SCI Les Palmiers', date_emission: '2024-06-30', date_echeance: '2024-07-30', montant_ht: 160000000, tva: 18, montant_ttc: 188800000, montant_encaisse: 188800000, reste_a_payer: 0, statut: 'payee', situations_liees: [2], historique_paiements: [{ date: '2024-07-28', montant: 188800000, mode: 'Virement bancaire', reference: 'VIR-20240728-001' }] },
    { id: 3, numero: 'FAC-2025-001', id_chantier: 1, id_contrat: 1, nom_chantier: 'Résidence Les Palmiers', nom_client: 'SCI Les Palmiers', date_emission: '2024-12-31', date_echeance: '2025-01-31', montant_ht: 220000000, tva: 18, montant_ttc: 259600000, montant_encaisse: 0, reste_a_payer: 259600000, statut: 'en_retard', situations_liees: [3, 4], historique_paiements: [] },
    { id: 4, numero: 'FAC-2024-003', id_chantier: 2, id_contrat: 2, nom_chantier: 'Villa Duplex Riviera', nom_client: 'Konan Yves', date_emission: '2024-03-10', date_echeance: '2024-04-10', montant_ht: 180000000, tva: 18, montant_ttc: 212400000, montant_encaisse: 212400000, reste_a_payer: 0, statut: 'payee', situations_liees: [5, 6, 7], historique_paiements: [{ date: '2024-04-08', montant: 106200000, mode: 'Virement bancaire', reference: 'VIR-20240408-001' }, { date: '2024-04-09', montant: 106200000, mode: 'Virement bancaire', reference: 'VIR-20240409-001' }] },
    { id: 5, numero: 'FAC-2025-002', id_chantier: 3, id_contrat: 3, nom_chantier: 'Complexe Commercial Marcory', nom_client: 'Groupe Immobilier du Sud', date_emission: '2025-03-31', date_echeance: '2025-04-30', montant_ht: 95000000, tva: 18, montant_ttc: 112100000, montant_encaisse: 0, reste_a_payer: 112100000, statut: 'emise', situations_liees: [8], historique_paiements: [] },
  ];

  private facturesSubject = new BehaviorSubject<Facture[]>(this.FACTURES);

  getAll(): Observable<Facture[]> { return this.facturesSubject.asObservable(); }
  getById(id: number): Observable<Facture | undefined> { return of(this.FACTURES.find(f => f.id === id)); }
  getByChantier(idChantier: number): Observable<Facture[]> { return of(this.FACTURES.filter(f => f.id_chantier === idChantier)); }

  getStats(): Observable<{ total_encaisse: number; en_attente: number; emises: number; en_retard: number }> {
    return of({
      total_encaisse: this.FACTURES.filter(f => f.statut === 'payee').reduce((a, f) => a + f.montant_ttc, 0),
      en_attente: this.FACTURES.filter(f => f.statut === 'en_attente').reduce((a, f) => a + f.montant_ttc, 0),
      emises: this.FACTURES.filter(f => f.statut === 'emise').reduce((a, f) => a + f.montant_ttc, 0),
      en_retard: this.FACTURES.filter(f => f.statut === 'en_retard').reduce((a, f) => a + f.montant_ttc, 0),
    });
  }
}