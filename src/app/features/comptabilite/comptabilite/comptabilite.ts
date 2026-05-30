import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, DecimalPipe, DatePipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PermissionService } from '../../../core/services/permission.service';
import { environment } from '../../../../environments/environment';

const API_URL = environment.apiUrl;

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface KpiCard {
  label: string;
  valeur: number;
  unite: string;
  icone: string;
  couleur: 'green' | 'orange' | 'red' | 'blue';
  detail?: string;
}

interface Situation {
  id: number;
  numero: string;
  chantier: string;
  chantierId: number;
  client: string;
  dateEmission: string;
  dateEcheance: string;
  avancement: number;
  montantHT: number;
  montantTTC: number;
  montantEncaisse: number;
  statut: 'payee' | 'en_attente' | 'en_retard' | 'emise';
  referenceVirement?: string;
}

interface FactureST {
  id: number;
  numero: string;
  chantier: string;
  chantierId: number;
  intervenant: string;
  corps_etat: string;
  dateFacture: string;
  dateReception: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  statut: 'validee' | 'en_attente' | 'contestee';
}

interface BilanChantier {
  id: number;
  nom: string;
  client: string;
  statut: 'en_cours' | 'termine' | 'suspendu';
  statut_bilan: 'en_cours' | 'bilan_valide' | 'cloture';
  avancement: number;
  montantMarche: number;
  totalEncaisse: number;
  coutReel: number;
  raf: number;
  rad: number;
  marge: number;
  depassement: boolean;
}

interface ModalEncaissement {
  visible: boolean;
  situationId: number | null;
  montant: number | null;
  date: string;
  reference: string;
}

interface ModalFactureST {
  visible: boolean;
  chantierId: number | null;
  intervenant: string;
  corps_etat: string;
  dateFacture: string;
  montantHT: number | null;
  tauxTVA: number;
  reference: string;
}


// ─── Composant ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-comptabilite',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DecimalPipe, DatePipe, SlicePipe, FormsModule],
  templateUrl: './comptabilite.html',
  styleUrl: './comptabilite.scss'
})
export class ComptabiliteComponent implements OnInit {

  activeTab: 'dashboard' | 'encaissements' | 'factures_st' | 'bilan' = 'dashboard';

  // Filtres
  filtreStatutSituation: string = 'tous';
  filtreStatutFactureST: string = 'tous';
  rechercheEncaissement: string = '';
  rechercheFactureST: string = '';

  // Modals
  modalEncaissement: ModalEncaissement = {
    visible: false, situationId: null, montant: null, date: '', reference: ''
  };
  modalFactureST: ModalFactureST = {
    visible: false, chantierId: null, intervenant: '', corps_etat: '',
    dateFacture: '', montantHT: null, tauxTVA: 18, reference: ''
  };

  // Notifications
  successMessage: string = '';
  erreurMessage: string = '';
  encaissementErreur: string = '';

  // Confirmation bilan
  showConfirmBilan = false;
  bilanAValider: BilanChantier | null = null;

  // Données
  situations: Situation[] = [];
  facturesST: FactureST[] = [];
  bilans: BilanChantier[] = [];

  // Chantiers pour les selects (chargés depuis l'API)
  chantiers: { id: number; nom: string }[] = [];

  corpsEtat = [
    'Terrassement', 'Gros œuvre', 'Charpente', 'Étanchéité',
    'Plomberie', 'Électricité', 'Menuiserie', 'Carrelage', 'Peinture', 'Autre'
  ];

  constructor(
    private perms: PermissionService,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this._chargerSituations();
    this._chargerBilans();
    this._chargerFacturesST();
    this.http.get<any[]>(`${API_URL}/chantiers`).subscribe(list =>
      this.chantiers = list.map(c => ({ id: c.id, nom: c.nom_chantier }))
    );
  }

  private _chargerSituations(): void {
    this.http.get<any[]>(`${API_URL}/facturation/situations`).subscribe(list =>
      this.situations = list.map(s => this._mapSituation(s))
    );
  }

  private _chargerBilans(): void {
    this.http.get<any[]>(`${API_URL}/comptabilite/bilan`).subscribe(list =>
      this.bilans = list.map(b => this._mapBilan(b))
    );
  }

