# Clôture du chantier

## Unité 12 — Clôture du chantier

**But :** retirer la documentation temporaire après livraison tout en conservant les informations nécessaires à l’exploitation. Références : D-013 et règles du backlog.

**Préparation :** ouvrir cette PR dès que la dernière PR fonctionnelle, l’unité 11, est créée. Si celle-ci n’est pas encore fusionnée, préparer la clôture sur sa branche ; l’ordre de fusion reste unité 11 puis unité 12. Cette règle ne lève aucune dépendance fonctionnelle.

**Travail attendu :**

- Vérifier que les unités fonctionnelles sont associées à de vrais numéros de PR et que leurs PR sont fusionnées avant de fusionner la clôture. Une coche locale ou une PR en review ne suffit pas.
- Vérifier que README racine et documentation durable décrivent installation, configuration du suivi, collecte, état réel du backfill, entraînement, limites, sauvegarde/restauration et mise à jour.
- Transférer les corrections d’exploitation encore présentes seulement dans le journal de vigilance vers cette documentation ou les tests concernés. Ne pas recopier tout le plan en archive pour remplacer sa suppression.
- Supprimer `plans/velov-forecast/` et les liens devenus caducs. Si une entrée de labeler a été ajoutée pendant le chantier, retirer cette seule entrée ; conserver un éventuel label GitHub pour l’historique des PR.
- Ne pas modifier le comportement applicatif dans cette PR. Les défauts fonctionnels de recette doivent être corrigés avant elle.

**Pièges :** supprimer le dossier supprime aussi le backlog ; ne pas recréer artificiellement une dernière case cochée pour garder ce dossier. La PR et son ordre de fusion sont la trace finale. Ne pas laisser de consigne durable accessible uniquement via un chemin supprimé.

**Vérification :** contrôle des numéros et états des PR fonctionnelles, absence de liens actifs vers le dossier supprimé, présence des procédures durables, diff limité au nettoyage documentaire et à une éventuelle entrée de labeler. Vérifier que le code, les tests, les volumes et les modèles ne sont pas modifiés par cette suppression.
