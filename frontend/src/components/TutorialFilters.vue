<template>
    <q-card flat bordered class="q-pa-md">
      <q-card-section class="text-h6 text-primary text-center">
        Available Tutorials
      </q-card-section>
      <q-separator />
      <div class="row q-col-gutter-md q-pa-md">
        <!-- Level Selection -->
        <div class="col-md-4 col-12">
          <q-card flat class="nice-shadow-6 q-pa-md">
            <q-card-section>
              <div class="text-bold text-primary">Select Learning Level</div>
              <api-data-source
                @loaded="(response) => (levelOptions = response)"
                api-path="components_data/levelid_option_list"
                v-slot="req"
              >
                <nice-select
                  :loading="req.loading"
                  v-model="selectedLevel"
                  emit-value
                  map-options
                  :options="levelOptions"
                  label="Select a Level"
                />
              </api-data-source>
            </q-card-section>
          </q-card>
        </div>
  
        <!-- Grade Selection -->
        <div class="col-md-4 col-12" v-if="selectedLevel">
          <q-card flat class="nice-shadow-6 q-pa-md">
            <q-card-section>
              <div class="text-bold text-primary">Select Grade</div>
              <api-data-source
                :api-path="`components_data/grades_by_level/${selectedLevel}`"
                @loaded="(response) => (gradeOptions = response)"
                v-slot="req"
              >
                <nice-select
                  :loading="req.loading"
                  v-model="selectedGrade"
                  emit-value
                  map-options
                  :options="gradeOptions"
                  label="Select a Grade"
                />
              </api-data-source>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-card>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  
  const selectedLevel = ref('');
  const selectedGrade = ref('');
  const levelOptions = ref([]);
  const gradeOptions = ref([]);
  
  const emit = defineEmits(['selected-grade']);
  
  watch(selectedGrade, (newValue) => {
    if (newValue) {
      emit('selected-grade', newValue);
    }
  });
  </script>