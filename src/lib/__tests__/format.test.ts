import { avatarColors, countLabel, formatDateTime, initials, pageLabel, telUrl } from '../format';

describe('format', () => {
  it('affiche les dates dans le fuseau Africa/Conakry (UTC+0, sans heure d’été)', () => {
    expect(formatDateTime('2026-10-21T06:42:00.000Z')).toBe('21 oct. 2026 · 06:42');
    // Minuit UTC reste le même jour à Conakry, quel que soit le fuseau de l'appareil.
    expect(formatDateTime('2026-10-20T23:59:00.000Z')).toBe('20 oct. 2026 · 23:59');
  });

  it('calcule les initiales comme le web', () => {
    expect(initials('Société Minière de Boké')).toBe('SM');
    expect(initials('Orange Guinée — Direction IT')).toBe('OG');
    expect(initials('Ets Kouyaté & Fils')).toBe('EK');
    expect(initials('mariama')).toBe('M');
  });

  it('choisit une couleur d’avatar stable pour un identifiant', () => {
    expect(avatarColors('abc')).toBe(avatarColors('abc'));
  });

  it('retire les espaces du lien d’appel uniquement', () => {
    expect(telUrl('+224 657 33 90 01')).toBe('tel:%2B224657339001');
  });

  it('formate le compteur et la pagination', () => {
    expect(countLabel(0)).toBe('Aucune demande enregistrée');
    expect(countLabel(1)).toBe('1 demande');
    expect(countLabel(26, 3)).toBe('26 demandes · 3 prioritaires');
    expect(pageLabel(2, 2, 20, 26)).toBe('Page 2 sur 2 · 21–26 sur 26');
  });
});
