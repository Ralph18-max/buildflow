import { Component } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-contrats-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, FormsModule],
  templateUrl: './contrats-list.html',
  styleUrl: './contrats-list.scss'
})
export class ContratsList {

  showModal = false;
  searchQuery = '';
  isLoading = false;
  successMessage = '';

  contratForm: FormGroup;

  clients = [
    { id: 1, nom: 'Konan Yves' },
    { id: 2, nom: 'SCI Les Palmiers' },
    { id: 3, nom: 'Diabaté Moussa' },
    { id: 4, nom: 'Groupe Immobilier du Sud' },
  ];

  contrats = [
    {
      id: 1, numero_marche: 'MRC-2024-001',
      client: 'SCI Les Palmiers',
      type_construction: 'Immeuble R+4',
      montant: '820 000 000',
      date_signature: '15/01/2024',
      date_demarrage: '01/03/2024',
      date_livraison: '28/02/2026',
      statut: 'en_cours',
      penalites: '500 000'
    },
    {
      id: 2, numero_marche: 'MRC-2024-002',
      client: 'Konan Yves',
      type_construction: 'Villa Duplex',
      montant: '180 000 000',
      date_signature: '20/03/2024',
      date_demarrage: '15/04/2024',
      date_livraison: '14/04/2025',
      statut: 'termine',
      penalites: '200 000'
    },
    {
      id: 3, numero_marche: 'MRC-2025-001',
      client: 'Groupe Immobilier du Sud',
      type_construction: 'Complexe commercial',
      montant: '1 200 000 000',
      date_signature: '10/01/2025',
      date_demarrage: '01/03/2025',
      date_livraison: '28/02/2027',
      statut: 'en_cours',
      penalites: '1 000 000'
    },
    {
      id: 4, numero_marche: 'MRC-2025-002',
      client: 'Diabaté Moussa',
      type_construction: 'Maison individuelle',
      montant: '95 000 000',
      date_signature: '05/06/2025',
      date_demarrage: '01/08/2025',
      date_livraison: '31/07/2026',
      statut: 'signe',
      penalites: '100 000'
    },
  ];

  constructor(private fb: FormBuilder, private router: Router,public perm: PermissionService) {
    this.contratForm = this.fb.group({
      id_client: ['', Validators.required],
      type_construction: ['', Validators.required],
      montant_marche: ['', Validators.required],
      date_signature: ['', Validators.required],
      date_demarrage_prevue: ['', Validators.required],
      date_livraison_prevue: ['', Validators.required],
      penalites_retard: ['', Validators.required],
    });
  }

  // ─── NAVIGATION ──────────────────────────────────────
  voirContrat(id: number) {
    this.router.navigate(['/contrats', id]);
  }

  // ─── FILTRES ─────────────────────────────────────────
  get filteredContrats() {
    if (!this.searchQuery) return this.contrats;
    const q = this.searchQuery.toLowerCase();
    return this.contrats.filter(c =>
      c.numero_marche.toLowerCase().includes(q) ||
      c.client.toLowerCase().includes(q) ||
      c.type_construction.toLowerCase().includes(q)
    );
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      en_negociation: 'En négociation',
      signe: 'Signé',
      en_cours: 'En cours',
      suspendu: 'Suspendu',
      termine: 'Terminé',
      resilie: 'Résilié'
    };
    return labels[statut] || statut;
  }

  // ─── MODAL ───────────────────────────────────────────
  openModal() {
    this.showModal = true;
    this.contratForm.reset();
    this.successMessage = '';
  }

  closeModal() {
    this.showModal = false;
    this.successMessage = '';
  }

  onSubmit() {
    if (this.contratForm.invalid) return;
    this.isLoading = true;

    setTimeout(() => {
      const v = this.contratForm.value;
      const client = this.clients.find(c => c.id == v.id_client);
      this.contrats.push({
        id: this.contrats.length + 1,
        numero_marche: `MRC-${new Date().getFullYear()}-00${this.contrats.length + 1}`,
        client: client?.nom || '',
        type_construction: v.type_construction,
        montant: v.montant_marche,
        date_signature: v.date_signature,
        date_demarrage: v.date_demarrage_prevue,
        date_livraison: v.date_livraison_prevue,
        statut: 'en_negociation',
        penalites: v.penalites_retard
      });
      this.isLoading = false;
      this.successMessage = `Contrat ${this.contrats[this.contrats.length-1].numero_marche} créé avec succès.`;
    }, 1000);
  }

  get id_client() { return this.contratForm.get('id_client'); }
  get type_construction() { return this.contratForm.get('type_construction'); }
  get montant_marche() { return this.contratForm.get('montant_marche'); }
  get date_signature() { return this.contratForm.get('date_signature'); }
  get date_demarrage_prevue() { return this.contratForm.get('date_demarrage_prevue'); }
  get date_livraison_prevue() { return this.contratForm.get('date_livraison_prevue'); }
  get penalites_retard() { return this.contratForm.get('penalites_retard'); }
}