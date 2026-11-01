# Prédiction : référence, évaluation et modèles enrichis

## Unité 7 — Worker et prévisions statistiques

**But :** obtenir une première prévision exploitable et un contrat stable avant le machine learning. Références : D-002, D-008, D-009, D-011.

**Travail attendu :**

- Ajouter un worker Python avec dépendances verrouillées, construction Docker et second service Compose. Il attend la migration de l’application, partage le volume SQLite et stocke ses artefacts dans un volume dédié. Il n’expose aucun port HTTP.
- Ajouter un cycle de calcul non superposé toutes les cinq minutes et un heartbeat persistant. Écrire les résultats par génération atomique pour que les lecteurs ne voient pas une grille partiellement publiée. Tolérer la contention SQLite sans transaction longue pendant le calcul.
- Construire une référence statistique par station, jour de semaine et créneau comparable. Définir et documenter le support minimal et le regroupement progressif des créneaux/jours ; si les observations restent insuffisantes, publier l’état indisponible.
- Estimer les quatre événements « au moins un » et les trois quantités uniquement à partir des champs effectivement connus. Une cible électrique inconnue ne doit pas rendre inutilisable un total connu.
- Publier une grille de quinze minutes jusqu’à 48 heures, avec station, heure cible, origine de calcul, méthode, support historique, dates de données et état de fraîcheur. Les valeurs sont bornées et cohérentes avec la capacité connue ; ne pas imposer que vélos plus places égale capacité si des bornes sont indisponibles.
- Ajouter une consultation groupée des prévisions et l’état du worker sous l’API existante. Accepter une heure demandée ou une plage bornée et annoncer l’heure de grille effectivement renvoyée ; ne pas réétiqueter une prévision voisine avec une précision fictive.
- Refuser explicitement les échéances hors horizon et distinguer station inconnue, non suivie et suivie sans support suffisant. Une ancienne génération n’est pas présentée comme récente.

**Pièges :** cette unité ne dépend pas de la météo ; elle doit fonctionner même si les unités 5 et 6 sont absentes ou ne fournissent aucune donnée. Ne pas activer l’apprentissage enrichi ni afficher une fausse confiance avec quelques observations seulement.

**Vérification :** tests statistiques sur historique synthétique déterministe, créneaux peu documentés, champs inconnus, station fermée, absence de données, probabilité bornée et quantités non négatives. Tests d’API pour groupe de stations, plages et états indisponibles. Vérifier une génération atomique et la collecte pendant le calcul du worker.

## Unité 8 — Jeu d’apprentissage et évaluation temporelle

**But :** établir une mesure reproductible du potentiel et empêcher les fuites temporelles avant tout modèle enrichi. Références : D-004, D-007 et D-010.

**Travail attendu :**

- Construire un jeu d’exemples par station, origine et horizon, avec observations passées, capacité et état connus, variables calendaires Europe/Paris, tendances/retards et météo disponible à l’origine. Conserver des masques pour les champs ou cibles inconnus.
- Aligner les cibles sur les observations réelles et documenter la tolérance de rapprochement. Ne pas traverser de longues lacunes par interpolation et ne pas compter les répétitions d’une même donnée périmée comme un support indépendant.
- Séparer apprentissage, calibration et test dans le temps. Purger les exemples dont les cibles débordent sur la partition suivante, avec horizon maximum de 48 heures ; ne pas ajuster les transformations ou seuils sur le test.
- Réévaluer la référence statistique avec exactement les mêmes origines, horizons et dates limites que les candidats. Ajouter la persistance comme comparaison des quantités à court terme.
- Produire un rapport par cible et station, regroupé en horizons de 0–2 h, plus de 2–12 h et plus de 12–48 h, avec support et exclusions. Rapporter Brier et calibration pour les probabilités, MAE pour les quantités.
- Versionner la configuration d’évaluation, les variables, la fenêtre et le manifeste de données afin de reproduire le rapport. Séparer les résultats avec météo disponible à l’origine des analyses descriptives utilisant une météo observée.
- Borner l’extraction et l’échantillonnage ; ne pas charger en mémoire l’intégralité du produit observations × horizons. Réserver suffisamment de données pour la calibration et le test, sans réutiliser ces partitions pour l’apprentissage.

**Pièges :** les horodatages de données backfillées ne prouvent pas qu’une application les avait reçues à cette date ; distinguer simulation historique documentée et replay prospectif réellement archivé. Ne pas conclure à une amélioration sur une station ou une cible sans cas positifs et négatifs représentatifs.

**Vérification :** dataset synthétique avec valeurs futures volontairement révélatrices, frontières à 48 heures, trous de collecte, capacité modifiée, champs absents et runs météo indisponibles. Le rapport doit être reproductible et identifier les groupes non évaluables sans leur attribuer un score artificiel.

## Unité 9 — Modèles enrichis et promotion contrôlée

**But :** améliorer les prévisions lorsque l’historique le permet, sans dégrader le service lorsque ce n’est pas le cas. Références : D-008 à D-011.

**Travail attendu :**

- Utiliser scikit-learn pour une classification par événement et une régression par quantité, avec gradient boosting léger. Encoder station, calendrier et horizon sans ordinalité arbitraire des identifiants, en réutilisant les variables et partitions de l’unité 8.
- Calculer directement chaque horizon à partir de l’origine, sans propagation récursive des estimations. Calibrer les probabilités sur la partition dédiée lorsque le support le permet, et conserver l’état non évaluable pour les classes constantes ou trop rares.
- Entraîner quotidiennement sur les quatre-vingt-dix derniers jours, avec un cœur, cibles successives, plafond configurable d’exemples et temps de tâche borné. Documenter les limites effectives et la sélection d’échantillons reproductible.
- Après au moins huit semaines exploitables, évaluer les candidats face aux références sur les mêmes exemples. Promouvoir par cible et tranche d’horizon seulement si le score principal s’améliore strictement et que les contrôles de calibration, support et cohérence passent. Une égalité conserve la référence.
- Rendre les critères et seuils de support explicites dans la configuration et les rapports de la PR. Ne pas promettre un gain uniforme ou promouvoir à partir de métriques d’apprentissage.
- Versionner les modèles avec leur schéma de variables, métriques et dates d’entraînement. Publier atomiquement le manifeste actif ; garder une version précédente restaurable. Après timeout, artefact incompatible ou échec d’évaluation, poursuivre avec la dernière version compatible ou la référence.
- Conserver les quatre probabilités cohérentes : l’événement « un vélo quelconque » contient les événements mécanique et électrique. Vérifier les contraintes de probabilités et de compteurs sur la sortie effectivement servie, et évaluer aussi ces sorties finales.

**Pièges :** les huit semaines ne bloquent ni le merge ni les tests. Le modèle peut rester non activé jusqu’à l’éligibilité ; la référence ou l’état indisponible est alors le comportement attendu. Un backfill sans répartition par type ne suffit pas à entraîner les cibles mécaniques et électriques.

**Vérification :** candidat meilleur ou moins bon, égalité de scores, classe constante, support insuffisant, station nouvellement suivie, donnée météo absente, incompatibilité de variables, apprentissage interrompu et retour à la version précédente. Mesurer la mémoire et vérifier que collecte et lecture HTTP continuent pendant entraînement et pré-calcul.
