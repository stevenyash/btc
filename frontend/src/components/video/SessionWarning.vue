<template>
  <div class="session-warning q-pa-sm bg-warning text-dark">
    <q-icon name="schedule" class="q-mr-sm" />
    Session expires in
    <CountdownTimer
      ref="countdownTimer"
      :key="timerKey"
      :start-minutes="sessionTimeRemaining"
      :is-start-count-down="showTimer"
      class="q-ml-sm"
      @countdown-warning="$emit('countdown-warning', $event)"
      @countdown-complete="$emit('countdown-complete')"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import CountdownTimer from "../CountdownTimer.vue";

const props = defineProps({
  sessionTimeRemaining: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['countdown-warning', 'countdown-complete']);

const countdownTimer = ref(null);
const timerKey = ref(0);
const showTimer = ref(true);

// Watch for sessionTimeRemaining changes to reset timer
watch(() => props.sessionTimeRemaining, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    // Force re-render of countdown timer when time changes significantly
    timerKey.value++;
  }
});

// Watch for session reset
watch(() => props.sessionTimeRemaining, (newVal) => {
  if (newVal <= 0) {
    showTimer.value = false;
  }
}, { immediate: true });

onUnmounted(() => {
  showTimer.value = false;
});
</script>

<style scoped>
.session-warning {
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
