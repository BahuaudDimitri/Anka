<script setup lang="ts">
import { Badge } from '@/components/ui/badge'

import type { FicheStatut } from '@shared/wiki/parse-fiche'

defineProps<{ statut: FicheStatut }>()

const LABELS: Record<FicheStatut, string> = {
  valide: 'validé',
  hypothese: 'hypothèse',
  obsolete: 'obsolète',
}

// Tokens sémantiques du thème (main.css), pas de palette brute.
const CLASSES: Record<FicheStatut, string> = {
  valide: 'bg-status-valide text-status-valide-foreground border-transparent',
  hypothese: 'bg-status-hypothese text-status-hypothese-foreground border-transparent',
  obsolete: 'bg-status-obsolete text-status-obsolete-foreground border-transparent',
}
</script>

<template>
  <Badge variant="outline" :class="CLASSES[statut]">{{ LABELS[statut] }}</Badge>
</template>
