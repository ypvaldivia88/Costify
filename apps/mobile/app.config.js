/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

const DEFAULT_API_URL = 'https://costify-iota.vercel.app';

module.exports = () => ({
  ...appJson.expo,
  plugins: [...(appJson.expo.plugins ?? []), 'expo-dev-client'],
  extra: {
    ...appJson.expo.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL,
    eltoqueApiToken: process.env.EXPO_PUBLIC_ELTOQUE_API_TOKEN,
  },
});
