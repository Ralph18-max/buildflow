import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Contrat, Avenant, SituationTravaux, StatutContrat } from '../models';

// ============================================================
// BuildDFlow — ContratService
// Source unique de vérité pour tous les contrats
// ============================================================

@Injectable({ providedIn: 'root' })
export class ContratService {

  private readonly AVENANTS: Record<number, Avenant[]> = {
    1: [
      { id: 1, numero: 'AVN-001', objet: 'Ajout d\'une terrasse au R+4', date: '2024-06-15', montant: 12000000, delai_jours: 15, statut: 'approuve' },
      { id: 2, numero: 'AVN-002', objet: 'Modification des finitions salle de bain', date: '2024-09-20', montant: 4500000, delai_jours: 7, statut: 'approuve' },
      { id: 3, numero: 'AVN-003', objet: 'Installation climatisation centralisée', date: '2024-11-05', montant: 8000000, delai_jours: 10, statut: 'en_attente' },
    ],
    2: [
      { id: 4, numero: 'AVN-001', objet: 'Extension piscine', date: '2023-07-10', montant: 6000000, delai_jours: 0, statut: 'approuve' },
    ],
    3: [],
    4: [],
  };

  private readonly SITUATIONS: Record<number, SituationTravaux[]> = {
    1: [
      { id: 1, numero: 'SIT-001', periode: 'Jan–Mar 2024', date_emission: '2024-03-31', avancement_pct: 15, montant_periode: 67500000, montant_cumule: 67500000, montant_encaisse: 67500000, reste_a_facturer: 382500000, statut: 'payee' },
      { id: 2, numero: 'SIT-002', periode: 'Avr–Jun 2024', date_emission: '2024-06-30', avancement_pct: 32, montant_periode: 76500000, montant_cumule: 144000000, montant_encaisse: 76500000, reste_a_facturer: 306000000, statut: 'payee' },
      { id: 3, numero: 'SIT-003', periode: 'Jul–Sep 2024', date_emission: '2024-09-30', avancement_pct: 52, montant_periode: 90000000, montant_cumule: 234000000, montant_encaisse: 90000000, reste_a_facturer: 216000000, statut: 'payee' },
      { id: 4, numero: 'SIT-004', periode: 'Oct–Déc 2024', date_emission: '2024-12-31', avancement_pct: 70, montant_periode: 81000000, montant_cumule: 315000000, montant_encaisse: 0, reste_a_facturer: 135000000, statut: 'en_attente' },
    ],
    2: [
      { id: 5, numero: 'SIT-001', periode: 'Mar–Jun 2023', date_emission: '2023-06-30', avancement_pct: 30, montant_periode: 64800000, montant_cumule: 64800000, montant_encaisse: 64800000, reste_a_facturer: 151200000, statut: 'payee' },
      { id: 6, numero: 'SIT-002', periode: 'Jul–Sep 2023', date_emission: '2023-09-30', avancement_pct: 60, montant_periode: 64800000, montant_cumule: 129600000, montant_encaisse: 64800000, reste_a_facturer: 86400000, statut: 'payee' },
      { id: 7, numero: 'SIT-003', periode: 'Oct 2023–Mar 2024', date_emission: '2024-03-10', avancement_pct: 100, montant_periode: 86400000, montant_cumule: 216000000, montant_encaisse: 86400000, reste_a_facturer: 0, statut: 'payee' },
    ],
    3: [
      { id: 8, numero: 'SIT-001', periode: 'Jan–Mar 2025', date_emission: '2025-03-31', avancement_pct: 10, montant_periode: 68000000, montant_cumule: 68000000, montant_encaisse: 68000000, reste_a_facturer: 612000000, statut: 'payee' },
    ],
    4: [],
  };

