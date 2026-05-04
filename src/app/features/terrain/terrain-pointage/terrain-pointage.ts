import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PermissionService } from '../../../core/services/permission.service';

interface Intervenant {
  id: number;
  nom: string;
  prenom: string;
  role: string;
  entreprise: string;
  chantierId: number;
  present: boolean;
  heures: number;
  observations: string;
}

interface JourPointage {
  date: string;
  chantierId: number;
  chantierNom: string;
  intervenants: PointageIntervenant[];
  totalHeures: number;
  totalPresents: number;
  statut: 'brouillon' | 'soumis';
}

interface PointageIntervenant {
  nom: string;
  prenom: string;
  role: string;
  present: boolean;
  heures: number;
}

interface Chantier {
  id: number;
  nom: string;
  conducteurId: number;
  chefChantierIds: number[];
}

@Component({
  selector: 'app-terrain-pointage',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, RouterModule, DatePipe],
  templateUrl: './terrain-pointage.html',
  styleUrl: './terrain-pointage.scss'
})
export class TerrainPointage implements OnInit {

  ongletActif: 'pointage' | 'historique' = 'pointage';
  loading = false;
  soumis = false;

  dateAujourdhui = new Date().toISOString().split('T')[0];
  dateSelectionnee = this.dateAujourdhui;
  chantierSelectionne = 0; // sera initialisé dans ngOnInit

  // ── Tous les chantiers (source unique — même données que terrain-rapport) ───
  tousLesChantiers: Chantier[] = [
    { id: 1, nom: 'Résidence Les Palmiers',       conducteurId: 2, chefChantierIds: [3, 5] },
    { id: 2, nom: 'Villa Duplex Riviera',          conducteurId: 6, chefChantierIds: [5] },
    { id: 3, nom: 'Complexe Commercial Marcory',   conducteurId: 2, chefChantierIds: [3, 5] },
    { id: 4, nom: 'Maison Individuelle Yopougon',  conducteurId: 6, chefChantierIds: [3] },
  ];

  // Chantiers accessibles selon le rôle connecté
  get chantiers(): Chantier[] {
    const user = this.perms.currentUser();
    if (this.perms.isAdmin) return this.tousLesChantiers;
    if (this.perms.isConducteur) return this.tousLesChantiers.filter(c => c.conducteurId === user.id);
    if (this.perms.isChef) return this.tousLesChantiers.filter(c => c.chefChantierIds.includes(user.id));
    return [];
  }

  // ── Intervenants ─────────────────────────────────────────────────────────────
  intervenants: Intervenant[] = [
    { id: 1,  nom: 'Kouassi',   prenom: 'Bernard',  role: 'Chef maçon',    entreprise: 'BTP Sud SARL',      chantierId: 1, present: true,  heures: 8, observations: '' },
    { id: 2,  nom: 'Traoré',    prenom: 'Moussa',    role: 'Maçon',         entreprise: 'BTP Sud SARL',      chantierId: 1, present: true,  heures: 8, observations: '' },
    { id: 3,  nom: 'Diallo',    prenom: 'Ibrahima',  role: 'Maçon',         entreprise: 'BTP Sud SARL',      chantierId: 1, present: false, heures: 0, observations: 'Absent — congé maladie' },
    { id: 4,  nom: 'Koné',      prenom: 'Adama',     role: 'Électricien',   entreprise: 'Elec Plus CI',      chantierId: 1, present: true,  heures: 6, observations: '' },
    { id: 5,  nom: 'Bamba',     prenom: 'Seydou',    role: 'Plombier',      entreprise: 'Plomberie Moderne', chantierId: 1, present: true,  heures: 7, observations: '' },
    { id: 6,  nom: 'Touré',     prenom: 'Kader',     role: 'Manœuvre',      entreprise: 'BTP Sud SARL',      chantierId: 1, present: true,  heures: 8, observations: '' },
    { id: 7,  nom: 'Coulibaly', prenom: 'Drissa',    role: 'Charpentier',   entreprise: 'Charpente CI',      chantierId: 1, present: false, heures: 0, observations: '' },
    { id: 8,  nom: 'Séka',      prenom: 'Roger',     role: 'Carreleur',     entreprise: 'Carrelage Pro',     chantierId: 1, present: true,  heures: 8, observations: '' },
    { id: 9,  nom: 'Ouattara',  prenom: 'Lamine',    role: 'Chef maçon',    entreprise: 'ABC Constructions', chantierId: 3, present: true,  heures: 8, observations: '' },
    { id: 10, nom: 'Yao',       prenom: 'Félix',     role: 'Terrassier',    entreprise: 'Terras CI',         chantierId: 3, present: true,  heures: 8, observations: '' },
    { id: 11, nom: 'N\'Guessan',prenom: 'Hervé',     role: 'Maçon',         entreprise: 'ABC Constructions', chantierId: 4, present: true,  heures: 7, observations: '' },
    { id: 12, nom: 'Aka',       prenom: 'Marcel',    role: 'Manœuvre',      entreprise: 'ABC Constructions', chantierId: 4, present: false, heures: 0, observations: '' },
  ];

