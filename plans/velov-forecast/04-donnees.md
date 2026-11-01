# Données : historique officiel et météo

## Unité 5 — Qualification et import de l’historique

**But :** utiliser l’historique officiel lorsqu’il est exploitable, tout en conservant une chaîne fonctionnelle sans backfill. Références : D-004 et D-006.

**Travail attendu :**

- Partir des références officielles de l’overview et rechercher le point d’accès actuel. Vérifier authentification, couverture réelle, granularité, identifiants, champs, dates/fuseaux, pagination et limites. Distinguer refus d’accès temporaire et disparition établie de la ressource.
- Consigner les vérifications datées et leur résultat dans la documentation durable de la source. Conserver seulement un échantillon technique borné, sans credentials, avec sa provenance ; une page de catalogue ne prouve pas que son historique est téléchargeable.
- Si accessible, ajouter un import déclenchable avec période bornée, initialement quatre-vingt-dix jours, limité aux stations suivies. Découper les requêtes, respecter les limites, enregistrer la progression et permettre reprise sans tout recommencer.
- Normaliser les observations avec leur provenance et dédupliquer les reprises et les recouvrements avec le direct. Définir explicitement le rapprochement lorsque la granularité ou les horodatages diffèrent ; ne pas écraser une mesure locale plus complète par une observation historique partielle.
- Garder mécanique/électrique inconnus si la source ne fournit qu’un total. Ces données restent utilisables pour les cibles qu’elles documentent réellement, sans fabriquer une répartition.
- Exposer un état d’import lisible : non lancé, en cours, terminé, en échec ou source indisponible, avec couverture réellement importée et dernière erreur utile.

**Issue prévue si l’accès est impossible :** documenter l’URL et le résultat des vérifications, exposer `source indisponible`, conserver le déclenchement sans faux succès et poursuivre avec la collecte locale. Ne pas ajouter de scraper de pages ou de source non officielle sans nouveau besoin exprimé. L’unité peut être livrée avec cette issue ; l’import non implémentable doit être signalé explicitement, pas présenté comme terminé.

**Pièges :** une période demandée n’est pas une période effectivement couverte ; les premiers vélos électriques et les changements de capacité peuvent modifier le schéma ou la comparabilité de l’historique. Le backfill ne doit pas monopoliser la connexion pendant la collecte.

**Vérification :** si l’API est accessible, import d’une petite fenêtre réelle, relance identique, interruption/reprise, pagination, réponse vide et données partielles, puis tests de fixtures pour ces cas. Dans tous les cas, vérifier l’état indisponible et l’absence de perturbation du collecteur. Exposer la couverture par cible aux unités d’apprentissage.

## Unité 6 — Collecte et archivage météo

**But :** constituer les variables météo sans introduire de connaissance future dans les évaluations. Références : D-007 et D-011.

**Travail attendu :**

- Vérifier la documentation et les limites Open-Meteo actuelles avec Context7, puis choisir et documenter les paramètres et modèles utilisés pour les températures, précipitations et vent. Utiliser des unités explicites et cohérentes.
- Associer les stations suivies à des localisations météo mutualisées ; éviter une requête par station à chaque minute. Actualiser les prévisions toutes les heures et couvrir au minimum les 48 heures utiles.
- Persister chaque prévision avec localisation, fournisseur/modèle, date cible, date de récupération et date de disponibilité lorsque connue. Conserver les générations successives nécessaires au backtest plutôt que remplacer leur historique par le dernier run.
- Fournir l’accès à la dernière prévision disponible à une origine de prédiction donnée. Pour les données récupérées en direct, ne jamais prétendre qu’elles étaient disponibles avant leur réception.
- Ajouter une voie d’import des runs historiques si leur couverture et disponibilité à l’époque sont établies. Documenter le délai de publication retenu ; la date d’initialisation seule ne suffit pas. Ne pas présenter la série Historical Forecast assemblée comme une reconstitution d’un horizon de 48 heures.
- Gérer cache, timeout, quotas et reprise. Une prévision absente ne devient pas une absence de pluie ; son absence doit rester détectable pour l’évaluation et les replis.

**Pièges :** un backfill météo peut être plus large que l’historique Vélo’v ; borner à la couverture utile. Les fuseaux, unités et heures d’été/hiver doivent rester cohérents avec les observations UTC et le calendrier Europe/Paris.

**Vérification :** mutualisation des appels, archivage de deux générations, sélection à une date d’origine, refus d’utiliser un run futur ou pas encore disponible, changement d’heure et panne fournisseur. Si les runs historiques ne sont pas disponibles, l’archivage prospectif fonctionne et les données manquantes restent explicites.
