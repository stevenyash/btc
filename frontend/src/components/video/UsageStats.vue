<template>
  <div class="usage-stats q-mt-md">
    <q-card flat bordered>
      <q-card-section class="q-py-sm">
        <div class="row items-center">
          <div class="col-auto q-mr-md">
            <q-icon name="info" size="sm" color="grey-6" />
          </div>
          <div class="col">
            <div class="text-caption text-grey-7">
              <span v-if="accessStats.lessonBalance !== null">
                Lessons remaining: <strong>{{ accessStats.lessonBalance }}</strong>
              </span>
              <span v-if="accessStats.guestViewsRemaining !== null">
                • Views remaining: <strong>{{ accessStats.guestViewsRemaining }}</strong>
              </span>
              <span> • Access type: <strong>{{ accessStats.accessTypeLabel }}</strong></span>
              <span v-if="sessionExpires">
                • Session ends: <strong>{{ sessionExpires }}</strong>
              </span>
              <span v-if="showConnection">
                • Connection: <strong>{{ connectionStatus }}</strong>
              </span>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
defineProps({
  accessStats: {
    type: Object,
    required: true
  },
  sessionExpires: {
    type: String,
    default: ''
  },
  connectionStatus: {
    type: String,
    default: ''
  },
  showConnection: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.usage-stats {
  border-radius: 12px;
}
</style>
