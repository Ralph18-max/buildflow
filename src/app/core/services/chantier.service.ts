import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import {
  Chantier, CorpsEtat, Intervenant, Jalon, Planning, Budget
} from '../models';

// ============================================================
// BuildDFlow — ChantierService
// Source unique de vérité pour tous les chantiers
// Quand le backend arrive : remplacer of(...) par HttpClient
// ============================================================

@Injectable({ providedIn: 'root' })
export class ChantierService {

  // ─── Données simulées ────────────────────────────────────

  private readonly CORPS_ETAT: CorpsEtat[] = [
    // Chantier 1 — Résidence Les Palmiers
    { id: 101, id_chantier: 1, nom: 'Terrassement', ordre_execution: 1, part_chantier: 5, avancement: 100, date_debut_prevue: '2024-01-15', date_fin_prevue: '2024-02-15', date_debut_reelle: '2024-01-18', date_fin_reelle: '2024-02-20', budget_alloue: 12000000, cout_reel: 11800000, statut: 'termine', responsable: 'Kouassi BTP' },
    { id: 102, id_chantier: 1, nom: 'Fondations', ordre_execution: 2, part_chantier: 10, avancement: 100, date_debut_prevue: '2024-02-16', date_fin_prevue: '2024-04-01', date_debut_reelle: '2024-02-21', date_fin_reelle: '2024-04-05', budget_alloue: 28000000, cout_reel: 29200000, statut: 'termine', responsable: 'Fondation Pro CI' },
    { id: 103, id_chantier: 1, nom: 'Gros œuvre', ordre_execution: 3, part_chantier: 30, avancement: 100, date_debut_prevue: '2024-04-02', date_fin_prevue: '2024-08-30', date_debut_reelle: '2024-04-08', date_fin_reelle: '2024-09-10', budget_alloue: 95000000, cout_reel: 97500000, statut: 'termine', responsable: 'SOBECI' },
    { id: 104, id_chantier: 1, nom: 'Charpente / Toiture', ordre_execution: 4, part_chantier: 10, avancement: 100, date_debut_prevue: '2024-09-01', date_fin_prevue: '2024-10-15', date_debut_reelle: '2024-09-12', date_fin_reelle: '2024-10-20', budget_alloue: 32000000, cout_reel: 31500000, statut: 'termine', responsable: 'Charpente Abidjan' },
    { id: 105, id_chantier: 1, nom: 'Plomberie', ordre_execution: 5, part_chantier: 10, avancement: 85, date_debut_prevue: '2024-10-16', date_fin_prevue: '2024-12-15', date_debut_reelle: '2024-10-22', budget_alloue: 22000000, cout_reel: 18700000, statut: 'en_cours', responsable: 'Plomb Expert CI' },
    { id: 106, id_chantier: 1, nom: 'Électricité', ordre_execution: 6, part_chantier: 10, avancement: 70, date_debut_prevue: '2024-10-16', date_fin_prevue: '2024-12-15', date_debut_reelle: '2024-10-25', budget_alloue: 18000000, cout_reel: 12600000, statut: 'en_cours', responsable: 'Élec Pro' },
    { id: 107, id_chantier: 1, nom: 'Carrelage / Revêtements', ordre_execution: 7, part_chantier: 10, avancement: 40, date_debut_prevue: '2024-12-01', date_fin_prevue: '2025-02-28', budget_alloue: 25000000, cout_reel: 10000000, statut: 'en_cours', responsable: 'Deco Sol CI' },
    { id: 108, id_chantier: 1, nom: 'Peinture / Finitions', ordre_execution: 8, part_chantier: 10, avancement: 10, date_debut_prevue: '2025-01-15', date_fin_prevue: '2025-03-31', budget_alloue: 15000000, cout_reel: 1500000, statut: 'en_cours', responsable: 'Peint CI' },
    { id: 109, id_chantier: 1, nom: 'Aménagements extérieurs', ordre_execution: 9, part_chantier: 5, avancement: 0, date_debut_prevue: '2025-03-01', date_fin_prevue: '2025-04-30', budget_alloue: 8000000, cout_reel: 0, statut: 'en_attente', responsable: 'Green Espace' },

    // Chantier 2 — Villa Duplex Riviera (terminé)
    { id: 201, id_chantier: 2, nom: 'Terrassement', ordre_execution: 1, part_chantier: 5, avancement: 100, date_debut_prevue: '2023-03-01', date_fin_prevue: '2023-03-20', date_debut_reelle: '2023-03-01', date_fin_reelle: '2023-03-18', budget_alloue: 6000000, cout_reel: 5800000, statut: 'termine', responsable: 'Terrassement CI' },
    { id: 202, id_chantier: 2, nom: 'Gros œuvre', ordre_execution: 2, part_chantier: 40, avancement: 100, date_debut_prevue: '2023-03-21', date_fin_prevue: '2023-07-31', date_debut_reelle: '2023-03-22', date_fin_reelle: '2023-08-05', budget_alloue: 65000000, cout_reel: 66200000, statut: 'termine', responsable: 'SOBECI' },
    { id: 203, id_chantier: 2, nom: 'Charpente / Toiture', ordre_execution: 3, part_chantier: 10, avancement: 100, date_debut_prevue: '2023-08-01', date_fin_prevue: '2023-09-15', date_debut_reelle: '2023-08-08', date_fin_reelle: '2023-09-20', budget_alloue: 18000000, cout_reel: 17500000, statut: 'termine', responsable: 'Charpente Abidjan' },
    { id: 204, id_chantier: 2, nom: 'Plomberie & Élec', ordre_execution: 4, part_chantier: 20, avancement: 100, date_debut_prevue: '2023-09-16', date_fin_prevue: '2023-11-30', date_debut_reelle: '2023-09-20', date_fin_reelle: '2023-12-05', budget_alloue: 30000000, cout_reel: 29500000, statut: 'termine', responsable: 'Multi Technique CI' },
    { id: 205, id_chantier: 2, nom: 'Finitions', ordre_execution: 5, part_chantier: 25, avancement: 100, date_debut_prevue: '2023-12-01', date_fin_prevue: '2024-02-28', date_debut_reelle: '2023-12-08', date_fin_reelle: '2024-03-05', budget_alloue: 28000000, cout_reel: 27200000, statut: 'termine', responsable: 'Finitions Pro' },

    // Chantier 3 — Complexe Commercial Marcory
    { id: 301, id_chantier: 3, nom: 'Terrassement', ordre_execution: 1, part_chantier: 5, avancement: 100, date_debut_prevue: '2025-01-10', date_fin_prevue: '2025-02-10', date_debut_reelle: '2025-01-12', date_fin_reelle: '2025-02-15', budget_alloue: 18000000, cout_reel: 17500000, statut: 'termine', responsable: 'Terrassement CI' },
    { id: 302, id_chantier: 3, nom: 'Fondations', ordre_execution: 2, part_chantier: 15, avancement: 60, date_debut_prevue: '2025-02-11', date_fin_prevue: '2025-04-30', date_debut_reelle: '2025-02-18', budget_alloue: 55000000, cout_reel: 33000000, statut: 'en_cours', responsable: 'Fondation Pro CI' },
    { id: 303, id_chantier: 3, nom: 'Gros œuvre', ordre_execution: 3, part_chantier: 35, avancement: 0, date_debut_prevue: '2025-05-01', date_fin_prevue: '2025-10-31', budget_alloue: 145000000, cout_reel: 0, statut: 'en_attente', responsable: 'SOBECI' },
    { id: 304, id_chantier: 3, nom: 'Charpente métal', ordre_execution: 4, part_chantier: 15, avancement: 0, date_debut_prevue: '2025-11-01', date_fin_prevue: '2026-01-31', budget_alloue: 62000000, cout_reel: 0, statut: 'en_attente', responsable: 'Metal Structure CI' },
    { id: 305, id_chantier: 3, nom: 'Lots techniques', ordre_execution: 5, part_chantier: 20, avancement: 0, date_debut_prevue: '2026-02-01', date_fin_prevue: '2026-05-31', budget_alloue: 85000000, cout_reel: 0, statut: 'en_attente', responsable: 'Multi Technique CI' },
    { id: 306, id_chantier: 3, nom: 'Finitions & Façades', ordre_execution: 6, part_chantier: 10, avancement: 0, date_debut_prevue: '2026-06-01', date_fin_prevue: '2026-08-31', budget_alloue: 40000000, cout_reel: 0, statut: 'en_attente', responsable: 'Finitions Pro' },

    // Chantier 4 — Maison Individuelle Yopougon
    { id: 401, id_chantier: 4, nom: 'Terrassement', ordre_execution: 1, part_chantier: 5, avancement: 100, date_debut_prevue: '2025-10-01', date_fin_prevue: '2025-10-20', date_debut_reelle: '2025-10-03', date_fin_reelle: '2025-10-22', budget_alloue: 4000000, cout_reel: 3900000, statut: 'termine', responsable: 'Kouassi BTP' },
    { id: 402, id_chantier: 4, nom: 'Fondations', ordre_execution: 2, part_chantier: 15, avancement: 0, date_debut_prevue: '2025-10-21', date_fin_prevue: '2025-11-30', budget_alloue: 12000000, cout_reel: 0, statut: 'en_attente', responsable: 'Fondation Pro CI' },
    { id: 403, id_chantier: 4, nom: 'Gros œuvre', ordre_execution: 3, part_chantier: 35, avancement: 0, date_debut_prevue: '2025-12-01', date_fin_prevue: '2026-04-30', budget_alloue: 38000000, cout_reel: 0, statut: 'en_attente', responsable: 'SOBECI' },
    { id: 404, id_chantier: 4, nom: 'Toiture', ordre_execution: 4, part_chantier: 10, avancement: 0, date_debut_prevue: '2026-05-01', date_fin_prevue: '2026-06-15', budget_alloue: 11000000, cout_reel: 0, statut: 'en_attente', responsable: 'Charpente Abidjan' },
    { id: 405, id_chantier: 4, nom: 'Plomberie & Élec', ordre_execution: 5, part_chantier: 20, avancement: 0, date_debut_prevue: '2026-06-16', date_fin_prevue: '2026-08-31', budget_alloue: 18000000, cout_reel: 0, statut: 'en_attente', responsable: 'Multi Technique CI' },
    { id: 406, id_chantier: 4, nom: 'Finitions', ordre_execution: 6, part_chantier: 15, avancement: 0, date_debut_prevue: '2026-09-01', date_fin_prevue: '2026-10-31', budget_alloue: 14000000, cout_reel: 0, statut: 'en_attente', responsable: 'Finitions Pro' },
  ];

