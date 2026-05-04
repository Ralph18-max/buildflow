import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PermissionService } from '../../../core/services/permission.service';

interface Chantier {
  id: number;
  nom: string;
  statut: string;
  conducteurId: number;
  chefChantierIds: number[];
}

interface CorpsEtat {
  id: number;
  nom: string;
  avancement: number;
  selected: boolean;
  avancementJour: number;
}

interface RapportSoumis {
  id: number;
  chantier: string;
  chantierId: number;
  date: string;
  redacteur: string;
  meteo: string;
  effectif: number;
  observations: string;
  incidents: string;
  corpsEtatTravailles: string[];
  statut: string;
}

@Component({
  selector: 'app-terrain-rapport',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './terrain-rapport.html',
  styleUrl: './terrain-rapport.scss'
})
export class TerrainRapport implements OnInit {

  rapportForm!: FormGroup;
  soumis = false;
  loading = false;

  // Onglet par défaut selon rôle :
  // chef_chantier → 'nouveau' | admin / conducteur → 'historique'
  get ongletInitial(): 'nouveau' | 'historique' {
    return this.perms.isChef ? 'nouveau' : 'historique';
  }
  ongletActif: 'nouveau' | 'historique' = 'historique'; // sera mis à jour dans ngOnInit

  // ── Raccourcis rôles via PermissionService ───────────────────────────────────
  get isAdmin(): boolean      { return this.perms.isAdmin; }
  get isConducteur(): boolean { return this.perms.isConducteur; }
  get isChef(): boolean       { return this.perms.isChef; }

  // Seul le chef_chantier (et conducteur) peut créer un rapport
  get peutCreerRapport(): boolean {
    return this.perms.can('terrain:rapport:create');
  }

  setOnglet(onglet: 'nouveau' | 'historique') {
    if (onglet === 'nouveau' && !this.peutCreerRapport) return;
    this.ongletActif = onglet;
  }

  // ── Météo ────────────────────────────────────────────────────────────────────
  meteoOptions = [
    { valeur: 'ensoleille', label: 'Ensoleillé', icone: 'wb_sunny' },
    { valeur: 'nuageux',    label: 'Nuageux',    icone: 'cloud' },
    { valeur: 'pluvieux',   label: 'Pluvieux',   icone: 'water_drop' },
    { valeur: 'orageux',    label: 'Orageux',    icone: 'thunderstorm' },
    { valeur: 'venteux',    label: 'Venteux',    icone: 'air' },
  ];
  meteoSelectionnee = 'ensoleille';

  // ── Chantiers ────────────────────────────────────────────────────────────────
  tousLesChantiers: Chantier[] = [
    { id: 1, nom: 'Résidence Les Palmiers',       statut: 'en_cours', conducteurId: 2, chefChantierIds: [3, 5] },
    { id: 2, nom: 'Villa Duplex Riviera',          statut: 'termine',  conducteurId: 6, chefChantierIds: [5] },
    { id: 3, nom: 'Complexe Commercial Marcory',   statut: 'en_cours', conducteurId: 2, chefChantierIds: [3, 5] },
    { id: 4, nom: 'Maison Individuelle Yopougon',  statut: 'en_cours', conducteurId: 6, chefChantierIds: [3] },
  ];

  // Chantiers filtrés selon le rôle et l'id de l'utilisateur connecté
  get chantiers(): Chantier[] {
    const user = this.perms.currentUser();
    if (this.isAdmin) return this.tousLesChantiers;
    if (this.isConducteur) return this.tousLesChantiers.filter(c => c.conducteurId === user.id);
    if (this.isChef) return this.tousLesChantiers.filter(c => c.chefChantierIds.includes(user.id));
    return [];
  }

  // ── Corps d'état ─────────────────────────────────────────────────────────────
  corpsEtatDisponibles: CorpsEtat[] = [
    { id: 1, nom: 'Terrassement', avancement: 100, selected: false, avancementJour: 0 },
    { id: 2, nom: 'Fondations',   avancement: 100, selected: false, avancementJour: 0 },
    { id: 3, nom: 'Gros œuvre',   avancement: 80,  selected: false, avancementJour: 0 },
    { id: 4, nom: 'Charpente',    avancement: 20,  selected: false, avancementJour: 0 },
    { id: 5, nom: 'Plomberie',    avancement: 0,   selected: false, avancementJour: 0 },
    { id: 6, nom: 'Électricité',  avancement: 0,   selected: false, avancementJour: 0 },
    { id: 7, nom: 'Carrelage',    avancement: 0,   selected: false, avancementJour: 0 },
    { id: 8, nom: 'Peinture',     avancement: 0,   selected: false, avancementJour: 0 },
  ];

