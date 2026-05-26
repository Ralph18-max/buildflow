import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';
import { ChantierService } from '../../../core/services/chantier.service';
import { ContratService } from '../../../core/services/contrat.service';
import { FactureService } from '../../../core/services/facture.service';
import { TerrainService } from '../../../core/services/terrain.service';
import { Chantier } from '../../../core/models';

interface KpiCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: 'orange' | 'blue' | 'red' | 'green';
  alert?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {

  chantiersActifs: Chantier[] = [];
  totalEncaisse = 0;
  totalRAF = 0;
  totalEnRetard = 0;

  // KPIs terrain (chef de chantier)
  rapportsSemaine = 0;
  incidentsSemaine = 0;
  effectifMoyen = 0;

  private subs = new Subscription();

  constructor(
    private router: Router,
    public perms: PermissionService,
    private chantierService: ChantierService,
    private contratService: ContratService,
    private factureService: FactureService,
    private terrainService: TerrainService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.chantierService.getEnCours().subscribe(chantiers => {
        this.chantiersActifs = chantiers;
      })
    );

    this.subs.add(
      this.factureService.getStats().subscribe(stats => {
        this.totalEncaisse = stats.total_encaisse;
        this.totalEnRetard = stats.en_retard;
      })
    );

    this.subs.add(
      this.contratService.getStats().subscribe(stats => {
        this.totalRAF = stats.total_raf;
      })
    );

    // KPIs terrain — chargés pour tous (utilisés par le chef de chantier)
    this.subs.add(
      this.terrainService.getRapports().subscribe(rapports => {
        const lundiSemaine = new Date();
        lundiSemaine.setDate(lundiSemaine.getDate() - ((lundiSemaine.getDay() + 6) % 7));
        lundiSemaine.setHours(0, 0, 0, 0);

        const cettesSemaine = rapports.filter(r => new Date(r.date_rapport) >= lundiSemaine);
        this.rapportsSemaine  = cettesSemaine.length;
        this.incidentsSemaine = rapports.filter(r => r.a_incident).length;

        if (rapports.length > 0) {
          const total = rapports.reduce((s, r) => s + (r.effectif_present || 0), 0);
          this.effectifMoyen = Math.round(total / rapports.length);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Utilisateur connecté ──────────────────────────────

  get user() {
    const u = this.perms.currentUser();
    return { prenom: u?.prenom || 'Utilisateur', nom: u?.nom || '' };
  }

  get welcomeMessage(): string {
    if (this.perms.isChef) return 'Voici l\'état de vos chantiers terrain';
    if (this.perms.isComptable) return 'Voici votre tableau de bord financier';
    if (this.perms.isAdmin) return 'Voici l\'état global de l\'activité';
    return 'Voici l\'état de vos chantiers';
  }

  // ── KPI adaptatifs selon le rôle ──────────────────────

  get kpiCards(): KpiCard[] {
    if (this.perms.isComptable) {
      return [
        { label: 'Total encaissé',         value: this.formatCompact(this.totalEncaisse), sub: 'FCFA encaissés',  icon: 'payments',        color: 'green' },
        { label: 'Reste à facturer (RAF)', value: this.formatCompact(this.totalRAF),      sub: 'FCFA à facturer', icon: 'receipt_long',    color: 'orange' },
        { label: 'Factures en retard',     value: this.formatCompact(this.totalEnRetard), sub: 'FCFA en retard',  icon: 'pending_actions', color: 'red', alert: this.totalEnRetard > 0 },
        { label: 'Marge prévisionnelle',   value: this.getMargePrev(),                    sub: 'tous chantiers',  icon: 'trending_up',     color: 'blue' },
      ];
    }

    if (this.perms.isChef) {
      return [
        { label: 'Mes chantiers actifs',   value: String(this.chantiersActifs.length),  sub: 'en cours',             icon: 'construction',  color: 'orange' },
        { label: 'Rapports cette semaine', value: String(this.rapportsSemaine),          sub: 'soumis cette semaine', icon: 'assignment',    color: 'green' },
        { label: 'Incidents signalés',     value: String(this.incidentsSemaine),         sub: 'total enregistrés',    icon: 'warning_amber', color: 'red',   alert: this.incidentsSemaine > 0 },
        { label: 'Effectif moyen',         value: this.effectifMoyen ? String(this.effectifMoyen) : '—', sub: 'personnes / rapport', icon: 'people', color: 'blue' },
      ];
    }

    // Admin / Conducteur
    return [
      { label: 'Chantiers en cours',  value: String(this.chantiersActifs.length), sub: 'actifs',     icon: 'construction',          color: 'orange' },
      { label: 'Budget total engagé', value: this.getBudgetTotal(),               sub: 'FCFA',       icon: 'account_balance_wallet', color: 'blue' },
      { label: 'Alertes dépassement', value: String(this.getAlertes()),           sub: 'Seuil > 5%', icon: 'warning_amber',         color: 'red', alert: this.getAlertes() > 0 },
      { label: 'Reste à facturer',    value: this.formatCompact(this.totalRAF),   sub: 'FCFA',       icon: 'receipt_long',          color: 'green' },
    ];
  }

  // ── KPI helpers ───────────────────────────────────────

  getBudgetTotal(): string {
    const total = this.chantiersActifs.reduce((s, c) => s + (c.montant_marche || 0), 0);
    return this.formatCompact(total);
  }

  getAlertes(): number {
    return this.chantiersActifs.filter(c => {
      const budget = c.budget;
      if (!budget) return false;
      return budget.cout_reel_a_date > budget.debourse_sec_estime * 1.05;
    }).length;
  }

  getMargePrev(): string {
    const avecBudget = this.chantiersActifs.filter(c => c.budget && c.budget.montant_total_S0 > 0);
    if (!avecBudget.length) return '—';
    const totalMarge = avecBudget.reduce((s, c) => s + c.budget!.marge_prevue, 0);
    const totalS0    = avecBudget.reduce((s, c) => s + c.budget!.montant_total_S0, 0);
    return (totalMarge / totalS0 * 100).toFixed(1) + '%';
  }

  // ── Formatage ─────────────────────────────────────────

  formatBudget(n: number | undefined): string {
    if (!n) return '—';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' Mds FCFA';
    if (n >= 1_000_000) return Math.round(n / 1_000_000) + ' M FCFA';
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  }

  formatCompact(n: number): string {
    if (!n) return '0';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' Mds';
    if (n >= 1_000_000) return Math.round(n / 1_000_000) + ' M';
    return new Intl.NumberFormat('fr-FR').format(n);
  }

  getAvancementColor(pct: number): string {
    if (pct >= 80) return '#22c55e';
    if (pct >= 40) return '#E8520A';
    return '#ef4444';
  }

  getStatutLabel(statut: string): string {
    return { en_cours: 'En cours', termine: 'Terminé', suspendu: 'Suspendu' }[statut] || statut;
  }

  getRetardJours(chantier: Chantier): number {
    if (!chantier.date_livraison_prevue) return 0;
    const prevue = new Date(chantier.date_livraison_prevue).getTime();
    const aujourd_hui = Date.now();
    if (aujourd_hui <= prevue) return 0;
    return Math.floor((aujourd_hui - prevue) / (1000 * 60 * 60 * 24));
  }

  voirChantier(id: number): void {
    this.router.navigate(['/chantiers', id]);
  }
}