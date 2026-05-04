import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BudgetS0Component } from '../../budget/budget';


interface CorpsEtat {
  id: number;
  nom: string;
  part: number;
  avancement: number;
  budget: string;
  responsable: string;
  statut: 'en_cours' | 'termine' | 'non_demarre';
}

interface Intervenant {
  id: number;
  nom: string;
  role: string;
  entreprise: string;
  telephone: string;
  statut: 'actif' | 'inactif';
}

interface Jalon {
  id: number;
  nom: string;
  date_debut: string;
  date_fin: string;
  avancement: number;
  couleur: string;
  offset: number;
  duree: number;
}

interface Chantier {
  id: number;
  nom: string;
  localisation: string;
  client: string;
  numero_marche: string;
  chef_chantier: string;
  date_demarrage: string;
  date_livraison: string;
  avancement: number;
  statut: string;
  budget: string;
  retard: number;
  corps_etat: number;
  description: string;
}

@Component({
  selector: 'app-chantier-detail',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, BudgetS0Component],
  templateUrl: './chantier-detail.html',
  styleUrl: './chantier-detail.scss'
})
export class ChantierDetail implements OnInit {

  activeTab = 'resume';
  chantier: Chantier | null = null;

  chantiers: Chantier[] = [
    {
      id: 1,
      nom: 'Résidence Les Palmiers',
      localisation: 'Cocody, Abidjan',
      client: 'SCI Les Palmiers',
      numero_marche: 'MRC-2024-001',
      chef_chantier: 'Traoré Awa',
      date_demarrage: '01/03/2024',
      date_livraison: '28/02/2026',
      avancement: 72,
      statut: 'en_cours',
      budget: '820 000 000',
      retard: 5,
      corps_etat: 6,
      description: 'Résidence de 24 appartements sur 4 niveaux avec parking souterrain.'
    },
    {
      id: 2,
      nom: 'Villa Duplex Riviera',
      localisation: 'Riviera 3, Abidjan',
      client: 'Konan Yves',
      numero_marche: 'MRC-2024-002',
      chef_chantier: 'Diabaté Moussa',
      date_demarrage: '15/04/2024',
      date_livraison: '14/04/2025',
      avancement: 100,
      statut: 'termine',
      budget: '180 000 000',
      retard: 0,
      corps_etat: 5,
      description: 'Villa duplex avec piscine, 5 chambres, double garage.'
    },
    {
      id: 3,
      nom: 'Complexe Commercial Marcory',
      localisation: 'Marcory, Abidjan',
      client: 'Groupe Immobilier du Sud',
      numero_marche: 'MRC-2025-001',
      chef_chantier: 'Koné Ibrahim',
      date_demarrage: '01/03/2025',
      date_livraison: '28/02/2027',
      avancement: 18,
      statut: 'en_cours',
      budget: '1 200 000 000',
      retard: 12,
      corps_etat: 8,
      description: 'Complexe commercial R+3 avec galerie marchande et bureaux.'
    },
    {
      id: 4,
      nom: 'Maison Individuelle Yopougon',
      localisation: 'Yopougon, Abidjan',
      client: 'Diabaté Moussa',
      numero_marche: 'MRC-2025-002',
      chef_chantier: 'Non assigné',
      date_demarrage: '01/08/2025',
      date_livraison: '31/07/2026',
      avancement: 5,
      statut: 'en_cours',
      budget: '95 000 000',
      retard: 0,
      corps_etat: 4,
      description: 'Maison individuelle 4 pièces sur terrain de 400m².'
    },
  ];

  corpsEtatList: CorpsEtat[] = [
    { id: 1, nom: 'Gros œuvre', part: 35, avancement: 100, budget: '287 000 000', responsable: 'Koné Ibrahim', statut: 'termine' },
    { id: 2, nom: 'Charpente / Couverture', part: 10, avancement: 90, budget: '82 000 000', responsable: 'Bamba Seydou', statut: 'en_cours' },
    { id: 3, nom: 'Plomberie / Sanitaire', part: 12, avancement: 75, budget: '98 400 000', responsable: 'Touré Mamadou', statut: 'en_cours' },
    { id: 4, nom: 'Électricité', part: 15, avancement: 60, budget: '123 000 000', responsable: 'Yao Kouassi', statut: 'en_cours' },
    { id: 5, nom: 'Menuiserie / Alu', part: 18, avancement: 40, budget: '147 600 000', responsable: 'Soro Drissa', statut: 'en_cours' },
    { id: 6, nom: 'Peinture / Finitions', part: 10, avancement: 5, budget: '82 000 000', responsable: 'Non assigné', statut: 'non_demarre' },
  ];

