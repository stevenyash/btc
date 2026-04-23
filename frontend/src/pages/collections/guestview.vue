<template>
    <div>
      <!-- Collection Header Section -->
      <div class="row items-center q-py-md">
        <div class="col">
          <h4 class="text-h5 text-primary">{{ currentLevel?.name?.toUpperCase() }}</h4>
        </div>
      </div>

      <!-- Display Sub-Collections -->
      <div v-if="filteredCollections.length > 0" class="row q-gutter-md">
        <q-card
          v-for="item in filteredCollections"
          :key="item.id"
          flat
          bordered
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <q-card-section class="bg-grey-1">
            <div class="text-body1 text-primary q-mb-xs">{{ item.name }}</div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn label="Go to subjects" icon="visibility" color="primary" flat @click="viewGrade(item)" />
          </q-card-actions>
        </q-card>
      </div>

      <!-- No Sub-Collections -->
      <div v-else class="text-center q-my-md">
        <q-icon name="folder_open" size="64px" color="grey-5" />
        <p class="text-body2 text-grey-6">Coming Soon.....</p>
      </div>
    </div>
  </template>

  <script setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import { useQuasar } from 'quasar';
  import { useRouter } from "vue-router";
  import { useLearningHierarchyStore } from "src/stores/learningHierarchyStore";

  const learningStore = useLearningHierarchyStore();
  const router = useRouter();
  const $q = useQuasar();

  const loading = ref(false);

  // Computed properties
  const currentLevel = computed(() => learningStore.selectedLevel);
  const filteredCollections = computed(() => learningStore.currentData.grades);

  onMounted(() => {
    initializeComponent();
  });

  // Watch for selected level changes and load grades
  watch(
    () => learningStore.selectedLevel,
    (newLevel) => {
      if (newLevel) {
        loadGradesForLevel(newLevel.level_id);
      }
    },
    { immediate: true }
  );

  async function initializeComponent() {
    loading.value = true;
    try {
      // If we have a selected level, load its grades
      if (learningStore.selectedLevel) {
        await loadGradesForLevel(learningStore.selectedLevel.level_id);
      } else {
        // If no level is selected, this might be a direct navigation
        // We could redirect to home or handle appropriately
        console.warn('No learning level selected');
      }
    } catch (error) {
      console.error('Error initializing component:', error);
      $q.notify({
        color: 'negative',
        message: 'Failed to load learning data',
        icon: 'error'
      });
    } finally {
      loading.value = false;
    }
  }

  async function loadGradesForLevel(levelId) {
    try {
      await learningStore.fetchGradesByLevel(levelId, false); // false = don't show loading
    } catch (error) {
      console.error('Error loading grades:', error);
      // Error handling is already done in the store
    }
  }

  function viewGrade(grade) {
    learningStore.selectGrade(grade);
    router.push({ name: 'guestlessons' });
  }
  </script>

  <style scoped>
  .text-body2 {
    font-weight: 500;
    margin-bottom: 2px;
  }
  </style>
