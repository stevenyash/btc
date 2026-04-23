<template>
    <q-page class="main-page">
      <!-- Guest View -->
      <q-card :flat="isSubPage" class="page-section q-pa-md nice-shadow-6 welcome-card" v-if="!auth.isLoggedIn">
        <div class="container-fluid">
          <div class="row q-col-gutter-x-md">
            <div class="col comp-grid">
              <div class="text-h4 text-bold text-primary welcome-heading">
                Welcome to Digital Learning!
              </div>
              <div class="text-subtitle1 q-mt-sm">
                Discover exciting courses tailored just for you
              </div>

              <div v-if="!showLevels" class="q-mt-md">
                <q-btn
                  @click="showLevels=true"
                  icon="arrow_back"
                  label="Back to all levels"
                  color="secondary"
                  rounded
                />
              </div>
            </div>

            <div class="col-12 comp-grid q-mt-lg">
              <div v-if="showLevels">
                <div class="text-center q-mb-lg">
                  <q-icon name="school" size="md" color="primary" class="q-mr-sm"/>
                  <span class="text-h4 text-primary">Choose Your Learning Path</span>
                  <p class="text-subtitle1 text-grey-7">Select a level that matches your current knowledge</p>
                </div>

                <q-list bordered class="rounded-borders level-list">
                  <q-item
                    v-for="(level, index) in filteredLevels"
                    :key="index"
                    class="q-mb-sm level-item"
                    bordered
                  >
                    <q-item-section>
                      <q-item-label class="text-h6 text-weight-medium">{{ level.name }}</q-item-label>
                      <q-item-label caption class="text-grey-8">
                        {{ level.description || "Start your learning journey here!" }}
                        <span v-if="isDisabledLevel(level.name)" class="text-negative q-ml-sm">
                          (Coming Soon)
                        </span>
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-btn
                        label="Go To class"
                        color="primary"
                        icon-right="arrow_forward"
                        @click="viewLevelDetails(level)"
                        rounded
                        unelevated
                        :disable="isDisabledLevel(level.name)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div v-if="!showLevels">
                <GuestLevelView />
              </div>
            </div>
          </div>
        </div>
      </q-card>

      <!-- Logged-in User View -->
      <q-card :flat="isSubPage" class="page-section q-mb-md nice-shadow-6 welcome-card" v-if="auth.isLoggedIn">
        <div class="container-fluid">
          <div class="row q-col-gutter-x-md">
            <div class="col comp-grid">
              <div class="text-h4 text-bold text-primary welcome-heading">
                Welcome back, {{ auth.userName }}!
              </div>
              <div class="text-subtitle1 q-mt-sm">
                Continue your learning adventure
              </div>

              <div v-if="!showLevels" class="q-mt-md">
                <q-btn
                  @click="showLevels=true"
                  icon="arrow_back"
                  label="Back to all levels"
                  color="secondary"
                  rounded
                />
              </div>
            </div>

            <div class="col-12 comp-grid q-mt-lg">
              <q-card class="level-container">
                <div v-if="showLevels">
                  <div class="text-center q-mb-lg">
                    <q-icon name="auto_awesome" size="md" color="primary" class="q-mr-sm"/>
                    <span class="text-h4 text-primary">Your Learning Options</span>
                    <p class="text-subtitle1 text-grey-7">Pick up where you left off or try something new</p>
                  </div>

                  <q-list bordered class="rounded-borders level-list">

                    <q-item
                      v-for="(level, index) in filteredLevels"
                      :key="index"
                      class="q-mb-sm level-item"
                      bordered
                    >
                      <q-item-section>
                        <q-item-label class="text-h6 text-weight-medium">{{ level.name }}</q-item-label>
                        <q-item-label caption class="text-grey-8">
                          {{ level.description || "Expand your knowledge with this course" }}
                          <span v-if="isDisabledLevel(level.name)" class="text-negative q-ml-sm">
                            (Coming Soon)
                          </span>
                        </q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <q-btn
                          label="Continue"
                          color="primary"
                          icon-right="arrow_forward"
                          @click="viewLevelDetails(level)"
                          rounded
                          unelevated
                          :disable="isDisabledLevel(level.name)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <div v-if="!showLevels">
                  <SubscriberLevelView />
                </div>
              </q-card>
            </div>
          </div>
        </div>
      </q-card>

      <q-separator class="q-my-sm"></q-separator>
    </q-page>
  </template>

  <script setup>
  import { computed, ref, onMounted } from 'vue';
  import { useApp } from 'src/composables/app.js';
  import { useAuth } from 'src/composables/auth';
  import { useRoute } from 'vue-router';
