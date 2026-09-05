<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import { computed } from 'vue'

import StatutBadge from '@/components/StatutBadge.vue'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { renderMarkdown } from '@/lib/wiki-index'
import { SECTION_TITLES } from '@shared/wiki/parse-fiche'

import type { Fiche, SectionTitle } from '@shared/wiki/parse-fiche'

const props = defineProps<{ fiche: Fiche }>()

const DETAIL_SECTIONS: readonly SectionTitle[] = SECTION_TITLES.filter(
  (title) => title !== 'En bref',
)

const enBref = computed(() => renderMarkdown(props.fiche.sections['En bref']))

const details = computed(() =>
  DETAIL_SECTIONS.map((title) => {
    const source = props.fiche.sections[title]
    return { title, html: renderMarkdown(source), empty: source.trim() === '' }
  }),
)

const verifiedLabel = computed(() => {
  const [year, month, day] = props.fiche.derniereVerif.split('-', 3)
  return year !== undefined && month !== undefined && day !== undefined
    ? `${day}/${month}/${year}`
    : props.fiche.derniereVerif
})

function openSource(url: string): void {
  void window.anka.app.openExternal(url)
}
</script>

<template>
  <ScrollArea class="h-full min-w-0 flex-1">
    <article class="mx-auto max-w-3xl px-8 py-6">
      <header class="mb-6">
        <h1 class="text-2xl font-semibold tracking-tight">{{ fiche.titre }}</h1>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <StatutBadge :statut="fiche.statut" />
          <Badge variant="outline">confiance {{ fiche.confiance }}</Badge>
          <Badge variant="outline">Dofus {{ fiche.versionDofus }}</Badge>
          <span>vérifiée le {{ verifiedLabel }}</span>
        </div>
        <ul v-if="fiche.sources.length > 0" class="mt-3 flex flex-col gap-1 text-sm">
          <li v-for="source in fiche.sources" :key="source.url" class="flex items-baseline gap-1">
            <Button variant="link" class="h-auto p-0 text-left" @click="openSource(source.url)">
              <ExternalLink class="mr-1 size-3.5" aria-hidden="true" />
              {{ source.titre }}
            </Button>
            <span class="text-muted-foreground">· {{ source.date }}</span>
          </li>
        </ul>
      </header>

      <Card class="border-primary/30">
        <CardHeader>
          <CardTitle>En bref</CardTitle>
        </CardHeader>
        <CardContent>
          <!-- eslint-disable-next-line vue/no-v-html -- HTML produit par markdown-it avec html:false : le brut est échappé -->
          <div class="fiche-prose" v-html="enBref" />
        </CardContent>
      </Card>

      <Separator class="my-6" />

      <Accordion type="multiple" class="w-full">
        <AccordionItem v-for="section in details" :key="section.title" :value="section.title">
          <AccordionTrigger>
            <span>
              {{ section.title }}
              <span v-if="section.empty" class="ml-2 text-xs text-muted-foreground">(vide)</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <!-- v-html direct sur <AccordionContent> atterrirait, via le fallthrough des
                 attributs, sur le wrapper toujours monté (masqué par `hidden`) plutôt que sur
                 le contenu conditionné par l'ouverture : on le pose ici, sur un enfant réel. -->
            <!-- eslint-disable-next-line vue/no-v-html -- même raison que ci-dessus -->
            <div class="fiche-prose" v-html="section.html" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </article>
  </ScrollArea>
</template>
