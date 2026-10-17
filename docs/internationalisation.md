# Internationalisation et contenus éditoriaux

Le français reste à la racine. Versions actives : `/en/`, `/es/`, `/it/`, `/pt/`, `/de/`. Le néerlandais est réservé mais non activé.

Les textes publics des 175 pages de chaque langue sont enregistrés dans `public.editorial_pages` : textes éditoriaux, titres SEO, descriptions. Les blocs sont identifiés par le hash de leur texte source. Les prompts de génération restent dans leur table privée, sans traduction ni export.

Les fichiers `content/locales/<lang>.json` et `<lang>-overrides.json` contiennent les libellés d’interface, messages, attributs et les traductions initiales de secours. Les valeurs éditoriales provenant de la base prennent priorité sur ces traductions initiales. `editorial-snapshot.json` est un cache public de construction pour conserver un site disponible si la base ne répond pas. Il ne contient aucun prompt interne.

`npm run build` régénère les pages françaises, lit les contenus publiés en base, applique les traductions éditoriales et génère les autres langues. Le build produit du HTML directement indexable, les liens de langue correspondants, canonical/hreflang et le sitemap. Les ressources visuelles sont partagées. Les identifiants techniques et les routes API ne changent pas.

`content/supabase-public.json` ne contient que l’URL et la clé publique anon, protégée par RLS ; aucune clé privilégiée n’est publiée. Les comptes visiteurs et clients ne peuvent pas écrire dans `editorial_pages`.

L’écran privé `/admin/traductions/` permet de sélectionner la langue et la page, modifier les textes et les métadonnées. L’enregistrement utilise une révision pour éviter les écrasements concurrents. La publication se fait au prochain déploiement. Les écritures exigent la configuration serveur `SUPABASE_SERVICE_ROLE_KEY` avec les variables Supabase habituelles et `APP_URL`. La clé privilégiée doit rester exclusivement dans les variables serveur Vercel.

Vérification : `npm test`. Couverture du texte HTML : `content/locales/coverage-<lang>.json`. La couverture ne remplace pas une relecture éditoriale.

La vidéo Viral Trend est muette, optimisée, en boucle, chargée à l’apparition du header et suspendue hors écran. L’animation respecte la préférence de réduction des mouvements.
