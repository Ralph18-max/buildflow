import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Client } from '../models';

@Injectable({ providedIn: 'root' })
export class ClientService {

  private readonly CLIENTS: Client[] = [
   // Dans client.service.ts, ajoute nom: '' sur les clients société
{ id: 1, nom: '', raison_sociale: 'SCI Les Palmiers', type_client: 'societe', telephone: '...', email: '...', adresse: '...', date_creation: '...', nb_contrats: 1 },
{ id: 3, nom: '', raison_sociale: 'Groupe Immobilier du Sud', type_client: 'societe', telephone: '...', email: '...', adresse: '...', date_creation: '...', nb_contrats: 1 },
  ];

  private clientsSubject = new BehaviorSubject<Client[]>(this.CLIENTS);

  getAll(): Observable<Client[]> { return this.clientsSubject.asObservable(); }
  getById(id: number): Observable<Client | undefined> { return of(this.CLIENTS.find(c => c.id === id)); }
  getNomAffichage(client: Client): string {
    return client.type_client === 'societe' ? (client.raison_sociale || '') : `${client.prenom || ''} ${client.nom || ''}`.trim();
  }
  ajouter(client: Omit<Client, 'id' | 'date_creation' | 'nb_contrats'>): Observable<Client> {
    const nouveau: Client = { ...client, id: Math.max(...this.CLIENTS.map(c => c.id)) + 1, date_creation: new Date().toISOString().split('T')[0], nb_contrats: 0 };
    this.CLIENTS.push(nouveau);
    this.clientsSubject.next([...this.CLIENTS]);
    return of(nouveau);
  }
}