import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { phoneValidator, isEmailValide, isTelValide } from '../../core/validators/bf-validators';
import { DigitsOnlyDirective } from '../../core/directives/digits-only.directive';
import { CanPipe } from '../../core/pipes/can.pipe';
import { PermissionService } from '../../core/services/permission.service';
import { ClientService } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import { Client } from '../../core/models';
import { PaginationComponent } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, FormsModule, CanPipe, PaginationComponent, DigitsOnlyDirective],
  templateUrl: './clients-list.html',
  styleUrl: './clients-list.scss'
})
export class ClientsList implements OnInit {

  showModal      = false;
  isLoading      = false;
  successMessage = '';
  errorMessage   = '';
  currentPage    = 1;
  readonly pageSize = 12;

  // Voir / Modifier
  selectedClient:    Client | null = null;
  showModalVoir      = false;
  showModalModifier  = false;
  isLoadingModifier  = false;
  successModifier    = false;
  errorModifier      = '';
  formModifier = { type_client: '', nom: '', prenom: '', raison_sociale: '', telephone: '', email: '', adresse: '' };

  private _searchQuery = '';
  get searchQuery()          { return this._searchQuery; }
  set searchQuery(v: string) { this._searchQuery = v; this.currentPage = 1; }

  clients: Client[] = [];
  clientForm: FormGroup;

  constructor(
    private fb:            FormBuilder,
    public  perm:          PermissionService,
    private clientService: ClientService,
    private toast:         ToastService,
  ) {
    this.clientForm = this.fb.group({
      type:           ['particulier', Validators.required],
      nom:            ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      prenom:         ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      raison_sociale: ['', [Validators.minLength(2), Validators.maxLength(150)]],
      telephone:      ['', [Validators.required, phoneValidator]],
      email:          ['', [Validators.required, Validators.email]],
      adresse:        ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    });
    this.clientForm.get('type')!.valueChanges.subscribe(t => this.updateValidateurs(t));
  }

  ngOnInit(): void {
    this.chargerClients();
  }

  private chargerClients(): void {
    this.clientService.getAll().subscribe(clients => this.clients = clients);
  }

