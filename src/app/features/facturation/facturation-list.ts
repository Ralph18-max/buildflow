import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CanPipe } from '../../core/pipes/can.pipe';
import { FactureService } from '../../core/services/facture.service';
import { ChantierService } from '../../core/services/chantier.service';
import { Facture } from '../../core/models';
import { DigitsOnlyDirective } from '../../core/directives/digits-only.directive';

@Component({
  selector: 'app-facturation-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, CanPipe, DecimalPipe, DigitsOnlyDirective],
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
    delai_paiement_jours: 30,
  };

  chantiers: { id: number; nom: string }[] = [];

  private subs = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
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

        // Arrivée depuis la fiche contrat avec un chantier pré-sélectionné
        const params = this.route.snapshot.queryParamMap;
        if (params.get('action') === 'nouvelle') {
          const idChantier = Number(params.get('chantier'));
          this.openModal();
          if (idChantier && this.chantiers.some(c => c.id === idChantier)) {
            this.formFacture.id_chantier = idChantier;
          }
        }
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
    this.formFacture = { id_chantier: this.chantiers[0]?.id || 0, montant_ht: 0, tva: 18, delai_paiement_jours: 30 };
    this.showModal    = true;
    this.successModal = false;
  }

  fermerModal(): void { this.showModal = false; }

  get montantTTC(): number {
    return Math.round(this.formFacture.montant_ht * (1 + this.formFacture.tva / 100));
  }

  erreurFacture = '';

  validerFacture(): void {
    this.erreurFacture = '';
    if (!this.formFacture.id_chantier) { this.erreurFacture = 'Veuillez sélectionner un chantier.'; return; }
    if (!this.formFacture.montant_ht || this.formFacture.montant_ht <= 0) { this.erreurFacture = 'Le montant HT doit être supérieur à 0.'; return; }
    if (this.formFacture.tva < 0 || this.formFacture.tva > 100) { this.erreurFacture = 'La TVA doit être comprise entre 0 et 100.'; return; }
    if (!this.formFacture.delai_paiement_jours || this.formFacture.delai_paiement_jours <= 0) { this.erreurFacture = 'Le délai de paiement doit être supérieur à 0.'; return; }
    this.factureService.creerSituation({
      id_chantier:       Number(this.formFacture.id_chantier),
      montant_ht:        this.formFacture.montant_ht,
      taux_tva:          this.formFacture.tva,
      avancement_facture: 0,
      delai_paiement_jours: Number(this.formFacture.delai_paiement_jours),
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