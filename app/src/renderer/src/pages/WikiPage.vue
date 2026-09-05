<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import FicheList from '@/components/FicheList.vue'
import FicheReader from '@/components/FicheReader.vue'
import { DEFAULT_SLUG, findFiche } from '@/lib/wiki-index'

const props = defineProps<{ slug?: string }>()

const router = useRouter()
const fiche = computed(() => findFiche(props.slug ?? DEFAULT_SLUG))

// Slug inconnu ou absent : on retombe sur le digest.
watchEffect(() => {
  if (fiche.value === undefined) void router.replace(`/wiki/${DEFAULT_SLUG}`)
})
</script>

<template>
  <div class="flex min-w-0 flex-1">
    <FicheList :active-slug="fiche?.slug ?? DEFAULT_SLUG" />
    <FicheReader v-if="fiche" :key="fiche.slug" :fiche="fiche" />
  </div>
</template>
