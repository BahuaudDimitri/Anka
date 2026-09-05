# SP1 : recherche dragodindes et wiki — plan d'exécution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** produire la première tranche du wiki (dix fiches sur l'élevage de dragodindes, un digest débutant, un modèle de données) au format défini par le spec, chaque affirmation sourcée et datée.

**Architecture :** zéro code. Chaque tâche = recherche web ciblée → rédaction d'une fiche markdown → contrôle de format par une commande shell → commit. Une tâche finale de vérification adversariale rouvre chaque source citée. Les fichiers de cadre (CONVENTIONS, INDEX, JOURNAL) sont créés en premier pour que chaque fiche ait un gabarit à respecter.

**Tech Stack :** markdown + frontmatter YAML, outils WebSearch / WebFetch de Claude Code, git. Aucune dépendance installée.

**Spec :** `docs/superpowers/specs/2026-09-05-sp1-recherche-dragodindes-wiki-design.md`

---

## Arborescence produite

```
wiki/
  CONVENTIONS.md                       format et règles (Task 1)
  INDEX.md                             table des fiches (Task 1, mis à jour à chaque fiche)
  JOURNAL.md                           journal des statuts (Task 1)
  dragodindes/
    elevage-vue-d-ensemble.md          axe A (Task 2)
    objets-d-elevage.md                axe A (Task 3)
    jauges.md                          axe A (Task 4)
    reproduction.md                    axe A (Task 5)
    generations-et-couleurs.md         axe A (Task 6)
    capacites.md                       axe A (Task 7)
    certificats-et-hdv-montures.md     axe A (Task 8)
    astuce-parchemins.md               axe B (Task 9)
    rentabilite-multi-compte.md        axe C (Task 10)
    parcours-debutant.md               axe D (Task 11)
    modele-donnees.md                  axe E (Task 12)
    digest-debutant.md                 Task 13
```

## Règles communes à toutes les tâches de fiche (Tasks 2 à 11)

**Recherche.** Lancer les requêtes WebSearch listées dans la tâche. Ouvrir avec WebFetch au moins trois résultats datés 2025 ou 2026 et portant sur Dofus 3 (Unity). Prompt WebFetch type :

```
Extrais tout ce que cette page dit sur <sujet> : mécanique, chiffres exacts (durées, coûts,
seuils, pourcentages), version de Dofus concernée, date de publication ou de mise à jour.
Cite les phrases textuellement quand il y a un chiffre. Signale si la page parle de Dofus 2
ou de Dofus Retro plutôt que de Dofus 3.
```

**Sources interdites.** Tout domaine `dofusdb.fr`. Si un résultat pointe dessus, l'ignorer.

**Rédaction.** Respecter `wiki/CONVENTIONS.md` à la lettre : en-tête complet, cinq sections dans l'ordre, chaque ligne du tableau « Chiffres » cite le titre d'une source de l'en-tête. Statut `valide` seulement avec deux sources concordantes Dofus 3 ; sinon `hypothese`. Désaccord entre sources → dans « À challenger ».

**Contrôle de format** (commande à lancer sur chaque fiche, non committée, remplacer `<fiche>`) :

```bash
f=wiki/dragodindes/<fiche>.md
for k in titre slug statut confiance version_dofus derniere_verif sources tags; do grep -q "^$k:" "$f" || echo "MANQUE $k"; done
for s in "## En bref" "## Détails" "## Pièges fréquents" "## Chiffres" "## À challenger"; do grep -q "^$s$" "$f" || echo "MANQUE section $s"; done
grep -c "  - url: https://" "$f"
echo "statut: $(grep '^statut:' "$f")"
```

Attendu : aucune ligne `MANQUE`, un compte de sources ≥ 2 (≥ 3 si `confiance: haute`), et si `statut: valide` alors compte ≥ 2.

**INDEX.** Après chaque fiche, ajouter sa ligne dans le tableau de `wiki/INDEX.md` (voir Task 1 pour le format).

**Commit** après chaque fiche : `git add wiki/ && git commit -m "wiki(dragodindes): <slug>"`.

---

### Task 1 : cadre du wiki (CONVENTIONS, INDEX, JOURNAL)

**Files:**
- Create: `wiki/CONVENTIONS.md`
- Create: `wiki/INDEX.md`
- Create: `wiki/JOURNAL.md`

