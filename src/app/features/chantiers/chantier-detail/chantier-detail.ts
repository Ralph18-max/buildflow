import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanPipe } from '../../../core/pipes/can.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BudgetS0Component } from '../../budget/budget';
import { ChantierService } from '../../../core/services/chantier.service';
import { PermissionService } from '../../../core/services/permission.service';
import { ToastService } from '../../../core/services/toast.service';
import { Chantier, CorpsEtat, Intervenant, Jalon } from '../../../core/models';

interface JalonGantt {
  id: number;
  nom: string;
  date_debut: string;
  date_fin: string;
  avancement: number;
  couleur: string;
  offset: number;
  duree: number;
}

@Component({
  selector: 'app-chantier-detail',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, SlicePipe, CanPipe, BudgetS0Component],
  templateUrl: './chantier-detail.html',
  styleUrl: './chantier-detail.scss'
})
export class ChantierDetail implements OnInit, OnDestroy {

  activeTab = 'resume';
  chantier: Chantier | null = null;
  corpsEtatList: CorpsEtat[] = [];
  intervenants: Intervenant[] = [];

  private subs = new Subscription();

  // Gantt
  jalons: JalonGantt[] = [];
  private ganttDebut = 0;
  private ganttFin = 0;

  get todayOffset(): number {
    if (!this.ganttDebut || !this.ganttFin || this.ganttDebut >= this.ganttFin) return -1;
    const today = Date.now();
    if (today < this.ganttDebut || today > this.ganttFin) return -1;
    return Math.round(((today - this.ganttDebut) / (this.ganttFin - this.ganttDebut)) * 100);
  }

