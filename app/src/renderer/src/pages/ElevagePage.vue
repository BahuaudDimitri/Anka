<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
</script>

<template>
  <section class="flex-1 overflow-auto p-8">
    <Card class="max-w-xl">
      <CardHeader>
        <CardTitle>Suivi d'élevage</CardTitle>
        <CardDescription>
          L'écran de suivi (dragodindes, jauges, parcours cochable) arrive avec le sous-projet SP3.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button as-child variant="secondary">
          <RouterLink to="/wiki/parcours-debutant"
            >Lire le parcours débutant en attendant</RouterLink
          >
        </Button>
      </CardContent>
    </Card>
  </section>
</template>
