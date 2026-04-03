import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apnaghr.app',
  appName: 'ApnaGhr',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#04473C',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#C6A87C'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#04473C'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