  get ganttMonths(): string[] {
    if (!this.ganttDebut || !this.ganttFin) return [];
    const months: string[] = [];
    const cursor = new Date(this.ganttDebut);
    cursor.setDate(1);
    const end = new Date(this.ganttFin);
    end.setDate(1);
    while (cursor <= end) {
      months.push(cursor.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
  }

  // Permissions
  get peutModifier(): boolean { return this.perms.can('chantier:edit'); }
  get peutAjouterCorpsEtat(): boolean { return this.perms.can('corps_etat:create'); }
  get peutAjouterIntervenant(): boolean { return this.perms.can('chantier:edit'); }
  get peutMettreAJourAvancement(): boolean { return this.perms.can('corps_etat:avancement'); }

  // ── Avancement inline ─────────────────────────────────────────────────────
  editingAvancementId: number | null = null;
  newAvancement = 0;
  newCoutReel   = 0;
  savingAvancement = false;

  ouvrirEditAvancement(ce: CorpsEtat): void {
    this.editingAvancementId = ce.id;
    this.newAvancement = ce.avancement;
    this.newCoutReel   = ce.cout_reel || 0;
  }

  annulerEditAvancement(): void { this.editingAvancementId = null; }

  sauvegarderAvancement(ce: CorpsEtat): void {
    if (!this.chantier) return;
    this.savingAvancement = true;
    this.chantierService.patchAvancement(this.chantier.id, ce.id, this.newAvancement, this.newCoutReel)
      .subscribe({
        next: () => {
          this.savingAvancement    = false;
          this.editingAvancementId = null;
          this.toast.success('Avancement mis à jour.');
          this._charger(this.chantier!.id);
        },
        error: () => {
          this.savingAvancement = false;
          this.toast.error('Erreur lors de la mise à jour.');
        },
      });
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chantierService: ChantierService,
    public  perms: PermissionService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this._charger(id);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private _charger(id: number): void {
    this.subs.add(
      this.chantierService.getById(id).subscribe(chantier => {
        if (!chantier) { this.chantier = null; return; }
        this.chantier = chantier;
        this.corpsEtatList = chantier.corps_etat || [];
        this.intervenants = chantier.intervenants || [];
        this.jalons = this.buildJalonsGantt(chantier.corps_etat || []);
      })
    );
  }

  // ── Gantt ────────────────────────────────────────────────────────────────

  private buildJalonsGantt(corps: CorpsEtat[]): JalonGantt[] {
    if (!corps.length) return [];

    const dates = corps.filter(ce => ce.date_debut_prevue).map(ce => new Date(ce.date_debut_prevue).getTime());
    const fins  = corps.filter(ce => ce.date_fin_prevue).map(ce => new Date(ce.date_fin_prevue).getTime());

    if (!dates.length || !fins.length) return [];

    const debut_global  = Math.min(...dates);
    const fin_globale   = Math.max(...fins);
    const duree_totale  = fin_globale - debut_global;
    this.ganttDebut = debut_global;
    this.ganttFin   = fin_globale;

    return corps
      .filter(ce => ce.date_debut_prevue && ce.date_fin_prevue)
      .map(ce => {
        const debut  = new Date(ce.date_debut_prevue).getTime();
        const fin    = new Date(ce.date_fin_prevue).getTime();
        const offset = Math.round(((debut - debut_global) / duree_totale) * 100);
        const duree  = Math.max(2, Math.round(((fin - debut) / duree_totale) * 100));
        const couleur = ce.avancement === 100 ? '#48bb78'
                      : ce.statut === 'en_cours' ? '#E8520A'
                      : '#e53e3e';
        return { id: ce.id, nom: ce.nom, date_debut: ce.date_debut_prevue, date_fin: ce.date_fin_prevue, avancement: ce.avancement, couleur, offset, duree };
      });
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get montant_marche_contrat(): number { return this.chantier?.montant_marche || 0; }

  getAvancementGlobal(): number {
    if (!this.corpsEtatList.length) return this.chantier?.avancement_global || 0;
    return Math.round(this.corpsEtatList.reduce((sum, ce) => sum + (ce.part_chantier * ce.avancement) / 100, 0));
  }

  getTotalBudgetAlloue(): number { return this.corpsEtatList.reduce((sum, ce) => sum + (ce.budget_alloue || 0), 0); }
  getTotalCoutReel(): number     { return this.corpsEtatList.reduce((sum, ce) => sum + (ce.cout_reel    || 0), 0); }

  // ── Jalons ────────────────────────────────────────────────────────────────

  get jalonsList(): Jalon[] { return this.chantier?.planning?.jalons || []; }
  get peutGererJalons(): boolean { return this.perms.can('planning:edit'); }

  showModalJalon  = false;
  isLoadingJalon  = false;
  erreurJalon     = '';
  formJalon = { nom_jalon: '', date_prevue: '' };

  ouvrirAjoutJalon(): void {
    this.formJalon  = { nom_jalon: '', date_prevue: '' };
    this.erreurJalon = '';
    this.showModalJalon = true;
  }
  fermerJalon(): void { this.showModalJalon = false; }

  validerJalon(): void {
    if (!this.chantier) return;
    if (!this.formJalon.nom_jalon.trim()) { this.erreurJalon = 'Le nom est obligatoire.'; return; }
    if (!this.formJalon.date_prevue) { this.erreurJalon = 'La date est obligatoire.'; return; }
    this.isLoadingJalon = true;
    this.erreurJalon    = '';
    this.chantierService.ajouterJalon(this.chantier.id, this.formJalon).subscribe({
      next: () => {
        this.isLoadingJalon = false;
        this.showModalJalon = false;
        this.toast.success('Jalon ajouté.');
        this._charger(this.chantier!.id);
      },
      error: (err: any) => {
        this.isLoadingJalon = false;
        this.erreurJalon = err?.error?.message || 'Erreur lors de la création.';
      },
    });
  }

  majStatutJalon(jalon: Jalon, statut: 'atteint' | 'manque'): void {
    if (!this.chantier) return;
    const date_reelle = statut === 'atteint' ? new Date().toISOString().split('T')[0] : undefined;
    this.chantierService.majJalon(this.chantier.id, jalon.id, statut, date_reelle).subscribe({
      next: () => {
        this.toast.success(statut === 'atteint' ? 'Jalon atteint !' : 'Jalon marqué manqué.');
        this._charger(this.chantier!.id);
      },
      error: () => this.toast.error('Erreur lors de la mise à jour.'),
    });
  }

  getJalonIcon(statut: string): string {
    return statut === 'atteint' ? 'check_circle' : statut === 'manque' ? 'cancel' : 'radio_button_unchecked';
  }
  getJalonColor(statut: string): string {
    return statut === 'atteint' ? '#48bb78' : statut === 'manque' ? '#e53e3e' : '#6B6B67';
  }
  jalonRetard(ecart: number | undefined): boolean { return (ecart ?? 0) > 0; }
  jalonAvance(ecart: number | undefined): boolean { return (ecart ?? 0) < 0; }
  jalonSigne(ecart: number | undefined): string   { return (ecart ?? 0) > 0 ? '+' : ''; }

  // ── Affichage ────────────────────────────────────────────────────────────

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_cours: 'En cours', termine: 'Terminé', suspendu: 'Suspendu',
      cloture: 'Clôturé', en_attente: 'En attente'
    };
    return labels[statut] || statut;
  }

  getAvancementColor(avancement: number): string {
    if (avancement >= 80) return '#48bb78';
    if (avancement >= 40) return '#E8520A';
    return '#e53e3e';
  }

  formatMontant(montant: number): string {
    if (!montant) return '—';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  getRetardJours(): number {
    if (!this.chantier?.date_livraison_prevue) return 0;
    const prevue = new Date(this.chantier.date_livraison_prevue).getTime();
    const aujourd_hui = Date.now();
    if (aujourd_hui <= prevue) return 0;
    return Math.floor((aujourd_hui - prevue) / (1000 * 60 * 60 * 24));
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  retour(): void { this.router.navigate(['/chantiers']); }

  voirDocuments(): void {
    this.router.navigate(['/documents'], { queryParams: { chantier: this.chantier?.id } });
  }

  allerCloture(): void {
    this.router.navigate(['/chantiers', this.chantier?.id, 'cloture']);
  }

  get peutCloturerChantier(): boolean {
    if (!this.chantier) return false;
    return this.chantier.avancement_global >= 100 || this.chantier.statut === 'termine';
  }

  // ── Modal : modifier chantier ─────────────────────────────────────────────

  showModalModifier  = false;
  isLoadingModifier  = false;
  successModifier    = false;
  formModifier = { nom_chantier: '', localisation: '', chef_chantier: '' };

  ouvrirModifier(): void {
    if (!this.chantier) return;
    this.formModifier = {
      nom_chantier:  this.chantier.nom_chantier,
      localisation:  this.chantier.localisation,
      chef_chantier: this.chantier.chef_chantier,
    };
    this.showModalModifier = true;
    this.successModifier   = false;
  }

  fermerModifier(): void { this.showModalModifier = false; }

  validerModifier(): void {
    if (!this.chantier || !this.formModifier.nom_chantier || !this.formModifier.localisation) return;
    this.isLoadingModifier = true;
    this.chantierService.modifier(this.chantier.id, this.formModifier).subscribe({
      next: () => {
        this.isLoadingModifier = false;
        this.successModifier   = true;
        this.chantier = { ...this.chantier!, ...this.formModifier };
        this.toast.success('Chantier mis à jour.');
        setTimeout(() => { this.showModalModifier = false; this.successModifier = false; }, 1200);
      },
      error: () => {
        this.isLoadingModifier = false;
        this.toast.error('Erreur lors de la mise à jour.');
      },
    });
  }

  // ── Modal : ajouter corps d'état ──────────────────────────────────────────

  showModalCorpsEtat  = false;
  isLoadingCorpsEtat  = false;
  erreurCorpsEtat     = '';
  formCorpsEtat = { nom: '', part_chantier: 0, date_debut_prevue: '', date_fin_prevue: '', budget_alloue: 0 };

  get partRestante(): number {
    const somme = this.corpsEtatList.reduce((s, ce) => s + ce.part_chantier, 0);
    return Math.max(0, 100 - somme);
  }

  ouvrirAjoutCorpsEtat(): void {
    this.formCorpsEtat  = { nom: '', part_chantier: this.partRestante, date_debut_prevue: '', date_fin_prevue: '', budget_alloue: 0 };
    this.erreurCorpsEtat = '';
    this.showModalCorpsEtat = true;
  }

  fermerCorpsEtat(): void { this.showModalCorpsEtat = false; }

  validerCorpsEtat(): void {
    if (!this.chantier) return;
    if (!this.formCorpsEtat.nom.trim()) { this.erreurCorpsEtat = 'Le nom est obligatoire.'; return; }
    if (!this.formCorpsEtat.part_chantier || this.formCorpsEtat.part_chantier <= 0) {
      this.erreurCorpsEtat = 'La part doit être supérieure à 0%.'; return;
    }
    if (this.formCorpsEtat.date_debut_prevue && this.formCorpsEtat.date_fin_prevue &&
        this.formCorpsEtat.date_debut_prevue > this.formCorpsEtat.date_fin_prevue) {
      this.erreurCorpsEtat = 'La date de début doit être avant la date de fin.'; return;
    }
    this.isLoadingCorpsEtat = true;
    this.erreurCorpsEtat    = '';

    this.chantierService.ajouterCorpsEtat(this.chantier.id, {
      nom:               this.formCorpsEtat.nom.trim(),
      part_chantier:     this.formCorpsEtat.part_chantier,
      date_debut_prevue: this.formCorpsEtat.date_debut_prevue || undefined,
      date_fin_prevue:   this.formCorpsEtat.date_fin_prevue   || undefined,
      budget_alloue:     this.formCorpsEtat.budget_alloue     || 0,
    }).subscribe({
      next: () => {
        this.isLoadingCorpsEtat = false;
        this.showModalCorpsEtat = false;
        this.toast.success('Corps d\'état ajouté.');
        this._charger(this.chantier!.id);
      },
      error: (err) => {
        this.isLoadingCorpsEtat = false;
        this.erreurCorpsEtat = err?.error?.message || 'Erreur lors de la création.';
      },
    });
  }

  // ── Modal : ajouter intervenant ───────────────────────────────────────────

  showModalIntervenant  = false;
  isLoadingIntervenant  = false;
  successIntervenant    = false;
  erreurIntervenant     = '';
  formIntervenant = { raison_sociale: '', corps_etat_id: 0, telephone: '', email: '', montant_contrat: 0 };

  ouvrirAjoutIntervenant(corpsEtatId = 0): void {
    this.formIntervenant = { raison_sociale: '', corps_etat_id: corpsEtatId, telephone: '', email: '', montant_contrat: 0 };
    this.erreurIntervenant = '';
    this.showModalIntervenant = true;
    this.successIntervenant   = false;
  }

  fermerIntervenant(): void { this.showModalIntervenant = false; }

  supprimerIntervenant(id: number): void {
    if (!this.chantier) return;
    if (!confirm('Supprimer cet intervenant ? Cette action est irréversible.')) return;
    this.chantierService.supprimerIntervenant(this.chantier.id, id).subscribe({
      next: () => {
        this.intervenants = this.intervenants.filter(i => i.id !== id);
        this.corpsEtatList = this.corpsEtatList.map(ce => ({
          ...ce,
          intervenants: ce.intervenants?.filter(i => i.id !== id),
        }));
        this.toast.success('Intervenant supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer l\'intervenant.'),
    });
  }

  supprimerCorpsEtat(ce: CorpsEtat): void {
    if (!this.chantier) return;
    if (!confirm(`Supprimer le corps d'état "${ce.nom}" ? Cette action est irréversible.`)) return;
    this.chantierService.supprimerCorpsEtat(this.chantier.id, ce.id).subscribe({
      next: () => {
        this.corpsEtatList = this.corpsEtatList.filter(c => c.id !== ce.id);
        this.toast.success('Corps d\'état supprimé.');
      },
      error: () => this.toast.error('Impossible de supprimer le corps d\'état.'),
    });
  }

  validerIntervenant(): void {
    if (!this.chantier) return;
    if (!this.formIntervenant.raison_sociale.trim()) { this.erreurIntervenant = 'La raison sociale est obligatoire.'; return; }
    if (!this.formIntervenant.telephone.trim()) { this.erreurIntervenant = 'Le téléphone est obligatoire.'; return; }
    if (!this.formIntervenant.corps_etat_id) { this.erreurIntervenant = 'Veuillez sélectionner un corps d\'état.'; return; }
    this.isLoadingIntervenant = true;
    this.erreurIntervenant    = '';

    this.chantierService.ajouterIntervenant(this.chantier.id, {
      id_corps_etat:    this.formIntervenant.corps_etat_id,
      type_intervenant: 'entreprise',
      raison_sociale:   this.formIntervenant.raison_sociale.trim(),
      telephone:        this.formIntervenant.telephone.trim(),
      email:            this.formIntervenant.email.trim() || undefined,
      montant_contrat:  this.formIntervenant.montant_contrat || 0,
      assurance:        false,
    }).subscribe({
      next: () => {
        this.isLoadingIntervenant = false;
        this.successIntervenant   = true;
        this.toast.success('Intervenant ajouté.');
        setTimeout(() => { this.showModalIntervenant = false; this.successIntervenant = false; }, 1200);
        this._charger(this.chantier!.id);
      },
      error: (err) => {
        this.isLoadingIntervenant = false;
        this.erreurIntervenant = err?.error?.message || 'Erreur lors de la création.';
      },
    });
  }
}
