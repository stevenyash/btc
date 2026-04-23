<template>
  <div class="lesson-info q-mt-md">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">{{ lessonInfo.title }}</div>
        <div v-if="lessonInfo.description" class="text-caption text-grey-7 q-mt-sm">
          {{ lessonInfo.description }}
        </div>
        <div class="row q-mt-sm text-caption text-grey-6">
          <div class="col-auto q-mr-md">
            <q-icon name="schedule" size="xs" class="q-mr-xs" />
            {{ formatDuration(lessonInfo.duration) }}
          </div>
          <div v-if="lessonInfo.learning_area" class="col-auto q-ml-md">
            <q-icon name="category" size="xs" class="q-mr-xs" />
            {{ lessonInfo.learning_area.name }}
          </div>
          <div v-if="lessonInfo.topic" class="col-auto q-ml-md">
            <q-icon name="topic" size="xs" class="q-mr-xs" />
            {{ lessonInfo.topic.name }}
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
defineProps({
  lessonInfo: {
    type: Object,
    required: true
  }
});

function formatDuration(seconds) {
  if (!seconds) return 'Unknown duration';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
</script>

<style scoped>
.lesson-info {
  border-radius: 12px;
}
</style>
