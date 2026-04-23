<template>
  <q-page class="main-page" style="min-height: 1200px;">
    <div class="smart-video-player-container">
      <!-- Session Management Overlays -->
      <SessionWarning
        v-if="showSessionWarning && !sessionExpired"
        :session-time-remaining="sessionTimeRemaining"
        @countdown-warning="handleCountdownWarning"
        @countdown-complete="handleCountdownComplete"
      />

      <SessionExpired
        v-if="sessionExpired"
        :has-lesson-balance="hasLessonBalance"
        @continue="showRefreshConfirm = true"
        @purchase="$emit('purchase')"
      />

      <!-- Connection Quality Indicator -->
      <ConnectionIndicator
        v-if="showConnectionIndicator && !loading && !videoError"
        :quality="connectionQuality"
        :status-text="connectionStatusText"
        :icon="connectionIcon"
        :indicator-class="connectionIndicatorClass"
      />

      <!-- Main Video Player -->
      <div class="video-container q-pa-8" v-if="videoData.videoUrl && !sessionExpired && !videoError">
        <VideoJsPlayer
          ref="videoPlayer"
          :src="currentVideoSource"
          :poster="posterUrl"
          :title="videoData.lessonInfo?.title || ''"
          :autoplay="shouldAutoPlay"
          :start-time="lastPlaybackTime"
          :playback-rates="[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]"
          :prevent-download="securityEnabled"
          :fluid="true"
          :responsive="true"
          :hotkeys="true"
          @play="handlePlay"
          @pause="handlePause"
          @ended="handleVideoEnd"
          @error="handleVideoError"
          @timeupdate="handleTimeUpdate"
          @loaded="handleVideoLoaded"
          @buffering="handleBuffering"
          @buffering-end="handleBufferingEnd"
          @close="$emit('close')"
          @fullscreen-change="handleFullscreenChange"
          @playback-rate-change="handlePlaybackRateChange"
        />

        <!-- Quality Selector -->
        <QualitySelector
          v-if="showQualitySelector"
          v-model:show-menu="showQualityMenu"
          :current-quality-label="currentQualityLabel"
          :available-sources="availableQualitySources"
          :current-quality="currentQuality"
          @switch-quality="handleQualitySwitch"
        />
      </div>

      <!-- Refresh Confirmation Dialog -->
      <RefreshConfirmDialog
        v-model="showRefreshConfirm"
        :current-balance="currentBalance"
        :new-balance="newBalance"
        @confirm="confirmRefresh"
      />

      <!-- Loading States -->
      <LoadingOverlay
        v-if="loading"
        :connection-quality="connectionQuality"
      />

      <!-- Error States -->
      <ErrorState
        v-if="videoError && !sessionExpired"
        :error="videoError"
        :error-title="errorTitle"
        :can-retry="canRetry"
        :show-purchase-option="showPurchaseOption"
        @retry="retryVideoLoad"
        @purchase="$emit('purchase')"
        @close="$emit('close')"
      />

      <!-- Lesson Information -->
      <LessonInfo
        v-if="videoData.lessonInfo && !videoError && showLessonInfo"
        :lesson-info="videoData.lessonInfo"
      />

      <!-- Usage Statistics -->
      <UsageStats
        v-if="videoData.accessStats && showStats"
        :access-stats="videoData.accessStats"
        :session-expires="formattedSessionTime"
        :connection-status="connectionStatusText"
        :show-connection="showConnectionIndicator"
      />

      <!-- Refresh Success Notification -->
      <q-dialog v-model="showRefreshSuccess" position="top">
        <q-banner class="bg-positive text-white">
          <template v-slot:avatar>
            <q-icon name="check_circle" />
          </template>
          Session refreshed successfully! You can continue watching.
          <template v-slot:action>
            <q-btn flat label="Dismiss" v-close-popup />
          </template>
        </q-banner>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import VideoJsPlayer from "./VideoJsPlayer.vue";
