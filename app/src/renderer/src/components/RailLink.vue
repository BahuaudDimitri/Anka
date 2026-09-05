<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import type { Component } from 'vue'

const props = defineProps<{ to: string; label: string; icon: Component }>()

const route = useRoute()
const active = computed(() => route.path === props.to || route.path.startsWith(`${props.to}/`))
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <Button
        as-child
        :variant="active ? 'secondary' : 'ghost'"
        size="icon"
        :aria-label="label"
        :aria-current="active ? 'page' : undefined"
      >
        <RouterLink :to="to">
          <component :is="icon" class="size-5" aria-hidden="true" />
        </RouterLink>
      </Button>
    </TooltipTrigger>
    <TooltipContent side="right">{{ label }}</TooltipContent>
  </Tooltip>
</template>
