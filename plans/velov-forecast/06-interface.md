# Interface : consultation des prévisions

## Unité 10 — Consultation des prévisions dans l’application

**But :** rendre les prévisions utiles depuis la carte et le moniteur existants, avec un niveau de précision lisible. Référence : D-012.

**Travail attendu :**

- Réutiliser l’API de prévision groupée de l’unité 7, les composants et les tokens du projet. Charger les stations utiles par lot ; éviter une requête par marqueur ou une reconstruction de toute la carte à chaque changement d’heure.
- Ajouter un mode « maintenant » affichant les mesures courantes et un mode date/heure dans les 48 heures. Afficher l’heure cible effective de la grille et la date du dernier calcul.
- Pour une station suivie, présenter les probabilités de trouver au moins un vélo, un mécanique, un électrique et une place, ainsi que les nombres estimés par type. Distinguer une estimation statistique d’une prévision issue d’un modèle enrichi via les métadonnées, sans dépendre de l’unité 9.
- Ajouter une courbe simple par station pour explorer les 48 heures. Signaler les trous, données anciennes et champs inconnus ; ne pas tracer de faux zéros pour les périodes indisponibles.
- Dans le moniteur, permettre des heures distinctes de départ et d’arrivée. Réutiliser la sélection et les URL actuelles ; ne pas ajouter de calcul d’itinéraire ou de durée automatique à ce chantier.
- Distinguer les événements « au moins un » des seuils actuels du moniteur. Garder les seuils existants pour les mesures courantes ; pour le futur, afficher les probabilités et quantités sans leur attribuer abusivement la même sémantique.
- Préserver la consultation des stations non suivies en mode courant. En mode futur, afficher explicitement qu’aucune prévision n’est calculée pour ces stations, avec un accès à la gestion du suivi.
- Gérer chargement, erreurs, manque d’historique, absence de sous-type et résultat périmé. Le choix d’une nouvelle heure pendant une requête ne doit pas afficher ensuite une réponse correspondant à l’ancienne sélection.

**Points d’entrée :** vues Map et Monitor, client API Vélo’v et store de données. La configuration partagée du suivi appartient à l’unité 3. Lire la compétence de design du projet lors de l’implémentation et conserver ses règles de contraste, textes courts, focus et usage mobile.

**Pièges :** les alternatives de stations actuelles reposent sur des mesures et des seuils. Ne pas présenter une alternative calculée avec l’état présent comme garantie à l’heure future choisie ; réutiliser uniquement des résultats prédictifs cohérents ou garder cette suggestion dans le mode courant. Ne pas multiplier une probabilité vélo et une probabilité place pour annoncer une probabilité de trajet sans modèle joint.

**Vérification :** mesures actuelles et prévisions à 15 minutes, lendemain et limite de 48 heures ; mécanique/électrique inconnus ; station non suivie ; historique insuffisant ; erreur ou résultat périmé ; changements rapides d’heure et heures d’été/hiver. Vérifier séparément départ et arrivée, maintien des URL existantes, affichage mobile et navigation clavier. Les états sont testables avec des réponses API déterministes sans attendre un modèle entraîné en production.
