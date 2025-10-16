import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#ce93d8' },
    background: {
      default: '#0b0f1a',
      paper: '#121826',
    },
    divider: 'rgba(255,255,255,0.08)',
    text: { primary: '#e6e9ef', secondary: 'rgba(230,233,239,0.7)' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 2px 18px rgba(0,0,0,0.5)', backgroundImage: 'none', backgroundColor: '#121826cc', backdropFilter: 'blur(8px)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 8px 30px rgba(0,0,0,0.45)', backgroundColor: '#0f1524', border: '1px solid rgba(255,255,255,0.06)' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { background: 'linear-gradient(90deg, #0f1524, #121826)' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#0f1524', backgroundImage: 'none', borderRight: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

export default theme;