  private readonly INTERVENANTS: Intervenant[] = [
    // Chantier 1
    { id: 1, id_corps_etat: 101, id_chantier: 1, type_intervenant: 'entreprise', raison_sociale: 'Kouassi BTP SARL', nom_responsable: 'Kouassi Koffi', telephone: '+225 07 12 34 56', email: 'contact@kouassibtp.ci', montant_contrat: 11800000, assurance: true, numero_agrement: 'AGR-2022-0145', corps_etat_nom: 'Terrassement', actif: false },
    { id: 2, id_corps_etat: 103, id_chantier: 1, type_intervenant: 'entreprise', raison_sociale: 'SOBECI', nom_responsable: 'Diomandé Seydou', telephone: '+225 05 87 65 43', email: 'sd@sobeci.ci', montant_contrat: 97500000, assurance: true, numero_agrement: 'AGR-2020-0089', corps_etat_nom: 'Gros œuvre', actif: true },
    { id: 3, id_corps_etat: 105, id_chantier: 1, type_intervenant: 'entreprise', raison_sociale: 'Plomb Expert CI', nom_responsable: 'Bamba Moussa', telephone: '+225 01 23 45 67', email: 'bamba@plombexpert.ci', montant_contrat: 22000000, assurance: true, numero_agrement: 'AGR-2021-0234', corps_etat_nom: 'Plomberie', actif: true },
    { id: 4, id_corps_etat: 106, id_chantier: 1, type_intervenant: 'entreprise', raison_sociale: 'Élec Pro', nom_responsable: 'Touré Ibrahim', telephone: '+225 05 34 56 78', email: 'toure@elecpro.ci', montant_contrat: 18000000, assurance: true, numero_agrement: 'AGR-2021-0310', corps_etat_nom: 'Électricité', actif: true },
    { id: 5, id_corps_etat: 107, id_chantier: 1, type_intervenant: 'entreprise', raison_sociale: 'Deco Sol CI', nom_responsable: 'Koné Aminata', telephone: '+225 07 89 01 23', email: 'kone@decocisol.ci', montant_contrat: 25000000, assurance: true, corps_etat_nom: 'Carrelage', actif: true },
    // Chantier 3
    { id: 6, id_corps_etat: 301, id_chantier: 3, type_intervenant: 'entreprise', raison_sociale: 'Terrassement CI', nom_responsable: 'Yao Kouadio', telephone: '+225 07 45 67 89', email: 'yao@terrassementci.ci', montant_contrat: 17500000, assurance: true, numero_agrement: 'AGR-2022-0078', corps_etat_nom: 'Terrassement', actif: false },
    { id: 7, id_corps_etat: 302, id_chantier: 3, type_intervenant: 'entreprise', raison_sociale: 'Fondation Pro CI', nom_responsable: 'Coulibaly Adama', telephone: '+225 05 23 45 67', email: 'coulibaly@fondationpro.ci', montant_contrat: 55000000, assurance: true, numero_agrement: 'AGR-2019-0456', corps_etat_nom: 'Fondations', actif: true },
    // Chantier 4
    { id: 8, id_corps_etat: 401, id_chantier: 4, type_intervenant: 'entreprise', raison_sociale: 'Kouassi BTP SARL', nom_responsable: 'Kouassi Koffi', telephone: '+225 07 12 34 56', email: 'contact@kouassibtp.ci', montant_contrat: 3900000, assurance: true, numero_agrement: 'AGR-2022-0145', corps_etat_nom: 'Terrassement', actif: false },
  ];

