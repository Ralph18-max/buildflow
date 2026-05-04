// ============================================================
// BuildDFlow — Modèles de données centralisés
// Toutes les interfaces TypeScript du projet
// ============================================================

// ─────────────────────────────────────────
// SYSTÈME
// ─────────────────────────────────────────

export type Role = 'admin' | 'conducteur' | 'chef_chantier' | 'comptable';

export interface Utilisateur {
  id: number;
  tenant_id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  actif: boolean;
  date_creation: string;
  avatar_initiales?: string;
}

// ─────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────

export type TypeClient = 'particulier' | 'societe';

export interface Client {
  id: number;
 nom?: string;  // optionnel — les sociétés n'ont pas de nom individuel
 prenom?: string;
  raison_sociale?: string;
  type_client: TypeClient;
  telephone: string;
  email: string;
  adresse: string;
  date_creation: string;
  nb_contrats?: number;
}

// ─────────────────────────────────────────
// CONTRAT
// ─────────────────────────────────────────

export type StatutContrat = 'en_negociation' | 'signe' | 'en_cours' | 'suspendu' | 'termine' | 'resilie' | 'cloture';

export interface Avenant {
  id: number;
  numero: string;
  objet: string;
  date: string;
  montant: number;
  delai_jours: number;
  statut: 'approuve' | 'en_attente' | 'refuse';
}

export interface SituationTravaux {
  id: number;
  numero: string;
  periode: string;
  date_emission: string;
  avancement_pct: number;
  montant_periode: number;
  montant_cumule: number;
  montant_encaisse: number;
  reste_a_facturer: number;
  statut: 'payee' | 'validee' | 'en_attente';
}

export interface Contrat {
  id: number;
  numero_marche: string;
  id_client: number;
  nom_client: string;
  type_construction: string;
  montant_marche: number;        // montant initial S0 — figé
  montant_marche_revise: number; // montant après avenants
  date_signature: string;
  date_demarrage_prevue: string;
  date_livraison_prevue: string;
  penalites_retard: number;      // montant par jour
  statut: StatutContrat;
  id_chantier?: number;
  avenants: Avenant[];
  situations: SituationTravaux[];
}

// ─────────────────────────────────────────
// BUDGET
// ─────────────────────────────────────────

export interface Budget {
  id_budget: number;
  id_chantier: number;
  // S0 — figés à la création
  debourse_sec_estime: number;     // Coût direct : MO + matériaux + matériel
  frais_generaux: number;          // Charges fixes entreprise réparties sur ce chantier
  marge_prevue: number;            // Bénéfice prévu
  provision_aleas: number;         // 5-10% du déboursé sec (imprévus)
  // Calculés
  montant_total_S0: number;        // debourse_sec + frais_generaux + marge + provision
  // Suivi en temps réel
  cout_reel_a_date: number;        // Coût réel cumulé à ce jour
  reste_a_depenser: number;        // S0 - coût réel
  ecart_budget: number;            // Positif = économie, négatif = dépassement
  // Méta
  date_creation: string;
  cree_par: string;
  s0_fige: boolean;                // true dès la première sauvegarde
}

// ─────────────────────────────────────────
// CORPS D'ÉTAT
// ─────────────────────────────────────────

export type StatutCorpsEtat = 'en_attente' | 'en_cours' | 'termine';

export interface CorpsEtat {
  id: number;
  id_chantier: number;
  nom: string;
  ordre_execution: number;
  part_chantier: number;         // % — somme de tous = 100%
  avancement: number;            // % mis à jour par conducteur
  date_debut_prevue: string;
  date_fin_prevue: string;
  date_debut_reelle?: string;
  date_fin_reelle?: string;
  budget_alloue: number;
  cout_reel: number;
  statut: StatutCorpsEtat;
  responsable?: string;
}

// ─────────────────────────────────────────
// PLANNING & JALONS
// ─────────────────────────────────────────

export type StatutJalon = 'atteint' | 'manque' | 'a_venir';

export interface Jalon {
  id: number;
  id_planning: number;
  nom: string;
  description?: string;
  date_prevue: string;
  date_reelle?: string;
  statut: StatutJalon;
  ecart_jours?: number;
}

export interface Planning {
  id: number;
  id_chantier: number;
  date_creation: string;
  date_debut_prevue: string;
  date_fin_prevue: string;
  version: number;               // 1 = initial, 2+ = révisé
  statut: 'initial' | 'revise';
  jalons: Jalon[];
}

