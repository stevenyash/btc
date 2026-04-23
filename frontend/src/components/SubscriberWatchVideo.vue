<template>
     <q-page class="main-page"  id="">
 <div class="video-player-container row flex-center" style="min-height: 100vh;">

    <div v-if="!currentLessonId" class="loading-container">
      <q-spinner size="50px" color="primary" />
      <p class="q-mt-md">Loading lesson information...</p>
    </div>

    <div v-else-if="lessonError" class="error-container">
      <q-icon name="error_outline" size="xl" color="negative" />
      <p class="text-h6 q-mt-md">Lesson Not Found</p>
      <p class="text-grey-7">{{ lessonError }}</p>
      <q-btn color="primary" label="Go Back" @click="handleClose" class="q-mt-md" />
    </div>

    <q-card v-else style="height: 1200px;">

      <SmartVideoPlayer

        ref="smartVideoPlayer"
        :lesson-id="currentLessonId"
        :user-id="auth.user?.id"
        :user-phone="auth.user?.phone"
        :is-guest="store.isGuest"
        :autoplay="shouldAutoPlay"
        :security-enabled="true"
        :show-lesson-info="true"
        :show-stats="true"
        :lesson-data="currentLesson"
        :thumbnail-url="currentLesson?.thumbnail_url"
        :use-video-track-store="true"
        @close="handleClose"
        @purchase="handlePurchase"
        @session-expired="handleSessionExpired"
        @session-refreshed="handleSessionRefreshed"
        @playback-started="handlePlaybackStarted"
        @playback-completed="handlePlaybackCompleted"
        @balance-updated="handleBalanceUpdated"
        @error="handlePlayerError"
        @play="handlePlay"
        @pause="handlePause"
        @timeupdate="handleTimeUpdate"
        @loaded="handleVideoLoaded"
      />
    </q-card>
  </div>

     </q-page>

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuth } from "src/composables/auth";
import { useLearningHierarchyStore } from "src/stores/learningHierarchyStore";
import { useVideoTrackStore } from "src/stores/guestVideoStore";
import { useLessonProgress } from "src/composables/useLessonProgress";
import SmartVideoPlayer from "./SmartVideoPlayer.vue";

const router = useRouter();
const $q = useQuasar();
const auth = useAuth();
const store = useLearningHierarchyStore();
const videoStore = useVideoTrackStore();
const lessonProgress = useLessonProgress();

// Refs
const smartVideoPlayer = ref(null);
const lessonError = ref(null);
const isLoading = ref(true);

// Computed properties
const currentLesson = computed(() => store.selectedLesson);
const currentLessonId = computed(() => {
  const id = store.selectedLesson?.id;
  console.log("Current lesson ID computed:", id);
  return id;
});
const shouldAutoPlay = computed(() => true); // Auto-play by default

