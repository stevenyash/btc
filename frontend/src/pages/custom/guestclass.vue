<template>
  <q-page class="main-page">
    <!-- Welcome Section -->
    <section class="page-section q-pa-md welcome-section">
      <div class="container-fluid">
        <div class="row items-center q-col-gutter-md">
          <div class="col-xs-12 col-sm-8 comp-grid">
            <div class="text-h4 text-primary text-weight-bold">
              Welcome to Your Lessons
              <div class="text-subtitle1 text-grey-7">
                Choose your topic to continue learning
              </div>
            </div>
          </div>

          <div class="col-xs-12 col-sm-4">
            <q-btn
              @click="goBackToSubjects"
              icon="arrow_back"
              label="Back to subjects"
              color="grey-7"
              flat
              rounded
              class="back-button full-width-mobile"
            />
          </div>
        </div>

        <div class="row q-mt-sm">
          <div class="col-12">
            <h4 class="text-h5 text-primary text-center q-my-md">
              {{ currentArea?.name?.toUpperCase() || 'Available Lessons' }}
            </h4>
          </div>
        </div>
      </div>
    </section>

    <!-- Phone Verification Section -->
    <section class="page-section q-mb-md" v-if="!learningStore.guestPhone">
      <div class="container-fluid">
        <div class="row justify-center">
          <div class="col-md-8 col-12">
            <q-card flat bordered class="verification-card">
              <q-card-section>
                <div class="text-h6 text-center text-primary q-mb-md">
                  <q-icon name="verified" size="md" class="q-mr-sm" />
                  Already Paid? Verify Your Access
                </div>

                <div class="q-gutter-y-md">
                  <q-input
                    filled
                    v-model="phonesearch"
                    label="Enter your phone number (e.g. 254712345678)"
                    type="tel"
                    mask="### #########"
                    unmasked-value
                    :rules="[val => val && val.length >= 12 || 'Please enter a valid phone number']"
                  >
                    <template v-slot:append>
                      <q-btn
                        icon="search"
                        color="primary"
                        @click="phoneSearch()"
                        :disable="!phonesearch || phonesearch.length < 12"
                        dense
                        label="click to search"
                      />
                    </template>
                  </q-input>

                  <div class="text-caption text-grey-7 text-center">
                    Enter the phone number you used for payment to access your lessons
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Guest Info Section (when verified) -->
    <section class="page-section q-mb-md" v-if="learningStore.guestPhone">
      <div class="container-fluid">
        <div class="row justify-center">
          <div class="col-md-8 col-12">
            <q-card flat bordered class="bg-positive-1">
              <q-card-section class="q-pa-sm">
                <div class="row items-center">
                  <div class="col-auto">
                    <q-icon name="verified_user" color="positive" size="sm" />
                  </div>
                  <div class="col">
                    <div class="text-caption text-weight-medium">
                      Verified: {{ learningStore.guestPhone }}
                      <span class="text-green" v-if="learningStore.activeLessonIds.length > 0">
                        • {{ learningStore.activeLessonIds.length }} active lesson(s)
                      </span>
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      icon="logout"
                      color="grey-7"
                      size="sm"
                      flat
                      dense
                      @click="clearGuestData"
                      label="Sign Out"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Search and Filter Section -->
    <section class="page-section q-mb-md" v-if="lessons.length">
      <div class="container-fluid">
        <div class="row justify-end">
          <div class="col-md-4 col-sm-6 col-12">
            <q-input
              v-model="searchQuery"
              outlined
              dense
              placeholder="Search lessons..."
              clearable
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>
      </div>
    </section>

    <!-- Lessons Section -->
    <section class="page-section q-mb-lg">
      <div class="container-fluid">
        <template v-if="showMpesa">
          <div class="row justify-center">
            <div class="col-md-6 col-12">
              <q-card class="payment-card">
                <q-card-section>
                  <Mpesa
                    :lesson_id="currentLessonId"
                    :amount="fee"
                    @completed="handleCompleted"
                    :phone-number="learningStore.guestPhone || LocalStorage.getItem('btcphone')"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>
        </template>

        <template v-else>
          <!-- Desktop Table View -->
          <div class="gt-sm">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <template v-if="filteredLessons.length">
                  <q-table
                    :rows="filteredLessons"
                    :columns="columns"
                    row-key="id"
                    flat
                    class="lesson-table"
                    :pagination="{ rowsPerPage: 10 }"
                  >
                    <template v-slot:body="props">
                      <q-tr :props="props" class="lesson-row">
                        <q-td>
                          <div class="text-weight-medium">
                            {{ props.row.title }}
                            <q-badge
                              v-if="learningStore.isLessonPrePaid(props.row.id)"
                              color="positive"
                              class="q-ml-sm"
                            >
                              PREMIUM
                            </q-badge>
                          </div>
                          <div class="text-caption text-grey-7">
                            {{ props.row.description || 'No description available' }}
                          </div>
                        </q-td>

                        <q-td auto-width>
                          <div class="flex justify-end">

                            <q-btn
                              v-if="learningStore.isLessonPrePaid(props.row.id)"
                              label="Watch Now"
                              icon="play_circle"
                              color="positive"
                              @click="playVideo(props.row)"
                              rounded
                              unelevated
                              class="q-mr-sm"
                            />
                            <q-btn
                              v-else
                              :label="`Pay Ksh ${fee}`"
                              icon="lock_open"
                              color="primary"
                              @click="pay(props.row)"
                              rounded
                              unelevated
                            />
                          </div>
                        </q-td>
                      </q-tr>
                    </template>

                    <template v-slot:no-data>
                      <div class="full-width row flex-center text-grey q-gutter-sm">
                        <q-icon name="warning" size="2em" />
                        <span>No matching lessons found</span>
                      </div>
                    </template>
                  </q-table>
                </template>

                <template v-else>
                  <q-banner rounded class="bg-grey-3 text-center">
                    <template v-slot:avatar>
                      <q-icon name="info" color="grey" />
                    </template>
                    No lessons available for this topic yet. Please check back later.
                  </q-banner>
                </template>
              </div>
            </div>
          </div>

          <!-- Mobile Grid View -->
          <div class="lt-md">
            <div class="row q-col-gutter-md">
              <template v-if="filteredLessons.length">
                <div
                  v-for="lesson in filteredLessons"
                  :key="lesson.id"
                  class="col-12 col-sm-6"
                >
                  <q-card class="lesson-card q-mb-sm">
                    <q-card-section>
                      <div class="text-h6 text-weight-medium">
                        {{ lesson.title }}
                        <q-badge
                          v-if="learningStore.isLessonPrePaid(lesson.id)"
                          color="positive"
                          class="q-ml-sm"
                        >
                          PREMIUM
                        </q-badge>
                      </div>
                      <div class="text-caption text-grey-7 q-mt-xs q-mb-md">
                        {{ lesson.description || 'No description available' }}
                      </div>

                      <div class="flex justify-end">
                        <q-btn
                          v-if="learningStore.isLessonPrePaid(lesson.id)"
                          label="Watch Now"
                          icon="play_circle"
                          color="positive"
                          @click="playVideo(lesson)"
                          rounded
                          unelevated
                          class="full-width"
                        />
                        <q-btn
                          v-else
                          :label="`Pay Ksh ${fee}`"
                          icon="lock_open"
                          color="primary"
                          @click="pay(lesson)"
                          rounded
                          unelevated
                          class="full-width"
                        />
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </template>

              <template v-else>
                <div class="col-12">
                  <q-banner rounded class="bg-grey-3 text-center">
                    <template v-slot:avatar>
                      <q-icon name="info" color="grey" />
                    </template>
                    No lessons available for this topic yet. Please check back later.
                  </q-banner>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ApiService } from 'src/services/api';
