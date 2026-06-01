import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';
import { CanPipe } from '../../core/pipes/can.pipe';
import { ChantierService } from '../../core/services/chantier.service';
import { Chantier, Utilisateur } from '../../core/models';
import { ContratService } from '../../core/services/contrat.service';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { PaginationComponent } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-chantiers-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, CanPipe, PaginationComponent],
  templateUrl: './chantiers-list.html',
  styleUrl: './chantiers-list.scss'
})
export class ChantiersList implements OnInit, OnDestroy {

  activeTab:   string = 'tous';
  showModal:   boolean = false;
  currentPage  = 1;
  readonly pageSize = 9;

  private _searchQuery = '';
  get searchQuery()        { return this._searchQuery; }
  set searchQuery(v: string) { this._searchQuery = v; this.currentPage = 1; }

  chantiers: Chantier[] = [];
  contratsOptions: { id: number; label: string }[] = [];
  utilisateurs: Utilisateur[] = [];

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
    private contratService: ContratService,
    private utilisateurService: UtilisateurService,
  ) {}

  ngOnInit(): void {
    this._chargerChantiers();
    this.subs.add(
      this.contratService.getOptions().subscribe(options => {
        this.contratsOptions = options;
      })
    );
    this.subs.add(
      this.utilisateurService.getAll().subscribe(users => {
        this.utilisateurs = users.filter(u => u.actif);
      })
    );
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin:         'Admin',
      conducteur:    'Conducteur',
      chef_chantier: 'Chef de chantier',
      comptable:     'Comptable',
    };
    return labels[role] || role;
  }

  private _chargerChantiers(): void {
    this.subs.add(
      this.chantierService.getAll().subscribe(chantiers => this.chantiers = chantiers)
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Filtrage ──────────────────────────────────────────────

  private get _allFiltered(): Chantier[] {
    let list = this.chantiers;
    if (this.activeTab !== 'tous') list = list.filter(c => c.statut === this.activeTab);
    if (this._searchQuery) {
      const q = this._searchQuery.toLowerCase();
      list = list.filter(c =>
        c.nom_chantier.toLowerCase().includes(q) ||
        c.localisation.toLowerCase().includes(q) ||
        (c.nom_client || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get filteredTotal(): number { return this._allFiltered.length; }

  get filteredChantiers(): Chantier[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._allFiltered.slice(start, start + this.pageSize);
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

  erreurChantier = '';

  creerChantier(): void {
    if (!this.perm.can('chantiers:create')) return;
    this.erreurChantier = '';
    if (!this.nouveauChantier.nom.trim() || !this.nouveauChantier.localisation.trim()) {
      this.erreurChantier = 'Le nom et la localisation sont obligatoires.'; return;
    }
    if (this.nouveauChantier.nom.trim().length < 2) {
      this.erreurChantier = 'Le nom doit contenir au moins 2 caractères.'; return;
    }
    if (this.nouveauChantier.date_debut && this.nouveauChantier.date_fin_prevue &&
        this.nouveauChantier.date_debut >= this.nouveauChantier.date_fin_prevue) {
      this.erreurChantier = 'La date de fin doit être après la date de début.'; return;
    }

    this.subs.add(
      this.chantierService.ajouter({
        nom_chantier:          this.nouveauChantier.nom,
        localisation:          this.nouveauChantier.localisation,
        chef_chantier:         this.nouveauChantier.chef_chantier || 'Non assigné',
        date_livraison_prevue: this.nouveauChantier.date_fin_prevue,
        description:           this.nouveauChantier.description,
        id_contrat:            this.nouveauChantier.contrat_id || 0,
      }).subscribe({
        next: () => {
          this.fermerModal();
          this._chargerChantiers();
        },
      })
    );
  }
}