import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ContratService } from '../../../core/services/contrat.service';
import { ChantierService } from '../../../core/services/chantier.service';
import { Contrat, Chantier, StatutContrat } from '../../../core/models';
import { CanPipe } from '../../../core/pipes/can.pipe';
import { DigitsOnlyDirective } from '../../../core/directives/digits-only.directive';

@Component({
  selector: 'app-contrat-detail',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, CanPipe, DigitsOnlyDirective],
  templateUrl: './contrat-detail.html',
  styleUrl: './contrat-detail.scss'
})
export class ContratDetail implements OnInit, OnDestroy {

  activeTab = 'informations';
  contrat: Contrat | null = null;
  chantier: Chantier | null = null;

  // ── Modal Modifier ─────────────────────────────────────
  modifierOpen = false;
  formModifier = {
    type_construction: '',
    date_signature: '',
    date_demarrage_prevue: '',
    date_livraison_prevue: '',
    penalites_retard: 0,
    statut: 'en_cours' as StatutContrat,
  };
  erreurModifier = '';
  enregistrementModifier = false;

  // ── Modal Avenant ──────────────────────────────────────
  avenantOpen = false;
  formAvenant = { motif: '', montant_supplementaire: 0, delai_supplementaire: 0 };
  erreurAvenant = '';
  enregistrementAvenant = false;

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contratService: ContratService,
    private chantierService: ChantierService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    const action = this.route.snapshot.queryParamMap.get('action');

    this.subs.add(
      this.contratService.getById(id).subscribe(contrat => {
        if (!contrat) { this.contrat = null; return; }
        this.contrat = contrat;

        if (action === 'modifier') { this.ouvrirModifier(); }
        if (action === 'avenant')  { this.ouvrirAvenant(); }

        // Charge le chantier associé
        if (contrat.id_chantier) {
          this.subs.add(
            this.chantierService.getById(contrat.id_chantier).subscribe(chantier => {
              this.chantier = chantier || null;
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

  retour(): void {
    this.router.navigate(['/contrats']);
  }

  voirChantier(): void {
    if (this.contrat?.id_chantier) {
      this.router.navigate(['/chantiers', this.contrat.id_chantier]);
    }
  }

  // ── Labels ────────────────────────────────────────────

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

  getAvancementColor(avancement: number): string {
    if (avancement >= 80) return '#48bb78';
    if (avancement >= 40) return '#E8520A';
    return '#e53e3e';
  }

  formatFCFA(montant: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  // ── Calculs ───────────────────────────────────────────

  get montantMarcheRevise(): number {
    return this.contrat?.montant_marche_revise || this.contrat?.montant_marche || 0;
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
    return this.montantMarcheRevise - this.totalFacture;
  }

  get totalDelaiAvenants(): number {
    if (!this.contrat) return 0;
    return this.contrat.avenants
      .filter(a => a.statut === 'signe')
      .reduce((s, a) => s + a.delai_jours, 0);
  }

  get nbAvenantsApprouves(): number {
    if (!this.contrat) return 0;
    return this.contrat.avenants.filter(a => a.statut === 'signe').length;
  }

  get chantierAvancement(): number {
    return this.chantier?.avancement_global || 0;
  }

  get chantierStatut(): string {
    return this.chantier?.statut || '—';
  }

  get chantierNom(): string {
    return this.chantier?.nom_chantier || '—';
  }

  // ── Modal Modifier ────────────────────────────────────

  ouvrirModifier(): void {
    if (!this.contrat) return;
    this.formModifier = {
      type_construction:     this.contrat.type_construction,
      date_signature:        this.contrat.date_signature,
      date_demarrage_prevue: this.contrat.date_demarrage_prevue,
      date_livraison_prevue: this.contrat.date_livraison_prevue,
      penalites_retard:      this.contrat.penalites_retard,
      statut:                this.contrat.statut,
    };
    this.erreurModifier = '';
    this.modifierOpen = true;
  }

  fermerModifier(): void { this.modifierOpen = false; }

  sauvegarderModifier(): void {
    this.erreurModifier = '';
    if (!this.contrat) return;
    const f = this.formModifier;
    if (!f.type_construction.trim()) {
      this.erreurModifier = 'Le type de construction est obligatoire.'; return;
    }
    if (!f.date_signature || !f.date_demarrage_prevue || !f.date_livraison_prevue) {
      this.erreurModifier = 'Toutes les dates sont obligatoires.'; return;
    }
    if (f.date_signature > f.date_demarrage_prevue) {
      this.erreurModifier = 'La date de démarrage doit être après la signature.'; return;
    }
    if (f.date_demarrage_prevue >= f.date_livraison_prevue) {
      this.erreurModifier = 'La date de livraison doit être après le démarrage.'; return;
    }
    if (f.penalites_retard < 0) {
      this.erreurModifier = 'Les pénalités ne peuvent pas être négatives.'; return;
    }
    this.enregistrementModifier = true;
    this.contratService.modifier(this.contrat.id, f).subscribe({
      next: contratMaj => {
        Object.assign(this.contrat!, contratMaj);
        this.enregistrementModifier = false;
        this.modifierOpen = false;
      },
      error: () => {
        this.erreurModifier = 'Erreur lors de la mise à jour.';
        this.enregistrementModifier = false;
      },
    });
  }

  // ── Modal Avenant ─────────────────────────────────────

  ouvrirAvenant(): void {
    this.formAvenant = { motif: '', montant_supplementaire: 0, delai_supplementaire: 0 };
    this.erreurAvenant = '';
    this.avenantOpen = true;
  }

  fermerAvenant(): void { this.avenantOpen = false; }

  soumettreAvenant(): void {
    this.erreurAvenant = '';
    if (!this.contrat) return;
    const f = this.formAvenant;
    if (!f.motif.trim()) {
      this.erreurAvenant = "L'objet de l'avenant est obligatoire."; return;
    }
    if (f.montant_supplementaire < 0) {
      this.erreurAvenant = 'Le montant supplémentaire ne peut pas être négatif.'; return;
    }
    if (f.delai_supplementaire < 0) {
      this.erreurAvenant = 'Le délai supplémentaire ne peut pas être négatif.'; return;
    }
    this.enregistrementAvenant = true;
    this.contratService.ajouterAvenant(this.contrat.id, f).subscribe({
      next: avenant => {
        this.contrat!.avenants.push(avenant);
        this.enregistrementAvenant = false;
        this.avenantOpen = false;
        this.activeTab = 'avenants';
      },
      error: () => {
        this.erreurAvenant = "Erreur lors de la création de l'avenant.";
        this.enregistrementAvenant = false;
      },
    });
  }

  // ── Actions avenants ──────────────────────────────────

  signerAvenant(idAvenant: number): void {
    if (!this.contrat) return;
    this.contratService.signerAvenant(this.contrat.id, idAvenant).subscribe({
      next: ({ avenant, montant_marche_revise }) => {
        const av = this.contrat!.avenants.find(a => a.id === avenant.id);
        if (av) av.statut = 'signe';
        this.contrat!.montant_marche_revise = montant_marche_revise;
      },
      error: () => alert('Erreur lors de la signature de l\'avenant'),
    });
  }

  refuserAvenant(idAvenant: number): void {
    if (!this.contrat) return;
    this.contratService.refuserAvenant(this.contrat.id, idAvenant).subscribe({
      next: () => {
        const av = this.contrat!.avenants.find(a => a.id === idAvenant);
        if (av) av.statut = 'refuse';
      },
      error: () => alert('Erreur lors du refus de l\'avenant'),
    });
  }
}