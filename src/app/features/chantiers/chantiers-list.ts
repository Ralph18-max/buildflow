import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PermissionService } from '../../core/services/permission.service';
import { CanPipe } from '../../core/pipes/can.pipe';

interface Chantier {
  id: number;
  nom: string;
  localisation: string;
  statut: 'en_cours' | 'termine' | 'suspendu';
  avancement: number;
  client: string;
  chef_chantier: string;
  budget: number;
  date_debut: string;
  date_fin_prevue: string;
  contrat_id: number;
}

@Component({
  selector: 'app-chantiers-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, CanPipe],
  templateUrl: './chantiers-list.html',
  styleUrl: './chantiers-list.scss'
})
export class ChantiersList implements OnInit {

  activeTab: string = 'tous';
  searchQuery: string = '';
  showModal: boolean = false;

  // Formulaire nouveau chantier
  nouveauChantier = {
    nom: '',
    localisation: '',
    contrat_id: null as number | null,
    chef_chantier: '',
    date_debut: '',
    date_fin_prevue: '',
    description: ''
  };

  chantiers: Chantier[] = [
    {
      id: 1, nom: 'Résidence Les Palmiers', localisation: 'Cocody, Abidjan',
      statut: 'en_cours', avancement: 72, client: 'SCI Les Palmiers',
      chef_chantier: 'Kouassi Jean', budget: 450000000,
      date_debut: '2024-03-01', date_fin_prevue: '2025-06-30', contrat_id: 1
    },
    {
      id: 2, nom: 'Villa Duplex Riviera', localisation: 'Riviera 3, Abidjan',
      statut: 'termine', avancement: 100, client: 'Konan Yves',
      chef_chantier: 'Traoré Moussa', budget: 180000000,
      date_debut: '2023-06-01', date_fin_prevue: '2024-12-15', contrat_id: 2
    },
    {
      id: 3, nom: 'Complexe Commercial Marcory', localisation: 'Marcory, Abidjan',
      statut: 'en_cours', avancement: 18, client: 'Groupe Immobilier du Sud',
      chef_chantier: 'Bamba Issiaka', budget: 820000000,
      date_debut: '2025-01-15', date_fin_prevue: '2026-08-30', contrat_id: 3
    },
    {
      id: 4, nom: 'Maison Individuelle Yopougon', localisation: 'Yopougon, Abidjan',
      statut: 'en_cours', avancement: 5, client: 'Diabaté Moussa',
      chef_chantier: 'Koné Seydou', budget: 95000000,
      date_debut: '2025-03-01', date_fin_prevue: '2025-12-31', contrat_id: 4
    }
  ];

  constructor(
    private router: Router,
    public perm: PermissionService   // public → utilisable dans le template
  ) {}

  ngOnInit(): void {}

  get filteredChantiers(): Chantier[] {
    let list = this.chantiers;
    if (this.activeTab !== 'tous') {
      list = list.filter(c => c.statut === this.activeTab);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c =>
        c.nom.toLowerCase().includes(q) ||
        c.localisation.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getCount(statut: string): number {
    if (statut === 'tous') return this.chantiers.length;
    return this.chantiers.filter(c => c.statut === statut).length;
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'suspendu': 'Suspendu'
    };
    return labels[statut] || statut;
  }

  getAvancementColor(avancement: number): string {
    if (avancement >= 80) return '#22c55e';
    if (avancement >= 40) return '#E8520A';
    return '#ef4444';
  }

  formatBudget(montant: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  voirChantier(id: number): void {
    this.router.navigate(['/chantiers', id]);
  }

  ouvrirModal(): void {
    // Guard : seuls admin et conducteur peuvent créer
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

    const newId = Math.max(...this.chantiers.map(c => c.id)) + 1;
    this.chantiers.push({
      id: newId,
      nom: this.nouveauChantier.nom,
      localisation: this.nouveauChantier.localisation,
      statut: 'en_cours',
      avancement: 0,
      client: 'À définir',
      chef_chantier: this.nouveauChantier.chef_chantier || 'Non assigné',
      budget: 0,
      date_debut: this.nouveauChantier.date_debut,
      date_fin_prevue: this.nouveauChantier.date_fin_prevue,
      contrat_id: this.nouveauChantier.contrat_id || 0
    });

    this.fermerModal();
  }
}