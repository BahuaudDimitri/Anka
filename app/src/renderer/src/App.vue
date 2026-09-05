<script setup lang="ts">
import AppRail from '@/components/AppRail.vue'
import { Toaster } from '@/components/ui/sonner'
import { useTheme } from '@/composables/use-theme'

// Pose la classe dark/light sur <html> dès le montage et la maintient.
useTheme()
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
