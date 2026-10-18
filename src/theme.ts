import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const theme = createTheme({
  palette: {
    primary: { main: '#153e35' },
    secondary: { main: '#9b6631' },
    background: { default: '#f7f4ec', paper: '#ffffff' },
    text: { primary: '#1a2e28', secondary: '#67736b' },
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
    h1: { fontFamily: 'Georgia, serif' },
    h2: { fontFamily: 'Georgia, serif' },
    h3: { fontFamily: 'Georgia, serif' },
    h4: { fontFamily: 'Georgia, serif' },
    h5: { fontFamily: 'Georgia, serif' },
    h6: { fontFamily: 'Georgia, serif' },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 'bold', minHeight: 44 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 9, border: '1px solid #e0e3d7' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 25 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 5 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: { borderRadius: 5 },
      },
    },
  },
});
