<template>
  <div class="session-expired q-pa-sm bg-negative text-white">
    <q-icon name="error" class="q-mr-sm" />
    <div class="expired-message">
      <div class="text-weight-bold">Your viewing session has ended</div>
      <div class="expired-details">
        <template v-if="hasLessonBalance">
          You can continue watching, but this will use <strong>1 lesson</strong> from your balance.
        </template>
        <template v-else>
          You have no remaining lessons in your balance.
        </template>
      </div>
    </div>
    <q-btn
      v-if="hasLessonBalance"
      label="Continue Watching"
      @click="$emit('continue')"
      class="q-ml-md"
      size="sm"
      color="white"
      text-color="negative"
      icon="play_arrow"
    />
    <q-btn
      v-else
      label="Purchase More Lessons"
      @click="$emit('purchase')"
      class="q-ml-md"
      size="sm"
      color="white"
      text-color="negative"
      icon="shopping_cart"
    />
  </div>
</template>

<script setup>
defineProps({
  hasLessonBalance: {
    type: Boolean,
    required: true
  }
});

defineEmits(['continue', 'purchase']);
</script>

<style scoped>
.session-expired {
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}

.expired-message {
  flex: 1;
}

.expired-details {
  font-size: 0.9rem;
  margin-top: 4px;
}
</style>
