import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface Avenant {
  id: number;
  numero: number;
  date: string;
  objet: string;
  montant_supplementaire: number;
  delai_supplementaire: number;
  statut: 'approuve' | 'en_attente' | 'refuse';
}

interface Situation {
  id: number;
  numero: number;
  periode: string;
  date_emission: string;
  avancement_facture: number;
  montant_periode: number;
  montant_cumule: number;
  montant_encaisse: number;
  statut: 'payee' | 'validee' | 'en_attente' | 'contestee';
}

interface Contrat {
  id: number;
  numero_marche: string;
  type_construction: string;
  statut: 'en_cours' | 'signe' | 'cloture' | 'resilie' | 'en_negociation';
  // Parties contractantes
  client_nom: string;
  client_type: 'particulier' | 'societe';
  client_telephone: string;
  client_email: string;
  client_adresse: string;
  entreprise_nom: string;
  conducteur_travaux: string;
  // Financier
  montant_s0: number;
  montant_marche: number;
  penalites_retard: number;
  retenue_garantie: number;
  // Délais
  date_signature: string;
  date_demarrage_prevue: string;
  date_livraison_prevue: string;
  date_demarrage_reelle?: string;
  date_livraison_reelle?: string;
  // Chantier associé
  chantier_id: number;
  chantier_nom: string;
  chantier_avancement: number;
  chantier_statut: string;
  // Relations
  avenants: Avenant[];
  situations: Situation[];
}

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './contrat-detail.html',
  styleUrl: './contrat-detail.scss'
})
export class ContratDetail implements OnInit {

  activeTab = 'informations';
  contrat: Contrat | null = null;

  private contrats: Contrat[] = [
    {
      id: 1,
      numero_marche: 'MRC-2024-001',
      type_construction: 'Immeuble résidentiel R+4',
      statut: 'en_cours',
      client_nom: 'SCI Les Palmiers',
      client_type: 'societe',
      client_telephone: '+225 27 22 41 00',
      client_email: 'direction@sci-lespalmiers.ci',
      client_adresse: 'Avenue Chardy, Plateau, Abidjan',
      entreprise_nom: 'BuildDFlow Construction SA',
      conducteur_travaux: 'Koné Jean-Baptiste',
      montant_s0: 380000000,
      montant_marche: 485000000,
      penalites_retard: 500000,
      retenue_garantie: 5,
      date_signature: '15/02/2024',
      date_demarrage_prevue: '01/03/2024',
      date_livraison_prevue: '28/02/2026',
      date_demarrage_reelle: '01/03/2024',
      chantier_id: 1,
      chantier_nom: 'Résidence Les Palmiers',
      chantier_avancement: 72,
      chantier_statut: 'en_cours',
      avenants: [
        {
          id: 1, numero: 1,
          date: '10/06/2024',
          objet: 'Ajout d\'un local technique au sous-sol',
          montant_supplementaire: 8500000,
          delai_supplementaire: 15,
          statut: 'approuve'
        },
        {
          id: 2, numero: 2,
          date: '20/09/2024',
          objet: 'Modification façade — passage au bardage aluminium',
          montant_supplementaire: 12000000,
          delai_supplementaire: 0,
          statut: 'approuve'
        },
        {
          id: 3, numero: 3,
          date: '05/01/2025',
          objet: 'Ajout système de climatisation centrale',
          montant_supplementaire: 18500000,
          delai_supplementaire: 10,
          statut: 'en_attente'
        }
      ],
      situations: [
        { id: 1, numero: 1, periode: 'Mars – Mai 2024', date_emission: '31/05/2024', avancement_facture: 10, montant_periode: 48500000, montant_cumule: 48500000, montant_encaisse: 48500000, statut: 'payee' },
        { id: 2, numero: 2, periode: 'Juin – Août 2024', date_emission: '31/08/2024', avancement_facture: 25, montant_periode: 72750000, montant_cumule: 121250000, montant_encaisse: 72750000, statut: 'payee' },
        { id: 3, numero: 3, periode: 'Sep – Nov 2024', date_emission: '30/11/2024', avancement_facture: 45, montant_periode: 97200000, montant_cumule: 218450000, montant_encaisse: 97200000, statut: 'payee' },
        { id: 4, numero: 4, periode: 'Déc 2024 – Jan 2025', date_emission: '31/01/2025', avancement_facture: 69, montant_periode: 116400000, montant_cumule: 334850000, montant_encaisse: 58200000, statut: 'en_attente' },
      ]
    },
    {
      id: 2,
      numero_marche: 'MRC-2024-002',
      type_construction: 'Villa individuelle R+1',
      statut: 'cloture',
      client_nom: 'Konan Yves',
      client_type: 'particulier',
      client_telephone: '+225 07 45 23 11',
      client_email: 'yves.konan@gmail.com',
      client_adresse: 'Riviera 3, Cocody, Abidjan',
      entreprise_nom: 'BuildDFlow Construction SA',
      conducteur_travaux: 'Assi Kouadio Pierre',
      montant_s0: 145000000,
      montant_marche: 185000000,
      penalites_retard: 200000,
      retenue_garantie: 5,
      date_signature: '10/04/2023',
      date_demarrage_prevue: '01/06/2023',
      date_livraison_prevue: '31/05/2024',
      date_demarrage_reelle: '01/06/2023',
      date_livraison_reelle: '15/06/2024',
      chantier_id: 2,
      chantier_nom: 'Villa Duplex Riviera',
      chantier_avancement: 100,
      chantier_statut: 'termine',
      avenants: [
        {
          id: 4, numero: 1,
          date: '15/09/2023',
          objet: 'Ajout piscine et local technique',
          montant_supplementaire: 22000000,
          delai_supplementaire: 20,
          statut: 'approuve'
        }
      ],
      situations: [
        { id: 5, numero: 1, periode: 'Juin – Sep 2023', date_emission: '30/09/2023', avancement_facture: 20, montant_periode: 37000000, montant_cumule: 37000000, montant_encaisse: 37000000, statut: 'payee' },
        { id: 6, numero: 2, periode: 'Oct 2023 – Jan 2024', date_emission: '31/01/2024', avancement_facture: 60, montant_periode: 74000000, montant_cumule: 111000000, montant_encaisse: 74000000, statut: 'payee' },
        { id: 7, numero: 3, periode: 'Fév – Juin 2024', date_emission: '15/06/2024', avancement_facture: 100, montant_periode: 74000000, montant_cumule: 185000000, montant_encaisse: 74000000, statut: 'payee' },
      ]
    },
    {
      id: 3,
      numero_marche: 'MRC-2025-001',
      type_construction: 'Complexe commercial R+3',
      statut: 'en_cours',
      client_nom: 'Groupe Immobilier du Sud',
      client_type: 'societe',
      client_telephone: '+225 27 21 55 00',
      client_email: 'projets@gis-ci.com',
      client_adresse: 'Zone Industrielle, Marcory, Abidjan',
      entreprise_nom: 'BuildDFlow Construction SA',
      conducteur_travaux: 'Koné Ibrahim',
      montant_s0: 950000000,
      montant_marche: 1200000000,
      penalites_retard: 1200000,
      retenue_garantie: 5,
      date_signature: '15/01/2025',
      date_demarrage_prevue: '01/03/2025',
      date_livraison_prevue: '28/02/2027',
      date_demarrage_reelle: '01/03/2025',
      chantier_id: 3,
      chantier_nom: 'Complexe Commercial Marcory',
      chantier_avancement: 18,
      chantier_statut: 'en_cours',
      avenants: [],
      situations: [
        { id: 8, numero: 1, periode: 'Mars – Mai 2025', date_emission: '31/05/2025', avancement_facture: 10, montant_periode: 120000000, montant_cumule: 120000000, montant_encaisse: 120000000, statut: 'payee' },
        { id: 9, numero: 2, periode: 'Juin – Juil 2025', date_emission: '31/07/2025', avancement_facture: 18, montant_periode: 96000000, montant_cumule: 216000000, montant_encaisse: 0, statut: 'en_attente' },
      ]
    },
    {
      id: 4,
      numero_marche: 'MRC-2025-002',
      type_construction: 'Maison individuelle plain-pied',
      statut: 'signe',
      client_nom: 'Diabaté Moussa',
      client_type: 'particulier',
      client_telephone: '+225 05 77 88 99',
      client_email: 'moussa.diabate@yahoo.fr',
      client_adresse: 'Yopougon Selmer, Abidjan',
      entreprise_nom: 'BuildDFlow Construction SA',
      conducteur_travaux: 'Non assigné',
      montant_s0: 72000000,
      montant_marche: 95000000,
      penalites_retard: 100000,
      retenue_garantie: 5,
      date_signature: '01/07/2025',
      date_demarrage_prevue: '01/08/2025',
      date_livraison_prevue: '31/07/2026',
      chantier_id: 4,
      chantier_nom: 'Maison Individuelle Yopougon',
      chantier_avancement: 5,
      chantier_statut: 'en_cours',
      avenants: [],
      situations: []
    }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.contrat = this.contrats.find(c => c.id === id) || null;
  }

