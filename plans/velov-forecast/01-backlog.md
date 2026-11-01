# Backlog : velov-forecast

Ce fichier est l’unique source d’avancement du chantier. Chaque unité correspond à une PR ; les numéros ci-dessous sont des identifiants d’unité, pas des numéros GitHub. Les titres restent stables une fois une unité lancée.

- [ ] **1. Persistance et contrats de données** (`02-fondations.md`)
- [ ] **2. Collecte autonome des disponibilités** (`02-fondations.md`, dépend de 1)
- [ ] **3. Gestion des stations suivies** (`02-fondations.md`, dépend de 1)
- [ ] **4. Premier déploiement sur homeserver** (`03-exploitation.md`, dépend de 2)
- [ ] **5. Qualification et import de l’historique** (`04-donnees.md`, dépend de 2)
- [ ] **6. Collecte et archivage météo** (`04-donnees.md`, dépend de 2)
- [ ] **7. Worker et prévisions statistiques** (`05-prediction.md`, dépend de 4)
- [ ] **8. Jeu d’apprentissage et évaluation temporelle** (`05-prediction.md`, dépend de 5, 6, 7)
- [ ] **9. Modèles enrichis et promotion contrôlée** (`05-prediction.md`, dépend de 8)
- [ ] **10. Consultation des prévisions dans l’application** (`06-interface.md`, dépend de 3, 7)
- [ ] **11. Recette complète et exploitation durable** (`03-exploitation.md`, dépend de 9, 10)
- [ ] **12. Clôture du chantier** (`07-cloture.md`, dépend de 11)

## Reprise et règles de PR

Reprendre avec `/resume-plan velov-forecast`. Utiliser la racine `plans` par défaut ; aucune surcharge `PLANS_DIR` n’est nécessaire. Sans labeler, la détection des PR en vol passe par le scan des PR ouvertes. Sans accès GitHub, signaler que les PR en vol ne peuvent pas être déterminées avant de choisir une unité.

Une branche par unité, avec un nom de type `feat-data-velov-forecast-collecte` ou `chore-ops-velov-forecast-deploiement`, sans numéro de séquence. Les commits suivent les conventions du dépôt.

La PR qui implémente une unité coche sa case dans cette même PR. Après l’ouverture et l’attribution du numéro GitHub, ajouter immédiatement `(#N)` après la case et la cocher, puis amender le commit et pousser avec `--force-with-lease` tant que la PR est fraîche et non revue. Ne jamais réserver une unité en cochant sa case sans travail livré.

Sur la branche par défaut, une case cochée correspond à du travail fusionné ; dans le diff d’une PR ouverte, elle permet à `resume-plan` d’identifier l’unité en vol. Réconcilier les coches lors des merges de PR parallèles. Une PR qui avance le chantier sans toucher ce fichier échappe à cette détection.

Ajouter une note de fin de ligne seulement si l’implémentation corrige le plan, avec renvoi au thème concerné ; annoter aussi le journal de vigilance du README. Une unité abandonnée reste barrée avec sa raison, sans réutiliser son titre pour une autre tâche.

L’unité 12 est à ouvrir dès la création de la PR 11, éventuellement sur sa branche, mais à fusionner après elle. Sa dépendance décrit l’ordre de fusion, pas une obligation d’attendre pour préparer la PR de clôture. Au moment de supprimer tout ce dossier, la suppression du backlog tient lieu de clôture finale ; ne pas recréer un fichier uniquement pour y cocher la dernière case.

Aucune porte humaine supplémentaire n’est prévue. L’accès historique indisponible et l’insuffisance de données d’apprentissage ont des issues explicites dans les unités 5 et 9.