- [ ] **Step 1 : écrire `wiki/CONVENTIONS.md`**

Reprendre la section 2 du spec mot pour mot (gabarit d'en-tête, cinq sections, règles de statut et de confiance, règle « chiffre sans source n'entre pas », règle « jamais de suppression », format d'INDEX et de JOURNAL). Ajouter en tête :

```markdown
# Conventions du wiki

Ce wiki est lu par un joueur et par un LLM. Chaque fiche doit être compréhensible seule.
Langue : français. Nom de fichier : kebab-case, identique au `slug`.
```

- [ ] **Step 2 : écrire `wiki/INDEX.md`**

```markdown
# Index du wiki

| Fiche | Slug | Statut | Confiance | Dernière vérif |
|---|---|---|---|---|
```

- [ ] **Step 3 : écrire `wiki/JOURNAL.md`**

```markdown
# Journal des statuts

Une ligne par changement de statut : `AAAA-MM-JJ · slug · ancien → nouveau · raison`.
La création d'une fiche s'écrit `· (création) → hypothese · sources initiales`.

```

- [ ] **Step 4 : vérifier**

```bash
ls wiki/ && head -5 wiki/CONVENTIONS.md wiki/INDEX.md wiki/JOURNAL.md
```

Attendu : trois fichiers, titres présents.

- [ ] **Step 5 : commit**

```bash
git add wiki/ && git commit -m "wiki: conventions, index et journal"
```

---

### Task 2 : fiche `elevage-vue-d-ensemble`

**Files:** Create `wiki/dragodindes/elevage-vue-d-ensemble.md` ; Modify `wiki/INDEX.md`, `wiki/JOURNAL.md`

- [ ] **Step 1 : recherche**

WebSearch :
- `guide élevage dragodinde Dofus 3 débutant 2025`
- `Dofus Unity élevage dragodindes enclos public privé comment commencer`
- `dofus 3 élevage dragodinde étable enclos prix`

- [ ] **Step 2 : rédiger la fiche**

En-tête : `slug: elevage-vue-d-ensemble`, `tags: [dragodinde, elevage, debutant]`. Contenu attendu dans « Détails » : ce qu'est l'élevage en une phrase ; où on élève (enclos publics : où ils sont, limites ; enclos privés : comment on les obtient, ordre de prix ; étable : rôle, capacité) ; les prérequis (niveau, quête ou dragodinde de départ, kamas) ; le cycle complet en cinq étapes de la dragodinde achetée au bébé revendu.

- [ ] **Step 3 : contrôle de format** (commande commune, `<fiche>=elevage-vue-d-ensemble`)

- [ ] **Step 4 : INDEX + JOURNAL**

Ajouter la ligne INDEX `| Élevage : vue d'ensemble | elevage-vue-d-ensemble | <statut> | <confiance> | 2026-09-05 |` et la ligne JOURNAL de création.

- [ ] **Step 5 : commit** `wiki(dragodindes): elevage-vue-d-ensemble`

---

### Task 3 : fiche `objets-d-elevage`

**Files:** Create `wiki/dragodindes/objets-d-elevage.md` ; Modify INDEX, JOURNAL

- [ ] **Step 1 : recherche**

WebSearch :
- `objets d'élevage dragodinde liste effets Dofus 3`
- `abreuvoir mangeoire baffeur caresseur dragofesse foudroyeur Dofus élevage`
- `objets d'élevage usure durabilité dofus unity`

En complément, lister les objets via DofusDude : WebFetch `https://api.dofusdu.de/dofus3/v1/fr/items/resources/search?query=élevage&limit=50` avec le prompt `Liste les noms d'objets et leur type`. Ne sert qu'à vérifier les noms exacts.

- [ ] **Step 2 : rédiger la fiche**

`slug: objets-d-elevage`, `tags: [dragodinde, elevage, objets]`. « Détails » : une sous-section par famille d'objet (quelle jauge il fait monter ou descendre, où on l'achète ou le fabrique, ordre de prix, usure). « Chiffres » : tableau objet → jauge → effet par utilisation → durabilité.

- [ ] **Step 3 : contrôle de format**
- [ ] **Step 4 : INDEX + JOURNAL**
- [ ] **Step 5 : commit** `wiki(dragodindes): objets-d-elevage`

