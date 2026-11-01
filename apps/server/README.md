# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)

This project was bootstrapped with Fastify-CLI.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).

## Stockage Vélo’v et suivi

Utiliser Node.js 24 (`.nvmrc`). SQLite utilise le module natif `node:sqlite`, sans dépendance
supplémentaire. `VELOV_DATABASE_PATH` configure le fichier, par défaut
`./data/transpolyon.sqlite` relativement au répertoire de démarrage du serveur.
Le dossier parent est créé automatiquement. `:memory:` est réservé aux tests.
Les identifiants Grand Lyon restent dans `GRANDLYON_USERNAME` et `GRANDLYON_PASSWORD`.

Au démarrage, l’application initialise WAL, les clés étrangères et une attente maximale de
5 secondes en cas de contention. Elle applique les migrations versionnées de
`src/storage/migrations.ts` dans une transaction, avant de charger les routes, et ferme la
connexion à l’arrêt. Une migration publiée reste immuable ; ajouter les suivantes en fin
de liste. Un schéma plus récent que l’application est refusé. Le futur worker ne migre pas.
Le fichier et ses fichiers WAL doivent résider sur un disque local ; les sauvegardes cohérentes
et le volume partagé avec le worker seront documentés avec le déploiement.

Une installation neuve possède une liste suivie vide. Le catalogue complet du fournisseur
reste accessible par `GET /velov`, avec les mêmes champs et le même tableau qu’avant.
La consultation de la carte et les sélections de trajet ne modifient jamais le suivi.

| Requête                       | Contrat                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `GET /velov/tracked-stations` | `{ "stations": [{ "stationId": 1001, "trackedSince": "2026-11-01T10:00:00.000Z" }] }`, trié par numéro ; aucun appel fournisseur. |
| `PUT /velov/tracked-stations` | Corps `{ "stationIds": [1001, 1002] }` : remplace toute la liste et retourne le même format que GET.                              |

Chaque identifiant est un entier positif sûr, correspondant au `number` Grand Lyon exposé
dans `id` par `GET /velov`, jamais au `gid`. Doublons et corps invalides retournent 400.
Les numéros absents du catalogue actuel retournent 400 avec `unknownStationIds`.
Si le fournisseur ne permet pas de valider une liste non vide, la réponse est 503 et la liste
précédente est conservée. `{ "stationIds": [] }` vide le suivi même sans fournisseur.
Une mise à jour est atomique et conserve la date d’ajout des stations déjà suivies.
Retirer une station ne supprime ni ses métadonnées ni son futur historique.
Cette API de configuration s’utilise sur le même réseau de confiance que le serveur existant.

Exemple d’initialisation avant l’interface, après avoir lu les numéros dans `GET /velov` :

```sh
curl -X PUT http://localhost:3000/velov/tracked-stations \
  -H 'Content-Type: application/json' -d '{"stationIds":[1001,1002]}'
```

Les contrats TypeScript de `src/velov/contracts.ts` séparent les stations du suivi,
les observations (date source, date de collecte, provenance, qualité et compteurs nullable),
les prévisions météo (run, réception et cible), les résultats prédictifs (valeur, méthode,
version, cible, calcul, fraîcheur ou raison d’indisponibilité), les modèles et les tâches.
Les dates sont des chaînes ISO-8601 ; les dates fournisseur sont conservées telles que reçues
dans le catalogue et seront normalisées lors de la collecte. Une donnée inconnue vaut `null`,
jamais un zéro synthétique. Les futures tables seront ajoutées avec leurs capacités ; seules
`stations` et `tracked_stations` existent dans cette première version.
