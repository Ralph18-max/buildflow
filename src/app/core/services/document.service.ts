import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Document, CategorieDocument } from '../models';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class DocumentService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<Document[]> {
    return this.http.get<any[]>(`${API_URL}/documents`).pipe(
      map(docs => docs.map(d => this._map(d)))
    );
  }

  getByChantier(idChantier: number): Observable<Document[]> {
    return this.http.get<any[]>(`${API_URL}/documents?chantier=${idChantier}`).pipe(
      map(docs => docs.map(d => this._map(d)))
    );
  }

  getByCategorie(categorie: CategorieDocument): Observable<Document[]> {
    return this.http.get<any[]>(`${API_URL}/documents?categorie=${categorie}`).pipe(
      map(docs => docs.map(d => this._map(d)))
    );
  }

  ajouter(doc: Omit<Document, 'id'>): Observable<Document> {
    return this.http.post<any>(`${API_URL}/documents`, {
      id_chantier: doc.id_chantier,
      nom_fichier: doc.nom_fichier,
      extension:   doc.extension,
      categorie:   doc.categorie,
      taille_ko:   doc.taille_ko,
      url_fichier: doc.url_fichier,
    }).pipe(map(d => this._map(d)));
  }

  supprimer(id: number): Observable<boolean> {
    return this.http.delete<{ message: string }>(`${API_URL}/documents/${id}`).pipe(
      map(() => true)
    );
  }

  private _map(d: any): Document {
    return {
      id:           d.id,
      id_chantier:  d.id_chantier,
      nom_chantier: d.chantier?.nom_chantier || '',
      nom_fichier:  d.nom_fichier,
      extension:    d.extension || '',
      categorie:    d.categorie,
      ajoute_par:   d.ajoute_par,
      date_upload:  d.date_upload?.split('T')[0] || '',
      taille_ko:    d.taille_ko || 0,
      url_fichier:  d.url_fichier,
    };
  }
}