---

### Task 4 : fiche `jauges`

**Files:** Create `wiki/dragodindes/jauges.md` ; Modify INDEX, JOURNAL

- [ ] **Step 1 : recherche**

WebSearch :
- `dragodinde maturité énergie amour endurance sérénité explication`
- `dofus 3 dragodinde sérénité négative positive sexe bébé`
- `dragodinde fécondité amour endurance seuil reproduction 7500`

- [ ] **Step 2 : rédiger la fiche**

`slug: jauges`, `tags: [dragodinde, elevage, jauges]`. « Détails » : une sous-section par jauge : bornes, ce qui la fait monter et descendre, le seuil qui compte pour la reproduction, effet de la sérénité sur les autres jauges et sur le sexe du bébé. « Chiffres » : tableau jauge → min → max → seuil utile → source.

- [ ] **Step 3 : contrôle de format**
- [ ] **Step 4 : INDEX + JOURNAL**
- [ ] **Step 5 : commit** `wiki(dragodindes): jauges`

---

### Task 5 : fiche `reproduction`

**Files:** Create `wiki/dragodindes/reproduction.md` ; Modify INDEX, JOURNAL

- [ ] **Step 1 : recherche**

WebSearch :
- `dragodinde reproduction conditions gestation durée nombre de portées Dofus 3`
- `dofus dragodinde fécondité stérile nombre de reproductions max`
- `dragodinde gestation temps réel heures dofus unity`

- [ ] **Step 2 : rédiger la fiche**

`slug: reproduction`, `tags: [dragodinde, elevage, reproduction]`. « Détails » : conditions d'accouplement (jauges, maturité, fécondité, mâle et femelle dans le même enclos) ; durée de gestation en temps réel ; nombre de reproductions par dragodinde ; nombre de bébés par portée ; ce qui détermine la couleur et la génération du bébé (renvoyer vers `generations-et-couleurs`).

- [ ] **Step 3 : contrôle de format**
- [ ] **Step 4 : INDEX + JOURNAL**
- [ ] **Step 5 : commit** `wiki(dragodindes): reproduction`

---

### Task 6 : fiche `generations-et-couleurs`

**Files:** Create `wiki/dragodindes/generations-et-couleurs.md` ; Modify INDEX, JOURNAL

- [ ] **Step 1 : recherche**

WebSearch :
- `dragodinde générations 1 à 10 tableau couleurs croisements Dofus`
- `dofus 3 dragodinde bicolore obtention arbre généalogique pourcentage`
- `dragodinde prismatique génération 10 dofus unity`

- [ ] **Step 2 : rédiger la fiche**

`slug: generations-et-couleurs`, `tags: [dragodinde, elevage, generations]`. « Détails » : la table des dix générations avec les couleurs de chaque génération ; la règle d'obtention d'une couleur (parents, arbre généalogique, pourcentages) ; pourquoi les bicolores valent plus ; les générations réalistes pour un débutant. « Chiffres » : le tableau génération → couleurs → niveau requis pour monter.

- [ ] **Step 3 : contrôle de format**
- [ ] **Step 4 : INDEX + JOURNAL**
- [ ] **Step 5 : commit** `wiki(dragodindes): generations-et-couleurs`

---

### Task 7 : fiche `capacites`

**Files:** Create `wiki/dragodindes/capacites.md` ; Modify INDEX, JOURNAL

- [ ] **Step 1 : recherche**

WebSearch :
- `dragodinde capacités liste effets transmission Dofus 3`
- `dofus dragodinde capacité précoce infatigable reproductrice endurante`
- `dragodinde capacités valeur marché hdv 2025`

- [ ] **Step 2 : rédiger la fiche**

`slug: capacites`, `tags: [dragodinde, elevage, capacites]`. « Détails » : liste des capacités et leur effet ; règle de transmission aux bébés ; capacités négatives ; lesquelles font monter le prix et pourquoi.

- [ ] **Step 3 : contrôle de format**
- [ ] **Step 4 : INDEX + JOURNAL**
- [ ] **Step 5 : commit** `wiki(dragodindes): capacites`

---

### Task 8 : fiche `certificats-et-hdv-montures`

