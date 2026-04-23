<template>
  <q-page class="main-page q-pa-lg">
    <section class="page-section">
      <div class="container-fluid">
        <!-- Phone Verification


         <phone-verification
          v-if="!guestStore.phone"
          title="Access Your Paid Lessons"
          @verified="fetchPurchasedTutorials"
        />
        -->




        <!-- Tutorial Selection -->
        <tutorial-filters @selected-grade="selectedGrade = $event" />

        <!-- Available Tutorials List -->
        <lesson-list
          v-if="selectedGrade"
          :grade-id="selectedGrade"
        />
      </div>
      <question-dialog
      v-model="showQuestion"
      :tutorial="selectedTutorial"
    />
    </section>

    <!-- Question Dialog -->

  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useGuestStore } from 'src/stores/guestStore';
import PhoneVerification from './PhoneVerification.vue';
import PurchasedTutorialsList from './PurchasedTutorialsList.vue';
import TutorialFilters from './TutorialFilters.vue';
import QuestionDialog from './QuestionDialog.vue';
import LessonList from "src/pages/scheduler/guestList.vue";
import { useQuasar } from 'quasar';
const $q = useQuasar();
const guestStore = useGuestStore();
const selectedGrade = ref(null);
const selectedTutorial = ref(null);
const showQuestion = ref(false);
const purchasedTutorials = ref([]);
const TutorialsQuestion=ref([])
const isLoading=ref(false)
onMounted(async () => {
  if (guestStore.phone) {
    await fetchPurchasedTutorials();
  }
});

async function fetchPurchasedTutorials() {
  try {
    isLoading.value = true;
    await guestStore.fetchPurchasedTutorials();
purchasedTutorials.value = guestStore.purchasedTutorials;
TutorialsQuestion.value=guestStore.questions
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to fetch purchased tutorials',
      caption: error.message
    });
  } finally {
    isLoading.value = false;
  }
}

function openQuestionDialog(tutorial) {
  selectedTutorial.value = tutorial;
  showQuestion.value = true;
}

function joinTutorial(tutorial) {
  openMeetPopup(tutorial.link);
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
function viewTutorial(tutorial) {
  selectedTutorial.value = tutorial;
  // Could use a reusable dialog component here if needed
  $q.dialog({
    title: tutorial.learning_area,
    message: `
      <div class="q-gutter-y-md">
        <div><strong>Grade:</strong> ${tutorial.grade}</div>
        <div><strong>Start Date:</strong> ${formatDate(tutorial.start_date)}</div>
        <div><strong>End Date:</strong> ${formatDate(tutorial.end_date)}</div>
        <div><strong>Status:</strong> <span class="text-${statusBadgeColor(tutorial.status)}">${tutorial.status}</span></div>
      </div>
    `,
    html: true,
    persistent: true
  });
}
</script>
