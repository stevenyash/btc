<template>
  <div class="video-js-container" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- Video.js Player -->
    <video
      ref="videoElement"
      class="video-js vjs-big-play-centered vjs-theme-btc"
      :class="{ 'vjs-fluid': fluid }"
      playsinline
    >
      <p class="vjs-no-js">
        To view this video please enable JavaScript, and consider upgrading to a
        web browser that supports HTML5 video
      </p>
    </video>

    <!-- Custom Overlay for Additional Controls -->
    <div class="custom-overlay" v-if="showCustomOverlay && player">
      <!-- Top Bar -->
      <div class="overlay-top" v-show="controlsVisible">
        <div class="lesson-title" v-if="title">{{ title }}</div>
        <div class="top-actions">
          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            @click="$emit('close')"
            class="close-btn"
          >
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Resume Banner -->
      <transition name="fade">
        <div class="resume-banner" v-if="showResumeBanner" @click="dismissResumeBanner">
          <q-icon name="play_circle" size="sm" class="q-mr-sm" />
          <span>Resuming from {{ formatTime(startTime) }}</span>
          <q-btn flat dense label="Start Over" @click.stop="startFromBeginning" class="q-ml-md" />
        </div>
      </transition>

      <!-- Buffering Indicator -->
      <div class="buffering-overlay" v-if="isBuffering">
        <q-spinner-dots size="60px" color="white" />
        <span class="buffering-text">Buffering...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Props
const props = defineProps({
  src: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  autoplay: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Number,
    default: 0
  },
  playbackRates: {
    type: Array,
    default: () => [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
  },
  fluid: {
    type: Boolean,
    default: true
  },
  responsive: {
    type: Boolean,
    default: true
  },
  aspectRatio: {
    type: String,
    default: '16:9'
  },
  preventDownload: {
    type: Boolean,
    default: true
  },
  showCustomOverlay: {
    type: Boolean,
    default: true
  },
  hotkeys: {
    type: Boolean,
    default: true
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
  'buffering',
  'buffering-end',
  'close',
  'fullscreen-change',
  'quality-change',
  'playback-rate-change'
]);

// Refs
const videoElement = ref(null);
const player = ref(null);
const isFullscreen = ref(false);
const isBuffering = ref(false);
const controlsVisible = ref(true);
const showResumeBanner = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const isPlaying = ref(false);

let controlsTimer = null;
let saveProgressInterval = null;

// Computed
const progressPercentage = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

// Initialize Video.js player
onMounted(() => {
  initializePlayer();
});

onUnmounted(() => {
  disposePlayer();
});

// Watch for source changes
watch(() => props.src, (newSrc) => {
  if (player.value && newSrc) {
    player.value.src({ src: newSrc, type: getVideoType(newSrc) });
    if (props.startTime > 0) {
      player.value.currentTime(props.startTime);
    }
  }
});

// Watch for start time changes
watch(() => props.startTime, (newTime) => {
  if (player.value && newTime > 0 && !isPlaying.value) {
    showResumeBanner.value = true;
    setTimeout(() => {
      showResumeBanner.value = false;
    }, 5000);
  }
});

function initializePlayer() {
  if (!videoElement.value) return;

  const options = {
    controls: true,
    autoplay: props.autoplay,
    preload: 'auto',
    fluid: props.fluid,
    responsive: props.responsive,
    aspectRatio: props.aspectRatio,
    playbackRates: props.playbackRates,
    poster: props.poster,

    // Control bar configuration
    controlBar: {
      children: [
        'playToggle',
        'volumePanel',
        'currentTimeDisplay',
        'timeDivider',
        'durationDisplay',
        'progressControl',
        'liveDisplay',
        'seekToLive',
        'remainingTimeDisplay',
        'customControlSpacer',
        'playbackRateMenuButton',
        'chaptersButton',
        'descriptionsButton',
        'subsCapsButton',
        'audioTrackButton',
        'pictureInPictureToggle',
        'fullscreenToggle'
      ],
      volumePanel: {
        inline: false
      }
    },

    // User actions
    userActions: {
      hotkeys: props.hotkeys ? {
        volumeStep: 0.1,
        seekStep: 5,
        enableModifiersForNumbers: false,
        enableNumbers: true,
        enableVolumeScroll: true,
        enableHoverScroll: true
      } : false
    },

    // HTML5 specific options
    html5: {
      vhs: {
        overrideNative: true
      },
      nativeVideoTracks: false,
      nativeAudioTracks: false,
      nativeTextTracks: false
    },

    // Sources
    sources: [{
      src: props.src,
      type: getVideoType(props.src)
    }]
  };

  // Create player
  player.value = videojs(videoElement.value, options, function onPlayerReady() {
    console.log('🎬 Video.js player is ready');

    // Set start time if provided
    if (props.startTime > 0) {
      this.currentTime(props.startTime);
      showResumeBanner.value = true;
      setTimeout(() => {
        showResumeBanner.value = false;
      }, 5000);
    }

    // Prevent right-click download
    if (props.preventDownload) {
      this.el().addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });
    }
  });

  // Event listeners
  setupEventListeners();
}

