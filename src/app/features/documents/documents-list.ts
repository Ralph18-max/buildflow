import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { DocumentService } from '../../core/services/document.service';
import { ChantierService } from '../../core/services/chantier.service';
import { Document as ServiceDoc } from '../../core/models';
import { CanPipe } from '../../core/pipes/can.pipe';

interface DocVue {
  id: number;
  nom: string;
  extension: string;
  categorie: 'contrat' | 'plan' | 'pv' | 'facture' | 'photo' | 'divers';
  chantier: string;
  chantier_id: number;
  ajoute_par: string;
  date: string;
  taille: string;
  url?: string;
}

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, CanPipe],
  templateUrl: './documents-list.html',
  styleUrl: './documents-list.scss'
})
export class DocumentsList implements OnInit, OnDestroy {

  searchQuery = '';
  activeCategory = 'tous';
  filtreChantier = '';
  showUpload = false;

  categories = [
    { key: 'contrat', label: 'Contrats',       icon: 'description' },
    { key: 'plan',    label: 'Plans',           icon: 'architecture' },
    { key: 'pv',      label: 'PV / Réceptions', icon: 'task_alt' },
    { key: 'facture', label: 'Factures',        icon: 'receipt' },
    { key: 'photo',   label: 'Photos',          icon: 'photo_camera' },
    { key: 'divers',  label: 'Divers',          icon: 'folder' },
  ];

  chantiers: { id: number; nom: string }[] = [];

  documents: DocVue[] = [];

  private subs = new Subscription();

  erreurUpload = '';

  constructor(
    private route: ActivatedRoute,
    private docService: DocumentService,
    private chantierService: ChantierService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['chantier']) this.filtreChantier = params['chantier'];
    });
    this.subs.add(
      this.docService.getAll().subscribe(docs => {
        this.documents = docs.map(d => this.mapDoc(d));
      })
    );
    this.chantierService.getOptions().subscribe(opts => this.chantiers = opts);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private mapDoc(d: ServiceDoc): DocVue {
    const taille = d.taille_ko >= 1024
      ? `${(d.taille_ko / 1024).toFixed(1)} Mo`
      : `${d.taille_ko} Ko`;
    return {
      id:          d.id,
      nom:         d.nom_fichier,
      extension:   d.extension,
      categorie:   d.categorie as DocVue['categorie'],
      chantier:    d.nom_chantier,
      chantier_id: d.id_chantier,
      ajoute_par:  d.ajoute_par,
      date:        d.date_upload,
      taille,
      url:         d.url_fichier,
    };
  }

  get filteredDocuments(): DocVue[] {
    let list = this.documents;
    if (this.activeCategory !== 'tous') list = list.filter(d => d.categorie === this.activeCategory);
    if (this.filtreChantier) list = list.filter(d => d.chantier_id === Number(this.filtreChantier));
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(d => d.nom.toLowerCase().includes(q) || d.chantier.toLowerCase().includes(q));
    }
    return list;
  }

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

  successUpload = false;
  isUploading   = false;
  selectedFile: File | null = null;
  dragOver = false;
  formUpload = { nom: '', categorie: 'divers', chantier_id: 0 };

  openUpload(): void {
    this.formUpload   = { nom: '', categorie: 'divers', chantier_id: this.chantiers[0]?.id || 0 };
    this.selectedFile = null;
    this.showUpload   = true;
    this.successUpload = false;
    this.erreurUpload  = '';
  }

  fermerUpload(): void { this.showUpload = false; }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  onFileInput(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  private static readonly TYPES_AUTORISES = [
    'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'text/plain',
  ];
  private static readonly TAILLE_MAX_OCTETS = 10 * 1024 * 1024; // 10 Mo

  private setFile(file: File): void {
    this.erreurUpload = '';
    if (file.size > DocumentsList.TAILLE_MAX_OCTETS) {
      this.erreurUpload = `Fichier trop volumineux (max 10 Mo). Taille actuelle : ${(file.size / 1024 / 1024).toFixed(1)} Mo.`;
      return;
    }
    if (!DocumentsList.TYPES_AUTORISES.includes(file.type)) {
      this.erreurUpload = 'Type de fichier non autorisé. Formats acceptés : PDF, images (JPG/PNG), Word, Excel, ZIP, texte.';
      return;
    }
    this.selectedFile   = file;
    this.formUpload.nom = file.name;
  }

  validerUpload(): void {
    this.erreurUpload = '';
    if (!this.selectedFile)           { this.erreurUpload = 'Sélectionnez un fichier.'; return; }
    if (!this.formUpload.chantier_id) { this.erreurUpload = 'Sélectionnez un chantier.'; return; }

    this.isUploading = true;
    this.docService.uploadFichier(
      this.selectedFile,
      Number(this.formUpload.chantier_id),
      this.formUpload.categorie,
    ).subscribe({
      next: (doc) => {
        this.documents   = [...this.documents, this.mapDoc(doc)];
        this.isUploading  = false;
        this.successUpload = true;
        setTimeout(() => { this.showUpload = false; this.successUpload = false; }, 1800);
      },
      error: (err: any) => {
        this.isUploading  = false;
        this.erreurUpload = err?.error?.message || 'Erreur lors de l\'envoi.';
      },
    });
  }

  telecharger(doc: DocVue): void {
    if (doc.url) window.open(doc.url, '_blank');
  }

  supprimer(doc: DocVue): void {
    if (!confirm(`Supprimer "${doc.nom}" ? Cette action est irréversible.`)) return;
    this.documents = this.documents.filter(d => d.id !== doc.id);
    this.docService.supprimer(doc.id).subscribe();
  }
}
