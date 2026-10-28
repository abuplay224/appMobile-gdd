// Libellés partagés, identiques au web à la lettre (apostrophe typographique ’).

export const PRIORITY = {
  badgePriority: 'Prioritaire',
  badgeNormal: 'Normale',
  mark: 'Marquer comme prioritaire',
  unmark: 'Retirer la priorité',
  pending: 'Mise à jour…',
  markedToast: 'Demande marquée comme prioritaire',
  unmarkedToast: 'Priorité retirée',
  failedToast: 'Impossible de modifier la priorité. L’état précédent est conservé.',
} as const;

export const GLYPH = {
  priority: '★',
  normal: '○',
  mark: '★',
  unmark: '☆',
} as const;

export const NOT_FOUND_MESSAGE = 'Demande introuvable.';
export const CREATED_TOAST = 'Demande enregistrée';