import SessionWarning from "./video/SessionWarning.vue";
import SessionExpired from "./video/SessionExpired.vue";
import ConnectionIndicator from "./video/ConnectionIndicator.vue";
import QualitySelector from "./video/QualitySelector.vue";
import RefreshConfirmDialog from "./video/RefreshConfirmDialog.vue";
import LoadingOverlay from "./video/LoadingOverlay.vue";
import ErrorState from "./video/ErrorState.vue";
import LessonInfo from "./video/LessonInfo.vue";
import UsageStats from "./video/UsageStats.vue";

// Composables
import { useVideoSession } from "src/composables/useVideoSession";
import { useConnectionQuality } from "src/composables/useConnectionQuality";
import { useVideoQuality } from "src/composables/useVideoQuality";
import { useVideoStream } from "src/composables/useVideoStream";
import { useLessonProgress } from "src/composables/useLessonProgress";

// Props
const props = defineProps({
  lessonId: {
    type: [String, Number],
    required: true
  },
  userId: {
    type: [String, Number],
    default: null
  },
  userPhone: {
    type: String,
    default: null
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  autoplay: {
    type: Boolean,
    default: false
  },
  securityEnabled: {
    type: Boolean,
    default: true
  },
  showLessonInfo: {
    type: Boolean,
    default: true
  },
  showStats: {
    type: Boolean,
    default: true
  },
  lessonData: {
    type: Object,
    default: null
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  useVideoTrackStore: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits([
  'play',
  'pause',
  'ended',
  'error',
  'timeupdate',
  'loaded',
  'close',
  'purchase',
  'session-expired',
  'session-refreshed',
  'playback-started',
  'playback-completed',
  'balance-updated',
  'buffering',
  'buffering-end'
]);

// Composables
const {
  sessionExpired,
  showSessionWarning,
  sessionTimeRemaining,
  hasLessonBalance,
  currentBalance,
  formattedSessionTime,
  newBalance,
  startSessionMonitoring,
  handleSessionExpired: onSessionExpired,
  setSessionData,
  resetSession
} = useVideoSession();

const {
  connectionQuality,
  showConnectionIndicator,
  connectionIndicatorClass,
  connectionIcon,
  connectionStatusText,
  startConnectionMonitoring
} = useConnectionQuality();

const {
  loading,
  videoError,
  videoData,
  fetchVideoUrl,
  setInitialData
} = useVideoStream();

const {
  showQualityMenu,
  currentQuality,
  currentVideoSource,
  currentQualityLabel,
  availableQualitySources,
  showQualitySelector,
  switchQuality,
  autoSelectQualityForConnection
} = useVideoQuality(videoData, connectionQuality);

// Initialize lesson progress composable
const lessonProgress = useLessonProgress();

// Local state
const videoPlayer = ref(null);
const showRefreshConfirm = ref(false);
const showRefreshSuccess = ref(false);
const shouldAutoPlay = ref(props.autoplay);

// Get resume time from saved progress
const savedProgress = lessonProgress.getProgress(props.lessonId);
const lastPlaybackTime = ref(savedProgress?.currentTime || 0);

let refreshSuccessTimer = null;

// Computed properties
const posterUrl = computed(() => {
  return videoData.value.thumbnailUrl || props.thumbnailUrl || '';
});

const errorTitle = computed(() => {
  if (videoError.value?.includes('access denied') || videoError.value?.includes('purchase')) {
    return 'Access Required';
  } else if (videoError.value?.includes('expired')) {
    return 'Session Expired';
  } else if (videoError.value?.includes('balance')) {
    return 'No Lessons Remaining';
  } else if (videoError.value?.includes('network') || videoError.value?.includes('buffering')) {
    return 'Network Issue';
  }
  return 'Playback Error';
});

const canRetry = computed(() => {
  return !videoError.value?.includes('access denied') &&
         !videoError.value?.includes('purchase') &&
         !videoError.value?.includes('balance exhausted');
});

const showPurchaseOption = computed(() => {
  return videoError.value?.includes('access denied') ||
         videoError.value?.includes('purchase') ||
         videoError.value?.includes('balance exhausted');
});

// Lifecycle
onMounted(() => {
  console.log('SmartVideoPlayer mounted for lesson:', props.lessonId);
  initializePlayer();
  startConnectionMonitoring();
});

onUnmounted(() => {
  cleanup();
});

// Watchers
watch(() => props.lessonId, (newLessonId) => {
  if (newLessonId) {
    // Update resume time for new lesson
    const progress = lessonProgress.getProgress(newLessonId);
    lastPlaybackTime.value = progress?.currentTime || 0;

    console.log(`📍 Resume time for lesson ${newLessonId}: ${lastPlaybackTime.value}s`);

    initializePlayer();
  }
});

// Main initialization
async function initializePlayer() {
  cleanup();

  // Reset session state for new lesson
  resetSession();

  setInitialData(props.lessonData, props.thumbnailUrl);

  const result = await fetchVideoUrl(props.lessonId, {
    isGuest: props.isGuest,
    userId: props.userId,
    userPhone: props.userPhone
  });

  if (result) {
    setSessionData({
      sessionExpires: result.sessionExpires,
      lessonBalance: result.accessStats.lessonBalance
    });

    startSessionMonitoring();

    // Auto-select quality based on connection
    shouldAutoPlay.value = props.autoplay && connectionQuality.value !== 'poor';
    autoSelectQualityForConnection();

    // Restore playback position from localStorage if available
    const storageKey = `video_position_${props.lessonId}_${props.userId || props.userPhone}`;
    const savedPosition = localStorage.getItem(storageKey);

    if (savedPosition) {
      const position = parseFloat(savedPosition);
      if (position > 0) {
        lastPlaybackTime.value = position;
        console.log(`📍 Restored playback position: ${position}s from localStorage`);

        // Clear the saved position after restoring
        localStorage.removeItem(storageKey);
      }
    }

    emit('loaded', result);
  }
}

// Session management
async function confirmRefresh() {
  showRefreshConfirm.value = false;
  console.log('🔄 Refreshing session...');

  try {
    // Save current playback position to localStorage before refresh
    const currentTime = videoPlayer.value?.getCurrentTime() || lastPlaybackTime.value;
    const storageKey = `video_position_${props.lessonId}_${props.userId || props.userPhone}`;

    if (currentTime > 0) {
      localStorage.setItem(storageKey, currentTime.toString());
      console.log(`💾 Saved playback position: ${currentTime}s to localStorage`);
    }

    // Fetch new session to verify user has balance
    const result = await fetchVideoUrl(props.lessonId, {
      isGuest: props.isGuest,
      userId: props.userId,
      userPhone: props.userPhone
    });

    if (result && result.videoUrl) {
      console.log('✅ Session refreshed successfully - reloading page...');

      // Reload the page to start fresh with the new session
      window.location.reload();
    } else {
      console.error('❌ Failed to get video URL after refresh');
    }
  } catch (error) {
    console.error('Failed to refresh session:', error);
  }
}

// Video control methods
async function retryVideoLoad() {
  await initializePlayer();
}

function handleQualitySwitch(source) {
  switchQuality(source, videoPlayer);
}

// Event handlers
function handlePlay() {
  emit('play');
  emit('playback-started', {
    lessonId: props.lessonId,
    timestamp: new Date().toISOString(),
    currentTime: lastPlaybackTime.value
  });
}

function handlePause() {
  emit('pause');
}

function handleVideoEnd() {
  if (videoPlayer.value) {
    const currentTime = videoPlayer.value.getCurrentTime();
    const duration = videoPlayer.value.getDuration();
    const completionPercentage = duration > 0 ? Math.floor((currentTime / duration) * 100) : 0;

    emit('ended');
    emit('playback-completed', {
      lessonId: props.lessonId,
      duration: duration,
      completionPercentage: completionPercentage,
      timestamp: new Date().toISOString()
    });
  }

  lastPlaybackTime.value = 0;

  // Clear saved position when video completes
  const storageKey = `video_position_${props.lessonId}_${props.userId || props.userPhone}`;
  localStorage.removeItem(storageKey);
  console.log('🗑️ Cleared saved position - video completed');
}

function handleVideoError(errorData) {
  console.error('Video playback error:', errorData);

  // Extract detailed error information
  const { code, message } = errorData;

  console.error('Detailed error info:', {
    errorCode: code,
    errorMessage: message
  });

  // Set video error state with the error message string
  videoError.value = message || 'Video playback error';

  emit('error', errorData);
}

function handleFullscreenChange(event) {
  console.log('Fullscreen changed:', event.isFullscreen);
  emit('fullscreen-change', event);
}

function handlePlaybackRateChange(event) {
  console.log('Playback rate changed:', event.rate);
  emit('playback-rate-change', event);
}

function handleTimeUpdate(event) {
  lastPlaybackTime.value = event.currentTime;

  // Periodically save playback position to localStorage (every 5 seconds)
  const storageKey = `video_position_${props.lessonId}_${props.userId || props.userPhone}`;
  const currentTime = event.currentTime;

  // Only save if we have meaningful progress (more than 5 seconds)
  if (currentTime > 5 && Math.floor(currentTime) % 5 === 0) {
    localStorage.setItem(storageKey, currentTime.toString());
  }

  emit('timeupdate', event);
}

function handleVideoLoaded(event) {
  console.log('Video loaded successfully');
  emit('loaded', event);
}

function handleBuffering() {
  console.log('Video buffering started');
  emit('buffering');
}

function handleBufferingEnd() {
  console.log('Video buffering ended');
  emit('buffering-end');
}

// Countdown timer events
function handleCountdownWarning(event) {
  console.log('Countdown warning:', event);
}

function handleCountdownComplete() {
  onSessionExpired();
  if (videoPlayer.value && videoPlayer.value.getIsPlaying()) {
    videoPlayer.value.pause();
  }
  emit('session-expired');
}

// Cleanup
function cleanup() {
  if (refreshSuccessTimer) {
    clearTimeout(refreshSuccessTimer);
  }
  if (videoPlayer.value) {
    videoPlayer.value.pause();
  }
}

// Public methods
function play() {
  if (videoPlayer.value) {
    videoPlayer.value.play();
  }
}

function pause() {
  if (videoPlayer.value) {
    videoPlayer.value.pause();
  }
}

function seekTo(time) {
  if (videoPlayer.value) {
    videoPlayer.value.seekTo(time);
  }
}

function toggleFullscreen() {
  if (videoPlayer.value) {
    videoPlayer.value.toggleFullscreen();
  }
}

function refreshSession() {
  if (hasLessonBalance.value) {
    showRefreshConfirm.value = true;
  } else {
    emit('purchase');
  }
}

// Expose public methods
defineExpose({
  play,
  pause,
  seekTo,
  toggleFullscreen,
  refreshSession,
  retryVideoLoad,
  getCurrentTime: () => videoPlayer.value?.getCurrentTime() || 0,
  getDuration: () => videoPlayer.value?.getDuration() || 0,
  getIsPlaying: () => videoPlayer.value?.getIsPlaying() || false,
  getVideoData: () => videoData.value,
  getSessionStatus: () => ({
    sessionExpired: sessionExpired.value,
    timeRemaining: sessionTimeRemaining.value,
    hasLessonBalance: hasLessonBalance.value,
    currentBalance: currentBalance.value
  }),
  getConnectionQuality: () => connectionQuality.value,
  getCurrentQuality: () => currentQuality.value
});
</script>

<style scoped>
.smart-video-player-container {
  position: relative;
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.video-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 100%;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000;
  contain: layout style paint;
}

/* Responsive design */
@media (max-width: 768px) {
  .smart-video-player-container {
    padding: 8px;
    height: auto;
    min-height: 100vh;
  }

  .video-container {
    aspect-ratio: 16/9;
    width: 100%;
    height: auto;
  }
}
</style>
