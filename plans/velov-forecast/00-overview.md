# Vue d’ensemble : Vélo’v sur homeserver

## Contexte et résultat attendu

Transpolyon est une application personnelle de mobilité lyonnaise. À la rédaction de ce plan, le frontend Vue propose une carte des stations, une sélection par station ou adresse et un moniteur départ/arrivée. Fastify interroge Grand Lyon à chaque demande de disponibilités. Le dépôt ne contient ni base persistante, ni collecte autonome, ni déploiement Docker, ni modèle prédictif.

L’objectif validé est une chaîne complète sur un homeserver disposant d’environ 2 à 4 Go de RAM pour le projet, avec accès local ou VPN. Elle doit collecter continuellement les stations choisies par l’utilisateur et répondre à la question : « à cette station, à cette heure, quelles sont mes chances de trouver un vélo ou une place ? » L’utilisateur souhaite distinguer mécanique, électrique et tout vélo, et disposer aussi de quantités estimées.

Ce document transcrit les choix du plan validé dans la conversation du 1er novembre 2026 et constitue la référence produit de ce dossier. Les instructions explicites ultérieures de l’utilisateur prévalent. L’avancement est exclusivement dans [01-backlog.md](01-backlog.md) ; les corrections découvertes pendant l’exécution sont annotées dans le journal du [README](README.md).

## Périmètre inclus

| Capacité | Résultat attendu et justification |
|---|---|
| Déploiement privé | Compose, volumes persistants, contrôles de santé et procédures de maintenance, adaptés à un usage personnel |
| Stations suivies | Liste partagée conservée côté serveur et modifiable depuis l’app, pour limiter historique et calcul aux stations utiles |
| Catalogue complet | Réseau entier consultable sur la carte et dans la sélection ; le suivi n’en réduit pas la visibilité |
| Collecte Vélo’v | Appels autonomes, résilients et horodatés, sans navigateur ouvert |
| Backfill facultatif | Exploiter l’historique officiel si accessible, sans bloquer l’accumulation de nouvelles observations |
| Météo | Prévisions horaires archivées et, lorsque possible, prévisions historiques disponibles à l’époque |
| Prédiction | Quatre probabilités et trois quantités par station, à échéance comprise entre maintenant et 48 heures |
| Évaluation | Comparaison temporelle reproductible à une référence simple avant utilisation des modèles enrichis |
| Consultation | Carte, moniteur, courbe par station et choix distinct des heures de départ et d’arrivée |
| Exploitation | Rétention, sauvegarde/restauration, diagnostic de fraîcheur et reprise après panne |

Les quatre événements prédits sont la présence d’au moins un vélo quelconque, d’au moins un mécanique, d’au moins un électrique et d’au moins une place libre. Les trois quantités sont le nombre de mécaniques, d’électriques et de places disponibles. Une quantité prédite n’est pas une observation ni une garantie de disponibilité.

## Périmètre exclu

- **Collecte historique de tout le réseau** : l’utilisateur a choisi de suivre seulement ses stations. Le catalogue et les disponibilités courantes restent complets.
- **Comptes utilisateurs et publication Internet** : accès privé ou VPN choisi ; HTTPS public et authentification applicative seraient un chantier distinct.
- **Nouveau calculateur de trajet, trafic TCL et comparaison multimodale** : utiles à l’ambition générale du projet, mais indépendants de la chaîne Vélo’v demandée.
- **GPU, deep learning et infrastructure distribuée** : disproportionnés pour le matériel et le volume ciblés. La première famille enrichie sera du gradient boosting sur CPU.
- **Garantie de performance à 48 heures** : la pertinence sera mesurée par horizon. Un modèle peut être utilisé pour une cible et remplacé par la référence pour une autre.
- **Suppression d’historique lors du retrait d’une station** : le retrait désactive la collecte et les nouvelles prévisions ; la rétention normale s’applique aux données existantes.
- **Automatisation GitHub supplémentaire** : aucun labeler n’existe dans le dépôt inspecté. La reprise utilisera le scan des PR ouvertes, sans création d’un workflow dédié.

## Décisions

