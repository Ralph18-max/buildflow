import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

interface Document {
  id: number;
  nom: string;
  extension: string;
  categorie: 'contrat' | 'plan' | 'pv' | 'facture' | 'photo' | 'divers';
  chantier: string;
  chantier_id: number;
  ajoute_par: string;
  date: string;
  taille: string;
}

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  templateUrl: './documents-list.html',
  styleUrl: './documents-list.scss'
})
export class DocumentsList implements OnInit {

  searchQuery = '';
  activeCategory = 'tous';
  filtreChantier = '';
  showUpload = false;

  categories = [
    { key: 'contrat', label: 'Contrats',      icon: 'description' },
    { key: 'plan',    label: 'Plans',          icon: 'architecture' },
    { key: 'pv',      label: 'PV / Réceptions',icon: 'task_alt' },
    { key: 'facture', label: 'Factures',       icon: 'receipt' },
    { key: 'photo',   label: 'Photos',         icon: 'photo_camera' },
    { key: 'divers',  label: 'Divers',         icon: 'folder' },
  ];

  chantiers = [
    { id: 1, nom: 'Résidence Les Palmiers' },
    { id: 2, nom: 'Villa Duplex Riviera' },
    { id: 3, nom: 'Complexe Commercial Marcory' },
    { id: 4, nom: 'Maison Individuelle Yopougon' },
  ];

  documents: Document[] = [
    { id:1,  nom: 'Contrat MRC-2024-001 signé',      extension: 'pdf',  categorie: 'contrat', chantier: 'Résidence Les Palmiers',       chantier_id: 1, ajoute_par: 'Admin',         date: '15/02/2024', taille: '2.4 Mo' },
    { id:2,  nom: 'Plan masse RDC',                  extension: 'dwg',  categorie: 'plan',    chantier: 'Résidence Les Palmiers',       chantier_id: 1, ajoute_par: 'Kouassi Jean',  date: '28/02/2024', taille: '8.1 Mo' },
    { id:3,  nom: 'Plan façade principale',           extension: 'pdf',  categorie: 'plan',    chantier: 'Résidence Les Palmiers',       chantier_id: 1, ajoute_par: 'Kouassi Jean',  date: '01/03/2024', taille: '5.3 Mo' },
    { id:4,  nom: 'PV de démarrage chantier',        extension: 'pdf',  categorie: 'pv',      chantier: 'Résidence Les Palmiers',       chantier_id: 1, ajoute_par: 'Admin',         date: '01/03/2024', taille: '0.8 Mo' },
    { id:5,  nom: 'Photos gros œuvre — Juin 2024',   extension: 'zip',  categorie: 'photo',   chantier: 'Résidence Les Palmiers',       chantier_id: 1, ajoute_par: 'Kouassi Jean',  date: '30/06/2024', taille: '24.6 Mo' },
    { id:6,  nom: 'Contrat MRC-2024-002 signé',      extension: 'pdf',  categorie: 'contrat', chantier: 'Villa Duplex Riviera',         chantier_id: 2, ajoute_par: 'Admin',         date: '22/03/2024', taille: '1.9 Mo' },
    { id:7,  nom: 'PV de réception définitive',      extension: 'pdf',  categorie: 'pv',      chantier: 'Villa Duplex Riviera',         chantier_id: 2, ajoute_par: 'Traoré Moussa', date: '18/01/2025', taille: '1.1 Mo' },
    { id:8,  nom: 'Permis de construire',            extension: 'pdf',  categorie: 'divers',  chantier: 'Complexe Commercial Marcory', chantier_id: 3, ajoute_par: 'Admin',         date: '05/01/2025', taille: '3.7 Mo' },
    { id:9,  nom: 'Plans R+1 et R+2',               extension: 'dwg',  categorie: 'plan',    chantier: 'Complexe Commercial Marcory', chantier_id: 3, ajoute_par: 'Bamba Issiaka', date: '15/02/2025', taille: '12.2 Mo' },
    { id:10, nom: 'Assurance décennale 2025',        extension: 'pdf',  categorie: 'divers',  chantier: 'Maison Individuelle Yopougon',chantier_id: 4, ajoute_par: 'Admin',         date: '10/03/2025', taille: '0.6 Mo' },
    { id:11, nom: 'Photo fondations Yopougon',       extension: 'jpg',  categorie: 'photo',   chantier: 'Maison Individuelle Yopougon',chantier_id: 4, ajoute_par: 'Koné Seydou',  date: '20/03/2025', taille: '4.1 Mo' },
    { id:12, nom: 'Facture fournisseur béton',       extension: 'pdf',  categorie: 'facture', chantier: 'Résidence Les Palmiers',       chantier_id: 1, ajoute_par: 'Comptable',    date: '10/04/2024', taille: '0.4 Mo' },
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Filtre pré-appliqué si navigation depuis ChantierDetail
    this.route.queryParams.subscribe(params => {
      if (params['chantier']) {
        this.filtreChantier = params['chantier'];
      }
    });
  }

  get filteredDocuments(): Document[] {
    let list = this.documents;
    if (this.activeCategory !== 'tous') list = list.filter(d => d.categorie === this.activeCategory);
    if (this.filtreChantier) list = list.filter(d => d.chantier_id === Number(this.filtreChantier));
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(d => d.nom.toLowerCase().includes(q) || d.chantier.toLowerCase().includes(q));
    }
    return list;
  }

  // Nommé "Categorie" (fr) pour correspondre à l'appel dans le template HTML
  getCountByCategorie(cat: string): number {
    if (cat === 'tous') return this.documents.length;
    return this.documents.filter(d => d.categorie === cat).length;
  }

  getCategorieIcon(cat: string): string {
    return this.categories.find(c => c.key === cat)?.icon || 'folder';
  }

  getCategorieName(cat: string): string {
    const names: Record<string, string> = {
      contrat: 'Contrats', plan: 'Plans', pv: 'PV',
      facture: 'Factures', photo: 'Photos', divers: 'Divers'
    };
    return names[cat] || cat;
  }

  openUpload() { this.showUpload = true; }
  telecharger(doc: Document) { console.log('Télécharger', doc.nom); }
  supprimer(doc: Document) {
    this.documents = this.documents.filter(d => d.id !== doc.id);
  }
}