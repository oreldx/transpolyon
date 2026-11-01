# Fondations : stockage, collecte et suivi

## Unité 1 — Persistance et contrats de données

**But :** préparer une application persistante, sans changer le comportement du fournisseur actuel avant l’arrivée du collecteur. Références : D-001 à D-004, D-012.

**Travail attendu :**

- Ajouter SQLite, un chemin de stockage configurable, des migrations versionnées et une fermeture propre de la connexion. Initialiser WAL et une attente bornée en cas de contention ; les migrations restent sous la responsabilité de l’application.
- Définir les contrats persistants des stations et de leur suivi, observations et dates, prévisions météo, résultats prédictifs, versions de modèles et états de tâches. Ajouter les tables au moment où leurs capacités sont implémentées, sans stocker de résultats fictifs pour réserver un contrat.
- Distinguer catalogue complet, liste suivie persistante et sélection de trajet. Conserver `number` comme identifiant métier, avec provenance, état, capacité et distinction entre champs connus et inconnus.
- Ajouter une lecture et une modification de la liste suivie sous le préfixe Vélo’v. Une liste vide est valide ; des identifiants invalides sont rejetés explicitement. Documenter le contrat pour que l’interface et l’initialisation du homeserver l’utilisent sans nouvelle décision produit.
- Préserver le tableau et les champs de `GET /velov` et le développement local existant. Les futurs résultats de prévision devront pouvoir distinguer valeur, méthode, heure cible, date de calcul, fraîcheur et indisponibilité.

**Points d’entrée :** application et plugins Fastify, types de l’API Vélo’v. Ajouter les nouvelles responsabilités dans des modules dédiés plutôt que dans les gestionnaires de routes. Les versions des dépendances choisies doivent être vérifiées selon les instructions Context7 du dépôt.

**Pièges :** ne pas introduire le worker ou la collecte dans cette PR ; ne pas confondre `gid` et `number` ; ne pas ajouter une seconde source de suivi dans le navigateur. Ne pas exposer de secrets dans les erreurs de configuration.

**Vérification :** migrations sur base vide et sur schéma précédent, réouverture de base, liste vide, ajout/retrait persistants, identifiants invalides et compatibilité du contrat actuel. Les tests utilisent une base temporaire et un fournisseur simulé.

## Unité 2 — Collecte autonome des disponibilités

**But :** collecter en continu sans trafic HTTP et préserver la consultation du réseau complet. Références : D-003 à D-005.

**Travail attendu :**

- Réutiliser le client Grand Lyon, les schémas Zod et le service de normalisation existants. Qualifier le flux courant sur une réponse bornée, puis conserver les fixtures utiles sans informations d’authentification.
- Ajouter une tâche de collecte toutes les minutes dans le processus applicatif. Empêcher les exécutions superposées, borner les appels et appliquer une reprise progressive après panne, avec arrêt propre.
- Rafraîchir le catalogue et les dernières disponibilités du réseau complet en mémoire. Persister les compteurs uniquement pour les stations suivies et rendre les relances d’un même lot idempotentes.
- Conserver dates source et de collecte, état, capacité et compteurs. Traiter explicitement station absente, fermée, observation inchangée, partielle ou périmée. Documenter la politique de fraîcheur et ne jamais faire passer une panne pour des disponibilités nulles.
- Faire lire `GET /velov` depuis la dernière collecte réussie plutôt que déclencher une collecte par visite. Ajouter des métadonnées compatibles et exposer l’état du collecteur. Avant la première réponse fournisseur valide, renvoyer une indisponibilité explicite, sans faux instantané vide.
- Prendre en compte les changements de suivi au cycle suivant. Une liste vide conserve le fonctionnement de la carte sans écrire d’historique de disponibilité inutile.

**Pièges :** les données fournisseur peuvent changer moins souvent que le polling ; les compter comme autant de mesures indépendantes peut biaiser l’apprentissage. Définir l’identité d’une observation et conserver la couverture temporelle nécessaire sans multiplier artificiellement le support statistique. Éviter qu’une seule station invalide efface l’instantané complet valide précédent.

**Vérification :** collecte sans navigateur, changement de suivi, retrait sans suppression, timeout, erreur HTTP, payload invalide, réponse partielle, observation répétée et reprise après redémarrage. Des requêtes concurrentes de consultation ne doivent pas multiplier les appels fournisseur. Tester avec horloge et transport simulés.

## Unité 3 — Gestion des stations suivies

**But :** gérer le suivi depuis l’interface existante, indépendamment de la collecte et des trajets. Références : D-003 et D-012.

**Travail attendu :**

- Étendre la page Config avec une liste des stations suivies, recherchables ou sélectionnables depuis le catalogue complet. Réutiliser la sélection de stations existante lorsque cela évite de dupliquer l’interaction.
- Charger et modifier la liste côté serveur via le contrat de l’unité 1. Présenter chargement, enregistrement, erreur et liste vide ; ne pas afficher un enregistrement réussi après un échec HTTP.
- Rendre le caractère partagé de cette configuration compréhensible. Retirer une station cesse son suivi, sans proposer implicitement d’effacer son historique.
- Garder les sélections départ/arrivée et leurs URL indépendantes du suivi. Aucune inscription automatique d’une station simplement consultée.
- Appliquer les tokens et composants existants, avec accessibilité et affichage mobile selon la compétence de design du projet.

**Pièges :** cette unité ne dépend pas du collecteur ; elle doit rester testable avec l’API de suivi seule. Deux navigateurs relisent la même source serveur, sans promettre une synchronisation instantanée entre onglets.

**Vérification :** ajout, retrait, rechargement, liste vide et échec d’enregistrement ; une modification est visible dans un second navigateur après rechargement. Les sélections de trajets continuent de fonctionner. Contrôle visuel mobile et clavier.