  private updateValidateurs(type: string): void {
    const nom    = this.clientForm.get('nom')!;
    const prenom = this.clientForm.get('prenom')!;
    const rs     = this.clientForm.get('raison_sociale')!;
    if (type === 'societe') {
      nom.clearValidators(); prenom.clearValidators();
      rs.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(150)]);
    } else {
      nom.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(100)]);
      prenom.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(100)]);
      rs.clearValidators();
    }
    [nom, prenom, rs].forEach(c => c.updateValueAndValidity());
  }

  private get _allFiltered(): Client[] {
    if (!this._searchQuery) return this.clients;
    const q = this._searchQuery.toLowerCase();
    return this.clients.filter(c =>
      (c.nom || '').toLowerCase().includes(q) ||
      (c.prenom || '').toLowerCase().includes(q) ||
      (c.raison_sociale || '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }

  get filteredTotal(): number { return this._allFiltered.length; }

  get filteredClients(): Client[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this._allFiltered.slice(start, start + this.pageSize);
  }

  getClientNom(c: any): string {
    return c.type_client === 'societe'
      ? (c.raison_sociale || '')
      : `${c.nom || ''} ${c.prenom || ''}`.trim();
  }

  getInitiales(c: any): string {
    if (c.type_client === 'societe') return (c.raison_sociale || '??').substring(0, 2).toUpperCase();
    return `${(c.nom || '?')[0]}${(c.prenom || '?')[0]}`.toUpperCase();
  }

  openModal(): void {
    this.showModal = true;
    this.clientForm.reset({ type: 'particulier' });
    this.updateValidateurs('particulier');
    this.successMessage = '';
    this.errorMessage   = '';
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSubmit(): void {
    if (this.clientForm.invalid) return;
    this.isLoading    = true;
    this.errorMessage = '';

    const v = this.clientForm.value;
    this.clientService.ajouter({
      type_client:    v.type,
      nom:            v.nom   || undefined,
      prenom:         v.prenom || undefined,
      raison_sociale: v.raison_sociale || undefined,
      telephone:      v.telephone,
      email:          v.email,
      adresse:        v.adresse,
    }).subscribe({
      next: () => {
        this.isLoading     = false;
        this.successMessage = `Client "${this.getClientNom({ ...v, type_client: v.type })}" créé avec succès.`;
        this.chargerClients();
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err?.error?.message || 'Erreur lors de la création du client.';
      },
    });
  }

  get typeClient()     { return this.clientForm.get('type'); }
  get nom()            { return this.clientForm.get('nom'); }
  get prenom()         { return this.clientForm.get('prenom'); }
  get raison_sociale() { return this.clientForm.get('raison_sociale'); }
  get telephone()      { return this.clientForm.get('telephone'); }
  get email()          { return this.clientForm.get('email'); }
  get adresse()        { return this.clientForm.get('adresse'); }

  // ── Voir ──────────────────────────────────────────────────
  voirClient(c: Client): void {
    this.selectedClient = c;
    this.showModalVoir  = true;
  }
  fermerVoir(): void { this.showModalVoir = false; this.selectedClient = null; }

  // ── Modifier ──────────────────────────────────────────────
  ouvrirModifier(c: Client): void {
    this.selectedClient   = c;
    this.formModifier     = {
      type_client:    c.type_client,
      nom:            c.nom    || '',
      prenom:         c.prenom || '',
      raison_sociale: c.raison_sociale || '',
      telephone:      c.telephone,
      email:          c.email,
      adresse:        c.adresse || '',
    };
    this.errorModifier   = '';
    this.successModifier = false;
    this.showModalModifier = true;
  }

  fermerModifier(): void { this.showModalModifier = false; this.selectedClient = null; }

  // ── Supprimer ─────────────────────────────────────────────
  showModalSupprimer = false;
  clientASupprimer: Client | null = null;

  supprimerClient(c: Client): void {
    if ((c.nb_contrats ?? 0) > 0) {
      this.toast.error('Impossible de supprimer un client ayant des contrats associés.');
      return;
    }
    this.clientASupprimer = c;
    this.showModalSupprimer = true;
  }

  annulerSupprimer(): void {
    this.showModalSupprimer = false;
    this.clientASupprimer = null;
  }

  confirmerSupprimer(): void {
    if (!this.clientASupprimer) return;
    const c = this.clientASupprimer;
    this.clientService.supprimer(c.id).subscribe({
      next: () => {
        this.toast.success('Client supprimé.');
        this.chargerClients();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Erreur lors de la suppression du client.');
      },
    });
    this.annulerSupprimer();
  }

  validerModifier(): void {
    if (!this.selectedClient) return;
    if (!this.formModifier.telephone || !this.formModifier.email) {
      this.errorModifier = 'Téléphone et email sont obligatoires.'; return;
    }
    if (!isTelValide(this.formModifier.telephone)) {
      this.errorModifier = 'Numéro de téléphone invalide (10 chiffres).'; return;
    }
    if (!isEmailValide(this.formModifier.email)) {
      this.errorModifier = 'Adresse email invalide.'; return;
    }
    this.isLoadingModifier = true;
    this.errorModifier     = '';

    this.clientService.modifier(this.selectedClient.id, {
      ...this.formModifier,
      type_client: this.formModifier.type_client as Client['type_client'],
    }).subscribe({
      next: () => {
        this.isLoadingModifier = false;
        this.successModifier   = true;
        this.chargerClients();
        setTimeout(() => { this.showModalModifier = false; this.successModifier = false; }, 1200);
      },
      error: (err) => {
        this.isLoadingModifier = false;
        this.errorModifier = err?.error?.message || 'Erreur lors de la mise à jour.';
      },
    });
  }
}
