<template>
  <q-page class="video-learning-page">
    <!-- Theater Mode Toggle -->
    <div class="theater-controls" v-if="!isFullscreen">
      <q-btn
        flat
        dense
        round
        :icon="theaterMode ? 'fullscreen_exit' : 'fullscreen'"
        @click="toggleTheaterMode"
        color="white"
        class="theater-toggle"
      >
        <q-tooltip>{{ theaterMode ? 'Exit Theater Mode' : 'Theater Mode' }}</q-tooltip>
      </q-btn>
    </div>

    <!-- Main Content Container -->
    <div class="video-learning-container" :class="{ 'theater-mode': theaterMode }">
      <!-- Video Player Section -->
      <div class="video-section" :class="{ 'theater-active': theaterMode }">
        <WatchVideo ref="videoPlayer" />

        <!-- Lesson Info Bar (Below Video) -->
        <div class="lesson-info-bar" v-if="currentLesson">
          <div class="lesson-details">
            <h5 class="lesson-title">{{ currentLesson.title }}</h5>
            <div class="lesson-meta">
              <q-chip dense size="sm" color="primary" text-color="white" icon="school">
                {{ currentLesson.grade_name }}
              </q-chip>
              <q-chip dense size="sm" color="secondary" text-color="white" icon="subject">
                {{ currentLesson.area_name }}
              </q-chip>
              <q-chip dense size="sm" color="accent" text-color="white" icon="topic">
                {{ currentLesson.topic_name }}
              </q-chip>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <q-btn
              flat
              dense
              icon="skip_previous"
              @click="playPreviousLesson"
              :disable="!hasPreviousLesson"
              color="primary"
            >
              <q-tooltip>Previous Lesson</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="skip_next"
              @click="playNextLesson"
              :disable="!hasNextLesson"
              color="primary"
            >
              <q-tooltip>Next Lesson</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="playlist_play"
              @click="showPlaylist = !showPlaylist"
              color="primary"
            >
              <q-tooltip>{{ showPlaylist ? 'Hide' : 'Show' }} Playlist</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Lesson Description (Expandable) -->
        <q-expansion-item
          v-if="currentLesson && currentLesson.description"
          icon="info"
          label="Lesson Description"
          class="lesson-description-expand"
          dense
        >
          <q-card flat bordered class="q-pa-md">
            <div class="text-body2">{{ currentLesson.description }}</div>
          </q-card>
        </q-expansion-item>
      </div>

      <!-- Playlist Sidebar -->
      <transition name="slide-left">
        <div class="playlist-sidebar" v-show="showPlaylist && !theaterMode">
          <div class="playlist-header">
            <div class="playlist-title">
              <q-icon name="playlist_play" size="sm" class="q-mr-sm" />
              <span class="text-h6">Lesson Playlist</span>
            </div>
            <q-btn
              flat
              dense
              round
              icon="close"
              @click="showPlaylist = false"
              size="sm"
            />
          </div>

          <!-- Progress Overview -->
          <div class="progress-overview" v-if="playlistLessons.length > 0">
            <div class="progress-stats">
              <div class="stat-item">
                <span class="stat-value">{{ completedLessonsCount }}</span>
                <span class="stat-label">Completed</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ playlistLessons.length }}</span>
                <span class="stat-label">Total</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ progressPercentage }}%</span>
                <span class="stat-label">Progress</span>
              </div>
            </div>
            <q-linear-progress
              :value="progressPercentage / 100"
              color="positive"
              size="8px"
              class="q-mt-sm"
            />
          </div>

          <!-- Lesson List -->
          <q-scroll-area class="playlist-scroll">
            <q-list separator>
              <q-item
                v-for="(lesson, index) in playlistLessons"
                :key="lesson.id"
                clickable
                @click="selectLesson(lesson)"
                :active="currentLesson && currentLesson.id === lesson.id"
                active-class="active-lesson"
                class="lesson-item"
              >
                <q-item-section avatar>
                  <q-avatar
                    :color="isLessonCompleted(lesson.id) ? 'positive' : 'grey-5'"
                    text-color="white"
                    size="md"
                  >
                    <q-icon
                      :name="isLessonCompleted(lesson.id) ? 'check_circle' : 'play_circle'"
                    />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="lesson-item-title">
                    {{ index + 1 }}. {{ lesson.title }}
                  </q-item-label>
                  <q-item-label caption lines="1">
                    {{ lesson.topic_name }}
                  </q-item-label>
                  <q-item-label caption v-if="lesson.duration">
                    <q-icon name="schedule" size="xs" />
                    {{ formatDuration(lesson.duration) }}
                  </q-item-label>

                  <!-- Progress Bar for In-Progress Lessons -->
                  <div v-if="getProgressPercentage(lesson.id) > 0 && !isLessonCompleted(lesson.id)" class="lesson-progress-container q-mt-xs">
                    <q-linear-progress
                      :value="getProgressPercentage(lesson.id) / 100"
                      color="orange"
                      size="4px"
                      class="lesson-progress-bar"
                    />
                    <span class="lesson-progress-text">
                      {{ getProgressPercentage(lesson.id) }}% • Resume at {{ lessonProgress.formatTime(getLessonProgress(lesson.id)?.currentTime || 0) }}
                    </span>
                  </div>
                </q-item-section>

                <q-item-section side v-if="currentLesson && currentLesson.id === lesson.id">
                  <q-icon name="volume_up" color="primary" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-scroll-area>

          <!-- Load More Button -->
          <div class="playlist-footer" v-if="hasMoreLessons">
            <q-btn
              flat
              color="primary"
              label="Load More Lessons"
              icon="expand_more"
              @click="loadMoreLessons"
              :loading="loadingMore"
              class="full-width"
            />
          </div>
        </div>
      </transition>
    </div>

    <!-- Keyboard Shortcuts Help -->
    <q-dialog v-model="showShortcuts">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Keyboard Shortcuts</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-list dense>
            <q-item>
              <q-item-section avatar>
                <q-chip dense>Space</q-chip>
              </q-item-section>
              <q-item-section>Play/Pause</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-chip dense>←/→</q-chip>
              </q-item-section>
              <q-item-section>Seek backward/forward 5s</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-chip dense>N</q-chip>
              </q-item-section>
              <q-item-section>Next lesson</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-chip dense>P</q-chip>
              </q-item-section>
              <q-item-section>Previous lesson</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-chip dense>T</q-chip>
              </q-item-section>
              <q-item-section>Toggle theater mode</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-chip dense>L</q-chip>
              </q-item-section>
              <q-item-section>Toggle playlist</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-chip dense>?</q-chip>
              </q-item-section>
              <q-item-section>Show shortcuts</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Floating Help Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="help_outline"
        color="primary"
        @click="showShortcuts = true"
        size="sm"
      >
        <q-tooltip>Keyboard Shortcuts</q-tooltip>
      </q-btn>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useApp } from 'src/composables/app.js';
