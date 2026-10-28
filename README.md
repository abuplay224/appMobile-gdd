# Doztra Demandes — application mobile

Version mobile (React Native / Expo) du registre interne des demandes clients de Doztra.
Même périmètre que le web : **consulter**, **ajouter** et **prioriser** les demandes.
Interface en français, heures affichées dans le fuseau **Africa/Conakry**.

L’app consomme l’API HTTP décrite dans [docs/api-mobile.md](docs/api-mobile.md). La gestion
des comptes reste sur le site web.

## Prérequis

- Node.js 20+ et npm
- Un appareil ou émulateur avec un **build de développement** (`expo-secure-store` et les
  autres modules natifs ne sont pas tous inclus dans Expo Go)
- L’API joignable en **HTTPS** — en local sur appareil réel, via un tunnel (`ngrok http 3000`)

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner EXPO_PUBLIC_API_URL=https://<domaine>/api/v1
```

Une URL en `http://` est refusée par le client : chaque requête échoue avec un message de
configuration.

## Commandes

```bash
npm start            # serveur Expo
npm run ios          # / npm run android
npm run lint
npm run typecheck
npm test             # Jest + Testing Library
npm run test:e2e     # Maestro (nécessite une API de test et un compte, voir .maestro/)
```

Avant toute livraison : `npm run lint && npm run typecheck && npm test`.

## APK release signé (build local, Windows)

Prérequis : JDK 21, SDK Android (`%LOCALAPPDATA%\Android\Sdk`), `.env.local` avec l’URL de
production — elle est intégrée dans l’APK au moment du build.

**1. Clé de signature (une seule fois).** Elle reste hors du dépôt :

```powershell
keytool -genkeypair -storetype PKCS12 -keystore "$env:USERPROFILE\.android-keystores\doztra-demandes-release.keystore" `
  -alias doztra-demandes -keyalg RSA -keysize 2048 -validity 10000 `
  -dname "CN=Doztra Demandes, O=Doztra, L=Conakry, C=GN"
```

puis, dans `%USERPROFILE%\.gradle\gradle.properties` (jamais dans le dépôt) :

```properties
DOZTRA_UPLOAD_STORE_FILE=C:/Users/<vous>/.android-keystores/doztra-demandes-release.keystore
DOZTRA_UPLOAD_KEY_ALIAS=doztra-demandes
DOZTRA_UPLOAD_STORE_PASSWORD=...
DOZTRA_UPLOAD_KEY_PASSWORD=...
```

⚠️ **Sauvegardez la clé et ses mots de passe** (coffre de mots de passe + copie hors de
l’ordinateur). Sans elle, impossible de publier une mise à jour installable par-dessus
l’app existante : il faudrait désinstaller l’app sur chaque téléphone.

**2. Build.** Le dossier `android/` est généré (non versionné) ; la signature y est injectée
par [plugins/with-release-signing.js](plugins/with-release-signing.js) :

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21.0.12.1'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npx expo prebuild --platform android --clean
cd android; .\gradlew.bat assembleRelease
```

Résultat : `android/app/build/outputs/apk/release/app-release.apk` — APK universel
(armeabi-v7a, arm64-v8a, x86, x86_64). Sans les propriétés de signature, le build échoue
plutôt que de signer avec la clé de debug.

**3. Nouvelle version.** Augmentez `version` dans `app.json` **et** `android.versionCode`
(entier strictement croissant), sinon Android refuse la mise à jour.

**Installation** : copier l’APK sur le téléphone et autoriser « Installer des applications
inconnues » pour le gestionnaire de fichiers, ou `adb install -r app-release.apk`.

## Organisation

```
src/
  app/                       écrans (Expo Router)
    _layout.tsx              polices, fournisseurs, garde de session (Stack.Protected)
    connexion.tsx
    demandes/index.tsx       liste paginée, tirer pour actualiser
    demandes/nouvelle.tsx    création (modale plein écran)
    demandes/[id].tsx        détail (feuille)
  api/                       client HTTP, erreurs typées, auth, demandes
  auth/                      SecureStore, contexte de session
  hooks/                     TanStack Query : liste, détail, priorité
  features/                  formulaire de création, détail, mise à jour requise
  components/                composants d’interface (un par fichier)
  validation/                schémas Zod (formulaire et réponses)
  lib/                       formatage, libellés, toasts, QueryClient
  theme/tokens.ts            jetons de design du prototype web
```

## Règles garanties par le code

- Jetons uniquement dans `expo-secure-store` (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) ; jamais
  journalisés. Sauvegarde Android désactivée (`allowBackup: false`).
- Cache TanStack Query **en mémoire** uniquement, vidé à la déconnexion.
- 401 → un seul rafraîchissement partagé entre requêtes simultanées, un seul rejeu ;
  403 → déconnexion ; 426 → écran « Mise à jour requise ».
- Délai d’expiration de 15 s sur chaque requête.
- `submissionId` généré à l’ouverture du formulaire et réutilisé pour chaque tentative ;
  « Demande enregistrée » n’apparaît qu’après un 201/200 ; la saisie est conservée en cas
  d’échec.
- Priorité envoyée comme valeur explicite (`true`/`false`) ; pas de mise à jour optimiste,
  donc un échec laisse l’état précédent intact.
- Tri et pagination fournis par le serveur, jamais recalculés.

## Points à valider avec Doztra

- **Schémas partagés** : `src/validation/request.schema.ts` reprend à la lettre les règles
  et messages du cahier des charges ; à remplacer par le paquet commun au web dès qu’il
  existe.
- `docs/api/openapi.yaml`, cité par `docs/api-mobile.md`, n’est pas présent dans ce dépôt.
- Masquage du contenu en multitâche et verrouillage après inactivité : non implémentés,
  décision ouverte.
- Distribution (TestFlight / APK interne / magasins), identifiants `com.doztra.demandes`
  provisoires.
- Logo et couleur officielle (le prototype propose `#7B5CF5`) ; icônes actuelles = gabarit
  Expo, à remplacer.
- Hors périmètre volontairement absent : hors-ligne avec file d’attente, cache disque,
  notifications, temps réel, modification, suppression.