  intervenants: Intervenant[] = [
    { id: 1, nom: 'Traoré Awa', role: 'Chef de chantier', entreprise: 'BuildDFlow SA', telephone: '+225 07 12 34 56', statut: 'actif' },
    { id: 2, nom: 'Koné Ibrahim', role: 'Conducteur gros œuvre', entreprise: 'GCO Abidjan', telephone: '+225 05 98 76 54', statut: 'actif' },
    { id: 3, nom: 'Bamba Seydou', role: 'Charpentier', entreprise: 'Toiture Plus CI', telephone: '+225 01 23 45 67', statut: 'actif' },
    { id: 4, nom: 'Touré Mamadou', role: 'Plombier', entreprise: 'Hydro Services', telephone: '+225 07 65 43 21', statut: 'actif' },
    { id: 5, nom: 'Yao Kouassi', role: 'Électricien', entreprise: 'Élec Pro CI', telephone: '+225 05 11 22 33', statut: 'actif' },
    { id: 6, nom: 'Soro Drissa', role: 'Menuisier alu', entreprise: 'Alu Design', telephone: '+225 01 44 55 66', statut: 'inactif' },
  ];

  jalons: Jalon[] = [
    { id: 1, nom: 'Gros œuvre', date_debut: 'Mar 2024', date_fin: 'Sep 2024', avancement: 100, couleur: '#48bb78', offset: 0, duree: 25 },
    { id: 2, nom: 'Charpente', date_debut: 'Sep 2024', date_fin: 'Nov 2024', avancement: 90, couleur: '#E8520A', offset: 25, duree: 10 },
    { id: 3, nom: 'Plomberie', date_debut: 'Oct 2024', date_fin: 'Jan 2025', avancement: 75, couleur: '#E8520A', offset: 28, duree: 14 },
    { id: 4, nom: 'Électricité', date_debut: 'Nov 2024', date_fin: 'Mar 2025', avancement: 60, couleur: '#E8520A', offset: 33, duree: 17 },
    { id: 5, nom: 'Menuiserie', date_debut: 'Jan 2025', date_fin: 'Mai 2025', avancement: 40, couleur: '#e53e3e', offset: 42, duree: 17 },
    { id: 6, nom: 'Peinture', date_debut: 'Avr 2025', date_fin: 'Fév 2026', avancement: 5, couleur: '#e53e3e', offset: 55, duree: 45 },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.chantier = this.chantiers.find(c => c.id === id) || null;
  }

  // ─── CORRECTION : getter pour montant_marche_contrat ───
  get montant_marche_contrat(): number {
    if (!this.chantier) return 0;
    return parseInt(this.chantier.budget.replace(/\s/g, ''), 10) || 0;
  }

  retour() {
    this.router.navigate(['/chantiers']);
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      en_cours: 'En cours',
      termine: 'Terminé',
      suspendu: 'Suspendu',
      non_demarre: 'Non démarré'
    };
    return labels[statut] || statut;
  }

  getAvancementColor(avancement: number): string {
    if (avancement >= 80) return '#48bb78';
    if (avancement >= 40) return '#E8520A';
    return '#e53e3e';
  }

  getTotalBudget(): number {
    return this.corpsEtatList.reduce((sum, ce) => {
      return sum + parseInt(ce.budget.replace(/\s/g, ''), 10);
    }, 0);
  }

  voirDocuments() {
    this.router.navigate(['/documents'], {
      queryParams: { chantier: this.chantier?.id }
    });
  }

  getAvancementGlobal(): number {
    return Math.round(
      this.corpsEtatList.reduce((sum, ce) => sum + (ce.part * ce.avancement) / 100, 0)
    );
  }
}