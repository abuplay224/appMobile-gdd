---
name: doztra-demandes-mobile-data
description: Utiliser pour implémenter ou relire la couche données de l'app mobile Doztra Demandes en React Native (Expo) — stockage sécurisé des jetons, client HTTP et rafraîchissement, TanStack Query, pagination, idempotence des envois, gestion du hors-ligne et des erreurs.
---

# Doztra Demandes mobile — Couche données

Les règles de gestion sont celles de `doztra-demandes-business-rules` (RG1–RG20). Les
contrats HTTP sont ceux de `doztra-demandes-api-mobile`. Ce skill décrit comment l'app
les consomme sans jamais mentir à l'utilisateur sur ce qui est enregistré.

---

## 1. Pile et organisation

- **Expo** (managed) + **Expo Router** pour la navigation.
- **TypeScript** `strict: true`.
- **TanStack Query** pour le cache serveur, les états de chargement et les réessais.
- **expo-secure-store** pour les jetons (Keychain iOS / Keystore Android).
- **expo-crypto** pour `randomUUID()`.
- **Zod** : le **même** schéma de validation que le web, partagé en paquet commun ou
  recopié à l'identique — jamais réécrit de mémoire.

```
app/                      écrans Expo Router
  (auth)/connexion.tsx
  (app)/demandes/index.tsx
  (app)/demandes/nouvelle.tsx
  (app)/demandes/[id].tsx
src/
  api/
    client.ts             fetch avec jeton, rafraîchissement, erreurs typées
    requests.ts           listRequests, createRequest, setRequestPriority
    errors.ts             ApiError + codes
  auth/
    storage.ts            SecureStore
    session.tsx           contexte de session
  hooks/
    use-requests.ts       useQuery liste
    use-create-request.ts useMutation création
    use-set-priority.ts   useMutation priorité
  validation/
    request.schema.ts     schémas Zod partagés
  lib/format.ts           dates fr-FR / Africa/Conakry
```

---

## 2. Stockage des jetons

```ts
// src/auth/storage.ts
import * as SecureStore from 'expo-secure-store';

const ACCESS = 'doztra.access', REFRESH = 'doztra.refresh';

export const saveTokens = (a: string, r: string) =>
  Promise.all([
    SecureStore.setItemAsync(ACCESS, a, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
    SecureStore.setItemAsync(REFRESH, r, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
  ]);
```

Règles strictes :

- **Jamais** `AsyncStorage` ni `localStorage` pour un jeton : ce sont des fichiers en clair.
- `WHEN_UNLOCKED_THIS_DEVICE_ONLY` : pas de propagation par sauvegarde iCloud/Google.
- Aucun jeton dans un journal, un message d'erreur, une URL ou un outil de télémétrie.
- Aucune donnée de demande mise en cache sur disque : le cache TanStack Query reste **en
  mémoire**. Ne pas ajouter de persistance de cache sans décision explicite de Doztra —
  ce sont des données clients sur un appareil mobile potentiellement perdu.
- À la déconnexion : purge de SecureStore **et** `queryClient.clear()`.

---

## 3. Client HTTP

```ts
// src/api/client.ts
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();

  const run = (t: string | null) => fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Version': APP_VERSION,
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...init.headers,
    },
  });

  let res = await run(token);

  if (res.status === 401) {
    const renewed = await refreshOnce();      // une seule tentative, mutualisée
    if (!renewed) { await signOut(); throw new ApiError('UNAUTHORIZED', 'Session expirée.'); }
    res = await run(renewed);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) throw ApiError.from(res.status, body);
  return body.data as T;
}
```

Points de vigilance :

- **Un seul rafraîchissement à la fois** : mutualiser la promesse, sinon trois requêtes
  parallèles consomment trois jetons de rotation et déconnectent l'utilisateur.
- **Un seul réessai** après rafraîchissement : jamais de boucle.
- `403` → déconnexion immédiate, pas de rafraîchissement.
- Délai d'expiration explicite (`AbortController`, ~15 s) : sur réseau mobile instable,
  un `fetch` sans délai reste suspendu indéfiniment et l'écran tourne sans fin.
- `API_URL` vient de `app.config.ts` / `expo-constants`, jamais écrit en dur dans un
  composant, et **jamais** en HTTP clair.

---

## 4. Lecture de la liste

```ts
export function useRequests(page: number) {
  return useQuery({
    queryKey: ['requests', page],
    queryFn: () => listRequests(page),
    placeholderData: keepPreviousData,     // évite le clignotement en pagination
    staleTime: 30_000,
    retry: (n, e) => !(e instanceof ApiError) && n < 2,   // pas de réessai sur 4xx
  });
}
```

- Le tri et la pagination viennent du serveur (RG12, RG13). **Ne jamais retrier côté
  app** : un tri local sur la page courante donne un ordre faux.
- Le champ `page` de la réponse fait autorité : si le serveur a corrigé la page (RG14),
  l'app se recale dessus.
- « Tirer pour actualiser » → `refetch()`. C'est le geste attendu sur mobile et il remplit
  l'exigence RG17 (les modifications d'un autre utilisateur deviennent visibles à
  l'actualisation).
- Pagination : « Charger la suite » en bas de liste, ou précédent/suivant. Dans les deux
  cas, ce sont des pages serveur de 20.

---

## 5. Création idempotente

