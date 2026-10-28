import { avatarPalette } from '@/theme/tokens';

// Dates : toujours en fuseau Africa/Conakry, jamais celui de l'appareil.
const TZ = 'Africa/Conakry';
const fDate = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
const fTime = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });

export function formatDate(iso: string): string {
  return fDate.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return fTime.format(new Date(iso));
}

/** « 21 oct. 2026 · 06:42 » */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

/** Nombre au format français, ex. 5 000 (espace insécable fine normalisée en espace simple). */
export function formatCount(n: number): string {
  return n.toLocaleString('fr-FR').replace(/[  ]/g, ' ');
}

/** Initiales : deux premiers mots commençant par une majuscule, comme sur le web. */
export function initials(name: string): string {
  const words = name
    .replace(/[—&-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && w[0] === w[0].toUpperCase() && /[A-Za-zÀ-ÿ]/.test(w[0]));
  const first = (words[0] ?? name.trim())[0] ?? '?';
  const second = words[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

/** Couleurs d'avatar choisies de façon déterministe depuis l'identifiant. */
export function avatarColors(id: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return avatarPalette[h % avatarPalette.length];
}

/** Lien d'appel : espaces retirés pour le lien uniquement, la valeur affichée reste intacte. */
export function telUrl(phone: string): string {
  return `tel:${encodeURIComponent(phone.replace(/\s/g, ''))}`;
}

export function mailtoUrl(email: string): string {
  return `mailto:${encodeURIComponent(email.trim())}`;
}

export function countLabel(total: number, priority?: number): string {
  if (!total) return 'Aucune demande enregistrée';
  const base = `${total} demande${total > 1 ? 's' : ''}`;
  if (priority === undefined) return base;
  return `${base} · ${priority} prioritaire${priority > 1 ? 's' : ''}`;
}

export function pageLabel(page: number, pages: number, pageSize: number, total: number): string {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return `Page ${page} sur ${Math.max(1, pages)} · ${from}–${to} sur ${total}`;
}