Registre à identifiants stables. Ajouter toute décision nouvelle en fin de registre ; ne pas renuméroter les décisions déjà citées. Une évolution invalidant un choix initial doit également être signalée dans le journal de vigilance.

### D-001 — Conserver Vue et Fastify

Étendre les composants, routes et services existants plutôt que réécrire l’application. Fastify servira les fichiers compilés du client et l’API sur la même origine. Cela évite un troisième service de frontend et simplifie l’accès privé. Le développement local avec Vite reste possible.

### D-002 — Deux services et SQLite local

L’application assure HTTP, migrations, collecte et configuration ; un worker Python assure apprentissage et pré-calcul des prévisions. Ils partagent SQLite en mode WAL sur un volume local et un volume séparé contient les artefacts de modèles. Les écritures sont courtes, avec gestion de la contention. PostgreSQL et un broker ne sont pas nécessaires à ce périmètre. Un partage de fichiers réseau n’est pas une cible prise en charge.

### D-003 — Séparer catalogue, suivi et trajet

Le catalogue complet fournit la carte et la sélection. Une liste persistante côté serveur détermine quelles stations historiser et prédire. Les stations de départ/arrivée d’un trajet restent une sélection indépendante ; consulter une URL de moniteur ne modifie pas le suivi. Une nouvelle installation commence avec une liste vide explicitement signalée. L’API permet son initialisation avant l’arrivée de l’interface.

### D-004 — Conserver la sémantique des mesures

Utiliser l’identifiant stable `number` déjà exposé par le service. Conserver capacité, état de station, compteurs, provenance, dates source et de collecte et qualité des données. Les sous-types absents restent inconnus. Les disponibilités de places ne sont pas déduites par simple soustraction : une borne occupée peut être inutilisable. Distinguer une observation inchangée d’une observation périmée et rendre les reprises idempotentes.

### D-005 — Livrer la collecte avant la prédiction

Le premier déploiement arrive en unité 4, sans attendre le worker. Il commence à constituer l’historique dès qu’une station est suivie. Les étapes suivantes ajoutent leurs capacités par migrations compatibles. L’absence de stations suivies ou de données suffisantes est un état normal, affiché distinctement d’une panne.

### D-006 — Backfill opportuniste

L’accès historique doit être qualifié à l’unité 5 : URL officielle actuelle, authentification, dates disponibles, sous-types, pagination et limites. Le catalogue trouvé n’établit pas à lui seul la disponibilité d’un endpoint exploitable. Si l’accès est impossible, documenter les vérifications et exposer l’état indisponible ; les unités suivantes utilisent les observations locales sans conditionner leur livraison à une intervention externe.

### D-007 — Météo disponible à l’origine de prédiction

Utiliser Open-Meteo pour température, précipitations et vent, en mutualisant les stations associées à une même localisation météo. Archiver les prévisions reçues avec la date cible et leur disponibilité. Les runs historiques peuvent compléter les données lorsque leur disponibilité passée est établie ; leur seule date d’initialisation ne suffit pas à prouver qu’ils étaient déjà publiés. Une météo observée après coup peut servir à une analyse descriptive, pas à présenter un backtest opérationnel sans fuite temporelle.

### D-008 — Référence statistique avant modèles enrichis

La référence repose sur les observations d’une station, un jour de semaine et un créneau comparables, avec regroupements plus larges lorsque le support est faible. Les modèles enrichis utilisent un gradient boosting léger via scikit-learn : classification des quatre événements et régression des trois quantités. Aucun entraînement ne s’exécute dans une requête HTTP. L’insuffisance de données conduit à la référence ou à un résultat indisponible, jamais à une précision fictive.

### D-009 — Pré-calcul direct jusqu’à 48 heures

Calculer chaque horizon à partir des données connues à l’origine, sans réinjecter récursivement les estimations. Le worker publie une grille de quinze minutes recalculée toutes les cinq minutes. Les réponses précisent l’heure cible effective, la date de calcul, la méthode et la fraîcheur. À l’instant présent, les données mesurées restent identifiées comme telles.

### D-010 — Validation chronologique et promotion par cible/horizon

