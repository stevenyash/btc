<template>
  <div class="meeting-wrapper">
    <!-- Launch Button -->
    <div class="meeting-controls">
      <q-btn
        color="primary"
        icon="videocam"
        label="Join Google Meet"
        @click="openInNewTab"
        :disable="!validMeetingUrl"
      />
    </div>

    <!-- Meeting Status -->
    <q-banner
      v-if="meetingStatus"
      class="q-mt-md"
      :class="`bg-${meetingStatus.type}`"
    >
      <template v-slot:avatar>
        <q-icon :name="meetingStatus.icon" />
      </template>
      {{ meetingStatus.message }}
    </q-banner>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  meetingUrl: {
    type: String,
    default: '',
    validator: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }
  }
});

const emit = defineEmits(['meeting-loaded', 'meeting-ended']);
const meetingStatus = ref(null);
const lastOpenedTime = ref(null);

const validMeetingUrl = computed(() => {
  if (!props.meetingUrl) return false;
  try {
    const url = new URL(props.meetingUrl);
    return url.hostname.includes('google.com') && url.pathname.includes('/'); // basic check
  } catch {
    return false;
  }
});

const openInNewTab = () => {
  if (!validMeetingUrl.value) return;

  lastOpenedTime.value = new Date();
  window.open(props.meetingUrl, '_blank', 'noopener,noreferrer');

  meetingStatus.value = {
    type: 'positive',
    icon: 'launch',
    message: 'Opened Google Meet in new tab'
  };

  emit('meeting-loaded', {
    url: props.meetingUrl,
    timestamp: lastOpenedTime.value
  });
};

watch(() => props.meetingUrl, (newVal) => {
  if (validMeetingUrl.value) {
    meetingStatus.value = {
      type: 'info',
      icon: 'link',
      message: 'Ready to join the meeting'
    };
  } else {
    meetingStatus.value = {
      type: 'warning',
      icon: 'link_off',
      message: 'Invalid Google Meet URL'
    };
    emit('meeting-ended', {
      lastConnected: lastOpenedTime.value
    });
  }
}, { immediate: true });
</script>

<style scoped>
.meeting-wrapper {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.meeting-controls {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
</style>
