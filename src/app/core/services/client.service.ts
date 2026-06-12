import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../models';
import { environment } from '../../../environments/environment';

const API_URL = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ClientService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>(`${API_URL}/clients`);
  }

  getById(id: number): Observable<Client | undefined> {
    return this.http.get<Client>(`${API_URL}/clients/${id}`);
  }

  getNomAffichage(client: Client): string {
    return client.type_client === 'societe'
      ? (client.raison_sociale || '')
      : `${client.prenom || ''} ${client.nom || ''}`.trim();
  }

  ajouter(client: Omit<Client, 'id' | 'date_creation' | 'nb_contrats'>): Observable<Client> {
    return this.http.post<Client>(`${API_URL}/clients`, client);
  }

  modifier(id: number, data: Partial<Omit<Client, 'id' | 'date_creation' | 'nb_contrats'>>): Observable<unknown> {
    return this.http.put(`${API_URL}/clients/${id}`, data);
  }

  supprimer(id: number): Observable<unknown> {
    return this.http.delete(`${API_URL}/clients/${id}`);
  }
}