  private _chargerFacturesST(): void {
    this.http.get<any[]>(`${API_URL}/facturation/factures-st`).subscribe(list =>
      this.facturesST = list.map(f => this._mapFactureST(f))
    );
  }

  private _mapFactureST(f: any): FactureST {
    return {
      id:            f.id,
      numero:        f.numero,
      chantier:      f.chantier?.nom_chantier || '',
      chantierId:    f.id_chantier,
      intervenant:   f.intervenant,
      corps_etat:    f.corps_etat || '',
      dateFacture:   f.date_facture ? new Date(f.date_facture).toISOString().split('T')[0] : '',
      dateReception: f.date_reception ? new Date(f.date_reception).toISOString().split('T')[0] : '',
      montantHT:     f.montant_ht,
      montantTVA:    f.montant_tva,
      montantTTC:    f.montant_ttc,
      statut:        f.statut,
    };
  }

  private _mapSituation(s: any): Situation {
    const dateEmission = s.date_emission?.split('T')[0] || '';
    const echeance = dateEmission
      ? new Date(new Date(dateEmission).getTime() + 30 * 86400000).toISOString().split('T')[0]
      : '';
    const client = s.chantier?.contrat?.client;
    const nomClient = client
      ? (client.type_client === 'societe'
          ? (client.raison_sociale || '')
          : `${client.nom || ''} ${client.prenom || ''}`.trim())
      : '';
    const dernierPaiement = s.paiements?.[s.paiements.length - 1];
    return {
      id:                s.id,
      numero:            `SIT-${s.id_chantier}-${String(s.numero_situation).padStart(3, '0')}`,
      chantier:          s.chantier?.nom_chantier || '',
      chantierId:        s.id_chantier,
      client:            nomClient,
      dateEmission,
      dateEcheance:      echeance,
      avancement:        s.avancement_facture || 0,
      montantHT:         s.montant_ht || 0,
      montantTTC:        s.montant_ttc || 0,
      montantEncaisse:   s.montant_encaisse || 0,
      statut:            s.statut || 'en_attente',
      referenceVirement: dernierPaiement?.reference,
    };
  }

  private _mapBilan(b: any): BilanChantier {
    return {
      id:            b.id,
      nom:           b.nom_chantier,
      client:        b.nom_client || '',
      statut:        b.statut || 'en_cours',
      statut_bilan:  b.statut_bilan || 'en_cours',
      avancement:    b.avancement || 0,
      montantMarche: b.montant_marche || 0,
      totalEncaisse: b.encaisse || 0,
      coutReel:      b.cout_reel || 0,
      raf:           b.raf || 0,
      rad:           b.rad || 0,
      marge:         b.marge || 0,
      depassement:   b.alerte || false,
    };
  }

  // ─── KPI Dashboard ────────────────────────────────────────────────────────

  get kpiCards(): KpiCard[] {
    return [
      {
        label: 'Total encaissé',
        valeur: this.totalEncaisse,
        unite: 'FCFA',
        icone: 'payments',
        couleur: 'green',
        detail: `${this.situations.filter(s => s.statut === 'payee').length} situation(s) réglée(s)`
      },
      {
        label: 'En attente',
        valeur: this.totalEnAttente,
        unite: 'FCFA',
        icone: 'hourglass_empty',
        couleur: 'orange',
        detail: `${this.situations.filter(s => s.statut === 'emise' || s.statut === 'en_attente').length} situation(s) émise(s)`
      },
      {
        label: 'En retard',
        valeur: this.totalEnRetard,
        unite: 'FCFA',
        icone: 'warning_amber',
        couleur: 'red',
        detail: `${this.situations.filter(s => s.statut === 'en_retard').length} situation(s) en retard`
      },
      {
        label: 'Factures ST en attente',
        valeur: this.totalFacturesST,
        unite: 'FCFA',
        icone: 'receipt',
        couleur: 'blue',
        detail: `${this.facturesST.filter(f => f.statut === 'en_attente').length} facture(s) à valider`
      },
    ];
  }

  get totalEncaisse(): number {
    return this.situations
      .filter(s => s.statut === 'payee')
      .reduce((sum, s) => sum + s.montantEncaisse, 0);
  }

  get totalEnAttente(): number {
    return this.situations
      .filter(s => s.statut === 'emise' || s.statut === 'en_attente')
      .reduce((sum, s) => sum + s.montantTTC, 0);
  }