import { useApp } from 'src/composables/app.js';
import { useAuth } from 'src/composables/auth';
import { useLearningHierarchyStore } from "src/stores/learningHierarchyStore";
import Mpesa from "src/components/MpesaGuestPay.vue";
import { retrieveFingerprint } from "src/fingerprint"
import { LocalStorage, Notify } from 'quasar';

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
const router = useRouter();
const learningStore = useLearningHierarchyStore();
const pageReady = ref(true);

const lessons = ref([]);
const fee = ref(1);
const currentLessonId = ref('');
const showMpesa = ref(false);
const phonesearch = ref("254");
const searchQuery = ref('');

// Computed properties
const currentArea = computed(() => learningStore.selectedArea);
const filteredLessons = computed(() => {
  if (!lessons.value.length) return [];

  return lessons.value.filter(lesson => {
    const searchTerm = searchQuery.value.toLowerCase();
    return (
      lesson.title.toLowerCase().includes(searchTerm) ||
      (lesson.description && lesson.description.toLowerCase().includes(searchTerm))
    );
  });
});

const columns = computed(() => [
  { name: "title", label: "Lesson Title", align: "left", field: "title" },
  { name: "actions", label: "Actions", align: "right" }
]);

onMounted(async () => {
  await retrieveFingerprint();
  initializeComponent();

  // Check if we have guest data and refresh it
  if (learningStore.guestPhone) {
    await learningStore.getGuest();
  }
});

