<template>
  <q-page class="learning-page bg-grey-2">
    <!-- Header Section -->
    <div class="page-header q-pa-md bg-white shadow-1">
      <div class="container">
        <div class="header-content row items-center q-col-gutter-md">
          <!-- Welcome Section -->
          <div class="col-md-5">
            <div class="welcome-section">
              <h2 class="welcome-title text-h5 text-weight-bold">Welcome to Your Lessons</h2>
              <p class="welcome-subtitle text-grey-7">Select a topic below to continue learning</p>
              <q-btn
                @click="goBackToAreas"
                icon="arrow_back"
                label="Back to Learning Areas"
                class="back-btn q-mt-sm"
                outline
                color="primary"
                size="sm"
              />
            </div>
          </div>

          <!-- Collection Title -->
          <div class="col-md-4 text-center">
            <h3 class="collection-title text-h4 text-primary text-weight-bold">
              {{ selectedArea?.name?.toUpperCase() || 'LESSONS' }}
            </h3>
          </div>

          <!-- Status Card -->
          <div class="col-md-3">
            <div class="status-card q-pa-sm bg-primary text-white rounded-borders shadow-2">
              <div class="text-center">
                <div class="active-users-label text-h6">Lesson Balance</div>
                <div class="active-users-count text-h4 q-mt-xs">{{ subscriberStore.lesson_balance }}</div>

                <!-- Subscription Status -->
                <div class="auth-alert q-mt-sm">
                  <div class="auth-message text-left">
                    <div class="text-weight-bold">Subscription:</div>
                    <div class="text-yellow-5 q-mt-xs" v-if="!subscriberStore.isAuthorized">
                      {{ subscriberStore.authMessage }}
                    </div>
                    <div class="text-positive q-mt-xs" v-else>
                      Active ({{ subscriberStore.lessons_viewed }}/{{ subscriberStore.total_lessons }} used)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Section -->
    <div class="page-content q-pa-md q-mt-md">
      <div class="container">
        <!-- Loading State -->
        <div v-if="loading" class="text-center q-my-xl">
          <q-spinner-cube color="primary" size="60px" />
          <p class="text-body1 text-grey-7 q-mt-md">Loading your lessons...</p>
          <q-linear-progress indeterminate color="primary" class="q-mt-md" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state text-center q-pa-xl">
          <q-icon name="error_outline" color="negative" size="xl" />
          <p class="text-h6 q-mt-md">Oops! Something went wrong</p>
          <p class="text-grey-7 q-mt-sm">{{ error }}</p>
          <q-btn
            color="primary"
            label="Try Again"
            @click="initializePageData"
            icon="refresh"
            class="q-mt-md"
          />
        </div>

        <!-- Content -->
        <template v-else>
          <!-- Payment Flow -->
          <div v-if="showMpesa" class="payment-flow q-mb-lg bg-white q-pa-md rounded-borders shadow-1">
            <h4 class="payment-title text-h5 q-mb-md">Payment Required</h4>
            <Mpesa
              :lesson_id="lesson_id"
              :amount="fee"
              @completed="handleCompleted"
            />
            <q-btn
              label="Cancel Payment"
              color="grey"
              outline
              class="cancel-payment-btn q-mt-md"
              @click="showMpesa = false"
            />
          </div>

          <!-- Lesson Browser -->
          <div v-else class="lesson-browser bg-white q-pa-md rounded-borders shadow-1">
            <div class="search-bar q-mb-md">
              <q-input
                v-model="search"
                placeholder="Search lessons by title or description..."
                outlined
                clearable
                debounce="300"
                class="rounded-input"
                dense
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
            </div>

            <!-- Lesson List -->
            <div v-if="filteredLessons.length">
              <q-table
                :rows="filteredLessons"
                :columns="columns"
                row-key="id"
                flat
                bordered
                class="lesson-table"
                :grid="$q.screen.lt.md"
                :pagination="pagination"
              >
                <template v-slot:body="props">
                  <q-tr :props="props" class="lesson-row">
                    <q-td>
                      <div class="lesson-title text-weight-medium">{{ props.row.title }}</div>
                      <div v-if="props.row.description" class="lesson-description text-grey-7 q-mt-xs">
                        {{ props.row.description }}
                      </div>
                      <!-- Access Status Badges -->
                      <div class="q-mt-xs">
                        <div v-if="isLessonActive(props.row.id)" class="active-badge text-positive">
                          <q-icon name="check_circle" size="xs" />
                          Active Lesson
                        </div>
                        <div v-else-if="hasCompletedWatchTime(props.row.id)" class="completed-badge text-grey">
                          <q-icon name="schedule" size="xs" />
                          Watch Time Completed
                        </div>
                        <div v-else-if="subscriberStore.isAuthorized" class="subscriber-badge text-primary">
                          <q-icon name="verified" size="xs" />
                          Subscriber Access
                        </div>
                      </div>
                    </q-td>

                    <q-td class="text-right">
                      <q-btn
                        v-if="canWatchLesson(props.row.id)"
                        label="Watch Now"
                        icon="play_circle"
                        color="primary"
                        @click="playVideo(props.row)"
                        class="action-btn"
                        unelevated
                      />
                      <q-btn
                        v-else-if="isGuestAuthenticated"
                        :label="`Unlock for Ksh ${fee}`"
                        icon="lock_open"
                        color="positive"
                        @click="pay(props.row.id)"
                        class="action-btn"
                        unelevated
                      />
                      <q-btn
                        v-else
                        :label="`Subscribe to Access`"
                        icon="lock"
                        color="grey"
                        @click="showSubscribeDialog(props.row)"
                        class="action-btn"
                        unelevated
                        disable
                      />
                    </q-td>
                  </q-tr>
                </template>

                <template v-slot:item="props">
                  <div class="q-pa-sm col-xs-12 col-sm-6 col-md-4">
                    <q-card class="lesson-card">
                      <q-card-section>
                        <div class="text-subtitle1 text-weight-bold">{{ props.row.title }}</div>
                        <div v-if="props.row.description" class="text-caption text-grey-7 q-mt-xs">
                          {{ props.row.description }}
                        </div>
                        <!-- Access Status Badges -->
                        <div class="q-mt-xs">
                          <div v-if="isLessonActive(props.row.id)" class="active-badge text-positive">
                            <q-icon name="check_circle" size="xs" />
                            Active Lesson
                          </div>
                          <div v-else-if="hasCompletedWatchTime(props.row.id)" class="completed-badge text-grey">
                            <q-icon name="schedule" size="xs" />
                            Watch Time Completed
                          </div>
                          <div v-else-if="subscriberStore.isAuthorized" class="subscriber-badge text-primary">
                            <q-icon name="verified" size="xs" />
                            Subscriber Access
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions align="right">
                        <q-btn
                          v-if="canWatchLesson(props.row.id)"
                          label="Watch Now"
                          icon="play_circle"
                          color="primary"
                          @click="playVideo(props.row)"
                          class="action-btn"
                          unelevated
                        />
                        <q-btn
                          v-else-if="isGuestAuthenticated"
                          :label="`Unlock (Ksh ${fee})`"
                          icon="lock_open"
                          color="positive"
                          @click="pay(props.row.id)"
                          class="action-btn"
                          unelevated
                        />
                        <q-btn
                          v-else
                          :label="`Subscribe`"
                          icon="lock"
                          color="grey"
                          @click="showSubscribeDialog(props.row)"
                          class="action-btn"
                          unelevated
                          disable
                        />
                      </q-card-actions>
                    </q-card>
                  </div>
                </template>
              </q-table>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state text-center q-pa-xl">
              <q-icon name="video_library" size="xl" color="grey-5" />
              <p class="empty-message text-h6 text-grey-7 q-mt-md">
                No lessons found in this area
              </p>
              <p class="text-grey-7 q-mt-sm">
                Try adjusting your search or check back later
              </p>
              <q-btn
                color="primary"
                label="Refresh"
                icon="refresh"
                @click="getLessons"
                class="q-mt-md"
                outline
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLearningHierarchyStore } from "src/stores/learningHierarchyStore";
import { useSubscribedStore } from "src/stores/subscribedStore";
import { ApiService } from 'src/services/api';
import Mpesa from "src/components/MpesaGuestPay.vue";
const loading = ref(true);
const error = ref(null);
const search = ref('');
const fee = ref(0);
const lesson_id = ref('');
const showMpesa = ref(false);