  // ── Rapports ─────────────────────────────────────────────────────────────────
  tousLesRapports: RapportSoumis[] = [
    {
      id: 1, chantierId: 1,
      chantier: 'Résidence Les Palmiers',
      date: '2025-04-24', redacteur: 'Kouassi Bernard',
      meteo: 'ensoleille', effectif: 12,
      observations: 'Travaux de gros œuvre avancent bien. Coulage du plancher du 2ème niveau terminé.',
      incidents: '', corpsEtatTravailles: ['Gros œuvre', 'Charpente'], statut: 'soumis'
    },
    {
      id: 2, chantierId: 3,
      chantier: 'Complexe Commercial Marcory',
      date: '2025-04-23', redacteur: 'Traoré Seydou',
      meteo: 'nuageux', effectif: 8,
      observations: 'Terrassement en cours. Bonne progression malgré le terrain difficile.',
      incidents: 'Panne engin de terrassement — réparation 2h d\'arrêt',
      corpsEtatTravailles: ['Terrassement'], statut: 'soumis'
    },
    {
      id: 3, chantierId: 4,
      chantier: 'Maison Individuelle Yopougon',
      date: '2025-04-22', redacteur: 'Kouassi Bernard',
      meteo: 'pluvieux', effectif: 5,
      observations: 'Travaux ralentis par la pluie. Pose des fondations partiellement réalisée.',
      incidents: 'Arrêt 3h cause météo',
      corpsEtatTravailles: ['Fondations'], statut: 'soumis'
    },
  ];

  // Rapports filtrés selon les chantiers accessibles au rôle connecté
  get rapportsSoumis(): RapportSoumis[] {
    if (this.isAdmin) return this.tousLesRapports;
    const ids = this.chantiers.map(c => c.id);
    return this.tousLesRapports.filter(r => ids.includes(r.chantierId));
  }

  filtreChantierHistorique = 0;
  dateAujourdhui = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public perms: PermissionService   // public pour usage dans le template si besoin
  ) {}

  ngOnInit() {
    // Définir l'onglet initial selon le rôle
    this.ongletActif = this.ongletInitial;

    // Nom du rédacteur depuis l'utilisateur connecté
    const user = this.perms.currentUser();
    const redacteurNom = `${user.prenom} ${user.nom}`;

    // Présélection automatique si 1 seul chantier accessible
    const chantierInitial = this.chantiers.length === 1 ? this.chantiers[0].id : '';

    this.rapportForm = this.fb.group({
      chantierId:   [chantierInitial, Validators.required],
      date:         [this.dateAujourdhui, Validators.required],
      redacteur:    [redacteurNom, Validators.required],
      effectif:     [0, [Validators.required, Validators.min(0)]],
      observations: ['', Validators.required],
      incidents:    [''],
    });
  }

  get rapportsFiltres(): RapportSoumis[] {
    if (this.filtreChantierHistorique === 0) return this.rapportsSoumis;
    return this.rapportsSoumis.filter(r => r.chantierId === Number(this.filtreChantierHistorique));
  }

  selectionnerMeteo(valeur: string) { this.meteoSelectionnee = valeur; }

  toggleCorpsEtat(corps: CorpsEtat) {
    corps.selected = !corps.selected;
    if (!corps.selected) corps.avancementJour = 0;
  }

  getCorpsEtatSelectionnes(): CorpsEtat[] {
    return this.corpsEtatDisponibles.filter(c => c.selected);
  }

  getMeteoIcone(valeur: string): string {
    return this.meteoOptions.find(m => m.valeur === valeur)?.icone || 'wb_sunny';
  }

  getMeteoLabel(valeur: string): string {
    return this.meteoOptions.find(m => m.valeur === valeur)?.label || '';
  }

  soumettre() {
    if (this.rapportForm.invalid) {
      this.rapportForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    setTimeout(() => {
      const val = this.rapportForm.value;
      const chantier = this.chantiers.find(c => c.id === Number(val.chantierId));
      const nouveau: RapportSoumis = {
        id: this.tousLesRapports.length + 1,
        chantierId: Number(val.chantierId),       // ← liaison chantier obligatoire
        chantier: chantier?.nom || '',
        date: val.date,
        redacteur: val.redacteur,
        meteo: this.meteoSelectionnee,
        effectif: val.effectif,
        observations: val.observations,
        incidents: val.incidents,
        corpsEtatTravailles: this.getCorpsEtatSelectionnes().map(c => c.nom),
        statut: 'soumis'
      };
      this.tousLesRapports.unshift(nouveau);
      this.loading = false;
      this.soumis = true;
      setTimeout(() => {
        this.soumis = false;
        const user = this.perms.currentUser();
        this.rapportForm.reset({
          date: this.dateAujourdhui,
          redacteur: `${user.prenom} ${user.nom}`,
          effectif: 0,
          chantierId: this.chantiers.length === 1 ? this.chantiers[0].id : ''
        });
        this.meteoSelectionnee = 'ensoleille';
        this.corpsEtatDisponibles.forEach(c => { c.selected = false; c.avancementJour = 0; });
        this.ongletActif = 'historique';
      }, 2000);
    }, 1000);
  }

  allerPointage() {
    this.router.navigate(['/terrain/pointage']);
  }
}