  private readonly JALONS: Jalon[] = [
    // Chantier 1
    { id: 1, id_planning: 1, nom: 'Démarrage chantier', date_prevue: '2024-01-15', date_reelle: '2024-01-18', statut: 'atteint', ecart_jours: 3 },
    { id: 2, id_planning: 1, nom: 'Mise hors d\'eau', date_prevue: '2024-10-01', date_reelle: '2024-10-20', statut: 'atteint', ecart_jours: 19 },
    { id: 3, id_planning: 1, nom: 'Mise hors d\'air', date_prevue: '2024-11-01', date_reelle: '2024-11-15', statut: 'atteint', ecart_jours: 14 },
    { id: 4, id_planning: 1, nom: 'Réception provisoire', date_prevue: '2025-03-31', statut: 'a_venir' },
    // Chantier 3
    { id: 5, id_planning: 3, nom: 'Démarrage chantier', date_prevue: '2025-01-10', date_reelle: '2025-01-12', statut: 'atteint', ecart_jours: 2 },
    { id: 6, id_planning: 3, nom: 'Fin fondations', date_prevue: '2025-04-30', statut: 'a_venir' },
    { id: 7, id_planning: 3, nom: 'Mise hors d\'eau', date_prevue: '2026-01-31', statut: 'a_venir' },
    { id: 8, id_planning: 3, nom: 'Réception provisoire', date_prevue: '2026-08-31', statut: 'a_venir' },
    // Chantier 4
    { id: 9, id_planning: 4, nom: 'Démarrage chantier', date_prevue: '2025-10-01', date_reelle: '2025-10-03', statut: 'atteint', ecart_jours: 2 },
    { id: 10, id_planning: 4, nom: 'Mise hors d\'eau', date_prevue: '2026-06-15', statut: 'a_venir' },
    { id: 11, id_planning: 4, nom: 'Réception provisoire', date_prevue: '2026-10-31', statut: 'a_venir' },
  ];

