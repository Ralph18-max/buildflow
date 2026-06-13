import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RapportTerrain, Pointage } from '../models';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class TerrainService {

  constructor(private http: HttpClient) {}

  getRapports(): Observable<RapportTerrain[]> {
    return this.http.get<any[]>(`${API_URL}/terrain/rapports`).pipe(
      map(rapports => rapports.map(r => this._mapRapport(r)))
    );
  }

  getRapportsByChantier(id: number): Observable<RapportTerrain[]> {
    return this.http.get<any[]>(`${API_URL}/terrain/rapports?chantier=${id}`).pipe(
      map(rapports => rapports.map(r => this._mapRapport(r)))
    );
  }

  ajouterRapport(rapport: Omit<RapportTerrain, 'id'>): Observable<RapportTerrain> {
    return this.http.post<any>(`${API_URL}/terrain/rapports`, {
      id_chantier:          rapport.id_chantier,
      redacteur:            rapport.redacteur,
      date_rapport:         rapport.date_rapport,
      effectif_present:     rapport.effectif_present,
      meteo:                rapport.meteo,
      observations:         rapport.observations,
      incidents:            rapport.incidents,
      a_incident:           rapport.a_incident,
      corps_travaux:        rapport.corps_etat_travailles,
    }).pipe(map(r => this._mapRapport(r)));
  }

  getPointages(): Observable<Pointage[]> {
    return this.http.get<any[]>(`${API_URL}/terrain/pointages`).pipe(
      map(pointages => pointages.map(p => this._mapPointage(p)))
    );
  }

  getPointagesByChantier(id: number): Observable<Pointage[]> {
    return this.http.get<any[]>(`${API_URL}/terrain/pointages?chantier=${id}`).pipe(
      map(pointages => pointages.map(p => this._mapPointage(p)))
    );
  }

  ajouterPointage(pointage: Omit<Pointage, 'id'>): Observable<Pointage> {
    return this.http.post<any>(`${API_URL}/terrain/pointages`, {
      id_chantier:     pointage.id_chantier,
      date:            pointage.date,
      effectif_prevu:  pointage.effectif_prevu,
      intervenants:    pointage.intervenants,
    }).pipe(map(p => this._mapPointage(p)));
  }

  private _mapRapport(r: any): RapportTerrain {
    return {
      id:                    r.id,
      id_chantier:           r.id_chantier,
      nom_chantier:          r.chantier?.nom_chantier || '',
      date_rapport:          r.date_rapport?.split('T')[0] || r.date_rapport || '',
      redacteur:             r.redacteur,
      effectif_present:      r.effectif_present || 0,
      meteo:                 r.meteo,
      corps_etat_travailles: r.corps_travaux?.map((c: any) => ({
        id_corps_etat:    c.id_corps_etat,
        nom:              c.nom || '',
        avancement_avant: c.avancement_avant,
        avancement_apres: c.avancement_apres,
      })) || [],
      observations: r.observations || '',
      incidents:    r.incidents,
      a_incident:   r.a_incident || false,
    };
  }

  private _mapPointage(p: any): Pointage {
    return {
      id:              p.id,
      id_chantier:     p.id_chantier,
      nom_chantier:    p.chantier?.nom_chantier || '',
      date:            p.date?.split('T')[0] || p.date || '',
      effectif_prevu:  p.effectif_prevu || 0,
      total_presents:  p.total_presents || 0,
      total_heures:    p.total_heures || 0,
      intervenants:    p.intervenants?.map((pi: any) => ({
        id_intervenant: pi.id_intervenant,
        nom_complet:    pi.nom_complet || '',
        corps_etat:     pi.corps_etat || '',
        present:        pi.present,
        heures:         pi.heures || 0,
        observation:    pi.observation || undefined,
      })) || [],
    };
  }
}
