import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Document, CategorieDocument } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentService {

  private DOCUMENTS: Document[] = [
    { id: 1, id_chantier: 1, nom_chantier: 'Résidence Les Palmiers', nom_fichier: 'Contrat_MRC-2024-001', extension: 'pdf', categorie: 'contrat', ajoute_par: 'Admin', date_upload: '2023-12-21', taille_ko: 842 },
    { id: 2, id_chantier: 1, nom_chantier: 'Résidence Les Palmiers', nom_fichier: 'Plan_RDC_Palmiers', extension: 'dwg', categorie: 'plan', ajoute_par: 'Bah Mamadou', date_upload: '2024-01-10', taille_ko: 2340 },
    { id: 3, id_chantier: 1, nom_chantier: 'Résidence Les Palmiers', nom_fichier: 'PV_Reunion_Chantier_Fev2024', extension: 'pdf', categorie: 'pv', ajoute_par: 'Bah Mamadou', date_upload: '2024-02-15', taille_ko: 215 },
    { id: 4, id_chantier: 1, nom_chantier: 'Résidence Les Palmiers', nom_fichier: 'Photo_Gros_oeuvre_Juin2024', extension: 'jpg', categorie: 'photo', ajoute_par: 'Bah Mamadou', date_upload: '2024-06-12', taille_ko: 3780 },
    { id: 5, id_chantier: 1, nom_chantier: 'Résidence Les Palmiers', nom_fichier: 'Avenant_001_Terrasse', extension: 'pdf', categorie: 'contrat', ajoute_par: 'Admin', date_upload: '2024-06-16', taille_ko: 320 },
    { id: 6, id_chantier: 2, nom_chantier: 'Villa Duplex Riviera', nom_fichier: 'Contrat_MRC-2024-002', extension: 'pdf', categorie: 'contrat', ajoute_par: 'Admin', date_upload: '2023-02-12', taille_ko: 654 },
    { id: 7, id_chantier: 2, nom_chantier: 'Villa Duplex Riviera', nom_fichier: 'Plan_Villa_Riviera', extension: 'pdf', categorie: 'plan', ajoute_par: 'Traoré Mamadou', date_upload: '2023-03-02', taille_ko: 1890 },
    { id: 8, id_chantier: 2, nom_chantier: 'Villa Duplex Riviera', nom_fichier: 'PV_Reception_Provisoire', extension: 'pdf', categorie: 'pv', ajoute_par: 'Admin', date_upload: '2024-03-10', taille_ko: 445 },
    { id: 9, id_chantier: 3, nom_chantier: 'Complexe Commercial Marcory', nom_fichier: 'Contrat_MRC-2025-001', extension: 'pdf', categorie: 'contrat', ajoute_par: 'Admin', date_upload: '2024-12-06', taille_ko: 1120 },
    { id: 10, id_chantier: 3, nom_chantier: 'Complexe Commercial Marcory', nom_fichier: 'Plans_Architecturaux_Marcory', extension: 'pdf', categorie: 'plan', ajoute_par: 'Koné Drissa', date_upload: '2025-01-08', taille_ko: 8650 },
    { id: 11, id_chantier: 3, nom_chantier: 'Complexe Commercial Marcory', nom_fichier: 'Permis_Construire_Marcory', extension: 'pdf', categorie: 'divers', ajoute_par: 'Admin', date_upload: '2024-11-20', taille_ko: 980 },
    { id: 12, id_chantier: 4, nom_chantier: 'Maison Individuelle Yopougon', nom_fichier: 'Contrat_MRC-2025-002', extension: 'pdf', categorie: 'contrat', ajoute_par: 'Admin', date_upload: '2025-09-16', taille_ko: 502 },
  ];

  private documentsSubject = new BehaviorSubject<Document[]>(this.DOCUMENTS);

  getAll(): Observable<Document[]> { return this.documentsSubject.asObservable(); }
  getByChantier(idChantier: number): Observable<Document[]> { return of(this.DOCUMENTS.filter(d => d.id_chantier === idChantier)); }
  getByCategorie(categorie: CategorieDocument): Observable<Document[]> { return of(this.DOCUMENTS.filter(d => d.categorie === categorie)); }

  ajouter(doc: Omit<Document, 'id'>): Observable<Document> {
    const nouveau: Document = { ...doc, id: Math.max(...this.DOCUMENTS.map(d => d.id)) + 1 };
    this.DOCUMENTS.push(nouveau);
    this.documentsSubject.next([...this.DOCUMENTS]);
    return of(nouveau);
  }

  supprimer(id: number): Observable<boolean> {
    const idx = this.DOCUMENTS.findIndex(d => d.id === id);
    if (idx === -1) return of(false);
    this.DOCUMENTS.splice(idx, 1);
    this.documentsSubject.next([...this.DOCUMENTS]);
    return of(true);
  }
}