import { useLearningHierarchyStore } from "src/stores/learningHierarchyStore";
import { useVideoTrackStore } from "src/stores/guestVideoStore";
import { useLessonProgress } from "src/composables/useLessonProgress";
import WatchVideo from "src/components/SubscriberWatchVideo.vue";

const props = defineProps({
  pageName: {
    type: String,
    default: 'home',
  },
  routeName: {
    type: String,
    default: 'home',
  },
  isSubPage: {
    type: Boolean,
    default: false,
  },
});

const app = useApp();
const router = useRouter();
const $q = useQuasar();
const store = useLearningHierarchyStore();
const videoStore = useVideoTrackStore();
const lessonProgress = useLessonProgress();

// Refs
const videoPlayer = ref(null);
const theaterMode = ref(false);
const showPlaylist = ref(true);
const showShortcuts = ref(false);
const isFullscreen = ref(false);
const loadingMore = ref(false);
const pageReady = ref(true);

// Computed properties
const currentLesson = computed(() => store.selectedLesson);
const playlistLessons = computed(() => store.currentData.lessons || []);
const currentLessonIndex = computed(() => {
  if (!currentLesson.value) return -1;
  return playlistLessons.value.findIndex(l => l.id === currentLesson.value.id);
});

const hasPreviousLesson = computed(() => currentLessonIndex.value > 0);
const hasNextLesson = computed(() =>
  currentLessonIndex.value >= 0 &&
  currentLessonIndex.value < playlistLessons.value.length - 1
);
const hasMoreLessons = computed(() => store.currentData.hasMore || false);

