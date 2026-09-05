# Vision : outil compagnon Dofus (progression et kamas)

Date : 2026-09-05
Statut : validé en brainstorm, sert de cadre à tous les sous-projets.

## 1. Intention

Un outil personnel, multiusage, qui aide un joueur Dofus « dans la moyenne » (peu de temps de
jeu, peu renseigné) à répondre à deux questions : **comment avancer dans le jeu** et **comment
faire des kamas**. L'outil grandit module par module selon les besoins du moment. Le premier
module porte sur l'élevage de dragodindes.

Deux piliers :

1. **Une base de connaissance (« wiki »)** rédigée en markdown, structurée pour être lue à la
   fois par le joueur et par un LLM en session Claude Code. Chaque affirmation porte ses sources,
   sa date de vérification et son niveau de confiance. Le savoir se challenge, se corrige, mais ne
   se réécrit pas sans raison une fois validé par l'expérience du joueur.
2. **Une application desktop Windows** (`.exe`, mise à jour automatique) qui rend le wiki en
   version digest ou détaillée, et propose des écrans de suivi (par ex. « quelle dragodinde, quel
   pourcentage de maturité ») avec des notes personnelles.

## 2. Contexte joueur (figé)

| Paramètre | Valeur |
|---|---|
| Version | Dofus 3 (Unity) |
| Type de serveur | multi-compte |
| Mode de jeu | un seul personnage à la fois |
| Serveur | réglage de profil dans l'app, changeable ; les prix saisis sont tagués par serveur |
| Langue | français |

## 3. Contraintes non négociables

- **Coût : zéro euro.** GitHub public (repo, Actions, Releases), API communautaire gratuite,
  Electron, shadcn-vue. Pas de certificat de signature de code : on accepte l'avertissement
  SmartScreen à la première installation.
- **Légalité.** Aucune automatisation côté jeu (pas de bot, pas de lecture mémoire, pas de
  scraping de l'HDV). Les prix sont saisis à la main par le joueur. Les données statiques
  (objets, montures, recettes) viennent d'une API communautaire dont la licence est compatible
  avec un projet dont le code est majoritairement produit par un LLM.
- **Source de données statiques : DofusDude** (`https://api.dofusdu.de`, code GPL-3.0, instance
  publique gratuite). Vérifié le 2026-09-05 : `/dofus3/v1/fr/mounts/all` renvoie 132 montures
  avec effets ; `/dofus3/v1/fr/items/resources/search` renvoie les objets d'élevage (Makina) avec
  recettes. L'API ne fournit **pas** de données d'élevage (générations, jauges) : elles viennent
  du wiki.
- **DofusDB exclu**, même en lecture. Sa licence NCPUL-AI 1.0 interdit les projets dont l'IA
  produit plus de 50 % du code et l'exposition des données à des agents IA (lu sur
  `https://api.dofusdb.fr/` le 2026-09-05).
- **Licence du projet : MIT** (déjà en place). Compatible : l'app appelle l'API DofusDude sans
  redistribuer son code.

## 4. Architecture retenue : monorepo, wiki embarqué au build

```
/
  README.md                 installation, mention DofusDude, licence
  LICENSE                   MIT
  wiki/                     base de connaissance (SP1, SP4, ...)
    INDEX.md                table des fiches : titre, statut, confiance, dernière vérif
    CONVENTIONS.md          format des fiches et règles de statut
    JOURNAL.md              trace de chaque changement de statut avec sa raison
    dragodindes/            fiches élevage
    kamas/                  fiches gains
    progression/            fiches avancement
  app/                      application Electron (SP2), vide avant SP2
  docs/superpowers/specs/   specs de design
  .github/workflows/        build + release par tag (SP2)
```

Décisions :

- Le wiki vit dans le repo, en markdown. Il est édité en session Claude Code, versionné par git,
  et **embarqué dans l'app à la compilation**. Une mise à jour du wiki produit une release, donc
  une mise à jour auto de l'app. L'app fonctionne hors ligne.
- Les **notes personnelles** du joueur (observations, prix constatés) s'écrivent depuis l'app et
  restent locales, rattachées à une fiche par son slug.
- Les **données du joueur** (dragodindes, prix, progression, profil) sont stockées en JSON dans le
  dossier utilisateur Electron, avec export et import JSON pour la sauvegarde.
- Écartés : wiki chargé à distance au démarrage (dépendance réseau, décalage de version, aucun
  gain puisque la release est gratuite et automatique) ; Tauri (toolchain Rust, le joueur veut
  Electron façon Discord) ; backend hébergé (coût, compte, RGPD, aucun besoin de synchro démontré).

## 5. Stack de l'application (figée pour SP2)

| Couche | Choix |
|---|---|
| Runtime desktop | Electron via electron-vite |
| Front | Vue 3 + TypeScript |
| UI | shadcn-vue + Tailwind v4 |
| Packaging | electron-builder, cible Windows NSIS (`.exe`) |
| Mise à jour | electron-updater, provider GitHub Releases, repo public |
| Stockage local | fichiers JSON dans `app.getPath('userData')` |
| Wiki | `import.meta.glob('/wiki/**/*.md')` au build, frontmatter parsé côté renderer |
| Données statiques | client HTTP vers DofusDude, cache local avec date |

