<template>
    <q-page class="q-pa-md">
      <div class="text-h4 text-center q-mb-md">📚 Weekend/Holiday Tutorials</div>

      <q-card flat class="q-pa-md">
        <q-list separator>
          <q-item
            v-for="tutorial in tutorials"
            :key="tutorial.id"
            clickable
            v-ripple
            class="q-my-sm"
          >
            <q-item-section avatar>
              <q-icon name="school" color="primary" size="md" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-h6 text-primary">{{ tutorial.learning_area }}</q-item-label>
              <q-item-label caption class="row items-center q-gutter-sm">
                <span class="row items-center">
                  <q-icon name="grade" size="xs" /> Grade {{ tutorial.grade }}
                </span>
                <span class="row items-center">
                  <q-icon name="event" size="xs" />
                  {{ formatDate(tutorial.start_date) }} - {{ formatDate(tutorial.end_date) }}
                </span>
              </q-item-label>
              <q-item-label>
                <q-badge
                  :color="statusBadgeColor(tutorial.status)"
                  class="q-mt-xs"
                >
                  {{ tutorial.status?.toUpperCase() }}
                </q-badge>
              </q-item-label>
            </q-item-section>

            <q-item-section side class="row q-gutter-sm">
             <div class="row items-center align-center items-stretch">
                <q-btn
                label="Register"
                color="info"
                size="md"
                class="q-mr-sm"
                @click.stop="RegisterDetails(tutorial)"
              />

              <q-btn
                class="q-mr-sm"
                label="Post Question"
                color="secondary"
                :disable="!hasPurchasedTutorial(tutorial.id)"
                size="md"
                @click.stop="PostQuestionDetails(tutorial)"
              />

              <q-btn
              class="q-mr-sm"
                :label="tutorial.status === 'active' ? 'Join Class' : 'View'"
                :color="tutorial.status === 'active' ? 'positive' : 'primary'"
                size="md"
                :outline="tutorial.status !== 'active'"
                @click.stop="tutorial.status === 'active' ? joinClass(tutorial) : viewDetails(tutorial)"
              />
              </div>
              <MeetEmbed v-if="currentTutorialToJoin" :meeting-url="currentTutorialToJoin.link" />
            </q-item-section>
          </q-item>
        </q-list>

        <div class="row justify-center q-mt-md">
          <q-pagination
            v-model="pagination.page"
            :max="totalPages"
            :max-pages="6"
            direction-links
            boundary-links
            color="primary"
            @update:model-value="fetchTutorials"
          />
          <div class="q-ml-md row items-center">
            <span class="text-caption">Items per page:</span>
            <q-select
              v-model="pagination.rowsPerPage"
              :options="[5, 10, 15, 20, 25]"
              dense
              borderless
              options-dense
              style="min-width: 60px"
              @update:model-value="handleRowsPerPageChange"
            />
          </div>
        </div>
      </q-card>

      <question-dialog
        v-model="showQuestion"
        :tutorial="selectedTutorial"
      />

      <q-dialog v-model="showRegister">
        <q-card style="min-width: 500px">
          <q-bar class="bg-info text-white">
            <div>Register for {{ selectedTutorial?.learning_area }}</div>
            <q-space />
            <q-btn dense flat icon="close" v-close-popup />
          </q-bar>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              Access your {{ selectedTutorial?.learning_area }} {{ selectedTutorial?.grade }} Class for only Ksh {{ amount }}
            </div>
            <Register
              @updateFee="updateFee"
              :lessonId="selectedTutorial?.id"
              @paymentSuccess="paymentSuccess"
            />
          </q-card-section>
        </q-card>
      </q-dialog>

      <q-dialog v-model="viewDetailsDialog">
        <q-card style="width: 400px">
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">{{ selectedTutorial?.learning_area }}</div>
          </q-card-section>

          <q-card-section class="q-pa-md">
            <div class="q-mb-sm">
              <strong>Grade:</strong> {{ selectedTutorial?.grade }}
            </div>
            <div class="q-mb-sm">
              <strong>Subject:</strong> {{ selectedTutorial?.learning_area }}
            </div>
            <div class="q-mb-sm">
              <strong>Start Date:</strong> {{ formatDate(selectedTutorial?.start_date) }}
            </div>
            <div class="q-mb-sm">
              <strong>End Date:</strong> {{ formatDate(selectedTutorial?.end_date) }}
            </div>
            <div>
              <strong>Status:</strong>
              <q-badge :color="statusBadgeColor(selectedTutorial?.status)">
                {{ selectedTutorial?.status?.toUpperCase() }}
              </q-badge>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Close" color="primary" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

      </q-page>
  </template>

  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useQuasar } from 'quasar';
  import { ApiService } from 'src/services/api';
  import { utils } from 'src/utils';
  import { useGuestStore } from 'src/stores/guestStore';
  import QuestionDialog from 'src/components/QuestionDialog.vue';
  import PhoneVerificationDialog from 'src/components/PhoneVerification.vue';
  import Register from "src/pages/tutorialregister/register.vue";
  import MeetEmbed from 'src/components/MeetEmbed.vue';

  const $q = useQuasar();
  const guestStore = useGuestStore();
  const amount = ref(0);
  // State
  const tutorials = ref([]);
  const showRegister = ref(false);
  const showMobileDialog = ref(false);
  const selectedTutorial = ref(null);
  const currentTutorialToJoin = ref(null);
  const showQuestion = ref(false);
  // Pagination
  const pagination = ref({
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0
  });
  const viewDetailsDialog = ref(false);

  const props = defineProps({
    gradeId: Number // Grade ID to fetch specific tutorials
  });

  function updateFee(fee) {
    amount.value = fee;
  }
  // Computed
  const totalPages = computed(() => Math.ceil(pagination.value.rowsNumber / pagination.value.rowsPerPage));
  const purchasedTutorialIds = computed(() => {
    return guestStore.purchasedTutorials?.map(t => t.tutorial_id) || [];
  });

  function hasPurchasedTutorial(tutorialId) {
    return purchasedTutorialIds.value.includes(tutorialId);
  }

  const statusBadgeColor = (status) => {
    switch (status) {
      case 'active': return 'positive';
      case 'upcoming': return 'info';
      default: return 'negative';
    }
  };

  // Methods
  async function fetchTutorials() {
    try {
      if (!props.gradeId) return;

      $q.loading.show();
      const params = {
        page: pagination.value.page,
        per_page: pagination.value.rowsPerPage,
        grade_id: props.gradeId
      };

      const response = await ApiService.get('components_data/get_weekend_tutorials', { params });
      tutorials.value = response.data.data || response.data;
      pagination.value.rowsNumber = response.data.total || response.data.length;
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Failed to load tutorials',
        caption: error.message
      });
    } finally {
      $q.loading.hide();
    }
  }

  function handleRowsPerPageChange() {
    pagination.value.page = 1;
    fetchTutorials();
  }

  function formatDate(date) {
    return utils.humanDatetime(date);
  }

  function viewDetails(tutorial) {
    selectedTutorial.value = tutorial;
    viewDetailsDialog.value = true;
  }

  function joinClass(tutorial) {
    currentTutorialToJoin.value = tutorial;
    // In a real application, you might check if the user's phone is verified
    // before showing the mobile verification dialog.
    // For this example, we'll directly show it.
    showMobileDialog.value = true;
  }

  async function submitMobileAndJoin(phoneNumber) {
    // In a real application, you would send the phone number to your backend
    // for verification and potentially store it for the user.
    console.log('Phone number verified:', phoneNumber);
    showMobileDialog.value = false;
    if (currentTutorialToJoin.value?.link) {
      openMeetPopup(currentTutorialToJoin.value.link);
    } else {
      $q.notify({
        type: 'warning',
        message: 'Meeting link is not available for this tutorial.'
      });
    }
    currentTutorialToJoin.value = null; // Reset
  }

  function openMeetPopup(meetLink) {
    if (!meetLink) {
      $q.notify({
        type: 'negative',
        message: 'Meeting link is missing'
      });
      return;
    }

    window.open(
      meetLink,
      'Btc Online Class',
      'width=800,height=600,noopener,noreferrer'
    );
  }

  function RegisterDetails(tutorial) {
    selectedTutorial.value = tutorial;
    showRegister.value = true;
  }

  function PostQuestionDetails(tutorial) {
    selectedTutorial.value = tutorial;
    showQuestion.value = true;
  }

  async function paymentSuccess() {
    try {
      showRegister.value = false;
      // Refresh purchased tutorials list
      await guestStore.fetchPurchasedTutorials();

      // Check if the tutorial has started
      const now = new Date();
      const startDate = new Date(selectedTutorial.value.start_date);
      const hasStarted = now >= startDate;

      if (hasStarted) {
        // If tutorial has started, open the meeting
        if (selectedTutorial.value?.link) {
          openMeetPopup(selectedTutorial.value.link);
        } else {
          $q.notify({
            type: 'warning',
            message: 'Meeting link is not available for this tutorial.'
          });
        }
      } else {
        // If tutorial hasn't started yet, open question dialog
        showQuestion.value = true;

        // Optional: Show a notification explaining why
        $q.notify({
          type: 'info',
          message: 'Tutorial has not started yet',
          caption: 'You can post questions now, and join when the tutorial starts',
          timeout: 3000
        });
      }
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Error after payment',
        caption: error.message
      });
    }
  }

  // Lifecycle
  onMounted(fetchTutorials);
  watch(() => props.gradeId, fetchTutorials, { immediate: true });
  </script>

  <style scoped>
  .q-item {
    transition: all 0.3s ease;
  }
  .q-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  </style>