// ─────────────────────────────────────────
// INTERVENANT
// ─────────────────────────────────────────

export interface Intervenant {
  id: number;
  id_corps_etat: number;
  id_chantier: number;
  type_intervenant: 'entreprise' | 'individu';
  nom?: string;
  prenom?: string;
  raison_sociale?: string;
  nom_responsable: string;
  telephone: string;
  email: string;
  montant_contrat: number;
  assurance: boolean;
  numero_agrement?: string;
  date_expiration_agrement?: string;
  corps_etat_nom?: string;       // dénormalisé pour affichage
  actif: boolean;
}

// ─────────────────────────────────────────
// CHANTIER
// ─────────────────────────────────────────

export type StatutChantier = 'en_cours' | 'termine' | 'suspendu' | 'cloture';

export interface Chantier {
  id: number;
  id_contrat: number;
  nom_chantier: string;
  localisation: string;
  description?: string;
  date_demarrage_reelle?: string;
  date_livraison_reelle?: string;
  date_livraison_prevue: string;
  statut: StatutChantier;
  avancement_global: number;     // calculé automatiquement
  chef_chantier: string;
  // Relations
  corps_etat: CorpsEtat[];
  intervenants: Intervenant[];
  planning?: Planning;
  budget?: Budget;
  // Dénormalisé pour affichage liste
  numero_marche?: string;
  nom_client?: string;
  montant_marche?: number;
}

// ─────────────────────────────────────────
// RAPPORT TERRAIN
// ─────────────────────────────────────────

export type Meteo = 'soleil' | 'nuageux' | 'pluie' | 'orage' | 'vent';

export interface AvancementCorpsEtat {
  id_corps_etat: number;
  nom: string;
  avancement_avant: number;
  avancement_apres: number;
}

export interface RapportTerrain {
  id: number;
  id_chantier: number;
  nom_chantier: string;
  date_rapport: string;
  redacteur: string;
  effectif_present: number;
  meteo: Meteo;
  corps_etat_travailles: AvancementCorpsEtat[];
  observations: string;
  incidents?: string;
  a_incident: boolean;
}

// ─────────────────────────────────────────
// POINTAGE
// ─────────────────────────────────────────

export interface PointageIntervenant {
  id_intervenant: number;
  nom_complet: string;
  corps_etat: string;
  present: boolean;
  heures: number;
  observation?: string;
}

export interface Pointage {
  id: number;
  id_chantier: number;
  nom_chantier: string;
  date: string;
  effectif_prevu: number;
  intervenants: PointageIntervenant[];
  total_presents: number;
  total_heures: number;
}

// ─────────────────────────────────────────
// DOCUMENT
// ─────────────────────────────────────────

export type CategorieDocument = 'contrat' | 'plan' | 'pv' | 'facture' | 'photo' | 'divers';

export interface Document {
  id: number;
  id_chantier: number;
  nom_chantier: string;
  nom_fichier: string;
  extension: string;
  categorie: CategorieDocument;
  ajoute_par: string;
  date_upload: string;
  taille_ko: number;
  url_fichier?: string;
}

// ─────────────────────────────────────────
// FACTURE (Situation consolidée)
// ─────────────────────────────────────────

export type StatutFacture = 'payee' | 'validee' | 'emise' | 'en_attente' | 'en_retard';

export interface Facture {
  id: number;
  numero: string;
  id_chantier: number;
  id_contrat: number;
  nom_chantier: string;
  nom_client: string;
  date_emission: string;
  date_echeance: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  montant_encaisse: number;
  reste_a_payer: number;
  statut: StatutFacture;
  situations_liees: number[];    // ids des situations
  historique_paiements: PaiementHistorique[];
}

export interface PaiementHistorique {
  date: string;
  montant: number;
  mode: string;
  reference: string;
}

// ─────────────────────────────────────────
// CLÔTURE
// ─────────────────────────────────────────

export interface Cloture {
  id: number;
  id_chantier: number;
  statut_bilan: 'en_attente' | 'bilan_valide' | 'cloture';
  date_validation_comptable?: string;
  date_cloture_admin?: string;
  marge_reelle?: number;
  total_encaisse: number;
  total_cout_reel: number;
  observations_comptable?: string;
}