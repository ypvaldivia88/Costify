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

1. Instala EAS CLI: `npm install -g eas-cli`
2. Inicia sesión: `eas login`
3. Configura el proyecto: `eas build:configure`
4. Build de prueba (APK): `eas build -p android --profile preview`
5. Build para Play Store (AAB): `eas build -p android --profile production`
6. Publicar: `eas submit -p android --profile production`

## Funcionalidades

- Calculadora de costos (productos simples y elaborados)
- Materias primas y recetas
- Historial con resumen del negocio
- Gastos indirectos, fondo global e impuestos (Cuba)
- Respaldo/importación compatible con formato `costify1:`

## Datos

Todos los datos se guardan localmente en el dispositivo con AsyncStorage. No se requiere conexión a internet.

## Publicación en Play Store

Necesitarás:

- Cuenta de desarrollador de Google Play
- Icono y capturas de pantalla
- Política de privacidad (datos locales)
- AAB firmado generado con EAS Build
