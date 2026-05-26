import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PermissionService } from '../../../core/services/permission.service';
import { ChantierService } from '../../../core/services/chantier.service';
import { Chantier, Avenant, SituationTravaux } from '../../../core/models';
import { environment } from '../../../../environments/environment';

interface ConditionCloture {
  id: string;
  label: string;
  description: string;
  statut: 'ok' | 'bloque' | 'warning';
  valeur: string;
}

interface LigneAvenant {
  numero: string;
  motif: string;
  montant: number;
  date: string;
  statut: 'signe' | 'en_attente';
}

interface LigneSituation {
  numero: string;
  date: string;
  montant: number;
  statut: 'payee' | 'en_attente' | 'en_retard' | 'validee';
}

interface BilanCloture {
  montantMarcheInitial: number;
  totalAvenants: number;
  montantMarcheRevise: number;
  totalSituationsEmises: number;
  totalEncaisse: number;
  retenueGarantie: number;
  raf: number;
  budgetS0: number;
  totalCoutsReels: number;
  ecartBudget: number;
  ecartBudgetPct: number;
  margePrevue: number;
  margeReelle: number;
  ecartMarge: number;
  avenants: LigneAvenant[];
  situations: LigneSituation[];
}

@Component({
  selector: 'app-cloture',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DecimalPipe, DatePipe, RouterModule],
  templateUrl: './cloture.html',
  styleUrl: './cloture.scss'
})
export class CloturePage implements OnInit {

  private chantierId = 0;

  chantierNom = '';
  chantierNumeroMarche = '';
  chantierStatut = '';
  chantierAvancement = 0;
  chantierDateDebut = '';
  chantierDateFin = '';
  chantierLocalisation = '';

  get roleUtilisateur(): string { return this.perms.role ?? ''; }

  statutCloture: 'non_initie' | 'bilan_valide' | 'cloture' = 'non_initie';
  dateValidationComptable: string | null = null;
  dateClotureAdmin: string | null = null;

  loading = false;
  showConfirmModal = false;
  confirmAction: 'valider_bilan' | 'cloture_officielle' | null = null;
  showSuccessToast = false;
  toastMessage = '';
  erreurCloture = '';

  bilan: BilanCloture = {
    montantMarcheInitial: 0, totalAvenants: 0, montantMarcheRevise: 0,
    totalSituationsEmises: 0, totalEncaisse: 0, retenueGarantie: 0, raf: 0,
    budgetS0: 0, totalCoutsReels: 0, ecartBudget: 0, ecartBudgetPct: 0,
    margePrevue: 0, margeReelle: 0, ecartMarge: 0,
    avenants: [], situations: []
  };

  conditions: ConditionCloture[] = [];

  get conditionsOk(): boolean { return this.conditions.every(c => c.statut === 'ok'); }
  get conditionsOkCount(): number { return this.conditions.filter(c => c.statut === 'ok').length; }

  get peutValiderBilan(): boolean {
    return this.roleUtilisateur === 'comptable'
      && this.conditionsOk
      && this.statutCloture === 'non_initie';
  }

  get peutCloturerOfficiel(): boolean {
    return this.roleUtilisateur === 'admin'
      && this.statutCloture === 'bilan_valide';
  }

