import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.panekkatt.moneytracker',
  appName: 'Panekkatt Money Tracker',
  webDir: 'build',
  server: {
    url: 'https://panekkatt-money-tracker.web.app',
    cleartext: true
  }
};

export default config;