// Lifecycle
onMounted(async () => {
  console.log("VideoPlayerContainer mounted");

  try {
    // Check if we have a selected lesson
    if (!store.selectedLesson) {
      console.log("No selected lesson found, attempting to load from route or store");

      // Try to get lesson ID from route params
      const route = router.currentRoute.value;
      const lessonIdFromRoute = route.params.lessonId || route.query.lessonId;

      if (lessonIdFromRoute) {
        console.log("Found lesson ID in route:", lessonIdFromRoute);
        // Load lesson details using the store
        await store.fetchLessonDetails(lessonIdFromRoute);
      } else {
        // No lesson ID available
        lessonError.value = "No lesson selected. Please select a lesson to watch.";
        $q.notify({
          type: 'warning',
          message: 'No lesson selected',
          caption: 'Please select a lesson to watch',
          position: 'top'
        });
      }
    }

    // e video tracking if we have a valid lesson
    if (currentLessonId.value) {
      initializeVideoTracking();
    }
  } catch (error) {
    console.error("Error initializing video player:", error);
    lessonError.value = "Failed to load lesson information. Please try again.";
    $q.notify({
      type: 'negative',
      message: 'Error loading lesson',
      caption: error.message || 'Please try again later',
      position: 'top'
    });
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  cleanup();
});

// Watch for changes in selected lesson
watch(() => store.selectedLesson, (newLesson) => {
  console.log("Selected lesson changed:", newLesson?.id);

  if (newLesson) {
    lessonError.value = null;
    initializeVideoTracking();
  } else {
    lessonError.value = "Lesson information is no longer available.";
  }
}, { deep: true });

function initializeVideoTracking() {
  // Initialize video store with current lesson if needed
  if (currentLessonId.value) {
    try {
      console.log("Initializing video tracking for lesson:", currentLessonId.value);
      videoStore.initializeSession(currentLessonId.value);
    } catch (error) {
      console.warn('Error initializing video tracking:', error);
    }
  }
}

function cleanup() {
  // Cleanup will be handled by SmartVideoPlayer
  try {
    videoStore.stopWatching();
  } catch (e) {
    console.warn('Error stopping watch session:', e);
  }
}

// Event Handlers
function handleClose() {
  router.back();
}

function handlePurchase() {
  router.go(-1);
}

function handleSessionExpired() {
  console.log("Session expired for lesson:", currentLessonId.value);
  // Additional session expiry logic if needed
}

function handleSessionRefreshed() {
  console.log("Session refreshed for lesson:", currentLessonId.value);
  // Additional refresh logic if needed
}

function handleBalanceUpdated(event) {
  console.log("Balance updated:", event.newBalance);
  // Update local balance state if needed
}

function handlePlayerError(error) {
  console.error("Player error:", error);
  // Handle player-level errors
}

// Video playback events that integrate with video store
function handlePlay() {
  console.log("Playback started for lesson:", currentLessonId.value);
  setTimeout(() => {
    try {
      videoStore.startWatching(currentLessonId.value, videoStore.sessionData);
    } catch (e) {
      console.warn('Error starting watch session:', e);
    }
  }, 0);
}

function handlePause() {
  console.log("Playback paused for lesson:", currentLessonId.value);
  setTimeout(() => {
    try {
      videoStore.stopWatching();
    } catch (e) {
      console.warn('Error stopping watch session:', e);
    }
  }, 0);
}

function handlePlaybackStarted(event) {
  console.log("Playback started with analytics:", event);
  // Track playback start analytics
  trackAnalytics('playback_started', {
    lessonId: currentLessonId.value,
    timestamp: event.timestamp,
    currentTime: event.currentTime
  });
}

function handlePlaybackCompleted(event) {
  console.log("Playback completed with analytics:", event);

  // Mark lesson as completed in progress tracker
  if (currentLessonId.value) {
    lessonProgress.markAsCompleted(currentLessonId.value);
    lessonProgress.saveProgress(
      currentLessonId.value,
      event.duration,
      event.duration,
      currentLesson.value
    );
  }

  // Integrate with video store for completion tracking
  setTimeout(() => {
    try {
      videoStore.stopWatching();
      videoStore.markSessionCompleted(
        Math.floor(event.duration * (event.completionPercentage / 100)),
        event.completionPercentage
      );
    } catch (e) {
      console.warn('Error handling video completion:', e);
    }
  }, 0);

  // Track completion analytics
  trackAnalytics('playback_completed', {
    lessonId: currentLessonId.value,
    duration: event.duration,
    completionPercentage: event.completionPercentage,
    timestamp: event.timestamp
  });
}

function handleTimeUpdate(event) {
  // Save progress every 5 seconds to avoid excessive writes
  if (currentLessonId.value && event.currentTime && event.duration) {
    const shouldSave = Math.floor(event.currentTime) % 5 === 0;
    if (shouldSave) {
      lessonProgress.saveProgress(
        currentLessonId.value,
        event.currentTime,
        event.duration,
        currentLesson.value
      );
    }
  }
}

function handleVideoLoaded(event) {
  console.log("Video loaded:", event);
  // Additional video loaded logic if needed
}

// Analytics tracking
function trackAnalytics(event, data) {
  // Implement your analytics tracking here
  console.log(`Analytics: ${event}`, data);

  // Example: Send to your analytics service
  // analytics.track(event, {
  //   ...data,
  //   userId: auth.user?.id,
  //   userType: auth.user ? 'authenticated' : 'guest'
  // });
}

// Watchers
watch(currentLessonId, (newLessonId) => {
  if (newLessonId) {
    console.log("Lesson changed to:", newLessonId);
    initializeVideoTracking();
  }
});

// Public methods (if you need to control the player externally)
function playVideo() {
  if (smartVideoPlayer.value) {
    smartVideoPlayer.value.play();
  }
}

function pauseVideo() {
  if (smartVideoPlayer.value) {
    smartVideoPlayer.value.pause();
  }
}

function seekTo(time) {
  if (smartVideoPlayer.value) {
    smartVideoPlayer.value.seekTo(time);
  }
}

function refreshSession() {
  if (smartVideoPlayer.value) {
    smartVideoPlayer.value.refreshSession();
  }
}

function toggleFullscreen() {
  if (smartVideoPlayer.value) {
    smartVideoPlayer.value.toggleFullscreen();
  }
}

// Get player status for external components
function getPlayerStatus() {
  if (smartVideoPlayer.value) {
    return smartVideoPlayer.value.getSessionStatus();
  }
  return null;
}

// Expose methods if needed
defineExpose({
  playVideo,
  pauseVideo,
  seekTo,
  refreshSession,
  toggleFullscreen,
  getPlayerStatus,
  getCurrentTime: () => smartVideoPlayer.value?.getCurrentTime() || 0,
  getDuration: () => smartVideoPlayer.value?.getDuration() || 0,
  getIsPlaying: () => smartVideoPlayer.value?.getIsPlaying() || false
});
</script>

<style scoped>
.video-player-container {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
  /* Add box-sizing to ensure padding doesn't break 100% width */
  box-sizing: border-box;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 20px;
}

.error-container {
  background-color: #f9f9f9;
  border-radius: 8px;
  max-width: 500px;
  margin: 0 auto;
}

/* Ensure SmartVideoPlayer fills container */
.video-player-container :deep(.smart-video-player-container) {
  width: 100% !important;
  height: 100% !important;
}

/* Mobile adjustments: FIX for centering and padding
*/
@media (max-width: 768px) {
  .video-player-container {
    width: 100%;
    /* Change from height: 100vh to use aspect ratio */
    height: auto;
    min-height: 100vh;
    padding: 0 8px;
    /* Add this to prevent overflow */
    overflow-y: auto;
  }

  /* Ensure the q-card fills the container properly */
  .video-player-container > .q-card {
    width: 100%;
    height: auto;
    /* Use aspect ratio instead of fixed height */
    aspect-ratio: 16/9;
  }

  /* Fix the video container inside */
  .video-player-container :deep(.video-container) {
    width: 100% !important;
    height: 100% !important;
    /* Remove padding-bottom trick if using aspect-ratio */
    position: relative;
  }

  .video-player-container :deep(video) {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
  }
}
</style>
