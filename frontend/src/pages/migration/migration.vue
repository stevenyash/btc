<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
<h4 class="text-h4 q-ma-none text-primary">Bunny.net Video Sync</h4>
<p class="text-subtitle1 text-grey-7">Sync videos from Bunny.net Storage and update database URLs</p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="refresh"
          label="Refresh Status"
          @click="loadSyncStatus"
          :loading="loading.status"
        />
      </div>
    </div>

    <!-- Status Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- S3 Videos -->
      <div class="col-12 col-md-4">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6">S3 Videos</div>
                <div class="text-subtitle2 text-grey-7">Bunny.net Storage</div>
              </div>
              <div class="col-auto">
                <q-icon name="cloud" size="lg" color="primary" />
              </div>
            </div>
            <div class="q-mt-sm">
<div class="text-h5">{{ syncStatus.totalVideosInBucket || 0 }}</div>
<div class="text-caption">Total videos in Bunny.net Storage</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Database Lessons -->
      <div class="col-12 col-md-4">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6">Database</div>
                <div class="text-subtitle2 text-grey-7">Synced Lessons</div>
              </div>
              <div class="col-auto">
                <q-icon name="storage" size="lg" color="green" />
              </div>
            </div>
            <div class="q-mt-sm">
              <div class="text-h5">{{ syncStatus.totalLessonsInDb || 0 }}</div>
              <div class="text-caption">Lessons in database</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- New Videos -->
      <div class="col-12 col-md-4">
        <q-card :class="(syncStatus.newVideosToSync || 0) > 0 ? 'bg-orange-1' : 'bg-teal-1'">
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6">New Videos</div>
                <div class="text-subtitle2 text-grey-7">To Sync</div>
              </div>
              <div class="col-auto">
                <q-icon
                  name="sync"
                  size="lg"
                  :color="(syncStatus.newVideosToSync || 0) > 0 ? 'orange' : 'teal'"
                />
              </div>
            </div>
            <div class="q-mt-sm">
              <div class="text-h5" :class="(syncStatus.newVideosToSync || 0) > 0 ? 'text-orange' : 'text-teal'">
                {{ syncStatus.newVideosToSync || 0 }}
              </div>
              <div class="text-caption">Videos not in database</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Sync Status Message -->
    <q-card v-if="!syncStatus.isSyncNeeded && syncStatus.totalVideosInBucket > 0" class="q-mb-lg" :class="isConsistent ? 'bg-green-1' : 'bg-orange-1'">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="col">
            <div class="row items-center">
              <q-icon :name="isConsistent ? 'check_circle' : 'warning'" :color="isConsistent ? 'green' : 'orange'" size="md" class="q-mr-sm" />
              <div class="text-h6" :class="isConsistent ? 'text-green' : 'text-orange'">
                {{ isConsistent ? 'All videos are synchronized!' : 'Database inconsistency detected!' }}
              </div>
            </div>
            <p class="q-mb-none q-mt-sm" :class="isConsistent ? 'text-grey-8' : 'text-grey-9'">
              <template v-if="isConsistent">
                Database is up to date with all {{ syncStatus.totalVideosInBucket }} videos from Bunny.net Storage.
              </template>
              <template v-else>
                Database has {{ syncStatus.totalLessonsInDb }} lessons but Bunny.net Storage only has {{ syncStatus.totalVideosInBucket }} videos.
                <strong>{{ syncStatus.totalLessonsInDb - syncStatus.totalVideosInBucket }} extra lessons</strong> in database need to be reviewed.
              </template>
            </p>
          </div>
          <div class="col-auto" v-if="!isConsistent">
            <q-btn
              color="orange"
              icon="sync"
              label="Force Sync"
              @click="forceSync"
              :loading="loading.forceSync"
              unelevated
            >
              <q-tooltip>Update database to match Bunny.net Storage videos</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Sync Actions -->
    <q-card v-if="syncStatus.isSyncNeeded" class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 text-orange">
          <q-icon name="warning" color="orange" class="q-mr-sm" />
          New Videos Detected
        </div>
        <p class="text-grey-7">
          Found {{ syncStatus.newVideosToSync }} new videos in Bunny.net Storage that need to be synced to the database.
        </p>

        <!-- Folder Selection -->
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="selectedFolder"
              :options="availableFolders"
              label="Sync specific folder (optional)"
              hint="Leave empty to sync all new videos"
              clearable
              outlined
              emit-value
              map-options
            >
              <template v-slot:prepend>
                <q-icon name="folder" />
              </template>
            </q-select>
          </div>
          <div class="col-12 col-md-6 flex items-end">
            <q-btn
              color="primary"
              icon="sync"
              label="Sync Videos to Database"
              class="full-width"
              size="lg"
              @click="syncVideos"
              :loading="loading.sync"
              unelevated
            />
          </div>
        </div>

        <!-- Folder Breakdown -->
        <div v-if="syncStatus.newVideosByFolder && Object.keys(syncStatus.newVideosByFolder).length" class="q-mt-md">
          <div class="text-subtitle2 text-weight-medium q-mb-sm">New videos by folder:</div>
          <div class="row q-col-gutter-xs">
            <div
              v-for="(count, folder) in syncStatus.newVideosByFolder"
              :key="folder"
              class="col-auto"
            >
              <q-chip
                color="orange"
                text-color="white"
                icon="folder"
                :label="`${folder}: ${count}`"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Sync Progress -->
    <q-card v-if="syncProgress.active" class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="sync" class="q-mr-sm" />
          Syncing Videos...
        </div>

        <q-linear-progress
          :value="syncProgress.percentage / 100"
          color="primary"
          size="20px"
          class="q-mb-md"
        >
          <div class="absolute-full flex flex-center">
            <q-badge color="white" text-color="primary" :label="`${syncProgress.percentage}%`" />
          </div>
        </q-linear-progress>

        <div class="text-body2 text-grey-7">
          {{ syncProgress.message }}
        </div>
      </q-card-section>
    </q-card>

    <!-- Sync Results -->
    <q-card v-if="syncResults" class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 text-green q-mb-md">
          <q-icon name="check_circle" class="q-mr-sm" />
          Sync Completed Successfully!
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <div class="text-h4 text-primary">{{ syncResults.scanned || 0 }}</div>
                <div class="text-caption">Videos Scanned</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <div class="text-h4 text-orange">{{ syncResults.newVideos || 0 }}</div>
                <div class="text-caption">New Videos Found</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <div class="text-h4 text-green">{{ syncResults.synced || syncResults.created || 0 }}</div>
                <div class="text-caption">Successfully Synced</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <div class="text-h4" :class="syncResults.removed > 0 ? 'text-orange' : 'text-grey'">
                  {{ syncResults.removed || 0 }}
                </div>
                <div class="text-caption">Orphaned Removed</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3" v-if="syncResults.failed > 0">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <div class="text-h4 text-red">{{ syncResults.failed || 0 }}</div>
                <div class="text-caption">Failed</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div class="q-mt-md text-center">
          <q-btn
            color="primary"
            label="Sync More Videos"
            @click="resetResults"
            flat
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Available Folders -->
    <q-card v-if="availableFolders.length > 0" class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-sm">Available Folders in Bunny.net Storage</div>
        <p class="text-grey-7 q-mb-md">{{ availableFolders.length }} folders found in Bunny.net Storage bucket</p>

        <div class="row q-col-gutter-sm">
          <div
            v-for="folder in availableFolders"
            :key="folder"
            class="col-auto"
          >
            <q-chip
              color="primary"
              text-color="white"
              icon="folder"
              clickable
              @click="selectFolder(folder)"
            >
              {{ folder }}
            </q-chip>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Help Section -->
    <q-card class="bg-blue-1">
      <q-card-section>
        <div class="text-h6 q-mb-sm">
          <q-icon name="help" class="q-mr-sm" />
          How Video Sync Works
        </div>
        <q-list>
          <q-item>
            <q-item-section avatar>
              <q-icon color="primary" name="looks_one" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Scans AWS S3 bucket for video files</q-item-label>
              <q-item-label caption>Checks the Africa region bucket for all video files</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon color="primary" name="looks_two" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Compares with database records</q-item-label>
              <q-item-label caption>Identifies videos that don't have database entries</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon color="primary" name="looks_3" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Creates lesson entries</q-item-label>
              <q-item-label caption>Automatically creates database records with proper URLs</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon color="primary" name="looks_4" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Updates CloudFront URLs</q-item-label>
              <q-item-label caption>Sets up CDN URLs for fast video delivery</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ApiService } from 'src/services/api'
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'

