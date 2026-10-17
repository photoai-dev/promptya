# Internationalisation et contenus éditoriaux

Le français reste à la racine. Versions actives : `/en/`, `/es/`, `/it/`, `/pt/`, `/de/`, `/nl/`, `/br/`, `/cz/`. La variante brésilienne utilise `pt-BR`, la version portugaise `pt-PT` et le tchèque `cs-CZ` dans les balises de langue et de référencement. Les dossiers `/br/` et `/cz/` correspondent aux noms demandés.

Les textes publics des 175 pages initiales de chaque langue sont enregistrés dans `public.editorial_pages` : textes éditoriaux, titres SEO, descriptions. Les blocs sont identifiés par le hash de leur texte source. Les prompts de génération restent dans leur table privée, sans traduction ni export.

Les messages dynamiques et leurs formes plurielles sont définis dans `content/locales/runtime-labels.json`.

Les fichiers `content/locales/<lang>.json` et `<lang>-overrides.json` contiennent les libellés d’interface, messages, attributs et les traductions initiales de secours. Les valeurs éditoriales provenant de la base prennent priorité sur ces traductions initiales. `editorial-snapshot.json` est un cache public de construction pour conserver un site disponible si la base ne répond pas. Il ne contient aucun prompt interne.

`npm run build` régénère les pages françaises, lit les contenus publiés en base, applique les traductions éditoriales et génère les autres langues. Le build produit du HTML directement indexable, les liens de langue correspondants, canonical/hreflang et le sitemap. Les ressources visuelles sont partagées. Les identifiants techniques et les routes API ne changent pas.

`content/supabase-public.json` ne contient que l’URL et la clé publique anon, protégée par RLS ; aucune clé privilégiée n’est publiée. Les comptes visiteurs et clients ne peuvent pas écrire dans `editorial_pages`.

L’écran privé `/admin/traductions/` permet de sélectionner la langue et la page, modifier les textes et les métadonnées. L’enregistrement utilise une révision pour éviter les écrasements concurrents. La publication se fait au prochain déploiement. Les écritures exigent la configuration serveur `SUPABASE_SERVICE_ROLE_KEY` avec les variables Supabase habituelles et `APP_URL`. La clé privilégiée doit rester exclusivement dans les variables serveur Vercel.

Vérification : `npm test`. Couverture du texte HTML : `content/locales/coverage-<lang>.json`. La couverture ne remplace pas une relecture éditoriale.

La vidéo Viral Trend est muette, optimisée, en boucle, chargée à l’apparition du header et suspendue hors écran. L’animation respecte la préférence de réduction des mouvements.

## Révision régionale

`content/locales/regional-copy.mjs` contient les noms de collections, modèles de titres et métadonnées des packs et messages produit relus par langue. `scripts/review-regional-copy.mjs` applique ces corrections aux fichiers de secours et au snapshot. La synchronisation SQL vérifie le texte précédent pour préserver les modifications de l’administration. `regional-review.json` décrit la portée réelle : la relecture intégrale des guides et articles reste à terminer. Aucun indicateur de couverture ne vaut validation linguistique complète.

Le domaine public de référence est `https://promptya.app`. La page `/mentions-legales/` et ses huit traductions sont générées depuis `scripts/legal-page.mjs` ; l’identité juridique de l’éditeur reste à compléter à sa demande.

## Aperçus de partage

`content/social-images.mjs` sélectionne une image par route source (pack, article, personnage, rubrique). Les variantes linguistiques partagent le visuel et traduisent leurs titres et descriptions. Les JPEG de 1200 × 630 sont préparés hors build avec `node scripts/prepare-social-assets.mjs` puis `scripts/optimize-social-assets.py`, et versionnés : Vercel ne dépend pas de Python. Les favicon SVG/ICO et l’icône Apple sont intégrés à toutes les pages.