import GuestLevelView from "src/pages/collections/guestview.vue";
import SubscriberLevelView from "src/pages/collections/subscriberview.vue";
  import { useLearningHierarchyStore } from "src/stores/learningHierarchyStore";
  import { ApiService } from 'src/services/api';

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
  const auth = useAuth();
  const pageReady = ref(true);
  const filteredlevel = ref('');
  const learningStore = useLearningHierarchyStore();
  const route = useRoute();
  const showLevels = ref(true);
  const showView = ref(false);
  const levelGradeCounts = ref({});

const filteredLevels = computed(() => {
    if (!filteredlevel.value) {
        return learningStore.currentData.levels;
    }

    // Flexible matching to handle typos and variations
    return learningStore.currentData.levels.filter(level => {
        const filterLower = filteredlevel.value.toLowerCase();
        const levelNameLower = level.name.toLowerCase();

        // Exact or partial match
        if (levelNameLower.includes(filterLower) || filterLower.includes(levelNameLower)) {
            return true;
        }

        // Match by keywords (handles typos like "Jecondary" vs "Secondary")
        if (filterLower.includes('senior') && levelNameLower.includes('senior')) return true;
        if (filterLower.includes('junior') && levelNameLower.includes('junior')) return true;
        if (filterLower.includes('general') && levelNameLower.includes('general')) return true;
        if (filterLower.includes('elementary') && levelNameLower.includes('general')) return true;

        return false;
    });
});

  // Function to check if a level should be disabled (has no grades or is in disabled list)
  const isDisabledLevel = (levelName) => {
    // First check hardcoded disabled levels
    const disabledLevels = ['ECDE', 'Basic', 'ecde', 'basic'];
    if (disabledLevels.includes(levelName)) {
      return true;
    }

    // Then check if level has no grades (dynamically)
    const level = learningStore.currentData.levels.find(l => l.name === levelName);
    if (level && levelGradeCounts.value[level.level_id] !== undefined) {
      return levelGradeCounts.value[level.level_id] === 0;
    }

    return false;
  };

  // Fetch grade counts for all levels
  const fetchLevelGradeCounts = async () => {
    const levels = learningStore.currentData.levels;
    for (const level of levels) {
      try {
        const response = await ApiService.get(`grades/index/level_id/${level.level_id}`);
        const grades = response.data?.records || [];
        levelGradeCounts.value[level.level_id] = grades.length;
      } catch (error) {
        console.error(`Error fetching grades for level ${level.name}:`, error);
        levelGradeCounts.value[level.level_id] = 0;
      }
    }
  };

  onMounted(async () => {
    if (route.query.showView) {
      showLevels.value = false;
      showView.value = route.query.showView;
    }
    if (route.query.level) {
      filteredlevel.value = route.query.level;
    }
    await learningStore.fetchLearningLevels();
    console.log("learningStore.currentData", learningStore.currentData);

    // Fetch grade counts for all levels to determine which are empty
    await fetchLevelGradeCounts();
    console.log("Level grade counts:", levelGradeCounts.value);
  });

  function viewLevelDetails(level) {
    learningStore.selectLevel(level);
    showLevels.value = false;
    showView.value = true;
  }
  </script>

  <style scoped>
  .welcome-card {
    border-radius: 12px;
    background: linear-gradient(to bottom, #f8f9fa, #ffffff);
  }

  .welcome-heading {
    color: #1976d2;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
  }

  .level-list {
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .level-item {
    transition: all 0.3s ease;
    border-radius: 8px;
  }

  .level-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .level-container {
    border-radius: 12px;
    overflow: hidden;
  }

  /* Style for disabled items */
  .level-item .q-item__label--caption .text-negative {
    font-weight: 500;
  }
  </style>
