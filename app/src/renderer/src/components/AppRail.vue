<script setup lang="ts">
import { BookOpen, Egg, Settings, User } from '@lucide/vue'

import RailLink from '@/components/RailLink.vue'
import { TooltipProvider } from '@/components/ui/tooltip'

const modules = [
  { to: '/wiki', label: 'Wiki', icon: BookOpen },
  { to: '/elevage', label: 'Élevage', icon: Egg },
] as const

const bottom = [
  { to: '/profil', label: 'Profil', icon: User },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
] as const
</script>

<template>
  <nav
    class="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar py-3"
    aria-label="Modules"
  >
    <TooltipProvider :delay-duration="300">
      <RailLink v-for="item in modules" :key="item.to" v-bind="item" />
      <div class="flex-1" />
      <RailLink v-for="item in bottom" :key="item.to" v-bind="item" />
    </TooltipProvider>
  </nav>
</template>
