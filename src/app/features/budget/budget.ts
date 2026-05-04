import { Component, Input, OnInit, signal, computed } from '@angular/core';
import { NgIf, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../core/services/permission.service';
import { CanPipe } from '../../core/pipes/can.pipe';

interface BudgetS0 {
  id_budget: number;
  id_chantier: number;
  debourse_sec_estime: number;
  frais_generaux: number;
  marge_prevue: number;
  provision_aleas: number;
  montant_total_S0: number;
  cout_reel_a_date: number;
  reste_a_depenser: number;
  ecart_budget: number;
  date_creation: string;
  cree_par: string;
  s0_fige: boolean;
}

@Component({
  selector: 'app-budget-s0',
  standalone: true,
  imports: [NgIf, NgClass, DecimalPipe, FormsModule, CanPipe],
  template: `
<div class="budget-s0">

  <!-- En-tête section -->
  <div class="section-header">
    <div class="section-title">
      <span class="material-icons">account_balance_wallet</span>
      <div>
        <h3>Budget S0 — Situation initiale</h3>
        <p class="section-subtitle" *ngIf="budget?.s0_fige">
          <span class="material-icons icon-small">lock</span>
          Figé le {{ budget?.date_creation }} par {{ budget?.cree_par }}
        </p>
      </div>
    </div>
    <!-- Bouton "Saisir le budget" — Admin uniquement, S0 non encore créé -->
    <button
      *ngIf="('budget:create' | can) && !budget"
      class="btn-primary"
      (click)="ouvrirFormulaire()">
      <span class="material-icons">add</span>
      Saisir le budget S0
    </button>
    <!-- Info readonly pour les autres rôles -->
    <span class="badge-readonly" *ngIf="!('budget:edit' | can) && budget">
      <span class="material-icons">visibility</span>
      Lecture seule
    </span>
  </div>

  <!-- Alerte dépassement -->
  <div class="alert-depassement" *ngIf="budget && isEnDepassement()">
    <span class="material-icons">warning</span>
    <strong>Alerte dépassement budgétaire</strong>
    — Le coût réel dépasse le S0 de {{ getDepassementPct() }}%
    ({{ getDepassementMontant() | number:'1.0-0' }} FCFA)
  </div>

  <!-- État : Budget non créé -->
  <div class="budget-empty" *ngIf="!budget && !showForm">
    <span class="material-icons">savings</span>
    <p>Aucun budget S0 saisi pour ce chantier</p>
    <small *ngIf="!('budget:create' | can)">
      Contactez l'administrateur pour saisir le budget initial
    </small>
    <button
      *ngIf="('budget:create' | can)"
      class="btn-primary"
      (click)="ouvrirFormulaire()">
      Saisir le budget S0
    </button>
  </div>

  <!-- Formulaire de saisie — Admin uniquement -->
  <div class="budget-form" *ngIf="showForm && ('budget:create' | can)">
    <div class="form-notice">
      <span class="material-icons">info</span>
      <strong>Attention :</strong> Le budget S0 est figé définitivement après la première sauvegarde.
      Vérifiez vos chiffres avant de valider.
    </div>

    <div class="form-grid">
      <div class="form-group">
        <label>Déboursé sec estimé (FCFA) *</label>
        <p class="field-help">Coût direct : main d'œuvre + matériaux + matériel (sans marge ni frais fixes)</p>
        <input
          type="number"
          [(ngModel)]="form.debourse_sec_estime"
          (ngModelChange)="recalculer()"
          placeholder="Ex: 350 000 000"
          min="0"
        />
      </div>
      <div class="form-group">
        <label>Frais généraux (FCFA)</label>
        <p class="field-help">Part des charges fixes de l'entreprise affectée à ce chantier</p>
        <input
          type="number"
          [(ngModel)]="form.frais_generaux"
          (ngModelChange)="recalculer()"
          placeholder="Ex: 35 000 000"
          min="0"
        />
      </div>
      <div class="form-group">
        <label>Marge prévue (FCFA)</label>
        <p class="field-help">Bénéfice attendu après toutes les dépenses</p>
        <input
          type="number"
          [(ngModel)]="form.marge_prevue"
          (ngModelChange)="recalculer()"
          placeholder="Ex: 45 000 000"
          min="0"
        />
      </div>
      <div class="form-group">
        <label>Provision pour aléas (FCFA)</label>
        <p class="field-help">Recommandé : 5 à 10% du déboursé sec. Actuellement : {{ getPctAleas() }}%</p>
        <input
          type="number"
          [(ngModel)]="form.provision_aleas"
          (ngModelChange)="recalculer()"
          placeholder="Ex: 17 500 000"
          min="0"
        />
        <div class="aleas-shortcuts">
          <button type="button" class="btn-chip" (click)="setAleas(5)">5%</button>
          <button type="button" class="btn-chip" (click)="setAleas(7)">7%</button>
          <button type="button" class="btn-chip" (click)="setAleas(10)">10%</button>
        </div>
      </div>
    </div>

    <!-- Récap calcul en temps réel -->
    <div class="recap-calcul">
      <h4>Récapitulatif — Formule prix de vente</h4>
      <div class="formule-visuelle">
        <div class="formule-item">
          <span class="formule-label">Déboursé sec</span>
          <span class="formule-value">{{ form.debourse_sec_estime | number:'1.0-0' }} FCFA</span>
        </div>
        <div class="formule-plus">+</div>
        <div class="formule-item">
          <span class="formule-label">Frais généraux</span>
          <span class="formule-value">{{ form.frais_generaux | number:'1.0-0' }} FCFA</span>
        </div>
        <div class="formule-plus">+</div>
        <div class="formule-item">
          <span class="formule-label">Marge prévue</span>
          <span class="formule-value">{{ form.marge_prevue | number:'1.0-0' }} FCFA</span>
        </div>
        <div class="formule-plus">+</div>
        <div class="formule-item">
          <span class="formule-label">Provision aléas</span>
          <span class="formule-value">{{ form.provision_aleas | number:'1.0-0' }} FCFA</span>
        </div>
        <div class="formule-egal">=</div>
        <div class="formule-item formule-total">
          <span class="formule-label">Prix de vente (S0)</span>
          <span class="formule-value total-value">{{ getTotalS0() | number:'1.0-0' }} FCFA</span>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn-secondary" (click)="annuler()">Annuler</button>
      <button
        class="btn-primary"
        (click)="sauvegarder()"
        [disabled]="!form.debourse_sec_estime">
        <span class="material-icons">save</span>
        Figer le budget S0
      </button>
    </div>
  </div>

  <!-- Affichage du budget figé -->
  <div class="budget-display" *ngIf="budget && !showForm">

    <!-- KPI Cards S0 -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">Déboursé sec S0</span>
        <span class="kpi-value">{{ budget.debourse_sec_estime | number:'1.0-0' }}</span>
        <span class="kpi-unit">FCFA</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Prix de vente S0</span>
        <span class="kpi-value">{{ budget.montant_total_S0 | number:'1.0-0' }}</span>
        <span class="kpi-unit">FCFA</span>
      </div>
      <div class="kpi-card" [ngClass]="isEnDepassement() ? 'kpi-danger' : 'kpi-success'">
        <span class="kpi-label">Coût réel à date</span>
        <span class="kpi-value">{{ budget.cout_reel_a_date | number:'1.0-0' }}</span>
        <span class="kpi-unit">FCFA</span>
      </div>
      <div class="kpi-card" [ngClass]="budget.ecart_budget >= 0 ? 'kpi-success' : 'kpi-danger'">
        <span class="kpi-label">Écart budget</span>
        <span class="kpi-value">
          {{ budget.ecart_budget >= 0 ? '+' : '' }}{{ budget.ecart_budget | number:'1.0-0' }}
        </span>
        <span class="kpi-unit">FCFA</span>
      </div>
    </div>

    <!-- Détail complet -->
    <div class="budget-detail">
      <div class="detail-section">
        <h4>Composition du S0</h4>
        <div class="detail-row">
          <span>Déboursé sec estimé</span>
          <strong>{{ budget.debourse_sec_estime | number:'1.0-0' }} FCFA</strong>
        </div>
        <div class="detail-row">
          <span>Frais généraux</span>
          <strong>{{ budget.frais_generaux | number:'1.0-0' }} FCFA</strong>
        </div>
        <div class="detail-row">
          <span>Marge prévue</span>
          <strong>{{ budget.marge_prevue | number:'1.0-0' }} FCFA</strong>
        </div>
        <div class="detail-row">
          <span>Provision aléas</span>
          <strong>{{ budget.provision_aleas | number:'1.0-0' }} FCFA</strong>
        </div>
        <div class="detail-row total-row">
          <span>Total S0 (Prix de vente)</span>
          <strong>{{ budget.montant_total_S0 | number:'1.0-0' }} FCFA</strong>
        </div>
      </div>

      <div class="detail-section">
        <h4>Suivi en cours</h4>
        <div class="detail-row">
          <span>Coût réel à date</span>
          <strong [ngClass]="isEnDepassement() ? 'text-danger' : ''">
            {{ budget.cout_reel_a_date | number:'1.0-0' }} FCFA
          </strong>
        </div>
        <div class="detail-row">
          <span>Reste à dépenser (RAD)</span>
          <strong>{{ budget.reste_a_depenser | number:'1.0-0' }} FCFA</strong>
        </div>
        <div class="detail-row">
          <span>Écart vs S0</span>
          <strong [ngClass]="budget.ecart_budget >= 0 ? 'text-success' : 'text-danger'">
            {{ budget.ecart_budget >= 0 ? '+' : '' }}{{ budget.ecart_budget | number:'1.0-0' }} FCFA
          </strong>
        </div>
        <!-- Barre de consommation -->
        <div class="consommation-bar">
          <div class="consommation-header">
            <span>Consommation budgétaire</span>
            <span>{{ getConsommationPct() }}%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              [style.width.%]="getConsommationPct()"
              [ngClass]="isEnDepassement() ? 'fill-danger' : getConsommationPct() > 80 ? 'fill-warning' : 'fill-ok'"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bouton mise à jour coût réel — Conducteur + Admin -->
    <div class="update-reel" *ngIf="'budget:edit' | can">
      <button class="btn-secondary btn-sm" (click)="showUpdateReel = !showUpdateReel">
        <span class="material-icons">update</span>
        Mettre à jour le coût réel
      </button>
      <div class="update-form" *ngIf="showUpdateReel">
        <input
          type="number"
          [(ngModel)]="nouveauCoutReel"
          placeholder="Coût réel cumulé à date (FCFA)"
        />
        <button class="btn-primary btn-sm" (click)="mettreAJourCoutReel()">Valider</button>
      </div>
    </div>

  </div>

</div>
  `,
  styles: [`
.budget-s0 { display: flex; flex-direction: column; gap: 24px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8E4DB;
}
.section-title { display: flex; gap: 12px; align-items: flex-start; }
.section-title .material-icons { color: #E8520A; font-size: 24px; margin-top: 2px; }
.section-title h3 { font-family: 'Sora', sans-serif; font-size: 16px; color: #1A1A18; margin: 0; }
.section-subtitle {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: #6B6B67; margin-top: 4px;
}
.icon-small { font-size: 14px !important; }

.badge-readonly {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: #6B6B67;
  background: #F0EDE6; padding: 6px 12px; border-radius: 20px;
}

.alert-depassement {
  display: flex; align-items: center; gap: 12px;
  background: #FEF2F2; border: 1px solid #FECACA;
  padding: 12px 16px; border-radius: 8px;
  color: #991B1B; font-size: 14px;
}
.alert-depassement .material-icons { color: #EF4444; }

.budget-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 48px; text-align: center;
  background: #F9F7F3; border-radius: 12px; border: 2px dashed #E8E4DB;
}
.budget-empty .material-icons { font-size: 48px; color: #E8E4DB; }
.budget-empty p { font-size: 14px; color: #6B6B67; }
.budget-empty small { font-size: 12px; color: #9CA3AF; }

.form-notice {
  display: flex; align-items: flex-start; gap: 12px;
  background: #FFF7ED; border: 1px solid #FED7AA;
  padding: 12px 16px; border-radius: 8px;
  font-size: 13px; color: #92400E; margin-bottom: 24px;
}
.form-notice .material-icons { color: #F97316; flex-shrink: 0; }

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;
}
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 13px; font-weight: 600; color: #1A1A18; }
.field-help { font-size: 11px; color: #6B6B67; margin: 0; }
.form-group input {
  padding: 10px 12px; border: 1px solid #E8E4DB; border-radius: 8px;
  font-size: 14px; color: #1A1A18; background: white;
  transition: border-color 0.2s;
}
.form-group input:focus { outline: none; border-color: #E8520A; }

.aleas-shortcuts { display: flex; gap: 8px; margin-top: 4px; }
.btn-chip {
  padding: 4px 12px; border: 1px solid #E8520A; border-radius: 20px;
  background: transparent; color: #E8520A; font-size: 12px; cursor: pointer;
  transition: all 0.2s;
}
.btn-chip:hover { background: #E8520A; color: white; }

.recap-calcul {
  background: #F9F7F3; border-radius: 12px; padding: 20px; margin-bottom: 24px;
}
.recap-calcul h4 { font-family: 'Sora', sans-serif; font-size: 14px; margin-bottom: 16px; }
.formule-visuelle { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.formule-item {
  display: flex; flex-direction: column; gap: 4px;
  background: white; padding: 12px 16px; border-radius: 8px;
  border: 1px solid #E8E4DB;
}
.formule-item.formule-total { border-color: #E8520A; background: #FFF7ED; }
.formule-label { font-size: 11px; color: #6B6B67; }
.formule-value { font-size: 14px; font-weight: 600; color: #1A1A18; }
.total-value { color: #E8520A; font-size: 16px; }
.formule-plus, .formule-egal { font-size: 20px; font-weight: 700; color: #6B6B67; }

.form-actions {
  display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px;
  border-top: 1px solid #E8E4DB;
}

/* KPI Grid */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.kpi-card {
  display: flex; flex-direction: column; gap: 4px;
  background: white; padding: 16px; border-radius: 10px;
  border: 1px solid #E8E4DB;
}
.kpi-card.kpi-danger { border-color: #FECACA; background: #FEF2F2; }
.kpi-card.kpi-success { border-color: #BBF7D0; background: #F0FDF4; }
.kpi-label { font-size: 11px; color: #6B6B67; }
.kpi-value { font-size: 18px; font-weight: 700; font-family: 'Sora', sans-serif; color: #1A1A18; }
.kpi-unit { font-size: 11px; color: #6B6B67; }

.budget-detail { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px; }
.detail-section { background: white; border-radius: 10px; padding: 20px; border: 1px solid #E8E4DB; }
.detail-section h4 { font-family: 'Sora', sans-serif; font-size: 13px; margin-bottom: 16px; color: #1A1A18; }
.detail-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid #F5F1EA; font-size: 13px; color: #4B5563;
}
.detail-row:last-child { border-bottom: none; }
.total-row { font-weight: 700; color: #1A1A18 !important; padding-top: 12px; }
.text-danger { color: #EF4444 !important; }
.text-success { color: #22C55E !important; }

.consommation-bar { margin-top: 16px; }
.consommation-header { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
.progress-bar { height: 8px; background: #E8E4DB; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
.fill-ok { background: #22C55E; }
.fill-warning { background: #F97316; }
.fill-danger { background: #EF4444; }

.update-reel { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
.update-form { display: flex; gap: 12px; align-items: center; }
.update-form input {
  padding: 8px 12px; border: 1px solid #E8E4DB; border-radius: 8px;
  font-size: 13px; flex: 1;
}
.btn-sm { padding: 8px 16px !important; font-size: 13px !important; }

/* Boutons communs */
.btn-primary {
  display: flex; align-items: center; gap: 8px;
  background: #E8520A; color: white; border: none;
  padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: background 0.2s;
}
.btn-primary:hover { background: #c9440a; }
.btn-primary:disabled { background: #E8E4DB; color: #9CA3AF; cursor: not-allowed; }
.btn-secondary {
  display: flex; align-items: center; gap: 8px;
  background: white; color: #1A1A18; border: 1px solid #E8E4DB;
  padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer;
}
.btn-secondary:hover { background: #F9F7F3; }

@media (max-width: 768px) {
  .form-grid, .kpi-grid, .budget-detail { grid-template-columns: 1fr; }
  .formule-visuelle { flex-direction: column; }
}
  `]
})
export class BudgetS0Component implements OnInit {
  @Input() chantier_id!: number;
  @Input() montant_marche?: number;

  showForm = false;
  showUpdateReel = false;
  nouveauCoutReel = 0;

  budget: BudgetS0 | null = null;

  form = {
    debourse_sec_estime: 0,
    frais_generaux: 0,
    marge_prevue: 0,
    provision_aleas: 0
  };

  constructor(public perm: PermissionService) {}

  ngOnInit(): void {
    // En prod : appel API GET /api/budget/:chantier_id
    // Simulation : chantier 1 a un budget, les autres non
    if (this.chantier_id === 1) {
      this.budget = {
        id_budget: 1,
        id_chantier: 1,
        debourse_sec_estime: 350000000,
        frais_generaux: 35000000,
        marge_prevue: 45000000,
        provision_aleas: 17500000,
        montant_total_S0: 447500000,
        cout_reel_a_date: 289000000,
        reste_a_depenser: 61000000,
        ecart_budget: 11000000,
        date_creation: '01/03/2024',
        cree_par: 'Konan Yao (Admin)',
        s0_fige: true
      };
    }
  }

  ouvrirFormulaire(): void {
    if (!this.perm.can('budget:create')) return;
    this.showForm = true;
  }

  annuler(): void {
    this.showForm = false;
    this.form = { debourse_sec_estime: 0, frais_generaux: 0, marge_prevue: 0, provision_aleas: 0 };
  }

  recalculer(): void {
    // Réactif — le template calcule via getTotalS0()
  }

  getTotalS0(): number {
    return (this.form.debourse_sec_estime || 0) +
           (this.form.frais_generaux || 0) +
           (this.form.marge_prevue || 0) +
           (this.form.provision_aleas || 0);
  }

  getPctAleas(): number {
    if (!this.form.debourse_sec_estime) return 0;
    return Math.round((this.form.provision_aleas / this.form.debourse_sec_estime) * 100);
  }

  setAleas(pct: number): void {
    this.form.provision_aleas = Math.round(this.form.debourse_sec_estime * (pct / 100));
  }

  sauvegarder(): void {
    if (!this.perm.can('budget:create')) return;
    const total = this.getTotalS0();
    this.budget = {
      id_budget: Date.now(),
      id_chantier: this.chantier_id,
      debourse_sec_estime: this.form.debourse_sec_estime,
      frais_generaux: this.form.frais_generaux,
      marge_prevue: this.form.marge_prevue,
      provision_aleas: this.form.provision_aleas,
      montant_total_S0: total,
      cout_reel_a_date: 0,
      reste_a_depenser: this.form.debourse_sec_estime,
      ecart_budget: this.form.debourse_sec_estime,
      date_creation: new Date().toLocaleDateString('fr-FR'),
      cree_par: this.perm.currentUser().prenom + ' ' + this.perm.currentUser().nom + ' (Admin)',
      s0_fige: true
    };
    this.showForm = false;
  }

  mettreAJourCoutReel(): void {
    if (!this.budget || !this.perm.can('budget:edit')) return;
    this.budget.cout_reel_a_date = this.nouveauCoutReel;
    this.budget.reste_a_depenser = this.budget.debourse_sec_estime - this.nouveauCoutReel;
    this.budget.ecart_budget = this.budget.debourse_sec_estime - this.nouveauCoutReel;
    this.showUpdateReel = false;
    this.nouveauCoutReel = 0;
  }

  isEnDepassement(): boolean {
    if (!this.budget) return false;
    return this.budget.cout_reel_a_date > this.budget.debourse_sec_estime * 1.05;
  }

  getDepassementPct(): string {
    if (!this.budget) return '0';
    return ((this.budget.cout_reel_a_date / this.budget.debourse_sec_estime - 1) * 100).toFixed(1);
  }

  getDepassementMontant(): number {
    if (!this.budget) return 0;
    return this.budget.cout_reel_a_date - this.budget.debourse_sec_estime;
  }

  getConsommationPct(): number {
    if (!this.budget || !this.budget.debourse_sec_estime) return 0;
    return Math.min(100, Math.round((this.budget.cout_reel_a_date / this.budget.debourse_sec_estime) * 100));
  }
}