<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="text-h6 text-positive text-center">
      Your Purchased Tutorials
    </q-card-section>
    <q-separator />
    <q-card-section>
      <q-table
        :rows="tutorials"
        :columns="columns"
        row-key="id"
        flat
        bordered
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="getStatusColor(props.row.status)">
              {{ props.row.status.toUpperCase() }}
            </q-badge>
          </q-td>
        </template>
        
        <template v-slot:body-cell-questions="props">
          <q-td :props="props">
            <q-badge 
              color="accent" 
              class="cursor-pointer"
              @click="showQuestionsForTutorial(props.row)"
            >
              {{ getQuestionCount(props.row.tutorial_id) }}
              <q-tooltip>Click to view questions</q-tooltip>
            </q-badge>
          </q-td>
        </template>

        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn 
              label="Post Question" 
              color="accent" 
              size="sm"
              @click.stop="$emit('post-question', props.row)"
            />
            <q-btn
              label="Join"
              color="positive"
              size="sm"
              @click="$emit('join-tutorial', props.row)"
              v-if="props.row.status === 'active'"
            />
            <q-btn
              label="View"
              color="info"
              size="sm"
              @click="$emit('view-tutorial', props.row)"
              v-else
            />
          </q-td>
        </template>
      </q-table>
    </q-card-section>

    <!-- Questions Dialog -->
    <q-dialog v-model="showQuestionsDialog" persistent>
      <q-card style="min-width: 600px; max-width: 800px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Questions for {{ selectedTutorial?.learning_area }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-none scroll" style="max-height: 60vh">
          <q-list bordered separator>
            <template v-if="filteredQuestions.length > 0">
              <q-item v-for="question in filteredQuestions" :key="question.id" class="q-pa-sm">
                <q-item-section>
                  <q-item-label class="text-weight-medium" v-html="question.text"></q-item-label>
                  <q-item-label caption class="row items-center">
                    <q-badge :color="getQuestionStatusColor(question.status)" class="q-mr-sm">
                      {{ question.status }}
                    </q-badge>
                    {{ formatDate(question.created_at) }}
                    <q-chip dense v-if="question.id" size="sm" class="q-ml-sm">
                      ID: {{ question.id }}
                    </q-chip>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
            
            <q-item v-else>
              <q-item-section class="text-grey text-center q-py-lg">
                <q-icon name="help_outline" size="md" class="q-mb-sm" />
                <div>No questions found for this tutorial</div>
                <div v-if="questions.length > 0" class="text-caption q-mt-sm">
                  ({{ questions.length }} questions exist for other tutorials)
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue';
import { utils } from 'src/utils';
import { useQuasar } from 'quasar';
const $q = useQuasar();
const props = defineProps({
  tutorials: { 
    type: Array, 
    required: true,
    default: () => []
  },
  questions: { 
    type: Array, 
    default: () => [] 
  }
});

const emit = defineEmits(['post-question', 'join-tutorial', 'view-tutorial']);

// State
const showQuestionsDialog = ref(false);
const selectedTutorial = ref(null);

// Computed
const filteredQuestions = computed(() => {
  if (!selectedTutorial.value) return [];
  return props.questions.filter(
    q => String(q.tutorial_id) === String(selectedTutorial.value.tutorial_id)
  );
});

const questionCountMap = computed(() => {
  const map = {};
  props.questions.forEach(q => {
    const tid = String(q.tutorial_id);
    map[tid] = (map[tid] || 0) + 1;
  });
  return map;
});

// Methods
function formatDate(date) {
  return utils.formatDate(date);
}

function getStatusColor(status) {
  switch(status) {
    case 'active': return 'positive';
    case 'upcoming': return 'info';
    case 'completed': return 'grey';
    default: return 'primary';
  }
}

function getQuestionStatusColor(status) {
  switch(status) {
    case 'answered': return 'positive';
    case 'unanswered': return 'orange';
    default: return 'info';
  }
}

function getQuestionCount(tutorialId) {
  return questionCountMap.value[String(tutorialId)] || 0;
}

function showQuestionsForTutorial(tutorial) {
  selectedTutorial.value = tutorial;
  console.log('Showing questions for:', {
    tutorial,
    questions: filteredQuestions.value
  });
  showQuestionsDialog.value = true;
}

const columns = [
  { 
    name: 'learning_area', 
    label: 'Subject', 
    field: 'learning_area', 
    align: 'left',
    sortable: true
  },
  { 
    name: 'grade', 
    label: 'Grade', 
    field: 'grade', 
    align: 'center',
    sortable: true
  },
  { 
    name: 'start_date', 
    label: 'Start Date', 
    field: row => formatDate(row.start_date), 
    align: 'center',
    sortable: true
  },
  { 
    name: 'end_date', 
    label: 'End Date', 
    field: row => formatDate(row.end_date), 
    align: 'center',
    sortable: true
  },
  { 
    name: 'status', 
    label: 'Status', 
    field: 'status', 
    align: 'center',
    sortable: true
  },
  { 
    name: 'questions', 
    label: 'Questions', 
    field: row => getQuestionCount(row.tutorial_id),
    align: 'center',
    sortable: true
  },
  { 
    name: 'transaction_date', 
    label: 'Purchased On', 
    field: row => formatDate(row.transaction_date), 
    align: 'center',
    sortable: true
  },
  { 
    name: 'actions', 
    label: 'Actions', 
    field: 'actions', 
    align: 'center'
  }
];
</script>

<style scoped>
.q-badge {
  font-size: 0.8em;
  padding: 4px 8px;
  min-width: 70px;
  justify-content: center;
}

.q-item__label {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>