**Files:** Create `wiki/dragodindes/certificats-et-hdv-montures.md` ; Modify INDEX, JOURNAL

- [ ] **Step 1 : recherche**

WebSearch :
- `certificat de dragodinde validité échange étable Dofus 3`
- `hôtel de vente des montures dofus où vendre dragodinde`
- `dofus unity certificat dragodinde durée péremption`

- [ ] **Step 2 : rédiger la fiche**

`slug: certificats-et-hdv-montures`, `tags: [dragodinde, vente, certificat]`. « Détails » : comment obtenir un certificat, sa durée de validité, où l'échanger ; où est l'HDV des montures, frais de mise en vente, durées ; ce qui se voit sur la fiche d'une dragodinde en vente.

- [ ] **Step 3 : contrôle de format**
- [ ] **Step 4 : INDEX + JOURNAL**
- [ ] **Step 5 : commit** `wiki(dragodindes): certificats-et-hdv-montures`

---

### Task 9 : fiche `astuce-parchemins` (axe B, hypothèse du joueur)

**Files:** Create `wiki/dragodindes/astuce-parchemins.md` ; Modify INDEX, JOURNAL

- [ ] **Step 1 : recherche**

WebSearch :
- `dragodinde échange parchemin Dofus`
- `dofus dragodinde contre parchemin de caractéristique pnj`
- `dofus 3 dragodinde parchemin expérience monture`
- `farmer kamas dragodindes parchemins astuce 2025`

Ouvrir tout résultat qui décrit un échange dragodinde → parchemin. Si rien ne confirme en trois requêtes, élargir : `dofus monture échange pnj récompense`.

- [ ] **Step 2 : rédiger la fiche**

`slug: astuce-parchemins`, `tags: [dragodinde, kamas, hypothese]`. « En bref » commence par le verdict : **réel**, **réel mais dépassé**, ou **inexistant**. « Détails » : si réel, le chemin complet (quelle dragodinde, quel PNJ ou interface, quel parchemin, quel prix de revente, quel goulot) ; si inexistant, la mécanique réelle la plus proche que le joueur a pu confondre. « À challenger » : ce que le joueur devra vérifier en jeu.

Le statut reste `hypothese` tant que le joueur n'a pas confirmé en jeu, même avec deux sources.

- [ ] **Step 3 : contrôle de format**
- [ ] **Step 4 : INDEX + JOURNAL**
- [ ] **Step 5 : commit** `wiki(dragodindes): astuce-parchemins`

---

### Task 10 : fiche `rentabilite-multi-compte` (axe C)

**Files:** Create `wiki/dragodindes/rentabilite-multi-compte.md` ; Modify INDEX, JOURNAL

- [ ] **Step 1 : recherche**

WebSearch :
- `élevage dragodinde rentable 2025 kamas par semaine`
- `dofus 3 élevage dragodinde rentabilité serveur multi-compte`
- `dofus élevage dragodinde temps par jour combien de temps`
- `dofus 3 meilleures méthodes kamas 2026 joueur casual`

- [ ] **Step 2 : rédiger la fiche**

`slug: rentabilite-multi-compte`, `tags: [dragodinde, kamas, rentabilite]`. « Détails » : coût de démarrage détaillé (enclos, objets, premières montures) ; temps par session et cadence minimale ; kamas espérés par semaine, fourchette basse et haute, **avec la méthode d'estimation écrite** (par ex. « N bébés par semaine × prix médian observé dans le guide X ») ; les facteurs qui plombent en multi-compte ; deux ou trois alternatives citées par les guides pour un profil casual, en une ligne chacune.

- [ ] **Step 3 : contrôle de format**
- [ ] **Step 4 : INDEX + JOURNAL**
- [ ] **Step 5 : commit** `wiki(dragodindes): rentabilite-multi-compte`

---

### Task 11 : fiche `parcours-debutant` (axe D)

**Files:** Create `wiki/dragodindes/parcours-debutant.md` ; Modify INDEX, JOURNAL

- [ ] **Step 1 : recherche**

Pas de nouvelle recherche : la fiche se construit à partir des fiches des Tasks 2 à 10. Relire leurs « En bref » et « Pièges fréquents ».

- [ ] **Step 2 : rédiger la fiche**