  private readonly BUDGETS: Budget[] = [
    { id_budget: 1, id_chantier: 1, debourse_sec_estime: 255000000, frais_generaux: 25500000, marge_prevue: 38250000, provision_aleas: 12750000, montant_total_S0: 331500000, cout_reel_a_date: 212800000, reste_a_depenser: 42200000, ecart_budget: -42200000, date_creation: '2024-01-18', cree_par: 'admin', s0_fige: true },
    { id_budget: 2, id_chantier: 2, debourse_sec_estime: 147000000, frais_generaux: 14700000, marge_prevue: 22050000, provision_aleas: 7350000, montant_total_S0: 191100000, cout_reel_a_date: 146200000, reste_a_depenser: 800000, ecart_budget: -800000, date_creation: '2023-03-01', cree_par: 'admin', s0_fige: true },
    { id_budget: 3, id_chantier: 3, debourse_sec_estime: 405000000, frais_generaux: 40500000, marge_prevue: 60750000, provision_aleas: 20250000, montant_total_S0: 526500000, cout_reel_a_date: 50500000, reste_a_depenser: 354500000, ecart_budget: -354500000, date_creation: '2025-01-12', cree_par: 'admin', s0_fige: true },
    { id_budget: 4, id_chantier: 4, debourse_sec_estime: 101000000, frais_generaux: 10100000, marge_prevue: 15150000, provision_aleas: 5050000, montant_total_S0: 131300000, cout_reel_a_date: 3900000, reste_a_depenser: 97100000, ecart_budget: -97100000, date_creation: '2025-10-03', cree_par: 'admin', s0_fige: true },
  ];

