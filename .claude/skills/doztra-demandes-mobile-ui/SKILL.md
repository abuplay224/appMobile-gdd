---
name: doztra-demandes-mobile-ui
description: Utiliser pour implémenter ou relire l'interface de l'app mobile Doztra Demandes en React Native (Expo) — jetons de design du prototype, Mulish, navigation Expo Router, inventaire des écrans et de leurs états, composants, zones sûres, clavier, accessibilité.
---

# Doztra Demandes mobile — Interface

Jetons issus du prototype web validé, transposés aux contraintes natives. Le
comportement vient de `doztra-demandes-business-rules`, les données de
`doztra-demandes-mobile-data`.

Principe : **même produit, pas même mise en page.** On ne porte pas le tableau de bureau
sur un téléphone ; on reprend l'identité (sombre en en-tête, surfaces claires, violet
`#7B5CF5`, badges de priorité) et on adopte les conventions natives (pile de navigation,
feuille modale, tirer pour actualiser).

---

## 1. Jetons de design

### Couleurs

| Rôle | Valeur |
|---|---|
| Fond d'écran | `#EDEFF3` |
| Surface | `#FFFFFF` |
| Surface douce | `#F5F6F8` · `#F6F7F9` |
| Texte principal | `#0E1020` |
| Texte secondaire | `#2A2D3D` |
| Texte atténué | `#6B7083` · `#4B5063` |
| Bordure fine | `#EEF0F3` · `#ECEEF2` |
| Bordure de contrôle | `#E3E5EB` |
| Fond de champ | `#FAFBFC` |
| **Primaire** | `#7B5CF5` (pressé `#6A4BEA`, accent `#5A3BE0`) |
| En-tête sombre | `#0B0D17` (surfaces `#1C2033`, `#2A2F47`, bordure `#3A3F5A`) |
| Texte sur sombre | `#FFFFFF`, atténué `#A5A9BC`, doux `#D9DBE8` |
| Badge prioritaire | fond `#FDE8EF`, texte `#B0174A` |
| Badge normale | fond `#F0F1F4`, texte `#4B5063` |
| Erreur | surface `#FFF5F7`, bordure `#F8D4DE`, texte `#C2224F`, titre `#8E1638` |
| Étoile « marquer » / « retirer » | `#E5376B` / `#6B7083` |
| Ligne nouvellement créée | `#F3F0FE` (~2,6 s) |

Palette d'avatars (fond / texte), choisie de façon déterministe depuis l'identifiant :
`#EEE9FE`/`#5A3BE0` · `#FDE8EF`/`#B0174A` · `#E3F6EC`/`#16794A` ·
`#FFF2DC`/`#9A5B00` · `#E4EEFD`/`#2456B8` · `#EAEBF0`/`#3A3F55`.

Centraliser dans `src/theme/tokens.ts`. **Aucune couleur en dur dans un composant.**

Le mode sombre système n'est pas au périmètre : forcer `userInterfaceStyle: 'light'` dans
`app.json` plutôt que de laisser l'OS inverser des couleurs non prévues.

### Typographie

**Mulish** chargée par `expo-font` (400, 500, 600, 700, 800) ; **JetBrains Mono** pour le
seul identifiant UUID. Ne pas rendre l'écran avant la fin du chargement des polices
(`SplashScreen.preventAutoHideAsync`), sinon le texte saute.

| Usage | Taille / graisse |
|---|---|
| Titre d'écran | 28 / 800 |
| Titre de section | 17 / 800 |
| Titre de panneau | 22 / 800 |
| Nom de client (liste) | 15 / 800 |
| Corps | 15 / 400–600 |
| Libellé de champ | 14 / 700 |
| Légende | 12,5 / 600 |
| Micro-légende | 11,5 / 600 |
| Libellé de section en capitales | 12 / 800, `letterSpacing: 1` |

Saisie à **16 px minimum**. Respecter l'agrandissement système jusqu'à ~130 % sans
tronquer : tester avec la taille de texte maximale des réglages Android et iOS.

### Formes et espacement

- Échelle d'espacement : 4 · 8 · 12 · 14 · 16 · 20 · 24.
- Rayons : contrôles 12 · cartes 18 · feuille 24 (coins hauts) · badges 999.
- Marge latérale d'écran : 16.
- **Cibles tactiles : 44 × 44 minimum**, sans exception. Les boutons de tableau à 38 px du
  prototype web sont remontés à 44 sur mobile.
