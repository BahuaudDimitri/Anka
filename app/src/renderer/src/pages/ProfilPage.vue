<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorMessage } from '@/lib/error-message'
import { useProfileStore } from '@/stores/profile'

const store = useProfileStore()
const serveur = ref('')
const pseudo = ref('')
const isSaving = ref(false)

function resetForm(): void {
  serveur.value = store.profile.serveur
  pseudo.value = store.profile.pseudo
}

onMounted(async () => {
  if (!store.loaded) await store.load()
  if (store.loadError !== null) {
    toast.error('Profil illisible', { description: store.loadError })
  }
  resetForm()
})

watch(() => store.profile, resetForm)

const isDirty = computed(
  () =>
    serveur.value.trim() !== store.profile.serveur || pseudo.value.trim() !== store.profile.pseudo,
)

async function save(): Promise<void> {
  isSaving.value = true
  try {
    await store.save({ serveur: serveur.value.trim(), pseudo: pseudo.value.trim() })
    toast.success('Profil enregistré')
  } catch (error) {
    toast.error('Enregistrement impossible', { description: errorMessage(error) })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section class="flex-1 overflow-auto p-8">
    <Card class="max-w-xl">
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>
          Le serveur sert à taguer les prix que tu saisiras dans les prochains modules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="flex flex-col gap-4" @submit.prevent="() => void save()">
          <div class="grid gap-2">
            <Label for="serveur">Serveur de jeu</Label>
            <Input id="serveur" v-model="serveur" maxlength="60" placeholder="ex. Draconiros" />
          </div>
          <div class="grid gap-2">
            <Label for="pseudo">Pseudo (facultatif)</Label>
            <Input id="pseudo" v-model="pseudo" maxlength="40" />
          </div>
          <div class="flex gap-2">
            <Button type="submit" :disabled="!isDirty || isSaving">Enregistrer</Button>
            <Button type="button" variant="ghost" :disabled="!isDirty" @click="resetForm"
              >Annuler</Button
            >
          </div>
        </form>
      </CardContent>
    </Card>
  </section>
</template>
