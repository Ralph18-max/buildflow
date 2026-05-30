import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChantierService } from './chantier.service';
import { FactureService } from './facture.service';

export type NotifType = 'danger' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  type: NotifType;
  icon: string;
  titre: string;
  message: string;
  detail?: string;
  horodatage?: string;
  lien?: string;
  lu: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private _items = signal<AppNotification[]>([]);

  readonly notifications = this._items.asReadonly();

  readonly unreadCount = computed(() =>
    this._items().filter(n => !n.lu).length
  );

  constructor(
    private http: HttpClient,
    private chantierService: ChantierService,
    private factureService: FactureService,
  ) {}

  charger(): void {
    const maintenant = new Date();
    const horodatage = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    combineLatest([
      this.chantierService.getEnCours(),
      this.factureService.getAll(),
    ]).subscribe({
      next: ([chantiers, factures]) => {
        const notifs: AppNotification[] = [];
        const today = Date.now();

        // ── Chantiers en retard ──────────────────────────
        for (const c of chantiers) {
          if (!c.date_livraison_prevue) continue;
          const prevue = new Date(c.date_livraison_prevue).getTime();
          const retardJours = Math.floor((today - prevue) / 86_400_000);
          if (retardJours > 0) {
            const datePrevueFr = new Date(c.date_livraison_prevue)
              .toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
            const avancement = c.avancement_global ?? 0;
            notifs.push({
              id: `retard-${c.id}`,
              type: retardJours > 30 ? 'danger' : 'warning',
              icon: 'schedule',
              titre: 'Chantier en retard',
              message: `${c.nom_chantier} — ${retardJours} jour${retardJours > 1 ? 's' : ''} de retard`,
              detail: [
                `Chantier : ${c.nom_chantier}`,
                `Livraison prévue : ${datePrevueFr}`,
                `Retard : ${retardJours} jour${retardJours > 1 ? 's' : ''}`,
                `Avancement actuel : ${avancement}%`,
                retardJours > 30 ? '⚠️ Retard critique — plus de 30 jours.' : 'Intervenir pour rattraper le planning.',
              ].join('\n'),
              horodatage,
              lien: `/chantiers/${c.id}`,
              lu: false,
            });
          }
        }

        // ── Budget dépassé ────────────────────────────────
        for (const c of chantiers) {
          const b = c.budget;
          if (b && b.debourse_sec_estime > 0 && b.cout_reel_a_date > b.debourse_sec_estime * 1.05) {
            const pct      = Math.round((b.cout_reel_a_date / b.debourse_sec_estime - 1) * 100);
            const budget   = new Intl.NumberFormat('fr-FR').format(b.debourse_sec_estime) + ' FCFA';
            const coutReel = new Intl.NumberFormat('fr-FR').format(b.cout_reel_a_date) + ' FCFA';
            const ecart    = new Intl.NumberFormat('fr-FR').format(b.cout_reel_a_date - b.debourse_sec_estime) + ' FCFA';
            notifs.push({
              id: `budget-${c.id}`,
              type: 'warning',
              icon: 'warning_amber',
              titre: 'Dépassement budgétaire',
              message: `${c.nom_chantier} — coût réel +${pct}% du déboursé estimé`,
              detail: [
                `Chantier : ${c.nom_chantier}`,
                `Déboursé estimé (S0) : ${budget}`,
                `Coût réel à date : ${coutReel}`,
                `Écart : +${ecart} (+${pct}%)`,
                'Vérifier les postes en dépassement.',
              ].join('\n'),
              horodatage,
              lien: `/chantiers/${c.id}`,
              lu: false,
            });
          }
        }

        // ── Factures en retard ────────────────────────────
        const facturesEnRetard = factures.filter(f => f.statut === 'en_retard');
        if (facturesEnRetard.length > 0) {
          const totalRestant = facturesEnRetard.reduce((s, f) => s + (f.reste_a_payer ?? 0), 0);
          const chantiersConcernes = [...new Set(facturesEnRetard.map(f => f.nom_chantier))];
          notifs.push({
            id: 'factures-retard',
            type: 'danger',
            icon: 'receipt_long',
            titre: 'Factures en retard',
            message: `${facturesEnRetard.length} situation${facturesEnRetard.length > 1 ? 's' : ''} de travaux non réglée${facturesEnRetard.length > 1 ? 's' : ''}`,
            detail: [
              `Situations en retard : ${facturesEnRetard.length}`,
              `Montant total à encaisser : ${new Intl.NumberFormat('fr-FR').format(totalRestant)} FCFA`,
              `Chantiers concernés :`,
              ...chantiersConcernes.map(n => `  • ${n}`),
              'Relancer les clients pour régulariser.',
            ].join('\n'),
            horodatage,
            lien: '/facturation',
            lu: false,
          });
        }

        // ── Aucune alerte ─────────────────────────────────
        if (notifs.length === 0) {
          notifs.push({
            id: 'ok',
            type: 'info',
            icon: 'check_circle',
            titre: 'Tout est à jour',
            message: 'Aucune alerte en ce moment.',
            detail: 'Tous les chantiers respectent leur planning et budget. Toutes les factures sont réglées.',
            horodatage,
            lu: true,
          });
        }

        this._items.set(notifs);
      },
      error: () => {}
    });
  }

  marquerToutLu(): void {
    this._items.update(list => list.map(n => ({ ...n, lu: true })));
  }

  marquerLu(id: string): void {
    this._items.update(list => list.map(n => n.id === id ? { ...n, lu: true } : n));
  }
}