`slug: parcours-debutant`, `tags: [dragodinde, elevage, debutant, parcours]`. « Détails » : prérequis vérifiables (niveau, kamas, quête) ; puis une liste numérotée « soir 1, soir 2, … » sur une semaine, chaque étape avec un lien vers la fiche qui l'explique (`[jauges](jauges.md)`) ; le premier objectif atteignable en une semaine, formulé de façon vérifiable (« un bébé de génération 1 né et mis en étable »). `sources` : reprendre les deux sources les plus citées par les fiches 2 à 10.

- [ ] **Step 3 : contrôle de format**
- [ ] **Step 4 : INDEX + JOURNAL**
- [ ] **Step 5 : commit** `wiki(dragodindes): parcours-debutant`

---

### Task 12 : `modele-donnees` (axe E, entrée de SP3)

**Files:** Create `wiki/dragodindes/modele-donnees.md` ; Modify INDEX, JOURNAL

Ce document suit le format de fiche (en-tête et cinq sections) pour rester parsable par l'app, mais « Détails » contient un tableau d'attributs.

- [ ] **Step 1 : rédiger la fiche**

`slug: modele-donnees`, `tags: [dragodinde, modele, sp3]`, `statut: hypothese` (il sera validé par SP3). « Détails » : un tableau

| Attribut | Type | Bornes / valeurs | Unité | Obligatoire | Fiche |
|---|---|---|---|---|---|

avec au minimum les lignes : nom, couleur(s), génération, sexe, niveau, maturité, énergie, amour, endurance, sérénité, fécondité, état (enclos / étable / certificat / en gestation / vendue), reproductions restantes, capacités, objectif visé, enclos d'appartenance, date de dernière mise à jour. Les bornes des jauges viennent de `jauges.md`, les générations de `generations-et-couleurs.md`, les capacités de `capacites.md`. Ajouter un second tableau pour l'objet « Prix observé » : objet ou monture, serveur, prix, date, source (HDV / joueur). `sources` : les mêmes que `jauges.md`.

- [ ] **Step 2 : contrôle de cohérence**

```bash
for slug in jauges generations-et-couleurs capacites; do grep -q "$slug" wiki/dragodindes/modele-donnees.md || echo "MANQUE renvoi $slug"; done
```

Attendu : aucune ligne `MANQUE`. Puis contrôle de format commun.

- [ ] **Step 3 : INDEX + JOURNAL**
- [ ] **Step 4 : commit** `wiki(dragodindes): modele-donnees`

---

### Task 13 : `digest-debutant`

**Files:** Create `wiki/dragodindes/digest-debutant.md` ; Modify INDEX, JOURNAL

- [ ] **Step 1 : rédiger la fiche**

`slug: digest-debutant`, `tags: [dragodinde, digest, debutant]`. « En bref » : trois phrases : ce qu'est l'élevage, est-ce que ça vaut le coup pour ce profil (reprendre le verdict de `rentabilite-multi-compte`), par quoi commencer. « Détails » : les « En bref » des fiches des Tasks 2 à 11 copiés dans cet ordre de lecture : vue d'ensemble → jauges → objets → reproduction → générations → capacités → certificats → astuce parchemins → rentabilité → parcours ; chaque bloc précédé de son titre en lien vers la fiche. « Pièges fréquents » : les cinq pièges les plus cités dans les autres fiches. « Chiffres » : les cinq chiffres qu'un débutant doit connaître, chacun avec sa fiche d'origine. « À challenger » : liste vide à remplir par le joueur (voir Task 15).

`sources` : les deux sources les plus citées dans les fiches. `statut: hypothese`.

- [ ] **Step 2 : contrôle**

Format commun, puis longueur : le digest doit se lire en moins de cinq minutes, soit environ 1 200 mots.

```bash
wc -w wiki/dragodindes/digest-debutant.md
```

Attendu : ≤ 1300 (en-tête compris).

- [ ] **Step 3 : INDEX + JOURNAL**
- [ ] **Step 4 : commit** `wiki(dragodindes): digest-debutant`

---

### Task 14 : vérification adversariale des sources

Spawn un subagent `cc-forge:verificateur` (model cuit dans la définition, ne pas passer `model:`). Il reçoit le spec SP1, `wiki/CONVENTIONS.md` et la liste des douze fiches. Il ne reçoit **pas** la narration des tâches précédentes.