function setupEventListeners() {
  if (!player.value) return;

  // Play event
  player.value.on('play', () => {
    isPlaying.value = true;
    emit('play', { currentTime: player.value.currentTime() });
  });

  // Pause event
  player.value.on('pause', () => {
    isPlaying.value = false;
    emit('pause', { currentTime: player.value.currentTime() });
  });

  // Ended event
  player.value.on('ended', () => {
    isPlaying.value = false;
    emit('ended', {
      duration: player.value.duration(),
      completionPercentage: 100
    });
  });

  // Time update event
  player.value.on('timeupdate', () => {
    currentTime.value = player.value.currentTime();
    duration.value = player.value.duration();

    emit('timeupdate', {
      currentTime: currentTime.value,
      duration: duration.value,
      percentage: progressPercentage.value
    });
  });

  // Loaded metadata
  player.value.on('loadedmetadata', () => {
    duration.value = player.value.duration();
    emit('loaded', {
      duration: duration.value,
      videoWidth: player.value.videoWidth(),
      videoHeight: player.value.videoHeight()
    });
  });

  // Waiting (buffering)
  player.value.on('waiting', () => {
    isBuffering.value = true;
    emit('buffering');
  });

  // Can play (buffering ended)
  player.value.on('canplay', () => {
    isBuffering.value = false;
    emit('buffering-end');
  });

  // Error
  player.value.on('error', () => {
    const error = player.value.error();
    emit('error', {
      code: error?.code,
      message: error?.message || 'Unknown error'
    });
  });

  // Fullscreen change
  player.value.on('fullscreenchange', () => {
    isFullscreen.value = player.value.isFullscreen();
    emit('fullscreen-change', { isFullscreen: isFullscreen.value });
  });

  // Playback rate change
  player.value.on('ratechange', () => {
    emit('playback-rate-change', { rate: player.value.playbackRate() });
  });

  // User activity (for controls visibility)
  player.value.on('useractive', () => {
    controlsVisible.value = true;
  });

  player.value.on('userinactive', () => {
    if (isPlaying.value) {
      controlsVisible.value = false;
    }
  });
}

function disposePlayer() {
  if (player.value) {
    player.value.dispose();
    player.value = null;
  }

  if (controlsTimer) {
    clearTimeout(controlsTimer);
  }

  if (saveProgressInterval) {
    clearInterval(saveProgressInterval);
  }
}

