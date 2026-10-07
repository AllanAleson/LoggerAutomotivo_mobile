// Mesma identidade visual do dashboard web (frontend/src/styles.css).
export const colors = {
  navy: '#111a27',
  navy2: '#182536',
  navy3: '#20334a',
  blue: '#1473e6',
  blueSoft: '#e9f2fd',
  blueText: '#166fda',
  background: '#f3f5f7',
  surface: '#ffffff',
  surfaceMuted: '#f6f8fa',
  line: '#dfe4ea',
  lineSoft: '#edf0f3',
  text: '#18212f',
  textStrong: '#121b28',
  textBody: '#424d5d',
  muted: '#687386',
  subtle: '#8a94a3',
  green: '#15805c',
  greenSoft: '#eaf7f2',
  red: '#c43b45',
  redSoft: '#fbedee',
  amber: '#ae6800',
  amberSoft: '#fff4df',
  onDark: '#ffffff',
  onDarkMuted: '#aebdce',
} as const

export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_600SemiBold',
} as const

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const

export const radius = { sm: 6, md: 8, lg: 12, pill: 999 } as const

export const shadow = {
  shadowColor: '#141f30',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const

// Intervalo de atualização automática, igual ao polling do dashboard web.
export const REFRESH_MS = 15_000
