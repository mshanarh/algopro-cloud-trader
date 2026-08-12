# Build the EA Force native Android app

The app is wrapped with Capacitor. Follow these steps on your own computer
(Android Studio + Node.js installed).

1. Export this project to GitHub (top-right "Export to GitHub"), then:
   ```bash
   git clone <your-repo-url>
   cd <your-repo>
   npm install
   ```
2. Add the Android platform (only needed once):
   ```bash
   npx cap add android
   ```
3. Sync the config into the native project (run after every pull):
   ```bash
   npx cap sync android
   ```
4. Open in Android Studio and run on a device/emulator:
   ```bash
   npx cap run android
   ```
5. Build an installable APK from Android Studio:
   `Build > Build Bundle(s)/APK(s) > Build APK(s)`
   The APK lands in `android/app/build/outputs/apk/debug/app-debug.apk`.
   For the Play Store use `Build > Generate Signed Bundle / APK` and pick
   **Android App Bundle (.aab)** with your keystore.

## Pointing the app at production

`capacitor.config.ts` -> `server.url` currently loads the live EA Force web app.
After you publish, change it to your published domain, e.g.

```ts
url: 'https://your-domain.com/app'
```

then run `npx cap sync android` and rebuild.
