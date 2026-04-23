<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center">
        <q-avatar icon="info" color="primary" text-color="white" class="q-mr-sm" />
        <span class="text-h6">Continue Watching?</span>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="confirmation-details">
          <p class="text-weight-medium">This will use <span class="text-negative">1 lesson</span> from your balance.</p>

          <div class="balance-summary q-pa-sm bg-grey-2 rounded-borders">
            <div class="row justify-between">
              <span>Current balance:</span>
              <span class="text-weight-bold">{{ currentBalance }} lessons</span>
            </div>
            <div class="row justify-between">
              <span>After continuing:</span>
              <span class="text-weight-bold">{{ newBalance }} lessons</span>
            </div>
          </div>

          <p class="text-caption text-grey-7 q-mt-sm">
            Each viewing session has a time limit. Continuing will start a new session.
          </p>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          color="grey-7"
          v-close-popup
        />
        <q-btn
          label="Continue Watching"
          color="primary"
          @click="$emit('confirm')"
          icon="play_arrow"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  currentBalance: {
    type: Number,
    required: true
  },
  newBalance: {
    type: Number,
    required: true
  }
});

defineEmits(['update:modelValue', 'confirm']);
</script>

<style scoped>
.balance-summary {
  margin: 8px 0;
}

.confirmation-details {
  line-height: 1.6;
}
</style>
