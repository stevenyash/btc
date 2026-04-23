<!-- src/components/MigrationDashboard.vue -->
<template>
  <q-page class="q-pa-lg">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <h4 class="text-h4 q-ma-none text-primary">Migration Dashboard</h4>
        <p class="text-subtitle1 text-grey-7">Migrate Bunny.net files and populate database</p>
      </div>
      <div class="col-auto">
        <q-btn
            color="primary"
            icon="refresh"
            label="Refresh Status"
            @click="loadStatus"
            :loading="loading.status"
        />
      </div>
    </div>

    <!-- Status Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- Bunny.net Storage Status -->
      <div class="col-12 col-md-4">
        <q-card class="bg-blue-1">
          <q-card-section>
            <div class="row items-center">
              <div class="col">
<div class="text-h6">Bunny.net Files</div>
<div class="text-subtitle2 text-grey-7">Source → Destination</div>
              </div>
              <div class="col-auto">
                <q-icon name="cloud_upload" size="lg" color="primary" />
              </div>
            </div>
            <div class="q-mt-sm">
              <div class="text-h5">{{ status.s3?.filesToMigrate || 0 }} files</div>
              <div class="text-caption">{{ status.s3?.estimatedSize || '0 MB' }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Database Status -->
      <div class="col-12 col-md-4">
        <q-card class="bg-green-1">
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6">Database</div>
                <div class="text-subtitle2 text-grey-7">Lessons & Hierarchy</div>
              </div>
              <div class="col-auto">
                <q-icon name="storage" size="lg" color="green" />
              </div>
            </div>
            <div class="q-mt-sm">
              <div class="text-h5">{{ status.database?.lessons || 0 }} lessons</div>
              <div class="text-caption">{{ status.database?.areas || 0 }} learning areas</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- CloudFront Status -->
      <div class="col-12 col-md-4">
        <q-card :class="status.cloudFront ? 'bg-teal-1' : 'bg-orange-1'">
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6">CloudFront</div>
                <div class="text-subtitle2 text-grey-7">CDN Distribution</div>
              </div>
              <div class="col-auto">
                <q-icon name="dns" size="lg" :color="status.cloudFront ? 'teal' : 'orange'" />
              </div>
            </div>
            <div class="q-mt-sm">
              <div class="text-h6 text-weight-medium">
                {{ status.cloudFront ? 'Configured' : 'Not Setup' }}
              </div>
              <div class="text-caption text-ellipsis" v-if="status.cloudFront">
                {{ status.cloudFront }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Action Buttons -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6">Migration Actions</div>
        <p class="text-grey-7">Choose what to migrate</p>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-4">
            <q-btn
                color="primary"
                icon="cloud_upload"
                label="Migrate Files Only"
                class="full-width"
                @click="migrateFiles"
                :loading="loading.files"
                :disable="!status.readyForMigration"
            >
              <q-tooltip v-if="!status.readyForMigration">
                No files found to migrate
              </q-tooltip>
            </q-btn>
          </div>

          <div class="col-12 col-md-4">
            <q-btn
                color="green"
                icon="storage"
                label="Populate Database Only"
                class="full-width"
                @click="populateDatabase"
                :loading="loading.database"
            />
          </div>

          <div class="col-12 col-md-4">
            <q-btn
                color="purple"
                icon="rocket_launch"
                label="Complete Migration"
                class="full-width"
                @click="completeMigration"
                :loading="loading.complete"
                :disable="!status.readyForMigration"
            >
              <q-tooltip v-if="!status.readyForMigration">
                No files found to migrate
              </q-tooltip>
            </q-btn>
          </div>
        </div>

        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-12 col-md-6">
            <q-btn
                color="teal"
                icon="dns"
                label="Setup CloudFront"
                class="full-width"
                @click="setupCloudFront"
                :loading="loading.cloudfront"
            />
          </div>

          <div class="col-12 col-md-6">
            <q-btn
                color="orange"
                icon="verified"
                label="Verify Migration"
                class="full-width"
                @click="verifyMigration"
                :loading="loading.verify"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Video Sync Section -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="row items-center">
          <div class="col">
            <div class="text-h6">Video Sync Status</div>
            <div class="text-grey-7">Africa Bucket ↔ Database</div>
          </div>
          <div class="col-auto">
            <q-btn
                icon="refresh"
                color="primary"
                flat
                round
                @click="loadSyncStatus"
                :loading="loading.syncStatus"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-md-4">
            <div class="text-center">
              <div class="text-h4 text-primary">{{ syncStatus.totalVideosInBucket || 0 }}</div>
              <div class="text-caption">Videos in Africa Bucket</div>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div class="text-center">
              <div class="text-h4 text-green">{{ syncStatus.totalLessonsInDb || 0 }}</div>
              <div class="text-caption">Lessons in Database</div>
            </div>
          </div>
          <div class="col-12 col-md-4">
            <div class="text-center">
              <div class="text-h4" :class="(syncStatus.newVideosToSync || 0) > 0 ? 'text-orange' : 'text-green'">
                {{ syncStatus.newVideosToSync || 0 }}
              </div>
              <div class="text-caption">New Videos to Sync</div>
            </div>
          </div>
        </div>

        <div v-if="!syncStatus.isSyncNeeded" class="text-green q-mt-sm">
          <q-icon name="check_circle" /> Database is synchronized with Africa bucket
        </div>
      </q-card-section>
    </q-card>

    <!-- New Videos Detection -->
    <q-card v-if="syncStatus.isSyncNeeded" class="q-mb-lg bg-blue-1">
      <q-card-section>
        <div class="text-h6">🔄 New Videos Detected</div>
        <p class="text-grey-7">
          Found {{ syncStatus.newVideosToSync }} new videos in Africa bucket that are not in database
        </p>

        <div class="row items-center q-col-gutter-sm">
          <div class="col-12 col-md-6">
            <q-select
                v-model="selectedFolder"
                :options="availableFolders"
                label="Sync specific folder (optional)"
                clearable
                emit-value
                map-options
            />
          </div>
          <div class="col-12 col-md-6">
            <q-btn
                color="blue"
                icon="sync"
                label="Sync New Videos"
                class="full-width"
                @click="syncVideos"
                :loading="loading.sync"
            />
          </div>
        </div>

        <!-- Folder breakdown -->
        <div v-if="syncStatus.newVideosByFolder && Object.keys(syncStatus.newVideosByFolder).length" class="q-mt-md">
          <div class="text-caption text-weight-medium">New videos by folder:</div>
          <div class="row q-col-gutter-xs q-mt-xs">
            <div
                v-for="(count, folder) in syncStatus.newVideosByFolder"
                :key="folder"
                class="col-auto"
            >
              <q-badge color="blue" :label="`${folder}: ${count}`" />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Progress Section -->
    <q-card v-if="progress.status !== 'idle'" class="q-mb-lg">
      <q-card-section>
        <div class="text-h6">Migration Progress</div>

        <q-linear-progress
            :value="progress.percentage / 100"
            :color="progressColor"
            class="q-mb-md"
        />

        <div class="row justify-between items-center">
          <div class="col">
            <div class="text-weight-medium">{{ progress.currentStep }}</div>
            <div class="text-caption text-grey-7">
              {{ progress.message }}
            </div>
          </div>
          <div class="col-auto">
            <div class="text-h6">{{ progress.percentage }}%</div>
          </div>
        </div>

        <q-list class="q-mt-md">
          <q-item
              v-for="step in progress.steps"
              :key="step.name"
              :class="step.status === 'completed' ? 'bg-green-1' : step.status === 'running' ? 'bg-blue-1' : ''"
          >
            <q-item-section avatar>
              <q-icon
                  :name="step.status === 'completed' ? 'check_circle' : step.status === 'running' ? 'pending' : 'radio_button_unchecked'"
                  :color="step.status === 'completed' ? 'green' : step.status === 'running' ? 'blue' : 'grey'"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ step.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Folders Breakdown -->
    <q-card v-if="status.s3?.folders?.length" class="q-mb-lg">
      <q-card-section>
        <div class="text-h6">S3 Folders</div>
        <p class="text-grey-7">Found {{ status.s3.folders.length }} folders with content</p>

        <div class="row q-col-gutter-sm">
          <div
              v-for="folder in status.s3.folders"
              :key="folder"
              class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-chip
                color="primary"
                text-color="white"
                icon="folder"
            >
              {{ folder }}
            </q-chip>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Results Section -->
    <q-card v-if="results.complete" class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 text-green">Migration Completed Successfully! 🎉</div>

        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-md-6">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6">Files Migration</div>
                <div class="text-green text-h4">
                  {{ results.complete.migration?.successful }}/{{ results.complete.migration?.total }}
                </div>
                <div class="text-caption">files migrated successfully</div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-h6">Database Population</div>
                <div class="text-green text-h4">
                  {{ results.complete.population?.createdCount }}
                </div>
                <div class="text-caption">lessons created</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Danger Zone -->
    <q-card class="bg-red-1">
      <q-card-section>
        <div class="text-h6 text-red">Danger Zone</div>
        <p class="text-red-7">These actions cannot be undone</p>

        <q-btn
            color="red"
            icon="warning"
            label="Reset Database"
            @click="confirmReset"
            :loading="loading.reset"
        >
          <q-tooltip>
            Delete all lessons and hierarchy data
          </q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card>

    <!-- Loading Dialog -->
    <q-dialog v-model="showLoading" persistent>
      <q-card style="min-width: 300px">
        <q-card-section class="row items-center">
          <q-spinner color="primary" size="2em" />
          <span class="q-ml-sm">Processing migration...</span>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="showConfirmDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Confirm Reset</div>
        </q-card-section>

        <q-card-section>
          <p class="text-red">
            <q-icon name="warning" color="red" class="q-mr-sm" />
            This will delete ALL lessons, topics, learning areas, grades, and levels from the database.
          </p>
          <p><strong>This action cannot be undone!</strong></p>

          <q-input
              v-model="resetConfirmation"
              label="Type 'RESET_ALL_DATA' to confirm"
              class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
              label="Reset Database"
              color="red"
              @click="resetDatabase"
              :disable="resetConfirmation !== 'RESET_ALL_DATA'"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ApiService } from 'src/services/api'
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'

export default {
  name: 'MigrationDashboard',

  setup() {
    const $q = useQuasar()

    // Reactive data
    const status = ref({
      s3: null,
      database: null,
      cloudFront: null,
      readyForMigration: false
    })

    const loading = ref({
      status: false,
      files: false,
      database: false,
      complete: false,
      cloudfront: false,
      verify: false,
      reset: false,
      sync: false,
      syncStatus: false
    })

    const progress = ref({
      status: 'idle',
      currentStep: '',
      message: '',
      percentage: 0,
      steps: []
    })

    const results = ref({
      complete: null,
      files: null,
      database: null
    })

    const syncStatus = ref({
      totalVideosInBucket: 0,
      totalLessonsInDb: 0,
      newVideosToSync: 0,
      newVideosByFolder: {},
      isSyncNeeded: false
    })

    const availableFolders = ref([])
    const selectedFolder = ref('')

    const showLoading = ref(false)
    const showConfirmDialog = ref(false)
    const resetConfirmation = ref('')

    // Computed
    const progressColor = computed(() => {
      switch (progress.value.status) {
        case 'running': return 'primary'
        case 'completed': return 'green'
        case 'error': return 'red'
        default: return 'primary'
      }
    })

    // Methods
    const loadStatus = async () => {
      loading.value.status = true
      try {
        const response = await ApiService.get('migrationroutes/index')
        status.value = response.data.data
        status.value.readyForMigration = status.value.s3?.filesToMigrate > 0

        $q.notify({
          type: 'positive',
          message: 'Status updated successfully'
        })
      } catch (error) {
        console.error('Error loading status:', error)
        $q.notify({
          type: 'negative',
          message: 'Failed to load migration status'
        })
      } finally {
        loading.value.status = false
      }
    }

    const loadSyncStatus = async () => {
      loading.value.syncStatus = true
      try {
        const response = await ApiService.get('migrationroutes/syncstatus')
        syncStatus.value = response.data.data

        $q.notify({
          type: 'positive',
          message: 'Sync status updated'
        })
      } catch (error) {
        console.error('Error loading sync status:', error)
        $q.notify({
          type: 'negative',
          message: 'Failed to load sync status'
        })
      } finally {
        loading.value.syncStatus = false
      }
    }

    const loadAvailableFolders = async () => {
      try {
        const response = await ApiService.get('migrationroutes/syncfolders')
        availableFolders.value = response.data.data.folders
      } catch (error) {
        console.error('Error loading folders:', error)
      }
    }

    const syncVideos = async () => {
      loading.value.sync = true
      showLoading.value = true

      try {
        const payload = selectedFolder.value ? { folder: selectedFolder.value } : {}
        const response = await ApiService.post('migrationroutes/syncvideos', payload)

        $q.notify({
          type: 'positive',
          message: response.data.message,
          caption: `Synced ${response.data.data?.created || 0} new videos`,
          timeout: 5000
        })

        // Reload both statuses
        await loadStatus()
        await loadSyncStatus()

      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Video sync failed',
          caption: error.response?.data?.message
        })
      } finally {
        loading.value.sync = false
        showLoading.value = false
        selectedFolder.value = ''
      }
    }

    const completeMigration = async () => {
      loading.value.complete = true
      showLoading.value = true

      // Update progress
      progress.value = {
        status: 'running',
        currentStep: 'Starting complete migration...',
        message: 'This may take several minutes',
        percentage: 10,
        steps: [
          { name: 'Check S3 connection', status: 'completed' },
          { name: 'Setup CloudFront', status: 'running' },
          { name: 'Migrate S3 files', status: 'pending' },
          { name: 'Populate database', status: 'pending' },
          { name: 'Verify migration', status: 'pending' }
        ]
      }

      try {
        const response = await ApiService.post('migrationroutes/complete')
        results.value.complete = response.data.data

        // Update progress to completed
        progress.value = {
          status: 'completed',
          currentStep: 'Migration completed successfully!',
          message: `Migrated ${response.data.data.migration.successful} files and created ${response.data.data.population.createdCount} lessons`,
          percentage: 100,
          steps: [
            { name: 'Check S3 connection', status: 'completed' },
            { name: 'Setup CloudFront', status: 'completed' },
            { name: 'Migrate S3 files', status: 'completed' },
            { name: 'Populate database', status: 'completed' },
            { name: 'Verify migration', status: 'completed' }
          ]
        }

        $q.notify({
          type: 'positive',
          message: 'Complete migration finished successfully!',
          timeout: 5000
        })

        // Reload status
        await loadStatus()

      } catch (error) {
        console.error('Migration error:', error)
        progress.value.status = 'error'
        progress.value.message = error.response?.data?.message || 'Migration failed'

        $q.notify({
          type: 'negative',
          message: 'Complete migration failed',
          caption: error.response?.data?.message
        })
      } finally {
        loading.value.complete = false
        showLoading.value = false
      }
    }

    const migrateFiles = async () => {
      loading.value.files = true
      try {
        const response = await ApiService.post('migrationroutes/files')
        results.value.files = response.data.data

        $q.notify({
          type: 'positive',
          message: `Migrated ${response.data.data.successful} files successfully`
        })

        await loadStatus()
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'File migration failed'
        })
      } finally {
        loading.value.files = false
      }
    }

    const populateDatabase = async () => {
      loading.value.database = true
      try {
        const response = await ApiService.post('migrationroutes/database')
        results.value.database = response.data.data

        $q.notify({
          type: 'positive',
          message: `Created ${response.data.data.createdCount} lessons in database`
        })

        await loadStatus()
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Database population failed'
        })
      } finally {
        loading.value.database = false
      }
    }

    const setupCloudFront = async () => {
      loading.value.cloudfront = true
      try {
        const response = await ApiService.get('migrationroutes/cloudfront')

        $q.notify({
          type: 'positive',
          message: 'CloudFront setup completed',
          caption: response.data.data.domainName
        })

        await loadStatus()
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'CloudFront setup failed'
        })
      } finally {
        loading.value.cloudfront = false
      }
    }

    const verifyMigration = async () => {
      loading.value.verify = true
      try {
        const response = await ApiService.get('migrationroutes/verify')

        $q.notify({
          type: 'positive',
          message: 'Verification completed',
          caption: `Database: ${response.data.data.database.totalLessons} lessons, Files: ${response.data.data.files.verified}/${response.data.data.files.total} verified`
        })
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Verification failed'
        })
      } finally {
        loading.value.verify = false
      }
    }

    const confirmReset = () => {
      showConfirmDialog.value = true
      resetConfirmation.value = ''
    }

    const resetDatabase = async () => {
      loading.value.reset = true
      try {
        await ApiService.post('migrationroutes/reset', { confirm: 'RESET_ALL_DATA' })

        $q.notify({
          type: 'positive',
          message: 'Database reset completed'
        })

        showConfirmDialog.value = false
        await loadStatus()
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Database reset failed'
        })
      } finally {
        loading.value.reset = false
      }
    }

    // Lifecycle
    onMounted(() => {
      loadStatus()
      loadSyncStatus()
      loadAvailableFolders()
    })

    return {
      status,
      loading,
      progress,
      results,
      syncStatus,
      availableFolders,
      selectedFolder,
      showLoading,
      showConfirmDialog,
      resetConfirmation,
      progressColor,
      loadStatus,
      loadSyncStatus,
      syncVideos,
      completeMigration,
      migrateFiles,
      populateDatabase,
      setupCloudFront,
      verifyMigration,
      confirmReset,
      resetDatabase
    }
  }
}
</script>

<style scoped>
.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>