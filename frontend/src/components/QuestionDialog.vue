<template>
    <q-dialog
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      maximized
    >
      <q-card style="max-width: 1200px; width: 95vw; height: 90vh;">
        <q-bar class="bg-primary text-white">
          <div class="text-h5">Questions for {{ tutorial.learning_area }}</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-card-section class="scroll" style="height: calc(100% - 50px)">
          <add-questions-page
            ref="questionsAddPage"
            :show-header="false"
            :redirect="true"
            :page-data="{scheduler_id: tutorial?.tutorial_id}"
            is-sub-page
            style="height: 100%"
            @add-complete="$emit('update:modelValue', false)"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </template>

  <script setup>
  import AddQuestionsPage from "src/pages/questions/add.vue";

  defineProps({
    modelValue: Boolean,
    tutorial: Object
  });

  defineEmits(['update:modelValue']);
  </script>

  <style scoped>
  .q-card {
    border-radius: 8px;
    overflow: hidden;
  }

  .q-bar {
    padding: 12px 16px;
  }

  .q-card-section {
    padding: 0;
  }
  </style>
