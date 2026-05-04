import { Component } from '@angular/core';
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

  menuOpen = false;

  features = [
    { icon: 'payments', title: 'Budget S0 & Marges', desc: 'Déboursé sec figé au démarrage. RAD, RAF et marge calculés automatiquement.' },
    { icon: 'calendar_month', title: 'Planning Gantt', desc: 'Jalons, corps d\'état, chemin critique. Détection automatique des retards.' },
    { icon: 'location_on', title: 'Suivi Terrain', desc: 'Rapports journaliers, pointage MO, photos datées. Avancement pondéré en temps réel.' },
    { icon: 'handshake', title: 'Clients & Contrats', desc: 'Numéros de marché, pénalités, statut contrat — tout centralisé et traçable.' },
    { icon: 'dashboard', title: 'Tableau de bord', desc: 'Avancement global, écart budget, délais — vision en temps réel sans surprise.' },
    { icon: 'receipt_long', title: 'Situations & Clôture', desc: 'Situations d\'avancement progressives. Clôture conjointe Comptable + Admin.' },
  ];

  roles = [
    { icon: 'admin_panel_settings', title: 'Administrateur', desc: 'Vision complète. Clients, contrats, budget S0, clôture et gestion des accès.' },
    { icon: 'engineering', title: 'Conducteur de travaux', desc: 'Planning, avancement des corps d\'état, intervenants et situations de travaux.' },
    { icon: 'construction', title: 'Chef de chantier', desc: 'Rapports journaliers, pointage main d\'œuvre, incidents, photos. Terrain uniquement.' },
    { icon: 'account_balance', title: 'Comptable', desc: 'Encaissements, factures sous-traitants, analyses de marges et validation bilan.' },
  ];
 scrollTo(id: string) {
  this.menuOpen = false;
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 150);
 }
}