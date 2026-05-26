import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PermissionService } from '../../../core/services/permission.service';
import { ChantierService } from '../../../core/services/chantier.service';
import { TerrainService } from '../../../core/services/terrain.service';
import { Pointage } from '../../../core/models';

interface IntervenantLocal {
  id:           number;
  nom_complet:  string;
  corps_etat:   string;
  present:      boolean;
  heures:       number;
  observations: string;
}

@Component({
  selector: 'app-terrain-pointage',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, RouterModule, DatePipe],
  templateUrl: './terrain-pointage.html',
  styleUrl: './terrain-pointage.scss'
})
export class TerrainPointage implements OnInit, OnDestroy {

  ongletActif: 'pointage' | 'historique' = 'pointage';
  loading = false;
  soumis  = false;

  private subs = new Subscription();

  dateAujourdhui    = new Date().toISOString().split('T')[0];
  dateSelectionnee  = this.dateAujourdhui;
  chantierSelectionne = 0;

  chantiers:   { id: number; nom: string }[] = [];
  intervenants: IntervenantLocal[] = [];
  historique:   Pointage[] = [];

  constructor(
    private router:          Router,
    public  perms:           PermissionService,
    private chantierService: ChantierService,
    private terrainService:  TerrainService,
  ) {}

  ngOnInit() {
    this.subs.add(
      this.chantierService.getEnCours().subscribe(list => {
        this.chantiers = list.map(c => ({ id: c.id, nom: c.nom_chantier }));
        if (this.chantiers.length > 0) {
          this.chantierSelectionne = this.chantiers[0].id;
          this._chargerIntervenants(this.chantiers[0].id);
        }
      })
    );
    this.subs.add(
      this.terrainService.getPointages().subscribe(list => this.historique = list)
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onChantierChange() {
    this._chargerIntervenants(Number(this.chantierSelectionne));
  }

  private _chargerIntervenants(idChantier: number): void {
    this.intervenants = [];
    this.chantierService.getIntervenants(idChantier).subscribe(list =>
      this.intervenants = list.map(i => ({
        id:           i.id,
        nom_complet:  i.nom_responsable || `${i.nom || ''} ${i.prenom || ''}`.trim(),
        corps_etat:   i.corps_etat_nom || '',
        present:      true,
        heures:       8,
        observations: '',
      }))
    );
  }

  // ── Computed ──────────────────────────────────────────────────────────────────

  get totalPresents(): number {
    return this.intervenants.filter(i => i.present).length;
  }

  get totalAbsents(): number {
    return this.intervenants.filter(i => !i.present).length;
  }

  getTotalHeures(): number {
    return this.intervenants.reduce((sum, i) => sum + (i.present ? i.heures : 0), 0);
  }

  getTauxPresence(): number {
    if (this.intervenants.length === 0) return 0;
    return Math.round((this.totalPresents / this.intervenants.length) * 100);
  }

  getNomChantier(id: number): string {
    return this.chantiers.find(c => c.id === id)?.nom || '';
  }

  get historiqueFiltre(): Pointage[] {
    return this.historique;
  }

  // ── Actions ───────────────────────────────────────────────────────────────────

  togglePresence(i: IntervenantLocal) {
    i.present = !i.present;
    i.heures  = i.present ? 8 : 0;
  }

  decrementerHeures(i: IntervenantLocal) {
    if (i.present && i.heures > 0) i.heures = Math.round((i.heures - 0.5) * 10) / 10;
  }

  incrementerHeures(i: IntervenantLocal) {
    if (i.present && i.heures < 12) i.heures = Math.round((i.heures + 0.5) * 10) / 10;
  }

  tousPresents(): boolean {
    return this.intervenants.length > 0 && this.intervenants.every(i => i.present);
  }

  toggleTousPresents() {
    const tous = this.tousPresents();
    this.intervenants.forEach(i => { i.present = !tous; i.heures = !tous ? 8 : 0; });
  }

  soumettre() {
    this.loading = true;
    this.terrainService.ajouterPointage({
      id_chantier:    Number(this.chantierSelectionne),
      nom_chantier:   this.getNomChantier(Number(this.chantierSelectionne)),
      date:           this.dateSelectionnee,
      effectif_prevu: this.intervenants.length,
      total_presents: this.totalPresents,
      total_heures:   this.getTotalHeures(),
      intervenants:   this.intervenants.map(i => ({
        id_intervenant: i.id,
        nom_complet:    i.nom_complet,
        corps_etat:     i.corps_etat,
        present:        i.present,
        heures:         i.heures,
        observation:    i.observations || undefined,
      })),
    }).subscribe({
      next: (pointage) => {
        this.historique.unshift(pointage);
        this.loading = false;
        this.soumis  = true;
        setTimeout(() => { this.soumis = false; this.ongletActif = 'historique'; }, 2000);
      },
      error: () => { this.loading = false; },
    });
  }

  allerRapport() {
    this.router.navigate(['/terrain']);
  }
}
