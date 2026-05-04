import { Component } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CanPipe } from '../../core/pipes/can.pipe';

interface Facture {
  id: number;
  numero: string;
  sit_ref?: string;
  client: string;
  chantier: string;
  type: 'situation' | 'finale' | 'acompte';
  montant_ttc: string;
  encaisse: string;
  encaisse_raw: number;
  montant_raw: number;
  date_echeance: string;
  statut: 'payee' | 'en_retard' | 'emise' | 'en_attente';
}

@Component({
  selector: 'app-facturation-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, CanPipe],
  templateUrl: './facturation-list.html',
  styleUrl: './facturation-list.scss'
})
export class FacturationList {

  activeTab = 'tous';
  searchQuery = '';

  factures: Facture[] = [
    {
      id: 1, numero: 'FAC-2024-001', sit_ref: 'Sit. n°1',
      client: 'SCI Les Palmiers', chantier: 'Résidence Les Palmiers',
      type: 'situation', montant_ttc: '141 600 000', encaisse: '141 600 000',
      montant_raw: 141600000, encaisse_raw: 141600000,
      date_echeance: '15/07/2024', statut: 'payee'
    },
    {
      id: 2, numero: 'FAC-2024-002', sit_ref: 'Sit. n°2',
      client: 'SCI Les Palmiers', chantier: 'Résidence Les Palmiers',
      type: 'situation', montant_ttc: '188 800 000', encaisse: '188 800 000',
      montant_raw: 188800000, encaisse_raw: 188800000,
      date_echeance: '20/10/2024', statut: 'payee'
    },
    {
      id: 3, numero: 'FAC-2025-001', sit_ref: 'Sit. n°3',
      client: 'SCI Les Palmiers', chantier: 'Résidence Les Palmiers',
      type: 'situation', montant_ttc: '259 600 000', encaisse: '0',
      montant_raw: 259600000, encaisse_raw: 0,
      date_echeance: '10/03/2025', statut: 'en_retard'
    },
    {
      id: 4, numero: 'FAC-2024-003',
      client: 'Konan Yves', chantier: 'Villa Duplex Riviera',
      type: 'finale', montant_ttc: '212 400 000', encaisse: '212 400 000',
      montant_raw: 212400000, encaisse_raw: 212400000,
      date_echeance: '31/12/2024', statut: 'payee'
    },
    {
      id: 5, numero: 'FAC-2025-002', sit_ref: 'Sit. n°1',
      client: 'Groupe Immobilier du Sud', chantier: 'Complexe Commercial Marcory',
      type: 'situation', montant_ttc: '112 100 000', encaisse: '0',
      montant_raw: 112100000, encaisse_raw: 0,
      date_echeance: '05/05/2025', statut: 'emise'
    },
  ];

  constructor(private router: Router) {}

  get filteredFactures(): Facture[] {
    let list = this.factures;
    if (this.activeTab !== 'tous') list = list.filter(f => f.statut === this.activeTab);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(f =>
        f.numero.toLowerCase().includes(q) ||
        f.client.toLowerCase().includes(q) ||
        f.chantier.toLowerCase().includes(q)
      );
    }
    return list;
  }

  voirFacture(id: number) { this.router.navigate(['/facturation', id]); }

  getTypeLabel(type: string): string {
    return { situation: 'Situation', finale: 'Facture finale', acompte: 'Acompte' }[type] || type;
  }

  getStatutLabel(statut: string): string {
    return { payee: 'Payée', en_retard: 'En retard', emise: 'Émise', en_attente: 'En attente' }[statut] || statut;
  }

  getEncaisseClass(f: Facture): string {
    if (f.encaisse_raw === 0) return 'zero';
    if (f.encaisse_raw >= f.montant_raw) return 'full';
    return 'partial';
  }

  getTotalEncaisse(): number {
    return this.factures.reduce((s, f) => s + f.encaisse_raw, 0);
  }

  getTotalEnAttente(): number {
    return this.factures
      .filter(f => f.statut !== 'payee')
      .reduce((s, f) => s + (f.montant_raw - f.encaisse_raw), 0);
  }

  getCountRetard(): number { return this.factures.filter(f => f.statut === 'en_retard').length; }

  formatMontant(n: number): string {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' Mds';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + ' M';
    return new Intl.NumberFormat('fr-FR').format(n);
  }

  openModal() {}
}