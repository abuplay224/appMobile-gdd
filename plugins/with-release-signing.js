// Config plugin : signature release Android.
// Le dossier android/ est régénéré par `expo prebuild` : on n'y modifie rien à la main.
//
// Les secrets ne sont jamais dans le dépôt. Ils sont lus depuis les propriétés Gradle,
// à placer dans %USERPROFILE%\.gradle\gradle.properties (ou ~/.gradle/gradle.properties) :
//   DOZTRA_UPLOAD_STORE_FILE=C:/chemin/vers/doztra-demandes-release.keystore
//   DOZTRA_UPLOAD_KEY_ALIAS=doztra-demandes
//   DOZTRA_UPLOAD_STORE_PASSWORD=...
//   DOZTRA_UPLOAD_KEY_PASSWORD=...
// Sans ces propriétés, le build release échoue au lieu d'être signé avec la clé de debug.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @doztra/release-signing';

const RELEASE_SIGNING = `
        ${MARKER}
        release {
            if (project.hasProperty('DOZTRA_UPLOAD_STORE_FILE')) {
                storeFile file(DOZTRA_UPLOAD_STORE_FILE)
                storePassword DOZTRA_UPLOAD_STORE_PASSWORD
                keyAlias DOZTRA_UPLOAD_KEY_ALIAS
                keyPassword DOZTRA_UPLOAD_KEY_PASSWORD
            }
        }`;

function applyReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;

  const buildTypesRelease = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/;
  if (!buildTypesRelease.test(gradle)) {
    throw new Error('with-release-signing : bloc buildTypes.release introuvable dans android/app/build.gradle.');
  }
  if (!/signingConfigs\s*\{/.test(gradle)) {
    throw new Error('with-release-signing : bloc signingConfigs introuvable dans android/app/build.gradle.');
  }

  return gradle
    .replace(buildTypesRelease, '$1signingConfig signingConfigs.release')
    .replace(/signingConfigs\s*\{/, (m) => `${m}${RELEASE_SIGNING}`);
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('with-release-signing : seul build.gradle (Groovy) est pris en charge.');
    }
    cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
};
