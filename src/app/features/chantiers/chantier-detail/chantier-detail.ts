import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BudgetS0Component } from '../../budget/budget';
import { ChantierService } from '../../../core/services/chantier.service';
import { Chantier, CorpsEtat, Intervenant } from '../../../core/models';

// Interface locale pour le Gantt — pas dans models car c'est purement visuel
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
  imports: [NgFor, NgIf, NgClass, BudgetS0Component],
  templateUrl: './chantier-detail.html',
  styleUrl: './chantier-detail.scss'
})
export class ChantierDetail implements OnInit, OnDestroy {

  activeTab = 'resume';
  chantier: Chantier | null = null;
  corpsEtatList: CorpsEtat[] = [];
  intervenants: Intervenant[] = [];

  private subs = new Subscription();

  // Gantt — données visuelles calculées depuis les corps d'état
  jalons: JalonGantt[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chantierService: ChantierService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.subs.add(
      this.chantierService.getById(id).subscribe(chantier => {
        if (!chantier) {
          this.chantier = null;
          return;
        }
        this.chantier = chantier;
        this.corpsEtatList = chantier.corps_etat || [];
        this.intervenants = chantier.intervenants || [];
        this.jalons = this.buildJalonsGantt(chantier.corps_etat || []);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Gantt — construit les barres visuelles depuis les corps d'état ──────
  private buildJalonsGantt(corps: CorpsEtat[]): JalonGantt[] {
    if (!corps.length) return [];

    // Trouver la plage de dates globale
    const dates = corps
      .filter(ce => ce.date_debut_prevue)
      .map(ce => new Date(ce.date_debut_prevue).getTime());
    const fins = corps
      .filter(ce => ce.date_fin_prevue)
      .map(ce => new Date(ce.date_fin_prevue).getTime());

    if (!dates.length || !fins.length) return [];

    const debut_global = Math.min(...dates);
    const fin_globale = Math.max(...fins);
    const duree_totale = fin_globale - debut_global;

    return corps
      .filter(ce => ce.date_debut_prevue && ce.date_fin_prevue)
      .map(ce => {
        const debut = new Date(ce.date_debut_prevue).getTime();
        const fin = new Date(ce.date_fin_prevue).getTime();
        const offset = Math.round(((debut - debut_global) / duree_totale) * 100);
        const duree = Math.max(2, Math.round(((fin - debut) / duree_totale) * 100));
        const couleur = ce.avancement === 100 ? '#48bb78'
                      : ce.statut === 'en_cours' ? '#E8520A'
                      : '#e53e3e';

        return {
          id: ce.id,
          nom: ce.nom,
          date_debut: ce.date_debut_prevue,
          date_fin: ce.date_fin_prevue,
          avancement: ce.avancement,
          couleur,
          offset,
          duree
        };
      });
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get montant_marche_contrat(): number {
    return this.chantier?.montant_marche || 0;
  }

  getAvancementGlobal(): number {
    if (!this.corpsEtatList.length) return this.chantier?.avancement_global || 0;
    return Math.round(
      this.corpsEtatList.reduce((sum, ce) => sum + (ce.part_chantier * ce.avancement) / 100, 0)
    );
  }

  getTotalBudgetAlloue(): number {
    return this.corpsEtatList.reduce((sum, ce) => sum + (ce.budget_alloue || 0), 0);
  }

  getTotalCoutReel(): number {
    return this.corpsEtatList.reduce((sum, ce) => sum + (ce.cout_reel || 0), 0);
  }

  // ── Affichage ────────────────────────────────────────────────────────────

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_cours: 'En cours',
      termine: 'Terminé',
      suspendu: 'Suspendu',
      cloture: 'Clôturé',
      en_attente: 'En attente'
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

  retour(): void {
    this.router.navigate(['/chantiers']);
  }

  voirDocuments(): void {
    this.router.navigate(['/documents'], {
      queryParams: { chantier: this.chantier?.id }
    });
  }
}