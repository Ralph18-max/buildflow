import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PermissionService } from '../../../core/services/permission.service';

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

// ─── Données simulées ─────────────────────────────────────────────────────────

const SITUATIONS_DATA: Situation[] = [
  {
    id: 1, numero: 'SIT-2024-001', chantier: 'Résidence Les Palmiers', chantierId: 1,
    client: 'SCI Les Palmiers', dateEmission: '2024-03-15', dateEcheance: '2024-04-14',
    avancement: 30, montantHT: 120_000_000, montantTTC: 141_600_000,
    montantEncaisse: 141_600_000, statut: 'payee', referenceVirement: 'VIR-2024-0312'
  },
  {
    id: 2, numero: 'SIT-2024-002', chantier: 'Résidence Les Palmiers', chantierId: 1,
    client: 'SCI Les Palmiers', dateEmission: '2024-06-20', dateEcheance: '2024-07-20',
    avancement: 60, montantHT: 160_000_000, montantTTC: 188_800_000,
    montantEncaisse: 188_800_000, statut: 'payee', referenceVirement: 'VIR-2024-0615'
  },
  {
    id: 3, numero: 'SIT-2025-001', chantier: 'Résidence Les Palmiers', chantierId: 1,
    client: 'SCI Les Palmiers', dateEmission: '2025-01-10', dateEcheance: '2025-02-10',
    avancement: 72, montantHT: 220_000_000, montantTTC: 259_600_000,
    montantEncaisse: 0, statut: 'en_retard'
  },
  {
    id: 4, numero: 'SIT-2024-003', chantier: 'Villa Duplex Riviera', chantierId: 2,
    client: 'Konan Yves', dateEmission: '2024-09-05', dateEcheance: '2024-10-05',
    avancement: 100, montantHT: 180_000_000, montantTTC: 212_400_000,
    montantEncaisse: 212_400_000, statut: 'payee', referenceVirement: 'VIR-2024-0901'
  },
  {
    id: 5, numero: 'SIT-2025-002', chantier: 'Complexe Commercial Marcory', chantierId: 3,
    client: 'Groupe Immobilier du Sud', dateEmission: '2025-02-28', dateEcheance: '2025-03-30',
    avancement: 18, montantHT: 95_000_000, montantTTC: 112_100_000,
    montantEncaisse: 0, statut: 'emise'
  },
];

const FACTURES_ST_DATA: FactureST[] = [
  {
    id: 1, numero: 'FST-2024-001', chantier: 'Résidence Les Palmiers', chantierId: 1,
    intervenant: 'ELEC PLUS CI', corps_etat: 'Électricité',
    dateFacture: '2024-05-10', dateReception: '2024-05-12',
    montantHT: 28_000_000, montantTVA: 5_040_000, montantTTC: 33_040_000,
    statut: 'validee'
  },
  {
    id: 2, numero: 'FST-2024-002', chantier: 'Résidence Les Palmiers', chantierId: 1,
    intervenant: 'MAÇON EXPERT SARL', corps_etat: 'Gros œuvre',
    dateFacture: '2024-07-15', dateReception: '2024-07-16',
    montantHT: 65_000_000, montantTVA: 11_700_000, montantTTC: 76_700_000,
    statut: 'validee'
  },
  {
    id: 3, numero: 'FST-2025-001', chantier: 'Complexe Commercial Marcory', chantierId: 3,
    intervenant: 'TERRAS AFRIQUE', corps_etat: 'Terrassement',
    dateFacture: '2025-01-20', dateReception: '2025-01-22',
    montantHT: 18_500_000, montantTVA: 3_330_000, montantTTC: 21_830_000,
    statut: 'en_attente'
  },
  {
    id: 4, numero: 'FST-2025-002', chantier: 'Maison Individuelle Yopougon', chantierId: 4,
    intervenant: 'PLOMBERIE ABIDJAN PRO', corps_etat: 'Plomberie',
    dateFacture: '2025-03-05', dateReception: '2025-03-07',
    montantHT: 9_200_000, montantTVA: 1_656_000, montantTTC: 10_856_000,
    statut: 'contestee'
  },
];

