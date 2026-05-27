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
    combineLatest([
      this.chantierService.getEnCours(),
      this.factureService.getAll(),
    ]).subscribe({
      next: ([chantiers, factures]) => {
        const notifs: AppNotification[] = [];
        const today = Date.now();

        // ── Chantiers en retard ──────────────────────────
        for (const c of chantiers) {
          const prevue = new Date(c.date_livraison_prevue).getTime();
          const retardJours = Math.floor((today - prevue) / 86_400_000);
          if (retardJours > 0) {
            notifs.push({
              id: `retard-${c.id}`,
              type: retardJours > 30 ? 'danger' : 'warning',
              icon: 'schedule',
              titre: 'Chantier en retard',
              message: `${c.nom_chantier} — ${retardJours} jour${retardJours > 1 ? 's' : ''} de retard`,
              lien: `/chantiers/${c.id}`,
              lu: false,
            });
          }
        }

        // ── Budget dépassé ────────────────────────────────
        for (const c of chantiers) {
          const b = c.budget;
          if (b && b.debourse_sec_estime > 0 && b.cout_reel_a_date > b.debourse_sec_estime * 1.05) {
            const pct = Math.round((b.cout_reel_a_date / b.debourse_sec_estime - 1) * 100);
            notifs.push({
              id: `budget-${c.id}`,
              type: 'warning',
              icon: 'warning_amber',
              titre: 'Dépassement budgétaire',
              message: `${c.nom_chantier} — coût réel +${pct}% du déboursé estimé`,
              lien: `/chantiers/${c.id}`,
              lu: false,
            });
          }
        }

        // ── Factures en retard ────────────────────────────
        const facturesEnRetard = factures.filter(f => f.statut === 'en_retard');
        if (facturesEnRetard.length > 0) {
          notifs.push({
            id: 'factures-retard',
            type: 'danger',
            icon: 'receipt_long',
            titre: 'Factures en retard',
            message: `${facturesEnRetard.length} situation${facturesEnRetard.length > 1 ? 's' : ''} de travaux non réglée${facturesEnRetard.length > 1 ? 's' : ''}`,
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
            message: 'Aucune alerte en ce moment',
            lu: true,
          });
        }

        this._items.set(notifs);
      },
      error: () => {
        // Silencieux — pas de crash si l'API est indisponible
      }
    });
  }

  marquerToutLu(): void {
    this._items.update(list => list.map(n => ({ ...n, lu: true })));
  }

  marquerLu(id: string): void {
    this._items.update(list => list.map(n => n.id === id ? { ...n, lu: true } : n));
  }
}
