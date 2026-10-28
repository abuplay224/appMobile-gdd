# CLAUDE.md — Doztra Demandes · application mobile (React Native / Expo)

À placer à la racine du dépôt mobile. Si l'app vit dans le même dépôt que le web
(monorepo), fusionner la section 6 dans le `CLAUDE.md` existant plutôt que de dupliquer.

---

## 1. Contexte

Version mobile de **Doztra Demandes**, le registre interne des demandes clients de
l'équipe Doztra. Même produit, même périmètre, mêmes règles que le web :

1. Ajouter une demande (F01)
2. Afficher les demandes (F02)
3. Marquer / retirer la priorité (F03)

Interface **en français**, fuseau **Africa/Conakry**. Usage interne, pas de portail client.

**Hors périmètre — ne pas implémenter sans validation explicite :** modification après
création, suppression, statuts, assignation, commentaires, pièces jointes, notifications
poussées, mode hors-ligne avec file d'attente, cache persistant sur disque, recherche,
exports, temps réel.

Le mobile fait naître des tentations que le cahier des charges exclut (notifications,
hors-ligne, cache disque). Les signaler, ne pas les ajouter de sa propre initiative.

---

## 2. Élargissement de périmètre à acter

Le cahier des charges MVP écrit : « Pas de backend séparé **ni d'API REST publique** ».
Une app React Native ne peut pas appeler des Server Actions.

**Cette version impose donc une API HTTP authentifiée.** C'est une décision à faire
valider par Doztra avant la première ligne de code, en même temps que :

- le mécanisme d'authentification mobile (jetons) ;
- l'hébergement, désormais joignable depuis l'extérieur en HTTPS ;
- la politique de données sur appareil (verrouillage, masquage en multitâche).

Voir `doztra-demandes-api-mobile`.

---

## 3. Stack

- **Expo** (managed) + **Expo Router**
- **TypeScript** `strict: true`
- **TanStack Query** (cache serveur, en mémoire uniquement)
- **expo-secure-store** (jetons), **expo-crypto** (UUID), **expo-font** (Mulish)
- **Zod** — schémas **partagés** avec le web, jamais réécrits
- **Vitest / Jest + Testing Library**, **MSW**, **Maestro** (bout en bout)

---

## 4. Commandes

```bash
pnpm install
pnpm start                 # serveur Expo
pnpm ios / pnpm android    # build de développement
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Avant toute proposition de livraison : `pnpm lint && pnpm typecheck && pnpm test`.

---

## 5. Règles non négociables

### Sécurité
- Jetons **uniquement** dans `expo-secure-store`, option
  `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. Jamais `AsyncStorage`.
- Aucune donnée de demande persistée sur disque ; cache TanStack Query en mémoire.
- Aucun jeton, description, e-mail ou téléphone dans un journal, une URL ou un outil de
  télémétrie.
- HTTPS obligatoire, y compris pendant le développement sur appareil réel.
- Le contrôle d'accès réel est **côté serveur** ; la garde de navigation n'est qu'une
  commodité d'interface.
- Pas de `WebView`, aucun rendu HTML de contenu saisi.

### Fiabilité
- `submissionId` (UUID) généré à l'ouverture du formulaire et **réutilisé à chaque
  tentative** : c'est la protection contre les doublons sur réseau instable.
- Jamais de message de succès avant confirmation du serveur.
- Échec de création → la saisie reste intégralement à l'écran.
- Échec de priorité → restauration complète de l'état précédent.
- Priorité envoyée en **booléen strict**, jamais un toggle.
- Un seul rafraîchissement de jeton à la fois, un seul réessai, jamais de boucle.
- Délai d'expiration explicite sur chaque requête.

### Qualité
- Tri et pagination **jamais** recalculés côté app : le serveur fait foi.
- Dates formatées en `Africa/Conakry`, jamais dans le fuseau de l'appareil.
- Cibles tactiles ≥ 44 px, saisie à 16 px minimum.
- Textes identiques au web, à la lettre, apostrophe typographique `’`.
- Priorité signalée par texte **et** symbole, jamais par la couleur seule.

---

## 6. Skills du projet

| Skill | À charger quand |
|---|---|
| `doztra-demandes-business-rules` | Toute logique métier — **partagé avec le web**, source unique des RG1–RG20 |
| `doztra-demandes-api-mobile` | Route Handlers Next.js, authentification par jeton, contrats JSON, versionnage |
| `doztra-demandes-mobile-data` | Client HTTP, SecureStore, TanStack Query, idempotence, hors-ligne, erreurs |
| `doztra-demandes-mobile-ui` | Écrans, jetons de design, navigation, composants, clavier, accessibilité |

Les skills web (`doztra-demandes-nextjs`, `doztra-demandes-ui`,
`doztra-demandes-securite-recette`) restent la référence pour le serveur et la recette.

---

## 7. Conventions de code

- Français pour l'interface, les libellés, les messages et les commentaires métier ;
  anglais pour les identifiants de code.
- Un composant = un fichier, ~200 lignes maximum.
- Styles via `tokens.ts` ; aucune valeur de couleur ou de taille en dur.
- Types issus des schémas Zod partagés ; pas de type dupliqué à la main.
- Pas de `any`, pas de `@ts-ignore` sans commentaire justifiant la dérogation.
- Messages de commit en français, impératif : `feat: ajouter la feuille de détail`.

---

## 8. Décisions encore ouvertes

- Mécanisme d'authentification mobile et durée des jetons
- Hébergement de l'API et exposition externe
- Distribution de l'app (TestFlight / APK interne / magasins)
- Masquage du contenu en multitâche, verrouillage après inactivité
- Logo et couleur officielle de la charte Doztra (le prototype propose `#7B5CF5`)

---

## 9. Définition du « terminé »

1. `lint`, `typecheck` et `test` passent ;
2. les scénarios R01–R19 transposés au mobile sont vérifiés, dont R05 (double envoi),
   R12/R13 (échecs) et R15 (appel d'API sans jeton, jeton expiré, jeton forgé) ;
3. les états vide / chargement / erreur / hors-ligne sont traités ;
4. le parcours a été vérifié sur petit écran, sur écran à encoche et à la taille de texte
   système maximale ;
5. la documentation (README, guide utilisateur) reflète le changement.
