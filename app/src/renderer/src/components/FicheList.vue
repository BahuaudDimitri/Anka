<script setup lang="ts">
import { computed } from 'vue'

import StatutBadge from '@/components/StatutBadge.vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { dossiers, fichesDuDossier } from '@/lib/wiki-index'

defineProps<{ activeSlug: string }>()

const groups = computed(() =>
  dossiers.map((dossier) => ({ dossier, fiches: fichesDuDossier(dossier) })),
)
</script>

<template>
  <aside
    class="w-72 shrink-0 border-r border-sidebar-border bg-sidebar"
    aria-label="Fiches du wiki"
  >
    <ScrollArea class="h-full">
      <nav class="flex flex-col gap-5 p-3">
        <section v-for="group in groups" :key="group.dossier">
          <h2 class="mb-1 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {{ group.dossier }}
          </h2>
          <ul class="flex flex-col gap-0.5">
            <li v-for="fiche in group.fiches" :key="fiche.slug">
              <RouterLink
                :to="`/wiki/${fiche.slug}`"
                :class="
                  cn(
                    'flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent',
                    fiche.slug === activeSlug && 'bg-sidebar-accent font-medium',
                  )
                "
                :aria-current="fiche.slug === activeSlug ? 'page' : undefined"
              >
                <span class="truncate">{{ fiche.titre }}</span>
                <StatutBadge :statut="fiche.statut" class="shrink-0" />
              </RouterLink>
            </li>
          </ul>
        </section>
      </nav>
    </ScrollArea>
  </aside>
</template>
