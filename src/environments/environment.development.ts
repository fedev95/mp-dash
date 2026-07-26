// Local fallback used only if the app is ever built/served outside Docker
// (e.g. `ng serve` on a machine with Node installed). Inside the container,
// docker-entrypoint.sh generates ./environment.ts from real env vars instead.
export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyDUMMY_KEY_0000000000000000000000',
    authDomain: 'demo-mp-dash.firebaseapp.com',
    projectId: 'demo-mp-dash',
    storageBucket: 'demo-mp-dash.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:0000000000000000000000',
  },
};