  get totalEnRetard(): number {
    return this.situations
      .filter(s => s.statut === 'en_retard')
      .reduce((sum, s) => sum + s.montantTTC, 0);
  }

  get totalFacturesST(): number {
    return this.facturesST
      .filter(f => f.statut === 'en_attente')
      .reduce((sum, f) => sum + f.montantTTC, 0);
  }

  get margeGlobale(): number {
    return this.bilans.reduce((sum, b) => sum + b.marge, 0);
  }

  get rafGlobal(): number {
    return this.bilans.reduce((sum, b) => sum + b.raf, 0);
  }

  // ─── Encaissements ────────────────────────────────────────────────────────

  get situationsFiltrees(): Situation[] {
    let list = this.situations;
    if (this.filtreStatutSituation !== 'tous') {
      list = list.filter(s => s.statut === this.filtreStatutSituation);
    }
    if (this.rechercheEncaissement.trim()) {
      const q = this.rechercheEncaissement.toLowerCase();
      list = list.filter(s =>
        s.numero.toLowerCase().includes(q) ||
        s.chantier.toLowerCase().includes(q) ||
        s.client.toLowerCase().includes(q)
      );
    }
    return list;
  }

  ouvrirModalEncaissement(situation: Situation): void {
    this.modalEncaissement = {
      visible: true,
      situationId: situation.id,
      montant: situation.montantTTC,
      date: new Date().toISOString().split('T')[0],
      reference: ''
    };
  }

  fermerModalEncaissement(): void {
    this.modalEncaissement.visible = false;
    this.encaissementErreur = '';
  }

  validerEncaissement(): void {
    const m = this.modalEncaissement;
    this.encaissementErreur = '';

    if (!m.situationId || !m.montant) { this.encaissementErreur = 'Veuillez saisir un montant.'; return; }
    if (m.montant <= 0) { this.encaissementErreur = 'Le montant doit être supérieur à zéro.'; return; }
    if (!m.date) { this.encaissementErreur = 'La date de réception est obligatoire.'; return; }
    if (!m.reference.trim()) { this.encaissementErreur = 'La référence de virement est obligatoire.'; return; }

    const sit = this.situations.find(s => s.id === m.situationId);
    if (sit && m.montant > sit.montantTTC) {
      this.encaissementErreur = `Le montant ne peut pas dépasser ${new Intl.NumberFormat('fr-FR').format(sit.montantTTC)} FCFA TTC.`;
      return;
    }

    this.http.post(`${API_URL}/facturation/encaissements`, {
      id_situation:  m.situationId,
      montant:       m.montant,
      date_paiement: m.date,
      reference:     m.reference,
      mode_paiement: 'virement',
    }).subscribe({
      next: () => {
        this.fermerModalEncaissement();
        this.afficherSucces('Encaissement enregistré avec succès');
        this._chargerSituations();
      },
      error: (err) => {
        this.encaissementErreur = err?.error?.message || 'Erreur lors de l\'enregistrement.';
      },
    });
  }

  getSituationParId(id: number | null): Situation | undefined {
    return this.situations.find(s => s.id === id);
  }

  // ─── Factures ST ──────────────────────────────────────────────────────────

  get facturesST_filtrees(): FactureST[] {
    let list = this.facturesST;
    if (this.filtreStatutFactureST !== 'tous') {
      list = list.filter(f => f.statut === this.filtreStatutFactureST);
    }
    if (this.rechercheFactureST.trim()) {
      const q = this.rechercheFactureST.toLowerCase();
      list = list.filter(f =>
        f.numero.toLowerCase().includes(q) ||
        f.chantier.toLowerCase().includes(q) ||
        f.intervenant.toLowerCase().includes(q)
      );
    }
    return list;
  }

  ouvrirModalFactureST(): void {
    this.modalFactureST = {
      visible: true, chantierId: null, intervenant: '', corps_etat: '',
      dateFacture: new Date().toISOString().split('T')[0],
      montantHT: null, tauxTVA: 18, reference: ''
    };
  }

  fermerModalFactureST(): void {
    this.modalFactureST.visible = false;
  }

  getMontantTVA(): number {
    if (!this.modalFactureST.montantHT) return 0;
    return this.modalFactureST.montantHT * this.modalFactureST.tauxTVA / 100;
  }