const completedLessonsCount = computed(() => {
  return playlistLessons.value.filter(lesson =>
    isLessonCompleted(lesson.id)
  ).length;
});

const progressPercentage = computed(() => {
  if (playlistLessons.value.length === 0) return 0;
  return Math.round((completedLessonsCount.value / playlistLessons.value.length) * 100);
});

// Lifecycle
onMounted(() => {
  setupKeyboardShortcuts();
  checkFullscreenStatus();

  // Auto-hide playlist on mobile
  if ($q.screen.lt.md) {
    showPlaylist.value = false;
  }
});

onUnmounted(() => {
  removeKeyboardShortcuts();
});

// Methods
function toggleTheaterMode() {
  theaterMode.value = !theaterMode.value;
  if (theaterMode.value) {
    showPlaylist.value = false;
  }
}

function selectLesson(lesson) {
  store.selectLesson(lesson);

  // Auto-hide playlist on mobile after selection
  if ($q.screen.lt.md) {
    showPlaylist.value = false;
  }
}

function playNextLesson() {
  if (hasNextLesson.value) {
    const nextLesson = playlistLessons.value[currentLessonIndex.value + 1];
    selectLesson(nextLesson);

    $q.notify({
      type: 'positive',
      message: 'Playing next lesson',
      caption: nextLesson.title,
      position: 'top',
      timeout: 2000
    });
  }
}

function playPreviousLesson() {
  if (hasPreviousLesson.value) {
    const prevLesson = playlistLessons.value[currentLessonIndex.value - 1];
    selectLesson(prevLesson);

    $q.notify({
      type: 'positive',
      message: 'Playing previous lesson',
      caption: prevLesson.title,
      position: 'top',
      timeout: 2000
    });
  }
}

async function loadMoreLessons() {
  loadingMore.value = true;
  try {
    await store.loadMoreLessons();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to load more lessons',
      position: 'top'
    });
  } finally {
    loadingMore.value = false;
  }
}

function isLessonCompleted(lessonId) {
  // Check if lesson is completed using the progress composable
  return lessonProgress.isLessonCompleted(lessonId);
}

function getLessonProgress(lessonId) {
  return lessonProgress.getProgress(lessonId);
}

function getProgressPercentage(lessonId) {
  return lessonProgress.getCompletionPercentage(lessonId);
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function checkFullscreenStatus() {
  const checkFullscreen = () => {
    isFullscreen.value = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  };

  document.addEventListener('fullscreenchange', checkFullscreen);
  document.addEventListener('webkitfullscreenchange', checkFullscreen);
  document.addEventListener('mozfullscreenchange', checkFullscreen);
  document.addEventListener('MSFullscreenChange', checkFullscreen);
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', handleKeyPress);
}

function removeKeyboardShortcuts() {
  document.removeEventListener('keydown', handleKeyPress);
}

function handleKeyPress(event) {
  // Don't trigger shortcuts if user is typing in an input
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }

  switch(event.key.toLowerCase()) {
    case 'n':
      event.preventDefault();
      playNextLesson();
      break;
    case 'p':
      event.preventDefault();
      playPreviousLesson();
      break;
    case 't':
      event.preventDefault();
      toggleTheaterMode();
      break;
    case 'l':
      event.preventDefault();
      showPlaylist.value = !showPlaylist.value;
      break;
    case '?':
      event.preventDefault();
      showShortcuts.value = true;
      break;
  }
}

