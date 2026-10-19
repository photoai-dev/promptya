# Installation Supabase Promptya

Projet : `uhrimkfjqdslofoirrqi`, région Francfort. Installation réelle effectuée le 16 octobre 2026 via l’intégration Supabase.

- Six migrations appliquées : commandes et tâches, prompts privés, aperçus, forfaits, mascottes, profils et paiements.
- 13 tables publiques protégées par RLS.
- 106 collections publiées dans le catalogue de données.
- 8 487 prompts de packs et 360 scènes de mascottes importés, soit 8 847 lignes.
- Contrôle par quantité et empreinte MD5 pour les 118 collections : aucune différence avec les fichiers sources.
- 12 personnages dans l’inventaire exclusif.
- Buckets `references` et `outputs` privés. `pack-examples` public ne reçoit que les exemples approuvés.
- Aucun droit SELECT sur `collection_prompts` pour `anon` ou `authenticated`.

Les avis Supabase « RLS enabled, no policy » des tables serveur sont attendus : aucune politique client n’est créée sur la bibliothèque privée, les tâches ou l’inventaire interne. Ils ne doivent pas être résolus en ouvrant ces tables au public. [Explication Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Paramètres restant à fournir pour le domaine public

Dans les variables serveur Vercel :

- `SUPABASE_URL` : URL du projet ci-dessus.
- `SUPABASE_ANON_KEY` : clé publique/publishable du projet, déjà reliée localement.
- `SUPABASE_SERVICE_ROLE_KEY` : clé serveur du projet, jamais dans les pages publiques.
- `REPLICATE_API_TOKEN` : clé API Replicate.
- `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` : clés Stripe.
- `CRON_SECRET` : secret du traitement des tâches.
- `APP_URL` : `https://www.promptya.app`.
- `ADMIN_LOGIN`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` : accès administrateur existant à transférer côté serveur.

Dans Supabase Auth, confirmer le Site URL et les redirections autorisées : `https://www.promptya.app/compte/` et `https://www.promptya.app/compte/?recovery=1`. Les URL locales de développement peuvent être ajoutées séparément. Configurer un SMTP de production avant l’ouverture commerciale et tester la confirmation et la récupération sur une adresse autorisée.

Les inscriptions, connexions et réinitialisations passent par Supabase Auth. Les jetons d’accès et de renouvellement sont placés dans des cookies HttpOnly ; ils ne sont pas retournés dans les réponses de connexion. Les mots de passe des clients sont traités par Supabase Auth et ne sont jamais stockés dans les tables de l’application.

Stripe encaisse les cartes. Seuls les webhooks signés et cohérents avec la commande mettent celle-ci en production ; les paiements confirmés sont enregistrés dans Supabase. Configurer les événements Checkout et `charge.refunded`. Aucun numéro de carte n’est stocké dans Supabase.

## FLUX 3 Image et budget

Modèle exact : `black-forest-labs/flux-3-image`. Adaptateur de génération et d’édition avec référence prêt. `images`, `aspect_ratio`, `resolution`, `grounding`, `output_format` et `output_quality` sont utilisés ; aucun paramètre de l’ancien Kontext n’est envoyé.

Plafond utilisateur : **0,02 USD par photo**. Le tarif Replicate consulté annonce **0,0205 USD en 768sq** et **0,024 USD en 1K**. Toutes les résolutions sont donc bloquées avant paiement et avant soumission. Aucun test payant n’a été lancé et aucun autre modèle n’a été choisi à la place. [Source Replicate](https://replicate.com/black-forest-labs/flux-3-image).

Une future campagne d’entraînement LoRA reste conditionnelle à des tests de ressemblance. FLUX 3 Image n’expose pas d’entrée LoRA dans le schéma consulté : ne pas lui transmettre `lora_weights`. Choisir et chiffrer un pipeline d’entraînement compatible séparément, avec consentement et fichiers privés, avant toute dépense.

Les écrans client et de gestion sont décrits dans [administration.md](administration.md).