  historiquePointages: JourPointage[] = [
    {
      date: '2025-04-24', chantierId: 1, chantierNom: 'Résidence Les Palmiers',
      intervenants: [
        { nom: 'Kouassi', prenom: 'Bernard', role: 'Chef maçon',  present: true,  heures: 8 },
        { nom: 'Traoré',  prenom: 'Moussa',  role: 'Maçon',       present: true,  heures: 8 },
        { nom: 'Diallo',  prenom: 'Ibrahima',role: 'Maçon',       present: false, heures: 0 },
        { nom: 'Koné',    prenom: 'Adama',   role: 'Électricien', present: true,  heures: 6 },
      ],
      totalHeures: 22, totalPresents: 3, statut: 'soumis'
    },
    {
      date: '2025-04-23', chantierId: 3, chantierNom: 'Complexe Commercial Marcory',
      intervenants: [
        { nom: 'Ouattara', prenom: 'Lamine', role: 'Chef maçon', present: true, heures: 8 },
        { nom: 'Yao',      prenom: 'Félix',  role: 'Terrassier', present: true, heures: 8 },
      ],
      totalHeures: 16, totalPresents: 2, statut: 'soumis'
    }
  ];

  constructor(
    private router: Router,
    public perms: PermissionService
  ) {}

  ngOnInit() {
    // Présélection automatique du premier chantier accessible
    if (this.chantiers.length > 0) {
      this.chantierSelectionne = this.chantiers[0].id;
    }
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  get intervenantsChantier(): Intervenant[] {
    return this.intervenants.filter(i => i.chantierId === Number(this.chantierSelectionne));
  }

  get totalPresents(): number {
    return this.intervenantsChantier.filter(i => i.present).length;
  }

  get totalAbsents(): number {
    return this.intervenantsChantier.filter(i => !i.present).length;
  }

  getTotalHeures(): number {
    return this.intervenantsChantier.reduce((sum, i) => sum + (i.present ? i.heures : 0), 0);
  }

  getTauxPresence(): number {
    if (this.intervenantsChantier.length === 0) return 0;
    return Math.round((this.totalPresents / this.intervenantsChantier.length) * 100);
  }

  getNomChantier(id: number): string {
    return this.tousLesChantiers.find(c => c.id === id)?.nom || '';
  }

  // ── Actions ──────────────────────────────────────────────────────────────────
  togglePresence(intervenant: Intervenant) {
    intervenant.present = !intervenant.present;
    intervenant.heures = intervenant.present ? 8 : 0;
  }

  decrementerHeures(i: Intervenant) {
    if (i.present && i.heures > 0) i.heures = Math.round((i.heures - 0.5) * 10) / 10;
  }

  incrementerHeures(i: Intervenant) {
    if (i.present && i.heures < 12) i.heures = Math.round((i.heures + 0.5) * 10) / 10;
  }

  tousPresents(): boolean {
    return this.intervenantsChantier.length > 0 && this.intervenantsChantier.every(i => i.present);
  }

  toggleTousPresents() {
    const tous = this.tousPresents();
    this.intervenantsChantier.forEach(i => {
      i.present = !tous;
      i.heures = !tous ? 8 : 0;
    });
  }

  soumettre() {
    this.loading = true;
    setTimeout(() => {
      const chantierNom = this.getNomChantier(Number(this.chantierSelectionne));
      const nouveauPointage: JourPointage = {
        date: this.dateSelectionnee,
        chantierId: Number(this.chantierSelectionne),   // ← liaison chantier obligatoire
        chantierNom,
        intervenants: this.intervenantsChantier.map(i => ({
          nom: i.nom, prenom: i.prenom, role: i.role,
          present: i.present, heures: i.heures
        })),
        totalHeures: this.getTotalHeures(),
        totalPresents: this.totalPresents,
        statut: 'soumis'
      };
      this.historiquePointages.unshift(nouveauPointage);
      this.loading = false;
      this.soumis = true;
      setTimeout(() => {
        this.soumis = false;
        this.ongletActif = 'historique';
      }, 2000);
    }, 900);
  }

  allerRapport() {
    this.router.navigate(['/terrain']);
  }
}