  getMontantTTCModal(): number {
    if (!this.modalFactureST.montantHT) return 0;
    return this.modalFactureST.montantHT + this.getMontantTVA();
  }

  enregistrerFactureST(): void {
    const m = this.modalFactureST;
    if (!m.chantierId) { this.afficherErreur('Veuillez sélectionner un chantier.'); return; }
    if (!m.intervenant.trim()) { this.afficherErreur('Le nom de l\'intervenant est obligatoire.'); return; }
    if (!m.montantHT || m.montantHT <= 0) { this.afficherErreur('Le montant HT doit être supérieur à 0.'); return; }
    if (m.tauxTVA < 0 || m.tauxTVA > 100) { this.afficherErreur('Le taux de TVA doit être compris entre 0 et 100.'); return; }
    if (m.reference.trim() && m.reference.trim().length < 3) { this.afficherErreur('La référence doit contenir au moins 3 caractères.'); return; }

    this.http.post<any>(`${API_URL}/facturation/factures-st`, {
      id_chantier:  m.chantierId,
      intervenant:  m.intervenant,
      corps_etat:   m.corps_etat || null,
      date_facture: m.dateFacture,
      montant_ht:   m.montantHT,
      taux_tva:     m.tauxTVA,
    }).subscribe({
      next: () => {
        this.fermerModalFactureST();
        this.afficherSucces('Facture sous-traitant enregistrée');
        this._chargerFacturesST();
      },
      error: (err: any) => {
        this.afficherErreur(err?.error?.message || 'Erreur lors de l\'enregistrement.');
      },
    });
  }

  validerFactureST(facture: FactureST): void {
    this.http.patch(`${API_URL}/facturation/factures-st/${facture.id}/valider`, {}).subscribe({
      next: () => {
        facture.statut = 'validee';
        this.afficherSucces('Facture validée');
      },
      error: (err: any) => {
        this.afficherErreur(err?.error?.message || 'Erreur lors de la validation.');
      },
    });
  }

  // ─── Bilan & Clôture ──────────────────────────────────────────────────────

  get peutValiderBilan(): boolean {
    return this.perms.can('cloture:bilan_valider');
  }

  validerBilan(bilan: BilanChantier): void {
    this.bilanAValider = bilan;
    this.showConfirmBilan = true;
  }

  confirmerValidationBilan(): void {
    if (!this.bilanAValider) return;
    const nom = this.bilanAValider.nom;
    this.http.post(`${API_URL}/comptabilite/cloture/${this.bilanAValider.id}/valider`, {}).subscribe({
      next: () => {
        this.afficherSucces(`Bilan du chantier "${nom}" validé. L'administrateur peut maintenant procéder à la clôture.`);
        this.showConfirmBilan = false;
        this.bilanAValider = null;
        this._chargerBilans();
      },
      error: (err) => {
        this.afficherErreur(err?.error?.message || 'Erreur lors de la validation du bilan.');
        this.showConfirmBilan = false;
        this.bilanAValider = null;
      },
    });
  }

  annulerValidationBilan(): void {
    this.showConfirmBilan = false;
    this.bilanAValider = null;
  }

  voirChantier(id: number): void {
    this.router.navigate(['/chantiers', id]);
  }

  getMargePourcent(bilan: BilanChantier): number {
    if (!bilan.montantMarche) return 0;
    return (bilan.marge / bilan.montantMarche) * 100;
  }

  // ─── Utilitaires ──────────────────────────────────────────────────────────

  setTab(tab: 'dashboard' | 'encaissements' | 'factures_st' | 'bilan'): void {
    this.activeTab = tab;
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      payee: 'Payée', emise: 'Émise', en_attente: 'En attente',
      en_retard: 'En retard', validee: 'Validée', contestee: 'Contestée',
      en_cours: 'En cours', bilan_valide: 'Bilan validé', cloture: 'Clôturé'
    };
    return labels[statut] || statut;
  }

  afficherSucces(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 4000);
  }

  afficherErreur(message: string): void {
    this.erreurMessage = message;
    setTimeout(() => this.erreurMessage = '', 5000);
  }

  fermerSuccess(): void {
    this.successMessage = '';
  }

  // helpers template
  formatMontant(val: number): string {
    return new Intl.NumberFormat('fr-FR').format(val);
  }
}