import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CanPipe } from '../../core/pipes/can.pipe';
import { FactureService } from '../../core/services/facture.service';
import { ChantierService } from '../../core/services/chantier.service';
import { Facture } from '../../core/models';

@Component({
  selector: 'app-facturation-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, CanPipe, DecimalPipe],
  templateUrl: './facturation-list.html',
  styleUrl: './facturation-list.scss'
})
export class FacturationList implements OnInit, OnDestroy {

  activeTab = 'tous';
  searchQuery = '';
  factures: Facture[] = [];

  // ── Modal création facture ──────────────────
  showModal    = false;
  successModal = false;
  formFacture  = {
    id_chantier: 0,
    montant_ht:  0,
    tva:         18,
    date_echeance: '',
  };

  chantiers: { id: number; nom: string }[] = [];

  private subs = new Subscription();

  constructor(
    private router: Router,
    private factureService: FactureService,
    private chantierService: ChantierService,
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.factureService.getAll().subscribe(factures => {
        this.factures = factures;
      })
    );
    this.subs.add(
      this.chantierService.getEnCours().subscribe(list => {
        this.chantiers = list.map(c => ({ id: c.id, nom: c.nom_chantier }));
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Filtrage ──────────────────────────────────────────

  get filteredFactures(): Facture[] {
    let list = this.factures;
    if (this.activeTab !== 'tous') {
      list = list.filter(f => f.statut === this.activeTab);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(f =>
        f.numero.toLowerCase().includes(q) ||
        f.nom_client.toLowerCase().includes(q) ||
        f.nom_chantier.toLowerCase().includes(q)
      );
    }
    return list;
  }

  // ── Navigation ────────────────────────────────────────

  voirFacture(id: number): void {
    this.router.navigate(['/facturation', id]);
  }

  // ── Calculs KPI ───────────────────────────────────────

  getTotalEncaisse(): number {
    return this.factures
      .filter(f => f.statut === 'payee')
      .reduce((s, f) => s + f.montant_encaisse, 0);
  }

  getTotalEnAttente(): number {
    return this.factures
      .filter(f => f.statut !== 'payee')
      .reduce((s, f) => s + f.reste_a_payer, 0);
  }

  getCountRetard(): number {
    return this.factures.filter(f => f.statut === 'en_retard').length;
  }

  getEncaisseClass(f: Facture): string {
    if (f.montant_encaisse < 0.01) return 'zero';
    if (f.montant_encaisse >= f.montant_ttc - 0.01) return 'full';
    return 'partial';
  }

  // ── Affichage ─────────────────────────────────────────

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      payee: 'Payée', en_retard: 'En retard',
      emise: 'Émise', en_attente: 'En attente', validee: 'Validée'
    };
    return labels[statut] || statut;
  }

  formatMontant(n: number): string {
    if (!n) return '0';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' Mds';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + ' M';
    return new Intl.NumberFormat('fr-FR').format(n);
  }

  openModal(): void {
    this.formFacture = { id_chantier: this.chantiers[0]?.id || 0, montant_ht: 0, tva: 18, date_echeance: '' };
    this.showModal    = true;
    this.successModal = false;
  }

  fermerModal(): void { this.showModal = false; }

  get montantTTC(): number {
    return Math.round(this.formFacture.montant_ht * (1 + this.formFacture.tva / 100));
  }

  validerFacture(): void {
    if (!this.formFacture.montant_ht || !this.formFacture.id_chantier) return;
    this.factureService.creerSituation({
      id_chantier:       Number(this.formFacture.id_chantier),
      montant_ht:        this.formFacture.montant_ht,
      taux_tva:          this.formFacture.tva,
      avancement_facture: 0,
    }).subscribe({
      next: (nouvelle) => {
        this.factures = [nouvelle, ...this.factures];
        this.successModal = true;
        setTimeout(() => { this.showModal = false; this.successModal = false; }, 1500);
      },
      error: () => alert('Erreur lors de la création de la situation'),
    });
  }
}