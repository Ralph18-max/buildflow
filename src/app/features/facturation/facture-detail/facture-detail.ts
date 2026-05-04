import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface Paiement {
  id: number;
  date: string;
  montant: string;
  mode: string;
  reference: string;
}

interface SituationLiee {
  id: number;
  numero: number;
  periode: string;
  montant_periode: string;
  avancement: number;
  statut: string;
}

interface Facture {
  id: number;
  numero: string;
  client: string;
  chantier: string;
  chantier_id: number;
  contrat: string;
  contrat_id: number;
  montant_ht: string;
  montant_ttc: string;
  tva: number;
  date_emission: string;
  date_echeance: string;
  date_paiement?: string;
  statut: string;
  nb_situations: number;
  objet: string;
  conditions: string;
}

@Component({
  selector: 'app-facture-detail',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './facture-detail.html',
  styleUrl: './facture-detail.scss'
})
export class FactureDetail implements OnInit {

  activeTab = 'infos';
  facture: Facture | null = null;

  factures: Facture[] = [
    {
      id: 1,
      numero: 'FAC-2024-001',
      client: 'SCI Les Palmiers',
      chantier: 'Résidence Les Palmiers',
      chantier_id: 1,
      contrat: 'MRC-2024-001',
      contrat_id: 1,
      montant_ht: '120 000 000',
      montant_ttc: '141 600 000',
      tva: 18,
      date_emission: '01/06/2024',
      date_echeance: '01/07/2024',
      date_paiement: '28/06/2024',
      statut: 'payee',
      nb_situations: 1,
      objet: 'Situation de travaux N°1 — Mars à Mai 2024',
      conditions: 'Paiement à 30 jours à compter de la date d\'émission'
    },
    {
      id: 2,
      numero: 'FAC-2024-002',
      client: 'SCI Les Palmiers',
      chantier: 'Résidence Les Palmiers',
      chantier_id: 1,
      contrat: 'MRC-2024-001',
      contrat_id: 1,
      montant_ht: '160 000 000',
      montant_ttc: '188 800 000',
      tva: 18,
      date_emission: '01/09/2024',
      date_echeance: '01/10/2024',
      date_paiement: '25/09/2024',
      statut: 'payee',
      nb_situations: 1,
      objet: 'Situation de travaux N°2 — Juin à Août 2024',
      conditions: 'Paiement à 30 jours à compter de la date d\'émission'
    },
    {
      id: 3,
      numero: 'FAC-2025-001',
      client: 'SCI Les Palmiers',
      chantier: 'Résidence Les Palmiers',
      chantier_id: 1,
      contrat: 'MRC-2024-001',
      contrat_id: 1,
      montant_ht: '220 000 000',
      montant_ttc: '259 600 000',
      tva: 18,
      date_emission: '02/01/2025',
      date_echeance: '02/02/2025',
      statut: 'en_retard',
      nb_situations: 1,
      objet: 'Situation de travaux N°3 — Sep à Déc 2024',
      conditions: 'Paiement à 30 jours à compter de la date d\'émission'
    },
    {
      id: 4,
      numero: 'FAC-2024-003',
      client: 'Konan Yves',
      chantier: 'Villa Duplex Riviera',
      chantier_id: 2,
      contrat: 'MRC-2024-002',
      contrat_id: 2,
      montant_ht: '180 000 000',
      montant_ttc: '212 400 000',
      tva: 18,
      date_emission: '20/04/2025',
      date_echeance: '20/05/2025',
      date_paiement: '15/05/2025',
      statut: 'payee',
      nb_situations: 5,
      objet: 'Décompte général et définitif — Toutes situations',
      conditions: 'Paiement à 30 jours à compter de la date d\'émission'
    },
    {
      id: 5,
      numero: 'FAC-2025-002',
      client: 'Groupe Immobilier du Sud',
      chantier: 'Complexe Commercial Marcory',
      chantier_id: 3,
      contrat: 'MRC-2025-001',
      contrat_id: 3,
      montant_ht: '95 000 000',
      montant_ttc: '112 100 000',
      tva: 18,
      date_emission: '15/06/2025',
      date_echeance: '15/07/2025',
      statut: 'emise',
      nb_situations: 1,
      objet: 'Situation de travaux N°1 — Mars à Mai 2025',
      conditions: 'Paiement à 30 jours à compter de la date d\'émission'
    },
  ];

  situationsLiees: SituationLiee[] = [
    {
      id: 1, numero: 1,
      periode: 'Mars — Mai 2024',
      montant_periode: '120 000 000',
      avancement: 15,
      statut: 'payee'
    }
  ];

  paiements: Paiement[] = [
    {
      id: 1,
      date: '28/06/2024',
      montant: '141 600 000',
      mode: 'Virement bancaire',
      reference: 'VIR-20240628-001'
    }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.facture = this.factures.find(f => f.id === id) || null;
    if (this.facture?.statut !== 'payee') {
      this.paiements = [];
    }
  }

  retour() { this.router.navigate(['/facturation']); }
  voirChantier() { if (this.facture) this.router.navigate(['/chantiers', this.facture.chantier_id]); }
  voirContrat() { if (this.facture) this.router.navigate(['/contrats', this.facture.contrat_id]); }

  getMontantTVA(): string {
  if (!this.facture) return '0';
  const ttc = parseInt(this.facture.montant_ttc.replace(/\s/g, ''), 10);
  const ht = parseInt(this.facture.montant_ht.replace(/\s/g, ''), 10);
  return (ttc - ht).toLocaleString();
}

  getStatutLabel(statut: string): string {
    const labels: any = {
      emise: 'Émise', payee: 'Payée',
      en_retard: 'En retard', annulee: 'Annulée',
      validee: 'Validée'
    };
    return labels[statut] || statut;
  }
}