# Internationalisation

Le français reste à la racine. La version anglaise est générée dans `/en/` au build, à partir des pages françaises. Les prompts internes ne sont ni exportés ni traduits.

- `content/locales/config.json` : langues prévues et langues activées (fr/en uniquement).
- `content/locales/en.json` : traductions du contenu public.
- `content/locales/en-overrides.json` : corrections éditoriales prioritaires.
- `scripts/build-locales.mjs` : pages HTML, catalogue public, scripts clients, routes, canonical/hreflang et sitemap.
- `scripts/locale-runtime.js` : traduction des messages dynamiques, maintien des liens dans la langue choisie et atelier JSON anglais.
- `content/locales/coverage-en.json` : couverture du texte HTML au dernier build.

Exécuter `npm run build`, puis `npm test`. Ajouter les nouveaux textes à la traduction avant publication. Les identifiants de packs, champs techniques et routes API restent stables. Les images partagées ne sont pas dupliquées. Les planches contenant du français sont remplacées par les poses individuelles dans le catalogue anglais.

Les langues it/es/pt/de/nl sont réservées dans la configuration, sans pages ni liens publics tant que leurs traductions ne sont pas prêtes. L'administration privée reste en français.
