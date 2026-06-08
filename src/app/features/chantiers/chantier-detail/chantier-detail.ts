import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass, SlicePipe, DatePipe } from '@angular/common';
import { isEmailValide, isTelValide } from '../../../core/validators/bf-validators';
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
  imports: [NgFor, NgIf, NgClass, FormsModule, SlicePipe, DatePipe, CanPipe, BudgetS0Component],
  templateUrl: './chantier-detail.html',
  styleUrl: './chantier-detail.scss'
})
export class ChantierDetail implements OnInit, OnDestroy {

  activeTab = 'resume';
  chantier: Chantier | null = null;
  corpsEtatList: CorpsEtat[] = [];
  intervenants: Intervenant[] = [];

  private subs = new Subscription();

  // Gantt — la timeline est rendue comme une grille de mois de largeur égale
  // (voir gantt-months / [grid-template-columns]) ; toute position (barres, "Auj.")
  // doit donc être exprimée dans la même unité — une fraction de mois depuis le
  // 1er jour du mois de départ — sinon les barres se décalent par rapport à l'en-tête.
  //
  // On travaille uniquement sur la chaîne "YYYY-MM-DD" (jamais via `new Date(iso).getDate()`) :
  // un ISO sans heure est interprété en UTC par `Date`, et les accesseurs locaux
  // (getDate/getMonth) peuvent alors renvoyer le jour précédent selon le fuseau du
  // navigateur — un décalage classique qui fausserait le positionnement des barres.
  jalons: JalonGantt[] = [];
  private ganttOriginYear  = 0;  // année du premier mois affiché
  private ganttOriginMonth = 0;  // mois du premier mois affiché (1 = janvier)
  private ganttTotalMonths = 0;  // nombre de colonnes-mois affichées

  private monthPosition(dateStr: string): number {
    const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
    const joursDansLeMois = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return (y - this.ganttOriginYear) * 12 + (m - this.ganttOriginMonth) + (d - 1) / joursDansLeMois;
  }

  get todayOffset(): number {
    if (!this.ganttOriginYear || !this.ganttTotalMonths) return -1;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const pos = this.monthPosition(todayStr);
    if (pos < 0 || pos > this.ganttTotalMonths) return -1;
    return Math.round((pos / this.ganttTotalMonths) * 100);
  }

