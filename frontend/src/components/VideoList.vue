<template>
    <q-page class="q-pa-md">
      <!-- Loading State -->
      <div v-if="loading" class="text-center q-my-md">
        <q-spinner size="30px" color="primary" />
        <p>Loading videos, please wait...</p>
      </div>
  
      <!-- Error State -->
      <div v-else-if="error" class="text-center text-negative q-my-md">
        <p>{{ error }}</p>
      </div>
  
      <!-- Videos List -->
      <div v-else>
        <h4 class="text-center q-mb-lg">Available Videos</h4>
        <div class="q-gutter-md row justify-center">
          <q-card
            v-for="(video, index) in paginatedVideos"
            :key="index"
            flat
            bordered
            class="col-12 col-md-4 col-lg-3"
          >
            <q-img
              :src="video.thumbnail || 'https://via.placeholder.com/300x180?text=No+Image'"
              alt="Videos Thumbnail"
              class="rounded-borders"
            />
            <q-card-section>
              <div class="text-h6">{{ video.title }}</div>
              <div class="text-caption">{{ formatDuration(video.duration) }}</div>
            </q-card-section>
            <q-card-actions align="center">
              <q-btn
                :to="video.url"
                label="Watch Now"
                color="primary"
                unelevated
              />
            </q-card-actions>
          </q-card>
        </div>
  
        <!-- Pagination Controls -->
        <div class="row justify-center q-mt-md">
          <q-pagination
            v-model="currentPage"
            :max="totalPages"
            boundary-numbers
            @update:model-value="onPageChange"
          />
        </div>
      </div>
    </q-page>
  </template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { ApiService } from 'src/services/api'; // Update this path based on your project structure

// Reactive state variables
const videos = ref([]);
const loading = ref(false);
const error = ref(null);
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Fetch videos on component mount
onMounted(async () => {
  await fetchVideos();
});

// Fetch videos from the API
async function fetchVideos() {
  loading.value = true;
  error.value = null;

  try {
    const response = await ApiService.get('components_data/listvideos');
console.log(response)
    // Check if response.data is an array
    if (Array.isArray(response.data.data)) {
      videos.value = response.data.data; // Assign array to videos
    } else {
      throw new Error('Invalid data format. Expected an array.');
    }
  } catch (e) {
    console.error('Error fetching videos:', e);
    error.value = 'Failed to load videos. Please try again later.';
  } finally {
    loading.value = false;
  }
}

// Pagination logic
const totalPages = computed(() => Math.ceil(videos.value.length / itemsPerPage.value));

const paginatedVideos = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return videos.value?.slice(start, end);
});

const onPageChange = (page) => {
  currentPage.value = page;
};

// Helper to format video duration
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}
</script>
<style scoped>
.q-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.q-card:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.q-img {
  height: 180px;
  object-fit: cover;
}
</style>
  