<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { toast } from 'vue-sonner'

import AppRail from '@/components/AppRail.vue'
import { Toaster } from '@/components/ui/sonner'
import { useTheme } from '@/composables/use-theme'
import { useUpdaterStore } from '@/stores/updater'

// Pose la classe dark/light sur <html> dès le montage et la maintient.
useTheme()

const updater = useUpdaterStore()
onMounted(() => {
  void updater.start()
})

watch(
  () => updater.state,
  (state) => {
    if (state.status === 'ready') {
      toast.info(`Version ${state.version} prête`, {
        description: 'Elle s’installera à la fermeture, ou tout de suite si tu redémarres.',
        action: { label: 'Redémarrer', onClick: () => void updater.quitAndInstall() },
        duration: 15_000,
      })
    }
  },
)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background text-foreground">
    <AppRail />
    <div class="flex min-w-0 flex-1">
      <RouterView />
    </div>
    <Toaster position="bottom-right" rich-colors />
  </div>
</template>