const pagination = ref({
  sortBy: 'title',
  descending: false,
  page: 1,
  rowsPerPage: 10
});

const router = useRouter();
const learningStore = useLearningHierarchyStore();
const subscriberStore = useSubscribedStore();

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

// Table columns
const columns = [
  {
    name: "title",
    label: "Lesson Title",
    align: "left",
    field: row => row.title,
    sortable: true
  },
  {
    name: "actions",
    label: "Actions",
    align: "right"
  }
];

// Computed properties
const selectedArea = computed(() => learningStore.selectedArea);
const currentLessons = computed(() => learningStore.currentData.lessons);
const activeLessonIds = computed(() => learningStore.activeLessonIds);
const activeLessonCount = computed(() => activeLessonIds.value.length);
const isGuestAuthenticated = computed(() => learningStore.isGuestAuthenticated);

// Filtered lessons
const filteredLessons = computed(() => {
  if (!currentLessons.value) return [];

  return currentLessons.value.filter((lesson) => {
    const searchTerm = search.value.toLowerCase();
    return (
      lesson.title.toLowerCase().includes(searchTerm) ||
      (lesson.description && lesson.description.toLowerCase().includes(searchTerm))
    );
  });
});

// Initialize component
onMounted(async () => {
  await initializePageData();
});

