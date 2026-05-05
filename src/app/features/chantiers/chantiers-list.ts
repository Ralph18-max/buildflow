import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';
import { CanPipe } from '../../core/pipes/can.pipe';
import { ChantierService } from '../../core/services/chantier.service';
import { Chantier } from '../../core/models';
import { ContratService } from '../../core/services/contrat.service';

@Component({
  selector: 'app-chantiers-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, CanPipe],
  templateUrl: './chantiers-list.html',
  styleUrl: './chantiers-list.scss'
})
export class ChantiersList implements OnInit, OnDestroy {

  activeTab: string = 'tous';
  searchQuery: string = '';
  showModal: boolean = false;

  chantiers: Chantier[] = [];
  contratsOptions: { id: number; label: string }[] = [];

  private subs = new Subscription();

  nouveauChantier = {
    nom: '',
    localisation: '',
    contrat_id: null as number | null,
    chef_chantier: '',
    date_debut: '',
    date_fin_prevue: '',
    description: ''
  };

  constructor(
    private router: Router,
    public perm: PermissionService,
    private chantierService: ChantierService,
    private contratService: ContratService
  ) {}

  ngOnInit(): void {
    // Branchement sur ChantierService — filtrage par rôle automatique
    this.subs.add(
      this.chantierService.getAll().subscribe(chantiers => {
        this.chantiers = chantiers;
      })
    );

    // Options contrats pour le modal de création
    this.subs.add(
      this.contratService.getOptions().subscribe(options => {
        this.contratsOptions = options;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Filtrage ──────────────────────────────────────────────

  get filteredChantiers(): Chantier[] {
    let list = this.chantiers;

    if (this.activeTab !== 'tous') {
      list = list.filter(c => c.statut === this.activeTab);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c =>
        c.nom_chantier.toLowerCase().includes(q) ||
        c.localisation.toLowerCase().includes(q) ||
        (c.nom_client || '').toLowerCase().includes(q)
      );
    }

    return list;
  }

  getCount(statut: string): number {
    if (statut === 'tous') return this.chantiers.length;
    return this.chantiers.filter(c => c.statut === statut).length;
  }

  // ── Affichage ─────────────────────────────────────────────

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'suspendu': 'Suspendu',
      'cloture': 'Clôturé'
    };
    return labels[statut] || statut;
  }

  getAvancementColor(avancement: number): string {
    if (avancement >= 80) return '#22c55e';
    if (avancement >= 40) return '#E8520A';
    return '#ef4444';
  }

  formatBudget(montant: number | undefined): string {
    if (!montant) return '—';
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  // ── Navigation ────────────────────────────────────────────

  voirChantier(id: number): void {
    this.router.navigate(['/chantiers', id]);
  }

  // ── Modal création ────────────────────────────────────────

  ouvrirModal(): void {
    if (!this.perm.can('chantiers:create')) return;
    this.showModal = true;
  }

  fermerModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  resetForm(): void {
    this.nouveauChantier = {
      nom: '', localisation: '', contrat_id: null,
      chef_chantier: '', date_debut: '', date_fin_prevue: '', description: ''
    };
  }

  creerChantier(): void {
    if (!this.perm.can('chantiers:create')) return;
    if (!this.nouveauChantier.nom || !this.nouveauChantier.localisation) return;

    // En Sprint 8 : POST /api/chantiers → service met à jour le BehaviorSubject
    // Pour l'instant : ajout local via le service
    this.chantierService.ajouter({
      nom_chantier: this.nouveauChantier.nom,
      localisation: this.nouveauChantier.localisation,
      chef_chantier: this.nouveauChantier.chef_chantier || 'Non assigné',
      date_demarrage_reelle: this.nouveauChantier.date_debut,
      date_livraison_prevue: this.nouveauChantier.date_fin_prevue,
      description: this.nouveauChantier.description,
      id_contrat: this.nouveauChantier.contrat_id || 0,
      statut: 'en_cours',
      avancement_global: 0,
      corps_etat: [],
      intervenants: []
    });

    this.fermerModal();
  }
}