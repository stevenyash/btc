<template>
  <div class="countdown-timer">
    <span class="timer-text">{{ formattedTime }}</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// PROPERLY DECLARE EMITS to fix the warning
const emit = defineEmits(['countdown-warning', 'countdown-complete']);

const props = defineProps({
  startMinutes: {
    type: Number,
    default: 0
  },
  isStartCountDown: {
    type: Boolean,
    default: false
  },
  warningThreshold: {
    type: Number,
    default: 300 // 5 minutes in seconds
  }
});

const timeRemaining = ref(0);
const timerInterval = ref(null);

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60);
  const seconds = timeRemaining.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

function startCountdown() {
  if (props.isStartCountDown) {
    timeRemaining.value = props.startMinutes * 60;
  } else {
    timeRemaining.value = 0;
    return;
  }

  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }

  timerInterval.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--;
      
      // Emit warning when threshold is reached
      if (timeRemaining.value === props.warningThreshold) {
        emit('countdown-warning', { timeRemaining: timeRemaining.value });
      }
    } else {
      clearInterval(timerInterval.value);
      emit('countdown-complete');
    }
  }, 1000);
}

function stopCountdown() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
}

watch(() => props.isStartCountDown, (newVal) => {
  if (newVal) {
    startCountdown();
  } else {
    stopCountdown();
  }
});

onMounted(() => {
  if (props.isStartCountDown) {
    startCountdown();
  }
});

onUnmounted(() => {
  stopCountdown();
});
</script>

<style scoped>
.countdown-timer {
  display: inline-flex;
  align-items: center;
  font-weight: bold;
}

.timer-text {
  font-family: 'Courier New', monospace;
  font-size: 14px;
}
</style>