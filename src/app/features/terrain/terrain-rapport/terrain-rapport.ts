import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';
import { ChantierService } from '../../../core/services/chantier.service';
import { TerrainService } from '../../../core/services/terrain.service';
import { RapportTerrain } from '../../../core/models';

interface CorpsEtatLocal {
  id: number;
  nom: string;
  avancement: number;
  selected: boolean;
  avancementJour: number;
}

@Component({
  selector: 'app-terrain-rapport',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './terrain-rapport.html',
  styleUrl: './terrain-rapport.scss'
})
export class TerrainRapport implements OnInit, OnDestroy {

  rapportForm!: FormGroup;
  soumis = false;
  loading = false;

  private subs = new Subscription();

  get ongletInitial(): 'nouveau' | 'historique' {
    return this.perms.isChef ? 'nouveau' : 'historique';
  }
  ongletActif!: 'nouveau' | 'historique';

  get isAdmin(): boolean      { return this.perms.isAdmin; }
  get isConducteur(): boolean { return this.perms.isConducteur; }
  get isChef(): boolean       { return this.perms.isChef; }

  get peutCreerRapport(): boolean {
    return this.perms.can('terrain:rapport:create');
  }

  setOnglet(onglet: 'nouveau' | 'historique') {
    if (onglet === 'nouveau' && !this.peutCreerRapport) return;
    this.ongletActif = onglet;
  }

  meteoOptions = [
    { valeur: 'ensoleille', label: 'Ensoleillé', icone: 'wb_sunny' },
    { valeur: 'nuageux',    label: 'Nuageux',    icone: 'cloud' },
    { valeur: 'pluvieux',   label: 'Pluvieux',   icone: 'water_drop' },
    { valeur: 'orageux',    label: 'Orageux',    icone: 'thunderstorm' },
    { valeur: 'venteux',    label: 'Venteux',    icone: 'air' },
  ];
  meteoSelectionnee = 'ensoleille';

  chantiers: { id: number; nom: string }[] = [];
  corpsEtatDisponibles: CorpsEtatLocal[] = [];
  rapports: RapportTerrain[] = [];
  filtreChantierHistorique = 0;
  dateAujourdhui = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public perms: PermissionService,
    private chantierService: ChantierService,
    private terrainService: TerrainService,
  ) {
    this.ongletActif = this.ongletInitial;
  }

  ngOnInit() {
    const user = this.perms.currentUser();
    const redacteurNom = user ? `${user.prenom} ${user.nom}` : 'Inconnu';

    this.rapportForm = this.fb.group({
      chantierId:   ['', Validators.required],
      date:         [this.dateAujourdhui, Validators.required],
      redacteur:    [redacteurNom, Validators.required],
      effectif:     [0, [Validators.required, Validators.min(0)]],
      observations: ['', Validators.required],
      incidents:    [''],
    });

    this.subs.add(
      this.chantierService.getEnCours().subscribe(list => {
        this.chantiers = list.map(c => ({ id: c.id, nom: c.nom_chantier }));
        if (this.chantiers.length === 1) {
          this.rapportForm.patchValue({ chantierId: this.chantiers[0].id });
          this._chargerCorpsEtat(this.chantiers[0].id);
        }
      })
    );

    this.subs.add(
      this.rapportForm.get('chantierId')!.valueChanges.subscribe(id => {
        if (id) this._chargerCorpsEtat(Number(id));
        else this.corpsEtatDisponibles = [];
      })
    );

    this.subs.add(
      this.terrainService.getRapports().subscribe(list => this.rapports = list)
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private _chargerCorpsEtat(idChantier: number): void {
    this.corpsEtatDisponibles = [];
    this.chantierService.getCorpsEtat(idChantier).subscribe(list =>
      this.corpsEtatDisponibles = list.map(ce => ({
        id:             ce.id,
        nom:            ce.nom,
        avancement:     ce.avancement,
        selected:       false,
        avancementJour: 0,
      }))
    );
  }

  get rapportsFiltres(): RapportTerrain[] {
    if (this.filtreChantierHistorique === 0) return this.rapports;
    return this.rapports.filter(r => r.id_chantier === Number(this.filtreChantierHistorique));
  }

  selectionnerMeteo(valeur: string) { this.meteoSelectionnee = valeur; }

  toggleCorpsEtat(corps: CorpsEtatLocal) {
    corps.selected = !corps.selected;
    if (!corps.selected) corps.avancementJour = 0;
  }

  getCorpsEtatSelectionnes(): CorpsEtatLocal[] {
    return this.corpsEtatDisponibles.filter(c => c.selected);
  }

  getMeteoIcone(valeur: string): string {
    return this.meteoOptions.find(m => m.valeur === valeur)?.icone || 'wb_sunny';
  }

  getMeteoLabel(valeur: string): string {
    return this.meteoOptions.find(m => m.valeur === valeur)?.label || '';
  }

  erreurRapport = '';

  soumettre() {
    this.erreurRapport = '';
    if (this.rapportForm.invalid) {
      this.rapportForm.markAllAsTouched();
      return;
    }
    const date = this.rapportForm.value.date;
    if (date && date > this.dateAujourdhui) {
      this.erreurRapport = 'La date du rapport ne peut pas être dans le futur.'; return;
    }
    const effectif = this.rapportForm.value.effectif;
    if (effectif < 0) { this.erreurRapport = 'L\'effectif ne peut pas être négatif.'; return; }
    const avancementsInvalides = this.getCorpsEtatSelectionnes()
      .filter(c => c.avancementJour < 0 || c.avancementJour > 100);
    if (avancementsInvalides.length) {
      this.erreurRapport = 'L\'avancement journalier doit être compris entre 0 et 100%.'; return;
    }
    this.loading = true;
    const val = this.rapportForm.value;
    const chantier = this.chantiers.find(c => c.id === Number(val.chantierId));

    this.terrainService.ajouterRapport({
      id_chantier:           Number(val.chantierId),
      nom_chantier:          chantier?.nom || '',
      redacteur:             val.redacteur,
      date_rapport:          val.date,
      effectif_present:      val.effectif,
      meteo:                 this.meteoSelectionnee as any,
      observations:          val.observations,
      incidents:             val.incidents || '',
      a_incident:            !!(val.incidents?.trim()),
      corps_etat_travailles: this.getCorpsEtatSelectionnes().map(c => ({
        id_corps_etat:    c.id,
        nom:              c.nom,
        avancement_avant: c.avancement,
        avancement_apres: c.avancement + c.avancementJour,
      })),
    }).subscribe({
      next: (rapport) => {
        this.loading = false;
        this.soumis  = true;
        this.rapports.unshift(rapport);

        setTimeout(() => {
          this.soumis = false;
          const user = this.perms.currentUser();
          const redacteurNom = user ? `${user.prenom} ${user.nom}` : 'Inconnu';
          this.rapportForm.reset({
            date:       this.dateAujourdhui,
            redacteur:  redacteurNom,
            effectif:   0,
            chantierId: this.chantiers.length === 1 ? this.chantiers[0].id : '',
          });
          this.meteoSelectionnee = 'ensoleille';
          this.corpsEtatDisponibles.forEach(c => { c.selected = false; c.avancementJour = 0; });
          this.ongletActif = 'historique';
        }, 2000);
      },
      error: () => { this.loading = false; },
    });
  }

  allerPointage() {
    this.router.navigate(['/terrain/pointage']);
  }
}