  private readonly CHANTIERS: Chantier[] = [
    {
      id: 1,
      id_contrat: 1,
      nom_chantier: 'Résidence Les Palmiers',
      localisation: 'Cocody, Abidjan',
      description: 'Immeuble R+4 de 20 appartements. Superficie : 1 200 m². Finitions haut de gamme.',
      date_demarrage_reelle: '2024-01-18',
      date_livraison_prevue: '2025-03-31',
      statut: 'en_cours',
      avancement_global: 72,
      chef_chantier: 'Bah Mamadou',
      numero_marche: 'MRC-2024-001',
      nom_client: 'SCI Les Palmiers',
      montant_marche: 450000000,
      corps_etat: [],
      intervenants: [],
    },
    {
      id: 2,
      id_contrat: 2,
      nom_chantier: 'Villa Duplex Riviera',
      localisation: 'Riviera 3, Abidjan',
      description: 'Villa duplex 5 chambres avec piscine. Superficie : 420 m².',
      date_demarrage_reelle: '2023-03-01',
      date_livraison_prevue: '2024-03-15',
      date_livraison_reelle: '2024-03-10',
      statut: 'termine',
      avancement_global: 100,
      chef_chantier: 'Traoré Mamadou',
      numero_marche: 'MRC-2024-002',
      nom_client: 'Konan Yves',
      montant_marche: 210000000,
      corps_etat: [],
      intervenants: [],
    },
    {
      id: 3,
      id_contrat: 3,
      nom_chantier: 'Complexe Commercial Marcory',
      localisation: 'Marcory Zone 4, Abidjan',
      description: 'Centre commercial R+3, 45 boutiques et parking souterrain. Superficie : 3 800 m².',
      date_demarrage_reelle: '2025-01-12',
      date_livraison_prevue: '2026-09-30',
      statut: 'en_cours',
      avancement_global: 18,
      chef_chantier: 'Koné Drissa',
      numero_marche: 'MRC-2025-001',
      nom_client: 'Groupe Immobilier du Sud',
      montant_marche: 680000000,
      corps_etat: [],
      intervenants: [],
    },
    {
      id: 4,
      id_contrat: 4,
      nom_chantier: 'Maison Individuelle Yopougon',
      localisation: 'Yopougon Attié, Abidjan',
      description: 'Maison 4 chambres, salon, cuisine américaine. Superficie : 180 m².',
      date_demarrage_reelle: '2025-10-03',
      date_livraison_prevue: '2026-10-31',
      statut: 'en_cours',
      avancement_global: 5,
      chef_chantier: 'Yapi Serge',
      numero_marche: 'MRC-2025-002',
      nom_client: 'Diabaté Moussa',
      montant_marche: 145000000,
      corps_etat: [],
      intervenants: [],
    },
  ];

  // ─── BehaviorSubject pour réactivité ─────────────────────

  private chantiersSubject = new BehaviorSubject<Chantier[]>(this._buildChantiers());