- [ ] **Step 1 : prompt du subagent**

```
Tu audites un wiki markdown sur l'élevage de dragodindes (Dofus 3). Pour CHAQUE fiche de
wiki/dragodindes/ :
1. Vérifie le format contre wiki/CONVENTIONS.md (en-tête complet, cinq sections dans l'ordre).
2. Pour CHAQUE ligne du tableau « Chiffres », rouvre la source citée (WebFetch de l'URL de
   l'en-tête) et confirme que la page contient bien ce chiffre. Marque OK, ABSENT (la page ne
   le dit pas), CONTREDIT (la page dit autre chose), ou INACCESSIBLE.
3. Vérifie que toute fiche `statut: valide` a au moins deux sources datées 2025+ qui parlent
   de Dofus 3, pas de Dofus 2 ni Retro.
4. Signale toute URL en dofusdb.fr (interdite).
5. Vérifie que wiki/INDEX.md a exactement une ligne par fichier .md de wiki/dragodindes/.
Rends un rapport : tableau fiche · ligne Chiffres · verdict · citation de la page. Puis liste
des fiches dont le statut doit être rétrogradé et pourquoi. Ne corrige rien.
```

- [ ] **Step 2 : traiter le rapport**

Pour chaque ABSENT ou CONTREDIT : corriger le chiffre ou retirer la ligne, ou remplacer la source. Pour chaque fiche à rétrograder : passer en `hypothese`, ligne dans JOURNAL. Relancer le subagent une fois sur les seules fiches modifiées. **Cap : 2 passes.** Ce qui résiste après deux passes est consigné dans « À challenger » de la fiche et remonté au joueur.

- [ ] **Step 3 : contrôle final global**

```bash
n_files=$(ls wiki/dragodindes/*.md | wc -l); n_index=$(grep -c '^| .* | .* | .* | .* | 20' wiki/INDEX.md)
echo "fiches=$n_files index=$n_index"; [ "$n_files" = "$n_index" ] && echo OK || echo "INDEX DESYNC"
grep -rl "dofusdb.fr" wiki/ && echo "DOFUSDB PRESENT" || echo "dofusdb absent: OK"
```

Attendu : `OK` et `dofusdb absent: OK`.

- [ ] **Step 4 : commit** `wiki(dragodindes): corrections après vérification des sources`

---

### Task 15 : relecture par le joueur et clôture

- [ ] **Step 1 : présenter le digest au joueur**

Afficher le contenu de `digest-debutant.md` et poser via AskUserQuestion : (a) le verdict de l'astuce parchemins correspond-il à ce qu'il avait entendu ; (b) quels points il veut challenger en jeu ; (c) quels détails manquent pour qu'il se lance demain soir ; (d) veut-il pousser et ouvrir la PR.

- [ ] **Step 2 : consigner**

Chaque point à challenger va dans « À challenger » de la fiche concernée. Chaque détail manquant devient soit une correction immédiate, soit une ligne dans JOURNAL `· à creuser ·`.

- [ ] **Step 3 : commit, push, PR**

```bash
git add wiki/ && git commit -m "wiki(dragodindes): retours joueur sur le digest"
git push -u origin feature/dofus-progression-gains
gh pr create --title "SP1 : wiki élevage dragodindes" --body "<table claim | preuve | commande>"
```

Le corps de la PR contient la table `claim | preuve | commande` : nombre de fiches, résultat du contrôle global, résultat de la vérification adversariale (nombre de lignes OK / corrigées / restantes).

---

## Auto-revue du plan

- **Couverture du spec :** axe A → Tasks 2-8 ; axe B → Task 9 ; axe C → Task 10 ; axe D → Task 11 ; axe E → Task 12 ; digest → Task 13 ; CONVENTIONS/INDEX/JOURNAL → Task 1 ; critères d'acceptation (format, sourçage, verdict B, digest < 5 min, INDEX cohérent, relecture joueur) → Tasks 13-15. Hors périmètre respecté : aucun script committé, pas de fiche muldo.
- **Placeholders :** aucun ; chaque tâche a ses requêtes exactes et son contenu attendu.
- **Cohérence des noms :** les slugs de l'arborescence, des tâches, des renvois de Task 12 et de l'ordre de lecture de Task 13 sont identiques.