  get ganttMonths(): string[] {
    if (!this.ganttOriginYear || !this.ganttTotalMonths) return [];
    const months: string[] = [];
    for (let i = 0; i < this.ganttTotalMonths; i++) {
      const idx   = (this.ganttOriginMonth - 1) + i;  // index 0 = janvier
      const year  = this.ganttOriginYear + Math.floor(idx / 12);
      const month = ((idx % 12) + 12) % 12;           // 0-indexé pour Date.UTC
      months.push(new Date(Date.UTC(year, month, 1)).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit', timeZone: 'UTC' }));
    }
    return months;
  }

  // Permissions
  get peutModifier(): boolean { return this.perms.can('chantiers:edit'); }
  get peutAjouterCorpsEtat(): boolean { return this.perms.can('corps_etat:create'); }
  get peutAjouterIntervenant(): boolean { return this.perms.can('chantiers:edit'); }
  get peutMettreAJourAvancement(): boolean { return this.perms.can('corps_etat:avancement'); }
  get peutSupprimerCorpsEtat(): boolean { return this.perms.can('corps_etat:delete'); }

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

    const debuts = corps.filter(ce => ce.date_debut_prevue).map(ce => ce.date_debut_prevue.slice(0, 10));
    const fins   = corps.filter(ce => ce.date_fin_prevue).map(ce => ce.date_fin_prevue.slice(0, 10));

    if (!debuts.length || !fins.length) return [];

    // Comparaison lexicographique valide sur des chaînes ISO "YYYY-MM-DD"
    const debut_global = debuts.reduce((a, b) => (a < b ? a : b));
    const fin_globale  = fins.reduce((a, b) => (a > b ? a : b));

    // Origine de la grille = 1er jour du mois de la date de début la plus ancienne
    // (c'est aussi le 1er mois affiché par ganttMonths — les deux DOIVENT partager
    // la même origine, sinon les barres se décalent par rapport à l'en-tête).
    const [originYear, originMonth] = debut_global.split('-').map(Number);
    const [finYear, finMonth]       = fin_globale.split('-').map(Number);

    this.ganttOriginYear  = originYear;
    this.ganttOriginMonth = originMonth;
    this.ganttTotalMonths = (finYear - originYear) * 12 + (finMonth - originMonth) + 1;

    return corps
      .filter(ce => ce.date_debut_prevue && ce.date_fin_prevue)
      .map(ce => {
        const posDebut = this.monthPosition(ce.date_debut_prevue);
        const posFin   = this.monthPosition(ce.date_fin_prevue);
        const offset = (posDebut / this.ganttTotalMonths) * 100;
        const duree  = Math.max(2, ((posFin - posDebut) / this.ganttTotalMonths) * 100);
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

  fmtDate(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
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
  formModifier = { nom_chantier: '', localisation: '', chef_chantier: '', date_demarrage_reelle: '', date_livraison_prevue: '' };

  ouvrirModifier(): void {
    if (!this.chantier) return;
    this.formModifier = {
      nom_chantier:          this.chantier.nom_chantier,
      localisation:          this.chantier.localisation,
      chef_chantier:         this.chantier.chef_chantier,
      date_demarrage_reelle: (this.chantier.date_demarrage_reelle || '').slice(0, 10),
      date_livraison_prevue: (this.chantier.date_livraison_prevue  || '').slice(0, 10),
    };
    this.showModalModifier = true;
    this.successModifier   = false;
  }

  fermerModifier(): void { this.showModalModifier = false; }

  validerModifier(): void {
    if (!this.chantier || !this.formModifier.nom_chantier || !this.formModifier.localisation) return;
    if (!this.formModifier.date_livraison_prevue) { this.toast.error('La date de livraison prévue est obligatoire.'); return; }
    this.isLoadingModifier = true;
    this.chantierService.modifier(this.chantier.id, this.formModifier).subscribe({
      next: () => {
        this.isLoadingModifier = false;
        this.successModifier   = true;
        this.chantier = { ...this.chantier!, ...this.formModifier };
        this.toast.success('Chantier mis à jour.');
        setTimeout(() => { this.showModalModifier = false; this.successModifier = false; this._charger(this.chantier!.id); }, 1200);
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

  get dateMinChantier(): string {
    const d = this.chantier?.date_demarrage_reelle || this.chantier?.contrat?.date_demarrage_prevue || '';
    return d.slice(0, 10);
  }
  get dateMaxChantier(): string {
    return (this.chantier?.date_livraison_prevue || '').slice(0, 10);
  }

  validerCorpsEtat(): void {
    if (!this.chantier) return;
    if (!this.formCorpsEtat.nom.trim()) { this.erreurCorpsEtat = 'Le nom est obligatoire.'; return; }
    if (this.formCorpsEtat.nom.trim().length < 2) { this.erreurCorpsEtat = 'Le nom doit contenir au moins 2 caractères.'; return; }
    if (!this.formCorpsEtat.part_chantier || this.formCorpsEtat.part_chantier <= 0) {
      this.erreurCorpsEtat = 'La part doit être supérieure à 0%.'; return;
    }
    if (this.formCorpsEtat.part_chantier > 100) {
      this.erreurCorpsEtat = 'La part ne peut pas dépasser 100%.'; return;
    }
    if (!this.formCorpsEtat.budget_alloue || this.formCorpsEtat.budget_alloue <= 0) {
      this.erreurCorpsEtat = 'Le budget alloué est obligatoire et doit être supérieur à 0.'; return;
    }
    if (!this.formCorpsEtat.date_debut_prevue) { this.erreurCorpsEtat = 'La date de début prévue est obligatoire.'; return; }
    if (!this.formCorpsEtat.date_fin_prevue)   { this.erreurCorpsEtat = 'La date de fin prévue est obligatoire.'; return; }
    if (this.formCorpsEtat.date_debut_prevue && this.formCorpsEtat.date_fin_prevue &&
        this.formCorpsEtat.date_debut_prevue >= this.formCorpsEtat.date_fin_prevue) {
      this.erreurCorpsEtat = 'La date de début doit être avant la date de fin.'; return;
    }
    const min = this.dateMinChantier;
    const max = this.dateMaxChantier;
    if (min && this.formCorpsEtat.date_debut_prevue && this.formCorpsEtat.date_debut_prevue < min) {
      this.erreurCorpsEtat = `La date de début ne peut pas être avant le démarrage du chantier (${this.fmtDate(min)}).`; return;
    }
    if (max && this.formCorpsEtat.date_fin_prevue && this.formCorpsEtat.date_fin_prevue > max) {
      this.erreurCorpsEtat = `La date de fin ne peut pas dépasser la livraison prévue (${this.fmtDate(max)}).`; return;
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

  showModalConfirmSuppr = false;
  isDeletingCorpsEtat   = false;
  ceASupprimer: CorpsEtat | null = null;

  demanderConfirmSuppr(ce: CorpsEtat): void {
    this.ceASupprimer = ce;
    this.showModalConfirmSuppr = true;
  }

  annulerSuppr(): void {
    this.showModalConfirmSuppr = false;
    this.ceASupprimer = null;
  }

  confirmerSuppr(): void {
    if (!this.chantier || !this.ceASupprimer) return;
    this.isDeletingCorpsEtat = true;
    this.chantierService.supprimerCorpsEtat(this.chantier.id, this.ceASupprimer.id).subscribe({
      next: () => {
        this.corpsEtatList = this.corpsEtatList.filter(c => c.id !== this.ceASupprimer!.id);
        this.isDeletingCorpsEtat   = false;
        this.showModalConfirmSuppr = false;
        this.ceASupprimer = null;
        this.toast.success('Corps d\'état supprimé.');
      },
      error: () => {
        this.isDeletingCorpsEtat = false;
        this.toast.error('Impossible de supprimer le corps d\'état.');
      },
    });
  }

  supprimerCorpsEtat(ce: CorpsEtat): void { this.demanderConfirmSuppr(ce); }

  validerIntervenant(): void {
    if (!this.chantier) return;
    if (!this.formIntervenant.raison_sociale.trim()) { this.erreurIntervenant = 'La raison sociale est obligatoire.'; return; }
    if (this.formIntervenant.raison_sociale.trim().length < 2) { this.erreurIntervenant = 'La raison sociale doit contenir au moins 2 caractères.'; return; }
    if (!this.formIntervenant.telephone.trim()) { this.erreurIntervenant = 'Le téléphone est obligatoire.'; return; }
    if (!isTelValide(this.formIntervenant.telephone)) { this.erreurIntervenant = 'Numéro de téléphone invalide (8 à 15 chiffres).'; return; }
    if (this.formIntervenant.email && !isEmailValide(this.formIntervenant.email)) { this.erreurIntervenant = 'Adresse email invalide.'; return; }
    if (this.formIntervenant.montant_contrat < 0) { this.erreurIntervenant = 'Le montant du contrat ne peut pas être négatif.'; return; }
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