// Watch for lesson completion
watch(() => videoStore.sessionData?.completed, (completed) => {
  if (completed && currentLesson.value) {
    // Mark lesson as completed
    const completedLessons = videoStore.completedLessons || [];
    if (!completedLessons.includes(currentLesson.value.id)) {
      completedLessons.push(currentLesson.value.id);
      videoStore.completedLessons = completedLessons;
    }

    // Auto-play next lesson if available
    if (hasNextLesson.value) {
      setTimeout(() => {
        $q.notify({
          type: 'positive',
          message: 'Lesson completed! 🎉',
          caption: 'Starting next lesson in 3 seconds...',
          position: 'top',
          timeout: 3000,
          actions: [
            { label: 'Skip', color: 'white', handler: () => playNextLesson() }
          ]
        });

        setTimeout(() => {
          playNextLesson();
        }, 3000);
      }, 1000);
    }
  }
});
</script>

<style scoped lang="scss">
.video-learning-page {
  background: #f5f5f5;
  min-height: 100vh;
  position: relative;
}

.theater-controls {
  position: fixed;
  top: 60px;
  right: 20px;
  z-index: 1000;
}

.theater-toggle {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
}

.video-learning-container {
  display: flex;
  gap: 0;
  max-width: 1920px;
  margin: 0 auto;
  transition: all 0.3s ease;

  &.theater-mode {
    max-width: 100%;

    .video-section {
      width: 100%;
      max-width: 100%;
    }
  }
}

.video-section {
  flex: 1;
  background: #000;
  transition: all 0.3s ease;

  &.theater-active {
    width: 100%;
  }
}

.lesson-info-bar {
  background: #1a1a1a;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  .lesson-details {
    flex: 1;

    .lesson-title {
      color: white;
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 500;
    }

    .lesson-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .quick-actions {
    display: flex;
    gap: 8px;
  }
}

.lesson-description-expand {
  background: #2a2a2a;
  color: white;

  :deep(.q-item__section--main) {
    color: white;
  }
}

.playlist-sidebar {
  width: 380px;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 50px);
  position: sticky;
  top: 50px;

  .playlist-header {
    padding: 16px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fafafa;

    .playlist-title {
      display: flex;
      align-items: center;
      font-weight: 600;
    }
  }

  .progress-overview {
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    .progress-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 12px;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-value {
          font-size: 24px;
          font-weight: bold;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.9;
        }
      }
    }
  }

  .playlist-scroll {
    flex: 1;
    height: calc(100vh - 300px);
  }

  .lesson-item {
    transition: all 0.2s ease;

    &:hover {
      background: #f5f5f5;
    }

    &.active-lesson {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
    }

    .lesson-item-title {
      font-weight: 500;
      color: #333;
    }

    .lesson-progress-container {
      margin-top: 4px;

      .lesson-progress-bar {
        border-radius: 2px;
        margin-bottom: 2px;
      }

      .lesson-progress-text {
        font-size: 11px;
        color: #ff9800;
        font-weight: 500;
      }
    }
  }

  .playlist-footer {
    padding: 12px;
    border-top: 1px solid #e0e0e0;
  }
}

// Animations
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

// Mobile Responsive
@media (max-width: 1024px) {
  .video-learning-container {
    flex-direction: column;
  }

  .playlist-sidebar {
    width: 100%;
    max-height: 400px;
    position: relative;
    top: 0;
    border-left: none;
    border-top: 1px solid #e0e0e0;

    .playlist-scroll {
      height: 300px;
    }
  }

  .lesson-info-bar {
    flex-direction: column;
    align-items: flex-start;

    .quick-actions {
      width: 100%;
      justify-content: space-around;
    }
  }
}

@media (max-width: 768px) {
  .theater-controls {
    top: 50px;
    right: 10px;
  }

  .lesson-info-bar {
    padding: 12px 16px;

    .lesson-title {
      font-size: 16px;
    }
  }

  .playlist-sidebar {
    .progress-overview {
      padding: 12px;

      .progress-stats {
        .stat-value {
          font-size: 20px;
        }
      }
    }
  }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  .video-learning-page {
    background: #121212;
  }

  .playlist-sidebar {
    background: #1e1e1e;
    border-left-color: #333;

    .playlist-header {
      background: #252525;
      border-bottom-color: #333;
    }

    .lesson-item {
      &:hover {
        background: #2a2a2a;
      }

      .lesson-item-title {
        color: #e0e0e0;
      }
    }

    .playlist-footer {
      border-top-color: #333;
    }
  }
}
</style>
