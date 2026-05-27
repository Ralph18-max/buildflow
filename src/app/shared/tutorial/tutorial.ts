import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';

export interface TutorialStep {
  emoji: string;
  titre: string;
  description: string;
  route?: string;
}

const STEPS_ADMIN: TutorialStep[] = [
  {
    emoji: '🎉',
    titre: 'Bienvenue sur BuildFlow !',
    description: 'BuildFlow est votre plateforme de gestion de chantiers BTP. Ce guide rapide vous présente les fonctionnalités disponibles selon votre rôle d\'Administrateur.',
  },
  {
    emoji: '👥',
    titre: 'Clients & Contrats',
    description: 'Dans l\'onglet Clients, créez et gérez vos maîtres d\'ouvrage. Dans Contrats, enregistrez les marchés signés, les montants, les délais et gérez les avenants.',
    route: '/clients',
  },
  {
    emoji: '🏗️',
    titre: 'Chantiers',
    description: 'Le cœur de l\'application. Suivez l\'avancement par corps d\'état, gérez le planning, le budget, les intervenants et les ressources de chaque chantier.',
    route: '/chantiers',
  },
  {
    emoji: '🧾',
    titre: 'Facturation',
    description: 'Émettez les situations de travaux, enregistrez les encaissements et suivez le reste à facturer en temps réel.',
    route: '/facturation',
  },
  {
    emoji: '📊',
    titre: 'Comptabilité',
    description: 'Gérez les factures de vos sous-traitants : réception, validation et suivi des règlements.',
    route: '/comptabilite',
  },
  {
    emoji: '📄',
    titre: 'Documents',
    description: 'Archivez plans, procès-verbaux, contrats et photos directement dans chaque chantier pour un accès rapide par toute l\'équipe.',
    route: '/documents',
  },
  {
    emoji: '👤',
    titre: 'Utilisateurs',
    description: 'Créez les comptes de vos collaborateurs (conducteur de travaux, chef de chantier, comptable) et gérez leurs accès depuis l\'onglet Utilisateurs.',
    route: '/users',
  },
];

const STEPS_CONDUCTEUR: TutorialStep[] = [
  {
    emoji: '🎉',
    titre: 'Bienvenue sur BuildFlow !',
    description: 'Voici votre espace Conducteur de travaux. Ce guide rapide vous présente vos fonctionnalités.',
  },
  {
    emoji: '👥',
    titre: 'Clients & Contrats',
    description: 'Consultez les clients et les marchés signés. Vous pouvez créer de nouveaux contrats et soumettre des avenants pour validation.',
    route: '/contrats',
  },
  {
    emoji: '🏗️',
    titre: 'Chantiers',
    description: 'Créez et suivez vos chantiers. Mettez à jour l\'avancement des corps d\'état, gérez le planning et les jalons.',
    route: '/chantiers',
  },
  {
    emoji: '🦺',
    titre: 'Terrain',
    description: 'Saisissez les rapports journaliers (météo, effectif, incidents) et gérez les feuilles de pointage de vos équipes.',
    route: '/terrain',
  },
  {
    emoji: '📄',
    titre: 'Documents',
    description: 'Uploadez et consultez les documents de chantier — plans, PV, photos — accessibles par toute l\'équipe.',
    route: '/documents',
  },
];

const STEPS_CHEF: TutorialStep[] = [
  {
    emoji: '🎉',
    titre: 'Bienvenue sur BuildFlow !',
    description: 'Voici votre espace Chef de chantier. Ce guide rapide vous présente vos fonctionnalités terrain.',
  },
  {
    emoji: '🏗️',
    titre: 'Chantiers',
    description: 'Consultez l\'avancement de vos chantiers, les corps d\'état en cours et les jalons du planning. Mettez à jour le pourcentage d\'avancement des lots.',
    route: '/chantiers',
  },
  {
    emoji: '🦺',
    titre: 'Rapports journaliers',
    description: 'Soumettez chaque jour un rapport terrain : conditions météo, effectif présent, travaux réalisés et incidents éventuels.',
    route: '/terrain',
  },
  {
    emoji: '✅',
    titre: 'Pointage',
    description: 'Enregistrez les feuilles de présence journalières de vos intervenants depuis l\'onglet Terrain → Pointage.',
    route: '/terrain/pointage',
  },
  {
    emoji: '📄',
    titre: 'Documents',
    description: 'Consultez les plans et documents de chantier. Uploadez photos et PV directement depuis le terrain.',
    route: '/documents',
  },
];

const STEPS_COMPTABLE: TutorialStep[] = [
  {
    emoji: '🎉',
    titre: 'Bienvenue sur BuildFlow !',
    description: 'Voici votre tableau de bord Comptable. Ce guide rapide vous présente vos fonctionnalités financières.',
  },
  {
    emoji: '🏗️',
    titre: 'Chantiers — Vue financière',
    description: 'Consultez l\'état financier de chaque chantier : budget prévu, coût réel, marge prévisionnelle et reste à dépenser.',
    route: '/chantiers',
  },
  {
    emoji: '🧾',
    titre: 'Facturation',
    description: 'Émettez les situations de travaux, enregistrez les encaissements et gérez la retenue de garantie. Suivez les factures en retard.',
    route: '/facturation',
  },
  {
    emoji: '📊',
    titre: 'Comptabilité',
    description: 'Réceptionnez et validez les factures des sous-traitants. Suivez leur statut (en attente, validée, contestée).',
    route: '/comptabilite',
  },
  {
    emoji: '🔒',
    titre: 'Clôture des chantiers',
    description: 'Une fois les travaux terminés, validez le bilan comptable depuis la fiche chantier (onglet Clôture) pour déclencher la clôture administrative.',
    route: '/chantiers',
  },
];

@Component({
  selector: 'app-tutorial',
  standalone: true,
  imports: [],
  templateUrl: './tutorial.html',
  styleUrl: './tutorial.scss',
})
export class TutorialComponent implements OnInit {

  @Input() userId!: number;
  @Output() ferme = new EventEmitter<void>();

  steps: TutorialStep[] = [];
  stepIndex = 0;
  visible = false;

  constructor(private perms: PermissionService) {}

  ngOnInit(): void {
    const key = `bf_tutorial_${this.userId}`;
    if (localStorage.getItem(key)) return;

    const role = this.perms.role;
    if (role === 'admin')         this.steps = STEPS_ADMIN;
    else if (role === 'conducteur') this.steps = STEPS_CONDUCTEUR;
    else if (role === 'chef_chantier') this.steps = STEPS_CHEF;
    else if (role === 'comptable')  this.steps = STEPS_COMPTABLE;
    else this.steps = STEPS_CONDUCTEUR;

    this.visible = true;
  }

  get step(): TutorialStep { return this.steps[this.stepIndex]; }
  get isLast(): boolean    { return this.stepIndex === this.steps.length - 1; }
  get isFirst(): boolean   { return this.stepIndex === 0; }

  suivant(): void {
    if (this.isLast) { this.terminer(); return; }
    this.stepIndex++;
  }

  precedent(): void {
    if (!this.isFirst) this.stepIndex--;
  }

  terminer(): void {
    localStorage.setItem(`bf_tutorial_${this.userId}`, '1');
    this.visible = false;
    this.ferme.emit();
  }
}
