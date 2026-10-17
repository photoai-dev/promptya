# Internationalisation et contenus éditoriaux

L’anglais est publié à la racine de `https://promptya.app/`, le français sous `/fr/`. Autres versions actives : `/es/`, `/it/`, `/pt/`, `/de/`, `/nl/`, `/br/`, `/cz/`, `/pl/`, `/ja/`. Les anciennes URL `/en/…` sont redirigées en 301 vers la racine. La variante brésilienne utilise `pt-BR`, la version portugaise `pt-PT` et le tchèque `cs-CZ` dans les balises de langue et de référencement. Les dossiers `/br/` et `/cz/` correspondent aux noms demandés.

Les textes publics des 176 pages de chacune des 11 versions sont enregistrés dans `public.editorial_pages` : textes éditoriaux, titres SEO, descriptions. Les blocs sont identifiés par le hash de leur texte source. Les prompts de génération restent dans leur table privée, sans traduction ni export.

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

## Publication et référencement multilingues

Les sources françaises restent dans `Promptya_Site/` pour préserver le système de génération et les clés `source_route` en base. `scripts/publish-language-root.mjs` publie uniquement dans `dist/` : anglais à la racine, français sous `/fr/`, autres langues sous leur préfixe. Ne pas remplacer les sources françaises par les fichiers publics anglais.

Les ressources JS et données françaises sont isolées sous `/fr/assets/` ; les ressources anglaises sont à `/assets/`. Le déplacement préserve les routes API. Les variantes linguistiques disposent de canonical et hreflang réciproques ; x-default désigne la page anglaise correspondante.

`/sitemap.xml` est un index vers `/sitemaps/fr.xml`, `/sitemaps/en.xml`, etc. Chaque sitemap contient les pages indexables de sa langue et leurs liens alternatifs. Les pages privées et administratives sont exclues. Le brésilien conserve `pt-BR` ; les codes du polonais et du japonais sont `pl` et `ja`. Les prix restent en euros : aucune conversion de devise fictive.

Les principaux messages commerciaux et titres des packs PL/JA sont adaptés dans `content/locales/pl-ja-copy.mjs`. Les textes éditoriaux initiaux sont en base. La recherche accepte les caractères Unicode, notamment japonais.
