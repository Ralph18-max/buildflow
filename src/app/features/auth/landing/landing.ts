import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, NgFor],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class LandingComponent {

  menuOpen     = false;
  dropdownOpen = false;
  scrolled     = false;

  @HostListener('window:scroll')
  onScroll() { this.scrolled = window.scrollY > 40; }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event): void {
    if (!(e.target as HTMLElement).closest('.nav-dropdown-wrap')) {
      this.dropdownOpen = false;
    }
  }

  features = [
    { icon: 'account_balance_wallet', color: '#E8520A', title: 'Budget S0 & Marges',    desc: 'Déboursé sec figé au démarrage. RAD, RAF et marge calculés automatiquement.' },
    { icon: 'calendar_month',         color: '#2563EB', title: 'Planning & Jalons',       desc: 'Jalons, corps d\'état, chemin critique. Détection automatique des retards.' },
    { icon: 'handshake',               color: '#059669', title: 'Clients & Contrats',      desc: 'Numéros de marché, pénalités, avenants signés — tout centralisé et traçable.' },
    { icon: 'assignment',             color: '#7C3AED', title: 'Rapports terrain',        desc: 'Rapports journaliers, pointage MO, météo, incidents. Avancement pondéré en temps réel.' },
    { icon: 'dashboard',              color: '#D97706', title: 'Tableau de bord',         desc: 'Avancement global, écart budget, délais — vision instantanée sans surprise.' },
    { icon: 'receipt_long',           color: '#0891B2', title: 'Situations & Clôture',    desc: 'Facturation progressive avec retenue de garantie. Clôture en deux étapes.' },
  ];

  roles = [
    { icon: 'admin_panel_settings', color: '#E8520A', title: 'Administrateur',        desc: 'Vision complète. Clients, contrats, budget S0, clôture et gestion des accès.' },
    { icon: 'engineering',          color: '#2563EB', title: 'Conducteur de travaux', desc: 'Planning, avancement des corps d\'état, intervenants et situations de travaux.' },
    { icon: 'construction',         color: '#059669', title: 'Chef de chantier',      desc: 'Rapports journaliers, pointage main d\'œuvre, incidents, photos. Terrain uniquement.' },
    { icon: 'account_balance',      color: '#7C3AED', title: 'Comptable',             desc: 'Encaissements, factures sous-traitants, analyses de marges et validation bilan.' },
  ];

  scrollTo(id: string) {
    this.menuOpen     = false;
    this.dropdownOpen = false;
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }
}
