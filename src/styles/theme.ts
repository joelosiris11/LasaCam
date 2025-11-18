export const AURORA_THEME = {
  // Material Design inspired colors - La Aurora style
  colors: {
    // Primary colors
    beige: '#F5E6D3',
    beigeLight: '#F9F0E6',
    beigeDark: '#E8D5B7',
    blueDark: '#1E3A5F',
    blueDarkMedium: '#2C4A6B',
    blueDarkLight: '#3A5A7B',
    gold: '#D4AF37',
    goldLight: '#F4D03F',
    goldDark: '#B8941F',
    white: '#FFFFFF',
    black: '#000000',
  },
  
  // Material Design elevations
  elevations: {
    level0: 'none',
    level1: '0px 2px 1px -1px rgba(0,0,0,.2), 0px 1px 1px 0px rgba(0,0,0,.14), 0px 1px 3px 0px rgba(0,0,0,.12)',
    level2: '0px 3px 1px -2px rgba(0,0,0,.2), 0px 2px 2px 0px rgba(0,0,0,.14), 0px 1px 5px 0px rgba(0,0,0,.12)',
    level3: '0px 3px 3px -2px rgba(0,0,0,.2), 0px 3px 4px 0px rgba(0,0,0,.14), 0px 1px 8px 0px rgba(0,0,0,.12)',
    level4: '0px 2px 4px -1px rgba(0,0,0,.2), 0px 4px 5px 0px rgba(0,0,0,.14), 0px 1px 10px 0px rgba(0,0,0,.12)',
    level5: '0px 3px 5px -1px rgba(0,0,0,.2), 0px 5px 8px 0px rgba(0,0,0,.14), 0px 1px 14px 0px rgba(0,0,0,.12)',
    level6: '0px 3px 5px -1px rgba(0,0,0,.2), 0px 6px 10px 0px rgba(0,0,0,.14), 0px 1px 18px 0px rgba(0,0,0,.12)',
    level8: '0px 5px 5px -3px rgba(0,0,0,.2), 0px 8px 10px 1px rgba(0,0,0,.14), 0px 3px 14px 2px rgba(0,0,0,.12)',
    level12: '0px 7px 8px -4px rgba(0,0,0,.2), 0px 12px 17px 2px rgba(0,0,0,.14), 0px 5px 22px 4px rgba(0,0,0,.12)',
    level16: '0px 8px 10px -5px rgba(0,0,0,.2), 0px 16px 24px 2px rgba(0,0,0,.14), 0px 6px 30px 5px rgba(0,0,0,.12)',
    level24: '0px 11px 15px -7px rgba(0,0,0,.2), 0px 24px 38px 3px rgba(0,0,0,.14), 0px 9px 46px 8px rgba(0,0,0,.12)',
  },
  
  // Border radius
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    xlarge: '16px',
    round: '50%',
    pill: '50px',
  },
  
  // Typography
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: 'clamp(32px, 8vw, 48px)',
      fontWeight: 500,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontSize: 'clamp(24px, 6vw, 32px)',
      fontWeight: 500,
      letterSpacing: '-0.25px',
    },
    h3: {
      fontSize: 'clamp(20px, 5vw, 24px)',
      fontWeight: 500,
    },
    body: {
      fontSize: 'clamp(14px, 3.5vw, 16px)',
      fontWeight: 400,
    },
    button: {
      fontSize: 'clamp(14px, 3.5vw, 16px)',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
};

export default AURORA_THEME;
