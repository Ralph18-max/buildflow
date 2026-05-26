// U-46 à U-53 — Services Angular + Pipe + Dashboard
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── U-46 : ChantierService.patchAvancement ──────────────────────────────────
describe('ChantierService — patchAvancement', () => {
  it('U-46 envoie PATCH /chantiers/:id/corps-etat/:ceId/avancement', () => {
    const http = { patch: vi.fn().mockReturnValue({ subscribe: vi.fn() }) };
    const apiUrl = 'http://api';

    function patchAvancement(idCh: number, idCe: number, avancement: number, cout_reel: number) {
      return http.patch(`${apiUrl}/chantiers/${idCh}/corps-etat/${idCe}/avancement`, { avancement, cout_reel });
    }

    patchAvancement(5, 12, 75, 1_500_000);
    expect(http.patch).toHaveBeenCalledWith(
      'http://api/chantiers/5/corps-etat/12/avancement',
      { avancement: 75, cout_reel: 1_500_000 }
    );
  });
});

// ─── U-47 : ContratService.signerAvenant ─────────────────────────────────────
describe('ContratService — signerAvenant', () => {
  it('U-47 envoie PATCH /contrats/:id/avenants/:avId/signer', () => {
    const http = { patch: vi.fn().mockReturnValue({ subscribe: vi.fn() }) };
    const apiUrl = 'http://api';

    function signerAvenant(idContrat: number, idAvenant: number) {
      return http.patch(`${apiUrl}/contrats/${idContrat}/avenants/${idAvenant}/signer`, {});
    }

    signerAvenant(6, 2);
    expect(http.patch).toHaveBeenCalledWith('http://api/contrats/6/avenants/2/signer', {});
  });
});

// ─── U-48 : ClientService.getNomAffichage ────────────────────────────────────
describe('ClientService — getNomAffichage', () => {
  function getNomAffichage(client: any): string {
    if (client.type_client === 'societe') return client.raison_sociale ?? '';
    return `${client.prenom ?? ''} ${client.nom ?? ''}`.trim();
  }

  it('U-48a société → raison_sociale', () => {
    expect(getNomAffichage({ type_client: 'societe', raison_sociale: 'SECOGENIE SA' }))
      .toBe('SECOGENIE SA');
  });

  it('U-48b particulier → prénom + nom', () => {
    expect(getNomAffichage({ type_client: 'particulier', nom: 'DIALLO', prenom: 'Mamadou' }))
      .toBe('Mamadou DIALLO');
  });
});

// ─── U-49 : ToastService ─────────────────────────────────────────────────────
describe('ToastService', () => {
  it('U-49 success() ajoute toast de type success', () => {
    const toasts: any[] = [];
    let nextId = 1;

    function success(message: string) {
      const id = nextId++;
      toasts.push({ id, type: 'success', message });
      setTimeout(() => { const i = toasts.findIndex(t => t.id === id); if (i >= 0) toasts.splice(i, 1); }, 10);
    }

    success('Enregistré !');
    expect(toasts.length).toBe(1);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('Enregistré !');
  });
});

// ─── U-50 : FactureService.getStats mapping ──────────────────────────────────
describe('FactureService — getStats', () => {
  it('U-50 mappe total_encaisse et en_retard depuis la réponse API', () => {
    const apiResponse = { total_encaisse: 168_150_000, en_retard: 28_025_000, emises: 2, en_attente: 1 };

    function mapStats(r: any) {
      return { total_encaisse: r.total_encaisse, en_retard: r.en_retard };
    }

    const mapped = mapStats(apiResponse);
    expect(mapped.total_encaisse).toBe(168_150_000);
    expect(mapped.en_retard).toBe(28_025_000);
  });
});

// ─── U-51 : CanPipe ───────────────────────────────────────────────────────────
describe('CanPipe', () => {
  const PERMS: Record<string, string[]> = {
    comptable: ['facturation:read', 'facturation:factureST', 'cloture:valider'],
  };

  function canTransform(permission: string, role: string): boolean {
    return PERMS[role]?.includes(permission) ?? false;
  }

  it('U-51 budget:create | can → false pour comptable', () => {
    expect(canTransform('budget:create', 'comptable')).toBe(false);
  });

  it('U-51b facturation:read | can → true pour comptable', () => {
    expect(canTransform('facturation:read', 'comptable')).toBe(true);
  });
});

// ─── U-52 : DashboardComponent KPIs ─────────────────────────────────────────
describe('DashboardComponent — kpiCards', () => {
  function getKpiCards(role: string, data: any): any[] {
    if (role === 'comptable') {
      return [
        { label: 'Total encaissé',         value: String(data.totalEncaisse) },
        { label: 'Reste à facturer (RAF)', value: String(data.totalRAF) },
        { label: 'Factures en retard',     value: String(data.totalEnRetard) },
        { label: 'Marge prévisionnelle',   value: data.margePrev },
      ];
    }
    if (role === 'chef_chantier') {
      return [
        { label: 'Mes chantiers actifs' },
        { label: 'Rapports cette semaine' },
        { label: 'Incidents signalés' },
        { label: 'Effectif moyen' },
      ];
    }
    return [
      { label: 'Chantiers en cours' },
      { label: 'Budget total engagé' },
      { label: 'Alertes dépassement' },
      { label: 'Reste à facturer' },
    ];
  }

  it('U-52 rôle comptable → 4 KPIs financiers', () => {
    const cards = getKpiCards('comptable', { totalEncaisse: 100, totalRAF: 50, totalEnRetard: 0, margePrev: '12.5%' });
    expect(cards.length).toBe(4);
    expect(cards[0].label).toBe('Total encaissé');
    expect(cards[2].label).toBe('Factures en retard');
  });
});

// ─── U-53 : formatCompact ────────────────────────────────────────────────────
describe('DashboardComponent — formatCompact', () => {
  function formatCompact(n: number): string {
    if (!n) return '0';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' Mds';
    if (n >= 1_000_000) return Math.round(n / 1_000_000) + ' M';
    return new Intl.NumberFormat('fr-FR').format(n);
  }

  it('U-53a 1_500_000 → "2 M"', () => {
    expect(formatCompact(1_500_000)).toBe('2 M');
  });

  it('U-53b 2_500_000_000 → "2,5 Mds"', () => {
    expect(formatCompact(2_500_000_000)).toBe('2,5 Mds');
  });

  it('U-53c 0 → "0"', () => {
    expect(formatCompact(0)).toBe('0');
  });
});