// Watch for selected area changes
watch(
  () => learningStore.selectedArea,
  (newArea) => {
    if (newArea) {
      loadLessonsForArea(newArea.id);
    }
  },
  { immediate: true }
);

async function initializeComponent() {
  try {
    // If we have a selected area, load its lessons
    if (learningStore.selectedArea) {
      await loadLessonsForArea(learningStore.selectedArea.id);
      await getLessonFee();
    } else {
      // If no area is selected, redirect to subjects
      console.warn('No learning area selected, redirecting to subjects');
      goBackToSubjects();
    }
  } catch (error) {
    console.error('Error initializing component:', error);
  }
}

async function loadLessonsForArea(areaId) {
  try {
    const lessonsData = await learningStore.fetchLessonsByArea(areaId, false);
    lessons.value = lessonsData || [];
  //  console.log('Loaded lessons:', lessons.value.length);
  } catch (error) {
   // console.error('Error loading lessons:', error);
    lessons.value = [];
  }
}

async function getLessonFee() {
  try {
    const response = await ApiService.get("components_data/lesson_setting", {params: {subscription_type: "non_subscribed"}});
    console.log("Lesson fee response:", response);
    fee.value = response.data.fee || 1;
  } catch(e) {
    console.error(e);
    fee.value = 1; // Default fee
  }
}

async function phoneSearch() {
  if(phonesearch.value && phonesearch.value.length >= 12) {
    try {
      await learningStore.getGuest(phonesearch.value);
      // Refresh lessons to update authorization status
      if (learningStore.selectedArea) {
        await loadLessonsForArea(learningStore.selectedArea.id);
      }
      Notify.create({
        type: 'positive',
        message: 'Phone verification successful!',
      });
    } catch (error) {
      console.error('Phone verification failed:', error);
    }
  }
}

function playVideo(lesson) {
  learningStore.selectLesson(lesson);
  router.push({
    name: 'guestwatching',
    query: {
      lessonId: lesson.id,
      title: lesson.title
    }
  });
}

function pay(lesson) {
  // Check if user is verified
  if (!learningStore.guestPhone) {
    Notify.create({
      type: 'warning',
      message: 'Please verify your phone number first',
    });
    return;
  }

  showMpesa.value = true;
  currentLessonId.value = lesson.id;
}

async function handleCompleted(lessonId) {
  showMpesa.value = false;

  // Refresh guest data to get updated active lessons
  if (learningStore.guestPhone) {
    await learningStore.getGuest();
  }

  // Find the lesson and play it
  const lesson = lessons.value.find(l => l.id === lessonId);
  if (lesson) {
    playVideo(lesson);
  }
}

function clearGuestData() {
  learningStore.clearGuestData();
  phonesearch.value = "254";
  // Refresh the page to update UI
  if (learningStore.selectedArea) {
    loadLessonsForArea(learningStore.selectedArea.id);
  }
}

function goBackToSubjects() {
  // Clear area selection and go back to subjects
  learningStore.clearSelectionFrom('area');
  router.push({ name: 'guestlessons' });
}
</script>

<style scoped>
.welcome-section {
  background: linear-gradient(to right, #f8f9fa, #ffffff);
  border-radius: 0 0 16px 16px;
}

.back-button {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.verification-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.payment-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.lesson-table {
  border-radius: 12px;
  overflow: hidden;
}

.lesson-row:hover {
  background-color: #f5f5f5;
}

.q-table__top {
  background-color: #f5f5f5;
}

.lesson-card {
  border-radius: 12px;
  transition: transform 0.2s;
}

.lesson-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Mobile Responsive Styles */
@media (max-width: 600px) {
  .welcome-section .text-h4 {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }

  .welcome-section .text-subtitle1 {
    font-size: 0.9rem;
  }

  .full-width-mobile {
    width: 100%;
    margin-top: 12px;
  }

  .back-button {
    justify-content: center;
  }

  .lesson-card {
    margin-bottom: 16px;
  }

  .verification-card,
  .payment-card {
    margin-left: 8px;
    margin-right: 8px;
  }
}

@media (max-width: 400px) {
  .back-button .q-btn__content {
    padding: 0 8px;
  }

  .text-h5 {
    font-size: 1.1rem;
  }
}
</style>
