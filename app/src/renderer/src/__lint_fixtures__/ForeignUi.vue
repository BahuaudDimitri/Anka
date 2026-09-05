<script setup lang="ts">
import { NButton } from 'naive-ui'
import PrimeButton from 'primevue/button'

const components = [NButton, PrimeButton]
</script>

<template>
  <p>{{ components.length }}</p>
</template>
