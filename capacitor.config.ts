import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.eaforce',
  appName: 'EA Vault',
  webDir: 'dist',
  server: {
    // The native Android shell loads the live EA Vault app.
    url: 'https://id-preview--8168f075-1790-4114-84f0-ba95fede9595.lovable.app/app',
    cleartext: true,
  },
  android: {
    backgroundColor: '#05070c',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#05070c',
      showSpinner: false,
      launchAutoHide: true,
    },
  },
};

export default config;