```ts
export function useCreateRequest() {
  const qc = useQueryClient();
  // généré à l'OUVERTURE de l'écran, conservé pour toutes les tentatives (RG7)
  const submissionId = useRef(Crypto.randomUUID()).current;

  return useMutation({
    mutationFn: (values: FormValues) => createRequest({ submissionId, ...values }),
    retry: false,                                   // le réessai est une action utilisateur
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });
}
```

- L'UUID est créé **une fois par formulaire** et réutilisé à chaque réessai : c'est ce qui
  garantit l'absence de doublon sur réseau instable (RG7, R05). Un nouveau formulaire →
  un nouvel UUID.
- Bouton désactivé pendant l'envoi, libellé « Enregistrement… » (RG8).
- Échec → la saisie reste **intégralement** à l'écran, un bandeau explique la cause, et
  **aucune confirmation n'est affichée** (RG10). C'est la règle la plus facile à casser
  en mobile : ne jamais naviguer avant la réponse du serveur.
- `409 CONFLICT` → message dédié invitant à recharger la liste, sans réessai automatique.
- Succès → navigation vers la liste, page 1, message « Demande enregistrée » (RG9).

### Hors-ligne

Le cahier des charges n'inclut pas le mode hors-ligne, et le mobile rend la tentation
forte. **Ne pas implémenter de file d'attente d'envois différés sans décision de Doztra.**

Comportement attendu sans connexion :

- Détection via `expo-network` / `@react-native-community/netinfo`, bandeau informatif.
- Le bouton d'enregistrement reste actif, l'échec est explicite : « Pas de connexion.
  Votre saisie est conservée, réessayez une fois connecté. »
- L'UUID de soumission rend ce réessai manuel sûr.
- **Jamais** de « Demande enregistrée » tant que le serveur n'a pas confirmé.

---

## 6. Changement de priorité

```ts
export function useSetPriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPriority }: { id: string; isPriority: boolean }) =>
      setRequestPriority(id, isPriority),          // RG18 : valeur explicite
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['requests'] });
      const previous = qc.getQueriesData({ queryKey: ['requests'] });
      // mise à jour optimiste du badge seulement
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));   // RG20
      toast.error('Impossible de modifier la priorité. L’état précédent est conservé.');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });
}
```

- La valeur envoyée est calculée **au moment du geste** à partir de l'état affiché, et
  transmise telle quelle. Jamais `!current` côté serveur (RG18).
- La mise à jour optimiste porte sur le badge, **pas sur la position dans la liste** :
  réordonner localement produit un saut visuel puis un second saut après invalidation.
- En cas d'échec, restauration **complète** de l'état précédent (RG20).
- Bouton désactivé pendant l'envoi.

---

## 7. Erreurs et messages

```ts
export class ApiError extends Error {
  constructor(readonly code: AppErrorCode, message: string,
              readonly fields?: Record<string, string>) { super(message); }
}
```

| Situation | Comportement de l'app |
|---|---|
| `VALIDATION_ERROR` | Erreurs replacées sur les champs via `fields`, focus au premier champ fautif |
| `UNAUTHORIZED` (401) | Un rafraîchissement, puis déconnexion si échec |
| `UNAUTHORIZED` (403) | Déconnexion immédiate |
| `NOT_FOUND` | « Demande introuvable. » + rafraîchissement de la liste |
| `CONFLICT` | Message dédié, invitation à recharger |
| `INTERNAL_ERROR` / réseau | Message exploitable + action « Réessayer » |

Les messages affichés sont ceux de `doztra-demandes-business-rules` §4 : mêmes textes que
le web, à la lettre. Aucun code technique, aucun statut HTTP montré à l'utilisateur.

---

## 8. Dates

Le serveur renvoie de l'ISO UTC ; l'app formate en français, fuseau **Africa/Conakry**,
jamais le fuseau de l'appareil — deux collaborateurs en déplacement verraient des heures
différentes pour la même demande.

```ts
const TZ = 'Africa/Conakry';
export const fDate = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
export const fTime = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
```

Vérifier sur Android ancien que l'ICU complet est disponible ; sinon ajouter un repli
explicite plutôt que de laisser une date fausse s'afficher.

---

## 9. Tests

- **Unitaires** : schémas Zod (R02, R03), formatage des dates, mapping statut → `ApiError`.
- **Intégration** (MSW ou serveur factice) : rafraîchissement 401 mutualisé, absence de
  boucle, réessai unique, restauration après échec de priorité (R13), conservation de la
  saisie après échec de création (R12), `409` sur contenu différent (R18).
- **Bout en bout** (Maestro ou Detox) : connexion → liste → création → priorité →
  actualisation (R05–R09, R17), et le parcours hors-ligne.
- Un test vérifie explicitement qu'**aucun message de succès** n'apparaît quand la
  requête échoue.

---

## 10. Avant de valider une modification

- [ ] Jetons uniquement dans SecureStore, jamais journalisés
- [ ] Aucune donnée de demande persistée sur disque
- [ ] Rafraîchissement mutualisé, un seul réessai, pas de boucle
- [ ] Délai d'expiration sur chaque requête
- [ ] `submissionId` stable pour toutes les tentatives d'un même formulaire
- [ ] Aucun tri ni pagination recalculés côté app
- [ ] Priorité envoyée en booléen explicite
- [ ] Échec : saisie conservée, état précédent restauré, aucun faux succès
- [ ] Dates formatées en `Africa/Conakry`
- [ ] Aucune fonctionnalité hors périmètre ajoutée (file d'attente, cache disque, temps réel)
