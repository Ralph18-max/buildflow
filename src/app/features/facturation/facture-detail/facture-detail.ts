import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { FactureService } from '../../../core/services/facture.service';
import { Facture, PaiementHistorique, SituationTravaux } from '../../../core/models';
import { ContratService } from '../../../core/services/contrat.service';
import { environment } from '../../../../environments/environment';
import { DigitsOnlyDirective } from '../../../core/directives/digits-only.directive';

@Component({
  selector: 'app-facture-detail',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DigitsOnlyDirective],
  templateUrl: './facture-detail.html',
  styleUrl: './facture-detail.scss'
})
export class FactureDetail implements OnInit, OnDestroy {

  activeTab = 'infos';
  facture: Facture | null = null;
  situationsLiees: SituationTravaux[] = [];
  paiements: PaiementHistorique[] = [];

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private factureService: FactureService,
    private contratService: ContratService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.subs.add(
      this.factureService.getById(id).subscribe(facture => {
        if (!facture) { this.facture = null; return; }
        this.facture = facture;
        this.paiements = facture.historique_paiements || [];

        // Charge les situations liées depuis le contrat
        if (facture.id_contrat) {
          this.subs.add(
            this.contratService.getSituations(facture.id_contrat).subscribe(situations => {
              this.situationsLiees = situations.filter(s =>
                facture.situations_liees.includes(s.id)
              );
            })
          );
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Navigation ────────────────────────────────────────

  retour(): void { this.router.navigate(['/facturation']); }

  voirChantier(): void {
    if (this.facture) this.router.navigate(['/chantiers', this.facture.id_chantier]);
  }

  voirContrat(): void {
    if (this.facture) this.router.navigate(['/contrats', this.facture.id_contrat]);
  }

  // ── Calculs ───────────────────────────────────────────

  getMontantTVA(): number {
    if (!this.facture) return 0;
    return this.facture.montant_ttc - this.facture.montant_ht;
  }

  // ── Affichage ─────────────────────────────────────────

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      emise: 'Émise', payee: 'Payée',
      en_retard: 'En retard', annulee: 'Annulée',
      validee: 'Validée', en_attente: 'En attente'
    };
    return labels[statut] || statut;
  }

  formatFCFA(montant: number): string {
    if (!montant) return '0';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  // ── Modal : enregistrer un paiement ──────────────────────────────────────

  showModalPaiement = false;
  successPaiement = false;
  formPaiement = { montant: 0, mode: 'Virement', reference: '' };

  ouvrirModalPaiement(): void {
    this.formPaiement = { montant: this.facture?.reste_a_payer || 0, mode: 'Virement', reference: '' };
    this.showModalPaiement = true;
    this.successPaiement = false;
  }

  fermerModalPaiement(): void { this.showModalPaiement = false; }

  validerPaiement(): void {
    if (!this.facture || !this.formPaiement.montant) return;
    const today = new Date().toISOString().split('T')[0];
    this.http.post<any>(`${environment.apiUrl}/facturation/encaissements`, {
      id_situation:   this.facture.id,
      montant:        this.formPaiement.montant,
      date_paiement:  today,
      mode_paiement:  this.formPaiement.mode,
      reference:      this.formPaiement.reference || '',
    }).subscribe({
      next: () => {
        const nouvPaiement: PaiementHistorique = {
          date:      today,
          montant:   this.formPaiement.montant,
          mode:      this.formPaiement.mode,
          reference: this.formPaiement.reference || '—',
        };
        this.paiements = [...this.paiements, nouvPaiement];
        const totalEncaisse = this.paiements.reduce((s, p) => s + p.montant, 0);
        this.facture = {
          ...this.facture!,
          montant_encaisse: totalEncaisse,
          reste_a_payer: Math.max(0, this.facture!.montant_ttc - totalEncaisse),
          statut: totalEncaisse >= this.facture!.montant_ttc ? 'payee' : this.facture!.statut,
        };
        this.successPaiement = true;
        setTimeout(() => { this.showModalPaiement = false; this.successPaiement = false; }, 1500);
      },
      error: () => alert('Erreur lors de l\'enregistrement du paiement'),
    });
  }
}