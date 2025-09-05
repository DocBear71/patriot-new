import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.patriotthanks.app',
    appName: 'Patriot Thanks',
    webDir: 'out',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 3000,
            backgroundColor: "#1E40AF",
            showSpinner: false
        }
    }
};

export default config;