export default {
  name: 'MigrationPage',

  setup() {
    const $q = useQuasar()

    // Reactive data
    const syncStatus = ref({
      totalVideosInBucket: 0,
      totalLessonsInDb: 0,
      newVideosToSync: 0,
      newVideosByFolder: {},
      isSyncNeeded: false
    })

    const loading = ref({
      status: false,
      sync: false,
      forceSync: false
    })

    const syncProgress = ref({
      active: false,
      percentage: 0,
      message: ''
    })

    const syncResults = ref(null)
    const availableFolders = ref([])
    const selectedFolder = ref(null)

    // Computed
    const isConsistent = computed(() => {
      return syncStatus.value.totalVideosInBucket === syncStatus.value.totalLessonsInDb
    })

    // Methods
    const loadSyncStatus = async () => {
      loading.value.status = true
      try {
        const response = await ApiService.get('migrationroutes/syncstatus')
        syncStatus.value = response.data.data

        $q.notify({
          type: 'positive',
          message: 'Status updated successfully',
          position: 'top'
        })
      } catch (error) {
        console.error('Error loading sync status:', error)
        $q.notify({
          type: 'negative',
          message: 'Failed to load sync status',
          caption: error.response?.data?.message || error.message,
          position: 'top'
        })
      } finally {
        loading.value.status = false
      }
    }

    const loadAvailableFolders = async () => {
      try {
        const response = await ApiService.get('migrationroutes/syncfolders')
        availableFolders.value = response.data.data.folders || []
      } catch (error) {
        console.error('Error loading folders:', error)
      }
    }

    const syncVideos = async () => {
      loading.value.sync = true
      syncProgress.value = {
        active: true,
        percentage: 10,
        message: 'Starting video sync...'
      }

      try {
        // Update progress
        syncProgress.value.percentage = 30
        syncProgress.value.message = 'Scanning Bunny.net Storage bucket...'

        const payload = selectedFolder.value ? { folder: selectedFolder.value } : {}

        syncProgress.value.percentage = 50
        syncProgress.value.message = 'Syncing videos to database...'

        const response = await ApiService.post('migrationroutes/syncvideos', payload)

        syncProgress.value.percentage = 100
        syncProgress.value.message = 'Sync completed!'

        // Show results
        syncResults.value = response.data.data

        $q.notify({
          type: 'positive',
          message: response.data.message,
          caption: `Synced ${response.data.data?.created || response.data.data?.synced || 0} new videos`,
          timeout: 5000,
          position: 'top'
        })

        // Reload status
        await loadSyncStatus()

      } catch (error) {
        console.error('Video sync error:', error)
        $q.notify({
          type: 'negative',
          message: 'Video sync failed',
          caption: error.response?.data?.message || error.message,
          timeout: 5000,
          position: 'top'
        })
      } finally {
        loading.value.sync = false
        setTimeout(() => {
          syncProgress.value.active = false
        }, 1000)
        selectedFolder.value = null
      }
    }

    const selectFolder = (folder) => {
      selectedFolder.value = folder
      $q.notify({
        type: 'info',
        message: `Selected folder: ${folder}`,
        caption: 'Click "Sync Videos to Database" to sync this folder',
        position: 'top'
      })
    }

    const resetResults = () => {
      syncResults.value = null
      loadSyncStatus()
    }

    const forceSync = async () => {
      const confirmed = await new Promise((resolve) => {
        $q.dialog({
          title: 'Force Sync Confirmation',
          message: `This will update the database to match Bunny.net Storage. Database has ${syncStatus.value.totalLessonsInDb} lessons but Bunny.net Storage has ${syncStatus.value.totalVideosInBucket} videos. This will remove ${syncStatus.value.totalLessonsInDb - syncStatus.value.totalVideosInBucket} orphaned lessons without Bunny.net Storage files. Continue?`,
          cancel: true,
          persistent: true,
          ok: {
            label: 'Yes, Force Sync',
            color: 'orange'
          },
          cancel: {
            label: 'Cancel',
            color: 'grey'
          }
        }).onOk(() => resolve(true))
          .onCancel(() => resolve(false))
      })

      if (!confirmed) return

      loading.value.forceSync = true
      syncProgress.value = {
        active: true,
        percentage: 10,
        message: 'Starting force sync...'
      }

      try {
        syncProgress.value.percentage = 30
        syncProgress.value.message = 'Scanning S3 and database...'

        // Call the full sync endpoint (adds new + removes orphaned)
        const response = await ApiService.post('migrationroutes/fullsync', {})

        syncProgress.value.percentage = 80
        syncProgress.value.message = 'Cleaning up orphaned lessons...'

        await new Promise(resolve => setTimeout(resolve, 500))

        syncProgress.value.percentage = 100
        syncProgress.value.message = 'Force sync completed!'

        const data = response.data.data

        // Format results for display
        syncResults.value = {
          scanned: data.finalStatus?.totalVideosInBucket || 0,
          newVideos: data.sync?.data?.newVideos || data.sync?.newVideos || 0,
          synced: data.sync?.data?.synced || data.sync?.synced || 0,
          created: data.sync?.data?.synced || data.sync?.synced || 0,
          failed: data.sync?.data?.failed || data.sync?.failed || 0,
          removed: data.cleanup?.removed || 0
        }

        $q.notify({
          type: 'positive',
          message: 'Force sync completed successfully',
          caption: `Added ${syncResults.value.synced} new lessons, removed ${syncResults.value.removed} orphaned lessons`,
          timeout: 5000,
          position: 'top'
        })

        // Reload status
        await loadSyncStatus()

      } catch (error) {
        console.error('Force sync error:', error)
        $q.notify({
          type: 'negative',
          message: 'Force sync failed',
          caption: error.response?.data?.message || error.message,
          timeout: 5000,
          position: 'top'
        })
      } finally {
        loading.value.forceSync = false
        setTimeout(() => {
          syncProgress.value.active = false
        }, 1000)
      }
    }

    // Lifecycle
    onMounted(() => {
      loadSyncStatus()
      loadAvailableFolders()
    })

    return {
      syncStatus,
      loading,
      syncProgress,
      syncResults,
      availableFolders,
      selectedFolder,
      isConsistent,
      loadSyncStatus,
      syncVideos,
      selectFolder,
      resetResults,
      forceSync
    }
  }
}
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
