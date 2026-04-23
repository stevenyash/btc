<template>
  <div class="connection-indicator q-pa-xs text-center" :class="indicatorClass">
    <q-icon :name="icon" size="xs" class="q-mr-xs" />
    {{ statusText }}
  </div>
</template>

<script setup>
defineProps({
  quality: {
    type: String,
    required: true
  },
  statusText: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  indicatorClass: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.connection-indicator {
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 0.8rem;
  font-weight: 500;
}

:deep(.connection-poor) {
  background: #ff4444;
  color: white;
}

:deep(.connection-fair) {
  background: #ffaa00;
  color: white;
}

:deep(.connection-good) {
  background: #00C851;
  color: white;
}
</style>