// Methods
async function initializePageData() {
  loading.value = true;
  error.value = null;

  try {
    // Check if we have a selected area
    if (!learningStore.selectedArea) {
      console.warn('No area selected, redirecting to areas');
      goBackToAreas();
      return;
    }

    // Initialize subscriber store and load lessons
    await Promise.all([
      subscriberStore.initialize(),
      getLessons(),
      getLessonFee()
    ]);

  } catch (err) {
    error.value = err.message || "Failed to load data. Please try again.";
    console.error("Initialization error:", err);
  } finally {
    loading.value = false;
  }
}

async function getLessons() {
  loading.value = true;
  try {
    await learningStore.fetchLessonsByArea(learningStore.selectedArea.id, false);
    console.log("Lessons loaded:", learningStore.currentData.lessons);
  } catch (err) {
    error.value = "Failed to load lessons. Please try again.";
    console.error("Error fetching lessons:", err);
  } finally {
    loading.value = false;
  }
}

async function getLessonFee() {
  try {
    const response = await ApiService.get(
      "components_data/lesson_setting",
      { params: { subscription_type: "subscribed" } }
    );
    fee.value = response.data.fee || 0;
  } catch (err) {
    console.error("Error fetching lesson fee:", err);
    fee.value = 0;
  }
}

function playVideo(lesson) {
  learningStore.selectLesson(lesson);
  router.push({ name: 'subscribedwatching' });
}

function pay(lessonId) {
  lesson_id.value = lessonId;
  showMpesa.value = true;
}

function handleCompleted(id) {
  showMpesa.value = false;
  learningStore.addActiveLesson(id);
  learningStore.setGuestMode(true);
  // Find and play the lesson
  const lesson = currentLessons.value.find(l => l.id === id);
  if (lesson) {
    playVideo(lesson);
  }
}

function goBackToAreas() {
  learningStore.clearSelectionFrom('area');
  router.push({ name: 'subscriberlessons' });
}

function isLessonActive(lessonId) {
  return learningStore.isLessonPrePaid(lessonId);
}

function hasCompletedWatchTime(lessonId) {
  // Implement logic to check if user has completed watch time for this lesson
  // This would need to integrate with your video tracking system
  return false; // Placeholder
}

function canWatchLesson(lessonId) {
  // User can watch if:
  // 1. They have an active subscription AND have lesson balance OR
  // 2. They have pre-paid for this specific lesson
  return (subscriberStore.isAuthorized && subscriberStore.lesson_balance > 0) ||
         isLessonActive(lessonId);
}

function showSubscribeDialog(lesson) {
  // You can implement subscription dialog here
  console.log('Show subscribe dialog for:', lesson);
}
</script>

<style scoped>
.learning-page {
  min-height: 100vh;
}

.page-header {
  border-radius: 8px;
  position: top;
  top: 0;
  z-index: 100;
}

/* Add this to ensure content is visible below the sticky header */
.page-content {
  padding-top: 20px; /* Default padding */
}

/* Add more space on mobile devices */
@media (max-width: 600px) {
  .page-content {
    padding-top: 120px; /* Adjust this value based on your header height */
  }
}

/* Rest of your existing styles */
.welcome-title {
  line-height: 1.3;
}

.back-btn {
  font-size: 0.875rem;
}

.status-card {
  border-left: 4px solid var(--q-positive);
}

.auth-alert {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 8px;
}

.lesson-table {
  border-radius: 8px;
}

.lesson-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.lesson-title {
  font-size: 1rem;
}

.lesson-description {
  font-size: 0.875rem;
}

.action-btn {
  font-size: 0.8125rem;
  padding: 4px 12px;
}

.empty-state, .error-state {
  border-radius: 8px;
  background-color: #f9f9f9;
}

.empty-message {
  font-size: 1rem;
}

.rounded-input {
  border-radius: 8px;
}

.lesson-card {
  transition: transform 0.2s;
  height: 100%;
}

.lesson-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.active-badge, .completed-badge, .subscriber-badge {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.active-badge {
  color: var(--q-positive);
}

.completed-badge {
  color: var(--q-grey);
}

.subscriber-badge {
  color: var(--q-primary);
}

.payment-title {
  color: var(--q-primary);
}

.cancel-payment-btn {
  font-size: 0.875rem;
}

@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
  }

  .welcome-section, .collection-title, .status-card {
    text-align: center;
    margin-bottom: 1rem;
  }

  .back-btn {
    margin: 0 auto;
  }
}
</style>
