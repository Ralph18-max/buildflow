import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { PermissionService } from '../../../core/services/permission.service';

interface ChantierActif {
  id: number;
  nom: string;
  client: string;
  statut: 'en_cours' | 'termine' | 'suspendu';
  avancement: number;
  budget: number;
  retard_jours: number;
}

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
export class DashboardComponent implements OnInit {

  // Prénom depuis l'utilisateur connecté
  get user() {
    const u = this.perms.currentUser();
    return { prenom: u?.prenom || 'Utilisateur', nom: u?.nom || '' };
  }

  chantiersActifs: ChantierActif[] = [
    { id: 1, nom: 'Résidence Les Palmiers',       client: 'SCI Les Palmiers',         statut: 'en_cours', avancement: 72,  budget: 450_000_000, retard_jours: 5 },
    { id: 3, nom: 'Complexe Commercial Marcory',   client: 'Groupe Immobilier du Sud', statut: 'en_cours', avancement: 18,  budget: 820_000_000, retard_jours: 0 },
    { id: 4, nom: 'Maison Individuelle Yopougon',  client: 'Diabaté Moussa',           statut: 'en_cours', avancement: 5,   budget: 95_000_000,  retard_jours: 0 },
  ];

  constructor(private router: Router, public perms: PermissionService) {}

  ngOnInit(): void {}

  // ── KPI adaptatifs selon le rôle ─────────────────────────────────────────────
  get kpiCards(): KpiCard[] {
    if (this.perms.isComptable) {
      return [
        { label: 'Total encaissé',          value: '742 M',   sub: 'FCFA',          icon: 'payments',        color: 'green' },
        { label: 'Reste à facturer (RAF)',   value: '371 M',   sub: 'FCFA',          icon: 'receipt_long',    color: 'orange' },
        { label: 'Factures ST en attente',  value: '3',       sub: 'à régler',       icon: 'pending_actions', color: 'red', alert: true },
        { label: 'Marge prévisionnelle',    value: '12,4 %',  sub: 'tous chantiers', icon: 'trending_up',     color: 'blue' },
      ];
    }

    if (this.perms.isChef) {
      return [
        { label: 'Mes chantiers actifs',    value: '2',       sub: 'en cours',       icon: 'construction',    color: 'orange' },
        { label: 'Rapports cette semaine',  value: '4',       sub: 'soumis',         icon: 'assignment',      color: 'green' },
        { label: 'Incidents signalés',      value: '1',       sub: 'non clôturé',    icon: 'warning_amber',   color: 'red', alert: true },
        { label: 'Effectif moyen',          value: '9',       sub: 'personnes/jour', icon: 'people',          color: 'blue' },
      ];
    }

    // Admin / Conducteur
    return [
      { label: 'Chantiers en cours',        value: String(this.getChantierEnCours()), sub: '+2 ce mois',    icon: 'construction',        color: 'orange' },
      { label: 'Budget total engagé',       value: this.getBudgetTotal(),             sub: 'FCFA',          icon: 'account_balance_wallet', color: 'blue' },
      { label: 'Alertes dépassement',       value: String(this.getAlertes()),         sub: 'Seuil > 5%',    icon: 'warning_amber',       color: 'red', alert: true },
      { label: 'Reste à facturer',          value: this.getRAF(),                     sub: 'FCFA',          icon: 'receipt_long',        color: 'green' },
    ];
  }

  // ── KPI helpers ──────────────────────────────────────────────────────────────
  getChantierEnCours(): number {
    return this.chantiersActifs.filter(c => c.statut === 'en_cours').length;
  }

  getBudgetTotal(): string {
    const total = this.chantiersActifs.reduce((s, c) => s + c.budget, 0);
    return this.formatCompact(total);
  }

  getAlertes(): number { return 3; }

  getRAF(): string { return '840 M'; }

  // ── Formatage ────────────────────────────────────────────────────────────────
  formatBudget(n: number): string {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' Mds FCFA';
    if (n >= 1_000_000)     return Math.round(n / 1_000_000) + ' M FCFA';
    return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
  }

  formatCompact(n: number): string {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' Mds';
    if (n >= 1_000_000)     return Math.round(n / 1_000_000) + ' M';
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

  voirChantier(id: number): void {
    this.router.navigate(['/chantiers', id]);
  }
}