- Ombres : discrètes (`elevation: 2` Android, `shadowOpacity: 0.08` iOS). Pas d'ombre
  portée violette sur mobile, coûteuse et peu lisible.

---

## 2. Navigation

Expo Router, deux groupes :

```
app/
  (auth)/connexion.tsx                  pile sans en-tête
  (app)/_layout.tsx                     garde de session
  (app)/demandes/index.tsx              liste
  (app)/demandes/nouvelle.tsx           création (présentation modale)
  (app)/demandes/[id].tsx               détail (feuille)
```

- `(app)/_layout.tsx` redirige vers `/connexion` sans session valide. La garde est une
  commodité d'interface : la sécurité réelle est côté serveur.
- Création en **présentation modale** : c'est une tâche qu'on termine ou qu'on annule.
- Détail en **feuille** (`sheet` / `@gorhom/bottom-sheet`), équivalent natif du panneau
  latéral du web. Pas de route de détail distante : la feuille utilise les données déjà
  chargées, comme sur le web.
- Bouton matériel « retour » Android : ferme la feuille, puis quitte le formulaire avec
  confirmation si la saisie n'est pas vide.

---

## 3. Écrans

### 3.1 Liste — `/demandes`

En-tête sombre `#0B0D17` sous la zone sûre haute : logo carré `D` violet, « Doztra »,
avatar à droite. Dessous : « Demandes clients » et le compteur
`{n} demandes · {p} prioritaires`.

