import { createTheme } from '@mui/material/styles';

// Identité « librairie » : bleu marine du logo LIPACE (logo/LISEZMOI.md), crème, ocre ; titres Georgia,
// texte en police système (0 Ko à télécharger, Roboto sur Android). Contrastes vérifiés WCAG AA :
// marine 11,6:1 sur crème, ocre clair 6,3:1 sur marine, texte secondaire 6:1 sur crème.
const NAVY = '#16325c';
const CREAM = '#f7f4ec';
// Ocre lisible en texte (5,3:1 sur crème) ; l'ocre clair #e5ab55 reste réservé aux décors sur fond marine
const OCHRE = '#8a5a2b';
const SERIF = 'Georgia, "Times New Roman", serif';

// Focus clavier (WCAG 2.4.7 et 1.4.11) : anneau marine sur fond clair (11,6:1 sur crème), ocre clair sur
// les bandeaux marine (6,3:1) ; un bandeau sombre bascule l'anneau avec `'--focus-ring': FOCUS_ON_DARK`.
// L'ocre clair seul ne fait que 2:1 sur crème, d'où les deux couleurs.
export const FOCUS_ON_DARK = '#e5ab55';
const focusRing = { outline: `3px solid var(--focus-ring, ${NAVY})`, outlineOffset: 2 };
// Dans un menu ou une liste, l'anneau est dessiné à l'intérieur pour ne pas être coupé par le conteneur
const focusRingInset = { ...focusRing, outlineOffset: -3 };

export const theme = createTheme({
  palette: {
    primary: { main: NAVY, light: '#2b4c7e', dark: '#0e2240', contrastText: '#ffffff' },
    secondary: { main: OCHRE, light: '#e5ab55', contrastText: '#ffffff' },
    background: { default: CREAM, paper: '#ffffff' },
    text: { primary: '#1b2433', secondary: '#545e6e' },
    divider: 'rgba(22, 50, 92, 0.12)',
    info: { main: '#2c5f6f' },
    success: { main: '#0b7a43' },
    warning: { main: OCHRE },
    error: { main: '#b3261e' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    // Titres fluides : lisibles sur un écran de 360 px sans écraser l'ordinateur
    h1: { fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(2rem, 1.4rem + 3vw, 3.25rem)', lineHeight: 1.12 },
    h2: { fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.75rem, 1.3rem + 2.2vw, 2.75rem)', lineHeight: 1.15 },
    h3: { fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)', lineHeight: 1.2 },
    h4: { fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.6rem, 1.3rem + 1.2vw, 2.125rem)', lineHeight: 1.2 },
    h5: { fontFamily: SERIF, fontWeight: 400, fontSize: '1.375rem', lineHeight: 1.3 },
    h6: { fontWeight: 700, fontSize: '1.0625rem', lineHeight: 1.4 },
    subtitle1: { fontWeight: 600, lineHeight: 1.35 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.9375rem', lineHeight: 1.55 },
    overline: { fontWeight: 700, letterSpacing: '0.12em', lineHeight: 2 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.975rem' },
  },
  components: {
    // ButtonBase (boutons, icônes, puces, éléments de menu) remet `outline: 0` : sans cette règle, aucun
    // anneau n'apparaît sur ces contrôles au clavier
    MuiButtonBase: { styleOverrides: { root: { '&.Mui-focusVisible': focusRing } } },
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: 'antialiased' },
        // Focus clavier bien visible partout (le halo MUI seul est trop discret)
        ':focus-visible': focusRing,
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, paddingInline: 18 },
        sizeSmall: { minHeight: 40, paddingInline: 14 },
        sizeLarge: { minHeight: 52, paddingInline: 24, fontSize: '1.0625rem' },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiChip: {
      styleOverrides: { root: { height: 40, borderRadius: 999, fontWeight: 600, fontSize: '0.9375rem', '&.Mui-focusVisible': focusRing } },
    },
    MuiMenuItem: { styleOverrides: { root: { '&.Mui-focusVisible': focusRingInset } } },
    MuiListItemButton: { styleOverrides: { root: { '&.Mui-focusVisible': focusRingInset } } },
    // Cartes et panneaux : bordure fine + ombre douce plutôt que l'ombre « Material » marquée
    MuiPaper: {
      styleOverrides: {
        elevation1: { boxShadow: '0 1px 2px rgba(22,50,92,0.05), 0 6px 20px rgba(22,50,92,0.06)' },
        outlined: { borderColor: 'rgba(22, 50, 92, 0.12)' },
      },
    },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10, alignItems: 'center' } } },
    MuiTextField: { defaultProps: { variant: 'outlined' } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: '#ffffff' } } },
    // Lien en <button> (« Conditions… ») : MUI met `outline: auto`, remplacé par le même anneau
    MuiLink: { defaultProps: { underline: 'hover' }, styleOverrides: { root: { '&.Mui-focusVisible, &:focus-visible': focusRing } } },
    MuiAppBar: { styleOverrides: { root: { borderBottom: '1px solid rgba(255,255,255,0.08)', '--focus-ring': FOCUS_ON_DARK } } },
  },
});
