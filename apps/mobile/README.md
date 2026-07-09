# Costify Mobile

App nativa de Android (React Native + Expo) para calcular costos, precios de venta e inventario de MIPYME en Cuba.

## Requisitos

- Node.js 20+
- npm
- Cuenta de [Expo](https://expo.dev) para builds en la nube (recomendado para Play Store)

## Desarrollo local

```bash
npm install
npm start
```

Escanea el QR con **Expo Go** en Android o ejecuta:

```bash
npm run android
```

## Generar APK / AAB para Play Store

**Versión actual:** 1.0.16 — ver [GitHub Releases](https://github.com/ypvaldivia88/Costify/releases/latest).

1. Instala EAS CLI: `npm install -g eas-cli`
2. Inicia sesión: `eas login`
3. Build de prueba (APK): `pnpm build:preview` (desde `apps/mobile`)
4. Build para Play Store (AAB): `pnpm build:production`
5. Publicar: `eas submit -p android --profile production`

La API de producción está configurada en `eas.json` (`EXPO_PUBLIC_API_URL=https://costify-iota.vercel.app` en perfil preview).

## Funcionalidades

- Calculadora de costos (productos simples y elaborados)
- Materias primas y recetas
- Historial con resumen del negocio
- Gastos indirectos, fondo global e impuestos (Cuba)
- Respaldo/importación compatible con formato `costify1:`

## Datos

Los datos se guardan localmente (AsyncStorage) y se sincronizan con la nube cuando hay conexión (`https://costify-iota.vercel.app`).

## Publicación en Play Store

Necesitarás:

- Cuenta de desarrollador de Google Play
- Icono y capturas de pantalla
- Política de privacidad (datos locales)
- AAB firmado generado con EAS Build
