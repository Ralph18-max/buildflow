import { Component, Input, OnInit } from '@angular/core';
import { NgIf, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PermissionService } from '../../core/services/permission.service';
import { CanPipe } from '../../core/pipes/can.pipe';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

interface BudgetS0 {
  id_budget:           number;
  id_chantier:         number;
  debourse_sec_estime: number;
  frais_generaux:      number;
  marge_prevue:        number;
  provision_aleas:     number;
  montant_total_S0:    number;
  cout_reel_a_date:    number;
  reste_a_depenser:    number;
  ecart_budget:        number;
  date_creation:       string;
  cree_par:            string;
  s0_fige:             boolean;
}

@Component({
  selector: 'app-budget-s0',
  standalone: true,
  imports: [NgIf, NgClass, DecimalPipe, FormsModule, CanPipe],
  templateUrl: './budget.html',
  styleUrl: './budget.scss'
})
export class BudgetS0Component implements OnInit {
  @Input() chantier_id!: number;
  @Input() montant_marche?: number;

  private readonly SEUIL_DEPASSEMENT = 0.05;

  showForm        = false;
  showUpdateReel  = false;
  nouveauCoutReel = 0;
  isLoading       = false;

  budget: BudgetS0 | null = null;

  form = {
    debourse_sec_estime: 0,
    frais_generaux:      0,
    marge_prevue:        0,
    provision_aleas:     0,
  };

  constructor(
    public  perm:  PermissionService,
    private http:  HttpClient,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this._chargerBudget();
  }

  private _chargerBudget(): void {
    this.http.get<any>(`${API_URL}/chantiers/${this.chantier_id}`).subscribe({
      next: (chantier) => {
        const b = chantier.budget;
        if (!b) { this.budget = null; return; }
        this.budget = {
          id_budget:           b.id,
          id_chantier:         b.id_chantier,
          debourse_sec_estime: b.debourse_sec_estime,
          frais_generaux:      b.frais_generaux,
          marge_prevue:        b.marge_prevue,
          provision_aleas:     b.provision_aleas,
          montant_total_S0:    b.montant_total_s0 || b.montant_total_S0 || 0,
          cout_reel_a_date:    b.cout_reel_a_date,
          reste_a_depenser:    b.reste_a_depenser,
          ecart_budget:        b.ecart_budget,
          date_creation:       b.date_creation?.split('T')[0] || '',
          cree_par:            b.cree_par || '',
          s0_fige:             b.s0_fige ?? true,
        };
      },
    });
  }

  ouvrirFormulaire(): void {
    if (!this.perm.can('budget:create')) return;
    this.showForm = true;
  }

  annuler(): void {
    this.showForm = false;
    this.form = { debourse_sec_estime: 0, frais_generaux: 0, marge_prevue: 0, provision_aleas: 0 };
  }

  recalculer(): void {}

  getTotalS0(): number {
    return (this.form.debourse_sec_estime || 0)
         + (this.form.frais_generaux      || 0)
         + (this.form.marge_prevue        || 0)
         + (this.form.provision_aleas     || 0);
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
    this.isLoading = true;
    this.http.post<any>(`${API_URL}/chantiers/${this.chantier_id}/budget`, {
      debourse_sec_estime: this.form.debourse_sec_estime,
      frais_generaux:      this.form.frais_generaux,
      marge_prevue:        this.form.marge_prevue,
      provision_aleas:     this.form.provision_aleas,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.showForm  = false;
        this.toast.success('Budget S0 créé et figé.');
        this._chargerBudget();
        this.form = { debourse_sec_estime: 0, frais_generaux: 0, marge_prevue: 0, provision_aleas: 0 };
      },
      error: () => { this.isLoading = false; },
    });
  }

  mettreAJourCoutReel(): void {
    if (!this.budget || !this.perm.can('budget:edit')) return;
    this.isLoading = true;
    this.http.patch<any>(`${API_URL}/chantiers/${this.chantier_id}/budget/cout-reel`, {
      cout_reel_a_date: this.nouveauCoutReel,
    }).subscribe({
      next: () => {
        this.isLoading      = false;
        this.showUpdateReel = false;
        this.nouveauCoutReel = 0;
        this.toast.success('Coût réel mis à jour.');
        this._chargerBudget();
      },
      error: () => { this.isLoading = false; },
    });
  }

  isEnDepassement(): boolean {
    if (!this.budget) return false;
    return this.budget.cout_reel_a_date > this.budget.debourse_sec_estime * (1 + this.SEUIL_DEPASSEMENT);
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
