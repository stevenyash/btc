<template>
  <q-btn
    v-if="showUpdateButton"
    round
    dense
    flat
    :icon="updateAvailable ? 'update' : 'check_circle'"
    :color="updateAvailable ? 'primary' : 'grey'"
    @click="checkForUpdates"
    class="version-checker"
  >
    <q-tooltip>
      {{ updateAvailable ? 'Update Available!' : 'Check for updates' }}
    </q-tooltip>

    <q-badge
      v-if="updateAvailable"
      color="red"
      floating
      rounded
    />
  </q-btn>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { manualUpdateCheck, isUpdateAvailable } from 'boot/version'

const $q = useQuasar()

const showUpdateButton = ref(false)
const updateAvailable = ref(false)

onMounted(() => {
  // Show in both dev and prod for testing
  showUpdateButton.value = true
  updateAvailable.value = isUpdateAvailable()

  // Listen for reload messages from service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'RELOAD_NOW') {
        window.location.reload()
      }
    })
  }
})

const checkForUpdates = async () => {
  try {
    await manualUpdateCheck()
    // Re-check if update is available after manual check
    updateAvailable.value = isUpdateAvailable()
  } catch (error) {
    console.error('Update check failed:', error)
  }
}
</script>

<style scoped>
.version-checker {
  position: relative;
}
</style>