function getVideoType(src) {
  if (!src) return 'video/mp4';

  if (src.includes('.m3u8') || src.includes('m3u8')) {
    return 'application/x-mpegURL';
  } else if (src.includes('.mpd')) {
    return 'application/dash+xml';
  } else if (src.includes('.webm')) {
    return 'video/webm';
  } else if (src.includes('.ogg') || src.includes('.ogv')) {
    return 'video/ogg';
  }
  return 'video/mp4';
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function dismissResumeBanner() {
  showResumeBanner.value = false;
}

function startFromBeginning() {
  if (player.value) {
    player.value.currentTime(0);
    showResumeBanner.value = false;
  }
}

// Public methods exposed to parent
function play() {
  if (player.value) {
    player.value.play();
  }
}

function pause() {
  if (player.value) {
    player.value.pause();
  }
}

function seekTo(time) {
  if (player.value) {
    player.value.currentTime(time);
  }
}

function setVolume(volume) {
  if (player.value) {
    player.value.volume(volume);
  }
}

function setPlaybackRate(rate) {
  if (player.value) {
    player.value.playbackRate(rate);
  }
}

function toggleFullscreen() {
  if (player.value) {
    if (player.value.isFullscreen()) {
      player.value.exitFullscreen();
    } else {
      player.value.requestFullscreen();
    }
  }
}

function getCurrentTime() {
  return player.value ? player.value.currentTime() : 0;
}

function getDuration() {
  return player.value ? player.value.duration() : 0;
}

function getIsPlaying() {
  return isPlaying.value;
}

// Expose methods
defineExpose({
  play,
  pause,
  seekTo,
  setVolume,
  setPlaybackRate,
  toggleFullscreen,
  getCurrentTime,
  getDuration,
  getIsPlaying,
  player: () => player.value
});
</script>

<style lang="scss">
// Video.js Theme Customization
.video-js-container {
  position: relative;
  width: 100%;
  background: #000;

  &.fullscreen-mode {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
  }
}

// Custom BTC Theme for Video.js
.vjs-theme-btc {
  // Big play button
  .vjs-big-play-button {
    background-color: rgba(0, 0, 0, 0.6);
    border: 2px solid #fff;
    border-radius: 50%;
    width: 80px;
    height: 80px;
    line-height: 76px;
    font-size: 40px;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--q-primary, #1976d2);
      border-color: var(--q-primary, #1976d2);
      transform: scale(1.1);
    }

    .vjs-icon-placeholder:before {
      font-size: 40px;
    }
  }

  // Control bar
  .vjs-control-bar {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    height: 50px;
    padding: 0 10px;
  }

  // Progress bar
  .vjs-progress-control {
    .vjs-progress-holder {
      height: 6px;

      &:hover {
        height: 10px;
      }
    }

    .vjs-play-progress {
      background: var(--q-primary, #1976d2);

      &:before {
        font-size: 14px;
        top: -4px;
      }
    }

    .vjs-load-progress {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  // Volume panel
  .vjs-volume-panel {
    .vjs-volume-bar {
      background: rgba(255, 255, 255, 0.3);
    }

    .vjs-volume-level {
      background: var(--q-primary, #1976d2);
    }
  }

  // Playback rate button
  .vjs-playback-rate {
    .vjs-playback-rate-value {
      font-size: 14px;
      line-height: 50px;
    }
  }

  // Time display
  .vjs-time-control {
    font-size: 13px;
    line-height: 50px;
    padding: 0 5px;
  }

  // Control buttons
  .vjs-control {
    width: 40px;

    &:hover {
      color: var(--q-primary, #1976d2);
    }
  }

  // Menu styling
  .vjs-menu {
    .vjs-menu-content {
      background: rgba(0, 0, 0, 0.9);
      border-radius: 4px;
    }

    .vjs-menu-item {
      padding: 8px 16px;

      &:hover,
      &.vjs-selected {
        background: var(--q-primary, #1976d2);
      }
    }
  }

  // Loading spinner
  .vjs-loading-spinner {
    border-color: var(--q-primary, #1976d2);

    &:before,
    &:after {
      border-top-color: var(--q-primary, #1976d2);
    }
  }
}

// Custom overlay styles
.custom-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;

  .overlay-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: linear-gradient(rgba(0, 0, 0, 0.7), transparent);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    pointer-events: auto;

    .lesson-title {
      color: white;
      font-size: 18px;
      font-weight: 500;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    }

    .top-actions {
      display: flex;
      gap: 8px;
    }
  }

  .resume-banner {
    position: absolute;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    pointer-events: auto;
    cursor: pointer;
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(0, 0, 0, 0.9);
    }
  }

  .buffering-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    .buffering-text {
      color: white;
      font-size: 14px;
    }
  }
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Responsive adjustments
@media (max-width: 768px) {
  .vjs-theme-btc {
    .vjs-big-play-button {
      width: 60px;
      height: 60px;
      line-height: 56px;
      font-size: 30px;

      .vjs-icon-placeholder:before {
        font-size: 30px;
      }
    }

    .vjs-control-bar {
      height: 40px;
    }

    .vjs-time-control {
      display: none;
    }

    .vjs-playback-rate {
      display: none;
    }
  }

  .custom-overlay {
    .overlay-top {
      padding: 10px;

      .lesson-title {
        font-size: 14px;
      }
    }

    .resume-banner {
      font-size: 13px;
      padding: 10px 16px;
    }
  }
}

// Picture-in-Picture styling
.video-js.vjs-pip-window {
  .vjs-control-bar {
    display: none;
  }
}

// Accessibility improvements
.video-js {
  &:focus {
    outline: 2px solid var(--q-primary, #1976d2);
    outline-offset: 2px;
  }

  .vjs-control:focus {
    outline: 2px solid var(--q-primary, #1976d2);
    outline-offset: -2px;
  }
}
</style>