  retour() {
    this.router.navigate(['/contrats']);
  }

  voirChantier() {
    if (this.contrat) {
      this.router.navigate(['/chantiers', this.contrat.chantier_id]);
    }
  }

  // ─── LABELS ──────────────────────────────────────────
  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_cours: 'En cours', signe: 'Signé', cloture: 'Clôturé',
      resilie: 'Résilié', en_negociation: 'En négociation',
      approuve: 'Approuvé', en_attente: 'En attente', refuse: 'Refusé',
      payee: 'Payée', validee: 'Validée', contestee: 'Contestée',
      termine: 'Terminé', suspendu: 'Suspendu'
    };
    return labels[statut] || statut;
  }

  // ─── CALCULS ─────────────────────────────────────────
  get montantMarcheRevise(): number {
    if (!this.contrat) return 0;
    const totalAvenants = this.contrat.avenants
      .filter(a => a.statut === 'approuve')
      .reduce((s, a) => s + a.montant_supplementaire, 0);
    return this.contrat.montant_s0 + totalAvenants;
  }

  get totalEncaisse(): number {
    if (!this.contrat) return 0;
    return this.contrat.situations.reduce((s, sit) => s + sit.montant_encaisse, 0);
  }

  get totalFacture(): number {
    if (!this.contrat) return 0;
    return this.contrat.situations.reduce((s, sit) => s + sit.montant_periode, 0);
  }

  get raf(): number {
    if (!this.contrat) return 0;
    return this.contrat.montant_marche - this.totalFacture;
  }

  get totalDelaiAvenants(): number {
    if (!this.contrat) return 0;
    return this.contrat.avenants
      .filter(a => a.statut === 'approuve')
      .reduce((s, a) => s + a.delai_supplementaire, 0);
  }

  get nbAvenantsApprouves(): number {
    if (!this.contrat) return 0;
    return this.contrat.avenants.filter(a => a.statut === 'approuve').length;
  }

  getAvancementColor(avancement: number): string {
    if (avancement >= 80) return '#48bb78';
    if (avancement >= 40) return '#E8520A';
    return '#e53e3e';
  }

  formatFCFA(montant: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }
}