// src/theme/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a73e8', // Classic clean tech blue primary focus anchor
    },
    secondary: {
      main: '#e67e22', // Accent tone for indicators
    },
    background: {
      default: '#f4f6f8', // Soft neutral grey background canvas
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#7f8c8d',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", Arial, sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.5px'
    },
    button: {
      textTransform: 'none', // Prevents loud forced all-caps buttons
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          },
        },
      },
    },
  },
});