const BILANS_DATA: BilanChantier[] = [
  {
    id: 1, nom: 'Résidence Les Palmiers', client: 'SCI Les Palmiers',
    statut: 'en_cours', statut_bilan: 'en_cours', avancement: 72,
    montantMarche: 850_000_000, totalEncaisse: 330_400_000,
    coutReel: 285_000_000, raf: 259_600_000, rad: 115_000_000,
    marge: 45_400_000, depassement: false
  },
  {
    id: 2, nom: 'Villa Duplex Riviera', client: 'Konan Yves',
    statut: 'termine', statut_bilan: 'bilan_valide', avancement: 100,
    montantMarche: 280_000_000, totalEncaisse: 212_400_000,
    coutReel: 198_000_000, raf: 67_600_000, rad: 0,
    marge: 14_400_000, depassement: false
  },
  {
    id: 3, nom: 'Complexe Commercial Marcory', client: 'Groupe Immobilier du Sud',
    statut: 'en_cours', statut_bilan: 'en_cours', avancement: 18,
    montantMarche: 1_200_000_000, totalEncaisse: 0,
    coutReel: 98_500_000, raf: 1_087_900_000, rad: 301_500_000,
    marge: -98_500_000, depassement: true
  },
  {
    id: 4, nom: 'Maison Individuelle Yopougon', client: 'Diabaté Moussa',
    statut: 'en_cours', statut_bilan: 'en_cours', avancement: 5,
    montantMarche: 95_000_000, totalEncaisse: 0,
    coutReel: 8_200_000, raf: 95_000_000, rad: 51_800_000,
    marge: -8_200_000, depassement: false
  },
];

// ─── Composant ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-comptabilite',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DecimalPipe, DatePipe, FormsModule],
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

  // Données
  situations: Situation[] = [...SITUATIONS_DATA];
  facturesST: FactureST[] = [...FACTURES_ST_DATA];
  bilans: BilanChantier[] = [...BILANS_DATA];

  // Chantiers pour les selects
  chantiers = [
    { id: 1, nom: 'Résidence Les Palmiers' },
    { id: 2, nom: 'Villa Duplex Riviera' },
    { id: 3, nom: 'Complexe Commercial Marcory' },
    { id: 4, nom: 'Maison Individuelle Yopougon' },
  ];

  corpsEtat = [
    'Terrassement', 'Gros œuvre', 'Charpente', 'Étanchéité',
    'Plomberie', 'Électricité', 'Menuiserie', 'Carrelage', 'Peinture', 'Autre'
  ];

  constructor(
    private perms: PermissionService,
    private router: Router
  ) {}

  ngOnInit(): void {}

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
  }

  validerEncaissement(): void {
    if (!this.modalEncaissement.situationId || !this.modalEncaissement.montant) return;

    const sit = this.situations.find(s => s.id === this.modalEncaissement.situationId);
    if (sit) {
      sit.statut = 'payee';
      sit.montantEncaisse = this.modalEncaissement.montant;
      sit.referenceVirement = this.modalEncaissement.reference;
    }

    this.fermerModalEncaissement();
    this.afficherSucces('Encaissement enregistré avec succès');
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
    if (!this.modalFactureST.chantierId || !this.modalFactureST.montantHT) return;

    const chantier = this.chantiers.find(c => c.id === this.modalFactureST.chantierId);
    const nouvelleFacture: FactureST = {
      id: this.facturesST.length + 1,
      numero: `FST-2025-00${this.facturesST.length + 1}`,
      chantier: chantier?.nom || '',
      chantierId: this.modalFactureST.chantierId,
      intervenant: this.modalFactureST.intervenant,
      corps_etat: this.modalFactureST.corps_etat,
      dateFacture: this.modalFactureST.dateFacture,
      dateReception: new Date().toISOString().split('T')[0],
      montantHT: this.modalFactureST.montantHT,
      montantTVA: this.getMontantTVA(),
      montantTTC: this.getMontantTTCModal(),
      statut: 'en_attente'
    };

    this.facturesST.unshift(nouvelleFacture);
    this.fermerModalFactureST();
    this.afficherSucces('Facture sous-traitant enregistrée');
  }

  validerFactureST(facture: FactureST): void {
    facture.statut = 'validee';
    this.afficherSucces('Facture validée');
  }

  // ─── Bilan & Clôture ──────────────────────────────────────────────────────

  get peutValiderBilan(): boolean {
    return this.perms.can('cloture:bilan_valider');
  }

  validerBilan(bilan: BilanChantier): void {
    bilan.statut_bilan = 'bilan_valide';
    this.afficherSucces(`Bilan du chantier "${bilan.nom}" validé. L'administrateur peut maintenant procéder à la clôture.`);
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

  fermerSuccess(): void {
    this.successMessage = '';
  }

  // helpers template
  formatMontant(val: number): string {
    return new Intl.NumberFormat('fr-FR').format(val);
  }
}