import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { RapportTerrain, Pointage } from '../models';

@Injectable({ providedIn: 'root' })
export class TerrainService {

  private rapports: RapportTerrain[] = [
    { id: 1, id_chantier: 1, nom_chantier: 'Résidence Les Palmiers', date_rapport: '2025-04-24', redacteur: 'Bah Mamadou', effectif_present: 18, meteo: 'soleil', corps_etat_travailles: [{ id_corps_etat: 105, nom: 'Plomberie', avancement_avant: 80, avancement_apres: 85 }, { id_corps_etat: 106, nom: 'Électricité', avancement_avant: 65, avancement_apres: 70 }], observations: 'Avancement conforme au planning. Livraison tuyauterie cuisine effectuée.', a_incident: false },
    { id: 2, id_chantier: 3, nom_chantier: 'Complexe Commercial Marcory', date_rapport: '2025-04-24', redacteur: 'Koné Drissa', effectif_present: 24, meteo: 'nuageux', corps_etat_travailles: [{ id_corps_etat: 302, nom: 'Fondations', avancement_avant: 55, avancement_apres: 60 }], observations: 'Coulage du radier nord effectué. Attente séchage 48h avant reprise.', a_incident: false },
    { id: 3, id_chantier: 4, nom_chantier: 'Maison Individuelle Yopougon', date_rapport: '2025-04-23', redacteur: 'Yapi Serge', effectif_present: 6, meteo: 'soleil', corps_etat_travailles: [{ id_corps_etat: 401, nom: 'Terrassement', avancement_avant: 90, avancement_apres: 100 }], observations: 'Terrassement terminé. Début fondations prévu demain.', incidents: 'Légère chute d\'un ouvrier — sans gravité. Soigné sur place.', a_incident: true },
  ];

  private pointages: Pointage[] = [
    { id: 1, id_chantier: 1, nom_chantier: 'Résidence Les Palmiers', date: '2025-04-24', effectif_prevu: 20, total_presents: 18, total_heures: 148, intervenants: [{ id_intervenant: 3, nom_complet: 'Bamba Moussa', corps_etat: 'Plomberie', present: true, heures: 8 }, { id_intervenant: 4, nom_complet: 'Touré Ibrahim', corps_etat: 'Électricité', present: true, heures: 8 }] },
  ];

  private rapportsSubject = new BehaviorSubject<RapportTerrain[]>(this.rapports);
  private pointagesSubject = new BehaviorSubject<Pointage[]>(this.pointages);

  getRapports(): Observable<RapportTerrain[]> { return this.rapportsSubject.asObservable(); }
  getRapportsByChantier(id: number): Observable<RapportTerrain[]> { return of(this.rapports.filter(r => r.id_chantier === id)); }

  ajouterRapport(rapport: Omit<RapportTerrain, 'id'>): Observable<RapportTerrain> {
    const nouveau = { ...rapport, id: this.rapports.length + 1 };
    this.rapports.push(nouveau);
    this.rapportsSubject.next([...this.rapports]);
    return of(nouveau);
  }

  getPointages(): Observable<Pointage[]> { return this.pointagesSubject.asObservable(); }
  getPointagesByChantier(id: number): Observable<Pointage[]> { return of(this.pointages.filter(p => p.id_chantier === id)); }

  ajouterPointage(pointage: Omit<Pointage, 'id'>): Observable<Pointage> {
    const nouveau = { ...pointage, id: this.pointages.length + 1 };
    this.pointages.push(nouveau);
    this.pointagesSubject.next([...this.pointages]);
    return of(nouveau);
  }
}