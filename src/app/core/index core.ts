// ============================================================
// BuildDFlow — Core Module
// Point d'entrée unique : import depuis '@core' dans les composants
//
// Usage dans un composant :
//   import { ChantierService, Chantier } from '@core';
//   (ou chemin relatif : '../../../core')
// ============================================================

// Modèles
export * from './models';

// Services
export { ChantierService } from './services/chantier.service';
export { ContratService } from './services/contrat.service';

// Les services ci-dessous sont dans autres-services.ts
// À séparer en fichiers individuels selon la section ci-dessous
export { ClientService } from './services/client.service';
export { FactureService } from './services/facture.service';
export { DocumentService } from './services/document.service';
export { TerrainService } from './services/terrain.service';
export { UtilisateurService } from './services/utilisateur.service';