## 6. Découpage en sous-projets

Chaque sous-projet a son spec, son plan et sa livraison. Ordre imposé : SP1 avant SP2 et SP3,
car le modèle de données de l'écran de suivi dépend de la compréhension du système d'élevage.

| # | Sous-projet | Livrable | Code |
|---|---|---|---|
| SP1 | Recherche dragodindes + format wiki | fiches, digest débutant, `modele-donnees.md` | non |
| SP2 | Socle app | `.exe` qui se met à jour, rend le wiki, gère profil/serveur, stockage, export/import | oui |
| SP3 | Écran de suivi élevage | saisie des dragodindes et jauges, notes perso par fiche, parcours débutant cochable étape par étape (demande joueur du 2026-09-05) | oui |
| SP4 | Analyse générale Dofus | fiches progression et kamas, digest | non |
| SP5+ | Modules selon besoins | prix HDV saisis, rentabilité craft, etc. | selon |

## 7. Cycle de vie du savoir

- Une fiche naît en `hypothese`. Elle passe en `valide` avec deux sources concordantes datées
  Dofus 3, ou avec la confirmation terrain du joueur.
- Le joueur challenge une fiche en session ou par une note perso dans l'app. Le LLM re-vérifie,
  met à jour `derniere_verif` et le statut, et consigne le changement dans `JOURNAL.md`.
- Une mise à jour majeure de Dofus déclenche une passe de re-vérification des fiches taguées.
- Une fiche dépassée passe en `obsolete`. On ne supprime jamais.
- Une astuce validée par l'expérience du joueur n'est plus retouchée sauf contradiction.

## 8. Critères de succès de la vision

- Le joueur peut, depuis l'app, comprendre en une minute une mécanique du jeu, puis creuser.
- Le joueur peut poser une question en session Claude Code et obtenir une réponse sourcée depuis
  le wiki, avec son niveau de confiance.
- Chaque module ajouté réutilise le même format de fiche et le même stockage local.
- Rien n'a coûté d'argent, rien n'enfreint les conditions d'utilisation de Dofus ni les licences
  des sources.

## 9. Qualité de code et garde-fous (contrainte pour SP2 et suivants)

Ajouté le 2026-09-05 à la demande du joueur : le code doit rester homogène et dans les bonnes
pratiques **par des règles outillées**, pas par discipline. Tout ce qui suit est gratuit.

### Design system : shadcn-vue obligatoire, imposé par le linter

- Toute UI passe par les composants shadcn-vue installés dans `app/src/components/ui/`.
- **Interdit dans les `.vue` hors `components/ui/`** : les balises natives `<button>`, `<input>`,
  `<select>`, `<textarea>`, `<dialog>`, `<table>`. Règle `vue/no-restricted-html-elements`
  (eslint-plugin-vue) avec un message qui nomme le composant shadcn à utiliser à la place.
- **Interdit** : les classes Tailwind de couleur brute (`bg-red-500`, `text-gray-700`, etc.).
  Seuls les tokens sémantiques du thème shadcn sont permis (`bg-primary`,
  `text-muted-foreground`, `border-border`...). Règle `vue/no-restricted-class` avec un motif
  regex sur la palette Tailwind.
- **Interdit** : importer une autre bibliothèque UI. Règle `no-restricted-imports`.
- Les composants shadcn-vue eux-mêmes (`components/ui/`) sont exemptés de ces règles : c'est là
  que les balises natives ont le droit d'exister.

### Linters et formatage

| Outil | Rôle |
|---|---|
| ESLint 9 (flat config) + eslint-plugin-vue + typescript-eslint | règles de code et règles design system ci-dessus |
| Prettier | formatage ; retenu plutôt que Biome pour son support complet des fichiers `.vue` |
| vue-tsc | typecheck strict des SFC |
| Vitest | tests unitaires |
| husky + lint-staged | lint + format des fichiers touchés avant chaque commit |

Une seule commande composite `npm run verify` enchaîne lint, typecheck et tests. Elle est le
gate unique en local et en CI.

### CI : GitHub Actions (gratuit sur repo public)

- **Sur chaque PR et push** : `npm ci`, `npm run verify`, build Electron sans publication. Un
  échec bloque le merge (branch protection sur `main`).
- **Sur un tag `v*`** : build Windows + publication de la release GitHub avec les artefacts
  `.exe` et le fichier `latest.yml` que lit electron-updater.
- **Renouvellement des dépendances** : Dependabot hebdomadaire, groupé.

### Ce que le spec SP2 devra détailler

La liste exacte des règles ESLint avec leur configuration, le contenu du workflow, la protection
de branche, et un test qui prouve que les règles design system cassent bien (un `.vue` avec un
`<button>` natif doit faire échouer `npm run lint`).
