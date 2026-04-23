<template>
  <div class="loading-overlay">
    <q-spinner size="50px" color="primary" />
    <p>Loading secure video stream...</p>
    <p v-if="connectionQuality === 'poor'" class="text-caption text-warning">
      Slow connection detected. Loading lower quality...
    </p>
  </div>
</template>

<script setup>
defineProps({
  connectionQuality: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
}
</style>