  private readonly CONTRATS: Contrat[] = [
    {
      id: 1,
      numero_marche: 'MRC-2024-001',
      id_client: 1,
      nom_client: 'SCI Les Palmiers',
      type_construction: 'Immeuble résidentiel R+4',
      montant_marche: 450000000,
      montant_marche_revise: 474500000, // + 3 avenants approuvés
      date_signature: '2023-12-20',
      date_demarrage_prevue: '2024-01-15',
      date_livraison_prevue: '2025-03-31',
      penalites_retard: 450000,
      statut: 'en_cours',
      id_chantier: 1,
      avenants: [],
      situations: [],
    },
    {
      id: 2,
      numero_marche: 'MRC-2024-002',
      id_client: 2,
      nom_client: 'Konan Yves',
      type_construction: 'Villa duplex',
      montant_marche: 210000000,
      montant_marche_revise: 216000000, // + 1 avenant
      date_signature: '2023-02-10',
      date_demarrage_prevue: '2023-03-01',
      date_livraison_prevue: '2024-03-15',
      penalites_retard: 210000,
      statut: 'cloture',
      id_chantier: 2,
      avenants: [],
      situations: [],
    },
    {
      id: 3,
      numero_marche: 'MRC-2025-001',
      id_client: 3,
      nom_client: 'Groupe Immobilier du Sud',
      type_construction: 'Complexe commercial R+3',
      montant_marche: 680000000,
      montant_marche_revise: 680000000,
      date_signature: '2024-12-05',
      date_demarrage_prevue: '2025-01-10',
      date_livraison_prevue: '2026-09-30',
      penalites_retard: 680000,
      statut: 'en_cours',
      id_chantier: 3,
      avenants: [],
      situations: [],
    },
    {
      id: 4,
      numero_marche: 'MRC-2025-002',
      id_client: 4,
      nom_client: 'Diabaté Moussa',
      type_construction: 'Maison individuelle',
      montant_marche: 145000000,
      montant_marche_revise: 145000000,
      date_signature: '2025-09-15',
      date_demarrage_prevue: '2025-10-01',
      date_livraison_prevue: '2026-10-31',
      penalites_retard: 145000,
      statut: 'signe',
      id_chantier: 4,
      avenants: [],
      situations: [],
    },
  ];

  private contratsSubject = new BehaviorSubject<Contrat[]>(this._buildContrats());

  private _buildContrats(): Contrat[] {
    return this.CONTRATS.map(c => ({
      ...c,
      avenants: this.AVENANTS[c.id] || [],
      situations: this.SITUATIONS[c.id] || [],
    }));
  }

  // ─── API Publique ─────────────────────────────────────────

  getAll(): Observable<Contrat[]> {
    return this.contratsSubject.asObservable();
  }

  getById(id: number): Observable<Contrat | undefined> {
    return of(this._buildContrats().find(c => c.id === id));
  }

  getByChantier(idChantier: number): Observable<Contrat | undefined> {
    return of(this._buildContrats().find(c => c.id_chantier === idChantier));
  }

  getAvenants(idContrat: number): Observable<Avenant[]> {
    return of(this.AVENANTS[idContrat] || []);
  }

  getSituations(idContrat: number): Observable<SituationTravaux[]> {
    return of(this.SITUATIONS[idContrat] || []);
  }

  /** Stats pour dashboard */
  getStats(): Observable<{ total_encaisse: number; total_raf: number }> {
    const toutes = this._buildContrats();
    let encaisse = 0;
    let raf = 0;
    toutes.forEach(c => {
      c.situations.forEach(s => { encaisse += s.montant_encaisse; });
      if (c.situations.length > 0) {
        raf += c.situations[c.situations.length - 1].reste_a_facturer;
      }
    });
    return of({ total_encaisse: encaisse, total_raf: raf });
  }

  /** Options pour les selects */
  getOptions(): Observable<{ id: number; label: string }[]> {
    return of(this.CONTRATS.map(c => ({
      id: c.id,
      label: `${c.numero_marche} — ${c.nom_client}`,
    })));
  }
}