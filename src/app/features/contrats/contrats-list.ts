import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { contratsDateOrderValidator } from '../../core/validators/bf-validators';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';
import { ContratService } from '../../core/services/contrat.service';
import { ClientService } from '../../core/services/client.service';
import { Contrat } from '../../core/models';
import { PaginationComponent } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-contrats-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, FormsModule, PaginationComponent],
  templateUrl: './contrats-list.html',
  styleUrl: './contrats-list.scss'
})
export class ContratsList implements OnInit, OnDestroy {

  showModal      = false;
  isLoading      = false;
  successMessage = '';
  errorMessage   = '';
  currentPage    = 1;
  readonly pageSize = 8;

  private _searchQuery = '';
  get searchQuery()          { return this._searchQuery; }
  set searchQuery(v: string) { this._searchQuery = v; this.currentPage = 1; }

  contrats: Contrat[] = [];
  clients: { id: number; nom: string }[] = [];
  private subs = new Subscription();

  contratForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public perm: PermissionService,
    private contratService: ContratService,
    private clientService: ClientService,
  ) {
    this.contratForm = this.fb.group({
      id_client:             ['', Validators.required],
      type_construction:     ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      montant_marche:        ['', [Validators.required, Validators.min(1)]],
      date_signature:        ['', Validators.required],
      date_demarrage_prevue: ['', Validators.required],
      date_livraison_prevue: ['', Validators.required],
      penalites_retard:      ['', [Validators.required, Validators.min(0)]],
    }, { validators: contratsDateOrderValidator });
  }

  ngOnInit(): void {
    this.subs.add(
      this.contratService.getAll().subscribe(contrats => this.contrats = contrats)
    );
    this.subs.add(
      this.clientService.getAll().subscribe(clients =>
        this.clients = clients.map(c => ({
          id:  c.id,
          nom: c.type_client === 'societe'
            ? (c.raison_sociale || '')
            : `${c.nom || ''} ${c.prenom || ''}`.trim(),
        }))
      )
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Filtrage ──────────────────────────────────────────

  private get _allFiltered(): Contrat[] {
    if (!this._searchQuery) return this.contrats;
    const q = this._searchQuery.toLowerCase();
    return this.contrats.filter(c =>
      c.numero_marche.toLowerCase().includes(q) ||
      c.nom_client.toLowerCase().includes(q) ||
      c.type_construction.toLowerCase().includes(q)
    );
  }

  get filteredTotal(): number { return this._allFiltered.length; }

  get filteredContrats(): Contrat[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._allFiltered.slice(start, start + this.pageSize);
  }

  // ── Affichage ─────────────────────────────────────────

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_negociation: 'En négociation',
      signe: 'Signé',
      en_cours: 'En cours',
      suspendu: 'Suspendu',
      termine: 'Terminé',
      resilie: 'Résilié',
      cloture: 'Clôturé'
    };
    return labels[statut] || statut;
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  getNbAvenants(contrat: Contrat): number {
    return contrat.avenants?.length || 0;
  }

  getNbSituations(contrat: Contrat): number {
    return contrat.situations?.length || 0;
  }

  getMontantRevise(contrat: Contrat): number {
    return contrat.montant_marche_revise || contrat.montant_marche;
  }

  hasAvenants(contrat: Contrat): boolean {
    return contrat.montant_marche_revise > contrat.montant_marche;
  }

  // ── Navigation ────────────────────────────────────────

  voirContrat(id: number): void {
    this.router.navigate(['/contrats', id]);
  }

  // ── Modal ─────────────────────────────────────────────

  openModal(): void {
    this.showModal = true;
    this.contratForm.reset();
    this.successMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.successMessage = '';
  }

  onSubmit(): void {
    if (this.contratForm.invalid) return;
    this.isLoading    = true;
    this.errorMessage = '';

    const v = this.contratForm.value;
    this.contratService.creer({
      id_client:             Number(v.id_client),
      type_construction:     v.type_construction,
      montant_marche:        Number(v.montant_marche),
      date_signature:        v.date_signature,
      date_demarrage_prevue: v.date_demarrage_prevue,
      date_livraison_prevue: v.date_livraison_prevue,
      penalites_retard:      Number(v.penalites_retard),
    }).subscribe({
      next: (contrat) => {
        this.isLoading      = false;
        this.successMessage = `Contrat ${contrat.numero_marche} créé avec succès.`;
        this.contratService.getAll().subscribe(list => this.contrats = list);
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err?.error?.message || 'Erreur lors de la création du contrat.';
      },
    });
  }

  // ── Getters formulaire ────────────────────────────────

  get id_client() { return this.contratForm.get('id_client'); }
  get type_construction() { return this.contratForm.get('type_construction'); }
  get montant_marche() { return this.contratForm.get('montant_marche'); }
  get date_signature() { return this.contratForm.get('date_signature'); }
  get date_demarrage_prevue() { return this.contratForm.get('date_demarrage_prevue'); }
  get date_livraison_prevue() { return this.contratForm.get('date_livraison_prevue'); }
  get penalites_retard() { return this.contratForm.get('penalites_retard'); }
}