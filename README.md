# Promptya

Site HTML multipage : 106 collections, 30 articles de journal, pages de mascottes, studio et API Node. Le contenu éditorial et les liens sont rendus à la compilation dans chaque fichier HTML. Aucun routeur SPA et aucun texte de prompt dans les pages publiques.

## Développement et validation

Node 22 ou 24, aucune dépendance à installer. Exécuter `npm run build`, `npm test`, puis `npm run dev`. L’URL locale est http://127.0.0.1:3000. Le serveur lit `.env` s’il existe et utilise les vraies API. Aucun paiement, résultat ou traitement de commande n’est simulé. Sans configuration fournisseur, les actions concernées répondent indisponible.

## Administration privée

Connexion : `/connexion-admin/`. Tableau de bord : `/admin/`. La page de connexion est publique et non indexable ; le tableau de bord et le recadrage sont vérifiés côté serveur à chaque requête. Les fichiers administrateur sont retirés de `dist` et inclus uniquement dans les fonctions serveur depuis `.server-ui/admin`. Aucun lien admin dans la navigation publique.

`node scripts/setup-admin.mjs` crée un accès initial uniquement s’il n’existe pas encore dans `.env`. Le mot de passe est affiché une fois, son empreinte scrypt est conservée. Aucun secret ne doit être versionné. Installer dans les variables serveur Vercel `ADMIN_LOGIN`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` et une `APP_URL` HTTPS correspondant au domaine. Les cookies sont HttpOnly, SameSite Strict et Secure en HTTPS, avec une durée d’une heure. La connexion applique une limitation de tentatives par instance ; configurer également une limitation distribuée au niveau de l’hébergement pour une exposition publique.

Une connexion Supabase avec un rôle dans `public.admins` reste compatible. Pour les créations d’aperçus attribuées à l’accès par mot de passe, `ADMIN_USER_ID` doit identifier un compte administrateur Supabase existant. Les actions serveur conservent leurs vérifications d’accès.

## Installation production

1. Importer le dépôt dans Vercel, preset Other, build `npm run build`, sortie `dist`, Node 24. Les chemins admin sont réécrits vers la fonction privée.
2. Exécuter les migrations Supabase 001 à 005 dans l’ordre. Elles ajoutent les commandes, tâches, bibliothèque privée, aperçus, forfaits et inventaire exclusif des mascottes.
3. Importer les instructions depuis le poste possédant `private/catalog.json` avec `node --env-file=.env scripts/import-prompts.mjs`. Les instructions restent privées ; ne pas les placer dans les fichiers publics.
4. Compléter les variables serveur de `.env.example` : Supabase, Replicate, Stripe et cron. Configurer les redirections Auth e-mail et SMTP sur le domaine final.
5. Installer le webhook Stripe `/api/stripe-webhook` avec `checkout.session.completed`, `checkout.session.async_payment_succeeded` et `checkout.session.expired`. Vérifier les clés test avant les clés de production.
6. Configurer `/api/worker` et `CRON_SECRET`. Mesurer la cadence réelle, les quotas, le coût et le délai avant de promettre un temps de livraison. Les appels fournisseurs sont facturés au compte connecté.
7. Tester la connexion, l’isolation de comptes, les références privées, chaque modèle, les lots, le webhook signé répété, le téléchargement et les erreurs fournisseur. Les connecteurs sont implémentés mais leur fonctionnement avec les comptes réels n’est pas validé tant que ces essais ne sont pas faits.

## Offres

100 photos par pack. Un pack : 22,90 €. Deux : 39,80 € au total. Trois : 50,70 €. Quatre : 59,60 €. Le serveur calcule le montant et ignore les prix envoyés par le navigateur.

Mascotte : 69,90 € pour 30 photos. Réservation atomique SQL, un acquéreur, retrait du catalogue après paiement confirmé. L’inventaire et les commandes sont conservés pour le suivi. `MASCOT_SALES_ENABLED`, conditions de cession et services de paiement/génération doivent être configurés avant activation. Une interruption entre réservation et création Stripe nécessite une réconciliation administrative. Tester les acquisitions concurrentes dans la base réelle.

Covers : page dédiée au format 1:1. L’outil actuel compose et exporte une maquette ; il n’appelle pas de génération IA payante. Tarif distinct à définir.

## Images et administration

Les images fournies sont organisées dans les univers correspondants. Les fiches mascottes présentent les vues de planches via des cadres indépendants. L’atelier `/admin/recadrage/` exporte de véritables fichiers PNG recadrés depuis le navigateur, sans modifier l’original. L’export ne remplace pas automatiquement un fichier publié.

L’admin peut préparer quatre exemples réels par pack. Les résultats restent privés jusqu’à validation et publication des quatre vues. Les aperçus non validés ou incomplets ne sont pas publiés.

## Référencement

Le journal se trouve dans `/blog/`. Trente articles distincts, sommaires HTML, liens croisés et liens vers les offres. Métadonnées, canoniques, BlogPosting, fil d’Ariane et sitemap sont générés à la compilation. Le plan de 50 requêtes est dans `docs/strategie-seo.md` et `docs/50-mots-cles.csv`. Les priorités reflètent l’adéquation aux offres ; aucun volume de recherche ni classement n’est inventé ou garanti.

Après publication, vérifier le domaine dans Search Console, soumettre `/sitemap.xml`, inspecter les URL et mesurer les requêtes et conversions. Ne pas publier le dépôt privé d’instructions : les secrets et `private/` sont exclus de Git. Les publications antérieures du dépôt doivent être prises en compte séparément.