Construire des partitions chronologiques distinctes pour apprentissage, calibration et évaluation. Les cibles futures ne doivent pas franchir leurs frontières ; les transformations sont ajustées sur l’apprentissage seul. Mesurer Brier et calibration pour les probabilités, erreur absolue pour les quantités, par station et par horizon. Comparer au minimum à la référence saisonnière, et à la persistance pour les quantités à court terme. Seuls les modèles validés améliorant leur référence sont promus ; conserver les métriques, artefacts et la version précédente.

### D-011 — Dimensionnement borné

L’entraînement tourne sur un cœur, avec traitement séquentiel des cibles et échantillonnage borné. Éviter de matérialiser en mémoire le produit de tout l’historique par tous les horizons. Les plafonds et limites de ressources doivent être configurables et vérifiés pendant la recette sur une cible de 2 à 4 Go de RAM. La collecte reste prioritaire face à un calcul en retard ou en échec.

### D-012 — Compatibilité et interface

Conserver le tableau et les champs actuels de `GET /velov` ; ajouter seulement des métadonnées compatibles. Ajouter des capacités de gestion du suivi, d’historique borné, de prévision groupée et de diagnostic. L’interface suit le design system existant et distingue mesures, estimations statistiques et résultats de modèles. Les probabilités portent sur « au moins un » ; les seuils actuels du moniteur ne doivent pas leur être appliqués comme s’il s’agissait de probabilités de trouver trois vélos ou cinq places.

### D-013 — Sauvegarde et clôture

Utiliser un mécanisme de sauvegarde cohérent de SQLite et sauvegarder les artefacts avec leur manifeste de version ; vérifier la restauration avant de déclarer la chaîne exploitable. Les procédures durables vivent dans la documentation du projet, hors de ce dossier temporaire. La dernière PR retire ce plan après fusion des PR fonctionnelles.

## Paramètres par défaut

| Paramètre | Valeur |
|---|---|
| Accès | Réseau privé ou VPN |
| Stations suivies initiales | Aucune ; configuration explicite par API puis dans l’app |
| Collecte des disponibilités | Toutes les minutes |
| Actualisation météo | Toutes les heures |
| Horizon maximum | 48 heures |
| Pas de prévision | 15 minutes |
| Recalcul des prévisions | Toutes les 5 minutes |
| Entraînement | Quotidien, sur un cœur |
| Fenêtre d’apprentissage | 90 derniers jours |
| Première candidature d’un modèle enrichi | Après 8 semaines exploitables, sous réserve de validation |
| Backfill initial | 90 jours si l’API le permet |
| Rétention de l’historique local | 12 mois |
| Stockage des dates | UTC |
| Calendrier et affichage utilisateur | Europe/Paris |

Les limites d’apprentissage et les cadences sont configurables. Les huit semaines constituent un seuil de données pour la candidature, pas un critère permettant à lui seul de promouvoir un modèle, et pas une attente obligatoire avant de fusionner son code.

## Références et état des connaissances

- [Référence historique Grand Lyon](https://data.grandlyon.com/geonetwork/api/api/records/4b0d73e5-9a76-4b22-9798-67760a88a1c7) : trouvée dans le catalogue lors de la préparation ; l’ouverture directe a renvoyé une erreur. L’unité 5 doit revalider l’accès actuel.
- [Historical Forecast Open-Meteo](https://open-meteo.com/en/docs/historical-forecast-api) : série assemblée, distincte des horizons complets d’un run.
- [Single Runs Open-Meteo](https://open-meteo.com/en/docs/single-runs-api) : accès aux runs individuels, avec couverture à vérifier selon modèle et période.
- [Conditions et limites Open-Meteo](https://open-meteo.com/en/pricing) : à revérifier lors de l’intégration pour l’usage personnel prévu.
- [Design system du projet](../../.agents/skills/transpolyon-design-sytem/SKILL.md) : réutiliser composants et tokens existants.

Ces liens sont des pistes de validation, pas une garantie de disponibilité future. Les PR concernées vérifient les documentations courantes selon les instructions Context7 du projet avant toute intégration d’API ou de bibliothèque.