  private _buildChantiers(): Chantier[] {
    return this.CHANTIERS.map(c => ({
      ...c,
      corps_etat: this.CORPS_ETAT.filter(ce => ce.id_chantier === c.id),
      intervenants: this.INTERVENANTS.filter(i => i.id_chantier === c.id),
      budget: this.BUDGETS.find(b => b.id_chantier === c.id),
      planning: this._buildPlanning(c.id),
    }));
  }

  private _buildPlanning(idChantier: number): Planning {
    return {
      id: idChantier,
      id_chantier: idChantier,
      date_creation: '2024-01-01',
      date_debut_prevue: this.CHANTIERS.find(c => c.id === idChantier)?.date_demarrage_reelle || '',
      date_fin_prevue: this.CHANTIERS.find(c => c.id === idChantier)?.date_livraison_prevue || '',
      version: idChantier === 1 ? 2 : 1,
      statut: idChantier === 1 ? 'revise' : 'initial',
      jalons: this.JALONS.filter(j => j.id_planning === idChantier),
    };
  }

  // ─── API Publique ─────────────────────────────────────────

  /** Tous les chantiers */
  getAll(): Observable<Chantier[]> {
    return this.chantiersSubject.asObservable();
  }

  /** Un chantier par ID */
  getById(id: number): Observable<Chantier | undefined> {
    const chantier = this._buildChantiers().find(c => c.id === id);
    return of(chantier);
  }

  /** Chantiers en cours uniquement */
  getEnCours(): Observable<Chantier[]> {
    return of(this._buildChantiers().filter(c => c.statut === 'en_cours'));
  }

  /** Corps d'état d'un chantier */
  getCorpsEtat(idChantier: number): Observable<CorpsEtat[]> {
    return of(this.CORPS_ETAT.filter(ce => ce.id_chantier === idChantier));
  }

  /** Intervenants d'un chantier */
  getIntervenants(idChantier: number): Observable<Intervenant[]> {
    return of(this.INTERVENANTS.filter(i => i.id_chantier === idChantier));
  }

  /** Budget d'un chantier */
  getBudget(idChantier: number): Observable<Budget | undefined> {
    return of(this.BUDGETS.find(b => b.id_chantier === idChantier));
  }

  /** Planning + jalons d'un chantier */
  getPlanning(idChantier: number): Observable<Planning> {
    return of(this._buildPlanning(idChantier));
  }

  /** Mise à jour de l'avancement d'un corps d'état
   * Recalcule automatiquement l'avancement global du chantier */
  updateAvancement(idCorpsEtat: number, nouvelAvancement: number): Observable<boolean> {
    const ce = this.CORPS_ETAT.find(c => c.id === idCorpsEtat);
    if (!ce) return of(false);

    ce.avancement = nouvelAvancement;
    ce.statut = nouvelAvancement === 0 ? 'en_attente'
              : nouvelAvancement === 100 ? 'termine'
              : 'en_cours';

    // Recalcule l'avancement global du chantier
    const chantier = this.CHANTIERS.find(c => c.id === ce.id_chantier);
    if (chantier) {
      chantier.avancement_global = this._calcAvancementGlobal(ce.id_chantier);
    }

    this.chantiersSubject.next(this._buildChantiers());
    return of(true);
  }

  /** Calcul de l'avancement global pondéré
   * Formule : Σ (part_chantier × avancement) / 100 */
  private _calcAvancementGlobal(idChantier: number): number {
    const corps = this.CORPS_ETAT.filter(ce => ce.id_chantier === idChantier);
    const total = corps.reduce((acc, ce) => acc + (ce.part_chantier * ce.avancement) / 100, 0);
    return Math.round(total);
  }

  /** Noms des chantiers pour les selects */
  getOptions(): Observable<{ id: number; nom: string }[]> {
    return of(this.CHANTIERS.map(c => ({ id: c.id, nom: c.nom_chantier })));
  }

  /** Stats globales pour le dashboard */
  getStats(): Observable<{ total: number; en_cours: number; termines: number; suspendus: number }> {
    const all = this.CHANTIERS;
    return of({
      total: all.length,
      en_cours: all.filter(c => c.statut === 'en_cours').length,
      termines: all.filter(c => c.statut === 'termine').length,
      suspendus: all.filter(c => c.statut === 'suspendu').length,
    });
  }
}