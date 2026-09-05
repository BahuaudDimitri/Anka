<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useTheme } from '@/composables/use-theme'
import { errorMessage } from '@/lib/error-message'
import { useProfileStore } from '@/stores/profile'
import { useUpdaterStore } from '@/stores/updater'

import type { ThemeMode } from '@/composables/use-theme'

const REPO_URL = 'https://github.com/BahuaudDimitri/Anka'
const DOFUSDUDE_URL = 'https://docs.dofusdu.de/'

const theme = useTheme()
const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Clair' },
  { value: 'auto', label: 'Comme Windows' },
]

const profile = useProfileStore()
const updater = useUpdaterStore()
const version = ref('…')
const isBusy = ref(false)

onMounted(async () => {
  version.value = await window.anka.app.version()
})

const updateLabel = computed(() => {
  const state = updater.state
  switch (state.status) {
    case 'idle': {
      return 'Aucune vérification effectuée.'
    }
    case 'checking': {
      return 'Vérification en cours…'
    }
    case 'available': {
      return `Version ${state.version} disponible, téléchargement en cours…`
    }
    case 'downloading': {
      return `Téléchargement : ${String(state.percent)} %`
    }
    case 'ready': {
      return `Version ${state.version} téléchargée, prête à installer.`
    }
    case 'up-to-date': {
      return 'Anka est à jour.'
    }
    case 'unavailable': {
      return state.message
    }
    case 'error': {
      return `Erreur : ${state.message}`
    }
  }
})

async function exportAll(): Promise<void> {
  isBusy.value = true
  try {
    const result = await window.anka.transfer.exportAll()
    if (result.ok) toast.success('Export enregistré', { description: result.path })
  } catch (error) {
    toast.error('Export impossible', { description: errorMessage(error) })
  } finally {
    isBusy.value = false
  }
}

async function importAll(): Promise<void> {
  isBusy.value = true
  try {
    const result = await window.anka.transfer.importAll()
    if (result.ok) {
      await profile.load()
      toast.success('Import terminé', { description: result.path })
    } else if (result.reason === 'invalid') {
      toast.error('Import refusé, rien n’a été modifié', { description: result.details })
    }
  } catch (error) {
    toast.error('Import impossible', { description: errorMessage(error) })
  } finally {
    isBusy.value = false
  }
}

function openExternal(url: string): void {
  void window.anka.app.openExternal(url)
}
</script>

<template>
  <section class="flex-1 overflow-auto p-8">
    <div class="flex max-w-xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            :model-value="theme"
            class="flex gap-6"
            @update:model-value="(value) => (theme = value as ThemeMode)"
          >
            <div v-for="option in themeOptions" :key="option.value" class="flex items-center gap-2">
              <RadioGroupItem :id="`theme-${option.value}`" :value="option.value" />
              <Label :for="`theme-${option.value}`">{{ option.label }}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Données</CardTitle>
          <CardDescription>
            Tes données restent sur cet ordinateur. L'export produit un fichier JSON que l'import
            relit intégralement.
          </CardDescription>
        </CardHeader>
        <CardContent class="flex gap-2">
          <Button :disabled="isBusy" @click="() => void exportAll()">Exporter…</Button>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="outline" :disabled="isBusy">Importer…</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remplacer les données actuelles ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Le fichier choisi remplacera le profil enregistré. Un fichier invalide est refusé
                  et ne modifie rien.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction @click="() => void importAll()"
                  >Choisir un fichier</AlertDialogAction
                >
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mise à jour</CardTitle>
          <CardDescription>Anka {{ version }}</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <p class="text-sm" role="status">{{ updateLabel }}</p>
          <div class="flex gap-2">
            <Button
              variant="outline"
              :disabled="
                updater.state.status === 'checking' || updater.state.status === 'downloading'
              "
              @click="() => void updater.check()"
            >
              Vérifier
            </Button>
            <Button
              v-if="updater.state.status === 'ready'"
              @click="() => void updater.quitAndInstall()"
            >
              Redémarrer pour installer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col items-start gap-1 text-sm">
          <Button variant="link" class="h-auto p-0" @click="openExternal(REPO_URL)">
            Code source et versions (GitHub)
          </Button>
          <Button variant="link" class="h-auto p-0" @click="openExternal(DOFUSDUDE_URL)">
            Données statiques du jeu : DofusDude
          </Button>
          <p class="text-muted-foreground">
            Dofus est une marque d'Ankama. Anka n'est pas affilié à Ankama.
          </p>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
