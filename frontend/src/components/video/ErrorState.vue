<template>
  <div class="error-state q-pa-md bg-grey-3 text-center rounded-borders">
    <q-icon name="error_outline" size="xl" color="grey" class="q-mb-sm" />
    <div class="text-h6">{{ errorTitle }}</div>
    <p class="text-grey-7">{{ error }}</p>
    <div class="q-gutter-sm q-mt-md">
      <q-btn
        v-if="canRetry"
        label="Retry"
        color="primary"
        @click="$emit('retry')"
        icon="refresh"
      />
      <q-btn
        v-if="showPurchaseOption"
        label="Purchase Access"
        color="positive"
        @click="$emit('purchase')"
        icon="shopping_cart"
      />
      <q-btn
        label="Go Back"
        color="grey-7"
        @click="$emit('close')"
        flat
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  error: {
    type: String,
    required: true
  },
  errorTitle: {
    type: String,
    required: true
  },
  canRetry: {
    type: Boolean,
    required: true
  },
  showPurchaseOption: {
    type: Boolean,
    required: true
  }
});

defineEmits(['retry', 'purchase', 'close']);
</script>

<style scoped>
.error-state {
  margin: 20px 0;
  padding: 40px 20px;
}
</style>
