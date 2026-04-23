<template>
    <q-page>
      <q-card flat class="q-pa-md">
        <!-- Polling Control Buttons -->
        <q-btn label="Start Polling" @click="startPolling" color="primary" :disabled="isPolling" />
        <q-btn label="Stop Polling" @click="stopPolling" color="negative" class="q-ml-sm" :disabled="!isPolling" />
        
        <!-- Loading and Error Handling -->
        <div v-if="isLoading" class="q-mt-md">
          <q-spinner-dots size="30px" />
        </div>
        <div v-if="error" class="q-mt-md text-negative">
          <q-banner class="bg-negative text-white">
            <span>{{ error }}</span>
          </q-banner>
        </div>
        
        <!-- Active Users List -->
        <div class="q-mt-md">
          <q-list bordered v-if="!isLoading && !error">
            <q-item v-for="(user, index) in activeUsers" :key="index">
              <q-item-section>{{ user.username }}</q-item-section>
              <q-item-section>{{ user.status }}</q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card>
    </q-page>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
  import { useActiveUsersStore } from 'src/stores/activeUsers';
  import { QSpinnerDots, QBanner } from 'quasar';
  
  const activeUsersStore = useActiveUsersStore();
  
  // Destructure the functions and state
  const { activeUsers, startPolling, stopPolling, isActivePage } = activeUsersStore;
  
  const isLoading = ref(false);
  const error = ref(null);
  const isPolling = ref(false); // Track polling status
  
  // Fetch active users with error handling
  const fetchActiveUsers = async () => {
    isLoading.value = true;
    error.value = null;
  
    try {
      await activeUsersStore.fetchActiveUsers();
    } catch (err) {
      error.value = 'Failed to fetch active users';
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  };
  
  // Watch for visibility changes and adjust polling accordingly
  const handleVisibilityChange = () => {
    if (document.hidden) {
      stopPolling();
    } else {
      startPolling();
    }
  };
  
  // Setup visibility change listener
  onMounted(() => {
    // Start polling and listen for visibility changes
    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    fetchActiveUsers();
  });
  
  // Cleanup on component unmount
  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    stopPolling();
  });
  
  watch(isActivePage, (newValue) => {
    if (newValue) {
      startPolling();
    } else {
      stopPolling();
    }
  });
  
  </script>
  
  <style scoped>
  .q-btn {
    min-width: 100px;
  }
  </style>
  