// Jetons de design issus du prototype web validé (docs/Doztra Demandes.dc.html).
// Aucune couleur ni taille en dur dans les composants : tout passe par ce fichier.

export const colors = {
  background: '#EDEFF3',
  surface: '#FFFFFF',
  surfaceSoft: '#F5F6F8',
  surfaceMuted: '#F6F7F9',
  text: '#0E1020',
  textSecondary: '#2A2D3D',
  textMuted: '#6B7083',
  textSubtle: '#4B5063',
  borderThin: '#EEF0F3',
  borderCard: '#ECEEF2',
  borderControl: '#E3E5EB',
  field: '#FAFBFC',

  primary: '#7B5CF5',
  primaryPressed: '#6A4BEA',
  primaryAccent: '#5A3BE0',
  primarySoft: '#EEE9FE',
  fresh: '#F3F0FE',

  dark: '#0B0D17',
  darkSurface: '#1C2033',
  darkSurfaceAlt: '#2A2F47',
  darkBorder: '#3A3F5A',
  onDark: '#FFFFFF',
  onDarkMuted: '#A5A9BC',
  onDarkSoft: '#D9DBE8',

  priorityBg: '#FDE8EF',
  priorityText: '#B0174A',
  normalBg: '#F0F1F4',
  normalText: '#4B5063',

  errorSurface: '#FFF5F7',
  errorBorder: '#F8D4DE',
  errorIconBg: '#FDE3EA',
  errorText: '#C2224F',
  errorTitle: '#8E1638',
  fieldInvalid: '#E5376B',

  starMark: '#E5376B',
  starUnmark: '#6B7083',
  starMarkOnDark: '#FF7AA2',
  starUnmarkOnDark: '#A5A9BC',

  skeletonBase: '#E9EBEF',
  skeletonHighlight: '#F4F5F7',
  skeletonPill: '#ECEEF2',

  toastOk: '#0E1020',
  toastError: '#B0174A',
  toastIconBg: 'rgba(255,255,255,0.18)',
  overlay: 'rgba(8,10,20,0.48)',
} as const;

/** Palette d'avatars (fond, texte), choisie de façon déterministe depuis l'identifiant. */
export const avatarPalette: readonly (readonly [string, string])[] = [
  ['#EEE9FE', '#5A3BE0'],
  ['#FDE8EF', '#B0174A'],
  ['#E3F6EC', '#16794A'],
  ['#FFF2DC', '#9A5B00'],
  ['#E4EEFD', '#2456B8'],
  ['#EAEBF0', '#3A3F55'],
];

export const fonts = {
  regular: 'Mulish_400Regular',
  medium: 'Mulish_500Medium',
  semibold: 'Mulish_600SemiBold',
  bold: 'Mulish_700Bold',
  extrabold: 'Mulish_800ExtraBold',
  mono: 'JetBrainsMono_400Regular',
} as const;

export const fontSize = {
  screenTitle: 28,
  panelTitle: 22,
  logo: 17,
  sectionTitle: 17,
  cardTitle: 15,
  body: 15,
  input: 16,
  label: 14,
  small: 13,
  caption: 12.5,
  overline: 12,
  micro: 11.5,
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  gutter: 16,
} as const;

export const radius = {
  control: 12,
  button: 13,
  card: 18,
  sheet: 24,
  header: 24,
  logo: 10,
  pill: 999,
} as const;

export const size = {
  touch: 44,
  button: 50,
  input: 48,
  fab: 56,
  avatar: 38,
  avatarLarge: 40,
  logo: 34,
  textareaMin: 150,
  maxContentWidth: 720,
} as const;

export const shadow = {
  card: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  floating: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
} as const;

export const motion = {
  toastMs: 3200,
  freshHighlightMs: 2600,
} as const;
