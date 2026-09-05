<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const version = ref('…')
onMounted(async () => {
  version.value = await window.anka.app.version()
})
</script>

<template>
  <main
    class="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground"
  >
    <h1 class="text-2xl font-semibold">Anka</h1>
    <Badge variant="secondary">version {{ version }}</Badge>
    <Button>shadcn-vue fonctionne</Button>
  </main>
</template>
