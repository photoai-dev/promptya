# Espaces client et plateforme

## Espace client

La page compte et la page commandes ouvrent le même espace après connexion Supabase : vue d’ensemble, créations, galerie privée par commande, téléchargement ZIP, reprise du paiement, historique des paiements, nom affiché et changement de mot de passe. Les nouvelles interfaces sont traduites dans les onze versions. Les images sont fournies par des liens signés de dix minutes ; aucune instruction interne n’est envoyée au client.

Chaque requête serveur retrouve l’utilisateur depuis la session vérifiée. Les lectures de commandes, paiements et profils imposent son identifiant côté serveur ; aucun identifiant de propriétaire fourni par le navigateur n’est accepté. Les listes sont paginées par 25 éléments.

## Administration

Connexion privée : `/connexion-admin/`. Gestion : `/admin/`. L’interface est servie uniquement après vérification administrateur côté serveur et n’est pas publiée dans les fichiers HTML statiques. Un compte client ne possède pas ces droits.

- Vue d’ensemble : compteurs réels, configuration des services et blocage du budget de génération.
- Commandes : pagination, filtres de statut, avancement, galerie et erreurs fournisseur.
- Paiements : historique confirmé par les webhooks Stripe, sans données de carte.
- Clients : nom, e-mail, inscription et nombre de commandes. Aucun mot de passe n’est accessible.
- Catalogue : recherche et activation/suspension de nouvelles commandes. La fiche publique reste visible, les commandes déjà payées sont conservées. L’API relit la disponibilité avant toute nouvelle création de commande.
- Mascottes : inventaire disponible, réservé et vendu.
- Aperçus : préparation et validation des quatre images, avec publication explicite.
- Contenus et traductions : éditeur existant, puis reconstruction via le hook Vercel pour mettre à jour les pages statiques.

## Configuration restante avant essais réels

Dans **Vercel → projet relié à promptya.app → Settings → Environment Variables**, ajouter les valeurs provenant des comptes fournisseurs, puis redéployer :

| Variable | Origine |
|---|---|
| `APP_URL` | `https://www.promptya.app` |
| `SITE_URL` | `https://www.promptya.app` |
| `SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | Clé publique du même projet |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé serveur du projet Supabase, dans Settings → API Keys. Cette clé privilégiée contourne les règles RLS : elle reste exclusivement côté serveur. |
| `ADMIN_LOGIN`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` | Accès administrateur préparé localement par `scripts/setup-admin.mjs` ; transférer l’empreinte, pas un mot de passe en clair. |
| `REPLICATE_API_TOKEN` | Compte Replicate → API tokens |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe **de test** pour les essais |
| `STRIPE_WEBHOOK_SECRET` | Secret de l’endpoint `/api/stripe-webhook` dans Stripe |
| `CRON_SECRET` | Secret du traitement existant |
| `VERCEL_DEPLOY_HOOK_URL` | Hook du projet/branche de production, pour le bouton de publication |

Autoriser les URL de compte/récupération de chaque langue dans Supabase Auth et configurer le SMTP de production. Tester confirmation d’adresse, connexion, renouvellement, récupération et déconnexion. Tester ensuite deux comptes distincts, un paiement Stripe de test, les webhooks répétés et le téléchargement privé.

La génération reste bloquée par la politique de coût existante : le montant enregistré de 0,0205 USD dépasse le plafond de 0,02 USD. Ajouter un token Replicate ne lève pas ce blocage. Le modèle ou le plafond devra être décidé avant un essai payant. Aucun essai payant n’a été effectué pendant cette refonte.

Les données du serveur de vérification `.local/management-ui-qa.mjs` sont fictives et restent locales. Elles ne sont ni importées dans Supabase ni livrées dans le site.
