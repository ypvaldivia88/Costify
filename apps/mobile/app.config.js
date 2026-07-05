/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');
const { COSTIFY_API_BASE_URL } = require('../../packages/shared/src/config/api.js');

module.exports = () => ({
  ...appJson.expo,
  plugins: [...(appJson.expo.plugins ?? []), 'expo-dev-client'],
  extra: {
    ...appJson.expo.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL?.trim() || COSTIFY_API_BASE_URL,
    eltoqueApiToken: process.env.EXPO_PUBLIC_ELTOQUE_API_TOKEN,
  },
});