  get margeReellePositive(): boolean { return this.bilan.margeReelle >= 0; }
  get ecartBudgetDepasse(): boolean { return this.bilan.ecartBudgetPct > 5; }
  get totalAvenantsPositif(): boolean { return this.bilan.totalAvenants > 0; }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private perms: PermissionService,
    private chantierService: ChantierService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.chantierId = Number(this.route.snapshot.paramMap.get('id'));
    this.chargerChantier();
  }

  chargerChantier(): void {
    this.loading = true;
    this.erreurCloture = '';
    this.chantierService.getById(this.chantierId).subscribe({
      next: (chantier) => {
        if (!chantier) { this.loading = false; return; }

        this.chantierNom          = chantier.nom_chantier;
        this.chantierNumeroMarche = chantier.contrat?.numero_marche ?? chantier.numero_marche ?? '';
        this.chantierStatut       = chantier.statut;
        this.chantierAvancement   = chantier.avancement_global;
        this.chantierDateDebut    = chantier.planning?.date_debut_prevue ?? '';
        this.chantierDateFin      = chantier.date_livraison_prevue;
        this.chantierLocalisation = chantier.localisation;

        const sc = chantier.cloture?.statut_bilan;
        if (sc === 'bilan_valide')     this.statutCloture = 'bilan_valide';
        else if (sc === 'cloture')     this.statutCloture = 'cloture';
        else                           this.statutCloture = 'non_initie';

        this.dateValidationComptable = chantier.cloture?.date_validation_comptable ?? null;
        this.dateClotureAdmin        = chantier.cloture?.date_cloture_admin ?? null;

        this.bilan = this.calculerBilan(chantier);
        this.chargerConditions(chantier);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.erreurCloture = 'Impossible de charger les données du chantier.';
      }
    });
  }

  private calculerBilan(c: Chantier): BilanCloture {
    // DB returns modifications[] with fields: numero_modification, motif, montant_supplementaire
    const modifications: any[] = (c.contrat as any)?.modifications ?? c.contrat?.avenants ?? [];
    // DB returns situation[] with fields: montant_ht, montant_ttc, montant_encaisse, reste_a_facturer
    const situations: any[] = (c.situations as any[]) ?? [];

    const montantMarcheInitial = c.contrat?.montant_marche ?? 0;
    const totalAvenants        = modifications
      .filter(a => a.statut === 'signe')
      .reduce((s: number, a) => s + (a.montant_supplementaire ?? a.montant ?? 0), 0);
    const montantMarcheRevise  = montantMarcheInitial + totalAvenants;

    const totalSituationsEmises = situations.reduce((s: number, si) => s + (si.montant_ttc ?? si.montant_cumule ?? 0), 0);
    const totalEncaisse         = situations.reduce((s: number, si) => s + (si.montant_encaisse ?? 0), 0);
    const retenueGarantie       = totalSituationsEmises * 0.05;
    const raf                   = montantMarcheRevise - totalSituationsEmises;

    const budgetS0         = c.budget?.montant_total_S0 ?? 0;
    const totalCoutsReels  = c.budget?.cout_reel_a_date ?? 0;
    const ecartBudget      = totalCoutsReels - budgetS0;
    const ecartBudgetPct   = budgetS0 > 0 ? (ecartBudget / budgetS0) * 100 : 0;

    const margePrevue  = c.budget?.marge_prevue ?? 0;
    const margeReelle  = c.cloture?.marge_reelle ?? (totalEncaisse - totalCoutsReels);
    const ecartMarge   = margeReelle - margePrevue;

    const avenants: LigneAvenant[] = modifications.map(a => ({
      numero:  a.numero ?? `MOD-${String(a.numero_modification ?? a.id).padStart(3, '0')}`,
      motif:   a.motif ?? a.objet ?? '',
      montant: a.montant_supplementaire ?? a.montant ?? 0,
      date:    a.date ?? (a.created_at ? new Date(a.created_at).toISOString().split('T')[0] : ''),
      statut:  a.statut as 'signe' | 'en_attente',
    }));

    const lignesSituations: LigneSituation[] = situations.map(si => ({
      numero:  si.numero ?? `SIT-${String(si.numero_situation ?? si.id).padStart(3, '0')}`,
      date:    si.date_emission ? new Date(si.date_emission).toISOString().split('T')[0] : '',
      montant: si.montant_ttc ?? si.montant_cumule ?? si.montant_periode ?? 0,
      statut:  si.statut as 'payee' | 'en_attente' | 'en_retard' | 'validee',
    }));

    return {
      montantMarcheInitial, totalAvenants, montantMarcheRevise,
      totalSituationsEmises, totalEncaisse, retenueGarantie, raf,
      budgetS0, totalCoutsReels, ecartBudget, ecartBudgetPct,
      margePrevue, margeReelle, ecartMarge,
      avenants, situations: lignesSituations,
    };
  }

  chargerConditions(chantier?: Chantier): void {
    const situations = this.bilan.situations;
    const toutSituationsPayees = situations.length > 0 && situations.every(s => s.statut === 'payee');
    const rafZero = this.bilan.raf <= 0;

    const jalons = chantier?.planning?.jalons ?? [];
    const jalonsTotaux   = jalons.length;
    const jalonsAtteints = jalons.filter(j => j.statut === 'atteint').length;
    const tousJalonsOk   = jalonsTotaux > 0 && jalonsAtteints === jalonsTotaux;

    this.conditions = [
      {
        id: 'avancement',
        label: 'Avancement global',
        description: 'Le chantier doit être réalisé à 100%',
        statut: this.chantierAvancement >= 100 ? 'ok' : 'bloque',
        valeur: `${this.chantierAvancement}%`
      },
      {
        id: 'situations',
        label: 'Situations de travaux',
        description: 'Toutes les situations doivent être payées',
        statut: situations.length === 0 ? 'warning' : toutSituationsPayees ? 'ok' : 'bloque',
        valeur: situations.length === 0
          ? 'Aucune situation'
          : toutSituationsPayees
            ? 'Toutes payées'
            : `${situations.filter(s => s.statut !== 'payee').length} en attente`
      },
      {
        id: 'jalons',
        label: 'Jalons du planning',
        description: 'Tous les jalons doivent être atteints',
        statut: jalonsTotaux === 0 ? 'warning' : tousJalonsOk ? 'ok' : 'bloque',
        valeur: jalonsTotaux === 0 ? 'Aucun jalon' : `${jalonsAtteints} / ${jalonsTotaux} atteints`
      },
      {
        id: 'raf',
        label: 'Reste à facturer (RAF)',
        description: 'Le RAF doit être égal à zéro',
        statut: rafZero ? 'ok' : 'bloque',
        valeur: rafZero ? '0 FCFA' : `${this.formatMontant(this.bilan.raf)} restant`
      },
    ];
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  getAbsEcartMarge(): string { return this.formatMontant(Math.abs(this.bilan.ecartMarge)); }
  signeMontant(valeur: number): string { return valeur < 0 ? '' : '+'; }
  getEcartClass(ecart: number): string {
    if (ecart === 0) return 'neutre';
    return ecart > 0 ? 'positif' : 'negatif';
  }

  ouvrirConfirm(action: 'valider_bilan' | 'cloture_officielle'): void {
    this.confirmAction = action;
    this.showConfirmModal = true;
  }

  fermerConfirm(): void {
    this.showConfirmModal = false;
    this.confirmAction = null;
  }

  confirmerAction(): void {
    const action = this.confirmAction;
    this.fermerConfirm();
    this.loading = true;
    this.erreurCloture = '';

    const endpoint = action === 'valider_bilan'
      ? `${environment.apiUrl}/comptabilite/cloture/${this.chantierId}/valider`
      : `${environment.apiUrl}/comptabilite/cloture/${this.chantierId}/cloturer`;

    this.http.post<any>(endpoint, {}).subscribe({
      next: (result) => {
        this.loading = false;
        if (action === 'valider_bilan') {
          this.statutCloture = 'bilan_valide';
          this.dateValidationComptable = result.date_validation_comptable ?? new Date().toISOString();
          this.afficherToast('Bilan validé — En attente de la clôture officielle par l\'Administrateur');
        } else {
          this.statutCloture = 'cloture';
          this.dateClotureAdmin = result.date_cloture_admin ?? new Date().toISOString();
          if (result.marge_reelle !== undefined) {
            this.bilan.margeReelle = result.marge_reelle;
            this.bilan.ecartMarge  = result.marge_reelle - this.bilan.margePrevue;
          }
          this.afficherToast('Chantier clôturé officiellement');
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.erreurCloture = err.error?.message ?? 'Erreur lors de la clôture. Veuillez réessayer.';
      }
    });
  }

  afficherToast(message: string): void {
    this.toastMessage = message;
    this.showSuccessToast = true;
    setTimeout(() => this.showSuccessToast = false, 4000);
  }

  retourChantier(): void {
    this.router.navigate(['/chantiers', this.chantierId]);
  }
}
