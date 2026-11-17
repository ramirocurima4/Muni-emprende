import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sanroque.muniemprende',
  appName: 'MuniEmprende',
  server: {
    url: 'https://muniemprende.sanroque.gob.ar',
    cleartext: true
  }
};

export default config;
