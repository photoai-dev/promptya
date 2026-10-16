# Promptya

Reprise de l’archive fournie et de ses 106 collections. Site HTML multipage, JavaScript progressif et API Node pour Vercel. Aucun routeur SPA. **8 487 prompts récupérés depuis l’archive et conservés localement dans `private/catalog.json`, exclu de Git et du site publié.** Aucun classeur Excel n’était présent dans l’archive. Les pages publiques ne présentent aucun texte de prompt. Les galeries de six images sont des inspirations, en attendant des résultats validés propres à chaque collection.

## Prévisualiser

Node 22 ou 24, aucune dépendance à installer :

```sh
npm run build
npm test
npm run dev
```

Ouvrir http://localhost:3000. Studio → choisir une collection → accepter les droits → tester la commande → Mes commandes → ZIP. Le traitement local simule huit secondes ; **les fichiers sont des exemples identiques du catalogue, aucune image IA n’est générée et aucun paiement n’est effectué**. Les commandes persistent dans `.local/orders.json`, séparées par cookie de navigateur. Le serveur local écoute uniquement sur loopback et ne doit pas être exposé en production.

## Brancher GitHub / Vercel / Supabase / Replicate

1. Importer `photoai-dev/promptya` dans Vercel, racine du dépôt, preset Other, commande `npm run build`, sortie `dist`. Node 24. La configuration API est dans `vercel.json`.
2. Créer le projet Supabase. Exécuter `supabase/migrations/001_promptya.sql`, puis `002_private_prompts.sql` une fois dans le SQL Editor. Cela crée commandes, tâches, événements Stripe, administrateurs, bibliothèque de prompts non accessible aux clients et deux buckets privés. Depuis le poste de travail qui possède `private/catalog.json`, importer la bibliothèque avec `node --env-file=.env scripts/import-prompts.mjs`. Sans cet import, les commandes de collections sont bloquées avant paiement.
3. Dans Supabase Auth : activer la connexion e-mail, définir Site URL et Redirect URL sur `https://VOTRE-DOMAINE/compte/`. Configurer le fournisseur SMTP et ses limites avant mise en vente.
4. Dans les variables **serveur Vercel**, renseigner les noms de `.env.example`. `APP_URL` doit être l’origine HTTPS finale sans slash. Aucune clé secrète dans le HTML, le dépôt ou le chat. Les clés service_role, Stripe et Replicate restent côté serveur.
5. Créer dans Stripe un webhook vers `https://VOTRE-DOMAINE/api/stripe-webhook`, événements `checkout.session.completed` et `checkout.session.async_payment_succeeded`. Reporter son secret de signature. Utiliser d’abord les clés test.
6. Renseigner `REPLICATE_API_TOKEN`. Les trois adaptateurs sont FLUX Schnell, FLUX Kontext Pro (une référence) et FLUX Dev LoRA (poids compatibles Hugging Face). Tester chaque schéma fournisseur avec une image avant des lots payants.
7. Le cron Vercel `/api/worker` nécessite `CRON_SECRET`. Le calendrier de cinq minutes demande un plan Vercel qui l’accepte. Le worker prend trois tâches persistantes avec bail SQL, soumet des prédictions asynchrones puis les relève aux passages suivants. **Cette cadence est conservatrice et ne valide pas une livraison de 100 images sous deux heures.** Ajuster cadence, concurrence, budget et quotas après mesure. Aucun long traitement en mémoire ne survit entre invocations.
8. Pour accorder l’administration : `insert into public.admins(user_id) values ('UUID_DU_COMPTE');` dans le SQL Editor. Les API vérifient le compte avant de lire les commandes.
9. Déployer puis tester : connexion e-mail, références privées, paiement Stripe test, webhook signé répété, une génération par modèle, un lot de 100, archive privée et isolation entre deux comptes.

Les pages locales ne basculent jamais en facturation réelle. En ligne, une configuration manquante bloque l’API ; aucun faux résultat n’est présenté comme une génération.

## Confidentialité de la bibliothèque

Le catalogue navigateur `Promptya_Site/assets/catalog.json` ne contient que les noms, les catégories, les images et les nombres de scénarios. Les instructions réelles ne sont chargées par l’API qu’au moyen de la clé serveur Supabase. Ne pas ajouter `private/` à Git. **La première version du dépôt contenait déjà les textes dans le HTML et le JSON : ils subsistent dans l’historique Git. Le dépôt ayant été public, le rendre privé est nécessaire pour restreindre cet historique ; cela ne révoque pas d’éventuelles copies antérieures.** Une éventuelle réécriture d’historique doit faire l’objet d’une opération distincte, après sauvegarde et coordination.

La prévisualisation locale se recharge automatiquement lorsque les fichiers publics changent. Les six planches Viral Trend fournies sont intégrées dans `assets/viral/`. Les collections de génération de ces personnages sont indiquées comme en préparation ; aucune vente automatique de personnage n’est activée.

## État et limites avant lancement commercial

- Conservé : design blanc, accueil, catalogue, 106 fiches avec prompts, FAQ, Adult Prompt et Viral Trend.
- Ajouté : studio, import avec aperçu, options selon modèle, commandes locales persistantes, ZIP réel d’exemples, compte e-mail, pages catégories rendues en HTML, sitemap, llms.txt, adaptateurs Vercel/Supabase/Stripe/Replicate et migration avec RLS.
- Connecteurs cloud écrits mais **non testés avec les comptes réels**. Prévoir essais d’intégration, tests de charge, traitement des remboursements, purge des références, observabilité et alertes.
- Administration initiale : état des intégrations et liste des commandes ; édition du catalogue, remboursement et relance manuelle restent à développer.
- ZIP cloud construit à la demande dans une fonction : mesurer mémoire et délai pour 100 sorties haute résolution ; migrer vers un worker dédié/ZIP en flux si les limites Vercel sont dépassées.
- Une interruption entre création Replicate et enregistrement de l’identifiant est signalée comme échec pour éviter de relancer une facturation à l’aveugle. Réconciliation manuelle à prévoir.
- Les rubriques Adult Prompt et Viral Trend sont conservées ; elles ne constituent pas un nouveau catalogue adulte importé. Aucun filtre fournisseur n’est désactivé. Contrôle éditorial et règles commerciales restent à finaliser.
- Les miniatures existantes sont réutilisées ; elles ne sont pas des exemples générés propres à chacune des 106 collections. Remplacement progressif à prévoir.
- Les URL canoniques utilisent `https://promptya.com` hérité de l’archive : remplacer si le domaine final diffère.
- L’objectif de deux heures n’est pas garanti. La rentabilité à 19,90 € doit être vérifiée par modèle avec frais, reprises et taxes.

## Sources techniques

- https://vercel.com/docs/functions/runtimes/node-js
- https://supabase.com/docs/guides/auth
- https://replicate.com/black-forest-labs/flux-schnell/api
- https://replicate.com/black-forest-labs/flux-kontext-pro/api/schema
- https://replicate.com/black-forest-labs/flux-dev-lora/api/schema
- https://docs.stripe.com/events/manage-webhook-endpoints
