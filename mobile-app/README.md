# KitchenPOS Mobile App

Expo React Native client for the KitchenPOS API.

The mobile app is intentionally self-contained. It can be moved to another folder or repository as long as `EXPO_PUBLIC_API_BASE_URL` points to the deployed backend API.

## Local Development

```bash
npm install
npm run start
```

For Android emulator access to a local Django server, use:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
```

For a physical device, use your computer's LAN IP:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000/api
```

## APK Build

```bash
npm install -g eas-cli
eas login
npm run build:apk
```
