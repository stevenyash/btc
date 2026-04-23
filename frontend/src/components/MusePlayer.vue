<template>
  <div>
    <div :id="containerId"></div>
    
    <!-- Network status alert -->
    <q-dialog v-model="showNetworkAlert" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="signal_wifi_off" size="md" class="q-mr-sm" />
          <span class="text-h6">Slow Network Detected</span>
        </q-card-section>

        <q-card-section>
          Your network connection seems slow ({{ networkSpeed }}). 
          Videos playback may be affected.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Continue Anyway" color="primary" v-close-popup />
          <q-btn flat label="Pause Videos" color="negative" @click="pauseVideo" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Floating Action Button -->
    <q-fab
      v-if="showFab"
      color="primary"
      icon="pause"
      direction="up"
      class="fixed bottom-4 right-4 z-top"
    >
      <q-fab-action color="negative" icon="fullscreen_exit" @click="exitFullscreen" />
      <q-fab-action color="accent" icon="pause" @click="pauseVideo" />
    </q-fab>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';

const props = defineProps({
  videoId: {
    type: String,
    required: true,
  },
  width: {
    type: [Number, String],
    default: 400,
  },
  height: {
    type: [Number, String],
    default: 'auto',
  },
  autoplay: {
    type: [Boolean, String],
    default: false,
  },
  loop: {
    type: Boolean,
    default: false,
  },
  playerOptions: {
    type: Object,
    default: () => ({}),
  },
  controlls: {
    type: Array,
    default: ["-fullscreen"]
  },
  // Add threshold for slow network (in Mbps)
  slowNetworkThreshold: {
    type: Number,
    default: 1.5 // 1.5 Mbps
  }
});

const emit = defineEmits(['metadata', 'timeupdate', 'play', 'pause', 'ended', 'networkSlow']);

const containerId = computed(() => `muse-player-${Math.random().toString(36).substring(2, 15)}`);
const player = ref(null);
const isScriptLoaded = ref(false);
const showNetworkAlert = ref(false);
const networkSpeed = ref('0 Mbps');
const speedTestInterval = ref(null);
const showFab = ref(false);

// Network speed detection
const checkNetworkSpeed = async () => {
  try {
    // Simple network speed test by downloading a small file
    const startTime = performance.now();
    const fileSize = 500000; // 500KB test file
    const testUrl = `https://httpbin.org/bytes/${fileSize}?${Math.random()}`;
    
    const response = await fetch(testUrl);
    await response.arrayBuffer();
    
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    const bitsLoaded = fileSize * 8;
    const speedMbps = (bitsLoaded / (1024 * 1024) / duration).toFixed(2);
    
    networkSpeed.value = `${speedMbps} Mbps`;
    
    if (speedMbps < props.slowNetworkThreshold) {
      showNetworkAlert.value = true;
      emit('networkSlow', speedMbps);
    }
  } catch (error) {
    console.error('Network speed test failed:', error);
    networkSpeed.value = 'Unknown';
  }
};

// Initialize MusePlayer
const initializePlayer = () => {
  const container = document.getElementById(containerId.value);

  if (!container) {
    console.error(`MusePlayer container #${containerId.value} not found.`);
    return;
  }

  try {
    player.value = MusePlayer({
      container: `#${containerId.value}`,
      video: props.videoId,
      width: props.width,
      height: props.height,
      autoplay: props.autoplay,
      loop: props.loop,
      resume: true,
      logo: false,
      search: false,
      ...props.playerOptions,
      ...props.controlls
    });

    if (player.value) {
      player.value.on('metadata', (metadata) => emit('metadata', metadata));
      player.value.on('timeupdate', (time) => emit('timeupdate', time));
      player.value.on('play', () => {
        emit('play');
        showFab.value = true;
        
        // Start periodic network checks while video is playing
        speedTestInterval.value = setInterval(checkNetworkSpeed, 30000); // Check every 30 seconds
        
        // Request fullscreen on play
        if (container.requestFullscreen) {
          container.requestFullscreen().catch(err => {
            console.warn('Fullscreen request failed:', err);
          });
        }
      });

      player.value.on('pause', () => {
        emit('pause');
        showFab.value = false;
        clearInterval(speedTestInterval.value);
      });
      
      player.value.on('ended', () => {
        emit('ended');
        showFab.value = false;
        clearInterval(speedTestInterval.value);
      });

      // Initial network check
      checkNetworkSpeed();
    } else {
      console.error('MusePlayer instance was not created.');
    }
  } catch (error) {
    console.error('Failed to initialize MusePlayer:', error);
  }
};

const pauseVideo = () => {
  if (player.value) {
    player.value.pause();
  }
};

const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen(); // Safari
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen(); // IE
  }
};

// Load script and initialize the player
onMounted(() => {
  const scriptSrc = 'https://muse.ai/static/js/embed-player.min.js';

  if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.onload = async () => {
      isScriptLoaded.value = true;
      await nextTick();
      initializePlayer();
    };
    document.body.appendChild(script);
  } else {
    isScriptLoaded.value = true;
    nextTick(initializePlayer);
  }
});

// Cleanup on unmount
onUnmounted(() => {
  if (player.value) {
    player.value.off('metadata');
    player.value.off('timeupdate');
    player.value.off('play');
    player.value.off('pause');
    player.value.off('ended');
    player.value = null;
  }
  
  clearInterval(speedTestInterval.value);
});
</script>