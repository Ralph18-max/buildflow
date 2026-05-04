import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CanPipe } from '../../core/pipes/can.pipe';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, FormsModule, CanPipe],
  templateUrl: './clients-list.html',
  styleUrl: './clients-list.scss'
})
export class ClientsList {

  showModal = false;
  searchQuery = '';
  isLoading = false;
  successMessage = '';

  clientForm: FormGroup;

  clients = [
    { id: 1, nom: 'Konan', prenom: 'Yves', raison_sociale: '', type: 'particulier', telephone: '+225 07 00 00 01', email: 'yves@gmail.com', adresse: 'Cocody, Abidjan', contrats: 2, initiales: 'KY' },
    { id: 2, nom: '', prenom: '', raison_sociale: 'SCI Les Palmiers', type: 'societe', telephone: '+225 27 00 00 02', email: 'contact@palmiers.ci', adresse: 'Plateau, Abidjan', contrats: 1, initiales: 'SP' },
    { id: 3, nom: 'Diabaté', prenom: 'Moussa', raison_sociale: '', type: 'particulier', telephone: '+225 05 00 00 03', email: 'moussa@gmail.com', adresse: 'Marcory, Abidjan', contrats: 3, initiales: 'DM' },
    { id: 4, nom: '', prenom: '', raison_sociale: 'Groupe Immobilier du Sud', type: 'societe', telephone: '+225 27 00 00 04', email: 'contact@gis.ci', adresse: 'Zone 4, Abidjan', contrats: 1, initiales: 'GI' },
  ];

  constructor(private fb: FormBuilder, public perm: PermissionService) {
    this.clientForm = this.fb.group({
      type: ['particulier', Validators.required],
      nom: [''],
      prenom: [''],
      raison_sociale: [''],
      telephone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      adresse: ['', Validators.required],
    });
  }

  get filteredClients() {
    if (!this.searchQuery) return this.clients;
    const q = this.searchQuery.toLowerCase();
    return this.clients.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      c.raison_sociale.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }

  getClientNom(c: any): string {
    return c.type === 'societe' ? c.raison_sociale : `${c.nom} ${c.prenom}`;
  }

  openModal() {
    this.showModal = true;
    this.clientForm.reset({ type: 'particulier' });
    this.successMessage = '';
  }

  closeModal() {
    this.showModal = false;
    this.successMessage = '';
  }

  onSubmit() {
    if (this.clientForm.invalid) return;
    this.isLoading = true;

    setTimeout(() => {
      const v = this.clientForm.value;
      const initiales = v.type === 'societe'
        ? v.raison_sociale.substring(0, 2).toUpperCase()
        : `${v.nom[0]}${v.prenom[0]}`.toUpperCase();

      this.clients.push({
        id: this.clients.length + 1,
        nom: v.nom || '',
        prenom: v.prenom || '',
        raison_sociale: v.raison_sociale || '',
        type: v.type,
        telephone: v.telephone,
        email: v.email,
        adresse: v.adresse,
        contrats: 0,
        initiales
      });
      this.isLoading = false;
      this.successMessage = `Client "${this.getClientNom(v)}" créé avec succès.`;
    }, 1000);
  }

  get typeClient() { return this.clientForm.get('type'); }
  get nom() { return this.clientForm.get('nom'); }
  get prenom() { return this.clientForm.get('prenom'); }
  get raison_sociale() { return this.clientForm.get('raison_sociale'); }
  get telephone() { return this.clientForm.get('telephone'); }
  get email() { return this.clientForm.get('email'); }
  get adresse() { return this.clientForm.get('adresse'); }
}