Corps : `FlatList` de **cartes** (le tableau du web n'existe pas en mobile).

Carte, de haut en bas :

1. Avatar à initiales + nom (une ligne, ellipse) + date · heure ;
2. badge de priorité aligné à droite ;
3. encadré « Objet » sur `#F5F6F8`, 2 lignes maximum ;
4. deux actions : priorité (contour, extensible) et « Voir » (fond `#0E1020`).

Le corps de carte est tappable pour ouvrir le détail ; les deux boutons restent des
cibles distinctes.

Bouton d'ajout : **bouton flottant** `#7B5CF5` en bas à droite, 56 px, au-dessus de la
zone sûre basse, avec `accessibilityLabel="Ajouter une demande"`.

Performance : `keyExtractor` sur `id`, `getItemLayout` si la hauteur est fixe,
`initialNumToRender` ~8. Pas de `ScrollView` pour une liste paginée.

### 3.2 Création — `/demandes/nouvelle`

En-tête modal : « Annuler » à gauche, « Nouvelle demande » au centre, « Enregistrer » à
droite — et le même bouton « Enregistrer » pleine largeur en bas de formulaire.

Deux sections, titres en capitales : **Client** (nom obligatoire, e-mail et téléphone
facultatifs, empilés) et **Demande** (objet, description).

- `KeyboardAvoidingView` (`padding` iOS, `height` Android) + `ScrollView` avec
  `keyboardShouldPersistTaps="handled"`.
- Clavier adapté : `keyboardType="email-address"` et `autoCapitalize="none"` pour
  l'e-mail, `keyboardType="phone-pad"` pour le téléphone, `autoCapitalize="words"` pour
  le nom.
- Placeholder du téléphone : `+224 6XX XX XX XX`. **Ne pas masquer ni formater la
  saisie** : RG3 impose de conserver la valeur telle quelle.
- Description : `multiline`, hauteur minimale ~150, compteur vivant `{n} / 5 000` passant
  en `#C2224F` hors bornes, annoncé par `accessibilityLiveRegion="polite"`.
- Erreur de champ sous le champ, bordure `#E5376B`, `accessibilityState={{ invalid }}`.
- Échec serveur : bandeau d'erreur en haut, défilement automatique vers lui.
- Pendant l'envoi : bouton désactivé, « Enregistrement… », saisie non effacée.

### 3.3 Détail — feuille

Contenu identique au panneau web : badge de priorité, objet, description complète
(sélectionnable, sans troncature), bloc client (avatar, nom, e-mail, téléphone),
dates de création et de modification, identifiant en monospace, mention « Heures affichées
dans le fuseau Africa/Conakry. Lecture seule. », action de priorité pleine largeur en pied.

Spécificités mobiles utiles : e-mail et téléphone ouvrent `Linking.openURL('mailto:…')` /
`tel:…`, et un appui long copie la valeur. Le lien `tel:` retire les espaces **pour le
lien seulement** ; la valeur affichée reste intacte.

---

## 4. États

| État | Rendu |
|---|---|
| Chargement initial | 5 cartes squelettes (`#E9EBEF` → `#F4F5F7`), `accessibilityLabel="Chargement des demandes"` |
| Vide | Pastille `+`, « Aucune demande pour le moment » / « Les demandes saisies par l'équipe apparaîtront ici. » + bouton « Ajouter une demande » |
| Erreur | Encadré `#FFF5F7`, « Impossible de charger les demandes » / « Vérifiez votre connexion puis réessayez. » + bouton « Réessayer » |
| Données | Liste + pagination |
| Hors ligne | Bandeau persistant sous l'en-tête : « Pas de connexion » |
| Actualisation | `RefreshControl`, teinte `#7B5CF5` |

Les quatre premiers états sont **mutuellement exclusifs**.

**Retours** : `Toast` discret en bas (succès `#0E1020` avec `✓`, échec `#B0174A` avec `!`),
au-dessus de la zone sûre, ~3,2 s. Ajouter un retour haptique léger
(`expo-haptics`, `Success` / `Error`) : sur mobile, c'est le signal le plus lisible.

**Action de priorité** : libellés « Marquer comme prioritaire » / « Retirer la priorité » /
« Mise à jour… » ; glyphe `★` / `☆` ; bouton désactivé et opacité 0,55 pendant l'envoi.
Jamais la couleur seule pour signaler la priorité.

---

## 5. Zones sûres et plateformes

- `SafeAreaProvider` + `useSafeAreaInsets`. L'en-tête sombre s'étend **sous** l'encoche
  (couleur jusqu'en haut, contenu décalé).
- `StatusBar` en style clair sur l'en-tête sombre.
- Barre de navigation gestuelle Android : padding bas sur le bouton flottant et les
  actions en pied.
- Tester au minimum : petit téléphone (~360 × 640), téléphone à encoche, tablette (la
  carte est plafonnée en largeur et centrée, pas étirée).
- Mode paysage : accepté, non optimisé — vérifier qu'aucun contenu n'est inaccessible.

---

## 6. Accessibilité

- `accessibilityRole` sur chaque élément interactif (`button`, `link`, `header`).
- `accessibilityLabel` explicite sur les boutons à icône seule (bouton flottant,
  fermeture de feuille).
- `accessibilityState={{ disabled, busy }}` pendant les envois.
- Priorité annoncée par le **texte** du badge, pas par la couleur.
- Erreurs de champ annoncées : lier `accessibilityLabel` du champ au message, focus
  programmé sur le premier champ fautif à la soumission.
- Ouverture de la feuille : focus lecteur d'écran sur son titre ; fermeture : retour au
  déclencheur.
- Contrastes AA (4,5:1) vérifiés, y compris le texte atténué `#6B7083` sur `#F5F6F8`.
- `reduceMotion` respecté pour les animations de feuille et de toast.

---

## 7. Sécurité côté interface

- Aucune donnée de demande dans un journal, un presse-papiers automatique ou une capture
  d'analytique.
- Pas de `WebView` : rien d'extérieur n'interprète le contenu saisi.
- Les liens `mailto:` et `tel:` sont encodés, jamais concaténés bruts.
- Envisager le masquage du contenu en multitâche (`expo-screen-capture` /
  `FLAG_SECURE`) : l'aperçu d'application affiche sinon des données clients.
- Verrouillage à l'arrière-plan prolongé : à décider avec Doztra, pas à improviser.

---

## 8. Avant de valider une modification

- [ ] Aucune couleur ni taille en dur hors `tokens.ts`
- [ ] Cibles tactiles ≥ 44 px
- [ ] Saisie à 16 px, clavier adapté par champ, téléphone non formaté
- [ ] `KeyboardAvoidingView` : aucun champ masqué par le clavier
- [ ] Zones sûres respectées en haut et en bas
- [ ] Les quatre états de liste existent et sont exclusifs
- [ ] Priorité lisible sans la couleur
- [ ] Rôles et libellés d'accessibilité présents, focus géré
- [ ] Textes en français avec apostrophe typographique `’`, identiques au web
- [ ] Vérifié sur petit écran, avec encoche, et à la taille de texte système maximale
